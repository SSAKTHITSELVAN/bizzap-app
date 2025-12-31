// context/AuthContext.tsx - CRASH-PROOF VERSION

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react';
import { authAPI } from '../services/auth';

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

const initialAuthState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Safe error message extraction helper
const extractErrorMessage = (error: any, defaultMessage: string): string => {
  try {
    // Check for various error message locations
    if (error?.message && typeof error.message === 'string') {
      return error.message;
    }
    
    if (error?.response?.data?.message && typeof error.response.data.message === 'string') {
      return error.response.data.message;
    }
    
    if (error?.response?.data?.error && typeof error.response.data.error === 'string') {
      return error.response.data.error;
    }
    
    if (error?.response?.data?.errors?.[0]?.message) {
      return error.response.data.errors[0].message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return defaultMessage;
  } catch (e) {
    console.error('Error extracting message:', e);
    return defaultMessage;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(initialAuthState);

  useEffect(() => {
    checkAuthToken();
  }, []);

  const checkAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userJson = await AsyncStorage.getItem('userData');
      
      if (token && userJson) {
        try {
          const user = JSON.parse(userJson);
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (parseError) {
          console.error('❌ Error parsing user data:', parseError);
          // Clear corrupted data
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userData');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('❌ Error checking auth token:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const sendOtp = async (phoneNumber: string) => {
    try {
      console.log('📤 Sending OTP to:', phoneNumber);
      
      if (!phoneNumber || phoneNumber.trim().length === 0) {
        throw new Error('Phone number is required');
      }
      
      const response = await authAPI.sendOtp(phoneNumber);
      console.log('✅ OTP sent successfully');
      
      return { success: response?.status === 'success' };
    } catch (error: any) {
      console.error('❌ Send OTP error:', error);
      
      const errorMessage = extractErrorMessage(
        error,
        'Failed to send OTP. Please try again.'
      );
      
      throw new Error(errorMessage);
    }
  };

  const login = async (phoneNumber: string, otp: string) => {
    try {
      console.log('🔐 Attempting login:', { phoneNumber, otp: '******' });
      
      // Validate inputs
      if (!phoneNumber || phoneNumber.trim().length === 0) {
        throw new Error('Phone number is required');
      }
      
      if (!otp || otp.trim().length !== 6) {
        throw new Error('Invalid OTP format');
      }
      
      const response = await authAPI.verifyOtp(phoneNumber, otp);
      
      console.log('📦 Verify OTP response:', {
        statusCode: response?.statusCode,
        status: response?.status,
        isNewUser: response?.data?.isNewUser,
        hasToken: !!response?.data?.token,
        hasCompany: !!response?.data?.company
      });
      
      // Validate response structure
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Check if new user
      if (response.data.isNewUser) {
        console.log('👤 New user detected');
        return { 
          isNewUser: true, 
          phoneNumber: response.data.phoneNumber || phoneNumber,
          otp 
        };
      }
      
      // Existing user - validate required data
      const { token, company } = response.data;
      
      if (!token || !company) {
        throw new Error('Incomplete response from server');
      }
      
      console.log('💾 Storing auth data for existing user');
      
      // Store token and user data
      try {
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(company));
      } catch (storageError) {
        console.error('❌ Storage error:', storageError);
        throw new Error('Failed to save login data');
      }
      
      setState({
        user: company,
        isAuthenticated: true,
        isLoading: false,
      });
      
      console.log('✅ Login successful');
      
      return { isNewUser: false, phoneNumber, otp };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      const errorMessage = extractErrorMessage(
        error,
        'Login failed. Please try again.'
      );
      
      throw new Error(errorMessage);
    }
  };

  const register = async (data: any) => {
    try {
      console.log('📝 Starting registration process');
      
      // Validate required data
      if (!data) {
        throw new Error('Registration data is required');
      }
      
      const response = await authAPI.register(data);
      
      console.log('📦 Registration response:', {
        statusCode: response?.statusCode,
        status: response?.status,
        hasToken: !!response?.data?.token,
        hasCompany: !!response?.data?.company
      });
      
      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      const { token, company } = response.data;
      
      if (!token || !company) {
        throw new Error('Incomplete response from server');
      }
      
      console.log('💾 Storing registration data');
      
      // Store token and user data
      try {
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(company));
      } catch (storageError) {
        console.error('❌ Storage error:', storageError);
        throw new Error('Failed to save registration data');
      }
      
      setState({
        user: company,
        isAuthenticated: true,
        isLoading: false,
      });
      
      console.log('✅ Registration successful');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      const errorMessage = extractErrorMessage(
        error,
        'Registration failed. Please try again.'
      );
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      // Clear all auth-related storage
      try {
        await AsyncStorage.multiRemove(['authToken', 'auth_token', 'userData']);
      } catch (storageError) {
        console.error('❌ Storage clear error:', storageError);
        // Continue with logout even if storage clear fails
      }

      // Reset state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Don't throw - ensure logout completes
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};