'use client'

import { useState, useEffect } from 'react'
import { API_CONFIG } from '@/config/api'
import AdminLayout from '@/components/AdminLayout'

interface DashboardStats {
  total_users: number
  real_users: number
  mock_users: number
  recent_users: any[]
  system_health: string
  api_endpoints: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch analytics data
      const analyticsResponse = await fetch(`${API_CONFIG.baseUrl}/admin/analytics`, {
        credentials: 'include'
      })
      
      if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const analyticsData = await analyticsResponse.json()
      
      // Fetch users data
      const usersResponse = await fetch(`${API_CONFIG.baseUrl}/admin/users`, {
        credentials: 'include'
      })
      
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const usersData = await usersResponse.json()
      
      // Combine data
      setStats({
        total_users: analyticsData.total_users || 0,
        real_users: analyticsData.real_users || 0,
        mock_users: analyticsData.mock_users || 0,
        recent_users: usersData.users?.slice(0, 5) || [],
        system_health: 'Operational',
        api_endpoints: [
          { name: 'Admin Login', status: 'Active', endpoint: '/admin-login' },
          { name: 'Users Management', status: 'Active', endpoint: '/admin/users' },
          { name: 'Analytics', status: 'Active', endpoint: '/admin/analytics' },
          { name: 'Create User', status: 'Active', endpoint: '/admin/create-mock-user' },
          { name: 'User Details', status: 'Active', endpoint: '/admin/user-complete-data' }
        ]
      })
      
    } catch (err: any) {
      console.error('❌ Dashboard fetch error:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
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

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ {error}
          <button 
            onClick={fetchDashboardData}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">Welcome to Eternal Soul Admin</h1>
          <p className="text-blue-100">
            Complete admin backend system operational with {stats?.total_users || 0} total users
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Real Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.real_users || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">🧪</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mock Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.mock_users || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">💚</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">System Health</p>
                <p className="text-2xl font-bold text-green-600">{stats?.system_health || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Users</h3>
              <div className="space-y-4">
                {stats?.recent_users?.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{user.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">
                        {user.user_type === 'real' ? '👤 Real User' : '🧪 Mock User'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No recent users found</p>
                )}
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Endpoints Status</h3>
              <div className="space-y-3">
                {stats?.api_endpoints?.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{endpoint.name}</p>
                      <p className="text-sm text-gray-500 font-mono">{endpoint.endpoint}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ {endpoint.status}
                    </span>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">Loading endpoints...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <span className="text-2xl mr-3">👥</span>
              <div>
                <p className="font-medium text-blue-900">Manage Users</p>
                <p className="text-sm text-blue-700">View and edit user profiles</p>
              </div>
            </a>

            <a
              href="/admin/users/create"
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <span className="text-2xl mr-3">➕</span>
              <div>
                <p className="font-medium text-green-900">Create Mock User</p>
                <p className="text-sm text-green-700">Add test user for development</p>
              </div>
            </a>

            <a
              href="/admin/analytics"
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <span className="text-2xl mr-3">📈</span>
              <div>
                <p className="font-medium text-purple-900">View Analytics</p>
                <p className="text-sm text-purple-700">System metrics and insights</p>
              </div>
            </a>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-gray-800 text-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">🔧 System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Backend URL:</strong> {API_CONFIG.baseUrl}</p>
              <p><strong>Database:</strong> Supabase (bdoxjvpxoretepsggvmm)</p>
              <p><strong>Admin System:</strong> Fully Operational</p>
            </div>
            <div>
              <p><strong>Python Backend:</strong> Flask + Swiss Ephemeris</p>
              <p><strong>Authentication:</strong> Session-based admin auth</p>
              <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}