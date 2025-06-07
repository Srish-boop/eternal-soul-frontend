'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import ConfigCheck from '@/components/ConfigCheck'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

function LoginPageContent() {
  // User login state
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSupabaseReady, setIsSupabaseReady] = useState(false)
  
  // Admin login state
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user')
  
  // Admin authentication hook
  const { isAuthenticated, admin, isLoading: adminLoading, error: adminError, login: adminLogin, clearError } = useAdminAuth()
  
  const router = useRouter()

  useEffect(() => {
    // Check if Supabase is properly configured
    const checkSupabase = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        setIsSupabaseReady(true);
      } catch (error) {
        console.error('Supabase configuration error:', error);
        setMessage('❌ Authentication service unavailable. Please check configuration.');
      }
    };
    checkSupabase();
  }, []);

  // Redirect admin if already authenticated
  useEffect(() => {
    if (isAuthenticated && admin) {
      setMessage(`✅ Welcome back, ${admin.admin_name}! Redirecting to compass...`);
      // Redirect to compass with admin features after successful authentication
      setTimeout(() => {
        router.push('/compass');
      }, 1500);
    }
  }, [isAuthenticated, admin, router]);

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSupabaseReady) {
      setMessage('❌ Authentication service not ready. Please wait and try again.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login/redirect`,
        },
      })

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid API key') || error.message.includes('Project not found')) {
          setMessage('❌ Authentication service misconfigured. Please contact support.');
        } else if (error.message.includes('security purposes') || error.message.includes('can only request this after')) {
          setMessage('⏱️ Please wait 30 seconds before requesting another magic link.');
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          setMessage('⏱️ Too many requests. Please wait a moment and try again.');
        } else {
          setMessage(`❌ ${error.message}`);
        }
      } else {
        setMessage('📬 Magic link sent! Check your email.');
      }
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      setMessage('❌ Unexpected error occurred. Please try again.');
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!adminEmail || !adminPassword) {
      setMessage('❌ Please enter both admin email and password.');
      return;
    }

    const result = await adminLogin(adminEmail, adminPassword);
    
    if (result.success) {
  console.log('🎉 Admin login success - preparing to redirect');
  
  // DEBUG: Check if localStorage was actually set
  const storedData = localStorage.getItem('eternal_soul_admin_session');
  console.log('🔍 localStorage immediately after login:', storedData);
  
  if (!storedData) {
    console.error('❌ localStorage NOT SET after successful login!');
    // Try setting it again
    const adminData = {
      admin_email: 'beyondparsolutions@gmail.com',
      admin_name: 'Srishty Admin'
    };
    localStorage.setItem('eternal_soul_admin_session', JSON.stringify(adminData));
    console.log('🔄 Manually set localStorage, check again:', localStorage.getItem('eternal_soul_admin_session'));
  }
  
  setMessage('✅ Admin login successful! Redirecting to compass...');
      // Clear form
      setAdminEmail('');
      setAdminPassword('');
      // Redirect to compass with admin features after successful login
      setTimeout(() => {
        console.log('🧭 Redirecting to compass page');
        router.push('/compass');
      }, 1500);
    } else {
      console.error('❌ Admin login failed:', result.error);
      setMessage(result.error || '❌ Admin login failed');
    }
  }

  const switchLoginMode = (mode: 'user' | 'admin') => {
    setLoginMode(mode);
    setMessage('');
    clearError();
    // Clear forms when switching
    setEmail('');
    setAdminEmail('');
    setAdminPassword('');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="max-w-sm w-full">
        <ConfigCheck />
        
        {/* Login Mode Switcher */}
        <div className="mb-6 flex rounded-lg overflow-hidden bg-gray-600 border border-gray-500">
          <button
            onClick={() => switchLoginMode('user')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              loginMode === 'user'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
            }`}
          >
            👤 User Login
          </button>
          <button
            onClick={() => switchLoginMode('admin')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              loginMode === 'admin'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
            }`}
          >
            🔑 Admin Login
          </button>
        </div>

        {/* User Login Form */}
        {loginMode === 'user' && (
          <form onSubmit={handleUserLogin} className="bg-gray-700 border border-gray-600 shadow-lg p-6 rounded-lg space-y-4">
            <h1 className="text-xl font-bold text-center text-white">👤 User Login</h1>
            <p className="text-sm text-gray-300 text-center">
              Enter your email to receive a magic link
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full p-3 rounded-md border border-gray-500 bg-gray-100 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!isSupabaseReady}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSupabaseReady ? 'Send Magic Link' : 'Loading...'}
            </button>
          </form>
        )}

        {/* Admin Login Form */}
        {loginMode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="bg-gray-700 border border-gray-600 shadow-lg p-6 rounded-lg space-y-4">
            <h1 className="text-xl font-bold text-center text-white">🔑 Admin Login</h1>
            <p className="text-sm text-gray-300 text-center">
              Admin access with email and password
            </p>
            
            {/* Show admin info if authenticated */}
            {isAuthenticated && admin && (
              <div className="bg-green-800 border border-green-600 p-3 rounded-md text-sm">
                <p className="text-green-200">✅ Logged in as {admin.admin_name}</p>
                <p className="text-green-300 text-xs">{admin.admin_email}</p>
              </div>
            )}
            
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={isAuthenticated}
              className="w-full p-3 rounded-md border border-gray-500 bg-gray-100 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed disabled:text-gray-600"
            />
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin password"
              required
              disabled={isAuthenticated}
              className="w-full p-3 rounded-md border border-gray-500 bg-gray-100 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed disabled:text-gray-600"
            />
            <button
              type="submit"
              disabled={adminLoading || isAuthenticated}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {adminLoading ? 'Logging in...' : isAuthenticated ? 'Logged In' : 'Admin Login'}
            </button>
          </form>
        )}

        {/* Messages */}
        {message && (
          <div className="mt-4 p-4 rounded-lg bg-gray-600 border border-gray-500">
            <p className="text-sm text-center text-white font-medium">{message}</p>
          </div>
        )}
        
        {/* Admin Error */}
        {adminError && (
          <div className="mt-4 p-4 rounded-lg bg-red-800 border border-red-600">
            <p className="text-sm text-center text-red-200 font-medium">{adminError}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-sm text-gray-400 text-center bg-gray-800 border border-gray-700 rounded-lg p-4">
          {loginMode === 'user' ? (
            <>
              <p className="font-medium">🔗 Magic link authentication</p>
              <p className="text-xs mt-1">Check your email for the login link</p>
            </>
          ) : (
            <>
              <p className="font-medium">🛡️ Admin panel access</p>
              <p className="text-xs mt-1">Contact system administrator for credentials</p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <ErrorBoundary>
      <LoginPageContent />
    </ErrorBoundary>
  );
}