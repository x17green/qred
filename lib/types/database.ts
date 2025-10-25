export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Debt: {
        Row: {
          id: string
          principalAmount: number
          interestRate: number
          calculatedInterest: number
          totalAmount: number
          outstandingBalance: number
          dueDate: string
          status: Database['public']['Enums']['DebtStatus']
          notes: string | null
          createdAt: string
          updatedAt: string
          paidAt: string | null
          lenderId: string
          debtorId: string | null
          debtorPhoneNumber: string
          isExternal: boolean
          externalLenderName: string | null
        }
        Insert: {
          id?: string
          principalAmount: number
          interestRate?: number
          calculatedInterest: number
          totalAmount: number
          outstandingBalance: number
          dueDate: string
          status?: Database['public']['Enums']['DebtStatus']
          notes?: string | null
          createdAt?: string
          updatedAt?: string
          paidAt?: string | null
          lenderId: string
          debtorId?: string | null
          debtorPhoneNumber: string
          isExternal?: boolean
          externalLenderName?: string | null
        }
        Update: {
          id?: string
          principalAmount?: number
          interestRate?: number
          calculatedInterest?: number
          totalAmount?: number
          outstandingBalance?: number
          dueDate?: string
          status?: Database['public']['Enums']['DebtStatus']
          notes?: string | null
          createdAt?: string
          updatedAt?: string
          paidAt?: string | null
          lenderId?: string
          debtorId?: string | null
          debtorPhoneNumber?: string
          isExternal?: boolean
          externalLenderName?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Debt_debtorId_fkey"
            columns: ["debtorId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Debt_lenderId_fkey"
            columns: ["lenderId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          }
        ]
      }
      Payment: {
        Row: {
          id: string
          amount: number
          debtId: string
          status: Database['public']['Enums']['PaymentStatus']
          reference: string
          gateway: string
          paidAt: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          amount: number
          debtId: string
          status?: Database['public']['Enums']['PaymentStatus']
          reference: string
          gateway: string
          paidAt: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          amount?: number
          debtId?: string
          status?: Database['public']['Enums']['PaymentStatus']
          reference?: string
          gateway?: string
          paidAt?: string
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Payment_debtId_fkey"
            columns: ["debtId"]
            isOneToOne: false
            referencedRelation: "Debt"
            referencedColumns: ["id"]
          }
        ]
      }
      User: {
        Row: {
          id: string
          email: string | null
          name: string
          phoneNumber: string | null
          avatarUrl: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          email?: string | null
          name: string
          phoneNumber?: string | null
          avatarUrl?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string
          phoneNumber?: string | null
          avatarUrl?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_debt_balance: {
        Args: {
          debt_id: string
          paid_amount: number
        }
        Returns: void
      }
      get_user_debt_summary: {
        Args: {
          user_id: string
        }
        Returns: {
          total_lending: number
          total_owing: number
          overdue_count: number
          pending_count: number
        }[]
      }
      calculate_debt_interest: {
        Args: {
          debt_id: string
        }
        Returns: number
      }
    }
    Enums: {
      DebtStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'DEFAULTED'
      PaymentStatus: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// Type aliases for easier use
export type UserRow = Tables<'User'>
export type UserInsert = TablesInsert<'User'>
export type UserUpdate = TablesUpdate<'User'>

export type DebtRow = Tables<'Debt'>
export type DebtInsert = TablesInsert<'Debt'>
export type DebtUpdate = TablesUpdate<'Debt'>

export type PaymentRow = Tables<'Payment'>
export type PaymentInsert = TablesInsert<'Payment'>
export type PaymentUpdate = TablesUpdate<'Payment'>

export type DebtStatus = Enums<'DebtStatus'>
export type PaymentStatus = Enums<'PaymentStatus'>

// Extended types with relationships
export type DebtWithRelations = DebtRow & {
  lender: UserRow
  debtor?: UserRow
  payments?: PaymentRow[]
}

export type PaymentWithDebt = PaymentRow & {
  debt: DebtRow
}

export type UserWithDebts = UserRow & {
  debtsAsLender: DebtRow[]
  debtsAsDebtor: DebtRow[]
}

// API request/response types
export type CreateDebtRequest = {
  debtorPhoneNumber: string
  principal: number
  interestRate: number
  dueDate: string
  notes?: string
  isExternal?: boolean
  externalLenderName?: string
}

export type UpdateDebtStatusRequest = {
  status: DebtStatus
}

export type InitializePaymentRequest = {
  debtId: string
  amount: number
  email: string
}

export type InitializePaymentResponse = {
  authorization_url: string
  access_code: string
  reference: string
}

export type DebtSummary = {
  total_lending: number
  total_owing: number
  overdue_count: number
  pending_count: number
}

// Supabase Auth types
export type AuthUser = {
  id: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
  app_metadata: {
    provider?: string
    providers?: string[]
  }
  user_metadata: {
    name?: string
    avatar_url?: string
    email?: string
    phone?: string
  }
}

export type AuthSession = {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: AuthUser
}
