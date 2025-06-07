/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ REMOVED DANGEROUS FLAGS - Let TypeScript and ESLint catch errors
  // typescript: { ignoreBuildErrors: true },  // ❌ REMOVED
  // eslint: { ignoreDuringBuilds: true },     // ❌ REMOVED
  
  // ✅ ADD SECURITY HEADERS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig