// // services/leads.ts

// import { apiCall, uploadFile } from './apiClient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import api from './apiClient'; // Import the axios instance

// // --- Interfaces for Leads ---

// interface Company {
//   id: string;
//   phoneNumber: string;
//   gstNumber: string;
//   companyName: string;
//   logo: string;
//   address: string;
//   description: string;
//   category: string | null;
//   referralCode: string;
//   leadQuota: number;
//   consumedLeads: number;
//   followersCount: number;
//   isDeleted: boolean;
//   createdAt: string;
//   lastLoginDate: string | null;
//   updatedAt: string;
//   userName: string | null;
//   userPhoto: string | null;
//   coverImage: string | null;
//   registeredAddress: string | null;
//   about: string | null;
//   operationalAddress: string | null;
// }

// // --- Interface for Consumed Leads ---
// interface ConsumedLeadResponse {
//   id: string;
//   companyId: string;
//   leadId: string;
//   consumedAt: string;
//   lead: {
//     id: string;
//     title: string;
//     description: string;
//     company: {
//       id: string;
//       phoneNumber: string;
//       companyName: string;
//       logo: string | null;
//     };
//     companyId: string;
//   };
// }

// interface Lead {
//   id: string;
//   title: string;
//   description: string;
//   imageKey: string | null;
//   imageUrl: string | null;
//   imageName: string | null;
//   imageSize: number | null;
//   imageMimeType: string | null;
//   budget: string | null;
//   quantity: string | null;
//   location: string | null;
//   isActive: boolean;
//   reasonForDeactivation: string | null;
//   consumedCount: number;
//   viewCount: number;
//   isDeleted: boolean;
//   createdAt: string;
//   updatedAt: string;
//   company: Company;
//   companyId: string;
//   // Computed property for compatibility
//   image?: string | null;
// }

// interface CreateLeadData {
//   title: string;
//   description: string;
//   image?: any; // File object for upload
//   budget?: string;
//   quantity?: string;
//   location?: string;
// }

// interface UpdateLeadData {
//   title?: string;
//   description?: string;
//   image?: any; // File object for upload
//   budget?: string;
//   quantity?: string;
//   location?: string;
// }

// interface ToggleStatusData {
//   isActive: boolean;
// }

// interface DeactivateLeadData {
//   reasonForDeactivation: string;
// }

// interface ConsumeLeadResponse {
//   success: boolean;
//   contact: string;
// }

// interface ApiResponse<T> {
//   statusCode: number;
//   status: string;
//   message: string;
//   data: T;
//   errors: null | any[];
// }

// // --- Subscription Interfaces ---

// interface SubscriptionPlan {
//   tier: string;
//   price: number;
//   leadQuota: number;
//   postingQuota: number;
//   hasVerifiedBadge: boolean;
//   hasVerifiedLeadAccess: boolean;
// }

// interface CurrentSubscription {
//   id: string;
//   companyId: string;
//   tier: string;
//   status: string;
//   razorpaySubscriptionId: string | null;
//   razorpayPaymentId: string | null;
//   razorpayOrderId: string | null;
//   startDate: string;
//   endDate: string | null;
//   leadQuota: number;
//   consumedLeads: number;
//   postingQuota: number;
//   postedLeads: number;
//   hasVerifiedBadge: boolean;
//   hasVerifiedLeadAccess: boolean;
//   createdAt: string;
//   updatedAt: string;
// }

// interface CreateOrderResponse {
//   orderId: string;
//   amount: number;
//   currency: string;
//   planDetails?: SubscriptionPlan;
//   leadsCount?: number;
//   pricePerLead?: number;
//   razorpayKeyId: string;
// }

// interface PaymentVerification {
//   razorpayOrderId: string;
//   razorpayPaymentId: string;
//   razorpaySignature: string;
// }

// interface PayAsYouGoVerifyResponse {
//   leadQuota: number;
//   consumedLeads: number;
// }

// /**
//  * Helper function to normalize lead data
//  * Maps imageUrl to image for backward compatibility
//  */
// const normalizeLead = (lead: Lead): Lead => ({
//   ...lead,
//   image: lead.imageUrl || lead.imageKey || null,
// });

// /**
//  * Helper function to normalize array of leads
//  */
// const normalizeLeads = (leads: Lead[]): Lead[] => 
//   leads.map(normalizeLead);

// /**
//  * Leads API calls.
//  */
// export const leadsAPI = {
//   /**
//    * Get all public active leads (no auth required)
//    * This is the main method for fetching leads
//    */
//   getAllLeads: async (): Promise<ApiResponse<Lead[]>> => {
//     const response = await apiCall('leads/public', 'GET', null, false);
//     return {
//       ...response,
//       data: normalizeLeads(response.data),
//     };
//   },

//   /**
//    * @deprecated Use getAllLeads() instead
//    * Kept for backward compatibility
//    */
//   getAllPublicLeads: async (): Promise<ApiResponse<Lead[]>> => {
//     const response = await apiCall('leads/public', 'GET', null, false);
//     return {
//       ...response,
//       data: normalizeLeads(response.data),
//     };
//   },

//   /**
//    * Get a single public lead by ID (no auth required)
//    */
//   getPublicLeadById: async (id: string): Promise<ApiResponse<Lead>> => {
//     const response = await apiCall(`leads/public/${id}`, 'GET', null, false);
//     return {
//       ...response,
//       data: normalizeLead(response.data),
//     };
//   },

//   /**
//    * Get user's active leads (auth required)
//    */
//   getMyActiveLeads: async (): Promise<ApiResponse<Lead[]>> => {
//     const response = await apiCall('leads/my-leads/active');
//     return {
//       ...response,
//       data: normalizeLeads(response.data),
//     };
//   },

//   /**
//    * Get user's inactive leads (auth required)
//    */
//   getMyInactiveLeads: async (): Promise<ApiResponse<Lead[]>> => {
//     const response = await apiCall('leads/my-leads/inactive');
//     return {
//       ...response,
//       data: normalizeLeads(response.data),
//     };
//   },

//   /**
//    * Create a new lead with optional image upload (auth required)
//    * FIXED: Uses 'image' key instead of 'file' for multipart upload
//    */
//   createLead: async (data: CreateLeadData): Promise<ApiResponse<Lead>> => {
//     let response;
    
//     if (data.image) {
//       try {
//         const formData = new FormData();
        
//         // CRITICAL: Append image with key 'image' (backend expects this, not 'file')
//         formData.append('image', data.image as any);
        
//         // Append other required fields
//         formData.append('title', data.title);
//         formData.append('description', data.description);
        
//         // Append optional fields
//         if (data.budget) formData.append('budget', data.budget);
//         if (data.quantity) formData.append('quantity', data.quantity);
//         if (data.location) formData.append('location', data.location);
        
//         console.log('📤 Uploading lead with FormData:', {
//           title: data.title,
//           hasImage: true,
//         });
        
//         // Use axios instance directly to bypass uploadFile's 'file' key
//         const axiosResponse = await api.post('leads', formData, {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//         });
        
//         response = axiosResponse.data;
        
//       } catch (error: any) {
//         console.error('❌ Lead creation with image failed:', error);
//         const errorMessage = error.response?.data?.message || 
//                             error.message || 
//                             'Failed to create lead with image';
//         throw new Error(errorMessage);
//       }
//     } else {
//       // Use regular apiCall for JSON (no image)
//       response = await apiCall('leads', 'POST', data);
//     }

//     return {
//       ...response,
//       data: normalizeLead(response.data),
//     };
//   },

//   /**
//    * Update a lead with optional image upload (auth required)
//    */
//   updateLead: async (id: string, data: UpdateLeadData): Promise<ApiResponse<Lead>> => {
//     let response;
    
//     if (data.image) {
//       // Use uploadFile for multipart/form-data
//       const formData: Record<string, any> = {};
      
//       if (data.title) formData.title = data.title;
//       if (data.description) formData.description = data.description;
//       if (data.budget) formData.budget = data.budget;
//       if (data.quantity) formData.quantity = data.quantity;
//       if (data.location) formData.location = data.location;
      
//       response = await uploadFile(`leads/${id}`, data.image, formData);
//     } else {
//       // Use regular apiCall for JSON
//       response = await apiCall(`leads/${id}`, 'PATCH', data);
//     }

//     return {
//       ...response,
//       data: normalizeLead(response.data),
//     };
//   },

//   /**
//    * Toggle lead active/inactive status (auth required)
//    */
//   toggleLeadStatus: async (id: string, isActive: boolean): Promise<ApiResponse<Lead>> => {
//     const response = await apiCall(`leads/${id}/toggle-status`, 'PATCH', { isActive });
//     return {
//       ...response,
//       data: normalizeLead(response.data),
//     };
//   },

//   /**
//    * Deactivate a lead with reason (auth required)
//    */
//   deactivateLead: async (id: string, data: DeactivateLeadData): Promise<ApiResponse<Lead>> => {
//     const response = await apiCall(`leads/${id}/deactivate`, 'PATCH', data);
//     return {
//       ...response,
//       data: normalizeLead(response.data),
//     };
//   },

//   /**
//    * Delete a lead (auth required)
//    */
//   deleteLead: (id: string): Promise<ApiResponse<{ message: string; data: null }>> => 
//     apiCall(`leads/${id}`, 'DELETE'),

//   /**
//    * Consume a lead (auth required)
//    * Returns contact information after consuming
//    */
//   consumeLead: (id: string): Promise<ApiResponse<ConsumeLeadResponse>> => 
//     apiCall(`leads/${id}/consume`, 'POST'),
// };

// /**
//  * Subscription API calls
//  */
// export const subscriptionAPI = {
//   /**
//    * Get current subscription (auth required)
//    */
//   getCurrentSubscription: async (): Promise<ApiResponse<CurrentSubscription>> => {
//     return apiCall('companies/subscription/current', 'GET');
//   },

//   /**
//    * Get all available subscription plans (no auth required)
//    */
//   getPlans: async (): Promise<ApiResponse<Record<string, SubscriptionPlan>>> => {
//     return apiCall('companies/subscription/plans', 'GET', null, false);
//   },

//   /**
//    * Create subscription order (auth required)
//    */
//   createSubscriptionOrder: async (tier: string): Promise<ApiResponse<CreateOrderResponse>> => {
//     return apiCall('companies/subscription/create-order', 'POST', { tier });
//   },

//   /**
//    * Verify subscription payment (auth required)
//    */
//   verifySubscriptionPayment: async (data: PaymentVerification): Promise<{ message: string; data: CurrentSubscription }> => {
//     return apiCall('companies/subscription/verify-payment', 'POST', data);
//   },

//   /**
//    * Create pay-as-you-go order (auth required)
//    */
//   createPayAsYouGoOrder: async (leadsCount: number): Promise<ApiResponse<CreateOrderResponse>> => {
//     return apiCall('companies/pay-as-you-go/create-order', 'POST', { leadsCount });
//   },

//   /**
//    * Verify pay-as-you-go payment (auth required)
//    */
//   verifyPayAsYouGoPayment: async (data: PaymentVerification): Promise<{ message: string; data: PayAsYouGoVerifyResponse }> => {
//     return apiCall('companies/pay-as-you-go/verify-payment', 'POST', data);
//   },

//     /**
//    * Get all consumed leads by the current user (auth required)
//    */
//   getConsumedLeads: async (): Promise<ApiResponse<ConsumedLeadResponse[]>> => {
//     return apiCall('companies/consumed-leads');
//   },
// };

// // Export types for use in components
// export type { 
//   Lead, 
//   Company, 
//   CreateLeadData, 
//   UpdateLeadData,
//   ToggleStatusData,
//   DeactivateLeadData,
//   ConsumeLeadResponse, 
//   ApiResponse,
//   SubscriptionPlan,
//   CurrentSubscription,
//   CreateOrderResponse,
//   PaymentVerification,
//   PayAsYouGoVerifyResponse,
//   ConsumedLeadResponse
// };



// services/leads.ts - COMPLETE UPDATED VERSION

import { apiCall, uploadFile } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './apiClient';
import axios from 'axios';
import { Config } from '../constants/config';
import { Platform } from 'react-native';

