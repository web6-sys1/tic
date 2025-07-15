import React from 'react'
import { PSIResult } from '../types/psi'

interface ScoreCardProps {
  result: PSIResult
  icon: React.ReactNode
}

export function ScoreCard({ result, icon }: ScoreCardProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500 bg-gray-100'
    if (score >= 0.9) return 'text-green-700 bg-green-100'
    if (score >= 0.5) return 'text-yellow-700 bg-yellow-100'
    return 'text-red-700 bg-red-100'
  }

  const getScoreText = (score: number | null) => {
    if (score === null) return 'N/A'
    return Math.round(score * 100).toString()
  }

  const score = result.score

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-blue-600">
            {icon}
          </div>
          <h3 className="font-semibold text-gray-900">{result.title}</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(score)}`}>
          {getScoreText(score)}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            score === null ? 'bg-gray-400' :
            score >= 0.9 ? 'bg-green-500' :
            score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: score ? `${score * 100}%` : '0%' }}
        />
      </div>
      
      <p className="text-sm text-gray-600 mt-2">{result.description}</p>
    </div>
  )
}