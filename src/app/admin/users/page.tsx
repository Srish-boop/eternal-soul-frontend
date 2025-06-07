'use client'

import { useState, useEffect } from 'react'
import { API_CONFIG } from '@/config/api'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'

interface User {
  id: string
  name: string
  user_type: 'real' | 'mock'
  birthdate: string
  birth_date: string
  birthtime: string
  birth_time: string
  birth_location: any
  location: any
  timezone: string
  created_at: string
  latitude?: number
  longitude?: number
}

interface EditUserData {
  name: string
  birthdate: string
  birthtime: string
  birth_location: string
  timezone: string
  latitude?: number
  longitude?: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'real' | 'mock'>('all')
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editData, setEditData] = useState<EditUserData>({
    name: '',
    birthdate: '',
    birthtime: '',
    birth_location: '',
    timezone: '',
    latitude: undefined,
    longitude: undefined
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_CONFIG.baseUrl}/admin/users`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users || [])
      
    } catch (err: any) {
      console.error('❌ Users fetch error:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || user.user_type === filterType
    return matchesSearch && matchesFilter
  })

  // Enhanced location formatting with better parsing
  const formatLocation = (user: User) => {
    const location = user.birth_location || user.location
    
    if (typeof location === 'string') {
      try {
        const parsed = JSON.parse(location)
        if (parsed.name && parsed.name !== 'Unknown') return parsed.name
        if (parsed.city && parsed.country) return `${parsed.city}, ${parsed.country}`
      } catch (e) {
        if (location !== 'Unknown' && location.trim() !== '') return location
      }
    }
    
    if (location && typeof location === 'object') {
      if (location.name && location.name !== 'Unknown') return location.name
      if (location.city && location.country) return `${location.city}, ${location.country}`
      if (location.city) return location.city
    }
    
    // Use coordinates if available
    if (user.latitude && user.longitude) {
      return `${user.latitude.toFixed(2)}, ${user.longitude.toFixed(2)}`
    }
    
    return 'Unknown Location'
  }

  // Enhanced timezone formatting
  const formatTimezone = (timezone: string) => {
    if (!timezone || timezone === '+00:00') return 'UTC'
    return timezone
  }

  // Open edit modal
  const openEditModal = (user: User) => {
    setEditingUser(user)
    setEditData({
      name: user.name || '',
      birthdate: user.birthdate || user.birth_date || '',
      birthtime: user.birthtime || user.birth_time || '',
      birth_location: formatLocation(user),
      timezone: user.timezone || '+00:00',
      latitude: user.latitude,
      longitude: user.longitude
    })
    setEditModalOpen(true)
  }

  // Close edit modal
  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingUser(null)
    setEditData({
      name: '',
      birthdate: '',
      birthtime: '',
      birth_location: '',
      timezone: '',
      latitude: undefined,
      longitude: undefined
    })
  }

  // Save user changes
  const saveUserChanges = async () => {
    if (!editingUser) return

    try {
      setEditLoading(true)

      // Determine which endpoint to use based on user type
      const endpoint = editingUser.user_type === 'real' 
        ? `/admin/update-real-user/${editingUser.id}`
        : `/admin/update-mock-user/${editingUser.id}`

      const payload = {
        name: editData.name,
        birthdate: editData.birthdate,
        birthtime: editData.birthtime,
        birth_location: editData.birth_location,
        timezone: editData.timezone,
        ...(editingUser.user_type === 'mock' && {
          latitude: editData.latitude || 40.7128,
          longitude: editData.longitude || -74.0060
        })
      }

      console.log('Saving user changes:', payload)

      const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update user')
      }

      const result = await response.json()
      console.log('User updated successfully:', result)

      // Refresh users list
      await fetchUsers()
      closeEditModal()
      alert('✅ User updated successfully!')

    } catch (err: any) {
      console.error('❌ Update user error:', err)
      alert(`❌ Failed to update user: ${err.message}`)
    } finally {
      setEditLoading(false)
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
            onClick={fetchUsers}
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage real and mock users in the system</p>
          </div>
          <Link
            href="/admin/users/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ➕ Create Mock User
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Users</option>
                <option value="real">Real Users</option>
                <option value="mock">Mock Users</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">👥</span>
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="text-sm text-gray-500">Real Users</p>
                <p className="text-xl font-bold">{users.filter(u => u.user_type === 'real').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🧪</span>
              <div>
                <p className="text-sm text-gray-500">Mock Users</p>
                <p className="text-xl font-bold">{users.filter(u => u.user_type === 'mock').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Users ({filteredUsers.length})
            </h3>
          </div>
          
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-4xl mb-4 block">👤</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating a mock user for testing'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Link
                  href="/admin/users/create"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ Create First Mock User
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Birth Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500 font-mono">
                              {user.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.user_type === 'real'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.user_type === 'real' ? '👤 Real' : '🧪 Mock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{user.birthdate || user.birth_date}</div>
                          <div className="text-gray-500">{user.birthtime || user.birth_time}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {formatLocation(user)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTimezone(user.timezone)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/users/${user.id}?type=${user.user_type}`}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors"
                        >
                          👁️ View
                        </Link>
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.id)
                            alert('User ID copied to clipboard!')
                          }}
                          className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded transition-colors"
                        >
                          📋 Copy ID
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Additional Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchUsers}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Refresh Users
            </button>
            <button
              onClick={() => {
                const csvContent = [
                  ['Name', 'Type', 'Birth Date', 'Birth Time', 'Location', 'Timezone', 'Created'],
                  ...users.map(user => [
                    user.name || 'Unknown',
                    user.user_type,
                    user.birthdate || user.birth_date,
                    user.birthtime || user.birth_time,
                    formatLocation(user),
                    formatTimezone(user.timezone),
                    new Date(user.created_at).toLocaleDateString()
                  ])
                ].map(row => row.join(',')).join('\n')
                
                const blob = new Blob([csvContent], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'eternal-soul-users.csv'
                a.click()
                window.URL.revokeObjectURL(url)
              }}
              className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              📥 Export CSV
            </button>
            <Link
              href="/admin/analytics"
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              📊 View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Edit User: {editingUser.name}
              </h3>
              <p className="text-sm text-gray-500">
                {editingUser.user_type === 'real' ? '👤 Real User' : '🧪 Mock User'}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter user name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={editData.birthdate}
                    onChange={(e) => setEditData(prev => ({ ...prev, birthdate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Time
                  </label>
                  <input
                    type="time"
                    value={editData.birthtime}
                    onChange={(e) => setEditData(prev => ({ ...prev, birthtime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birth Location
                </label>
                <input
                  type="text"
                  value={editData.birth_location}
                  onChange={(e) => setEditData(prev => ({ ...prev, birth_location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={editData.timezone}
                  onChange={(e) => setEditData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="+00:00">UTC (+00:00)</option>
                  <option value="+05:30">India (+05:30)</option>
                  <option value="-05:00">EST (-05:00)</option>
                  <option value="-08:00">PST (-08:00)</option>
                  <option value="+01:00">CET (+01:00)</option>
                  <option value="+09:00">JST (+09:00)</option>
                  <option value="+08:00">CST (+08:00)</option>
                  <option value="-03:00">BRT (-03:00)</option>
                </select>
              </div>

              {editingUser.user_type === 'mock' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editData.latitude || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="40.7128"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editData.longitude || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="-74.0060"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeEditModal}
                disabled={editLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveUserChanges}
                disabled={editLoading}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {editLoading ? '💾 Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}