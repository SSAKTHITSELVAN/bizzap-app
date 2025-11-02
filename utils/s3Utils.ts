// utils/s3Utils.ts

/**
 * S3 Configuration
 */
const AWS_REGION = 'ap-south-1';
const AWS_S3_BUCKET_NAME = 'bizzap-chat-files-2024';

/**
 * Checks if a value is a valid string (not null, undefined, or [object Object])
 */
const isValidString = (value: any): boolean => {
  if (!value || typeof value !== 'string') return false;
  if (value === '[object Object]') return false;
  if (value.trim() === '') return false;
  return true;
};

/**
 * Checks if a string is an S3 key (not a full URL)
 */
export const isS3Key = (path: string): boolean => {
  if (!isValidString(path)) return false;
  
  // If it's already a full URL, it's not an S3 key
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return false;
  }
  
  // Check if it matches S3 key pattern: folder/filename.ext
  const s3KeyPattern = /^(company-logos|user-photos|cover-images|chat-files|posts-media|lead-images)\/.+\..+$/;
  return s3KeyPattern.test(path);
};

/**
 * Converts an S3 key to a full public S3 URL (without signing)
 */
export const convertS3KeyToUrl = (s3Key: string): string => {
  return `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
};

/**
 * Main function to get accessible image URL
 * Handles S3 keys, full URLs (including signed URLs), and invalid values
 */
export const getS3ImageUrl = (path: string | null | undefined): string | null => {
  // Handle null/undefined/invalid
  if (!isValidString(path)) {
    return null;
  }
  
  const pathStr = path as string;
  
  // If it's already a full URL (including signed S3 URLs), return as-is
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
    return pathStr;
  }
  
  // If it's an S3 key, convert it to full URL
  if (isS3Key(pathStr)) {
    return convertS3KeyToUrl(pathStr);
  }
  
  // Invalid format
  return null;
};

/**
 * Get the best available image URL with fallback
 * Prioritizes: signedUrl > url > key > fallback
 */
export const getBestImageUrl = (
  signedUrl: string | null | undefined,
  url: string | null | undefined,
  key: string | null | undefined,
  fallback: string
): string => {
  // Try signed URL first (highest priority)
  if (isValidString(signedUrl)) {
    return signedUrl as string;
  }
  
  // Try regular URL
  const urlResult = getS3ImageUrl(url);
  if (urlResult) {
    return urlResult;
  }
  
  // Try key
  const keyResult = getS3ImageUrl(key);
  if (keyResult) {
    return keyResult;
  }
  
  // Return fallback
  return fallback;
};

/**
 * Get company logo URL with fallback to avatar
 */
export const getCompanyLogoUrl = (
  logo: string | null | undefined,
  companyName?: string
): string => {
  const url = getS3ImageUrl(logo);
  
  if (url) {
    return url;
  }
  
  // Fallback: Generate a colored avatar
  const initial = companyName?.charAt(0).toUpperCase() || 'C';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&size=150&background=4C1D95&color=fff&bold=true`;
};

/**
 * Get user photo URL with fallback to avatar
 */
export const getUserPhotoUrl = (
  userPhoto: string | null | undefined,
  userName?: string
): string => {
  const url = getS3ImageUrl(userPhoto);
  
  if (url) {
    return url;
  }
  
  // Fallback: Generate a colored avatar
  const initial = userName?.charAt(0).toUpperCase() || 'U';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&size=150&background=4C1D95&color=fff&bold=true`;
};

/**
 * Get cover image URL (no fallback needed)
 */
export const getCoverImageUrl = (
  coverImage: string | null | undefined
): string | null => {
  return getS3ImageUrl(coverImage);
};

/**
 * Process post images array
 */
export const getPostImages = (images: string[] | null | undefined): string[] => {
  if (!images || !Array.isArray(images)) {
    return [];
  }
  
  return images
    .map(img => getS3ImageUrl(img))
    .filter((url): url is string => url !== null);
};

/**
 * Get post video URL
 */
export const getPostVideoUrl = (video: string | null | undefined): string | null => {
  return getS3ImageUrl(video);
};

/**
 * Get lead image URL with fallback
 * For leads that have both imageKey and imageUrl
 */
export const getLeadImageUrl = (
  imageUrl: string | null | undefined,
  imageKey: string | null | undefined
): string | null => {
  // Try imageUrl first (it's usually the signed URL)
  const url = getS3ImageUrl(imageUrl);
  if (url) {
    return url;
  }
  
  // Fallback to imageKey
  return getS3ImageUrl(imageKey);
};