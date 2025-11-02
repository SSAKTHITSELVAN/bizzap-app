// services/ai.ts

import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config } from '../constants/config';

// --- AI API Configuration ---
const AI_BASE_URL: string = Config.AI_BASE_URL;

// Create separate axios instance for AI endpoints
const aiApi: AxiosInstance = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 30000, // 30 seconds for AI responses
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for debugging
aiApi.interceptors.request.use(
  (config) => {
    console.log('🚀 AI API Request:', {
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      method: config.method,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('❌ AI API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
aiApi.interceptors.response.use(
  (response) => {
    console.log('✅ AI API Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ AI API Response Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);

// --- Interfaces for AI Lead Generation ---

interface AIGeneratedData {
  code: string; // "0" for conversation, "1" for complete data
  title: string | null;
  description: string | null;
  location: string | null;
  quantity: string | null;
  unit: string | null;
  min_budget: string | null;
  max_budget: string | null;
  certifications: string[] | string | null;
  conversation?: string; // AI response message when code is "0"
}

interface GenerateLeadRequest {
  user_input: string;
  conversation_history: string;
}

interface AIApiResponse {
  data: AIGeneratedData;
}

/**
 * AI API calls for lead generation
 */
export const aiAPI = {
  /**
   * Generate lead data from user conversation
   */
  generateLead: async (
    requirement: string, 
    conversationHistory: string = ''
  ): Promise<AIApiResponse> => {
    try {
      console.log('📤 Sending request to AI service...');
      
      const response = await aiApi.post<AIGeneratedData>('process_requirement', { 
        user_input: requirement, 
        conversation_history: conversationHistory,
      });
      
      // Validate response structure
      if (!response.data) {
        console.error('❌ Empty response data from AI service');
        throw new Error('AI service returned empty response');
      }

      // Check if response has the expected structure
      if (typeof response.data.code === 'undefined') {
        console.error('❌ Invalid response structure:', response.data);
        throw new Error('AI service returned invalid response structure (missing code field)');
      }

      console.log('✅ Valid AI response received:', response.data);
      
      // Wrap the response in the expected format
      return { data: response.data };
      
    } catch (error: any) {
      console.error('❌ AI API Error Details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Enhanced error handling with specific messages
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to AI service at ${AI_BASE_URL}. Please ensure the backend server is running.`
        );
      }
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error(
          'AI service is taking too long to respond. Please try again.'
        );
      }

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 404) {
          throw new Error(
            `AI endpoint not found. Expected: ${AI_BASE_URL}process_requirement`
          );
        }
        
        if (status === 500) {
          throw new Error(
            errorData?.detail || 'AI service internal error. Please try again later.'
          );
        }
        
        if (status === 422) {
          throw new Error(
            'Invalid request format. Please check your input and try again.'
          );
        }

        const errorMessage = errorData?.detail || 
                            errorData?.message || 
                            errorData?.error ||
                            `AI service error: ${status}`;
        throw new Error(errorMessage);
      } 
      
      if (error.request) {
        // Request was made but no response received
        throw new Error(
          `Unable to reach AI service at ${AI_BASE_URL}. Please check:\n` +
          '1. Backend server is running\n' +
          '2. Correct URL in config.ts\n' +
          '3. Network connection\n' +
          '4. CORS is enabled on backend'
        );
      }
      
      // Something else happened
      throw new Error(error.message || 'AI generation failed');
    }
  },
};

// Export types for use in components
export type { 
  AIGeneratedData, 
  GenerateLeadRequest,
  AIApiResponse 
};