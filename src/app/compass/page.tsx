'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getReflections } from '@/lib/reflectionSync'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { adminApiClient } from '@/lib/adminApiClient'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function CompassPage() {
  // User state
  const [reflections, setReflections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily')
  
  // Admin state
  const { isAuthenticated: isAdminAuthenticated, admin, isLoading: adminLoading, logout: adminLogout } = useAdminAuth()
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [adminTab, setAdminTab] = useState<'users' | 'analytics'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [adminDataLoading, setAdminDataLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  // Debug admin state
  useEffect(() => {
    console.log('🧭 Compass - Admin auth state:', {
      isAdminAuthenticated,
      admin,
      adminLoading
    });
  }, [isAdminAuthenticated, admin, adminLoading]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user && !isAdminAuthenticated) {
        router.push('/login') // 🔐 Enforce login
        return
      }

      // Fetch user reflections if user is logged in
      if (user) {
        try {
          const data = await getReflections(user.id)
          setReflections(data || [])
        } catch (err) {
          console.error('❌ Error fetching reflections:', err)
        }
      }
      
      setLoading(false)
    }

    if (!adminLoading) {
      fetchData()
    }
  }, [router, isAdminAuthenticated, adminLoading])

  // Fetch admin data when admin panel is shown
  useEffect(() => {
    if (showAdminPanel && isAdminAuthenticated) {
      fetchAdminData()
    }
  }, [showAdminPanel, isAdminAuthenticated])

  const fetchAdminData = async () => {
    setAdminDataLoading(true)
    setError(null)
    try {
      console.log('📡 Fetching admin data from backend...')
      const [usersData, analyticsData] = await Promise.all([
        adminApiClient.getUsers(),
        adminApiClient.getAnalytics()
      ])
      console.log('✅ Admin data fetched successfully')
      setUsers(usersData || [])
      setAnalytics(analyticsData || {})
    } catch (error: any) {
      console.error('❌ Error fetching admin data:', error)
      
      // Check if it's a session/authentication error
      if (error.type === 'authentication_error' || error.message.includes('session') || error.message.includes('401')) {
        console.error('🔒 Admin API call failed - but keeping session')
        // Don't auto-logout, just show error message
        setError('Admin API temporarily unavailable. Session maintained.')
        // Keep admin logged in, just disable admin features temporarily
      } else {
        setError(`Admin data error: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setAdminDataLoading(false)
    }
  }

  const handleAdminLogout = () => {
    adminLogout()
    setShowAdminPanel(false)
    router.push('/login')
  }

  return (
    <>
      <main className="min-h-screen pb-32 bg-gradient-to-br from-black to-purple-900 text-white p-6">
        {/* Header with Admin Toggle */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">🧭 Soul Compass</h1>
          {isAdminAuthenticated && admin && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-purple-300">Admin: {admin.admin_name}</span>
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showAdminPanel 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {showAdminPanel ? '👤 User View' : '🛡️ Admin Panel'}
              </button>
              <button
                onClick={handleAdminLogout}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Admin Panel */}
        {showAdminPanel && isAdminAuthenticated && (
          <div className="mb-8 bg-gray-800 border border-purple-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-purple-400 mb-4">🛡️ Admin Dashboard</h2>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-yellow-800 border border-yellow-600 rounded-lg">
                <p className="text-yellow-200 text-sm">⚠️ {error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-yellow-400 hover:text-yellow-300 text-xs underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            )}
            
            {/* Admin Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAdminTab('users')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  adminTab === 'users'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                👥 User Management
              </button>
              <button
                onClick={() => setAdminTab('analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  adminTab === 'analytics'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📊 System Analytics
              </button>
            </div>

            {adminDataLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner variant="medium" message="Loading admin data..." />
              </div>
            ) : (
              <>
                {/* User Management Tab */}
                {adminTab === 'users' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-purple-300">User Database ({users.length} users)</h3>
                      <button 
                        onClick={fetchAdminData}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                      >
                        🔄 Refresh
                      </button>
                    </div>
                    
                    {users.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-600">
                              <th className="text-left p-2 text-purple-300">Type</th>
                              <th className="text-left p-2 text-purple-300">Name</th>
                              <th className="text-left p-2 text-purple-300">Email/Location</th>
                              <th className="text-left p-2 text-purple-300">Birth Date</th>
                              <th className="text-left p-2 text-purple-300">Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user: any, index: number) => (
                              <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                                <td className="p-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    user.user_type === 'real' 
                                      ? 'bg-green-800 text-green-200' 
                                      : 'bg-blue-800 text-blue-200'
                                  }`}>
                                    {user.user_type === 'real' ? '👤 Real' : '🧪 Mock'}
                                  </span>
                                </td>
                                <td className="p-2 text-white font-medium">
                                  {user.name || user.user_name || 'N/A'}
                                </td>
                                <td className="p-2 text-gray-300">
                                  {user.email || user.birth_location || 'N/A'}
                                </td>
                                <td className="p-2 text-gray-300">
                                  {user.birthdate ? new Date(user.birthdate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="p-2 text-gray-400 text-xs">
                                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>No users found in the database.</p>
                        {error && (
                          <p className="text-yellow-400 text-sm mt-2">
                            This might be due to API connection issues.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics Tab */}
                {adminTab === 'analytics' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-purple-300">System Analytics</h3>
                    
                    {analytics ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-400">
                            {analytics.total_users || 0}
                          </div>
                          <div className="text-gray-300 text-sm">Total Users</div>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-400">
                            {analytics.real_users || 0}
                          </div>
                          <div className="text-gray-300 text-sm">Real Users</div>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-400">
                            {analytics.mock_users || 0}
                          </div>
                          <div className="text-gray-300 text-sm">Mock Users</div>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-400">
                            {analytics.api_calls_today || 0}
                          </div>
                          <div className="text-gray-300 text-sm">API Calls Today</div>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-red-400">
                            {analytics.error_rate || '0%'}
                          </div>
                          <div className="text-gray-300 text-sm">Error Rate</div>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-indigo-400">
                            {analytics.uptime || '99.9%'}
                          </div>
                          <div className="text-gray-300 text-sm">System Uptime</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>Analytics data unavailable.</p>
                        {error && (
                          <p className="text-yellow-400 text-sm mt-2">
                            This might be due to API connection issues.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Regular User Compass - Only show if not admin panel or if regular user */}
        {(!showAdminPanel || !isAdminAuthenticated) && (
          <>
            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-6">
              {['daily', 'weekly', 'monthly', 'yearly'].map((tab) => (
                <button
                  key={tab}
                  className={`uppercase px-4 py-2 rounded ${activeTab === tab ? 'bg-purple-600' : 'bg-gray-700'}`}
                  onClick={() => setActiveTab(tab as any)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Reflections */}
            <div className="space-y-6 max-w-2xl mx-auto">
              {loading ? (
                <LoadingSpinner 
                  variant="large" 
                  message="Loading your soul reflections..." 
                  progress={60}
                />
              ) : reflections.length === 0 ? (
                <div className="text-center">
                  <p className="text-purple-200 italic mb-4">No reflections found.</p>
                  <p className="text-purple-300 text-sm">
                    Complete your birth data to generate your soul compass.
                  </p>
                </div>
              ) : (
                reflections.map((r: any, i: number) => (
                  <div key={i} className="bg-purple-800 bg-opacity-40 p-4 rounded-lg">
                    <h2 className="font-bold mb-1">{r.life_area}</h2>
                    <p className="text-sm text-purple-100 whitespace-pre-wrap">{r.insight}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-80 backdrop-blur-md border-t border-gray-700 flex justify-around items-center py-3 text-white text-xs z-50">
        <a href="/compass" className="flex flex-col items-center">
          <span>🌤</span>
          <span>Compass</span>
        </a>
        <a href="/soulmate" className="flex flex-col items-center">
          <span>🧬</span>
          <span>Soulmate</span>
        </a>
        <a href="/blueprint" className="flex flex-col items-center">
          <span>🧿</span>
          <span>Blueprint</span>
        </a>
        <a href="/medicine" className="flex flex-col items-center">
          <span>🕉</span>
          <span>Medicine</span>
        </a>
        <a href="/journal" className="flex flex-col items-center">
          <span>📓</span>
          <span>Journal</span>
        </a>
      </nav>
    </>
  )
}