const API_BASE_URL = 'https://browserless-production-4a68.up.railway.app'
const API_TOKEN = '1S6xR0cAp4XzJqBa356f2b441b66339e8c96b44a2823854b0'

export interface ApiResponse {
  [key: string]: any
}

export async function analyzeUrl(url: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw new Error('Failed to analyze URL. Please check the URL and try again.')
  }
}

export async function analyzeMultipleUrls(urls: string[]): Promise<{ url: string; result: ApiResponse | null; error?: string }[]> {
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