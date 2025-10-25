# Qred: Your credit, simplified

A modern debt management application built with React Native, Expo, and Supabase, designed to help users track and manage personal debts efficiently with a simplified, user-friendly approach.

## 📱 Features

- **Authentication**: Secure phone number + OTP authentication with Google Sign-In integration
- **Debt Management**: Create, track, and manage debts as both lender and borrower
- **Payment Integration**: Integrated payment processing with Paystack/Flutterwave
- **Real-time Updates**: Live debt status updates and notifications
- **Dashboard**: Comprehensive overview of lending and owing amounts
- **External Debts**: Track debts from external sources (banks, friends, etc.)
- **Mobile-First**: Optimized for mobile devices with responsive design

## 🛠 Tech Stack

### Frontend
- **React Native** with **Expo** (~54.0.20)
- **TypeScript** for type safety
- **NativeWind** for styling (Tailwind CSS for React Native)
- **Gluestack UI** for component library
- **React Navigation** for navigation
- **Zustand** for state management
- **TanStack Query** for data fetching and caching
- **React Hook Form** for form handling

### Backend (Supabase)
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Supabase managed database
- **Prisma** - Schema management and type generation
- **Supabase Auth** - Authentication with phone OTP and Google Sign-In
- **Row Level Security (RLS)** - Database-level security policies
- **Supabase Edge Functions** - Serverless functions for secure operations
- **Paystack/Flutterwave** - Payment processing via webhooks

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio & Android SDK (for Android development)

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qred
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Supabase configuration:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_PAYSTACK_TEST_KEY=your_paystack_test_key
   EXPO_PUBLIC_FLUTTERWAVE_TEST_KEY=your_flutterwave_test_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - **iOS**: `npm run ios`
   - **Android**: `npm run android`
   - **Web**: `npm run web`

## 📁 Project Structure

```
qred/
├── assets/                  # Static assets (fonts, images, icons)
├── components/              # All UI and screen components
│   ├── ui/                  # Gluestack UI base components
│   ├── core/                # App-specific component wrappers
│   ├── domain/              # Business logic components (DebtCard, etc.)
│   ├── layout/              # Layout and structure components
│   ├── navigation/          # Navigation setup
│   │   ├── AppNavigator.tsx # Root navigator
│   │   ├── AuthStack.tsx    # Authentication navigation
│   │   └── MainTabNavigator.tsx # Main app navigation
│   └── screens/             # Screen components
│       ├── auth/            # Authentication screens
│       ├── dashboard/       # Dashboard screens
│       ├── debts/           # Debt management screens
│       └── profile/         # Profile screens
├── lib/                     # Core application logic
│   ├── constants/           # App-wide constants
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Supabase integration layer
│   │   ├── supabase.ts      # Supabase client configuration
│   │   ├── authService.ts   # Supabase Auth service
│   │   └── debtService.ts   # Debt management with RLS
│   ├── store/               # State management (Zustand v5)
│   │   ├── authStore.ts     # Authentication state
│   │   └── debtStore.ts     # Debt management state
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── supabase/                # Supabase configuration
│   ├── functions/           # Edge Functions
│   └── migrations/          # Database migrations
├── docs/                    # Documentation
│   └── supabase-implementation.md # Supabase setup guide
└── App.tsx                  # Root component
```

## 🔧 Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## 🏗 Development Guidelines

### Commit Message Format

