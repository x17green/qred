import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export interface UploadAvatarRequest {
  userId: string;
  imageUri: string;
  fileName?: string;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
  publicUrl: string;
}

class StorageService {
  private static instance: StorageService;
  private readonly AVATAR_BUCKET = 'avatars';

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Upload avatar image
  async uploadAvatar(request: UploadAvatarRequest): Promise<UploadAvatarResponse> {
    try {
      const { userId, imageUri, fileName } = request;

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = fileName?.split('.').pop() || 'jpg';
      const filePath = `${userId}/${timestamp}.${fileExt}`;

      // Convert image URI to base64 (for React Native)
      let base64Data: string;

      if (imageUri.startsWith('data:')) {
        // Already base64 encoded
        base64Data = imageUri.split(',')[1];
      } else {
        // For React Native, we need to read the file
        const response = await fetch(imageUri);
        const blob = await response.blob();
        base64Data = await this.blobToBase64(blob);
      }

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64Data);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true, // Replace existing file
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.AVATAR_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return {
        avatarUrl: filePath,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      console.error('Storage Service: Upload avatar error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to upload avatar'
      );
    }
  }

  // Delete avatar image
  async deleteAvatar(avatarPath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .remove([avatarPath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Storage Service: Delete avatar error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete avatar'
      );
    }
  }

  // Get avatar public URL
  getAvatarUrl(avatarPath: string): string {
    const { data } = supabase.storage
      .from(this.AVATAR_BUCKET)
      .getPublicUrl(avatarPath);

    return data?.publicUrl || '';
  }

  // List user avatars
  async listUserAvatars(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .list(userId);

      if (error) {
        throw new Error(`List failed: ${error.message}`);
      }

      return data?.map(file => `${userId}/${file.name}`) || [];
    } catch (error) {
      console.error('Storage Service: List avatars error:', error);
      return [];
    }
  }

  // Validate image file
  validateImageFile(uri: string, maxSizeMB: number = 5): { isValid: boolean; error?: string } {
    try {
      // Check file extension
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      const extension = uri.split('.').pop()?.toLowerCase();

      if (!extension || !validExtensions.includes(extension)) {
        return {
          isValid: false,
          error: 'Invalid file type. Please select a JPG, PNG, or WebP image.',
        };
      }

      // Note: For React Native, file size validation would need to be done
      // after reading the file or through the image picker library
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid image file',
      };
    }
  }

  // Helper method to convert Blob to base64
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Initialize storage bucket (call this once during app setup)
  async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('Storage Service: Failed to list buckets:', listError);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.AVATAR_BUCKET);

      if (!bucketExists) {
        // Create bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket(this.AVATAR_BUCKET, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });

        if (createError) {
          console.error('Storage Service: Failed to create bucket:', createError);
        } else {
          console.log('Storage Service: Avatar bucket created successfully');
        }
      }
    } catch (error) {
      console.error('Storage Service: Initialize bucket error:', error);
    }
  }

  // Generate optimized image sizes (for future use)
  async generateThumbnail(originalPath: string): Promise<string> {
    // This would require server-side image processing
    // For now, return the original path
    // In production, you might use Supabase Edge Functions or another service
    return originalPath;
  }

  // Clean up old avatar files for a user (keep only the latest)
  async cleanupOldAvatars(userId: string, keepCount: number = 3): Promise<void> {
    try {
      const avatars = await this.listUserAvatars(userId);

      if (avatars.length > keepCount) {
        // Sort by filename (timestamp) and keep only the most recent
        const sortedAvatars = avatars.sort().reverse();
        const toDelete = sortedAvatars.slice(keepCount);

        const { error } = await supabase.storage
          .from(this.AVATAR_BUCKET)
          .remove(toDelete);

        if (error) {
          console.error('Storage Service: Cleanup error:', error);
        } else {
          console.log(`Storage Service: Cleaned up ${toDelete.length} old avatars`);
        }
      }
    } catch (error) {
      console.error('Storage Service: Cleanup old avatars error:', error);
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();
export default storageService;
