// // services/apiClient.ts

// import axios, { 
//   AxiosInstance, 
//   AxiosRequestConfig, 
//   AxiosResponse, 
//   InternalAxiosRequestConfig
// } from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Config } from '../constants/config';
// import { router } from 'expo-router';

// // --- Configuration ---

// const API_BASE_URL: string = Config.API_BASE_URL;

// // --- Axios Instance Setup ---

// const api: AxiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: Config.API_TIMEOUT_MS, 
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// /**
//  * Request interceptor to add auth token from AsyncStorage
//  */
// api.interceptors.request.use(
//   async (config: InternalAxiosRequestConfig) => {
//     try {
//       const token = await AsyncStorage.getItem('authToken');
      
//       if (token) {
//         config.headers = config.headers || {};
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     } catch (error) {
//       console.error('Error reading auth token:', error);
//     }
    
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// /**
//  * Response interceptor to handle errors, specifically 401 Unauthorized
//  */
// api.interceptors.response.use(
//   (response: AxiosResponse) => response,
//   async (error) => {
//     if (error.response?.status === 401) {
//       console.warn("Unauthorized API call: Clearing token and redirecting to login.");
      
//       try {
//         await AsyncStorage.removeItem('authToken');
//         await AsyncStorage.removeItem('userData');
        
//         // Use expo-router for navigation
//         router.replace('/(auth)/phone-entry');
//       } catch (storageError) {
//         console.error('Error clearing storage:', storageError);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// // --- Core API Call Functions ---

// /**
//  * Generic API call function
//  */
// export const apiCall = async <T = any>(
//   endpoint: string, 
//   method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', 
//   data: any = null, 
//   requiresAuth: boolean = true
// ): Promise<T> => {
//   const instance: AxiosInstance = requiresAuth ? api : axios.create({ 
//     baseURL: API_BASE_URL,
//     timeout: Config.API_TIMEOUT_MS,
//     headers: {
//       'Content-Type': 'application/json',
//     }
//   });
  
//   try {
//     const config: AxiosRequestConfig = {
//       method: method.toLowerCase(),
//       url: endpoint,
//     };

//     if (data && method.toUpperCase() !== 'GET') {
//       config.data = data; 
//     }

//     if (method.toUpperCase() === 'GET' && data) {
//       config.params = data; 
//     }

//     const response: AxiosResponse<T> = await instance(config) as AxiosResponse<T>;
//     return response.data;
//   } catch (error: any) {
//     // Enhanced error handling
//     if (error.response) {
//       // Server responded with error
//       const errorMessage = error.response.data?.message || 
//                           error.response.data?.errors?.[0]?.message ||
//                           `Server error: ${error.response.status}`;
//       throw new Error(errorMessage);
//     } else if (error.request) {
//       // Request made but no response
//       throw new Error('Network error: Unable to reach server. Please check your connection.');
//     } else {
//       // Something else happened
//       throw new Error(error.message || 'An unexpected error occurred');
//     }
//   }
// };

// /**
//  * File upload helper function using FormData
//  */
// export const uploadFile = async <T = any>(
//   endpoint: string, 
//   file: any, 
//   additionalData: Record<string, any> = {}, 
//   onProgress: ((percent: number) => void) | null = null
// ): Promise<T> => {
//   try {
//     const formData = new FormData();
//     formData.append('file', file);
    
//     Object.keys(additionalData).forEach(key => {
//       formData.append(key, additionalData[key]);
//     });

//     const config: AxiosRequestConfig = {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//       onUploadProgress: onProgress ? (progressEvent: any) => {
//         if (progressEvent.total) { 
//           const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           onProgress(percentCompleted);
//         }
//       } : undefined,
//     };

//     const response: AxiosResponse<T> = await api.post(endpoint, formData, config) as AxiosResponse<T>;
//     return response.data;
//   } catch (error: any) {
//     const errorMessage = error.response?.data?.message || 
//                         error.message || 
//                         'Upload failed';
//     throw new Error(errorMessage);
//   }
// };

// export default api;



// services/apiClient.ts - SIMPLE NO-CRASH VERSION

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  InternalAxiosRequestConfig
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';
import { router } from 'expo-router';

const API_BASE_URL: string = Config.API_BASE_URL;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: Config.API_TIMEOUT_MS, 
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Silent fail
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
        router.replace('/(auth)/phone-entry');
      } catch (storageError) {
        // Silent fail
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Safe error message extraction
 */
const extractErrorMessage = (error: any): string => {
  try {
    // Try response.data.message
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    // Try response.data.errors array
    if (error?.response?.data?.errors?.[0]?.message) {
      return error.response.data.errors[0].message;
    }
    
    // Try response.data.error
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    
    // Try error.message
    if (error?.message) {
      return error.message;
    }
    
    // Network error
    if (error?.request && !error?.response) {
      return 'Network error. Please check your connection.';
    }
    
    // Default
    return 'Something went wrong. Please try again.';
  } catch (e) {
    return 'Something went wrong. Please try again.';
  }
};

export const apiCall = async <T = any>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', 
  data: any = null, 
  requiresAuth: boolean = true
): Promise<T> => {
  const instance: AxiosInstance = requiresAuth ? api : axios.create({ 
    baseURL: API_BASE_URL,
    timeout: Config.API_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  try {
    const config: AxiosRequestConfig = {
      method: method.toLowerCase(),
      url: endpoint,
    };

    if (data && method.toUpperCase() !== 'GET') {
      config.data = data; 
    }

    if (method.toUpperCase() === 'GET' && data) {
      config.params = data; 
    }

    const response: AxiosResponse<T> = await instance(config) as AxiosResponse<T>;
    return response.data;
  } catch (error: any) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(errorMessage);
  }
};

export const uploadFile = async <T = any>(
  endpoint: string, 
  file: any, 
  additionalData: Record<string, any> = {}, 
  onProgress: ((percent: number) => void) | null = null
): Promise<T> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress ? (progressEvent: any) => {
        if (progressEvent.total) { 
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      } : undefined,
    };

    const response: AxiosResponse<T> = await api.post(endpoint, formData, config) as AxiosResponse<T>;
    return response.data;
  } catch (error: any) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(errorMessage);
  }
};

export default api;
