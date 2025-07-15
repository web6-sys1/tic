import { PSIResponse, AnalysisResult } from '../types/psi'

const PSI_API_KEY = 'EkBgrHrYjL6HCZfA2aKpM1L6gKiOsxHErnaEGl3WeBdq7ZUW' // You'll need to replace this with your actual API key
const PSI_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export async function analyzePage(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<AnalysisResult> {
  const apiUrl = `${PSI_API_URL}?url=${encodeURIComponent(url)}&key=${PSI_API_KEY}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`
  
  try {
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    
    const data: PSIResponse = await response.json()
    
    return transformPSIResponse(data, url)
  } catch (error) {
    console.error('PSI API Error:', error)
    throw new Error('Failed to analyze page. Please check the URL and try again.')
  }
}

function transformPSIResponse(data: PSIResponse, url: string): AnalysisResult {
  const { lighthouseResult } = data
  const { categories, audits } = lighthouseResult
  
  // Extract core web vitals and metrics
  const metrics = {
    firstContentfulPaint: extractMetric(audits['first-contentful-paint']),
    largestContentfulPaint: extractMetric(audits['largest-contentful-paint']),
    firstInputDelay: extractMetric(audits['max-potential-fid']),
    cumulativeLayoutShift: extractMetric(audits['cumulative-layout-shift']),
    speedIndex: extractMetric(audits['speed-index']),
    totalBlockingTime: extractMetric(audits['total-blocking-time'])
  }
  
  // Extract opportunities (performance improvements)
  const opportunities = Object.values(audits)
    .filter(audit => audit.scoreDisplayMode === 'binary' && audit.score !== null && audit.score < 1)
    .slice(0, 10)
  
  // Extract diagnostics
  const diagnostics = Object.values(audits)
    .filter(audit => audit.scoreDisplayMode === 'informative' && audit.displayValue)
    .slice(0, 10)
  
  return {
    url,
    timestamp: data.analysisUTCTimestamp,
    performance: categories.performance,
    accessibility: categories.accessibility,
    bestPractices: categories['best-practices'],
    seo: categories.seo,
    metrics,
    opportunities,
    diagnostics
  }
}

function extractMetric(audit: any): any {
  if (!audit) return null
  
  return {
    id: audit.id,
    title: audit.title,
    description: audit.description,
    score: audit.score,
    displayValue: audit.displayValue,
    numericValue: audit.numericValue,
    numericUnit: audit.numericUnit || 'ms'
  }
}