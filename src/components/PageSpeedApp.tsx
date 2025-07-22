import React, { useState } from 'react'
import { TrendingUp, Plus, Settings, Search, Loader2, Upload, Download, LogOut } from 'lucide-react'
import { analyzeMultipleUrls } from '../services/apiService'
import { AnalysisResult } from '../services/psiApi'
import { ResultsTable } from './ResultsTable'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

interface SavedUrl {
  id: string
  name: string
  url: string
  selected: boolean
}

interface PageSpeedAppProps {
  user: any
}

export function PageSpeedApp({ user }: PageSpeedAppProps) {
  const [url, setUrl] = useState('')
  const [urls, setUrls] = useState<string[]>([])
  const [showManageUrls, setShowManageUrls] = useState(false)
  const [savedUrls, setSavedUrls] = useState<SavedUrl[]>([])
  const [newUrlName, setNewUrlName] = useState('')
  const [newUrlAddress, setNewUrlAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ url: string; result: AnalysisResult | null; error?: string }[]>([])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

        // Skip header row and process data
        const importedUrls: SavedUrl[] = []
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (row && row.length >= 2 && row[0] && row[1]) {
            const urlName = row[0].toString().trim()
            const urlAddress = row[1].toString().trim()
            
            if (urlName && urlAddress) {
              importedUrls.push({
                id: `imported-${Date.now()}-${i}`,
                name: urlName,
                url: urlAddress,
                selected: false
              })
            }
          }
        }

        if (importedUrls.length > 0) {
          setSavedUrls(prev => [...prev, ...importedUrls])
          alert(`Successfully imported ${importedUrls.length} URLs`)
        } else {
          alert('No valid URLs found in the Excel file. Please ensure the file has "URL Name" in column A and "URL" in column B.')
        }
      } catch (error) {
        console.error('Error reading Excel file:', error)
        alert('Error reading Excel file. Please make sure it\'s a valid Excel file.')
      }
    }
    reader.readAsArrayBuffer(file)
    
    // Reset the input value so the same file can be selected again
    event.target.value = ''
  }

  const downloadTemplate = () => {
    const templateData = [
      ['URL Name', 'URL'],
      ['Example Website 1', 'https://example1.com'],
      ['Example Website 2', 'https://example2.com'],
      ['My Blog', 'https://myblog.com']
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'URL Template')
    
    XLSX.writeFile(workbook, 'url-import-template.xlsx')
  }

  const handleAddUrl = () => {
    if (url.trim() && !urls.includes(url.trim())) {
      setUrls([...urls, url.trim()])
      setUrl('')
    }
  }

  const handleAnalyze = async () => {
    // Add current URL to list if it exists and isn't already added
    const currentUrls = [...urls]
    if (url.trim() && !currentUrls.includes(url.trim())) {
      currentUrls.push(url.trim())
    }
    
    if (currentUrls.length > 0) {
      setLoading(true)
      setResults([])
      
      try {
        const analysisResults = await analyzeMultipleUrls(currentUrls)
        console.log('API Response:', analysisResults)
        setResults(analysisResults)
        
        // Update the URLs list and clear input
        setUrls(currentUrls)
        setUrl('')
      } catch (error) {
        console.error('Analysis failed:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddUrl()
    }
  }

  const handleSaveUrl = () => {
    if (newUrlName.trim() && newUrlAddress.trim()) {
      const newSavedUrl: SavedUrl = {
        id: Date.now().toString(),
        name: newUrlName.trim(),
        url: newUrlAddress.trim(),
        selected: false
      }
      setSavedUrls([...savedUrls, newSavedUrl])
      setNewUrlName('')
      setNewUrlAddress('')
    }
  }

  const handleSelectAll = () => {
    setSavedUrls(savedUrls.map(url => ({ ...url, selected: true })))
  }

  const handleDeselectAll = () => {
    setSavedUrls(savedUrls.map(url => ({ ...url, selected: false })))
  }

  const handleLoadSelected = () => {
    const selectedUrls = savedUrls.filter(url => url.selected).map(url => url.url)
    const newUrls = [...urls]
    selectedUrls.forEach(url => {
      if (!newUrls.includes(url)) {
        newUrls.push(url)
      }
    })
    setUrls(newUrls)
    setShowManageUrls(false)
  }

  const toggleUrlSelection = (id: string) => {
    setSavedUrls(savedUrls.map(url => 
      url.id === id ? { ...url, selected: !url.selected } : url
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Page Speed Insight</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Website Performance Analysis</h2>
            <p className="text-gray-600">Analyze your website's performance and get actionable insights</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Website URLs to Analyze</h3>
              <div className="flex space-x-3">
                <button 
                  onClick={handleAnalyze}
                  disabled={(urls.length === 0 && !url.trim()) || loading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analyze
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowManageUrls(!showManageUrls)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage URLs
                </button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="excel-import"
                  />
                  <button 
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Excel
                  </button>
                </div>
                <button 
                  onClick={handleAddUrl}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add URL
                </button>
              </div>
            </div>

            {/* Manage URLs Section */}
            {showManageUrls && (
              <div className="mb-8 p-6 bg-gray-50 rounded-xl border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Saved URLs</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={handleLoadSelected}
                      disabled={!savedUrls.some(url => url.selected)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Load Selected
                    </button>
                  </div>
                </div>

                {/* Add New URL Form */}
                <div className="mb-6">
                  <h5 className="text-md font-medium text-gray-800 mb-3">Add New URL</h5>
                  
                  {/* Excel Import Section */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h6 className="font-medium text-gray-800 mb-1">Bulk Import from Excel</h6>
                        <p className="text-sm text-gray-600">Upload an Excel file with URL names and URLs</p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={downloadTemplate}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Template
                        </button>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleImportExcel}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            id="excel-import-bulk"
                          />
                          <button 
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Import Excel
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">Excel Format:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Column A: URL Name (e.g., "My Website", "Company Blog")</li>
                        <li>Column B: URL (e.g., "https://example.com")</li>
                        <li>First row can be headers (will be skipped automatically)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex space-x-3 mb-4">
                    <input
                      type="text"
                      value={newUrlName}
                      onChange={(e) => setNewUrlName(e.target.value)}
                      placeholder="URL Name (e.g., My Website)"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={newUrlAddress}
                      onChange={(e) => setNewUrlAddress(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSaveUrl}
                      disabled={!newUrlName.trim() || !newUrlAddress.trim()}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Save URL
                    </button>
                  </div>
                </div>

                {/* Saved URLs List */}
                <div className="min-h-[100px] flex items-center justify-center">
                  {savedUrls.length > 0 ? (
                    <div className="w-full space-y-2">
                      {savedUrls.map((savedUrl) => (
                        <div key={savedUrl.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                          <input
                            type="checkbox"
                            checked={savedUrl.selected}
                            onChange={() => toggleUrlSelection(savedUrl.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{savedUrl.name}</div>
                            <div className="text-sm text-gray-500">{savedUrl.url}</div>
                          </div>
                          <button
                            onClick={() => setSavedUrls(savedUrls.filter(u => u.id !== savedUrl.id))}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No saved URLs yet. Add some above!</p>
                  )}
                </div>
              </div>
            )}

            {/* URL Input */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter website URL (e.g., https://example.com)"
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 text-lg"
                />
              </div>
            </div>

            {/* URL List */}
            {urls.length > 0 && (
              <div className="mb-6">
                <div className="space-y-2">
                  {urls.map((urlItem, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="text-gray-700">{urlItem}</span>
                      <button
                        onClick={() => setUrls(urls.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <ResultsTable results={results} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Page Speed Insight</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Analyze and optimize your website's performance with comprehensive speed insights and recommendations. 
                Get detailed metrics, identify bottlenecks, and improve your site's user experience.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    How to Use
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Performance Tips
                  </a>
                </li>
                <li>
                  <button 
                    onClick={downloadTemplate}
                    className="text-gray-600 hover:text-blue-600 transition-colors text-left"
                  >
                    Excel Template
                  </button>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Support Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Email: support@pagespeedinsight.com</p>
                <p>Help: help@pagespeedinsight.com</p>
                <p>Business: business@pagespeedinsight.com</p>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2025 Page Speed Insight. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}