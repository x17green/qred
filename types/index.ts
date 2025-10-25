// User types
export interface User {
  id: string;
  email?: string;
  name: string;
  phoneNumber: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Debt types
export type DebtStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'DEFAULTED';

export interface Debt {
  id: string;
  principalAmount: number;
  interestRate: number;
  calculatedInterest: number;
  totalAmount: number;
  outstandingBalance: number;
  dueDate: string;
  status: DebtStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;

  // Relationships
  lenderId: string;
  lender: User;
  debtorId?: string;
  debtor?: User;
  debtorPhoneNumber: string;

  // External debt fields
  isExternal: boolean;
  externalLenderName?: string;

  // Related data
  payments?: Payment[];
  notifications?: Notification[];
}

// Payment types
export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export interface Payment {
  id: string;
  amount: number;
  debtId: string;
  debt?: Debt;
  status: PaymentStatus;
  reference: string;
  gateway: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export type NotificationType =
  | 'DEBT_CREATED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'DUE_DATE_REMINDER'
  | 'DEBT_OVERDUE'
  | 'DEBT_PAID_OFF';

export interface Notification {
  id: string;
  userId: string;
  debtId?: string;
  debt?: Debt;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// API Request/Response types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface GoogleSignInRequest {
  googleToken: string;
}

export interface GoogleSignInResponse {
  message: string;
  email: string;
  name: string;
}

export interface SendOTPRequest {
  phoneNumber: string;
}

export interface SendOTPResponse {
  message: string;
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
  googleProfile?: {
    email: string;
    name: string;
  };
}

export interface CreateDebtRequest {
  debtorPhoneNumber: string;
  principal: number;
  interestRate: number;
  dueDate: string;
  notes?: string;
  isExternal?: boolean;
  externalLenderName?: string;
}

export interface UpdateDebtStatusRequest {
  status: DebtStatus;
}

export interface InitializePaymentRequest {
  debtId: string;
  amount: number;
  email: string;
}

export interface InitializePaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  OTP: {
    phoneNumber: string;
    email?: string;
    name?: string;
  };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Debts: undefined;
  Profile: undefined;
};

export type DebtStackParamList = {
  DebtsList: undefined;
  DebtDetail: {
    debtId: string;
  };
  AddDebt: undefined;
  EditDebt: {
    debtId: string;
  };
};

// Store types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  signOut: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface DebtState {
  lendingDebts: Debt[];
  owingDebts: Debt[];
  currentDebt: Debt | null;
  isLoading: boolean;
  error: string | null;
}

export interface DebtActions {
  setLendingDebts: (debts: Debt[]) => void;
  setOwingDebts: (debts: Debt[]) => void;
  setCurrentDebt: (debt: Debt | null) => void;
  addDebt: (debt: Debt) => void;
  updateDebt: (debt: Debt) => void;
  removeDebt: (debtId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Utility types
export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}

export interface FormFieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormFieldError[];
}

// Component prop types
export interface DebtCardProps {
  debt: Debt;
  onPress?: () => void;
  showActions?: boolean;
}

export interface SummaryCardProps {
  title: string;
  amount: number;
  count: number;
  variant?: 'lending' | 'owing';
}

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

// Form types
export interface CreateDebtForm {
  debtorPhoneNumber: string;
  principal: string;
  interestRate: string;
  dueDate: Date;
  notes: string;
  isExternal: boolean;
  externalLenderName: string;
}

export interface LoginForm {
  phoneNumber: string;
}

export interface OTPForm {
  otp: string;
}

// Constants
export const DEBT_STATUS_COLORS: Record<DebtStatus, string> = {
  PENDING: '#f59e0b',
  PAID: '#10b981',
  OVERDUE: '#ef4444',
  DEFAULTED: '#991b1b',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: '#f59e0b',
  SUCCESSFUL: '#10b981',
  FAILED: '#ef4444',
};
