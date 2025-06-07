'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_CONFIG } from '@/config/api'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('beyondparsolutions@gmail.com') // Pre-filled with your admin email
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session management
        body: JSON.stringify({
          admin_email: email,
          password: password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store admin session data
      localStorage.setItem('admin_session', JSON.stringify({
        admin_name: data.admin_name,
        admin_email: data.admin_email,
        login_time: Date.now()
      }))

      console.log('✅ Admin login successful:', data)
      
      // Redirect to admin dashboard
      router.push('/admin/dashboard')
      
    } catch (err: any) {
      console.error('❌ Admin login error:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔐 Admin Portal</h1>
          <p className="text-blue-200">Eternal Soul Administrative Access</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
              placeholder="Enter admin password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Authenticating...
              </div>
            ) : (
              'Sign In to Admin Panel'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="text-center text-sm text-blue-200">
            <p className="mb-2">🔧 System Status</p>
            <div className="flex justify-center space-x-4 text-xs">
              <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">Backend Online</span>
              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Database Connected</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-blue-300 hover:text-blue-200 text-sm underline"
          >
            ← Back to User App
          </a>
        </div>
      </div>
    </main>
  )
}