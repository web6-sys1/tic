import React from 'react'
import { SignInForm } from './components/SignInForm'
import { PageSpeedApp } from './components/PageSpeedApp'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return <PageSpeedApp user={user} />
  }

  return (
    <SignInForm 
      onSuccess={(user) => {
        console.log('Sign in successful:', user)
      }}
      onError={(error) => {
        console.error('Sign in error:', error)
      }}
    />
  )
}

export default App