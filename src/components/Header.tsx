import React from 'react'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function Header() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  if (!user) return null

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">PSI Insight</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <User className="w-5 h-5" />
              <span className="text-sm">{user.email}</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}