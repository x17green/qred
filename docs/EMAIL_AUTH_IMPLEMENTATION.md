# Email Authentication Implementation Guide

This document describes the implementation of email authentication in the Qred (Debt Collector) application using Supabase Auth.

## Overview

The email authentication system allows users to:
- Sign up with email and password
- Sign in with email and password
- Reset their password via email
- Manage their authentication state through Zustand store

## Implementation Details

### 1. Auth Service Layer (`lib/services/authService.ts`)

The auth service provides the following email authentication methods:

#### `signUpWithEmail(request: EmailSignUpRequest)`
- Creates a new user account with email and password
- Validates email format and password strength
- Creates user profile in the database
- Handles email confirmation flow

```typescript
interface EmailSignUpRequest {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}
```

#### `signInWithEmail(request: EmailSignInRequest)`
- Authenticates user with email and password
- Creates user profile if it doesn't exist
- Returns user session and profile data

```typescript
interface EmailSignInRequest {
  email: string;
  password: string;
}
```

#### Validation Methods
- `validateEmail(email: string)`: Validates email format using regex
- `validatePassword(password: string)`: Ensures password is at least 8 characters

### 2. Auth Store (`lib/store/authStore.ts`)

The Zustand store provides actions for email authentication:

#### `signUpWithEmail(request: EmailSignUpRequest)`
- Calls auth service to create account
- Updates store state on success
- Handles loading and error states

#### `signInWithEmail(request: EmailSignInRequest)`
- Calls auth service to authenticate
- Updates store with user data and session
- Sets authentication state to true

### 3. Test Screen Integration (`components/screens/test/AuthTestScreen.tsx`)

The test screen includes email authentication testing with:
- Form inputs for name, email, and password
- Sign up and sign in buttons
- Real-time testing with feedback

## Configuration

### Environment Variables

Ensure these variables are set in your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Configuration

1. **Email Authentication**: Enabled by default in Supabase
2. **Email Confirmation**: Configure in Supabase Dashboard → Auth → Settings
3. **SMTP Provider**: Configure for production email sending

## Testing

### Automated Tests

Run the test scripts to verify functionality:

```bash
# Test Supabase connection
npm run test:supabase

# Test email authentication
npm run test:email-auth
```

### Manual Testing via Test Screen

1. Navigate to the Test screen in the app
2. Fill in the email authentication form:
   - Name: Test User
   - Email: valid email address
   - Password: minimum 8 characters
3. Test sign up and sign in functionality
4. Verify user state updates in the UI

### Test Results Expected

✅ **Email Validation**: Proper format validation  
✅ **Email Sign Up**: User creation with profile  
✅ **Email Sign In**: Authentication and session management  
✅ **Session Management**: Token handling and persistence  
✅ **User Profile**: Automatic profile creation  
✅ **Password Reset**: Email-based password reset  
✅ **Sign Out**: Proper session cleanup  

## Usage Examples

### Sign Up a New User

```typescript
import { useAuthActions } from '@/lib/store/authStore';

const { signUpWithEmail } = useAuthActions();

const handleSignUp = async () => {
  try {
    const response = await signUpWithEmail({
      email: 'user@example.com',
      password: 'securepassword123',
      name: 'John Doe',
      phoneNumber: '+2348012345678' // optional
    });
    
    if (response.requiresEmailConfirmation) {
      // Show email confirmation message
      console.log(response.message);
    }
  } catch (error) {
    console.error('Sign up failed:', error.message);
  }
};
```

### Sign In Existing User

```typescript
import { useAuthActions } from '@/lib/store/authStore';

const { signInWithEmail } = useAuthActions();

const handleSignIn = async () => {
  try {
    await signInWithEmail({
      email: 'user@example.com',
      password: 'securepassword123'
    });
    // User is now authenticated and store is updated
  } catch (error) {
    console.error('Sign in failed:', error.message);
  }
};
```

### Access Current User

```typescript
import { useAuth } from '@/lib/store/authStore';

const MyComponent = () => {
  const { user, authUser, isAuthenticated } = useAuth();
  
  if (isAuthenticated && user) {
    return (
      <Text>Welcome, {user.name}!</Text>
    );
  }
  
  return <Text>Please sign in</Text>;
};
```

## Security Considerations

### Password Security
- Minimum 8 character requirement
- Passwords are hashed using bcrypt by Supabase
- Never store passwords in plaintext

### Email Validation
- Client-side validation for immediate feedback
- Server-side validation by Supabase
- Email confirmation can be required (configurable)

### Session Management
- Automatic token refresh handled by Supabase client
- Secure storage using AsyncStorage
- Proper session cleanup on sign out

## Error Handling

Common error scenarios and handling:

### Sign Up Errors
- **User already exists**: Show appropriate message
- **Invalid email format**: Client-side validation prevents this
- **Weak password**: Client-side validation prevents this
- **Network errors**: Show retry option

### Sign In Errors
- **Invalid credentials**: Show error message
- **User not found**: Show sign up suggestion
- **Network errors**: Show retry option

### Session Errors
- **Expired token**: Automatic refresh or re-authentication
- **Invalid session**: Clear store and redirect to login

## Troubleshooting

### Common Issues

1. **"User already registered" error**
   - Normal for testing with same email
   - Use different email or sign in instead

2. **"Invalid email" error**
   - Check email format validation
   - Ensure SMTP is configured for password reset

3. **Network connection errors**
   - Verify environment variables
   - Check Supabase project status
   - Ensure API keys are correct

4. **Email confirmation not working**
   - Configure SMTP in Supabase Dashboard
   - Check email templates
   - Verify redirect URLs

### Debug Steps

1. Run connection test: `npm run test:supabase`
2. Run email auth test: `npm run test:email-auth`
3. Check console logs for detailed error messages
4. Verify Supabase Dashboard for user creation
5. Test with different email addresses

## Next Steps

### Production Considerations

1. **SMTP Configuration**: Set up custom SMTP provider
2. **Email Templates**: Customize signup/reset email templates
3. **Rate Limiting**: Configure appropriate limits
4. **Monitoring**: Set up auth event monitoring

### Feature Extensions

1. **Multi-Factor Authentication (MFA)**: Add TOTP support
2. **Social Login Integration**: Combine with Google OAuth
3. **Role-Based Access**: Implement user roles and permissions
4. **Account Management**: Add profile editing and account deletion

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Password-based Auth Guide](https://supabase.com/docs/guides/auth/passwords)
- [Auth UI Components](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [React Native Auth Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)