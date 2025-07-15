import React, { useState } from 'react'
import { Search, Globe, Loader2 } from 'lucide-react'

interface UrlInputProps {
  onAnalyze: (url: string, strategy: 'mobile' | 'desktop') => void
  loading: boolean
}

export function UrlInput({ onAnalyze, loading }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onAnalyze(url.trim(), strategy)
    }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Speed Insights</h1>
        <p className="text-gray-600">
          Analyze your website's performance and get actionable insights to improve user experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter website URL (e.g., example.com)"
              required
            />
          </div>
          {url && !isValidUrl(url) && (
            <p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Analysis Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="mobile"
                checked={strategy === 'mobile'}
                onChange={(e) => setStrategy(e.target.value as 'mobile' | 'desktop')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Mobile</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="desktop"
                checked={strategy === 'desktop'}
                onChange={(e) => setStrategy(e.target.value as 'mobile' | 'desktop')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Desktop</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim() || !isValidUrl(url)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Analyze Page
            </>
          )}
        </button>
      </form>
    </div>
  )
}