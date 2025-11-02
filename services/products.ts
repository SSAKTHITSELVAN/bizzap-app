// BIZZAP/services/products.js

import { apiCall } from './apiClient';

// --- Interfaces for Products ---

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  // ... other product properties
}

interface CreateProductData extends Pick<Product, 'name' | 'price' | 'description'> {
    // Add required fields
}

/**
 * Products API calls.
 */
export const productsAPI = {
  getMyProducts: (): Promise<Product[]> => 
    apiCall('products/company'),

  createProduct: (data: CreateProductData): Promise<Product> => 
    apiCall('products', 'POST', data),

  updateProduct: (id: string, data: Partial<CreateProductData>): Promise<Product> => 
    apiCall(`products/${id}`, 'PATCH', data),

  deleteProduct: (id: string): Promise<{ success: boolean }> => 
    apiCall(`products/${id}`, 'DELETE'),

  getProductById: (id: string): Promise<Product> => 
    apiCall(`products/${id}`),

  getPublicProduct: (id: string): Promise<Product> => 
    apiCall(`products/public/${id}`, 'GET', null, false),
};