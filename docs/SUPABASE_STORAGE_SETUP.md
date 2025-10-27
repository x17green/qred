# Supabase Storage Setup Guide

## 📋 Overview

This guide walks you through setting up Supabase Storage for avatar uploads in the Qred application.

**Required for:** Avatar upload functionality in onboarding and profile management
**Estimated Time:** 5-10 minutes
**Prerequisites:** Supabase project with authentication enabled

## 🚀 Quick Setup

### Step 1: Access Supabase Dashboard

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your Qred project

### Step 2: Create Storage Bucket

1. In the left sidebar, click **Storage**
2. Click **Create a new bucket**
3. Enter the following details:
   - **Name:** `avatars`
   - **Public bucket:** ✅ **Enabled**
   - **File size limit:** `5242880` (5MB)
   - **Allowed MIME types:** `image/jpeg,image/png,image/webp`
4. Click **Create bucket**

### Step 3: Configure Bucket Policies (Optional)

The bucket is set to public, but you can add RLS policies for additional security:

1. Go to **Storage** > **Policies**
2. Click **New policy** for the `avatars` bucket
3. Use the following policy templates:

#### Allow Upload Policy
```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.uid()::text = (storage.foldername(name))[1]
    AND bucket_id = 'avatars'
  );
```

#### Allow View Policy
```sql
-- Allow everyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

#### Allow Update Policy
```sql
-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    auth.uid()::text = (storage.foldername(name))[1]
    AND bucket_id = 'avatars'
  );
```

#### Allow Delete Policy
```sql
-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    auth.uid()::text = (storage.foldername(name))[1]
    AND bucket_id = 'avatars'
  );
```

## 🧪 Testing the Setup

### Method 1: Using the Test Script
```bash
cd qred
npm run init:storage
```

### Method 2: Manual Testing via Dashboard

1. Go to **Storage** > **avatars** bucket
2. Click **Upload file**
3. Select a test image
4. Verify it appears in the bucket
5. Click on the file to get the public URL
6. Open the URL in a browser to confirm it's accessible

## 🔧 Configuration Details

### Bucket Configuration Summary

| Setting | Value | Description |
|---------|-------|-------------|
| **Name** | `avatars` | Bucket identifier used in the app |
| **Public** | `true` | Allows public access to uploaded images |
| **Size Limit** | `5MB` | Maximum file size per upload |
| **MIME Types** | `image/jpeg,image/png,image/webp` | Allowed image formats |
| **File Structure** | `{userId}/{timestamp}.{ext}` | How files are organized |

### File Organization

Files are stored with the following structure:
```
avatars/
├── user-id-1/
│   ├── 1640000000000.jpg
│   └── 1640000001000.png
├── user-id-2/
│   ├── 1640000002000.jpg
│   └── 1640000003000.webp
└── ...
```

This structure:
- ✅ Organizes files by user
- ✅ Prevents naming conflicts
- ✅ Enables easy cleanup
- ✅ Supports user-specific permissions

## 🔐 Security Considerations

### Public vs Private Buckets

**Current Setup: Public Bucket**
- ✅ Simple to implement
- ✅ Fast access (no auth required for viewing)
- ✅ Works with image caching
- ⚠️ URLs are publicly accessible (but hard to guess)

**Alternative: Private Bucket with Signed URLs**
- ✅ More secure (requires authentication to access)
- ❌ More complex implementation
- ❌ Requires signed URL generation for each image
- ❌ May impact performance

### File Access Control

Even with a public bucket, consider these security measures:

1. **File Naming**: Uses timestamps and UUIDs to make URLs hard to guess
2. **Size Limits**: 5MB limit prevents abuse
3. **MIME Type Restrictions**: Only allows image files
4. **User Isolation**: Files are organized by user ID
5. **Cleanup Policies**: Old files are automatically cleaned up

## 🚨 Troubleshooting

### Common Issues

#### 1. "Bucket not found" Error
**Symptoms:** App shows storage upload errors
**Cause:** Bucket wasn't created or has wrong name
**Solution:**
- Verify bucket exists in Supabase Dashboard
- Ensure bucket name is exactly `avatars`
- Check bucket is set to public

#### 2. "Permission denied" Error
**Symptoms:** Uploads fail with permission errors
**Cause:** Bucket policies are too restrictive
**Solution:**
- Ensure bucket is set to public
- Check RLS policies if any were added
- Verify user is authenticated

#### 3. "File too large" Error
**Symptoms:** Large images fail to upload
**Cause:** File exceeds 5MB limit
**Solution:**
- User should compress image or select smaller file
- App should validate file size before upload
- Consider increasing bucket size limit if needed

#### 4. "Invalid file type" Error
**Symptoms:** Non-image files fail to upload
**Cause:** MIME type restrictions
**Solution:**
- Ensure only JPG, PNG, WebP files are selected
- App validates file types before upload

### Debug Steps

1. **Check Bucket Exists**
   ```bash
   # Run the storage test script
   npm run init:storage
   ```

2. **Verify Environment Variables**
   ```bash
   # Check .env file contains:
   # EXPO_PUBLIC_SUPABASE_URL=your-project-url
   # EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Test Manual Upload**
   - Go to Supabase Dashboard > Storage > avatars
   - Try uploading a file manually
   - Check if it appears and is accessible via URL

4. **Check Network Connectivity**
   - Ensure device has internet connection
   - Try accessing Supabase URL directly in browser

## 📊 Monitoring & Maintenance

### Storage Usage Monitoring

1. **Dashboard Monitoring**
   - Go to **Storage** in Supabase Dashboard
   - Monitor storage usage and file counts
   - Set up alerts for storage limits

2. **Cleanup Policies**
   The app includes automatic cleanup:
   - Keeps only 3 most recent avatars per user
   - Runs cleanup when new avatars are uploaded
   - Prevents unlimited storage growth

3. **Usage Analytics**
   Consider tracking:
   - Upload success/failure rates
   - Average file sizes
   - Most common file types
   - Storage growth trends

### Performance Optimization

1. **CDN Integration**
   - Supabase Storage includes CDN by default
   - Images are served from global edge locations
   - No additional setup required

2. **Image Optimization**
   Consider future enhancements:
   - Client-side image compression
   - Multiple image sizes (thumbnails)
   - WebP format conversion
   - Lazy loading implementations

## 🎯 Success Criteria

Your storage setup is complete when:

- ✅ `avatars` bucket exists and is public
- ✅ Test script runs without errors
- ✅ Manual file upload works via dashboard
- ✅ Public URLs are accessible in browser
- ✅ App can upload images successfully
- ✅ Images display correctly in app

## 🔄 Next Steps

After completing this setup:

1. **Test the Onboarding Flow**
   - Create a new user account
   - Verify onboarding screen appears
   - Test avatar upload functionality

2. **Test Profile Management**
   - Go to existing user profile
   - Test avatar change functionality
   - Verify images display correctly

3. **Monitor Initial Usage**
   - Check storage dashboard after first uploads
   - Verify file organization structure
   - Monitor for any error patterns

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Review Supabase Storage documentation**
3. **Check app logs for specific error messages**
4. **Verify all environment variables are correctly set**

---

**Setup Status:** ⏳ **Manual Setup Required**

This storage configuration is essential for the avatar upload functionality. Once completed, users will be able to upload and manage their profile pictures seamlessly through the onboarding and profile management interfaces.
