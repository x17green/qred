# Dual-Role Debt Management System Implementation

## Overview

This document describes the implementation of the dual-role debt management system in Qred, which provides a personalized user experience based on whether users primarily lend money or track debts they owe.

## Core Concept

The system implements **"View Modes," Not "Account Types"** - users are not locked into being only a lender or only a borrower. Their choice at onboarding simply sets their **default view** or **primary mode** of using the app. This is a UI/UX decision, not a rigid backend limitation.

## Architecture

### 1. Database Schema Changes

#### User Table Enhancements
```sql
ALTER TABLE "User" ADD COLUMN "defaultRole" user_role DEFAULT 'BORROWER';
ALTER TABLE "User" ADD COLUMN "hasCompletedRoleSelection" boolean DEFAULT false;

CREATE TYPE user_role AS ENUM ('LENDER', 'BORROWER');
```

#### Key Fields
- `defaultRole`: Enum (`LENDER` | `BORROWER`) - User's primary view preference
- `hasCompletedRoleSelection`: Boolean - Whether user has completed role selection flow

### 2. TypeScript Type Updates

#### Database Types
```typescript
export type UserRole = 'LENDER' | 'BORROWER';

interface UserRow {
  // ... existing fields
  defaultRole: UserRole;
  hasCompletedRoleSelection: boolean;
}
```

#### Navigation Types
```typescript
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  RoleSelection: undefined; // New screen
};
```

### 3. Authentication Flow Updates

#### Enhanced Auth State
```typescript
interface AuthState {
  // ... existing fields
  needsRoleSelection: boolean;
}
```

The auth store now tracks whether a user needs to complete role selection:
- Checks `user.hasCompletedRoleSelection`
- Sets `needsRoleSelection` flag accordingly
- Drives navigation to role selection screen when needed

### 4. User Journey Flow

```
Sign Up/Sign In → Profile Completion → Role Selection → Main App
                      (if needed)        (if needed)
```

1. **Authentication**: User signs up/in via existing flow
2. **Profile Completion**: Complete basic profile (name, avatar) - existing onboarding
3. **Role Selection**: NEW - Choose primary app usage mode
4. **Main App**: Role-based dashboard experience

## Implementation Details

### 1. Role Selection Screen (`RoleSelectionScreen.tsx`)

**Purpose**: Allow users to choose their primary usage mode

**Features**:
- Clean, visual interface with two clear options
- Lender option: "Manage My Lending"
- Borrower option: "Track My Debts"
- Descriptive text explaining each role
- Visual feedback for selection
- Skip option with default to Borrower mode

**Key Components**:
```typescript
interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ComponentType;
  isSelected: boolean;
  onSelect: (role: UserRole) => void;
}
```

### 2. Role-Based Dashboard (`RoleBasedDashboard.tsx`)

**Purpose**: Provide personalized dashboard experience based on user's default role

#### Lender Experience
- **Primary Focus**: Money owed to them
- **Main Metric**: "Total Owed to You"
- **Primary Action**: "Add New Loan"
- **Secondary Access**: Personal debts via secondary navigation
- **Visual Priority**: Lending debts are prominent, personal debts are secondary

#### Borrower Experience
- **Primary Focus**: Money they owe
- **Main Metric**: "Total You Owe"
- **Primary Action**: "Add a Debt I Owe"
- **Secondary Access**: Lending business via secondary navigation
- **Visual Priority**: Personal debts are prominent, lending is secondary

### 3. Navigation Updates (`AppNavigator.tsx`)

Enhanced navigation logic:
```typescript
const { isAuthenticated, needsOnboarding, needsRoleSelection } = useAuth();

// Navigation priority:
// 1. Not authenticated → Auth flow
// 2. Needs onboarding → Profile completion
// 3. Needs role selection → Role selection screen
// 4. Complete → Main app with role-based dashboard
```

### 4. UI Components

#### New Components Created
- `Heading` component with semantic HTML mapping
- `Icon` component with Lucide React Native integration
- `RoleOption` component for selection interface
- `SummaryCard` component for dashboard metrics
- `QuickAction` component for dashboard actions

## User Experience Benefits

### 1. Progressive Disclosure
- Shows users what's most relevant to them first
- Reduces cognitive load by organizing features by priority
- Advanced features accessible when needed

### 2. Personalization
- App feels tailored to individual user needs
- Primary actions are always relevant and prominent
- Smart defaults based on user's declared usage pattern

### 3. Flexibility
- Users can access all features regardless of selected role
- Mode switching available (future enhancement)
- No functionality is removed, only organized differently

### 4. Intuitive Flow
- Clear onboarding process guides users to optimal setup
- Visual cues help users understand their options
- Skip options available for users who want to explore first

## Technical Implementation Notes

### 1. Type Safety
- Strict TypeScript typing for all role-related functionality
- Proper enum usage for role values
- Type guards for role-based logic

### 2. Error Handling
- Graceful fallbacks if role data is missing
- Default to BORROWER mode for safety
- Comprehensive error messages for user guidance

### 3. Performance
- Efficient state management with Zustand
- Memoized calculations for dashboard metrics
- Optimized re-renders with proper dependency arrays

### 4. Database Operations
- Direct SQL operations via Supabase MCP
- Proper transaction handling for profile updates
- Efficient queries for role-based data fetching

## Future Enhancements

### 1. Dynamic Mode Switching
- Allow users to temporarily switch between Lender/Borrower views
- Settings option to change default role
- Session-based view preferences

### 2. Advanced Personalization
- Smart suggestions based on usage patterns
- Adaptive UI that learns from user behavior
- Role-specific feature recommendations

### 3. Analytics
- Track role selection patterns
- Monitor feature usage by role
- Optimize UI based on user behavior data

### 4. Enhanced Onboarding
- Interactive tutorials for each role
- Sample data for new users to explore features
- Progressive feature introduction

## Testing Considerations

### 1. Role Selection Flow
- Test both role options are selectable
- Verify proper navigation after selection
- Test skip functionality and defaults

### 2. Dashboard Rendering
- Verify correct dashboard for each role
- Test data loading and display
- Ensure proper fallbacks for empty states

### 3. State Management
- Test role persistence across app restarts
- Verify proper state updates on role changes
- Test concurrent auth state changes

### 4. Type Safety
- Ensure all role-related types compile correctly
- Test proper enum usage throughout app
- Verify database schema alignment with types

## Migration Strategy

### 1. Existing Users
- Default `hasCompletedRoleSelection` to `false` for existing users
- Show role selection screen on next app launch
- Graceful handling of missing role data

### 2. Database Migration
```sql
-- Add new columns with safe defaults
ALTER TABLE "User" ADD COLUMN "defaultRole" user_role DEFAULT 'BORROWER';
ALTER TABLE "User" ADD COLUMN "hasCompletedRoleSelection" boolean DEFAULT false;

-- Update existing users to need role selection
UPDATE "User" SET "hasCompletedRoleSelection" = false WHERE "hasCompletedRoleSelection" IS NULL;
```

### 3. Backward Compatibility
- Old dashboard remains functional as fallback
- Gradual rollout with feature flags possible
- Rollback strategy if issues arise

## Conclusion

The dual-role debt management system successfully transforms Qred from a generic debt tracking tool into a personalized financial management platform. By organizing features around user intent rather than forcing a one-size-fits-all interface, the app becomes more intuitive and valuable for both lenders and borrowers while maintaining full functionality for all users.

The implementation follows UI/UX best practices, maintains type safety, and provides a solid foundation for future enhancements while avoiding the boolean type errors that plagued previous attempts.
