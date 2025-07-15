import React from 'react'
import { AnalysisResult } from '../types/psi'
import { ScoreCard } from './ScoreCard'
import { MetricsGrid } from './MetricsGrid'
import { OpportunitiesPanel } from './OpportunitiesPanel'
import { Gauge, Eye, Shield, Search, ExternalLink, Calendar } from 'lucide-react'

interface ResultsPanelProps {
  result: AnalysisResult
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ExternalLink className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{formatTimestamp(result.timestamp)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm text-gray-600">Analyzed URL:</span>
          <a 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm break-all"
          >
            {result.url}
          </a>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard 
          result={result.performance} 
          icon={<Gauge className="w-6 h-6" />} 
        />
        <ScoreCard 
          result={result.accessibility} 
          icon={<Eye className="w-6 h-6" />} 
        />
        <ScoreCard 
          result={result.bestPractices} 
          icon={<Shield className="w-6 h-6" />} 
        />
        <ScoreCard 
          result={result.seo} 
          icon={<Search className="w-6 h-6" />} 
        />
      </div>

      {/* Metrics Grid */}
      <MetricsGrid metrics={result.metrics} />

      {/* Opportunities and Diagnostics */}
      <OpportunitiesPanel 
        opportunities={result.opportunities} 
        diagnostics={result.diagnostics} 
      />
    </div>
  )
}