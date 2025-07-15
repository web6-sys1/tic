export interface PSIMetric {
  id: string
  title: string
  description: string
  score: number | null
  displayValue: string | null
  numericValue: number | null
  numericUnit: string
}

export interface PSIAudit {
  id: string
  title: string
  description: string
  score: number | null
  scoreDisplayMode: string
  displayValue: string | null
  details?: any
}

export interface PSIResult {
  id: string
  title: string
  score: number | null
  description: string
  scoreDisplayMode: string
}

export interface PSIResponse {
  lighthouseResult: {
    categories: {
      performance: PSIResult
      accessibility: PSIResult
      'best-practices': PSIResult
      seo: PSIResult
    }
    audits: Record<string, PSIAudit>
  }
  analysisUTCTimestamp: string
}

export interface AnalysisResult {
  url: string
  timestamp: string
  performance: PSIResult
  accessibility: PSIResult
  bestPractices: PSIResult
  seo: PSIResult
  metrics: {
    firstContentfulPaint: PSIMetric
    largestContentfulPaint: PSIMetric
    firstInputDelay: PSIMetric
    cumulativeLayoutShift: PSIMetric
    speedIndex: PSIMetric
    totalBlockingTime: PSIMetric
  }
  opportunities: PSIAudit[]
  diagnostics: PSIAudit[]
}