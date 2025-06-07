/**
 * Admin authentication hook for cookie-based backend sessions with localStorage frontend state
 */

import { useState, useEffect } from 'react';
import { adminApiClient, type AdminLoginResponse } from '@/lib/adminApiClient';

interface AdminProfile {
  admin_email: string;
  admin_name: string;
  default_birth_data?: any;
}

interface AdminAuthState {
  isAuthenticated: boolean;
  admin: AdminProfile | null;
  isLoading: boolean;
  error: string | null;
}

const ADMIN_STORAGE_KEY = 'eternal_soul_admin_session';

export function useAdminAuth() {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    admin: null,
    isLoading: true,
    error: null,
  });

  // Check for existing admin session on mount
  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      console.log('🔍 Checking admin session (localStorage only)...');
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        console.log('❌ localStorage not available (SSR or browser issue)');
        setAuthState({
          isAuthenticated: false,
          admin: null,
          isLoading: false,
          error: null,
        });
        return;
      }
      
      const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
      console.log('🔍 Found stored admin data:', storedAdmin);
      
      if (storedAdmin) {
        const adminData = JSON.parse(storedAdmin);
        console.log('✅ Admin data found in localStorage:', adminData);
        
        // Trust localStorage data, don't validate with backend on every load
        console.log('✅ Using stored admin session');
        setAuthState({
          isAuthenticated: true,
          admin: adminData,
          isLoading: false,
          error: null,
        });
      } else {
        console.log('❌ No admin session found in localStorage');
        setAuthState({
          isAuthenticated: false,
          admin: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      console.error('💥 Error checking admin session:', error);
      // Clear localStorage on any error
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      }
      setAuthState({
        isAuthenticated: false,
        admin: null,
        isLoading: false,
        error: null,
      });
    }
  };

  const login = async (adminEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Starting admin login for:', adminEmail);
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // This call will set the session cookie via credentials: 'include'
      const response: AdminLoginResponse = await adminApiClient.login(adminEmail, password);
      console.log('✅ Admin login API response:', response);
      
      // Store admin data in localStorage for frontend state
      const adminData: AdminProfile = {
        admin_email: response.admin_email,
        admin_name: response.admin_name,
        default_birth_data: response.default_birth_data,
      };
      
      console.log('💾 Storing admin data in localStorage (session cookie set by backend)');
      
      // Safely store in localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
        console.log('✅ Admin data stored in localStorage');
      } else {
        console.error('❌ localStorage not available - cannot store admin session');
      }

      setAuthState({
        isAuthenticated: true,
        admin: adminData,
        isLoading: false,
        error: null,
      });
      
      console.log('✅ Admin login successful, state updated, session cookie should be set');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Admin login failed:', error);
      const errorMessage = error.userMessage || error.message || 'Login failed';
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    console.log('🚪 Admin logout - clearing session');
    
    // Clear localStorage safely
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      console.log('✅ Admin session cleared from localStorage');
    }
    
    // Note: Session cookie will be handled by backend or expire naturally
    // We could add a logout endpoint call here if needed
    
    // Clear session state
    setAuthState({
      isAuthenticated: false,
      admin: null,
      isLoading: false,
      error: null,
    });
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    // State
    isAuthenticated: authState.isAuthenticated,
    admin: authState.admin,
    isLoading: authState.isLoading,
    error: authState.error,
    
    // Actions
    login,
    logout,
    checkAdminSession,
    clearError,
  };
}