// // services/leads.ts
// import { apiCall, uploadFile } from './apiClient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Config } from '../constants/config';
// import { Platform } from 'react-native';

// // --- Interfaces ---

// export interface Company {
//   id: string;
//   phoneNumber: string;
//   gstNumber: string;
//   companyName: string;
//   logo: string;
//   address: string;
//   description: string;
//   category: string | null;
//   referralCode: string;
//   leadQuota: number;      // Monthly free leads + referral bonuses
//   consumedLeads: number;  // Used leads for current month
//   postedLeads: number;
//   postingQuota: number;
//   followersCount: number;
//   isDeleted: boolean;
//   createdAt: string;
//   userName: string | null;
//   userPhoto: string | null;
//   coverImage: string | null;
// }

// export interface Lead {
//   id: string;
//   title: string;
//   description: string;
//   imageKey: string | null;
//   imageUrl: string | null;
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
//   image?: string | null; // For backward compatibility
// }

// export interface ConsumedLeadResponse {
//   id: string;
//   companyId: string;
//   leadId: string;
//   consumedAt: string;
//   dealStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'NO_RESPONSE' | null;
//   dealNotes: string | null;
//   dealValue: string | null;
//   statusUpdatedAt: string | null;
//   lead: Partial<Lead>;
// }

// export interface CreateLeadData {
//   title: string;
//   description: string;
//   image?: any;
//   budget?: string;
//   quantity?: string;
//   location?: string;
// }

// export interface UpdateLeadData extends Partial<CreateLeadData> {}

// export interface DeactivateLeadData {
//   reasonForDeactivation: string;
// }

// export interface UpdateConsumedLeadStatusData {
//   dealStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'NO_RESPONSE';
//   dealNotes?: string;
//   dealValue?: number;
// }

// export interface ApiResponse<T> {
//   statusCode: number;
//   status: string;
//   message: string;
//   data: T;
// }

// // --- Leads API Calls ---

// export const leadsAPI = {
//   /**
//    * Fetch all active leads for the feed
//    */
//   getAllLeads: async (): Promise<ApiResponse<Lead[]>> => {
//     return apiCall('leads/public', 'GET', null, false);
//   },

//   /**
//    * Fetch a single lead's details
//    */
//   getLeadById: async (id: string): Promise<ApiResponse<Lead>> => {
//     return apiCall(`leads/public/${id}`, 'GET', null, false);
//   },
  
//   /**
//    * Fetch available leads for consumption (not posted by user, not consumed by user)
//   */
//   getAvailableLeads: async (): Promise<ApiResponse<{ leads: Lead[]; count: number }>> => {
//     return apiCall('leads/available');
//   },

//   /**
//    * Fetch leads posted by the current user
//    */
//   getMyLeads: async (): Promise<ApiResponse<Lead[]>> => {
//     return apiCall('leads/my-leads');
//   },

//   /**
//    * Create a new lead with image support
//    */
//   createLead: async (data: CreateLeadData): Promise<ApiResponse<Lead>> => {
//     const token = await AsyncStorage.getItem('authToken');
//     const formData = new FormData();
    
//     formData.append('title', data.title);
//     formData.append('description', data.description);
//     formData.append('budget', data.budget || '');
//     formData.append('quantity', data.quantity || '');
//     formData.append('location', data.location || '');
    
//     if (data.image) {
//       const imageFile = Platform.OS === 'web' ? data.image : {
//         uri: data.image.uri,
//         name: data.image.name,
//         type: data.image.type,
//       };
//       formData.append('image', imageFile as any);
//     }

//     const response = await axios.post(`${Config.API_BASE_URL}/leads`, formData, {
//       headers: { 
//         'Authorization': `Bearer ${token}`, 
//         'Content-Type': 'multipart/form-data' 
//       },
//     });
//     return response.data;
//   },

//   /**
//    * Update existing lead details
//    */
//   updateLead: async (id: string, data: UpdateLeadData): Promise<ApiResponse<Lead>> => {
//     if (data.image) {
//       return uploadFile(`leads/${id}`, data.image, data);
//     }
//     return apiCall(`leads/${id}`, 'PATCH', data);
//   },

