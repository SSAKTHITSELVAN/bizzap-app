//  BIZZAP/services/news.js

import { apiCall } from './apiClient';

// --- Interfaces for Posts ---

interface Post {
  id: string;
  content: string;
  companyId: string;
  likesCount: number;
  commentsCount: number;
  // ... other post properties
}

interface Comment {
  id: string;
  postId: string;
  content: string;
  userId: string;
}

/**
 * Posts API calls (Mapped to news.js in the structure).
 */
export const postsAPI = {
  getAllPosts: (): Promise<Post[]> => 
    apiCall('posts'),

  getPostById: (id: string): Promise<Post> => 
    apiCall(`posts/${id}`),

  createPost: (data: { content: string, media?: string[] }): Promise<Post> => 
    apiCall('posts', 'POST', data),

  updatePost: (id: string, data: Partial<{ content: string }>): Promise<Post> => 
    apiCall(`posts/${id}`, 'PATCH', data),

  deletePost: (id: string): Promise<{ success: boolean }> => 
    apiCall(`posts/${id}`, 'DELETE'),

  togglePostLike: (id: string): Promise<{ isLiked: boolean, likesCount: number }> => 
    apiCall(`posts/${id}/like`, 'POST'),

  addComment: (id: string, data: { content: string }): Promise<Comment> => 
    apiCall(`posts/${id}/comments`, 'POST', data),
};