This project uses Conventional Commits with Commitlint. Format your commits as:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/updates
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add Google Sign-In integration
fix(debt): resolve payment calculation issue
docs: update README with setup instructions
```

### Code Style

- Use TypeScript for all new code
- Follow the existing code structure and naming conventions
- Use functional components with hooks
- Implement proper error handling
- Write meaningful commit messages
- Add comments for complex business logic

### Component Guidelines

1. **UI Components** (`components/ui/`): Pure, reusable components based on Gluestack UI
2. **Core Components** (`components/core/`): App-specific wrappers around UI components
3. **Domain Components** (`components/domain/`): Business logic components (DebtCard, etc.)
4. **Layout Components** (`components/layout/`): Page layout and structure components
5. **Screen Components** (`components/screens/`): Top-level screen components organized by feature
6. **Navigation Components** (`components/navigation/`): All navigation-related components

### Library Organization (`lib/`)

- **services/**: API communication and external integrations
- **store/**: Global state management with Zustand
- **hooks/**: Custom React hooks for shared logic
- **types/**: TypeScript type definitions and interfaces
- **constants/**: App-wide constants and configuration
- **utils/**: Helper functions and utilities

## 🔐 Environment Configuration

### Required Environment Variables

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Payment Gateways
EXPO_PUBLIC_PAYSTACK_TEST_KEY=pk_test_xxxxx
EXPO_PUBLIC_PAYSTACK_LIVE_KEY=pk_live_xxxxx
EXPO_PUBLIC_FLUTTERWAVE_TEST_KEY=FLWPUBK_TEST-xxxxx
EXPO_PUBLIC_FLUTTERWAVE_LIVE_KEY=FLWPUBK-xxxxx

# Optional: Analytics & Monitoring
EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## 🧪 Testing

The project includes setup for testing with Jest and React Native Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📱 Building for Production

### Android
```bash
# Build APK
expo build:android

# Build AAB (recommended for Play Store)
expo build:android --type app-bundle
```

### iOS
```bash
# Build for App Store
expo build:ios --type archive

# Build for development
expo build:ios --type simulator
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes following the development guidelines
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feat/amazing-feature`)
6. Open a Pull Request

## 📄 Supabase Integration

Qred uses Supabase as a Backend-as-a-Service platform, providing:

### Authentication
- **Phone OTP Authentication** - Secure SMS-based sign-in
- **Google OAuth Integration** - One-tap Google sign-in
- **Session Management** - Automatic token refresh and storage
- **User Profiles** - Custom user data linked to auth.users

### Database Operations (via Supabase Client)
- **Automatic API Generation** - REST endpoints from database schema
- **Row Level Security (RLS)** - Database-level permission enforcement
- **Real-time Subscriptions** - Live data updates
- **Type-safe Operations** - Generated TypeScript types

### Security Features
- **RLS Policies** - Users can only access their own debts
- **JWT-based Authentication** - Secure token-based auth
- **Automatic API Security** - No manual permission checking needed

### Edge Functions (Serverless)
- **Payment Webhooks** - Secure payment processing
- **Email Notifications** - Automated debt reminders
- **Data Aggregation** - Complex calculations server-side

For detailed Supabase setup, see [Supabase Implementation Guide](./docs/supabase-implementation.md).

## 🔧 TypeScript Path Configuration

The project uses TypeScript path mapping for clean imports:

```typescript
// Instead of: import { useAuth } from "../../../lib/store/authStore"
import { useAuth } from "@/store/authStore";

// Available path aliases:
// @/components/* - Component files
// @/lib/* - Library files
// @/store/* - State management
// @/services/* - API services
// @/types/* - Type definitions
// @/constants/* - Constants
// @/hooks/* - Custom hooks
// @/utils/* - Utility functions
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **iOS simulator not starting**
   ```bash
   npx expo run:ios --device
   ```

3. **Android build failures**
   ```bash
   cd android && ./gradlew clean && cd ..
   npx expo run:android
   ```

4. **TypeScript errors**
   ```bash
   npm run type-check
   ```

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review the troubleshooting section

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Roadmap

- [ ] Biometric authentication
- [ ] Dark mode support
- [ ] Offline mode with sync
- [ ] Advanced analytics and reporting
- [ ] Multi-currency support
- [ ] Recurring debt reminders
- [ ] Export data functionality
- [ ] Web dashboard
- [ ] Admin panel

---

**Qred: Your credit, simplified** - Built with ❤️ for modern debt management