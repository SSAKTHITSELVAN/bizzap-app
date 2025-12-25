// services/leads.ts
import { apiCall, uploadFile } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Config } from '../constants/config';
import { Platform } from 'react-native';

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
  leadQuota: number;      // Monthly free leads + referral bonuses
  consumedLeads: number;  // Used leads for current month
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
  image?: string | null; // For backward compatibility
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
   * Create a new lead with image support
   */
  createLead: async (data: CreateLeadData): Promise<ApiResponse<Lead>> => {
    const token = await AsyncStorage.getItem('authToken');
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('budget', data.budget || '');
    formData.append('quantity', data.quantity || '');
    formData.append('location', data.location || '');
    
    if (data.image) {
      const imageFile = Platform.OS === 'web' ? data.image : {
        uri: data.image.uri,
        name: data.image.name,
        type: data.image.type,
      };
      formData.append('image', imageFile as any);
    }

    const response = await axios.post(`${Config.API_BASE_URL}/leads`, formData, {
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'multipart/form-data' 
      },
    });
    return response.data;
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