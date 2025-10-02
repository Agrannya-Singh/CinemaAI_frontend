import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { AuthContextType, AuthMode } from '@/types/auth'

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [authMode, setAuthMode] = useState('password') // 'password' or 'magic-link'
  const router = useRouter()
  const supabase = createClient()

  // Fetch user role from your database
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data?.role || 'user'
    } catch (error) {
      console.error('Error fetching user role:', error)
      return 'user'
    }
  }

  useEffect(() => {
    // Check active sessions and set the user
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          const role = await fetchUserRole(session.user.id)
          setUserRole(role)
          setUser(session.user)
        } else {
          setUser(null)
          setUserRole(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        toast.error('Failed to initialize authentication')
      } finally {
        setLoading(false)
      }
    }
    
    initializeAuth()

    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const role = await fetchUserRole(session.user.id)
          setUserRole(role)
          setUser(session.user)
          
          // Redirect after email confirmation
          if (event === 'SIGNED_IN' && window.location.pathname.includes('verify')) {
            router.push('/dashboard')
            toast.success('Email verified successfully!')
          }
        } else {
          setUser(null)
          setUserRole(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [router, supabase.auth])

  // Sign up with email and password
  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      toast.success('Verification email sent. Please check your inbox.')
      return data
      
      toast.success('Sign up successful! Please check your email for verification.')
      return { user: data.user, error: null }
    } catch (error) {
      toast.error(error.message || 'Failed to sign up')
      return { user: null, error }
    }
  }

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      toast.success('Successfully signed in!')
      return { user: data.user, error: null }
    } catch (error) {
      toast.error('Invalid login credentials')
      return { user: null, error }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
      toast.success('Successfully signed out')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  // Send magic link for passwordless login
  const sendMagicLink = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      
      toast.success('Magic link sent to your email')
      return { error: null }
    } catch (error) {
      toast.error(error.message || 'Failed to send magic link')
      return { error }
    }
  }

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      
      toast.success('Password reset link sent to your email')
      return { error: null }
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email')
      return { error }
    }
  }

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
      
      toast.success('Password updated successfully')
      return { error: null }
    } catch (error) {
      toast.error(error.message || 'Failed to update password')
      return { error }
    }
  }

  // Send email verification
  const sendVerificationEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error
      
      toast.success('Verification email sent')
      return { error: null }
    } catch (error) {
      toast.error(error.message || 'Failed to send verification email')
      return { error }
    }
  }

  const value = {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    sendVerificationEmail,
    sendMagicLink,
    authMode,
    setAuthMode,
    user,
    userRole,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