//   /**
//    * Quick toggle for lead visibility
//    */
//   toggleLeadStatus: async (id: string, isActive: boolean): Promise<ApiResponse<Lead>> => {
//     return apiCall(`leads/${id}/toggle-status`, 'PATCH', { isActive });
//   },

//   /**
//    * Deactivate a lead with a specific reason
//    */
//   deactivateLead: async (id: string, data: DeactivateLeadData): Promise<ApiResponse<Lead>> => {
//     return apiCall(`leads/${id}/deactivate`, 'PATCH', data);
//   },

//   /**
//    * Permanently delete a lead
//    */
//   deleteLead: (id: string): Promise<ApiResponse<any>> => 
//     apiCall(`leads/${id}`, 'DELETE'),

//   /**
//    * Spend a quota point to see contact details
//    */
//   consumeLead: (id: string): Promise<ApiResponse<{ success: boolean; contact: string }>> => 
//     apiCall(`leads/${id}/consume`, 'POST'),

//   /**
//    * Update the deal status of a consumed lead (e.g., mark as COMPLETED)
//    */
//   updateConsumedLeadStatus: async (
//     consumedLeadId: string, 
//     data: UpdateConsumedLeadStatusData
//   ): Promise<ApiResponse<ConsumedLeadResponse>> => {
//     return apiCall(`leads/consumed-leads/${consumedLeadId}/status`, 'PATCH', data);
//   },

//   /**
//    * Get list of all leads consumed by the user
//    */
//   getConsumedLeads: async (): Promise<ApiResponse<ConsumedLeadResponse[]>> => {
//     return apiCall('companies/consumed-leads');
//   },
// };



// services/leads.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { Config } from '../constants/config';
import { apiCall, uploadFile } from './apiClient';

// --- Interfaces ---

export interface Company {
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
  postedLeads: number;
  postingQuota: number;
  followersCount: number;
  isDeleted: boolean;
  createdAt: string;
  userName: string | null;
  userPhoto: string | null;
  coverImage: string | null;
}

export interface Lead {
  id: string;
  title: string;
  description: string;
  imageKey: string | null;
  imageUrl: string | null;
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
  image?: string | null;
}

export interface ConsumedLeadResponse {
  id: string;
  companyId: string;
  leadId: string;
  consumedAt: string;
  dealStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'NO_RESPONSE' | null;
  dealNotes: string | null;
  dealValue: string | null;
  statusUpdatedAt: string | null;
  lead: Partial<Lead>;
}

