import React from 'react'
import { PSIAudit } from '../types/psi'
import { TrendingUp, AlertCircle } from 'lucide-react'

interface OpportunitiesPanelProps {
  opportunities: PSIAudit[]
  diagnostics: PSIAudit[]
}

export function OpportunitiesPanel({ opportunities, diagnostics }: OpportunitiesPanelProps) {
  const getImpactColor = (score: number | null) => {
    if (score === null) return 'text-gray-500'
    if (score >= 0.9) return 'text-green-600'
    if (score >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getImpactText = (score: number | null) => {
    if (score === null) return 'Unknown'
    if (score >= 0.9) return 'Low'
    if (score >= 0.5) return 'Medium'
    return 'High'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Opportunities */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Opportunities</h3>
        </div>
        
        <div className="space-y-4">
          {opportunities.length > 0 ? (
            opportunities.map((opportunity, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm flex-1">{opportunity.title}</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getImpactColor(opportunity.score)}`}>
                    {getImpactText(opportunity.score)} Impact
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                {opportunity.displayValue && (
                  <div className="text-sm font-medium text-green-600">
                    Potential savings: {opportunity.displayValue}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Great job! No major opportunities found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Diagnostics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Diagnostics</h3>
        </div>
        
        <div className="space-y-4">
          {diagnostics.length > 0 ? (
            diagnostics.map((diagnostic, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <h4 className="font-medium text-gray-900 text-sm mb-2">{diagnostic.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{diagnostic.description}</p>
                {diagnostic.displayValue && (
                  <div className="text-sm font-medium text-blue-600">
                    {diagnostic.displayValue}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No diagnostic information available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}