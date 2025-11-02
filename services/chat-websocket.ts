// services/chat-websocket.ts - FIXED FILE UPLOAD

import { apiCall } from './apiClient';
import { io, Socket } from 'socket.io-client';
import { Config } from '../constants/config';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Interfaces ---

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  isRead: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: any;
  receiver?: any;
}

interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    companyName: string;
    phoneNumber: string;
    logo: string | null;
  };
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
}

interface ApiResponse<T> {
  statusCode: number;
  status: string;
  message: string;
  data: T;
  errors: any;
}

/**
 * Enhanced WebSocket Chat Client using Socket.IO
 */
export class ChatWebSocket {
  private socket: Socket | null = null;
  private token: string;
  private eventHandlers: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isManualDisconnect = false;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket.IO already connected');
      return;
    }

    const wsUrl = Config.API_BASE_URL.replace(/^http/, 'ws').replace(/^https/, 'wss');
    
    console.log('Connecting to Socket.IO:', wsUrl);

    this.isManualDisconnect = false;

    this.socket = io(wsUrl, {
      auth: {
        token: this.token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 3000,
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('connected', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.emit('disconnected', { reason });
      
      if (reason === 'io server disconnect') {
        if (!this.isManualDisconnect) {
          this.socket?.connect();
        }
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      this.reconnectAttempts++;
      this.emit('error', { message: error.message, attempt: this.reconnectAttempts });
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('reconnectFailed', {});
      }
    });

    this.socket.on('new_message', (data) => {
      console.log('New message received:', data);
      this.emit('newMessage', data.data);
    });

    this.socket.on('message_sent', (data) => {
      console.log('Message sent confirmation:', data);
      this.emit('messageSent', data.data);
    });

    this.socket.on('message_error', (data) => {
      console.error('Message error:', data);
      this.emit('messageError', data);
    });

    this.socket.on('file_sent', (data) => {
      console.log('File sent confirmation:', data);
      this.emit('fileSent', data.data);
    });

    this.socket.on('file_error', (data) => {
      console.error('File error:', data);
      this.emit('fileError', data);
    });

    this.socket.on('user_typing', (data) => {
      console.log('User typing:', data);
      this.emit('typing', data);
    });

    this.socket.on('upload_progress', (data) => {
      console.log('Upload progress:', data);
      this.emit('uploadProgress', data);
    });

    this.socket.on('notification', (data) => {
      console.log('Notification received:', data);
      this.emit('notification', data);
    });
  }

  /**
   * Send a text message via WebSocket
   */
  sendMessage(receiverId: string, message: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      this.emit('error', { message: 'Socket not connected' });
      return;
    }

    console.log('Sending message via socket:', { receiverId, message });
    
    this.socket.emit('send_message', {
      receiverId,
      message,
      messageType: 'text'
    });
  }

  /**
   * Send a file via WebSocket
   */
  async sendFile(
    receiverId: string,
    file: { uri: string; type: string; name: string },
    message?: string
  ): Promise<void> {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      this.emit('error', { message: 'Socket not connected' });
      return;
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('Sending file via socket:', {
        receiverId,
        fileName: file.name,
        size: base64.length
      });

      this.socket.emit('send_file', {
        receiverId,
        message,
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
        fileSize: base64.length,
      });
    } catch (error: any) {
      console.error('Failed to send file:', error);
      this.emit('fileError', { message: error.message });
    }
  }

  /**
   * Send typing indicator
   */
  sendTyping(receiverId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { receiverId });
    }
  }

  /**
   * Send stop typing indicator
   */
  sendStopTyping(receiverId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { receiverId });
    }
  }

  /**
   * Join a conversation room
   */
  joinConversation(companyId: string): void {
    if (this.socket?.connected) {
      console.log('Joining conversation:', companyId);
      this.socket.emit('join_conversation', { companyId });
    }
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(companyId: string): void {
    if (this.socket?.connected) {
      console.log('Leaving conversation:', companyId);
      this.socket.emit('leave_conversation', { companyId });
    }
  }

  /**
   * Register event handler
   */
  on(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  /**
   * Remove event handler
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all registered handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from Socket.IO
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

/**
 * Enhanced Chat API with all CRUD operations
 */
export const chatAPI = {
  /**
   * Send a text message via REST
   */
  sendMessage: (data: { receiverId: string; message: string; messageType?: string; fileName?: string; }): Promise<ApiResponse<Message>> => 
    apiCall<ApiResponse<Message>>('chat/send', 'POST', { ...data, messageType: data.messageType || 'text', }),

  /**
   * FIXED: Send a file with message via REST - Using XHR for progress tracking
   */
  sendFile: async (
    receiverId: string,
    file: { uri: string; type: string; name: string },
    message: string = '',
    onProgress: ((percent: number) => void) | null = null
  ): Promise<ApiResponse<Message>> => {
    if (!file?.uri) {
      throw new Error('File URI is required');
    }
    if (!receiverId) {
      throw new Error('Receiver ID is required');
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const apiUrl = `${Config.API_BASE_URL}/chat/send-file`;

      console.log('🔧 Preparing file upload:', {
        apiUrl,
        fileName: file.name,
        fileType: file.type,
        fileUri: file.uri,
        receiverId,
        message,
      });

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            console.log(`📊 Upload progress: ${percentComplete}%`);
            onProgress(percentComplete);
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          console.log('📥 Response received:', xhr.status);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('✅ Upload successful:', response);
              resolve(response);
            } catch (error) {
              console.error('❌ Failed to parse response:', xhr.responseText);
              reject(new Error('Failed to parse server response'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              console.error('❌ Upload failed:', errorResponse);
              reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
            } catch {
              console.error('❌ Upload failed with status:', xhr.status);
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          console.error('❌ Network error during upload');
          reject(new Error('Network error during file upload'));
        });

        xhr.addEventListener('abort', () => {
          console.error('❌ Upload cancelled');
          reject(new Error('File upload was cancelled'));
        });

        // Prepare form data
        const formData = new FormData();
        
        // CRITICAL FIX: For web, we need to create a proper File object from the blob URI
        if (typeof window !== 'undefined' && file.uri.startsWith('blob:')) {
          console.log('🌐 Web environment detected, converting blob to file...');
          
          // Fetch the blob and convert to File
          fetch(file.uri)
            .then(res => res.blob())
            .then(blob => {
              const actualFile = new File([blob], file.name, { type: file.type });
              console.log('📦 Created File object:', {
                name: actualFile.name,
                size: actualFile.size,
                type: actualFile.type,
              });
              
              formData.append('file', actualFile);
              formData.append('receiverId', receiverId);
              
              if (message) {
                formData.append('message', message);
              }

              console.log('📤 Sending FormData with keys:', Array.from(formData.keys()));
              
              // Send request
              xhr.open('POST', apiUrl);
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
              xhr.send(formData);
            })
            .catch(err => {
              console.error('❌ Failed to convert blob to file:', err);
              reject(new Error('Failed to prepare file for upload'));
            });
        } else {
          // Native mobile - use original format
          console.log('📱 Native environment detected');
          
          formData.append('file', {
            uri: file.uri,
            type: file.type || 'application/octet-stream',
            name: file.name || 'file',
          } as any);

          formData.append('receiverId', receiverId);
          
          if (message) {
            formData.append('message', message);
          }

          console.log('📤 Sending FormData (native)');
          
          // Send request
          xhr.open('POST', apiUrl);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(formData);
        }
      });
    } catch (error: any) {
      console.error('❌ File upload preparation failed:', error);
      throw error;
    }
  },

  /**
   * Get chat history
   */
  getChatHistory: (companyId: string): Promise<ApiResponse<Message[]>> => 
    apiCall<ApiResponse<Message[]>>(`chat/history/${companyId}`),
  
  /**
   * Get all conversations
   */
  getConversations: (): Promise<ApiResponse<Conversation[]>> => 
    apiCall<ApiResponse<Conversation[]>>('chat/conversations'),
  
  /**
   * Edit a message
   */
  editMessage: (messageId: string, data: { message: string }): Promise<ApiResponse<Message>> =>
    apiCall<ApiResponse<Message>>(`chat/message/${messageId}`, 'PATCH', data),
  
  /**
   * Delete a message
   */
  deleteMessage: (messageId: string): Promise<ApiResponse<any>> =>
    apiCall<ApiResponse<any>>(`chat/message/${messageId}`, 'DELETE'),
  
  /**
   * Mark messages as read
   */
  markAsRead: (companyId: string): Promise<ApiResponse<{ unreadCount: number }>> => 
    apiCall<ApiResponse<{ unreadCount: number }>>(`chat/mark-read/${companyId}`, 'POST'),
  
  /**
   * Get total unread count
   */
  getUnreadCount: (): Promise<ApiResponse<{ unreadCount: number }>> => 
    apiCall<ApiResponse<{ unreadCount: number }>>('chat/unread-count'),
  
  /**
   * Get file URL
   */
  getFileUrl: (messageId: string): Promise<ApiResponse<{ fileUrl: string }>> => 
    apiCall<ApiResponse<{ fileUrl: string }>>(`chat/file/${messageId}`),
  
  /**
   * Get a specific message
   */
  getMessage: (messageId: string): Promise<ApiResponse<Message>> => 
    apiCall<ApiResponse<Message>>(`chat/message/${messageId}`),
  
  /**
   * Search messages
   */
  searchMessages: (companyId: string, query: string): Promise<ApiResponse<Message[]>> => 
    apiCall<ApiResponse<Message[]>>(`chat/search/${companyId}`, 'GET', { q: query }),
};

/**
 * Singleton WebSocket instance manager
 */
class WebSocketManager {
  private static instance: ChatWebSocket | null = null;

  static getInstance(token: string): ChatWebSocket {
    if (!this.instance) {
      this.instance = new ChatWebSocket(token);
    }
    return this.instance;
  }

  static resetInstance(): void {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }
  }
}

// Global instance to use across the app
let chatSocket: ChatWebSocket | null = null;

export const initializeChatSocket = async (): Promise<ChatWebSocket> => {
  if (chatSocket && chatSocket.isConnected()) {
    return chatSocket;
  }
  
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  if (!chatSocket) {
    chatSocket = new ChatWebSocket(token);
  } else {
    (chatSocket as any).token = token;
  }
  
  chatSocket.connect();
  
  return chatSocket;
};

export const getChatSocket = (): ChatWebSocket => {
  if (!chatSocket) {
    throw new Error('Chat socket not initialized. Call initializeChatSocket first.');
  }
  return chatSocket;
};

export const disconnectChatSocket = (): void => {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
};