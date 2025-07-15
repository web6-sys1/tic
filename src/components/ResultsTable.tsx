import React from 'react'
import { ApiResponse } from '../services/apiService'
import { ChevronDown, ChevronRight, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'

interface ResultsTableProps {
  results: { url: string; result: ApiResponse | null; error?: string }[]
}

interface JsonViewerProps {
  data: any
  level?: number
}

function JsonViewer({ data, level = 0 }: JsonViewerProps) {
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(new Set())

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedKeys)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedKeys(newExpanded)
  }

  const renderValue = (key: string, value: any, path: string) => {
    const isExpanded = expandedKeys.has(path)

    if (value === null) {
      return <span className="text-gray-500">null</span>
    }

    if (typeof value === 'boolean') {
      return <span className={value ? 'text-green-600' : 'text-red-600'}>{value.toString()}</span>
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600">{value}</span>
    }

    if (typeof value === 'string') {
      return <span className="text-green-700">"{value}"</span>
    }

    if (Array.isArray(value)) {
      return (
        <div>
          <button
            onClick={() => toggleExpanded(path)}
            className="flex items-center text-purple-600 hover:text-purple-800"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="ml-1">[{value.length} items]</span>
          </button>
          {isExpanded && (
            <div className="ml-6 mt-2 border-l-2 border-gray-200 pl-4">
              {value.map((item, index) => (
                <div key={index} className="mb-2">
                  <span className="text-gray-600 font-mono">[{index}]:</span>
                  <div className="ml-4">
                    {renderValue(`${index}`, item, `${path}.${index}`)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value)
      return (
        <div>
          <button
            onClick={() => toggleExpanded(path)}
            className="flex items-center text-purple-600 hover:text-purple-800"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="ml-1">{keys.length} keys</span>
          </button>
          {isExpanded && (
            <div className="ml-6 mt-2 border-l-2 border-gray-200 pl-4">
              {keys.map((objKey) => (
                <div key={objKey} className="mb-2">
                  <span className="text-blue-800 font-mono">"{objKey}":</span>
                  <div className="ml-4">
                    {renderValue(objKey, value[objKey], `${path}.${objKey}`)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return <span>{String(value)}</span>
  }

  return (
    <div className="font-mono text-sm">
      {typeof data === 'object' && data !== null ? (
        Object.keys(data).map((key) => (
          <div key={key} className="mb-3">
            <span className="text-blue-800 font-semibold">"{key}":</span>
            <div className="ml-4">
              {renderValue(key, data[key], key)}
            </div>
          </div>
        ))
      ) : (
        renderValue('root', data, 'root')
      )}
    </div>
  )
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set())

  const toggleRowExpanded = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  if (results.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Results</h2>
      
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result, index) => (
              <React.Fragment key={index}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ExternalLink className="w-4 h-4 text-gray-400 mr-2" />
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium break-all"
                      >
                        {result.url}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.error ? (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm">Error</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm">Success</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRowExpanded(index)}
                      className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                    >
                      {expandedRows.has(index) ? (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-4 h-4 mr-1" />
                          View Details
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                {expandedRows.has(index) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 bg-gray-50">
                      <div className="max-h-96 overflow-auto">
                        {result.error ? (
                          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                            <h4 className="font-semibold mb-2">Error Details:</h4>
                            <p>{result.error}</p>
                          </div>
                        ) : result.result ? (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold mb-4 text-gray-900">JSON Response:</h4>
                            <JsonViewer data={result.result} />
                          </div>
                        ) : (
                          <div className="text-gray-500 p-4">
                            No data available
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}