import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginForm } from './components/LoginForm'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { Loader2, AlertCircle } from 'lucide-react'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Dashboard />
    </div>
  )
}

export default App