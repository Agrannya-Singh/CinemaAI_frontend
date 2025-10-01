import SignUp from '@/components/auth/SignUp'

export const metadata = {
  title: 'Sign Up - CinemaAI',
  description: 'Create a new CinemaAI account',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SignUp />
    </div>
  )
}
