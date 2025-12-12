// services/gstVerification.ts - UPDATED to use internal API

import { Config } from '../constants/config';

export interface GSTAddress {
  flno: string;
  lg: string;
  loc: string;
  pncd: string;
  bnm: string;
  city: string;
  lt: string;
  stcd: string;
  bno: string;
  dst: string;
  st: string;
}

export interface GSTData {
  gstin: string;
  lgnm: string;
  tradeNam: string;
  sts: string;
  rgdt: string;
  ctb: string;
  pradr: {
    adr: string;
    addr: GSTAddress;
  };
  dty: string;
  nba: string[];
  stj: string;
  ctj: string;
  adhrVFlag: string;
  adhrVdt: string;
  einvoiceStatus: string;
}

export interface GSTVerificationResponse {
  statusCode: number;
  status: string;
  message: string;
  data?: GSTData;
  errors?: any;
}

/**
 * Verify GST Number using internal API
 */
export const verifyGSTNumber = async (gstin: string): Promise<GSTVerificationResponse> => {
  try {
    const url = `${Config.API_BASE_URL}/auth/gst-details?gstNumber=${gstin.toUpperCase()}`;
    
    console.log('🔍 Verifying GST:', gstin);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Config.GST_TIMEOUT_MS || 30000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GSTVerificationResponse = await response.json();
    
    console.log('✅ GST Verification Result:', {
      statusCode: result.statusCode,
      status: result.status,
      message: result.message,
      hasData: !!result.data,
    });

    // Transform response to match old format for compatibility
    return {
      statusCode: result.statusCode,
      status: result.status,
      message: result.message,
      data: result.data,
      errors: result.errors,
    };
    
  } catch (error: any) {
    console.error('❌ GST Verification Error:', error);
    
    // Check for abort/timeout errors
    if (error.name === 'AbortError') {
      return {
        statusCode: 408,
        status: 'error',
        message: 'Request timed out',
        errors: 'Request timed out. Please try again.',
      };
    }
    
    return {
      statusCode: 500,
      status: 'error',
      message: 'Verification failed',
      errors: error.message || 'Failed to verify GST number',
    };
  }
};

export const formatGSTAddress = (gstData: GSTData): string => {
  if (gstData.pradr?.adr) {
    return gstData.pradr.adr;
  }
  
  // Fallback: construct address from addr object
  const addr = gstData.pradr?.addr;
  if (addr) {
    const parts = [
      addr.bno && addr.bno !== '0' ? `${addr.bno},` : '',
      addr.bnm,
      addr.st,
      addr.loc,
      addr.dst,
      addr.stcd,
      addr.pncd,
    ].filter(Boolean);
    
    return parts.join(', ');
  }
  
  return '';
};

export const getCompanyNameFromGST = (gstData: GSTData): string => {
  return gstData.tradeNam || gstData.lgnm || '';
};

export const getUserNameFromGST = (gstData: GSTData): string => {
  return gstData.lgnm || '';
};