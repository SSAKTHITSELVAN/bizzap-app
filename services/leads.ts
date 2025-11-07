// services/leads.ts

import { apiCall, uploadFile } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './apiClient'; // Import the axios instance

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
   * FIXED: Uses 'image' key instead of 'file' for multipart upload
   */
  createLead: async (data: CreateLeadData): Promise<ApiResponse<Lead>> => {
    let response;
    
    if (data.image) {
      try {
        const formData = new FormData();
        
        // CRITICAL: Append image with key 'image' (backend expects this, not 'file')
        formData.append('image', data.image as any);
        
        // Append other required fields
        formData.append('title', data.title);
        formData.append('description', data.description);
        
        // Append optional fields
        if (data.budget) formData.append('budget', data.budget);
        if (data.quantity) formData.append('quantity', data.quantity);
        if (data.location) formData.append('location', data.location);
        
        console.log('📤 Uploading lead with FormData:', {
          title: data.title,
          hasImage: true,
        });
        
        // Use axios instance directly to bypass uploadFile's 'file' key
        const axiosResponse = await api.post('leads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        response = axiosResponse.data;
        
      } catch (error: any) {
        console.error('❌ Lead creation with image failed:', error);
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Failed to create lead with image';
        throw new Error(errorMessage);
      }
    } else {
      // Use regular apiCall for JSON (no image)
      response = await apiCall('leads', 'POST', data);
    }

    return {
      ...response,
      data: normalizeLead(response.data),
    };
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