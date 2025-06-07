export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000',
  endpoints: {
    natalChart: '/score-natal',
    reflections: '/generate-reflections',
    transit: '/score-transit',
    compatibility: '/compare-users',
    health: '/debug-ephe-files',
    // Admin endpoints
    adminLogin: '/admin-login',
    adminUsers: '/admin/users',
    adminCreateMockUser: '/admin/create-mock-user',
    adminUserCompleteData: '/admin/user-complete-data',
    adminAnalytics: '/admin/analytics',
  },
  timeout: 5000,
}; 