// --- Interfaces for Leads ---

interface Company {
  id: string;
  phoneNumber: string;
  gstNumber: string;
  companyName: string;
  logo: string;
  address: string;
  description: string;
  category: string | null;
  referralCode: string;
  leadQuota: number;
  consumedLeads: number;
  followersCount: number;
  isDeleted: boolean;
  createdAt: string;
  lastLoginDate: string | null;
  updatedAt: string;
  userName: string | null;
  userPhoto: string | null;
  coverImage: string | null;
  registeredAddress: string | null;
  about: string | null;
  operationalAddress: string | null;
}

// --- Interface for Consumed Leads ---
interface ConsumedLeadResponse {
  id: string;
  companyId: string;
  leadId: string;
  consumedAt: string;
  lead: {
    id: string;
    title: string;
    description: string;
    company: {
      id: string;
      phoneNumber: string;
      companyName: string;
      logo: string | null;
    };
    companyId: string;
  };
}

interface Lead {
  id: string;
  title: string;
  description: string;
  imageKey: string | null;
  imageUrl: string | null;
  imageName: string | null;
  imageSize: number | null;
  imageMimeType: string | null;
  budget: string | null;
  quantity: string | null;
  location: string | null;
  isActive: boolean;
  reasonForDeactivation: string | null;
  consumedCount: number;
  viewCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  company: Company;
  companyId: string;
  // Computed property for compatibility
  image?: string | null;
}

interface CreateLeadData {
  title: string;
  description: string;
  image?: any; // File object for upload
  budget?: string;
  quantity?: string;
  location?: string;
}

interface UpdateLeadData {
  title?: string;
  description?: string;
  image?: any; // File object for upload
  budget?: string;
  quantity?: string;
  location?: string;
}

interface ToggleStatusData {
  isActive: boolean;
}

interface DeactivateLeadData {
  reasonForDeactivation: string;
}

interface ConsumeLeadResponse {
  success: boolean;
  contact: string;
}

interface ApiResponse<T> {
  statusCode: number;
  status: string;
  message: string;
  data: T;
  errors: null | any[];
}

// --- Subscription Interfaces ---

interface SubscriptionPlan {
  tier: string;
  price: number;
  leadQuota: number;
  postingQuota: number;
  hasVerifiedBadge: boolean;
  hasVerifiedLeadAccess: boolean;
}

interface CurrentSubscription {
  id: string;
  companyId: string;
  tier: string;
  status: string;
  razorpaySubscriptionId: string | null;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  startDate: string;
  endDate: string | null;
  leadQuota: number;
  consumedLeads: number;
  postingQuota: number;
  postedLeads: number;
  hasVerifiedBadge: boolean;
  hasVerifiedLeadAccess: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  planDetails?: SubscriptionPlan;
  leadsCount?: number;
  pricePerLead?: number;
  razorpayKeyId: string;
}

