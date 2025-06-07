'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { adminApiClient } from '@/lib/adminApiClient'

export default function TestAdminPage() {
  const { isAuthenticated, admin, isLoading, login, logout } = useAdminAuth()
  const [testEmail, setTestEmail] = useState('admin@test.com')
  const [testPassword, setTestPassword] = useState('password123')
  const [testResults, setTestResults] = useState<string[]>([])
  const [localStorageData, setLocalStorageData] = useState<string | null>(null)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${message}`])
  }

  // Monitor localStorage changes
  useEffect(() => {
    const checkLocalStorage = () => {
      const data = localStorage.getItem('eternal_soul_admin_session')
      setLocalStorageData(data)
    }
    
    checkLocalStorage()
    const interval = setInterval(checkLocalStorage, 1000)
    return () => clearInterval(interval)
  }, [])

  // Monitor admin auth state changes
  useEffect(() => {
    addResult(`Admin Auth State: isAuthenticated=${isAuthenticated}, admin=${admin?.admin_name || 'null'}, isLoading=${isLoading}`)
  }, [isAuthenticated, admin, isLoading])

  const testAdminLogin = async () => {
    addResult('🔐 Starting admin login test...')
    try {
      const result = await login(testEmail, testPassword)
      if (result.success) {
        addResult('✅ Admin login successful!')
      } else {
        addResult(`❌ Admin login failed: ${result.error}`)
      }
    } catch (error: any) {
      addResult(`💥 Admin login error: ${error.message}`)
    }
  }

  const testAdminLogout = () => {
    addResult('🚪 Testing admin logout...')
    logout()
    addResult('✅ Admin logout completed')
  }

  const testApiCalls = async () => {
    addResult('📡 Testing admin API calls...')
    try {
      addResult('📡 Calling GET /admin/users...')
      const users = await adminApiClient.getUsers()
      addResult(`✅ Users API call successful: ${users?.length || 0} users found`)
      
      addResult('📡 Calling GET /admin/analytics...')
      const analytics = await adminApiClient.getAnalytics()
      addResult(`✅ Analytics API call successful: ${JSON.stringify(analytics)}`)
    } catch (error: any) {
      addResult(`❌ API call failed: ${error.userMessage || error.message}`)
      addResult(`❌ Full error: ${JSON.stringify(error)}`)
    }
  }

  const testSessionValidation = async () => {
    addResult('🔐 Testing session validation...')
    try {
      // This will trigger the backend validation in useAdminAuth
      await login(testEmail, testPassword)
    } catch (error: any) {
      addResult(`❌ Session validation failed: ${error.message}`)
    }
  }

  const checkCookies = () => {
    addResult('🍪 Checking browser cookies...')
    if (typeof document !== 'undefined') {
      const cookies = document.cookie
      addResult(`🍪 All cookies: ${cookies || 'No cookies found'}`)
      
      // Look specifically for Flask session cookie
      const sessionCookie = cookies.split(';').find(cookie => cookie.trim().startsWith('session='))
      if (sessionCookie) {
        addResult(`🍪 Flask session cookie found: ${sessionCookie.trim()}`)
      } else {
        addResult('❌ No Flask session cookie found')
      }
    } else {
      addResult('❌ Document not available (SSR)')
    }
  }

  const testCORSRequest = async () => {
    addResult('🌐 Testing CORS preflight request...')
    try {
      const response = await fetch('http://localhost:10000/admin/users', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        credentials: 'include'
      })
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods')
      }
      
      addResult(`🌐 CORS response: ${JSON.stringify(corsHeaders)}`)
    } catch (error: any) {
      addResult(`❌ CORS test failed: ${error.message}`)
    }
  }

  const testBackendHealth = async () => {
    addResult('❤️ Testing backend health...')
    try {
      const response = await fetch('http://localhost:10000/debug-ephe-files', {
        credentials: 'include'
      })
      const data = await response.json()
      addResult(`✅ Backend health check: ${response.status}`)
      addResult(`✅ Backend response: ${JSON.stringify(data)}`)
    } catch (error: any) {
      addResult(`❌ Backend health check failed: ${error.message}`)
    }
  }

  const clearTests = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Admin System Test Page</h1>
        
        {/* Current Admin State */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Current Admin State</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-400">Authenticated:</span>
              <span className={`ml-2 ${isAuthenticated ? 'text-green-400' : 'text-red-400'}`}>
                {isAuthenticated ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Admin Name:</span>
              <span className="ml-2 text-white">{admin?.admin_name || 'None'}</span>
            </div>
            <div>
              <span className="text-gray-400">Loading:</span>
              <span className={`ml-2 ${isLoading ? 'text-yellow-400' : 'text-green-400'}`}>
                {isLoading ? '⏳ Yes' : '✅ No'}
              </span>
            </div>
          </div>
        </div>

        {/* localStorage Monitor */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">localStorage Monitor</h2>
          <div className="bg-gray-900 p-3 rounded font-mono text-sm">
            <div className="text-gray-400">Key: eternal_soul_admin_session</div>
            <div className="text-white mt-2">
              {localStorageData ? (
                <pre className="whitespace-pre-wrap">{JSON.stringify(JSON.parse(localStorageData), null, 2)}</pre>
              ) : (
                <span className="text-red-400">No data found</span>
              )}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-400 mb-1">Admin Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={testAdminLogin}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              🔐 Test Login
            </button>
            <button
              onClick={testAdminLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              🚪 Test Logout
            </button>
            <button
              onClick={testApiCalls}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              📡 Test API Calls
            </button>
            <button
              onClick={testSessionValidation}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              🔐 Test Session Validation
            </button>
            <button
              onClick={checkCookies}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
            >
              🍪 Check Cookies
            </button>
            <button
              onClick={testCORSRequest}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              🌐 Test CORS Request
            </button>
            <button
              onClick={testBackendHealth}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              ❤️ Test Backend Health
            </button>
            <button
              onClick={clearTests}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Test Results</h2>
          <div className="bg-gray-900 rounded p-3 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-400">No test results yet. Run some tests!</div>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono text-gray-300">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 