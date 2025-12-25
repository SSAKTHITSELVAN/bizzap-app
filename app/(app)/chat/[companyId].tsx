// app/(app)/chat/[companyId].tsx

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Edit3,
  File,
  Image as ImageIcon,
  Maximize,
  Paperclip,
  Search,
  Send,
  Trash2,
  X
} from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Config } from '../../../constants/config';
import { chatAPI, initializeChatSocket, ChatWebSocket } from '../../../services/chat-websocket';
import { companyAPI } from '../../../services/user';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive sizing function
const getResponsiveSize = (size: number) => {
  const baseWidth = 390;
  const scale = SCREEN_WIDTH / baseWidth;
  const newSize = size * scale;
  return Math.round(newSize);
};

// Font scaling with limits
const getFontSize = (size: number) => {
  const scale = SCREEN_WIDTH / 390;
  const newSize = size * scale;
  if (scale < 0.85) return Math.round(size * 0.85);
  if (scale > 1.15) return Math.round(size * 1.15);
  return Math.round(newSize);
};

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
  isRead: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: any;
  receiver?: any;
  // Local UI states
  isPending?: boolean;
  isError?: boolean;
}

interface SelectedFile {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

const SuccessToast: React.FC<ToastProps> = ({ message, visible, onDismiss }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        const timer = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(onDismiss);
        }, 2000);
        return () => clearTimeout(timer);
      });
    }
  }, [visible, fadeAnim, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.toastContainer, { opacity: fadeAnim }]}
      pointerEvents="none"
    >
      <View style={styles.toastContent}>
        <Check size={getResponsiveSize(20)} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

