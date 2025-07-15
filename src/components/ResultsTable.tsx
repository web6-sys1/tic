import React from 'react'
import { ApiResponse } from '../services/apiService'
import { Download, Monitor, Smartphone, Calendar, Globe } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ResultsTableProps {
  results: { url: string; result: ApiResponse | null; error?: string }[]
}

interface PerformanceMetrics {
  date: string
  device: string
  websiteName: string
  timeToFirstByte: string
  startRender: string
  firstContentfulPaint: string
  speedIndex: string
  largestContentfulPaint: string
  cumulativeLayoutShift: string
  totalBlockingTime: string
  pageWeight: string
  interactionToNextPaint: string
  totalLoadingFirstView: string
  difference: string
}

export function ResultsTable({ results }: ResultsTableProps) {
  const extractMetrics = (result: ApiResponse, url: string): PerformanceMetrics[] => {
    const metrics: PerformanceMetrics[] = []
    const currentDate = new Date().toLocaleDateString()
    
    // Extract mobile metrics if available
    if (result.mobile) {
      metrics.push({
        date: currentDate,
        device: 'Mobile',
        websiteName: url,
        timeToFirstByte: result.mobile.timeToFirstByte || 'N/A',
        startRender: result.mobile.startRender || 'N/A',
        firstContentfulPaint: result.mobile.firstContentfulPaint || 'N/A',
        speedIndex: result.mobile.speedIndex || 'N/A',
        largestContentfulPaint: result.mobile.largestContentfulPaint || 'N/A',
        cumulativeLayoutShift: result.mobile.cumulativeLayoutShift || 'N/A',
        totalBlockingTime: result.mobile.totalBlockingTime || 'N/A',
        pageWeight: result.mobile.pageWeight || 'N/A',
        interactionToNextPaint: result.mobile.interactionToNextPaint || 'No Data',
        totalLoadingFirstView: result.mobile.totalLoadingFirstView || 'N/A',
        difference: 'N/A'
      })
    }
    
    // Extract desktop metrics if available
    if (result.desktop) {
      metrics.push({
        date: currentDate,
        device: 'Desktop',
        websiteName: url,
        timeToFirstByte: result.desktop.timeToFirstByte || 'N/A',
        startRender: result.desktop.startRender || 'N/A',
        firstContentfulPaint: result.desktop.firstContentfulPaint || 'N/A',
        speedIndex: result.desktop.speedIndex || 'N/A',
        largestContentfulPaint: result.desktop.largestContentfulPaint || 'N/A',
        cumulativeLayoutShift: result.desktop.cumulativeLayoutShift || 'N/A',
        totalBlockingTime: result.desktop.totalBlockingTime || 'N/A',
        pageWeight: result.desktop.pageWeight || 'N/A',
        interactionToNextPaint: result.desktop.interactionToNextPaint || 'No Data',
        totalLoadingFirstView: result.desktop.totalLoadingFirstView || 'N/A',
        difference: 'N/A'
      })
    }
    
    return metrics
  }

  const getAllMetrics = (): PerformanceMetrics[] => {
    const allMetrics: PerformanceMetrics[] = []
    
    results.forEach(result => {
      if (result.result && !result.error) {
        const metrics = extractMetrics(result.result, result.url)
        allMetrics.push(...metrics)
      }
    })
    
    return allMetrics
  }

  const exportToExcel = () => {
    const allMetrics = getAllMetrics()
    
    if (allMetrics.length === 0) {
      alert('No data available to export')
      return
    }

    // Create worksheet data with proper headers
    const worksheetData = [
      [
        'Date',
        'Device',
        'Website Name',
        'Time to First Byte',
        'Start Render',
        'First Contentful Paint',
        'Speed Index',
        'Largest Contentful Paint',
        'Cumulative Layout Shift',
        'Total Blocking Time',
        'Page Weight',
        'Interaction to Next Paint (INP)',
        'Total Loading First View',
        'Difference (Previous - Current)'
      ],
      ...allMetrics.map(metric => [
        metric.date,
        metric.device,
        metric.websiteName,
        metric.timeToFirstByte,
        metric.startRender,
        metric.firstContentfulPaint,
        metric.speedIndex,
        metric.largestContentfulPaint,
        metric.cumulativeLayoutShift,
        metric.totalBlockingTime,
        metric.pageWeight,
        metric.interactionToNextPaint,
        metric.totalLoadingFirstView,
        metric.difference
      ])
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance Analysis')
    
    // Generate filename with current date
    const filename = `performance-analysis-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  const getMetricColor = (value: string, thresholds: { good: number; poor: number }) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return 'bg-gray-100'
    
    if (numValue <= thresholds.good) return 'bg-green-100 text-green-800'
    if (numValue <= thresholds.poor) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getThresholds = (metric: string) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      timeToFirstByte: { good: 0.2, poor: 0.6 },
      startRender: { good: 1.5, poor: 3.0 },
      firstContentfulPaint: { good: 1.8, poor: 3.0 },
      speedIndex: { good: 3.4, poor: 5.8 },
      largestContentfulPaint: { good: 2.5, poor: 4.0 },
      cumulativeLayoutShift: { good: 0.1, poor: 0.25 },
      totalBlockingTime: { good: 0.2, poor: 0.6 }
    }
    return thresholds[metric] || { good: 1, poor: 3 }
  }

  if (results.length === 0) {
    return null
  }

  const allMetrics = getAllMetrics()
  const mobileMetrics = allMetrics.filter(m => m.device === 'Mobile')
  const desktopMetrics = allMetrics.filter(m => m.device === 'Desktop')

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
        {allMetrics.length > 0 && (
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Result
          </button>
        )}
      </div>

      {allMetrics.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No performance data available. Please run an analysis first.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Performance Analysis Results Header */}
          <div className="bg-blue-600 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Performance Analysis Results</h3>
          </div>

          {/* Mobile Performance Metrics */}
          {mobileMetrics.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <Smartphone className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Mobile Performance Metrics</h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Device</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Website Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Time to First Byte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Start Render</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">First Contentful Paint</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Speed Index</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Largest Contentful Paint</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Cumulative Layout Shift</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Total Blocking Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Page Weight</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Interaction to Next Paint (INP)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Total Loading First View</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mobileMetrics.map((metric, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 border-r">{metric.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r">{metric.device}</td>
                        <td className="px-4 py-3 text-sm text-blue-600 border-r break-all max-w-xs">{metric.websiteName}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.timeToFirstByte, getThresholds('timeToFirstByte'))}`}>{metric.timeToFirstByte}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.startRender, getThresholds('startRender'))}`}>{metric.startRender}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.firstContentfulPaint, getThresholds('firstContentfulPaint'))}`}>{metric.firstContentfulPaint}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.speedIndex, getThresholds('speedIndex'))}`}>{metric.speedIndex}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.largestContentfulPaint, getThresholds('largestContentfulPaint'))}`}>{metric.largestContentfulPaint}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.cumulativeLayoutShift, getThresholds('cumulativeLayoutShift'))}`}>{metric.cumulativeLayoutShift}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.totalBlockingTime, getThresholds('totalBlockingTime'))}`}>{metric.totalBlockingTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r">{metric.pageWeight}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r">{metric.interactionToNextPaint}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r">{metric.totalLoadingFirstView}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{metric.difference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Desktop Performance Metrics */}
          {desktopMetrics.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <Monitor className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Desktop Performance Metrics</h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Device</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Website Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Time to First Byte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Start Render</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">First Contentful Paint</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Speed Index</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Largest Contentful Paint</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Cumulative Layout Shift</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Total Blocking Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Page Weight</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Interaction to Next Paint (INP)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Total Loading First View</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {desktopMetrics.map((metric, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 border-r">{metric.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r">{metric.device}</td>
                        <td className="px-4 py-3 text-sm text-blue-600 border-r break-all max-w-xs">{metric.websiteName}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.timeToFirstByte, getThresholds('timeToFirstByte'))}`}>{metric.timeToFirstByte}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.startRender, getThresholds('startRender'))}`}>{metric.startRender}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.firstContentfulPaint, getThresholds('firstContentfulPaint'))}`}>{metric.firstContentfulPaint}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.speedIndex, getThresholds('speedIndex'))}`}>{metric.speedIndex}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.largestContentfulPaint, getThresholds('largestContentfulPaint'))}`}>{metric.largestContentfulPaint}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.cumulativeLayoutShift, getThresholds('cumulativeLayoutShift'))}`}>{metric.cumulativeLayoutShift}</td>
                        <td className={`px-4 py-3 text-sm border-r ${getMetricColor(metric.totalBlockingTime, getThresholds('totalBlockingTime'))}`}>{metric.totalBlockingTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r">{metric.pageWeight}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r">{metric.interactionToNextPaint}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r">{metric.totalLoadingFirstView}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{metric.difference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}