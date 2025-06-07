'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_CONFIG } from '@/config/api'
import AdminLayout from '@/components/AdminLayout'

export default function CreateMockUserPage() {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthLocation: '',
    timezone: '+00:00',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // Pre-defined timezone options
  const timezones = [
    { value: '+00:00', label: 'UTC (GMT+0)' },
    { value: '+05:30', label: 'India (GMT+5:30)' },
    { value: '-05:00', label: 'US East (GMT-5)' },
    { value: '-08:00', label: 'US West (GMT-8)' },
    { value: '+01:00', label: 'Europe Central (GMT+1)' },
    { value: '+09:00', label: 'Japan/Korea (GMT+9)' },
    { value: '+10:00', label: 'Australia East (GMT+10)' },
    { value: '-03:00', label: 'Brazil (GMT-3)' },
    { value: '+08:00', label: 'China/Singapore (GMT+8)' },
    { value: '+02:00', label: 'South Africa (GMT+2)' }
  ]

  // Sample user templates for quick creation
  const sampleUsers = [
    {
      name: 'Maya Thompson',
      birthDate: '1993-06-21',
      birthTime: '14:30:00',
      birthLocation: 'Los Angeles, CA, USA',
      timezone: '-08:00',
      notes: 'Gemini Sun, summer solstice birth - communication focus'
    },
    {
      name: 'Alessandro Rossi',
      birthDate: '1987-12-15',
      birthTime: '08:45:00',
      birthLocation: 'Rome, Italy',
      timezone: '+01:00',
      notes: 'Sagittarius Sun, morning birth - philosopher type'
    },
    {
      name: 'Yuki Tanaka',
      birthDate: '1995-03-08',
      birthTime: '22:15:00',
      birthLocation: 'Tokyo, Japan',
      timezone: '+09:00',
      notes: 'Pisces Sun, late evening birth - intuitive personality'
    },
    {
      name: 'Priya Sharma',
      birthDate: '1990-10-31',
      birthTime: '05:20:00',
      birthLocation: 'Mumbai, India',
      timezone: '+05:30',
      notes: 'Scorpio Sun, Halloween birth - intense transformation themes'
    },
    {
      name: 'Jackson Williams',
      birthDate: '1985-08-12',
      birthTime: '18:00:00',
      birthLocation: 'Sydney, Australia',
      timezone: '+10:00',
      notes: 'Leo Sun, sunset birth - leadership and creativity focus'
    }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const loadSampleUser = (sample: typeof sampleUsers[0]) => {
    setFormData({
      name: sample.name,
      birthDate: sample.birthDate,
      birthTime: sample.birthTime,
      birthLocation: sample.birthLocation,
      timezone: sample.timezone,
      notes: sample.notes
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/admin/create-mock-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          birthdate: formData.birthDate,
          birthtime: formData.birthTime,
          birth_location: formData.birthLocation,
          timezone: formData.timezone,
          notes: formData.notes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setSuccess(`✅ Mock user "${formData.name}" created successfully! ID: ${data.user_id}`)
      
      // Reset form
      setFormData({
        name: '',
        birthDate: '',
        birthTime: '',
        birthLocation: '',
        timezone: '+00:00',
        notes: ''
      })

      // Redirect to user detail page after 3 seconds
      setTimeout(() => {
        router.push(`/admin/users/${data.user_id}?type=mock`)
      }, 3000)

    } catch (err: any) {
      console.error('❌ Create user error:', err)
      setError(err.message || 'Failed to create mock user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Mock User</h1>
              <p className="text-gray-600 mt-1">Add a test user for development and testing purposes</p>
            </div>
            <a
              href="/admin/users"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Users
            </a>
          </div>
        </div>

        {/* Sample User Templates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Quick Start Templates</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click any template below to auto-fill the form with sample data:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sampleUsers.map((sample, index) => (
              <button
                key={index}
                onClick={() => loadSampleUser(sample)}
                className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <div className="font-medium text-blue-900">{sample.name}</div>
                <div className="text-sm text-blue-700">{sample.birthLocation}</div>
                <div className="text-xs text-blue-600 mt-1">{sample.notes}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
            <p className="text-sm mt-1">Redirecting to user profile...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            ❌ {error}
          </div>
        )}

        {/* Create User Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">User Information</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Alex Johnson"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Location *
                </label>
                <input
                  type="text"
                  name="birthLocation"
                  value={formData.birthLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., New York, NY, USA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Birth Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Date *
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Time *
                </label>
                <input
                  type="time"
                  name="birthTime"
                  value={formData.birthTime}
                  onChange={handleInputChange}
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone *
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any notes about this test user (e.g., 'Leo Sun, good for testing career features')"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                * Required fields
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      name: '',
                      birthDate: '',
                      birthTime: '',
                      birthLocation: '',
                      timezone: '+00:00',
                      notes: ''
                    })
                    setError('')
                    setSuccess('')
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Creating User...
                    </div>
                  ) : (
                    '✨ Create Mock User'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 mb-3">ℹ️ About Mock Users</h4>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Mock users are test accounts for development and testing purposes</p>
            <p>• They support full natal chart calculations and AI-generated reflections</p>
            <p>• Default coordinates are assigned automatically based on location name</p>
            <p>• All mock users use Placidus house system for chart calculations</p>
            <p>• Mock users are stored separately from real user accounts</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}