export interface CreateLeadData {
  title: string;
  description: string;
  image?: any;
  budget?: string;
  quantity?: string;
  location?: string;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {}

export interface DeactivateLeadData {
  reasonForDeactivation: string;
}

export interface UpdateConsumedLeadStatusData {
  dealStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'NO_RESPONSE';
  dealNotes?: string;
  dealValue?: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  status: string;
  message: string;
  data: T;
}

// --- Leads API Calls ---

export const leadsAPI = {
  /**
   * Fetch all active leads for the feed
   */
  getAllLeads: async (): Promise<ApiResponse<Lead[]>> => {
    return apiCall('leads/public', 'GET', null, false);
  },

  /**
   * Fetch a single lead's details
   */
  getLeadById: async (id: string): Promise<ApiResponse<Lead>> => {
    return apiCall(`leads/public/${id}`, 'GET', null, false);
  },
  
  /**
   * Fetch available leads for consumption (not posted by user, not consumed by user)
  */
  getAvailableLeads: async (): Promise<ApiResponse<{ leads: Lead[]; count: number }>> => {
    return apiCall('leads/available');
  },

  /**
   * Fetch leads posted by the current user
   */
  getMyLeads: async (): Promise<ApiResponse<Lead[]>> => {
    return apiCall('leads/my-leads');
  },

  /**
   * Create a new lead with image support - Android Compatible
   */
  createLead: async (data: CreateLeadData): Promise<ApiResponse<Lead>> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      
      // Add text fields - ensure they're strings
      formData.append('title', String(data.title).trim());
      formData.append('description', String(data.description || '').trim());
      formData.append('budget', String(data.budget || '').trim());
      formData.append('quantity', String(data.quantity || '').trim());
      formData.append('location', String(data.location || '').trim());
      
      // Handle image for Android with proper formatting
      if (data.image) {
        const uri = data.image.uri;
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        
        // Determine proper MIME type
        let mimeType = data.image.mimeType || data.image.type;
        
        // If type is just "image", fix it to proper MIME type
        if (!mimeType || mimeType === 'image') {
          if (fileType === 'jpg' || fileType === 'jpeg') {
            mimeType = 'image/jpeg';
          } else if (fileType === 'png') {
            mimeType = 'image/png';
          } else if (fileType === 'gif') {
            mimeType = 'image/gif';
          } else if (fileType === 'webp') {
            mimeType = 'image/webp';
          } else {
            mimeType = 'image/jpeg'; // Default fallback
          }
        }
        
        const imageData: any = {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          type: mimeType,
          name: data.image.fileName || data.image.name || `lead_${Date.now()}.${fileType}`,
        };
        
        console.log('Appending image with proper MIME type:', imageData);
        formData.append('image', imageData as any);
      }

      console.log('Creating lead with data:', {
        title: data.title,
        hasDescription: !!data.description,
        hasBudget: !!data.budget,
        hasQuantity: !!data.quantity,
        hasLocation: !!data.location,
        hasImage: !!data.image,
      });

      const response = await axios.post(`${Config.API_BASE_URL}/leads`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 60000, // Increased to 60 seconds for image upload
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log('Lead creation successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Create Lead Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 413) {
          throw new Error('Image file is too large. Please select a smaller image (max 5MB).');
        } else if (status === 400) {
          const errorMessage = errorData?.message || 
                              errorData?.errors?.[0]?.message ||
                              'Invalid input. Please check all fields.';
          throw new Error(errorMessage);
        } else if (status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else if (status === 403) {
          throw new Error('You do not have permission to create leads.');
        } else {
          const errorMessage = errorData?.message || `Server error: ${status}`;
          throw new Error(errorMessage);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('Network error: Unable to reach server. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your connection and try again.');
      } else {
        throw new Error(error.message || 'Failed to create lead. Please try again.');
      }
    }
  },

  /**
   * Update existing lead details
   */
  updateLead: async (id: string, data: UpdateLeadData): Promise<ApiResponse<Lead>> => {
    if (data.image) {
      return uploadFile(`leads/${id}`, data.image, data);
    }
    return apiCall(`leads/${id}`, 'PATCH', data);
  },

  /**
   * Quick toggle for lead visibility
   */
  toggleLeadStatus: async (id: string, isActive: boolean): Promise<ApiResponse<Lead>> => {
    return apiCall(`leads/${id}/toggle-status`, 'PATCH', { isActive });
  },

  /**
   * Deactivate a lead with a specific reason
   */
  deactivateLead: async (id: string, data: DeactivateLeadData): Promise<ApiResponse<Lead>> => {
    return apiCall(`leads/${id}/deactivate`, 'PATCH', data);
  },

  /**
   * Permanently delete a lead
   */
  deleteLead: (id: string): Promise<ApiResponse<any>> => 
    apiCall(`leads/${id}`, 'DELETE'),

  /**
   * Spend a quota point to see contact details
   */
  consumeLead: (id: string): Promise<ApiResponse<{ success: boolean; contact: string }>> => 
    apiCall(`leads/${id}/consume`, 'POST'),

  /**
   * Update the deal status of a consumed lead (e.g., mark as COMPLETED)
   */
  updateConsumedLeadStatus: async (
    consumedLeadId: string, 
    data: UpdateConsumedLeadStatusData
  ): Promise<ApiResponse<ConsumedLeadResponse>> => {
    return apiCall(`leads/consumed-leads/${consumedLeadId}/status`, 'PATCH', data);
  },

  /**
   * Get list of all leads consumed by the user
   */
  getConsumedLeads: async (): Promise<ApiResponse<ConsumedLeadResponse[]>> => {
    return apiCall('companies/consumed-leads');
  },
};