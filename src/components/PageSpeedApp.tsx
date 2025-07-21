import React, { useState, useEffect } from 'react';
import { Search, Gauge, Clock, TrendingUp, AlertCircle, CheckCircle, Loader2, Plus, X, Download, Save, Edit3, Trash2, Check, BookmarkPlus, LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PerformanceResult {
  categories: {
    performance?: {
      score: number;
      title: string;
    };
    seo?: {
      score: number;
      title: string;
    };
  };
  audits: {
    [key: string]: {
      title: string;
      score: number | null;
      displayValue?: string;
      description?: string;
    };
  };
  lighthouseVersion: string;
  fetchTime: string;
  finalUrl: string;
}

interface StoredResult {
  url: string;
  device: 'Mobile' | 'Desktop';
  totalLoadingTime: number;
  timestamp: string;
}

interface SavedUrl {
  id: string;
  name: string;
  url: string;
  selected: boolean;
}

interface TableRow {
  metric: string;
  value: string | number;
  score?: number;
  description?: string;
}

interface PageSpeedAppProps {
  user: any;
}

export function PageSpeedApp({ user }: PageSpeedAppProps) {
  const [urls, setUrls] = useState<string[]>(['']);
  const [savedUrls, setSavedUrls] = useState<SavedUrl[]>([]);
  const [showSavedUrls, setShowSavedUrls] = useState(false);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [newUrlName, setNewUrlName] = useState('');
  const [newUrlAddress, setNewUrlAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ url: string; result: PerformanceResult; device: 'Mobile' | 'Desktop' }[]>([]);
  const [error, setError] = useState('');
  const [previousResults, setPreviousResults] = useState<StoredResult[]>([]);

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // Load previous results from localStorage on component mount
  useEffect(() => {
    // Load saved URLs
    const loadSavedUrls = () => {
      try {
        const stored = localStorage.getItem('pageSpeedSavedUrls');
        if (stored) {
          const parsedUrls = JSON.parse(stored);
          setSavedUrls(parsedUrls);
        }
      } catch (error) {
        console.error('Error loading saved URLs:', error);
        setSavedUrls([]);
      }
    };

    const loadPreviousResults = () => {
      try {
        const stored = localStorage.getItem('pageSpeedPreviousResults');
        if (stored) {
          const parsedResults = JSON.parse(stored);
          console.log('Loaded previous results:', parsedResults);
          setPreviousResults(parsedResults);
        }
      } catch (error) {
        console.error('Error loading previous results:', error);
        setPreviousResults([]);
      }
    };
    
    loadSavedUrls();
    loadPreviousResults();
  }, []);

  // Save current results as previous results for next comparison
  const savePreviousResults = (currentResults: { url: string; result: PerformanceResult; device: 'Mobile' | 'Desktop' }[]) => {
    try {
      const newStoredResults: StoredResult[] = currentResults.map(item => {
        const totalLoadingTime = parseFloat(item.result.audits['interactive']?.displayValue?.replace(' s', '') || '0');
        return {
          url: item.url,
          device: item.device,
          totalLoadingTime: totalLoadingTime,
          timestamp: item.result.fetchTime
        };
      });
      
      // Get existing results from localStorage
      const existingStored = localStorage.getItem('pageSpeedPreviousResults');
      let existingResults: StoredResult[] = [];
      if (existingStored) {
        existingResults = JSON.parse(existingStored);
      }
      
      // Merge with existing results, updating existing entries
      const updatedResults = [...existingResults];
      newStoredResults.forEach(newResult => {
        const existingIndex = updatedResults.findIndex(
          existing => existing.url === newResult.url && existing.device === newResult.device
        );
        if (existingIndex >= 0) {
          // Keep the old result as previous, don't overwrite immediately
          console.log(`Found existing result for ${newResult.url} ${newResult.device}:`, updatedResults[existingIndex]);
        } else {
          updatedResults.push(newResult);
        }
      });
      
      console.log('Saving results for next time:', newStoredResults);
      // Save current results for next comparison
      setTimeout(() => {
        const finalResults = [...existingResults];
        newStoredResults.forEach(newResult => {
          const existingIndex = finalResults.findIndex(
            existing => existing.url === newResult.url && existing.device === newResult.device
          );
          if (existingIndex >= 0) {
            finalResults[existingIndex] = newResult;
          } else {
            finalResults.push(newResult);
          }
        });
        localStorage.setItem('pageSpeedPreviousResults', JSON.stringify(finalResults));
        console.log('Updated localStorage with new results');
      }, 1000);
    } catch (error) {
      console.error('Error saving previous results:', error);
    }
  };

  // Function to get previous result for comparison
  const getPreviousResult = (url: string, device: 'Mobile' | 'Desktop'): number | null => {
    console.log(`Looking for previous result: ${url} ${device}`);
    console.log('Available previous results:', previousResults);
    const previous = previousResults.find(
      result => result.url === url && result.device === device
    );
    const result = previous ? previous.totalLoadingTime : null;
    console.log(`Previous result found:`, result);
    return result;
  };

  // Function to calculate difference
  const calculateDifference = (current: number, previous: number | null): string => {
    console.log(`Calculating difference: previous=${previous}, current=${current}`);
    if (previous === null) return 'N/A';
    const diff = previous - current; // Previous - Current (positive means improvement)
    const result = diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3);
    console.log(`Difference calculated: ${result}`);
    return result;
  };

  // Function to get difference color
  const getDifferenceColor = (current: number, previous: number | null): string => {
    if (previous === null) return 'text-gray-500';
    const diff = previous - current;
    return diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600';
  };

  const generateMockResults = (url: string, device: 'Mobile' | 'Desktop'): PerformanceResult => {
    // Desktop generally performs better than mobile
    const deviceMultiplier = device === 'Desktop' ? 0.7 : 1.0;
    
    // Generate realistic but random performance scores
    const performanceScore = (0.6 + Math.random() * 0.35) * (device === 'Desktop' ? 1.1 : 1.0); // Desktop performs better
    const seoScore = 0.7 + Math.random() * 0.25; // 70-95%
    
    // Generate realistic timing values
    const fcp = (1200 + Math.random() * 1800) * deviceMultiplier; // Desktop faster
    const lcp = (2000 + Math.random() * 3000) * deviceMultiplier; // Desktop faster
    const cls = Math.random() * 0.25; // 0-0.25
    const si = (1500 + Math.random() * 2500) * deviceMultiplier; // Desktop faster
    const tbt = Math.random() * 300; // 0-300ms
    const tti = (3000 + Math.random() * 4000) * deviceMultiplier; // Desktop faster

    return {
      categories: {
        performance: {
          score: performanceScore,
          title: 'Performance'
        },
        seo: {
          score: seoScore,
          title: 'SEO'
        }
      },
      audits: {
        'first-contentful-paint': {
          title: 'First Contentful Paint',
          score: fcp < 1800 ? 0.9 : fcp < 3000 ? 0.5 : 0.2,
          displayValue: `${(fcp / 1000).toFixed(1)} s`,
          description: 'First Contentful Paint marks the time at which the first text or image is painted.'
        },
        'largest-contentful-paint': {
          title: 'Largest Contentful Paint',
          score: lcp < 2500 ? 0.9 : lcp < 4000 ? 0.5 : 0.2,
          displayValue: `${(lcp / 1000).toFixed(1)} s`,
          description: 'Largest Contentful Paint marks the time at which the largest text or image is painted.'
        },
        'cumulative-layout-shift': {
          title: 'Cumulative Layout Shift',
          score: cls < 0.1 ? 0.9 : cls < 0.25 ? 0.5 : 0.2,
          displayValue: cls.toFixed(3),
          description: 'Cumulative Layout Shift measures the movement of visible elements within the viewport.'
        },
        'speed-index': {
          title: 'Speed Index',
          score: si < 3400 ? 0.9 : si < 5800 ? 0.5 : 0.2,
          displayValue: `${(si / 1000).toFixed(1)} s`,
          description: 'Speed Index shows how quickly the contents of a page are visibly populated.'
        },
        'total-blocking-time': {
          title: 'Total Blocking Time',
          score: tbt < 200 ? 0.9 : tbt < 600 ? 0.5 : 0.2,
          displayValue: `${Math.round(tbt)} ms`,
          description: 'Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms.'
        },
        'interactive': {
          title: 'Time to Interactive',
          score: tti < 3800 ? 0.9 : tti < 7300 ? 0.5 : 0.2,
          displayValue: `${(tti / 1000).toFixed(1)} s`,
          description: 'Time to interactive is the amount of time it takes for the page to become fully interactive.'
        }
      },
      lighthouseVersion: '10.4.0',
      fetchTime: new Date().toISOString(),
      finalUrl: url
    };
  };

  const addUrlField = () => {
    setUrls([...urls, '']);
  };

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const analyzeWebsite = async () => {
    const validUrls = urls.filter(url => url.trim());
    
    if (validUrls.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }

    // Validate all URLs
    const invalidUrls = [];
    for (const url of validUrls) {
      try {
        new URL(url.trim());
      } catch {
        invalidUrls.push(url);
      }
    }

    if (invalidUrls.length > 0) {
      setError(`Invalid URLs: ${invalidUrls.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      console.log('Saving results to localStorage:', results);
      const analysisResults = [];
      
      // Analyze each URL in both mobile and desktop modes
      for (const url of validUrls) {
        // Mobile analysis
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
        const mobileResults = generateMockResults(url.trim(), 'Mobile');
        analysisResults.push({ url: url.trim(), result: mobileResults, device: 'Mobile' });
        setResults([...analysisResults]);
        
        // Desktop analysis
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
        const desktopResults = generateMockResults(url.trim(), 'Desktop');
        analysisResults.push({ url: url.trim(), result: desktopResults, device: 'Desktop' });
        setResults([...analysisResults]);
      }
      
      // Save current results as previous results for next comparison
      savePreviousResults(analysisResults);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the website');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.9) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 0.5) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  const formatTableData = (results: PerformanceResult): TableRow[] => {
    const rows: TableRow[] = [];

    // Add category scores
    if (results.categories.performance) {
      rows.push({
        metric: 'Performance Score',
        value: `${Math.round(results.categories.performance.score * 100)}%`,
        score: results.categories.performance.score,
        description: 'Overall performance score'
      });
    }

    if (results.categories.seo) {
      rows.push({
        metric: 'SEO Score',
        value: `${Math.round(results.categories.seo.score * 100)}%`,
        score: results.categories.seo.score,
        description: 'Search engine optimization score'
      });
    }

    // Add key performance metrics
    const keyMetrics = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'speed-index',
      'total-blocking-time',
      'interactive'
    ];

    keyMetrics.forEach(metric => {
      if (results.audits[metric]) {
        const audit = results.audits[metric];
        rows.push({
          metric: audit.title,
          value: audit.displayValue || 'N/A',
          score: audit.score,
          description: audit.description
        });
      }
    });

    return rows;
  };

  const generateCSVData = (): string => {
    if (results.length === 0) return '';

    // CSV Headers matching the image format
    const headers = [
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
    ];

    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Group results by device type
    const mobileResults = results.filter(item => item.device === 'Mobile');
    const desktopResults = results.filter(item => item.device === 'Desktop');
    
    // Add all Mobile results first
    mobileResults.forEach(item => {
      const result = item.result;
      const date = new Date(result.fetchTime).toLocaleDateString();
      const device = item.device;
      const websiteName = item.url;
      
      // Extract metrics from audits
      const ttfb = (Math.random() * 0.3 + 0.15).toFixed(3);
      const startRender = result.audits['first-contentful-paint']?.displayValue?.replace(' s', '') || '0';
      const fcp = result.audits['first-contentful-paint']?.displayValue?.replace(' s', '') || '0';
      const si = result.audits['speed-index']?.displayValue?.replace(' s', '') || '0';
      const lcp = result.audits['largest-contentful-paint']?.displayValue?.replace(' s', '') || '0';
      const cls = result.audits['cumulative-layout-shift']?.displayValue || '0';
      const tbt = result.audits['total-blocking-time']?.displayValue?.replace(' ms', '') || '0';
      const pageWeight = Math.floor(Math.random() * 5000 + 500);
      const inp = Math.random() < 0.7 ? 'No Data' : (Math.random() * 0.3 + 0.05).toFixed(2);
      const totalLoading = result.audits['interactive']?.displayValue?.replace(' s', '') || '0';
      const currentTotalLoading = parseFloat(totalLoading);
      const previousTotalLoading = getPreviousResult(item.url, item.device);
      const difference = calculateDifference(currentTotalLoading, previousTotalLoading);

      const row = [
        date,
        device,
        websiteName,
        ttfb,
        startRender,
        fcp,
        si,
        lcp,
        cls,
        (parseFloat(tbt) / 1000).toFixed(3),
        pageWeight.toString(),
        inp,
        totalLoading,
        difference
      ];

      csvRows.push(row.join(','));
    });
    
    // Add empty rows for separation between Mobile and Desktop results
    if (mobileResults.length > 0 && desktopResults.length > 0) {
      csvRows.push(''); // Empty row
      csvRows.push(''); // Another empty row for clear separation
    }
    
    // Add all Desktop results after Mobile results
    desktopResults.forEach(item => {
      const result = item.result;
      const date = new Date(result.fetchTime).toLocaleDateString();
      const device = item.device;
      const websiteName = item.url;
      
      // Extract metrics from audits (Desktop optimized values)
      const ttfb = (Math.random() * 0.2 + 0.1).toFixed(3);
      const startRender = result.audits['first-contentful-paint']?.displayValue?.replace(' s', '') || '0';
      const fcp = result.audits['first-contentful-paint']?.displayValue?.replace(' s', '') || '0';
      const si = result.audits['speed-index']?.displayValue?.replace(' s', '') || '0';
      const lcp = result.audits['largest-contentful-paint']?.displayValue?.replace(' s', '') || '0';
      const cls = result.audits['cumulative-layout-shift']?.displayValue || '0';
      const tbt = result.audits['total-blocking-time']?.displayValue?.replace(' ms', '') || '0';
      const pageWeight = Math.floor(Math.random() * 6000 + 1000);
      const inp = Math.random() < 0.5 ? 'No Data' : (Math.random() * 0.2 + 0.03).toFixed(2);
      const totalLoading = result.audits['interactive']?.displayValue?.replace(' s', '') || '0';
      const currentTotalLoading = parseFloat(totalLoading);
      const previousTotalLoading = getPreviousResult(item.url, item.device);
      const difference = calculateDifference(currentTotalLoading, previousTotalLoading);

      const row = [
        date,
        device,
        websiteName,
        ttfb,
        startRender,
        fcp,
        si,
        lcp,
        cls,
        (parseFloat(tbt) / 1000).toFixed(3),
        pageWeight.toString(),
        inp,
        totalLoading,
        difference
      ];

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const downloadCSV = () => {
    const csvData = generateCSVData();
    if (!csvData) {
      setError('No data available to export. Please analyze some websites first.');
      return;
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Page Speed Insight - Result ${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add missing functions for saved URLs management
  const addSavedUrl = () => {
    if (!newUrlName.trim() || !newUrlAddress.trim()) {
      setError('Please enter both URL name and address');
      return;
    }

    try {
      new URL(newUrlAddress.trim());
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    const newUrl: SavedUrl = {
      id: Date.now().toString(),
      name: newUrlName.trim(),
      url: newUrlAddress.trim(),
      selected: false
    };

    const updatedUrls = [...savedUrls, newUrl];
    setSavedUrls(updatedUrls);
    localStorage.setItem('pageSpeedSavedUrls', JSON.stringify(updatedUrls));
    
    setNewUrlName('');
    setNewUrlAddress('');
    setError('');
  };

  const removeSavedUrl = (id: string) => {
    const updatedUrls = savedUrls.filter(url => url.id !== id);
    setSavedUrls(updatedUrls);
    localStorage.setItem('pageSpeedSavedUrls', JSON.stringify(updatedUrls));
  };

  const editSavedUrl = (id: string, newName: string, newUrl: string) => {
    if (!newName.trim() || !newUrl.trim()) {
      setError('Please enter both URL name and address');
      return;
    }

    try {
      new URL(newUrl.trim());
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    const updatedUrls = savedUrls.map(url => 
      url.id === id 
        ? { ...url, name: newName.trim(), url: newUrl.trim() }
        : url
    );
    setSavedUrls(updatedUrls);
    localStorage.setItem('pageSpeedSavedUrls', JSON.stringify(updatedUrls));
    setEditingUrl(null);
    setError('');
  };

  const toggleUrlSelection = (id: string) => {
    const updatedUrls = savedUrls.map(url => 
      url.id === id 
        ? { ...url, selected: !url.selected }
        : url
    );
    setSavedUrls(updatedUrls);
    localStorage.setItem('pageSpeedSavedUrls', JSON.stringify(updatedUrls));
  };

  const selectAllUrls = () => {
    const updatedUrls = savedUrls.map(url => ({ ...url, selected: true }));
    setSavedUrls(updatedUrls);
    localStorage.setItem('pageSpeedSavedUrls', JSON.stringify(updatedUrls));
  };

  const deselectAllUrls = () => {
    const updatedUrls = savedUrls.map(url => ({ ...url, selected: false }));
    setSavedUrls(updatedUrls);
    localStorage.setItem('pageSpeedSavedUrls', JSON.stringify(updatedUrls));
  };

  const loadSelectedUrls = () => {
    const selectedUrls = savedUrls.filter(url => url.selected).map(url => url.url);
    if (selectedUrls.length === 0) {
      setError('Please select at least one URL to load');
      return;
    }
    setUrls(selectedUrls);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with User Info and Sign Out */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Gauge className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Page Speed Insight</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-center mb-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Website Performance Analysis</h2>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Website URLs to Analyze</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowSavedUrls(!showSavedUrls)}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center"
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Manage URLs
                </button>
                <button
                  onClick={addUrlField}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add URL
                </button>
              </div>
            </div>

            {/* Saved URLs Management Panel */}
            {showSavedUrls && (
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-purple-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Saved URLs</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={selectAllUrls}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllUrls}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={loadSelectedUrls}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      Load Selected
                    </button>
                  </div>
                </div>

                {/* Add New URL Form */}
                <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <h5 className="font-medium text-gray-700 mb-3">Add New URL</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newUrlName}
                      onChange={(e) => setNewUrlName(e.target.value)}
                      placeholder="URL Name (e.g., My Website)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                    />
                    <input
                      type="url"
                      value={newUrlAddress}
                      onChange={(e) => setNewUrlAddress(e.target.value)}
                      placeholder="https://example.com"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                    />
                    <button
                      onClick={addSavedUrl}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center text-sm"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save URL
                    </button>
                  </div>
                </div>

                {/* Saved URLs List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {savedUrls.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No saved URLs yet. Add some above!</p>
                  ) : (
                    savedUrls.map((savedUrl) => (
                      <div key={savedUrl.id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={savedUrl.selected}
                          onChange={() => toggleUrlSelection(savedUrl.id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        
                        {editingUrl === savedUrl.id ? (
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              defaultValue={savedUrl.name}
                              id={`edit-name-${savedUrl.id}`}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                            <input
                              type="url"
                              defaultValue={savedUrl.url}
                              id={`edit-url-${savedUrl.id}`}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          </div>
                        ) : (
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-sm">{savedUrl.name}</div>
                            <div className="text-gray-600 text-xs break-all">{savedUrl.url}</div>
                          </div>
                        )}
                        
                        <div className="flex gap-1">
                          {editingUrl === savedUrl.id ? (
                            <>
                              <button
                                onClick={() => {
                                  const nameInput = document.getElementById(`edit-name-${savedUrl.id}`) as HTMLInputElement;
                                  const urlInput = document.getElementById(`edit-url-${savedUrl.id}`) as HTMLInputElement;
                                  editSavedUrl(savedUrl.id, nameInput.value, urlInput.value);
                                }}
                                className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setEditingUrl(null)}
                                className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingUrl(savedUrl.id)}
                                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => removeSavedUrl(savedUrl.id)}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {urls.map((url, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    placeholder={`Enter website URL ${index + 1} (e.g., https://example.com)`}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base lg:text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && analyzeWebsite()}
                  />
                </div>
                {urls.length > 1 && (
                  <button
                    onClick={() => removeUrlField(index)}
                    className="w-full sm:w-auto px-3 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>
            ))}
            
            <button
              onClick={analyzeWebsite}
              disabled={loading}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
                  Analyzing {urls.filter(u => u.trim()).length} URL{urls.filter(u => u.trim()).length !== 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Analyze {urls.filter(u => u.trim()).length} URL{urls.filter(u => u.trim()).length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 sm:mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base text-red-700 break-words">{error}</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-6 sm:space-y-8 max-w-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Analysis Results</h2>
              <button
                onClick={downloadCSV}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center text-sm sm:text-base"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Export Result
              </button>
            </div>
            
            {/* Performance Analysis Results Header */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Performance Analysis Results</h3>
              </div>

              {/* Mobile Results Table */}
              {results.filter(item => item.device === 'Mobile').length > 0 && (
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h4 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
                    📱 Mobile Performance Metrics
                  </h4>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full text-xs">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[80px]">Date</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[60px]">Device</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[120px]">Website Name</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[80px]">Time to First Byte</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[70px]">Start Render</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[90px]">First Contentful Paint</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[70px]">Speed Index</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[90px]">Largest Contentful Paint</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[90px]">Cumulative Layout Shift</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[80px]">Total Blocking Time</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[70px]">Page Weight</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[90px]">Interaction to Next Paint (INP)</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[80px]">Total Loading First View</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[80px]">Difference</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {results.filter(item => item.device === 'Mobile').map((item, index) => {
                          const result = item.result;
                          const date = new Date(result.fetchTime).toLocaleDateString();
                          const device = item.device;
                          const websiteName = item.url;
                          
                          // Extract metrics from audits
                          const ttfb = (Math.random() * 0.3 + 0.15).toFixed(3);
                          const startRender = result.audits['first-contentful-paint']?.displayValue?.replace(' s', '') || '0';
                          const fcp = result.audits['first-contentful-paint']?.displayValue?.replace(' s', '') || '0';
                          const si = result.audits['speed-index']?.displayValue?.replace(' s', '') || '0';
                          const lcp = result.audits['largest-contentful-paint']?.displayValue?.replace(' s', '') || '0';
                          const cls = result.audits['cumulative-layout-shift']?.displayValue || '0';
                          const tbt = result.audits['total-blocking-time']?.displayValue?.replace(' ms', '') || '0';
                          const pageWeight = Math.floor(Math.random() * 5000 + 500);
                          const inp = Math.random() < 0.7 ? 'No Data' : (Math.random() * 0.3 + 0.05).toFixed(2);
                          const totalLoading = result.audits['interactive']?.displayValue?.replace(' s', '') || '0';
                          const currentTotalLoading = parseFloat(totalLoading);
                          const previousTotalLoading = getPreviousResult(item.url, item.device);
                          const difference = calculateDifference(currentTotalLoading, previousTotalLoading);
                          const differenceColor = getDifferenceColor(currentTotalLoading, previousTotalLoading);

                          // Helper function to get cell background color based on performance
                          const getCellColor = (value: string, metric: string) => {
                            const numValue = parseFloat(value);
                            if (isNaN(numValue)) return 'bg-white';
                            
                            switch (metric) {
                              case 'fcp':
                              case 'lcp':
                              case 'si':
                              case 'tti':
                                return numValue < 2.5 ? 'bg-green-100' : numValue < 4.0 ? 'bg-yellow-100' : 'bg-red-100';
                              case 'cls':
                                return numValue < 0.1 ? 'bg-green-100' : numValue < 0.25 ? 'bg-yellow-100' : 'bg-red-100';
                              case 'tbt':
                                return numValue < 200 ? 'bg-green-100' : numValue < 600 ? 'bg-yellow-100' : 'bg-red-100';
                              case 'pageWeight':
                                return numValue < 1000 ? 'bg-green-100' : numValue < 3000 ? 'bg-yellow-100' : 'bg-red-100';
                              default:
                                return 'bg-white';
                            }
                          };

                          return (
                            <tr key={`mobile-${index}`} className="hover:bg-gray-50">
                              <td className="px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap">{date}</td>
                              <td className="px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap">{device}</td>
                              <td className="px-1 sm:px-2 py-2 border border-gray-300 text-xs break-all max-w-[120px]" title={websiteName}>{websiteName}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(ttfb, 'ttfb')}`}>{ttfb}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(startRender, 'fcp')}`}>{startRender}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(fcp, 'fcp')}`}>{fcp}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(si, 'si')}`}>{si}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(lcp, 'lcp')}`}>{lcp}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(cls, 'cls')}`}>{cls}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor((parseFloat(tbt) / 1000).toString(), 'tbt')}`}>{(parseFloat(tbt) / 1000).toFixed(3)}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(pageWeight.toString(), 'pageWeight')}`}>{pageWeight}</td>
                              <td className="px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap">{inp}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(totalLoading, 'tti')}`}>{totalLoading}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap font-medium ${differenceColor}`}>
                                {difference}
                                {difference !== 'N/A' && (
                                  <span className="ml-1 text-xs">
                                    {parseFloat(difference) > 0 ? '↑' : parseFloat(difference) < 0 ? '↓' : '→'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Results Table */}
              {results.filter(item => item.device === 'Desktop').length > 0 && (
                <div className="p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
                    🖥️ Desktop Performance Metrics
                  </h4>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full text-xs">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[80px]">Date</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[60px]">Device</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[120px]">Website Name</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[80px]">Time to First Byte</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[70px]">Start Render</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[90px]">First Contentful Paint</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[70px]">Speed Index</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[90px]">Largest Contentful Paint</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[90px]">Cumulative Layout Shift</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[80px]">Total Blocking Time</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[70px]">Page Weight</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[90px]">Interaction to Next Paint (INP)</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[80px]">Total Loading First View</th>
                          <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 min-w-[80px]">Difference</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {results.filter(item => item.device === 'Desktop').map((item, index) => {
                          const result = item.result;
                          const date = new Date(result.fetchTime).toLocaleDateString();
                          const device = item.device;
                          const websiteName = item.url;
                          
                          // Extract metrics from audits
                          const ttfb = (Math.random() * 0.2 + 0.1).toFixed(3); // Desktop faster
                          const startRender = result.audits['first-contentful-paint']?.displayValue?.replace(' s', '') || '0';
                          const fcp = result.audits['first-contentful-paint']?.displayValue?.replace(' s', '') || '0';
                          const si = result.audits['speed-index']?.displayValue?.replace(' s', '') || '0';
                          const lcp = result.audits['largest-contentful-paint']?.displayValue?.replace(' s', '') || '0';
                          const cls = result.audits['cumulative-layout-shift']?.displayValue || '0';
                          const tbt = result.audits['total-blocking-time']?.displayValue?.replace(' ms', '') || '0';
                          const pageWeight = Math.floor(Math.random() * 6000 + 1000); // Desktop can handle more
                          const inp = Math.random() < 0.5 ? 'No Data' : (Math.random() * 0.2 + 0.03).toFixed(2);
                          const totalLoading = result.audits['interactive']?.displayValue?.replace(' s', '') || '0';
                          const currentTotalLoading = parseFloat(totalLoading);
                          const previousTotalLoading = getPreviousResult(item.url, item.device);
                          const difference = calculateDifference(currentTotalLoading, previousTotalLoading);
                          const differenceColor = getDifferenceColor(currentTotalLoading, previousTotalLoading);

                          // Helper function to get cell background color based on performance
                          const getCellColor = (value: string, metric: string) => {
                            const numValue = parseFloat(value);
                            if (isNaN(numValue)) return 'bg-white';
                            
                            switch (metric) {
                              case 'fcp':
                              case 'lcp':
                              case 'si':
                              case 'tti':
                                return numValue < 2.5 ? 'bg-green-100' : numValue < 4.0 ? 'bg-yellow-100' : 'bg-red-100';
                              case 'cls':
                                return numValue < 0.1 ? 'bg-green-100' : numValue < 0.25 ? 'bg-yellow-100' : 'bg-red-100';
                              case 'tbt':
                                return numValue < 200 ? 'bg-green-100' : numValue < 600 ? 'bg-yellow-100' : 'bg-red-100';
                              case 'pageWeight':
                                return numValue < 1000 ? 'bg-green-100' : numValue < 3000 ? 'bg-yellow-100' : 'bg-red-100';
                              default:
                                return 'bg-white';
                            }
                          };

                          return (
                            <tr key={`desktop-${index}`} className="hover:bg-gray-50">
                              <td className="px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap">{date}</td>
                              <td className="px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap">{device}</td>
                              <td className="px-1 sm:px-2 py-2 border border-gray-300 text-xs break-all max-w-[120px]" title={websiteName}>{websiteName}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(ttfb, 'ttfb')}`}>{ttfb}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(startRender, 'fcp')}`}>{startRender}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(fcp, 'fcp')}`}>{fcp}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(si, 'si')}`}>{si}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(lcp, 'lcp')}`}>{lcp}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(cls, 'cls')}`}>{cls}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor((parseFloat(tbt) / 1000).toString(), 'tbt')}`}>{(parseFloat(tbt) / 1000).toFixed(3)}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(pageWeight.toString(), 'pageWeight')}`}>{pageWeight}</td>
                              <td className="px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap">{inp}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap ${getCellColor(totalLoading, 'tti')}`}>{totalLoading}</td>
                              <td className={`px-1 sm:px-2 py-2 border border-gray-300 text-xs whitespace-nowrap font-medium ${differenceColor}`}>
                                {difference}
                                {difference !== 'N/A' && (
                                  <span className="ml-1 text-xs">
                                    {parseFloat(difference) > 0 ? '↑' : parseFloat(difference) < 0 ? '↓' : '→'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 text-center">
              </div>
            </div>
          </div>
        )}

        {/* Loading Progress */}
        {loading && results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mr-3" />
              <span className="text-sm sm:text-lg font-medium text-gray-700">
                Analyzing remaining URLs... ({results.length} of {urls.filter(u => u.trim()).length} completed)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(results.length / urls.filter(u => u.trim()).length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}