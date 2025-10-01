import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, userRole, loading: authLoading } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!authLoading && !loading && !user) {
      setRedirecting(true)
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`)
    } else if (requiredRole && userRole !== requiredRole && !authLoading) {
      setRedirecting(true)
      router.push('/unauthorized')
    }
  }, [user, loading, authLoading, userRole, requiredRole, router])

  if (loading || authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">
            {redirecting ? 'Redirecting...' : 'Loading your session...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will be handled by the useEffect redirect
  }

  return children
}
