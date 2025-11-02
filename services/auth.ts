// services/auth.ts - FIXED FILE UPLOAD HANDLING

import { apiCall } from './apiClient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';
import { Platform } from 'react-native';

// --- Interfaces for Auth ---

interface Company {
  id: string;
  phoneNumber: string;
  gstNumber: string;
  companyName: string;
  logo?: string | null;
  address?: string | null;
  description?: string | null;
  category?: string | null;
  referralCode?: string;
  leadQuota?: number;
  consumedLeads?: number;
  postingQuota?: number;
  postedLeads?: number;
  currentTier?: string;
  hasVerifiedBadge?: boolean;
  followersCount?: number;
  isDeleted: boolean;
  createdAt: string;
  lastLoginDate?: string | null;
  updatedAt: string;
  userName?: string | null;
  userPhoto?: string | null;
  coverImage?: string | null;
  registeredAddress?: string | null;
  about?: string | null;
  operationalAddress?: string | null;
}

interface ApiResponse<T> {
  statusCode: number;
  status: string;
  message: string;
  data: T;
  errors: any;
}

interface SendOtpResponse {
  phoneNumber: string;
}

interface VerifyOtpResponse {
  token: string;
  company: Company;
  isNewUser: boolean;
  phoneNumber?: string;
}

interface RegisterResponse {
  token: string;
  company: Company;
}

interface ImageAsset {
  uri: string;
  type: string;
  name: string;
}

interface RegisterData {
  phoneNumber: string;
  otp: string;
  gstNumber: string;
  companyName: string;
  userName: string;
  userPhoto?: ImageAsset | null;
  logo?: ImageAsset | null;
  coverImage?: ImageAsset | null;
  address?: string;
  description?: string;
  referredBy?: string;
  category?: string;
}

/**
 * Register with multipart/form-data for file uploads
 * FIXED: Properly handles file uploads similar to create-post
 */
const registerWithFiles = async (data: RegisterData): Promise<ApiResponse<RegisterResponse>> => {
  try {
    const formData = new FormData();
    
    // Add required text fields
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('otp', data.otp);
    formData.append('gstNumber', data.gstNumber);
    formData.append('companyName', data.companyName);
    formData.append('userName', data.userName);
    
    // Add optional text fields
    if (data.address) formData.append('address', data.address);
    if (data.description) formData.append('description', data.description);
    if (data.referredBy) formData.append('referredBy', data.referredBy);
    if (data.category) formData.append('category', data.category);

    // Add file fields - FIXED: Properly handle both Web and Native
    if (data.userPhoto) {
      if (Platform.OS === 'web') {
        // Web: Convert blob to File
        const response = await fetch(data.userPhoto.uri);
        const blob = await response.blob();
        const file = new File([blob], data.userPhoto.name, { type: data.userPhoto.type });
        formData.append('userPhoto', file);
        console.log('✅ Added userPhoto (Web):', data.userPhoto.name);
      } else {
        // React Native: Use object format
        formData.append('userPhoto', {
          uri: data.userPhoto.uri,
          type: data.userPhoto.type,
          name: data.userPhoto.name,
        } as any);
        console.log('✅ Added userPhoto (Native):', data.userPhoto.name);
      }
    }

    if (data.logo) {
      if (Platform.OS === 'web') {
        const response = await fetch(data.logo.uri);
        const blob = await response.blob();
        const file = new File([blob], data.logo.name, { type: data.logo.type });
        formData.append('logo', file);
        console.log('✅ Added logo (Web):', data.logo.name);
      } else {
        formData.append('logo', {
          uri: data.logo.uri,
          type: data.logo.type,
          name: data.logo.name,
        } as any);
        console.log('✅ Added logo (Native):', data.logo.name);
      }
    }

    if (data.coverImage) {
      if (Platform.OS === 'web') {
        const response = await fetch(data.coverImage.uri);
        const blob = await response.blob();
        const file = new File([blob], data.coverImage.name, { type: data.coverImage.type });
        formData.append('coverImage', file);
        console.log('✅ Added coverImage (Web):', data.coverImage.name);
      } else {
        formData.append('coverImage', {
          uri: data.coverImage.uri,
          type: data.coverImage.type,
          name: data.coverImage.name,
        } as any);
        console.log('✅ Added coverImage (Native):', data.coverImage.name);
      }
    }

    console.log('📤 Sending registration to:', `${Config.API_BASE_URL}/auth/register`);

    // Make API call
    const response = await axios.post(
      `${Config.API_BASE_URL}/auth/register`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for file uploads
      }
    );

    console.log('✅ Registration successful:', {
      statusCode: response.data.statusCode,
      companyName: response.data.data?.company?.companyName,
      hasLogo: !!response.data.data?.company?.logo,
      hasUserPhoto: !!response.data.data?.company?.userPhoto,
      hasCoverImage: !!response.data.data?.company?.coverImage,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.message || 
                          error.response.data?.errors?.[0]?.message ||
                          `Server error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Network error: Unable to reach server. Please check your connection.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

/**
 * Auth API calls.
 */
export const authAPI = {
  sendOtp: (phoneNumber: string): Promise<ApiResponse<SendOtpResponse>> => 
    apiCall('auth/send-otp', 'POST', { phoneNumber }, false),

  verifyOtp: (phoneNumber: string, otp: string): Promise<ApiResponse<VerifyOtpResponse>> => 
    apiCall('auth/verify-otp', 'POST', { phoneNumber, otp }, false),

  register: registerWithFiles,
};