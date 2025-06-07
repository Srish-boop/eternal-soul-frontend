'use client';

import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';

interface ConfigStatus {
  supabase: {
    url: boolean;
    anonKey: boolean;
    connection: boolean;
  };
  backend: {
    reachable: boolean;
    endpoints: boolean;
  };
}

export default function ConfigCheck() {
  const [config, setConfig] = useState<ConfigStatus>({
    supabase: { url: false, anonKey: false, connection: false },
    backend: { reachable: false, endpoints: false }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setLoading(true);
    const newConfig: ConfigStatus = {
      supabase: { url: false, anonKey: false, connection: false },
      backend: { reachable: false, endpoints: false }
    };

    // Check Supabase environment variables
    newConfig.supabase.url = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    newConfig.supabase.anonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check Supabase connection
    if (newConfig.supabase.url && newConfig.supabase.anonKey) {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase.auth.getSession();
        newConfig.supabase.connection = !error;
      } catch (error) {
        console.error('Supabase connection test failed:', error);
      }
    }

    // Check backend connection
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.health}`, {
        method: 'GET',
        signal: AbortSignal.timeout(API_CONFIG.timeout) // Use config timeout
      });
      newConfig.backend.reachable = response.ok;
      newConfig.backend.endpoints = response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
    }

    setConfig(newConfig);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-blue-900 bg-opacity-50 border border-blue-600 text-blue-200 p-4 rounded mb-4">
        🔍 Checking configuration...
      </div>
    );
  }

  const hasIssues = 
    !config.supabase.url || 
    !config.supabase.anonKey || 
    !config.supabase.connection || 
    !config.backend.reachable;

  if (!hasIssues) {
    return null; // Don't show if everything is working
  }

  return (
    <div className="bg-yellow-900 bg-opacity-50 border border-yellow-600 text-yellow-200 p-4 rounded mb-4">
      <h3 className="font-bold mb-2">⚠️ Configuration Issues Detected</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Supabase Configuration:</strong>
          <ul className="ml-4 mt-1">
            <li className={config.supabase.url ? "text-green-400" : "text-red-400"}>
              {config.supabase.url ? "✅" : "❌"} NEXT_PUBLIC_SUPABASE_URL
            </li>
            <li className={config.supabase.anonKey ? "text-green-400" : "text-red-400"}>
              {config.supabase.anonKey ? "✅" : "❌"} NEXT_PUBLIC_SUPABASE_ANON_KEY
            </li>
            <li className={config.supabase.connection ? "text-green-400" : "text-red-400"}>
              {config.supabase.connection ? "✅" : "❌"} Connection Test
            </li>
          </ul>
        </div>

        <div>
          <strong>Backend Services:</strong>
          <ul className="ml-4 mt-1">
            <li className={config.backend.reachable ? "text-green-400" : "text-red-400"}>
              {config.backend.reachable ? "✅" : "❌"} API Server Reachable
            </li>
            <li className={config.backend.endpoints ? "text-green-400" : "text-red-400"}>
              {config.backend.endpoints ? "✅" : "❌"} Endpoints Available
            </li>
          </ul>
        </div>

        {(!config.supabase.url || !config.supabase.anonKey) && (
          <div className="mt-3 p-3 bg-gray-800 rounded">
            <p className="font-medium mb-1">To fix Supabase issues:</p>
            <ol className="list-decimal list-inside text-xs space-y-1">
              <li>Create a <code>.env.local</code> file in your frontend folder</li>
              <li>Add your Supabase URL and anon key:</li>
              <li className="ml-4">
                <code>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</code>
              </li>
              <li className="ml-4">
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</code>
              </li>
              <li>Restart your development server</li>
            </ol>
          </div>
        )}

        <button
          onClick={checkConfiguration}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded"
        >
          🔄 Recheck Configuration
        </button>
      </div>
    </div>
  );
} 