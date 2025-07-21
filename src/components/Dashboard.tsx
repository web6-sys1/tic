import React, { useState } from 'react'
import { TrendingUp, Plus, Settings, Search, Loader2, Upload, FileSpreadsheet, Save, X } from 'lucide-react'
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
  const [showImportModal, setShowImportModal] = useState(false)
  const [importedUrls, setImportedUrls] = useState<SavedUrl[]>([])
  const [autoSave, setAutoSave] = useState(true)
  const [importFile, setImportFile] = useState<File | null>(null)

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
      parseFile(file)
    }
  }

  const parseFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        let parsedData: any[][] = []

        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const text = data as string
          const lines = text.split('\n')
          parsedData = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')))
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Parse Excel
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        }

        // Convert to SavedUrl format (skip header row)
        const urls: SavedUrl[] = []
        for (let i = 1; i < parsedData.length; i++) {
          const row = parsedData[i]
          if (row && row.length >= 2 && row[0] && row[1]) {
            urls.push({
              id: `import-${Date.now()}-${i}`,
              name: row[0].toString().trim(),
              url: row[1].toString().trim(),
              selected: false
            })
          }
        }

        setImportedUrls(urls)

        // Auto-save if enabled
        if (autoSave) {
          handleSaveImportedUrls(urls)
        }
      } catch (error) {
        console.error('Error parsing file:', error)
        alert('Error parsing file. Please check the file format.')
      }
    }

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  const handleSaveImportedUrls = (urlsToSave: SavedUrl[] = importedUrls) => {
    // Filter out duplicates based on URL
    const existingUrls = savedUrls.map(url => url.url)
    const newUrls = urlsToSave.filter(url => !existingUrls.includes(url.url))
    
    setSavedUrls([...savedUrls, ...newUrls])
    setShowImportModal(false)
    setImportedUrls([])
    setImportFile(null)
    
    alert(`Successfully imported ${newUrls.length} URLs (${urlsToSave.length - newUrls.length} duplicates skipped)`)
  }

  const handleCancelImport = () => {
    setShowImportModal(false)
    setImportedUrls([])
    setImportFile(null)
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
                onClick={() => setShowManageUrls(!showManageUrls)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage URLs
              </button>
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import URLs
              </button>
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
                <div className="flex space-x-3">
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

          {/* Import URLs Modal */}
          {showImportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Import URLs from File</h3>
                  <button
                    onClick={handleCancelImport}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* File Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Excel (.xlsx, .xls) or CSV file
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Choose File
                      </label>
                      {importFile && (
                        <p className="mt-2 text-sm text-gray-600">
                          Selected: {importFile.name}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      File should have two columns: "URL Name" and "URL"
                    </p>
                  </div>

                  {/* Auto-save Toggle */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="auto-save"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="auto-save" className="text-sm font-medium text-gray-700">
                      Automatically save imported URLs
                    </label>
                  </div>

                  {/* Preview Section */}
                  {importedUrls.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        Preview ({importedUrls.length} URLs found)
                      </h4>
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">URL Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {importedUrls.map((url, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-900">{url.name}</td>
                                <td className="px-4 py-2 text-sm text-blue-600 break-all">{url.url}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {importedUrls.length > 0 && !autoSave && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleCancelImport}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveImportedUrls()}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save URLs
                      </button>
                    </div>
                  )}
                </div>
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