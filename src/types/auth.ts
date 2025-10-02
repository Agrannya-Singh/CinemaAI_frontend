import { User } from '@supabase/supabase-js';

export type AuthMode = 'password' | 'magic-link';

export interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  signUp: (email: string, password: string, fullName: string) => Promise<{ user: User | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  sendVerificationEmail: () => Promise<{ error: Error | null }>;
  sendMagicLink: (email: string) => Promise<{ error: Error | null }>;
}