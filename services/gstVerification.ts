// services/gstVerification.ts

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
  flag: boolean;
  message: string;
  data?: GSTData;
  error?: string;
  raw_text?: string;
}

export const verifyGSTNumber = async (gstin: string): Promise<GSTVerificationResponse> => {
  try {
    const url = `${Config.GST_BASE_URL}/${Config.GST_API_KEY}/${gstin.toUpperCase()}`;
    
    console.log('🔍 Verifying GST:', gstin);
    
    // Create AbortController for timeout (compatible with React Native)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Config.GST_TIMEOUT_MS);
    
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
      flag: result.flag,
      message: result.message,
      hasData: !!result.data,
    });

    return result;
    
  } catch (error: any) {
    console.error('❌ GST Verification Error:', error);
    
    // Check for abort/timeout errors
    if (error.name === 'AbortError') {
      return {
        flag: false,
        message: 'Request timed out',
        error: 'Request timed out. Please try again.',
      };
    }
    
    return {
      flag: false,
      message: 'Verification failed',
      error: error.message || 'Failed to verify GST number',
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