interface PaymentVerification {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

interface PayAsYouGoVerifyResponse {
  leadQuota: number;
  consumedLeads: number;
}

/**
 * Helper function to normalize lead data
 * Maps imageUrl to image for backward compatibility
 */
const normalizeLead = (lead: Lead): Lead => ({
  ...lead,
  image: lead.imageUrl || lead.imageKey || null,
});

/**
 * Helper function to normalize array of leads
 */
const normalizeLeads = (leads: Lead[]): Lead[] => 
  leads.map(normalizeLead);

/**
 * Leads API calls.
 */
export const leadsAPI = {
  /**
   * Get all public active leads (no auth required)
   * This is the main method for fetching leads
   */
  getAllLeads: async (): Promise<ApiResponse<Lead[]>> => {
    const response = await apiCall('leads/public', 'GET', null, false);
    return {
      ...response,
      data: normalizeLeads(response.data),
    };
  },

  /**
   * @deprecated Use getAllLeads() instead
   * Kept for backward compatibility
   */
  getAllPublicLeads: async (): Promise<ApiResponse<Lead[]>> => {
    const response = await apiCall('leads/public', 'GET', null, false);
    return {
      ...response,
      data: normalizeLeads(response.data),
    };
  },

  /**
   * Get a single public lead by ID (no auth required)
   */
  getPublicLeadById: async (id: string): Promise<ApiResponse<Lead>> => {
    const response = await apiCall(`leads/public/${id}`, 'GET', null, false);
    return {
      ...response,
      data: normalizeLead(response.data),
    };
  },

  /**
   * Get user's active leads (auth required)
   */
  getMyActiveLeads: async (): Promise<ApiResponse<Lead[]>> => {
    const response = await apiCall('leads/my-leads/active');
    return {
      ...response,
      data: normalizeLeads(response.data),
    };
  },

  /**
   * Get user's inactive leads (auth required)
   */
  getMyInactiveLeads: async (): Promise<ApiResponse<Lead[]>> => {
    const response = await apiCall('leads/my-leads/inactive');
    return {
      ...response,
      data: normalizeLeads(response.data),
    };
  },

  /**
   * Create a new lead with optional image upload (auth required)
   * CORRECTED: Matches backend API exactly with proper platform handling
   */
  createLead: async (data: CreateLeadData): Promise<ApiResponse<Lead>> => {
    try {
      console.log('📤 Starting lead creation with image');
      
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Create FormData
      const formData = new FormData();
      
      // Append text fields (all as strings)
      formData.append('title', data.title);
      formData.append('description', data.description);
      
      // Append optional fields as strings (even empty strings work)
      formData.append('budget', data.budget || '');
      formData.append('quantity', data.quantity || '');
      formData.append('location', data.location || '');
      
      console.log('📝 Text fields added to FormData:', {
        title: data.title,
        description: data.description,
        budget: data.budget || '(empty)',
        quantity: data.quantity || '(empty)',
        location: data.location || '(empty)',
      });
      
      // Handle image
      if (data.image) {
        if (Platform.OS === 'web') {
          // Web: data.image is a File object
          console.log('🌐 Web platform: Appending File object');
          formData.append('image', data.image);
          console.log('✅ Image added:', {
            name: data.image.name,
            type: data.image.type,
            size: data.image.size,
          });
        } else {
          // Native: data.image is {uri, name, type}
          console.log('📱 Native platform: Creating image object');
          
          // Validate the image object
          if (!data.image.uri || !data.image.name || !data.image.type) {
            console.error('❌ Invalid image object:', data.image);
            throw new Error('Invalid image data. Missing uri, name, or type.');
          }
          
          // For React Native, FormData expects this exact format
          const imageFile = {
            uri: data.image.uri,
            name: data.image.name,
            type: data.image.type,
          };
          
          console.log('📸 Image object prepared:', imageFile);
          
          // Append as any to avoid TypeScript errors
          formData.append('image', imageFile as any);
          console.log('✅ Image added to FormData');
        }
      } else {
        console.warn('⚠️ No image provided');
        // Send empty value as per API spec
        formData.append('image', '');
      }

      console.log('🚀 Sending request to:', `${Config.API_BASE_URL}/leads`);
      console.log('🔑 Using auth token:', token ? 'Present' : 'Missing');

      // Make the API call using axios directly
      const response = await axios.post(
        `${Config.API_BASE_URL}/leads`,
        formData,
        {
          headers: {
            'Accept': '*/*',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 seconds
        }
      );

      console.log('✅ Lead created successfully:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });

      return {
        ...response.data,
        data: normalizeLead(response.data.data),
      };
      
    } catch (error: any) {
      console.error('❌ Lead creation failed');
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestURL: error.config?.url,
      });
      
      // Parse error message
      let errorMessage = 'Failed to create lead';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Upload timeout. Image might be too large or connection is slow.';
      } else if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || 'Invalid request. Please check all fields.';
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (status === 413) {
          errorMessage = 'Image file is too large. Maximum size is 10MB.';
        } else if (status === 500) {
          errorMessage = data?.message || 'Server error. Please try again later.';
        } else {
          errorMessage = data?.message || `Server error: ${status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Unable to reach server.';
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Update a lead with optional image upload (auth required)
   */
  updateLead: async (id: string, data: UpdateLeadData): Promise<ApiResponse<Lead>> => {
    let response;
    
    if (data.image) {
      // Use uploadFile for multipart/form-data
      const formData: Record<string, any> = {};
      
      if (data.title) formData.title = data.title;
      if (data.description) formData.description = data.description;
      if (data.budget) formData.budget = data.budget;
      if (data.quantity) formData.quantity = data.quantity;
      if (data.location) formData.location = data.location;
      
      response = await uploadFile(`leads/${id}`, data.image, formData);
    } else {
      // Use regular apiCall for JSON
      response = await apiCall(`leads/${id}`, 'PATCH', data);
    }

    return {
      ...response,
      data: normalizeLead(response.data),
    };
  },

  /**
   * Toggle lead active/inactive status (auth required)
   */
  toggleLeadStatus: async (id: string, isActive: boolean): Promise<ApiResponse<Lead>> => {
    const response = await apiCall(`leads/${id}/toggle-status`, 'PATCH', { isActive });
    return {
      ...response,
      data: normalizeLead(response.data),
    };
  },

  /**
   * Deactivate a lead with reason (auth required)
   */
  deactivateLead: async (id: string, data: DeactivateLeadData): Promise<ApiResponse<Lead>> => {
    const response = await apiCall(`leads/${id}/deactivate`, 'PATCH', data);
    return {
      ...response,
      data: normalizeLead(response.data),
    };
  },

  /**
   * Delete a lead (auth required)
   */
  deleteLead: (id: string): Promise<ApiResponse<{ message: string; data: null }>> => 
    apiCall(`leads/${id}`, 'DELETE'),

  /**
   * Consume a lead (auth required)
   * Returns contact information after consuming
   */
  consumeLead: (id: string): Promise<ApiResponse<ConsumeLeadResponse>> => 
    apiCall(`leads/${id}/consume`, 'POST'),
};

/**
 * Subscription API calls
 */
export const subscriptionAPI = {
  /**
   * Get current subscription (auth required)
   */
  getCurrentSubscription: async (): Promise<ApiResponse<CurrentSubscription>> => {
    return apiCall('companies/subscription/current', 'GET');
  },

  /**
   * Get all available subscription plans (no auth required)
   */
  getPlans: async (): Promise<ApiResponse<Record<string, SubscriptionPlan>>> => {
    return apiCall('companies/subscription/plans', 'GET', null, false);
  },

  /**
   * Create subscription order (auth required)
   */
  createSubscriptionOrder: async (tier: string): Promise<ApiResponse<CreateOrderResponse>> => {
    return apiCall('companies/subscription/create-order', 'POST', { tier });
  },

  /**
   * Verify subscription payment (auth required)
   */
  verifySubscriptionPayment: async (data: PaymentVerification): Promise<{ message: string; data: CurrentSubscription }> => {
    return apiCall('companies/subscription/verify-payment', 'POST', data);
  },

  /**
   * Create pay-as-you-go order (auth required)
   */
  createPayAsYouGoOrder: async (leadsCount: number): Promise<ApiResponse<CreateOrderResponse>> => {
    return apiCall('companies/pay-as-you-go/create-order', 'POST', { leadsCount });
  },

  /**
   * Verify pay-as-you-go payment (auth required)
   */
  verifyPayAsYouGoPayment: async (data: PaymentVerification): Promise<{ message: string; data: PayAsYouGoVerifyResponse }> => {
    return apiCall('companies/pay-as-you-go/verify-payment', 'POST', data);
  },

  /**
   * Get all consumed leads by the current user (auth required)
   */
  getConsumedLeads: async (): Promise<ApiResponse<ConsumedLeadResponse[]>> => {
    return apiCall('companies/consumed-leads');
  },
};

// Export types for use in components
export type { 
  Lead, 
  Company, 
  CreateLeadData, 
  UpdateLeadData,
  ToggleStatusData,
  DeactivateLeadData,
  ConsumeLeadResponse, 
  ApiResponse,
  SubscriptionPlan,
  CurrentSubscription,
  CreateOrderResponse,
  PaymentVerification,
  PayAsYouGoVerifyResponse,
  ConsumedLeadResponse
};