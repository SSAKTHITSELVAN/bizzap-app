// services/posts.ts

import { apiCall } from './apiClient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';
import { Platform } from 'react-native';

// --- Interfaces ---

interface Company {
  id: string;
  phoneNumber: string;
  gstNumber: string;
  companyName: string;
  logo?: string | null;
  address?: string | null;
  description?: string | null;
  category?: string | null;
  referralCode?: string;
  leadQuota?: number;
  consumedLeads?: number;
  followersCount?: number;
  isDeleted: boolean;
  createdAt: string;
  lastLoginDate?: string | null;
  updatedAt: string;
  userName?: string | null;
  userPhoto?: string | null;
  coverImage?: string | null;
  registeredAddress?: string | null;
  about?: string | null;
  operationalAddress?: string | null;
}

export interface Post {
  id: string;
  content: string;
  images?: string[];
  video?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  savesCount: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  company: Company;
  companyId: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Comment {
  id: string;
  companyId: string;
  postId: string;
  comment: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  company: Company;
}

interface ApiResponse<T> {
  statusCode: number;
  status: string;
  message: string;
  data: T;
  errors: any;
}

interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

interface SaveResponse {
  saved: boolean;
  savesCount: number;
}

interface RemoveSaveResponse {
  removed: boolean;
  savesCount: number;
}

interface CreateCommentData {
  comment: string;
}

interface CreatePostData {
  content: string;
}

interface MediaFile {
  uri: string;
  type?: string;
  name?: string;
}

interface CreatePostWithMediaData {
  content: string;
  images?: (MediaFile | File)[];
  video?: MediaFile | File;
}

// --- Posts API ---

export const postsAPI = {
  /**
   * Get all posts with pagination
   */
  getAllPosts: (page: number = 1, limit: number = 10): Promise<ApiResponse<Post[]>> => 
    apiCall(`posts?page=${page}&limit=${limit}`, 'GET', null, false),

  /**
   * Get top 10 posts by engagement (public)
   */
  getTopTenPosts: (): Promise<ApiResponse<Post[]>> => 
    apiCall('posts/top-ten', 'GET', null, false),

  /**
   * Get only video posts with pagination
   */
  getVideoPosts: (page: number = 1, limit: number = 10): Promise<ApiResponse<Post[]>> => 
    apiCall(`posts/videos?page=${page}&limit=${limit}`, 'GET', null, false),

  /**
   * Get a single post by ID
   */
  getPostById: (postId: string): Promise<ApiResponse<Post>> => 
    apiCall(`posts/${postId}`, 'GET', null, false),

  /**
   * Get authenticated user's posts
   */
  getMyPosts: (): Promise<ApiResponse<Post[]>> => 
    apiCall('posts/my-posts', 'GET', null, true),

  /**
   * Get authenticated user's saved posts with pagination
   */
  getMySavedPosts: (page: number = 1, limit: number = 10): Promise<ApiResponse<Post[]>> => 
    apiCall(`posts/saved/my-saved-posts?page=${page}&limit=${limit}`, 'GET', null, true),

  /**
   * Like/Unlike a post (toggle)
   */
  toggleLike: (postId: string): Promise<ApiResponse<LikeResponse>> => 
    apiCall(`posts/${postId}/like`, 'POST', null, true),

  /**
   * Save/Unsave a post (toggle)
   */
  toggleSave: (postId: string): Promise<ApiResponse<SaveResponse>> => 
    apiCall(`posts/${postId}/save`, 'POST', null, true),

  /**
   * Remove a post from saved posts (explicit delete)
   */
  removeSavedPost: (postId: string): Promise<ApiResponse<RemoveSaveResponse>> => 
    apiCall(`posts/saved/${postId}`, 'DELETE', null, true),

  /**
   * Get comments for a post
   */
  getComments: (postId: string): Promise<ApiResponse<Comment[]>> => 
    apiCall(`posts/${postId}/comments`, 'GET', null, false),

  /**
   * Add a comment to a post
   */
  addComment: (postId: string, data: CreateCommentData): Promise<ApiResponse<Comment>> => 
    apiCall(`posts/${postId}/comments`, 'POST', data, true),

  /**
   * Delete a comment
   */
  deleteComment: (commentId: string): Promise<ApiResponse<any>> => 
    apiCall(`posts/comments/${commentId}`, 'DELETE', null, true),

  /**
   * Create a text-only post (no media)
   */
  createPost: (data: CreatePostData): Promise<ApiResponse<Post>> => 
    apiCall('posts', 'POST', data, true),

  /**
   * Create a post with media (images OR video, not both)
   */
  createPostWithMedia: async (data: CreatePostWithMediaData): Promise<ApiResponse<Post>> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const formData = new FormData();
      
      // Add text field
      formData.append('content', data.content);
      
      // Add media files (either images OR video)
      if (data.images && data.images.length > 0) {
        console.log('Adding images to FormData:', data.images.length);
        data.images.forEach((image, index) => {
          if (image instanceof File) {
            // Web: Use File object directly
            formData.append('images', image);
            console.log(`Added image ${index} (File):`, image.name);
          } else {
            // Native: Use object format
            formData.append('images', {
              uri: image.uri,
              type: image.type || 'image/jpeg',
              name: image.name || `image_${index}.jpg`,
            } as any);
            console.log(`Added image ${index} (URI):`, image.name);
          }
        });
      } else if (data.video) {
        console.log('Adding video to FormData');
        if (data.video instanceof File) {
          // Web: Use File object directly
          formData.append('video', data.video);
          console.log('Added video (File):', data.video.name);
        } else {
          // Native: Use object format
          formData.append('video', {
            uri: data.video.uri,
            type: data.video.type || 'video/mp4',
            name: data.video.name || 'video.mp4',
          } as any);
          console.log('Added video (URI):', data.video.name);
        }
      } else {
        throw new Error('Please provide at least one image or a video');
      }

      console.log('Sending FormData to API...');

      const response = await axios.post(
        `${Config.API_BASE_URL}/posts/with-media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
          timeout: 120000,
        }
      );

      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('createPostWithMedia error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to create post with media';
      throw new Error(errorMessage);
    }
  },

  /**
   * Update a post (text only, no media changes)
   */
  updatePost: (postId: string, data: Partial<CreatePostData>): Promise<ApiResponse<Post>> => 
    apiCall(`posts/${postId}`, 'PATCH', data, true),

  /**
   * Delete a post
   */
  deletePost: (postId: string): Promise<ApiResponse<any>> => 
    apiCall(`posts/${postId}`, 'DELETE', null, true),
};