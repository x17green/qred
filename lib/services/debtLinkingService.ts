import { DebtRow } from '../types/database';
import { supabase } from './supabase';

export class DebtLinkingService {
  /**
   * Links existing debts to a user based on their phone number
   * This is called when a user signs up or updates their phone number
   */
  static async linkDebtsToUser(userId: string, phoneNumber: string): Promise<{
    linkedDebts: number;
    error?: string;
  }> {
    try {
      // First, validate inputs
      if (!userId || !phoneNumber) {
        throw new Error('User ID and phone number are required');
      }

      // Format phone number to ensure consistency
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      console.log(`DebtLinking: Attempting to link debts for user ${userId} with phone ${formattedPhone}`);

      // Find all debts where the debtorPhoneNumber matches and debtorId is null
      const { data: unlinkedDebts, error: findError } = await supabase
        .from('Debt')
        .select('id, debtorPhoneNumber, debtorName, lenderId, principalAmount')
        .eq('debtorPhoneNumber', formattedPhone)
        .is('debtorId', null);

      if (findError) {
        console.error('DebtLinking: Error finding unlinked debts:', findError);
        throw findError;
      }

      if (!unlinkedDebts || unlinkedDebts.length === 0) {
        console.log(`DebtLinking: No unlinked debts found for phone ${formattedPhone}`);
        return { linkedDebts: 0 };
      }

      console.log(`DebtLinking: Found ${unlinkedDebts.length} unlinked debts for phone ${formattedPhone}`);

      // Update all matching debts to link them to the user
      const { error: updateError, count } = await supabase
        .from('Debt')
        .update({
          debtorId: userId,
          updatedAt: new Date().toISOString()
        })
        .eq('debtorPhoneNumber', formattedPhone)
        .is('debtorId', null);

      if (updateError) {
        console.error('DebtLinking: Error updating debts:', updateError);
        throw updateError;
      }

      const linkedCount = count || 0;
      console.log(`DebtLinking: Successfully linked ${linkedCount} debts to user ${userId}`);

      // Log the linking activity for audit purposes
      await this.logLinkingActivity(userId, formattedPhone, linkedCount, unlinkedDebts);

      return { linkedDebts: linkedCount };

    } catch (error) {
      console.error('DebtLinking: Error in linkDebtsToUser:', error);
      return {
        linkedDebts: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Links debts when a new debt is created for an existing user
   * This is called when a lender creates a debt for someone already in the system
   */
  static async linkNewDebtToExistingUser(debtId: string, debtorPhoneNumber: string): Promise<{
    linked: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      const formattedPhone = this.formatPhoneNumber(debtorPhoneNumber);

      // Find user with this phone number
      const { data: user, error: userError } = await supabase
        .from('User')
        .select('id, name')
        .eq('phoneNumber', formattedPhone)
        .single();

      if (userError || !user) {
        // No user found with this phone number - this is normal
        console.log(`DebtLinking: No existing user found for phone ${formattedPhone}`);
        return { linked: false };
      }

      // Update the debt to link it to the found user
      const { error: updateError } = await supabase
        .from('Debt')
        .update({
          debtorId: user.id,
          updatedAt: new Date().toISOString()
        })
        .eq('id', debtId);

      if (updateError) {
        console.error('DebtLinking: Error linking new debt to user:', updateError);
        throw updateError;
      }

      console.log(`DebtLinking: Successfully linked debt ${debtId} to existing user ${user.id}`);

      return { linked: true, userId: user.id };

    } catch (error) {
      console.error('DebtLinking: Error in linkNewDebtToExistingUser:', error);
      return {
        linked: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Gets all debts for a user (both as lender and debtor)
   * This includes properly linked debts and external debts
   */
  static async getUserDebts(userId: string): Promise<{
    lendingDebts: DebtRow[];
    owingDebts: DebtRow[];
    error?: string;
  }> {
    try {
      // Get debts where user is the lender
      const { data: lendingDebts, error: lendingError } = await supabase
        .from('Debt')
        .select(`
          *,
          debtor:User!Debt_debtorId_fkey(id, name, email, phoneNumber, avatarUrl),
          payments:Payment(*)
        `)
        .eq('lenderId', userId)
        .order('createdAt', { ascending: false });

      if (lendingError) {
        console.error('DebtLinking: Error fetching lending debts:', lendingError);
        throw lendingError;
      }

      // Get debts where user is the debtor (including external debts)
      const { data: owingDebts, error: owingError } = await supabase
        .from('Debt')
        .select(`
          *,
          lender:User!Debt_lenderId_fkey(id, name, email, phoneNumber, avatarUrl),
          payments:Payment(*)
        `)
        .or(`debtorId.eq.${userId},and(isExternal.eq.true,lenderId.eq.${userId})`)
        .order('createdAt', { ascending: false });

      if (owingError) {
        console.error('DebtLinking: Error fetching owing debts:', owingError);
        throw owingError;
      }

      return {
        lendingDebts: lendingDebts || [],
        owingDebts: owingDebts || []
      };

    } catch (error) {
      console.error('DebtLinking: Error in getUserDebts:', error);
      return {
        lendingDebts: [],
        owingDebts: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Checks for and links any unlinked debts in the system
   * This can be run as a maintenance task
   */
  static async linkAllUnlinkedDebts(): Promise<{
    totalLinked: number;
    details: Array<{ userId: string; phoneNumber: string; linkedCount: number }>;
    error?: string;
  }> {
    try {
      // Get all users with phone numbers
      const { data: users, error: usersError } = await supabase
        .from('User')
        .select('id, phoneNumber')
        .not('phoneNumber', 'is', null);

      if (usersError) {
        throw usersError;
      }

      const linkingResults = [];
      let totalLinked = 0;

      // Process each user
      for (const user of users || []) {
        if (user.phoneNumber) {
          const result = await this.linkDebtsToUser(user.id, user.phoneNumber);

          if (result.linkedDebts > 0) {
            linkingResults.push({
              userId: user.id,
              phoneNumber: user.phoneNumber,
              linkedCount: result.linkedDebts
            });
            totalLinked += result.linkedDebts;
          }
        }
      }

      console.log(`DebtLinking: Bulk linking complete. Total linked: ${totalLinked}`);

      return {
        totalLinked,
        details: linkingResults
      };

    } catch (error) {
      console.error('DebtLinking: Error in linkAllUnlinkedDebts:', error);
      return {
        totalLinked: 0,
        details: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Formats phone number to ensure consistency
   * Handles various formats and normalizes to +234XXXXXXXXXX
   */
  private static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // Handle different formats
    if (cleaned.startsWith('+234')) {
      return cleaned;
    } else if (cleaned.startsWith('234')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return `+234${cleaned.substring(1)}`;
    } else if (cleaned.length === 10) {
      return `+234${cleaned}`;
    }

    // Return as-is if we can't determine the format
    return phoneNumber;
  }

  /**
   * Logs linking activity for audit and debugging
   */
  private static async logLinkingActivity(
    userId: string,
    phoneNumber: string,
    linkedCount: number,
    debts: any[]
  ): Promise<void> {
    try {
      const logData = {
        userId,
        phoneNumber,
        linkedCount,
        debtIds: debts.map(d => d.id),
        timestamp: new Date().toISOString(),
        totalAmount: debts.reduce((sum, d) => sum + parseFloat(d.principalAmount || '0'), 0)
      };

      console.log('DebtLinking: Linking activity logged:', logData);

      // You could store this in a logging table if needed
      // await supabase.from('DebtLinkingLog').insert(logData);

    } catch (error) {
      console.error('DebtLinking: Error logging activity:', error);
      // Don't throw here as this is just logging
    }
  }

  /**
   * Validates that a debt linking operation was successful
   */
  static async validateDebtLinking(debtId: string, expectedUserId: string): Promise<boolean> {
    try {
      const { data: debt, error } = await supabase
        .from('Debt')
        .select('debtorId, debtorPhoneNumber')
        .eq('id', debtId)
        .single();

      if (error || !debt) {
        return false;
      }

      return debt.debtorId === expectedUserId;

    } catch (error) {
      console.error('DebtLinking: Error validating debt linking:', error);
      return false;
    }
  }
}

export default DebtLinkingService;
