import React, { useState } from 'react'
import { TrendingUp, Plus, Settings, Search, Loader2, Upload } from 'lucide-react'
import { analyzeMultipleUrls } from '../services/apiService'
import { AnalysisResult } from '../services/psiApi'
import { ResultsTable } from './ResultsTable'
import * as XLSX from 'xlsx'

interface SavedUrl {
  id: string
  name: string
  url: string
  selected: boolean
}

export function Dashboard() {
  const [url, setUrl] = useState('')
  const [urls, setUrls] = useState<string[]>([])
  const [showManageUrls, setShowManageUrls] = useState(false)
  const [savedUrls, setSavedUrls] = useState<SavedUrl[]>([])
  const [newUrlName, setNewUrlName] = useState('')
  const [newUrlAddress, setNewUrlAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ url: string; result: AnalysisResult | null; error?: string }[]>([])

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
        console.log('API Response:', analysisResults) // Debug log to see the actual response
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
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Page Speed Insight</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Website URLs to Analyze</h2>
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
                <h3 className="text-lg font-medium text-gray-900">Saved URLs</h3>
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
                <h4 className="text-md font-medium text-gray-800 mb-3">Add New URL</h4>
                
                {/* Excel Import Section */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-1">Bulk Import from Excel</h5>
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
                placeholder="Enter website URL 1 (e.g., https://example.com)"
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

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={(urls.length === 0 && !url.trim()) || loading}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Analyze {url.trim() && !urls.includes(url.trim()) ? urls.length + 1 : urls.length} URL{(url.trim() && !urls.includes(url.trim()) ? urls.length + 1 : urls.length) !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
        
        <ResultsTable results={results} />
      </div>
    </div>
  )
}