import { analyzePage, AnalysisResult } from './psiApi'

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  try {
    const result = await analyzePage(url)
    return result
  } catch (error) {
    console.error('API Error:', error)
    throw new Error('Failed to analyze URL. Please check the URL and try again.')
  }
}

export async function analyzeMultipleUrls(urls: string[]): Promise<{ url: string; result: AnalysisResult | null; error?: string }[]> {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const result = await analyzeUrl(url)
        return { url, result }
      } catch (error) {
        return { url, result: null, error: (error as Error).message }
      }
    })
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        url: urls[index],
        result: null,
        error: result.reason?.message || 'Unknown error'
      }
    }
  })
}