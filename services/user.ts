// services/user.ts

import { apiCall } from './apiClient';

// --- Interfaces for User/Company/Search ---

export interface Company {
  id: string;
  phoneNumber: string;
  gstNumber: string;
  companyName: string;
  logo?: string;
  address?: string;
  description?: string;
  category?: string;
  referralCode?: string;
  leadQuota?: number;
  consumedLeads?: number;
  followersCount?: number;
  userName?: string;
  userPhoto?: string;
  coverImage?: string;
  registeredAddress?: string;
  about?: string;
  operationalAddress?: string;
  isDeleted: boolean;
  createdAt: string;
  lastLoginDate?: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  title: string;
  description: string;
  image?: string;
  budget?: string;
  quantity?: string;
  location?: string;
  isActive: boolean;
  reasonForDeactivation?: string;
  consumedCount: number;
  viewCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  company?: Company;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: string;
  minimumQuantity: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  companyId: string;
}

export interface Follower {
  id: string;
  followerCompanyId: string;
  followedCompanyId: string;
  createdAt: string;
  followerCompany?: Company;
  followedCompany?: Company;
}

export interface CompanyProfile extends Company {
  leads: Lead[];
  products: Product[];
  following: Follower[];
  followers: Follower[];
}

export interface ConsumedLead {
  id: string;
  leadId: string;
  companyId: string;
  consumedAt: string;
  lead: Lead;
}

export interface FollowStatus {
  isFollowing: boolean;
}

export interface SearchResult {
  companies: Company[];
  leads: Lead[];
  products: Product[];
}

// API Response wrapper interface
interface ApiResponse<T> {
  statusCode: number;
  status: string;
  message: string;
  data: T;
  errors: any;
}

/**
 * Company/User Profile API calls.
 */
export const companyAPI = {
  // Get authenticated user's complete profile (private - requires auth)
  getProfile: async (): Promise<CompanyProfile> => {
    const response = await apiCall<ApiResponse<CompanyProfile>>(
      'companies/profile',
      'GET',
      null,
      true
    );
    return response.data;
  },

  // Get public company profile by ID (public - no auth required)
  getCompanyById: async (id: string): Promise<CompanyProfile> => {
    const response = await apiCall<ApiResponse<CompanyProfile>>(
      `companies/${id}`,
      'GET',
      null,
      false
    );
    return response.data;
  },

  updateProfile: async (data: Partial<Company>): Promise<Company> => {
    const response = await apiCall<ApiResponse<Company>>(
      'companies/profile',
      'PATCH',
      data,
      true
    );
    return response.data;
  },

  getConsumedLeads: async (): Promise<ConsumedLead[]> => {
    const response = await apiCall<ApiResponse<ConsumedLead[]>>(
      'companies/consumed-leads',
      'GET',
      null,
      true
    );
    return response.data;
  },

  getCompanyLeads: async (id: string): Promise<Lead[]> => {
    const response = await apiCall<ApiResponse<Lead[]>>(
      `companies/${id}/leads`,
      'GET',
      null,
      false
    );
    return response.data;
  },

  getCompanyProducts: async (id: string): Promise<Product[]> => {
    const response = await apiCall<ApiResponse<Product[]>>(
      `products/public/company/${id}`,
      'GET',
      null,
      false
    );
    return response.data;
  },
};

/**
 * Followers API calls
 */
export const followersAPI = {
  // Get followers of the authenticated user
  getFollowers: async (): Promise<Company[]> => {
    const response = await apiCall<ApiResponse<Company[]>>(
      'followers/followers',
      'GET',
      null,
      true
    );
    return response.data;
  },

  // Get companies the authenticated user is following
  getFollowing: async (): Promise<Company[]> => {
    const response = await apiCall<ApiResponse<Company[]>>(
      'followers/following',
      'GET',
      null,
      true
    );
    return response.data;
  },

  // Follow a company
  followCompany: async (companyId: string): Promise<any> => {
    const response = await apiCall<ApiResponse<any>>(
      'followers/follow',
      'POST',
      { companyId },
      true
    );
    return response.data;
  },

  // Unfollow a company - Fixed to match API endpoint exactly
  unfollowCompany: async (companyId: string): Promise<any> => {
    const response = await apiCall<ApiResponse<any>>(
      `followers/unfollow/${companyId}`,
      'DELETE',
      undefined, // Use undefined instead of null for DELETE requests
      true
    );
    return response.data;
  },

  // Check if following a company
  checkFollowStatus: async (companyId: string): Promise<FollowStatus> => {
    const response = await apiCall<ApiResponse<FollowStatus>>(
      `followers/check/${companyId}`,
      'GET',
      null,
      true
    );
    return response.data;
  },
};

/**
 * Search API calls - kept for backward compatibility
 */
export const searchAPI = {
  search: (query: string): Promise<SearchResult> => 
    apiCall('search', 'GET', { q: query }),

  searchCompanies: (query: string): Promise<Company[]> => 
    apiCall('search/companies', 'GET', { q: query }),

  searchLeads: (query: string): Promise<Lead[]> => 
    apiCall('search/leads', 'GET', { q: query }),

  searchProducts: (query: string): Promise<Product[]> => 
    apiCall('search/products', 'GET', { q: query }),
};