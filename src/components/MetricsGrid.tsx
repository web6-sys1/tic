import React from 'react'
import { AnalysisResult } from '../types/psi'
import { Clock, Zap, MousePointer, BarChart3, Timer, Blocks } from 'lucide-react'

interface MetricsGridProps {
  metrics: AnalysisResult['metrics']
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const metricItems = [
    {
      key: 'firstContentfulPaint',
      icon: <Zap className="w-5 h-5" />,
      label: 'First Contentful Paint',
      metric: metrics.firstContentfulPaint
    },
    {
      key: 'largestContentfulPaint',
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Largest Contentful Paint',
      metric: metrics.largestContentfulPaint
    },
    {
      key: 'firstInputDelay',
      icon: <MousePointer className="w-5 h-5" />,
      label: 'First Input Delay',
      metric: metrics.firstInputDelay
    },
    {
      key: 'cumulativeLayoutShift',
      icon: <Blocks className="w-5 h-5" />,
      label: 'Cumulative Layout Shift',
      metric: metrics.cumulativeLayoutShift
    },
    {
      key: 'speedIndex',
      icon: <Timer className="w-5 h-5" />,
      label: 'Speed Index',
      metric: metrics.speedIndex
    },
    {
      key: 'totalBlockingTime',
      icon: <Clock className="w-5 h-5" />,
      label: 'Total Blocking Time',
      metric: metrics.totalBlockingTime
    }
  ]

  const getMetricColor = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return 'text-gray-600'
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.poor) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getThresholds = (key: string) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      firstContentfulPaint: { good: 1800, poor: 3000 },
      largestContentfulPaint: { good: 2500, poor: 4000 },
      firstInputDelay: { good: 100, poor: 300 },
      cumulativeLayoutShift: { good: 0.1, poor: 0.25 },
      speedIndex: { good: 3400, poor: 5800 },
      totalBlockingTime: { good: 200, poor: 600 }
    }
    return thresholds[key] || { good: 0, poor: 1000 }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Core Web Vitals & Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricItems.map(({ key, icon, label, metric }) => {
          const thresholds = getThresholds(key)
          const value = metric?.numericValue || null
          const displayValue = metric?.displayValue || 'N/A'
          
          return (
            <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center space-x-2 mb-2">
                <div className="text-blue-600">
                  {icon}
                </div>
                <h4 className="font-medium text-gray-900 text-sm">{label}</h4>
              </div>
              
              <div className={`text-2xl font-bold mb-1 ${getMetricColor(value, thresholds)}`}>
                {displayValue}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${
                    value === null ? 'bg-gray-400' :
                    value <= thresholds.good ? 'bg-green-500' :
                    value <= thresholds.poor ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: value ? `${Math.min((value / (thresholds.poor * 2)) * 100, 100)}%` : '0%' 
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}