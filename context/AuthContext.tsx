
// ==========================================
// FILE 2: context/AuthContext.tsx
// ==========================================

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { authAPI } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Interfaces ---

interface User {
  id: string;
  phoneNumber: string;
  gstNumber: string;
  companyName: string;
  userName?: string | null;
  userPhoto?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  address?: string | null;
  description?: string | null;
  category?: string | null;
  referralCode?: string;
  leadQuota?: number;
  consumedLeads?: number;
  followersCount?: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  sendOtp: (phoneNumber: string) => Promise<{ success: boolean }>;
  login: (phoneNumber: string, otp: string) => Promise<{ 
    isNewUser: boolean; 
    phoneNumber: string; 
    otp: string; 
  }>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

// --- Initial State and Context Creation ---

const initialAuthState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Context Provider Component ---

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(initialAuthState);

  // Check for persisted token on mount
  useEffect(() => {
    checkAuthToken();
  }, []);

  const checkAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userJson = await AsyncStorage.getItem('userData');
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error checking auth token:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // --- Auth Methods Implementation ---

  const sendOtp = async (phoneNumber: string) => {
    try {
      const response = await authAPI.sendOtp(phoneNumber);
      return { success: response.status === 'success' };
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  };

  const login = async (phoneNumber: string, otp: string) => {
    try {
      const response = await authAPI.verifyOtp(phoneNumber, otp);
      
      // Check if new user
      if (response.data.isNewUser) {
        // New user - return data for registration flow
        return { 
          isNewUser: true, 
          phoneNumber: response.data.phoneNumber || phoneNumber,
          otp 
        };
      }
      
      // Existing user - has token and company data
      const { token, company } = response.data;
      
      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(company));
      
      setState({
        user: company,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { isNewUser: false, phoneNumber, otp };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authAPI.register(data);
      
      // Backend returns: { statusCode, status, message, data: { token, company } }
      const { token, company } = response.data;
      
      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(company));
      
      setState({
        user: company,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear token from storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      // Reset state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    sendOtp,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook ---

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
