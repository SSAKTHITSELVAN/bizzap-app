// services/search.ts

import { apiCall } from './apiClient';

// --- Type Definitions ---

export interface Company {
  id: string;
  phoneNumber: string;
  gstNumber: string;
  companyName: string;
  logo: string | null;
  address: string | null;
  description: string | null;
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

export interface Lead {
  id: string;
  title: string;
  description: string;
  image: string | null;
  budget: string | null;
  quantity: string;
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
  company: Company;
  companyId: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchResults {
  companies: PaginatedResult<Company>;
  leads: PaginatedResult<Lead>;
  products: PaginatedResult<Product>;
}

export interface SearchResponse {
  statusCode: number;
  status: string;
  message: string;
  data: SearchResults;
  errors: any;
}

export interface SearchParams {
  query: string;
  companyPage?: number;
  companyLimit?: number;
  leadPage?: number;
  leadLimit?: number;
  productPage?: number;
  productLimit?: number;
}

// --- Search API Functions ---

/**
 * Search for companies, leads, and products with pagination support
 * @param params - Search parameters including query and pagination options
 * @returns Promise with paginated search results
 */
const search = async (params: SearchParams): Promise<SearchResponse> => {
  const { 
    query, 
    companyPage = 1, 
    companyLimit = 10,
    leadPage = 1,
    leadLimit = 20,
    productPage = 1,
    productLimit = 20
  } = params;

  if (!query || query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters long');
  }

  try {
    const queryParams = new URLSearchParams({
      q: query.trim(),
      companyPage: companyPage.toString(),
      companyLimit: companyLimit.toString(),
      leadPage: leadPage.toString(),
      leadLimit: leadLimit.toString(),
      productPage: productPage.toString(),
      productLimit: productLimit.toString(),
    });

    const response = await apiCall<SearchResponse>(
      `/search?${queryParams.toString()}`,
      'GET',
      null,
      false // Set to true if search requires authentication
    );
    
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to perform search');
  }
};

/**
 * Search only for companies with pagination
 * @param query - Search query string
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @returns Promise with paginated company results
 */
const searchCompanies = async (
  query: string, 
  page: number = 1, 
  limit: number = 10
): Promise<PaginatedResult<Company>> => {
  const response = await search({ 
    query, 
    companyPage: page, 
    companyLimit: limit,
    leadLimit: 0, // Don't fetch leads
    productLimit: 0 // Don't fetch products
  });
  return response.data.companies;
};

/**
 * Search only for leads with pagination
 * @param query - Search query string
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns Promise with paginated lead results
 */
const searchLeads = async (
  query: string, 
  page: number = 1, 
  limit: number = 20
): Promise<PaginatedResult<Lead>> => {
  const response = await search({ 
    query,
    companyLimit: 0, // Don't fetch companies
    leadPage: page, 
    leadLimit: limit,
    productLimit: 0 // Don't fetch products
  });
  return response.data.leads;
};

/**
 * Search only for products with pagination
 * @param query - Search query string
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns Promise with paginated product results
 */
const searchProducts = async (
  query: string, 
  page: number = 1, 
  limit: number = 20
): Promise<PaginatedResult<Product>> => {
  const response = await search({ 
    query,
    companyLimit: 0, // Don't fetch companies
    leadLimit: 0, // Don't fetch leads
    productPage: page, 
    productLimit: limit
  });
  return response.data.products;
};

// --- Export Search API ---

export const searchAPI = {
  search,
  searchCompanies,
  searchLeads,
  searchProducts,
};

export default searchAPI;


// // services/search.ts

// import { apiCall } from './apiClient';

// // --- Type Definitions ---

// export interface Company {
//   id: string;
//   phoneNumber: string;
//   gstNumber: string;
//   companyName: string;
//   logo: string | null;
//   address: string | null;
//   description: string | null;
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

// export interface PaginatedResult<T> {
//   data: T[];
//   total: number;
//   page: number;
//   limit: number;
// }

// export interface SearchCompanyResponse {
//   statusCode: number;
//   status: string;
//   message: string;
//   data: PaginatedResult<Company>;
//   errors: any;
// }

// // --- Search API Functions ---

// /**
//  * Search only for companies with pagination
//  * @param query - Search query string
//  * @param page - Page number (default: 1)
//  * @param limit - Items per page (default: 10)
//  * @returns Promise with paginated company results
//  */
// const searchCompanies = async (
//   query: string, 
//   page: number = 1, 
//   limit: number = 10
// ): Promise<SearchCompanyResponse> => {
//   if (!query || query.trim().length < 2) {
//     throw new Error('Search query must be at least 2 characters long');
//   }

//   try {
//     const queryParams = new URLSearchParams({
//       q: query.trim(),
//       page: page.toString(),
//       limit: limit.toString(),
//     });

//     const response = await apiCall<SearchCompanyResponse>(
//       `/search/companies?${queryParams.toString()}`,
//       'GET',
//       null,
//       false // Set to true if search requires authentication
//     );
    
//     return response;
//   } catch (error: any) {
//     throw new Error(error.message || 'Failed to search companies');
//   }
// };

// // --- Export Search API ---

// export const searchAPI = {
//   searchCompanies,
// };

// export default searchAPI;