// constants/config.ts

export const Config = {
  // Use your local IP address for React Native development
  // Replace with your actual backend URL
  // API_BASE_URL: 'http://localhost:3000', // Change this to your machine's IP for local development
  API_BASE_URL: 'https://api.bizzap.app/ai', // Change this to your machine's IP for production
  
  // Timeout in milliseconds
  API_TIMEOUT_MS: 30000,
  
  // AI Service Configuration
  AI_BASE_URL: 'https://api.bizzap.app',
  
  
  // Other config values
  APP_NAME: 'Bizzap',
  VERSION: '1.0.0',

  // GST Verification API Configuration
  GST_API_KEY: '621e34fe69bb5972a45c7d29854d3b23',
  GST_BASE_URL: 'https://sheet.gstincheck.co.in/check',
  GST_TIMEOUT_MS: 15000,
};


// For development, you can detect the environment
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;