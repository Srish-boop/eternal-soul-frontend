'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { saveBirthData } from '@/lib/birthDataSync'
import { saveReflections } from '@/lib/reflectionSync'
import { apiClient, ApiError } from '@/lib/apiClient'
import { ChartCalculationLoader, ReflectionGenerationLoader, DataSavingLoader } from '@/components/LoadingSpinner'
import { useNatalChart, useSmartPrefetch, useSaveBirthData } from '@/hooks/useAstrology'
import { cacheManager } from '@/lib/cache'

export default function BirthDataPage() {
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [birthCoords, setBirthCoords] = useState<{lat: number, lon: number} | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [loadingPhase, setLoadingPhase] = useState<'chart' | 'reflection' | 'saving' | null>(null)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  // 🎯 Caching hooks
  const { prefetchOnBirthData } = useSmartPrefetch()
  const saveBirthDataMutation = useSaveBirthData()

  // Prepare birth data for caching
  const birthData = birthDate && birthTime && birthCoords ? {
    date: birthDate,
    time: birthTime,
    lat: birthCoords.lat,
    lon: birthCoords.lon,
    timezone: '+05:30'
  } : null

  // Use cached natal chart query
  const natalChartQuery = useNatalChart(birthData, { enabled: false }) // Don't auto-fetch

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login') // 🔒 Enforce login
      } else {
        setUserId(user.id)
      }
    }
    getUser()
  }, [router])

  async function geocodePlace(place: string) {
    console.log('📍 Geocoding place:', place)
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`)
    if (!res.ok) throw new Error('Failed to geocode location')
    const data = await res.json()
    if (data.length === 0) throw new Error('Place not found. Please try a more specific location.')
    const { lat, lon } = data[0]
    console.log('📍 Coordinates found:', lat, lon)
    return { lat: parseFloat(lat), lon: parseFloat(lon) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!userId) throw new Error('User not authenticated.')

      console.log('📤 Submitting birth data:', birthDate, birthTime, birthPlace)
      
      setLoadingPhase('chart')
      setLoadingStep('🌍 Finding your birth location...')
      const { lat, lon } = await geocodePlace(birthPlace)
      setBirthCoords({ lat, lon })

      const currentBirthData = {
        date: birthDate,
        time: birthTime,
        lat,
        lon,
        timezone: '+05:30'
      }

      setLoadingStep('🪐 Calculating your natal chart...')
      console.log('🪐 Calculating natal chart for:', currentBirthData)
      
      // 🎯 Try to get cached chart data first
      let chartData = await cacheManager.chartData.getChartData(currentBirthData)
      
      if (chartData) {
        console.log('🎯 Using cached natal chart data')
      } else {
        console.log('🌐 Fetching fresh natal chart data')
        const scores = await apiClient.calculateNatalChart(currentBirthData)
        
        // Create chart data structure and cache it
        chartData = {
          planets: scores.planets || [],
          scores: scores.scores || {},
          insights: scores.insights || [],
          calculatedAt: Date.now(),
          userId: userId
        }
        
        await cacheManager.chartData.cacheChartData(currentBirthData, chartData)
        console.log('💾 Cached natal chart data for future use')
      }

      setLoadingPhase('reflection')
      setLoadingStep('🔮 Generating your personalized insights...')
      
      // Check cache for reflections too
      let reflectionData = await cacheManager.apiResponse.getApiResponse('generate-reflections', { chartData })
      
      if (!reflectionData) {
        reflectionData = await apiClient.generateReflections(chartData.scores)
        await cacheManager.apiResponse.cacheApiResponse('generate-reflections', { chartData }, reflectionData)
      }
      
      console.log('🔮 Reflections received:', reflectionData)

      setLoadingPhase('saving')
      setLoadingStep('💾 Saving your soul blueprint...')
      
      // Cache user profile
      const userProfile = {
        id: userId,
        name: 'Guest',
        birthData: currentBirthData,
        chartData: chartData
      }
      
      await cacheManager.userProfile.cacheUserProfile(userProfile)
      
      await saveBirthData({
        name: 'Guest',
        birthdate: birthDate,
        birthtime: birthTime,
        location: birthPlace,
        house_system: 'placidus',
        user_id: userId,
      })
      console.log('🌱 Birth data saved to Supabase')

      if (reflectionData.reflections) {
        const formattedReflections = reflectionData.reflections.map((r: any) => ({
          ...r,
          score: typeof r.score === 'string' ? parseInt(r.score) : r.score,
        }))
        await saveReflections(formattedReflections, userId)
        console.log('📡 Reflections saved to Supabase')

        // 🔥 Prefetch related data for faster navigation
        await prefetchOnBirthData(currentBirthData)

        setLoadingStep('✨ Complete! Redirecting to your Soul Compass...')
        setTimeout(() => {
          window.location.href = '/compass'
        }, 1500)
      }

    } catch (err: any) {
      console.error('❌ SOUL FLOW ERROR:', err)
      
      // Handle API errors with user-friendly messages
      if (err.userMessage) {
        setError(err.userMessage)
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please check your birth details and try again.')
      }
    } finally {
      setLoading(false)
      setLoadingStep('')
      setLoadingPhase(null)
    }
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center text-white flex flex-col items-center justify-center p-8"
      style={{ backgroundImage: "url('/devi-bg.png')" }}
    >
      <div className="bg-black bg-opacity-60 p-6 rounded-xl text-center w-full max-w-md">
        <h1 className="text-4xl font-bold tracking-wide mb-4">🌕 Eternal Soul</h1>
        <p className="text-lg text-gray-300 mb-6">
          Enter your birth details to unlock your Soul Compass.
        </p>

        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-600 text-red-200 p-3 rounded mb-4">
            ❌ {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full p-3 rounded bg-white bg-opacity-90 text-black"
            disabled={loading}
            required
          />
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full p-3 rounded bg-white bg-opacity-90 text-black"
            disabled={loading}
            required
          />
          <input
            type="text"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder="Place of Birth (e.g., New York, NY, USA)"
            className="w-full p-3 rounded bg-white bg-opacity-90 text-black"
            disabled={loading}
            required
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Reveal My Soul Blueprint'}
          </button>
        </form>

        {loading && (
          <div className="mt-6">
            {loadingPhase === 'chart' && <ChartCalculationLoader currentStep={loadingStep} />}
            {loadingPhase === 'reflection' && <ReflectionGenerationLoader currentStep={loadingStep} />}
            {loadingPhase === 'saving' && <DataSavingLoader />}
            {!loadingPhase && (
              <div className="space-y-2">
                <div className="bg-purple-800 bg-opacity-40 p-3 rounded">
                  <p className="text-sm italic text-purple-200">{loadingStep}</p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
