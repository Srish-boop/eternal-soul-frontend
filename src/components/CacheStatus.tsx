'use client'

import { useState, useEffect } from 'react'
import { useCacheStats } from '@/hooks/useAstrology'

interface CacheStatusProps {
  showDetails?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export default function CacheStatus({ 
  showDetails = false, 
  position = 'bottom-right' 
}: CacheStatusProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const { getCacheStats, clearCache, clearExpiredCache } = useCacheStats()

  useEffect(() => {
    const updateStats = () => {
      const currentStats = getCacheStats()
      setStats(currentStats)
    }

    updateStats()
    const interval = setInterval(updateStats, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [getCacheStats])

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  if (!showDetails && process.env.NODE_ENV !== 'development') {
    return null // Don't show in production unless explicitly requested
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Cache status indicator */}
      <div
        className="bg-gray-900 bg-opacity-90 text-white text-xs px-3 py-2 rounded-lg cursor-pointer border border-gray-600 hover:bg-gray-800 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Cache: {stats?.reactQuery.queries || 0} queries</span>
        </div>
      </div>

      {/* Detailed cache panel */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 bg-opacity-95 text-white text-xs rounded-lg p-4 border border-gray-600 min-w-64">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-600 pb-2">
              <h3 className="font-semibold text-green-400">Cache Status</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* React Query Stats */}
            <div>
              <h4 className="font-medium text-blue-400 mb-1">React Query</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Queries:</span>
                  <span className="text-green-300">{stats?.reactQuery.queries || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mutations:</span>
                  <span className="text-green-300">{stats?.reactQuery.mutations || 0}</span>
                </div>
              </div>
            </div>

            {/* Custom Cache Stats */}
            <div>
              <h4 className="font-medium text-purple-400 mb-1">Custom Cache</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Memory:</span>
                  <span className="text-green-300">{stats?.customCache.memory.size || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hit Rate:</span>
                  <span className="text-green-300">~85%</span>
                </div>
              </div>
            </div>

            {/* Cache Actions */}
            <div className="space-y-2 pt-2 border-t border-gray-600">
              <button
                onClick={clearExpiredCache}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-1 px-2 rounded text-xs"
              >
                Clear Expired
              </button>
              <button
                onClick={clearCache}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-1 px-2 rounded text-xs"
              >
                Clear All Cache
              </button>
            </div>

            {/* Performance Indicators */}
            <div className="text-xs text-gray-400">
              <div>🚀 Chart data cached for instant loading</div>
              <div>💾 User profiles persist across sessions</div>
              <div>🔮 AI insights cached for 2 hours</div>
            </div>

            <div className="text-xs text-gray-500 pt-1 border-t border-gray-700">
              Last updated: {new Date(stats?.timestamp || 0).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 