export default function ChatScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList<Message>>(null);
  const socketRef = useRef<ChatWebSocket | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [fullScreenMedia, setFullScreenMedia] = useState<{ url: string; mimeType: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Socket Event Handlers ---

  const handleNewMessage = useCallback((newMessage: Message) => {
    if (newMessage.senderId === companyId || newMessage.receiverId === companyId) {
      setMessages((prevMessages) => {
        const exists = prevMessages.some((msg) => msg.id === newMessage.id);
        if (exists) return prevMessages;
        return [...prevMessages, newMessage];
      });

      // Scroll to bottom if not searching
      if (!isSearching) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  }, [companyId, isSearching]);

  // --- Filtering Logic ---
  const filteredMessages = useMemo(() => {
    if (!isSearching || !searchQuery.trim()) {
      return messages;
    }
    return messages.filter((msg) => {
      const textMatch = msg.message?.toLowerCase().includes(searchQuery.toLowerCase());
      const fileMatch = msg.fileName?.toLowerCase().includes(searchQuery.toLowerCase());
      return textMatch || fileMatch;
    });
  }, [messages, isSearching, searchQuery]);

  // --- Effects ---

  useEffect(() => {
    if (companyId) {
      fetchCurrentUser();
      fetchPartnerInfo();
      fetchChatHistory();
      setupSocket();
    }

    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        if (!isSearching) {
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      
      if (socketRef.current) {
        socketRef.current.leaveConversation(companyId);
        socketRef.current.off('newMessage', handleNewMessage);
      }
    };
  }, [companyId]);

  useEffect(() => {
    if (companyId && messages.length > 0 && currentUserId) {
      const unreadMessages = messages.filter(
        (msg) => msg.receiverId === currentUserId && !msg.isRead
      );
      if (unreadMessages.length > 0) {
        markMessagesAsRead();
      }
    }
  }, [messages, currentUserId, companyId]);

  // --- API & Socket Functions ---

  const setupSocket = async () => {
    try {
      const socket = await initializeChatSocket();
      socketRef.current = socket;
      socket.joinConversation(companyId);
      socket.off('newMessage', handleNewMessage);
      socket.on('newMessage', handleNewMessage);
    } catch (error) {
      console.error('Failed to initialize chat socket:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const profile = await companyAPI.getProfile();
      setCurrentUserId(profile.id);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchPartnerInfo = async () => {
    try {
      const data = await companyAPI.getCompanyById(companyId);
      setPartnerInfo(data);
    } catch (error) {
      console.error('Failed to fetch partner info:', error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getChatHistory(companyId);
      setMessages(response.data);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 300);
    } catch (error: any) {
      console.error('Failed to fetch chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await chatAPI.markAsRead(companyId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiverId === currentUserId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  // --- Navigation Logic ---
  const handleOpenProfile = () => {
    if (companyId) {
      router.push(`/(app)/chat/partner-profile/${companyId}`);
    }
  };

  // --- Search Handlers ---
  const toggleSearch = () => {
    setIsSearching(true);
  };

  const cancelSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    // Scroll back to bottom when search closes
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // --- Send Logic (Optimistic Updates) ---

  const sendMessage = async () => {
    if (!inputText.trim() && !editingMessage) return;

    const messageText = inputText.trim();
    setInputText(''); 

    if (editingMessage) {
      try {
        const response = await chatAPI.editMessage(editingMessage.id, {
          message: messageText,
        });
        setMessages((prev) =>
          prev.map((msg) => (msg.id === editingMessage.id ? response.data : msg))
        );
        setEditingMessage(null);
      } catch (error: any) {
        Alert.alert('Error', 'Failed to edit message');
      }
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      senderId: currentUserId,
      receiverId: companyId,
      message: messageText,
      messageType: 'text',
      isRead: false,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPending: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await chatAPI.sendMessage({
        receiverId: companyId,
        message: messageText,
      });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? response.data : msg))
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, isError: true, isPending: false } : msg))
      );
    }
  };

  const sendFilesWithMessage = async () => {
    if (selectedFiles.length === 0) {
      await sendMessage();
      return;
    }

    const messageText = inputText.trim();
    const filesToSend = [...selectedFiles];
    
    setInputText('');
    setSelectedFiles([]);
    setSuccessMessage(filesToSend.length > 1 ? 'Files uploading... 📎' : 'File uploading... 📎');
    setShowSuccessToast(true);

    const tempMessages: Message[] = filesToSend.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      senderId: currentUserId,
      receiverId: companyId,
      message: index === 0 ? messageText : '',
      messageType: file.type.startsWith('image/') ? 'image' : 'file',
      fileUrl: file.uri,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      isRead: false,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPending: true,
    }));

    setMessages((prev) => [...prev, ...tempMessages]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    filesToSend.forEach(async (file, index) => {
      const tempId = tempMessages[index].id;
      const textToSend = index === 0 ? messageText : '';

      try {
        const response = await chatAPI.sendFile(
          companyId,
          file,
          textToSend,
          (progress) => {
            console.log(`File ${index} progress: ${progress}`);
          }
        );

        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? response.data : msg))
        );
      } catch (error) {
        console.error(`Failed to send file ${index}:`, error);
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? { ...msg, isError: true, isPending: false } : msg))
        );
      }
    });
  };

  // --- Input Handlers ---

  const handleSend = async () => {
    if (selectedFiles.length > 0) {
      await sendFilesWithMessage();
    } else {
      await sendMessage();
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newFiles: SelectedFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `image_${Date.now()}.jpg`,
        size: asset.fileSize,
      }));
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file: SelectedFile = {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType || 'application/octet-stream',
          name: result.assets[0].name,
          size: result.assets[0].size,
        };
        setSelectedFiles([...selectedFiles, file]);
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // --- Utility ---

  const deleteMessage = async (messageId: string) => {
    setShowOptionsModal(false);
    Alert.alert('Delete Message', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatAPI.deleteMessage(messageId);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, isDeleted: true, message: 'This message was deleted.', fileUrl: undefined }
                  : msg
              )
            );
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete message');
          }
        },
      },
    ]);
  };

  const startEdit = (message: Message) => {
    setEditingMessage(message);
    setInputText(message.message);
    setShowOptionsModal(false);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setInputText('');
  };

  const handleMediaPress = (fileUrl: string, mimeType: string) => {
    setFullScreenMedia({ url: fileUrl, mimeType });
  };

  const closeFullScreenViewer = () => {
    setFullScreenMedia(null);
  };

  const handleDismissToast = () => {
    setShowSuccessToast(false);
    setSuccessMessage('');
  };

  const getImageUrl = (fileUrl?: string) => {
    if (!fileUrl) return 'https://via.placeholder.com/150';
    if (fileUrl.startsWith('http') || fileUrl.startsWith('file://') || fileUrl.startsWith('content://')) {
      return fileUrl;
    }
    return `${Config.API_BASE_URL}/${fileUrl}`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUserId;
    const isImage = item.messageType === 'image' || item.mimeType?.startsWith('image/');
    const isVideo = item.messageType === 'video' || item.mimeType?.startsWith('video/');
    const isFile = item.messageType === 'file' || item.messageType === 'document' || (!isImage && !isVideo && item.fileUrl);

    // Styling for pending/error messages
    const containerOpacity = item.isPending ? 0.6 : 1;
    const hasError = item.isError;

    return (
      <View style={[styles.messageWrapper, { opacity: containerOpacity }]}>
        <View style={styles.messageRow}>
          {!isOwnMessage && (
            <Image
              source={{ uri: getImageUrl(partnerInfo?.logo) || 'https://via.placeholder.com/40' }}
              style={styles.senderAvatar}
            />
          )}

          <View style={{ flex: 1 }}>
            {!isOwnMessage && (
              <View style={styles.senderNameWrapper}>
                <Text style={styles.senderName}>{partnerInfo?.companyName || 'Partner'}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.messageContainer,
                isOwnMessage ? styles.ownMessage : styles.partnerMessage,
                hasError && { borderColor: '#EF4444', borderWidth: 1 }
              ]}
              onLongPress={() => {
                if (isOwnMessage && !item.isDeleted && !item.isPending) {
                  setSelectedMessage(item);
                  setShowOptionsModal(true);
                }
              }}
              onPress={() => {
                if ((isImage || isVideo) && item.fileUrl && item.mimeType) {
                  handleMediaPress(item.fileUrl, item.mimeType);
                }
              }}
              delayLongPress={500}
              activeOpacity={isImage || isVideo ? 0.7 : 1}
            >
              {item.isDeleted ? (
                <View style={styles.deletedMessage}>
                  <Trash2 size={getResponsiveSize(14)} color="#9CA3AF" style={{ marginRight: getResponsiveSize(4) }} />
                  <Text style={styles.deletedText}>Message deleted</Text>
                </View>
              ) : (
                <>
                  {(isImage || isVideo) && item.fileUrl && (
                    <View style={styles.mediaWrapper}>
                      <Image
                        source={{ uri: getImageUrl(item.fileUrl) }}
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                      {item.isPending && (
                        <View style={styles.pendingOverlay}>
                          <ActivityIndicator size="small" color="#FFF" />
                        </View>
                      )}
                      <View style={styles.mediaOverlay}>
                        {!item.isPending && <Maximize size={getResponsiveSize(24)} color="#FFFFFF" />}
                        {isVideo && <Text style={styles.videoLabel}>VIDEO</Text>}
                      </View>
                    </View>
                  )}

                  {isFile && item.fileUrl && (
                    <View style={styles.fileContainer}>
                      {item.isPending ? (
                         <ActivityIndicator size="small" color="#3B82F6" />
                      ) : (
                         <File size={getResponsiveSize(32)} color="#3B82F6" />
                      )}
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {item.fileName || 'Document'}
                        </Text>
                        {item.fileSize && (
                          <Text style={styles.fileSize}>
                            {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {item.message && (
                    <Text
                      style={[
                        styles.messageText,
                        isOwnMessage ? styles.ownMessageText : styles.partnerMessageText,
                      ]}
                    >
                      {item.message}
                    </Text>
                  )}
                  
                  {hasError && (
                    <Text style={{color: '#EF4444', fontSize: 10, marginTop: 4}}>Failed to send</Text>
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>

          {isOwnMessage && (
             <View style={{ width: getResponsiveSize(16), alignItems: 'center' }}>
             </View>
          )}
        </View>

        <View style={[styles.messageTimeWrapper, isOwnMessage && styles.ownMessageTimeWrapper]}>
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
          {item.isPending && !hasError && (
              <Text style={styles.sendingText}> • Sending...</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* HEADER: Dynamic rendering based on Search Mode */}
        {isSearching ? (
          <View style={styles.headerSearchContainer}>
            <TouchableOpacity 
              onPress={cancelSearch} 
              style={styles.backButton} 
              activeOpacity={0.7}
            >
              <ArrowLeft size={getResponsiveSize(18)} color="#8FA8CC" strokeWidth={2.5} />
            </TouchableOpacity>

            <TextInput
              style={styles.headerSearchInput}
              placeholder="Search messages..."
              placeholderTextColor="#8EA8CC"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              returnKeyType="search"
            />

            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                <X size={getResponsiveSize(18)} color="#8FA8CC" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
              <View style={styles.backIconWrapper}>
                <ArrowLeft size={getResponsiveSize(18)} color="#8FA8CC" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* Clickable Header for Profile */}
            <TouchableOpacity 
              style={styles.headerCenter} 
              activeOpacity={0.7} 
              onPress={handleOpenProfile}
            >
              <Image
                source={{
                  uri: getImageUrl(partnerInfo?.logo) || 'https://via.placeholder.com/32',
                }}
                style={styles.headerAvatar}
              />
              <Text style={styles.headerTitle} numberOfLines={1}>
                {partnerInfo?.companyName || 'Chat Partner'}
              </Text>
            </TouchableOpacity>

            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.searchButton} 
                activeOpacity={0.7}
                onPress={toggleSearch}
              >
                <Search size={getResponsiveSize(24)} color="#8FA8CC" />
              </TouchableOpacity>
              <View style={styles.moreOptionsPlaceholder} />
            </View>
          </View>
        )}

        {/* TODAY SEPARATOR */}
        <View style={styles.todaySeparator}>
          <Text style={styles.todayText}>Today</Text>
        </View>

        {/* CHAT MESSAGES LIST */}
        <FlatList
          ref={flatListRef}
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          inverted={false}
          onContentSizeChange={() => {
             // Only scroll if not searching/filtering
             if (!isSearching) {
               flatListRef.current?.scrollToEnd({ animated: true });
             }
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isSearching && searchQuery.length > 0 ? (
              <View style={styles.emptySearchContainer}>
                 <Text style={styles.emptySearchText}>No messages found for "{searchQuery}"</Text>
              </View>
            ) : null
          }
        />

        {/* EDITING BAR */}
        {editingMessage && (
          <View style={styles.editingBar}>
            <View style={styles.editingBarIcon}>
              <Edit3 size={getResponsiveSize(16)} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.editingTitle}>Editing Message</Text>
              <Text style={styles.editingText} numberOfLines={1}>
                {editingMessage.message}
              </Text>
            </View>
            <TouchableOpacity onPress={cancelEdit} activeOpacity={0.7}>
              <X size={getResponsiveSize(20)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* SELECTED FILES PREVIEW */}
        {selectedFiles.length > 0 && (
          <View style={styles.selectedFilesContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedFilesScroll}
            >
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.selectedFileItem}>
                  {file.type.startsWith('image/') ? (
                    <Image source={{ uri: file.uri }} style={styles.selectedFileImage} />
                  ) : (
                    <View style={styles.selectedFileIcon}>
                      <File size={getResponsiveSize(24)} color="#3B82F6" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => removeSelectedFile(index)}
                    activeOpacity={0.7}
                  >
                    <X size={getResponsiveSize(16)} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.selectedFileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* INPUT CONTAINER (WhatsApp Style) - Hidden when searching for better UX */}
        {!isSearching && (
          <View style={styles.inputContainer}>
            <View style={styles.inputCapsule}>
              <TextInput
                style={styles.input}
                placeholder={editingMessage ? 'Edit your message...' : 'Message'}
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline={true}
                textAlignVertical="center"
                editable={true}
              />
              
              <View style={styles.inputActions}>
                <TouchableOpacity onPress={pickDocument} style={styles.iconButton}>
                  <Paperclip size={getResponsiveSize(20)} color="#9CA3AF" style={{transform: [{rotate: '45deg'}]}} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={pickImage} style={[styles.iconButton, {marginLeft: 8}]}>
                  <ImageIcon size={getResponsiveSize(20)} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSend}
              style={[
                styles.sendFab,
                (!inputText.trim() && selectedFiles.length === 0 && !editingMessage) ? styles.sendFabDisabled : null
              ]}
              disabled={(!inputText.trim() && selectedFiles.length === 0 && !editingMessage)}
              activeOpacity={0.8}
            >
              <Send size={getResponsiveSize(20)} color="#FFFFFF" style={{marginLeft: 2}} />
            </TouchableOpacity>
          </View>
        )}

      </KeyboardAvoidingView>

      {/* OPTIONS MODAL */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.optionsModal}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>Message Options</Text>
            </View>
            
            {selectedMessage?.messageType === 'text' && !selectedMessage?.fileUrl && (
              <>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => selectedMessage && startEdit(selectedMessage)}
                >
                  <View style={styles.optionIconContainer}>
                    <Edit3 size={getResponsiveSize(20)} color="#3B82F6" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>Edit Message</Text>
                    <Text style={styles.optionSubtext}>Change the message content</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
              </>
            )}
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => selectedMessage && deleteMessage(selectedMessage.id)}
            >
              <View style={styles.optionIconContainer}>
                <Trash2 size={getResponsiveSize(20)} color="#EF4444" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionText, styles.deleteText]}>Delete Message</Text>
                <Text style={styles.optionSubtext}>Remove this message permanently</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FULL-SCREEN MEDIA VIEWER */}
      <Modal
        visible={!!fullScreenMedia}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreenViewer}
      >
        <View style={styles.mediaViewerContainer}>
          <TouchableOpacity
            style={styles.mediaViewerCloseButton}
            onPress={closeFullScreenViewer}
            activeOpacity={0.7}
          >
            <X size={getResponsiveSize(28)} color="#FFFFFF" />
          </TouchableOpacity>

          {fullScreenMedia?.url && (
            <Image
              source={{ uri: getImageUrl(fullScreenMedia.url) }}
              style={styles.fullScreenMedia}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* SUCCESS TOAST */}
      <SuccessToast
        message={successMessage}
        visible={showSuccessToast}
        onDismiss={handleDismissToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSize(16),
    paddingTop: getResponsiveSize(16),
    paddingBottom: getResponsiveSize(8),
    backgroundColor: '#0F1623',
    height: getResponsiveSize(64),
  },
  headerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16),
    paddingTop: getResponsiveSize(16),
    paddingBottom: getResponsiveSize(8),
    backgroundColor: '#0F1623',
    height: getResponsiveSize(64),
    gap: getResponsiveSize(10),
  },
  headerSearchInput: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: getResponsiveSize(8),
    paddingVertical: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(12),
    color: '#FFFFFF',
    fontSize: getFontSize(16),
  },
  clearSearchButton: {
    padding: getResponsiveSize(8),
  },
  backButton: {
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconWrapper: {
    width: getResponsiveSize(24),
    height: getResponsiveSize(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveSize(8),
  },
  headerAvatar: {
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    borderRadius: getResponsiveSize(16),
    backgroundColor: '#374151',
  },
  headerTitle: {
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(12),
    minWidth: getResponsiveSize(60),
    justifyContent: 'flex-end',
  },
  searchButton: {
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    borderRadius: getResponsiveSize(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreOptionsPlaceholder: {
    width: getResponsiveSize(12),
  },
  todaySeparator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(16),
  },
  todayText: {
    color: '#FFFFFF',
    fontSize: getFontSize(14),
    fontWeight: '600',
    lineHeight: getFontSize(24),
  },
  messageList: {
    paddingHorizontal: getResponsiveSize(16),
    paddingVertical: getResponsiveSize(16),
    paddingBottom: getResponsiveSize(20),
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: getResponsiveSize(40),
  },
  emptySearchText: {
    color: '#8EA8CC',
    fontSize: getFontSize(16),
  },
  messageWrapper: {
    marginVertical: getResponsiveSize(8),
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: getResponsiveSize(12),
  },
  senderAvatar: {
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    borderRadius: getResponsiveSize(20),
    backgroundColor: '#374151',
  },
  senderNameWrapper: {
    marginBottom: getResponsiveSize(4),
  },
  senderName: {
    fontSize: getFontSize(13),
    color: '#8EA8CC',
    lineHeight: getFontSize(20),
  },
  messageContainer: {
    maxWidth: '100%',
    padding: getResponsiveSize(12),
    borderRadius: getResponsiveSize(12),
  },
  ownMessage: {
    backgroundColor: '#003E9C',
  },
  partnerMessage: {
    backgroundColor: '#0F1417',
  },
  messageText: {
    fontSize: getFontSize(16),
    lineHeight: getFontSize(24),
    color: '#FFFFFF',
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  partnerMessageText: {
    color: '#FFFFFF',
  },
  messageTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: getResponsiveSize(52),
    paddingTop: getResponsiveSize(4),
  },
  ownMessageTimeWrapper: {
    paddingLeft: 0,
    paddingRight: getResponsiveSize(52),
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: getFontSize(14),
    color: '#8EA8CC',
    lineHeight: getFontSize(21),
  },
  sendingText: {
    fontSize: getFontSize(12),
    color: '#8EA8CC',
    fontStyle: 'italic',
  },
  messageImage: {
    width: getResponsiveSize(200),
    height: getResponsiveSize(150),
    borderRadius: getResponsiveSize(10),
  },
  mediaWrapper: {
    borderRadius: getResponsiveSize(10),
    overflow: 'hidden',
    position: 'relative',
    marginBottom: getResponsiveSize(4),
  },
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)', // lighter overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  videoLabel: {
    color: '#FFFFFF',
    fontSize: getFontSize(12),
    fontWeight: '700',
    marginTop: getResponsiveSize(4),
    letterSpacing: 1,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(8),
    padding: getResponsiveSize(10),
    marginBottom: getResponsiveSize(4),
  },
  fileInfo: {
    marginLeft: getResponsiveSize(10),
    flexShrink: 1,
  },
  fileName: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: getResponsiveSize(2),
  },
  fileSize: {
    fontSize: getFontSize(12),
    color: '#9CA3AF',
  },
  deletedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSize(4),
  },
  deletedText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontSize: getFontSize(13),
  },
  selectedFilesContainer: {
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingVertical: getResponsiveSize(8),
  },
  selectedFilesScroll: {
    paddingHorizontal: getResponsiveSize(12),
    gap: getResponsiveSize(8),
  },
  selectedFileItem: {
    width: getResponsiveSize(80),
    alignItems: 'center',
  },
  selectedFileImage: {
    width: getResponsiveSize(80),
    height: getResponsiveSize(80),
    borderRadius: getResponsiveSize(8),
    backgroundColor: '#374151',
  },
  selectedFileIcon: {
    width: getResponsiveSize(80),
    height: getResponsiveSize(80),
    borderRadius: getResponsiveSize(8),
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFileButton: {
    position: 'absolute',
    top: getResponsiveSize(-6),
    right: getResponsiveSize(-6),
    backgroundColor: '#EF4444',
    borderRadius: getResponsiveSize(12),
    width: getResponsiveSize(24),
    height: getResponsiveSize(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFileName: {
    fontSize: getFontSize(10),
    color: '#9CA3AF',
    marginTop: getResponsiveSize(4),
    textAlign: 'center',
  },
  
  // WHATSAPP STYLE INPUT STYLES
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: getResponsiveSize(10),
    paddingTop: getResponsiveSize(10),
    paddingBottom: Platform.OS === 'ios' ? getResponsiveSize(90) : getResponsiveSize(80), 
    backgroundColor: '#000000',
  },
  inputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1F2937',
    borderRadius: getResponsiveSize(24),
    paddingHorizontal: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(8),
    marginRight: getResponsiveSize(8),
    minHeight: getResponsiveSize(48),
    maxHeight: getResponsiveSize(120),
  },
  input: {
    flex: 1,
    fontSize: getFontSize(16),
    color: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 6 : 0,
    paddingBottom: Platform.OS === 'ios' ? 6 : 0,
    marginRight: getResponsiveSize(8),
    maxHeight: getResponsiveSize(100),
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: getResponsiveSize(4),
  },
  iconButton: {
    padding: getResponsiveSize(4),
  },
  sendFab: {
    width: getResponsiveSize(48),
    height: getResponsiveSize(48),
    borderRadius: getResponsiveSize(24),
    backgroundColor: '#0057D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  sendFabDisabled: {
    backgroundColor: '#374151',
    opacity: 0.7,
  },
  
  editingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16),
    paddingVertical: getResponsiveSize(10),
    backgroundColor: '#1F2937',
    gap: getResponsiveSize(10),
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
  },
  editingBarIcon: {
    padding: getResponsiveSize(6),
    backgroundColor: '#3B82F6',
    borderRadius: getResponsiveSize(6),
  },
  editingTitle: {
    fontSize: getFontSize(12),
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: getResponsiveSize(2),
  },
  editingText: {
    fontSize: getFontSize(14),
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSize(20),
  },
  optionsModal: {
    backgroundColor: '#111827',
    borderRadius: getResponsiveSize(16),
    width: '100%',
    maxWidth: getResponsiveSize(340),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  optionsHeader: {
    padding: getResponsiveSize(16),
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#1F2937',
  },
  optionsTitle: {
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSize(16),
  },
  optionIconContainer: {
    width: getResponsiveSize(44),
    height: getResponsiveSize(44),
    borderRadius: getResponsiveSize(22),
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveSize(14),
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: getResponsiveSize(2),
  },
  optionSubtext: {
    fontSize: getFontSize(13),
    color: '#9CA3AF',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginHorizontal: getResponsiveSize(16),
  },
  deleteText: {
    color: '#EF4444',
  },
  mediaViewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaViewerCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? getResponsiveSize(30) : getResponsiveSize(60),
    right: getResponsiveSize(20),
    zIndex: 10,
    padding: getResponsiveSize(10),
    borderRadius: getResponsiveSize(25),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  fullScreenMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  toastContainer: {
    position: 'absolute',
    top: '10%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    paddingVertical: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(20),
    borderRadius: getResponsiveSize(25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    gap: getResponsiveSize(8),
  },
  toastText: {
    color: '#fff',
    fontSize: getFontSize(15),
    fontWeight: '600',
  },
});