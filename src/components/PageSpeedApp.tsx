import React from 'react'
import { Dashboard } from './Dashboard'
import { Footer } from './Footer'
import { User } from '../types/auth'

interface PageSpeedAppProps {
  user: User
}

export function PageSpeedApp({ user }: PageSpeedAppProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Dashboard />
      </div>
      <Footer />
    </div>
  )
}