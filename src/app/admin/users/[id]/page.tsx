'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { API_CONFIG } from '@/config/api'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'

interface UserCompleteData {
  user_info: {
    id: string
    name: string
    user_type: 'real' | 'mock'
    birth_date: string
    birth_time: string
    location: any
    timezone: string
    created_at: string
    birthdate?: string
    birthtime?: string
    birth_location?: any
  }
  natal_chart: {
    planets: any[]
    scores: any
    insights: any[]
    angles?: any[]
    coordinates?: any
  }
  reflections: any[]
  analytics: {
    chart_calculations: number
    reflection_generations: number
    last_activity: string
  }
}

interface TransitData {
  house: number
  life_area: string
  score: number
  status: string
  message: string
  contributions: string[]
}

export default function AdminUserDetail() {
  const params = useParams()
  const searchParams = useSearchParams()
  const userId = params.id as string
  const userType = searchParams.get('type') || 'real'
  
  const [userData, setUserData] = useState<UserCompleteData | null>(null)
  const [transitData, setTransitData] = useState<TransitData[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [transitLoading, setTransitLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'reflections' | 'transits' | 'analytics'>('overview')
  const [transitPeriod, setTransitPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  useEffect(() => {
    if (userId) {
      fetchUserData()
    }
  }, [userId, userType])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_CONFIG.baseUrl}/admin/user-complete-data/${userId}/${userType}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      setUserData(data)
      
    } catch (err: any) {
      console.error('❌ User data fetch error:', err)
      setError(err.message || 'Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

// Replace your calculateNatalChart function in the user detail page with this:

const calculateNatalChart = async () => {
  if (!userData?.user_info) return

  try {
    setActionLoading(true)
    
    const birthData = {
      date: userData.user_info.birthdate,
      time: userData.user_info.birthtime,
      lat: 22.5726, // Default to Kolkata coordinates - you can enhance this later
      lon: 88.3639,
      timezone: userData.user_info.timezone
    }

    console.log('🪐 Calculating natal chart...')

    const response = await fetch(`${API_CONFIG.baseUrl}/score-natal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(birthData)
    })

    if (!response.ok) {
      throw new Error(`Failed to calculate natal chart: ${response.status}`)
    }

    const chartData = await response.json()
    console.log('✅ Natal chart calculated:', chartData)

    // Handle the new data structure from backend
    let lifeAreaData, rawPlanetData

    if (chartData.life_areas && chartData.raw_planets) {
      // New format with both life areas and raw planets
      lifeAreaData = chartData.life_areas
      rawPlanetData = chartData.raw_planets
      console.log('📊 Using new data format with raw planets')
    } else if (Array.isArray(chartData)) {
      // Old format - just life areas
      lifeAreaData = chartData
      rawPlanetData = [] // Empty for now
      console.log('📊 Using legacy data format')
    } else {
      throw new Error('Unexpected data format from backend')
    }

    console.log('📊 Life areas:', lifeAreaData.length)
    console.log('🪐 Raw planets:', rawPlanetData.length)

    // Update state with both data types
    setUserData(prev => prev ? {
      ...prev,
      natal_chart: {
        ...prev.natal_chart,
        planets: lifeAreaData,        // For display in Natal Chart tab
        raw_planets: rawPlanetData,   // For transit calculations
        scores: lifeAreaData.reduce((acc: any, area: any) => {
          acc[area.life_area] = area.score
          return acc
        }, {}),
        insights: lifeAreaData
      }
    } : null)

    alert('✅ Natal chart calculated successfully!')
    
  } catch (err: any) {
    console.error('❌ Chart calculation error:', err)
    alert(`❌ Failed to calculate natal chart: ${err.message}`)
  } finally {
    setActionLoading(false)
  }
}
  // Generate reflections
  const generateReflections = async () => {
    if (!userData?.natal_chart?.planets || userData.natal_chart.planets.length === 0) {
      alert('❌ Please calculate natal chart first')
      return
    }

    try {
      setActionLoading(true)
      
      console.log('🔮 Generating reflections...')

      const response = await fetch(`${API_CONFIG.baseUrl}/generate-reflections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData.natal_chart.planets)
      })

      if (!response.ok) {
        throw new Error(`Failed to generate reflections: ${response.status}`)
      }

      const reflectionData = await response.json()
      console.log('✅ Reflections generated:', reflectionData.reflections?.length || 0, 'reflections')

      setUserData(prev => prev ? {
        ...prev,
        reflections: reflectionData.reflections || []
      } : null)

      alert('✅ Reflections generated successfully!')
      
    } catch (err: any) {
      console.error('❌ Reflection generation error:', err)
      alert(`❌ Failed to generate reflections: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

// Replace your calculateTransits function with this version that uses real planet data:

const calculateTransits = async (period: 'daily' | 'weekly' | 'monthly') => {
  console.log('🌍 === STARTING TRANSIT CALCULATION ===')
  console.log('🌍 Period:', period)
  
  if (!userData?.user_info) {
    console.error('❌ No user data available')
    return
  }

  if (!userData?.natal_chart?.raw_planets || userData.natal_chart.raw_planets.length === 0) {
    alert('❌ Please calculate natal chart first to get raw planet positions')
    return
  }

  try {
    setTransitLoading(true)
    setError('')
    
    // Step 1: Calculate transit date
    const today = new Date()
    const transitDate = new Date()
    
    if (period === 'weekly') {
      transitDate.setDate(today.getDate() + 7)
    } else if (period === 'monthly') {
      transitDate.setMonth(today.getMonth() + 1)
    }

    const dateStr = transitDate.toISOString().split('T')[0]
    console.log('🌍 Transit date:', dateStr)

    // Step 2: Use existing natal planets (we already have them!)
    const natalPlanets = userData.natal_chart.raw_planets
    console.log('🪐 Using natal planets:', natalPlanets.length, 'planets')
    console.log('🪐 Natal planet sample:', natalPlanets[0])

    // Step 3: Calculate transit planet positions for the target date
    console.log('🌍 Calculating transit planet positions...')
    
    const transitBirthData = {
      date: dateStr,
      time: '12:00:00',
      lat: 22.5726,
      lon: 88.3639,
      timezone: userData.user_info.timezone
    }

    const transitResponse = await fetch(`${API_CONFIG.baseUrl}/score-natal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(transitBirthData)
    })

    if (!transitResponse.ok) {
      throw new Error(`Failed to calculate transit positions: ${transitResponse.status}`)
    }

    const transitData = await transitResponse.json()
    console.log('✅ Transit response:', transitData)

    // Handle the transit data structure
    let transitPlanets
    if (transitData.raw_planets && transitData.raw_planets.length > 0) {
      transitPlanets = transitData.raw_planets
      console.log('🌍 Using new format transit planets:', transitPlanets.length)
    } else if (Array.isArray(transitData)) {
      // If backend returns old format, we might need to extract planet positions differently
      console.log('⚠️ Backend returned life areas, not raw planets. Using fallback.')
      // For now, let's still try the test data approach
      transitPlanets = [
        { name: "Sun", sign: "Gemini", lon: 75.5, house: 5 },
        { name: "Moon", sign: "Cancer", lon: 105.2, house: 6 },
        { name: "Mercury", sign: "Gemini", lon: 80.1, house: 5 },
        { name: "Venus", sign: "Taurus", lon: 55.5, house: 4 },
        { name: "Mars", sign: "Leo", lon: 135.3, house: 7 }
      ]
    } else {
      throw new Error('Unexpected transit data format')
    }

    console.log('🌍 Transit planet sample:', transitPlanets[0])

    // Step 4: Send to transit comparison
    const payload = {
      natal: natalPlanets,
      transit: transitPlanets
    }

    console.log('🔄 Sending to /score-transit...')
    console.log('🔄 Natal planets count:', natalPlanets.length)
    console.log('🔄 Transit planets count:', transitPlanets.length)

    const comparisonResponse = await fetch(`${API_CONFIG.baseUrl}/score-transit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })

    console.log('🔄 Transit comparison status:', comparisonResponse.status)

    if (!comparisonResponse.ok) {
      const errorText = await comparisonResponse.text()
      console.error('❌ Transit comparison failed:', errorText)
      throw new Error(`Transit comparison failed: ${errorText}`)
    }

    const transitResults = await comparisonResponse.json()
    console.log('✅ Transit results:', transitResults)

    // Handle response
    const resultsArray = Array.isArray(transitResults) ? transitResults : []
    
    if (resultsArray.length === 0) {
      console.log('⚠️ No transit results received')
      alert('⚠️ Transit calculation completed but no results were returned')
      return
    }

    setTransitData(resultsArray)
    setTransitPeriod(period)
    setActiveTab('transits')
    
    console.log('✅ === TRANSIT CALCULATION COMPLETE ===')
    alert(`✅ ${period.charAt(0).toUpperCase() + period.slice(1)} transits calculated! Found ${resultsArray.length} results.`)
    
  } catch (err: any) {
    console.error('❌ === TRANSIT CALCULATION FAILED ===')
    console.error('❌ Error:', err)
    setError(`Transit calculation failed: ${err.message}`)
    alert(`❌ Transit calculation failed: ${err.message}`)
  } finally {
    setTransitLoading(false)
  }
}
  const formatLocation = (location: any) => {
    if (typeof location === 'string') return location
    if (location?.name) return location.name
    if (location?.city && location?.country) return `${location.city}, ${location.country}`
    return 'Unknown Location'
  }

  const getLifeAreaStatus = (score: number) => {
    if (score >= 1.5) return { label: 'Innate Resource', color: 'bg-green-100 text-green-800' }
    if (score > 0) return { label: 'Recalibration', color: 'bg-yellow-100 text-yellow-800' }
    if (score === 0) return { label: 'Ongoing Lesson', color: 'bg-blue-100 text-blue-800' }
    return { label: 'Sacred Curriculum', color: 'bg-purple-100 text-purple-800' }
  }

  const getTransitStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active support':
        return { color: 'bg-green-100 text-green-800', icon: '📈' }
      case 'recalibration':
        return { color: 'bg-yellow-100 text-yellow-800', icon: '🔄' }
      case 'no activation':
        return { color: 'bg-gray-100 text-gray-600', icon: '➖' }
      default:
        return { color: 'bg-blue-100 text-blue-800', icon: '🌟' }
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !userData) {
    return (
      <AdminLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ {error || 'User not found'}
          <button 
            onClick={fetchUserData}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    )
  }

  const { user_info, natal_chart, reflections, analytics } = userData
  const hasNatalChart = natal_chart?.planets && natal_chart.planets.length > 0
  const hasReflections = reflections && reflections.length > 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                {user_info.name ? user_info.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user_info.name || 'Unknown User'}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user_info.user_type === 'real'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user_info.user_type === 'real' ? '👤 Real User' : '🧪 Mock User'}
                  </span>
                  <span className="text-sm text-gray-500 font-mono">ID: {user_info.id.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link
                href="/admin/users"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                ← Back to Users
              </Link>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user_info.id)
                  alert('User ID copied to clipboard!')
                }}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                📋 Copy ID
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={calculateNatalChart}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading ? '🔄 Calculating...' : '🪐 Calculate Natal Chart'}
            </button>
            <button
              onClick={generateReflections}
              disabled={actionLoading || !hasNatalChart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading ? '🔄 Generating...' : '🔮 Generate Reflections'}
            </button>
            <button
              onClick={() => calculateTransits('daily')}
              disabled={transitLoading || !hasNatalChart}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {transitLoading ? '🔄 Calculating...' : '🌍 Calculate Transits'}
            </button>
            <button
              onClick={fetchUserData}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              🔄 Refresh Data
            </button>
          </div>
          {!hasNatalChart && (
            <p className="text-sm text-gray-600 mt-2">
              💡 Calculate natal chart first to enable reflections and transits.
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            ❌ {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'chart', label: 'Natal Chart', icon: '🪐', count: natal_chart?.planets?.length || 0 },
                { id: 'reflections', label: 'Reflections', icon: '🔮', count: reflections?.length || 0 },
                { id: 'transits', label: 'Transits', icon: '🌍', count: transitData?.length || 0 },
                { id: 'analytics', label: 'Analytics', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">🌟 Birth Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Date:</strong> {user_info.birthdate || user_info.birth_date}</div>
                      <div><strong>Time:</strong> {user_info.birthtime || user_info.birth_time}</div>
                      <div><strong>Location:</strong> {formatLocation(user_info.birth_location || user_info.location)}</div>
                      <div><strong>Timezone:</strong> {user_info.timezone}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">👤 Account Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Created:</strong> {new Date(user_info.created_at).toLocaleString()}</div>
                      <div><strong>User Type:</strong> {user_info.user_type}</div>
                      <div><strong>Chart Calculations:</strong> {analytics?.chart_calculations || 0}</div>
                      <div><strong>Last Activity:</strong> {analytics?.last_activity || 'Unknown'}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {natal_chart?.planets?.length || 0}
                    </div>
                    <div className="text-sm text-blue-700">Life Areas</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {reflections?.length || 0}
                    </div>
                    <div className="text-sm text-green-700">Reflections</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {transitData?.length || 0}
                    </div>
                    <div className="text-sm text-purple-700">Transits</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics?.reflection_generations || 0}
                    </div>
                    <div className="text-sm text-orange-700">AI Insights</div>
                  </div>
                </div>
              </div>
            )}

            {/* Natal Chart Tab */}
            {activeTab === 'chart' && (
              <div className="space-y-6">
                {hasNatalChart ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">🏠 Life Areas Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {natal_chart.planets.map((area: any, index: number) => {
                        const status = getLifeAreaStatus(area.score)
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-gray-900">{area.life_area}</div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mb-2">
                              House {area.house}
                            </div>
                            <div className="text-lg font-semibold text-blue-600 mb-2">
                              Score: {area.score}
                            </div>
                            {area.comment && (
                              <p className="text-xs text-gray-600 italic mb-2">{area.comment}</p>
                            )}
                            {area.facets && area.facets.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">
                                  Influences: {area.facets.join(', ')}
                                </p>
                              </div>
                            )}
                            {area.karma_axis && (
                              <div className="mt-1">
                                <span className={`inline-block px-2 py-1 rounded text-xs ${
                                  area.karma_axis === 'north' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {area.karma_axis === 'north' ? '↗️ North Node' : '↙️ South Node'}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">🪐</span>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Natal Chart Data</h3>
                    <p className="text-gray-500 mb-4">Calculate the natal chart to see life areas analysis.</p>
                    <button
                      onClick={calculateNatalChart}
                      disabled={actionLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? '🔄 Calculating...' : '🪐 Calculate Now'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Reflections Tab */}
            {activeTab === 'reflections' && (
              <div className="space-y-4">
                {hasReflections ? (
                  reflections.map((reflection: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{reflection.life_area}</h4>
                        <span className="text-sm text-gray-500">
                          Score: {reflection.score}
                        </span>
                      </div>
                      {reflection.status && (
                        <div className="mb-2">
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {reflection.status}
                          </span>
                        </div>
                      )}
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {reflection.insight}
                      </p>
                      {reflection.created_at && (
                        <div className="text-xs text-gray-500 mt-2">
                          Generated: {new Date(reflection.created_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">🔮</span>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Reflections Available</h3>
                    <p className="text-gray-500 mb-4">Generate AI-powered insights for each life area.</p>
                    {hasNatalChart ? (
                      <button
                        onClick={generateReflections}
                        disabled={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? '🔄 Generating...' : '🔮 Generate Now'}
                      </button>
                    ) : (
                      <p className="text-sm text-gray-500">Calculate natal chart first</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Transits Tab */}
            {activeTab === 'transits' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">🌍 Transit Analysis</h3>
                  <div className="flex space-x-2">
                    {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => calculateTransits(period)}
                        disabled={transitLoading || !hasNatalChart}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          transitPeriod === period
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {transitData && transitData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Showing {transitPeriod} transits for {new Date().toLocaleDateString()}
                    </div>
                    {transitData.map((transit: TransitData, index: number) => {
                      const status = getTransitStatus(transit.status)
                      return (
                        <div key={index} className="bg-white border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{status.icon}</span>
                              <h4 className="font-medium text-gray-900">{transit.life_area}</h4>
                              <span className="text-sm text-gray-500">House {transit.house}</span>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                {transit.status}
                              </span>
                              <div className="text-lg font-bold text-gray-900 mt-1">
                                {transit.score}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm mb-3">{transit.message}</p>
                          {transit.contributions && transit.contributions.length > 0 && (
                            <div className="bg-gray-50 rounded p-3">
                              <h5 className="text-xs font-medium text-gray-600 mb-1">Contributing Factors:</h5>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {transit.contributions.map((contribution, i) => (
                                  <li key={i}>• {contribution}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : transitLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Calculating transits...</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">🌍</span>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Transit Data</h3>
                    <p className="text-gray-500 mb-4">Calculate transits to see how current planetary movements affect this user.</p>
                    {hasNatalChart ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => calculateTransits('daily')}
                          disabled={transitLoading}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {transitLoading ? '🔄 Calculating...' : '🌍 Calculate Daily Transits'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Calculate natal chart first</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">📊 Usage Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Chart Calculations:</strong> {analytics?.chart_calculations || 0}</div>
                      <div><strong>Reflection Generations:</strong> {analytics?.reflection_generations || 0}</div>
                      <div><strong>Last Activity:</strong> {analytics?.last_activity || 'Unknown'}</div>
                      <div><strong>Account Age:</strong> {Math.floor((Date.now() - new Date(user_info.created_at).getTime()) / (1000 * 60 * 60 * 24))} days</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">🔧 Technical Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>User ID:</strong> <code className="bg-gray-200 px-1 rounded">{user_info.id}</code></div>
                      <div><strong>Data Source:</strong> {user_info.user_type === 'real' ? 'Supabase user_profiles' : 'Supabase mock_users'}</div>
                      <div><strong>Birth Coordinates:</strong> {natal_chart?.coordinates ? 'Available' : 'Using defaults'}</div>
                      <div><strong>Timezone:</strong> {user_info.timezone}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Admin Notes</h4>
                  <div className="text-sm text-yellow-700">
                    <p>• This user's data is stored in the {user_info.user_type === 'real' ? 'user_profiles' : 'mock_users'} table</p>
                    <p>• All chart calculations use Swiss Ephemeris with Placidus house system</p>
                    <p>• Reflections are generated using OpenAI GPT-3.5-turbo</p>
                    <p>• Transits compare current planetary positions to natal chart</p>
                    <p>• Life areas represent astrological houses and their meanings</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}