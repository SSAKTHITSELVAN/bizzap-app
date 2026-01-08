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
  Phone,
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
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Config } from '../../../constants/config';
import { chatAPI, initializeChatSocket, ChatWebSocket } from '../../../services/chat-websocket';
import { companyAPI } from '../../../services/user';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive sizing function matching _layout.tsx logic
const getResponsiveSize = (size: number) => {
  const baseWidth = 390;
  const scale = SCREEN_WIDTH / baseWidth;
  const newSize = size * scale;
  return Math.round(newSize);
};

// Font scaling
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

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]} pointerEvents="none">
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
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Message>>(null);
  const socketRef = useRef<ChatWebSocket | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [fullScreenMedia, setFullScreenMedia] = useState<{ url: string; mimeType: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Logic ---

  const handleNewMessage = useCallback((newMessage: Message) => {
    if (newMessage.senderId === companyId || newMessage.receiverId === companyId) {
      setMessages((prevMessages) => {
        const exists = prevMessages.some((msg) => msg.id === newMessage.id);
        if (exists) return prevMessages;
        return [...prevMessages, newMessage];
      });
      if (!isSearching) {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }
  }, [companyId, isSearching]);

  const filteredMessages = useMemo(() => {
    if (!isSearching || !searchQuery.trim()) return messages;
    return messages.filter((msg) => {
      const textMatch = msg.message?.toLowerCase().includes(searchQuery.toLowerCase());
      const fileMatch = msg.fileName?.toLowerCase().includes(searchQuery.toLowerCase());
      return textMatch || fileMatch;
    });
  }, [messages, isSearching, searchQuery]);

  useEffect(() => {
    if (companyId) {
      fetchCurrentUser();
      fetchPartnerInfo();
      fetchChatHistory();
      setupSocket();
    }

    // Keyboard Listeners for dynamic UI adjustment
    const showListener = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideListener = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showListener, () => {
      setKeyboardVisible(true);
      if (!isSearching) setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const onHide = Keyboard.addListener(hideListener, () => {
      setKeyboardVisible(false);
    });

    return () => {
      onShow.remove();
      onHide.remove();
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
      if (unreadMessages.length > 0) markMessagesAsRead();
    }
  }, [messages, currentUserId, companyId]);

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
    } catch (error) { console.error(error); }
  };

  const fetchPartnerInfo = async () => {
    try {
      const data = await companyAPI.getCompanyById(companyId);
      setPartnerInfo(data);
    } catch (error) { console.error(error); }
  };

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getChatHistory(companyId);
      setMessages(response.data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 300);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const markMessagesAsRead = async () => {
    try {
      await chatAPI.markAsRead(companyId);
      setMessages((prev) =>
        prev.map((msg) => msg.receiverId === currentUserId ? { ...msg, isRead: true } : msg)
      );
    } catch (error) { console.error(error); }
  };

  const handleOpenProfile = () => {
    if (companyId) router.push(`/(app)/chat/partner-profile/${companyId}`);
  };

  const handleCall = () => {
    if (partnerInfo?.phoneNumber) {
      Linking.openURL(`tel:${partnerInfo.phoneNumber}`).catch(() => 
        Alert.alert('Error', 'Could not open dialer')
      );
    } else {
      Alert.alert('Info', 'Phone number not available');
    }
  };

  const toggleSearch = () => setIsSearching(true);
  const cancelSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // --- Send Logic ---

  const sendMessage = async () => {
    if (!inputText.trim() && !editingMessage) return;
    const messageText = inputText.trim();
    setInputText(''); 

    if (editingMessage) {
      try {
        const response = await chatAPI.editMessage(editingMessage.id, { message: messageText });
        setMessages((prev) => prev.map((msg) => (msg.id === editingMessage.id ? response.data : msg)));
        setEditingMessage(null);
      } catch (error) { Alert.alert('Error', 'Failed to edit message'); }
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
      const response = await chatAPI.sendMessage({ receiverId: companyId, message: messageText });
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? response.data : msg)));
    } catch (error) {
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, isError: true, isPending: false } : msg)));
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
    setSuccessMessage('Files uploading... 📎');
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
        const response = await chatAPI.sendFile(companyId, file, textToSend);
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? response.data : msg)));
      } catch (error) {
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, isError: true, isPending: false } : msg)));
      }
    });
  };

  const handleSend = async () => {
    if (selectedFiles.length > 0) await sendFilesWithMessage();
    else await sendMessage();
  };

  const handleAttachment = () => {
    setShowAttachMenu(true);
    Keyboard.dismiss();
  };

  const pickImage = async () => {
    setShowAttachMenu(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow access to photos');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
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
    setShowAttachMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        setSelectedFiles([...selectedFiles, {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType || 'application/octet-stream',
          name: result.assets[0].name,
          size: result.assets[0].size,
        }]);
      }
    } catch (error) { console.error(error); }
  };

  const removeSelectedFile = (index: number) => setSelectedFiles(selectedFiles.filter((_, i) => i !== index));

  const deleteMessage = async (messageId: string) => {
    setShowOptionsModal(false);
    Alert.alert('Delete', 'Delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await chatAPI.deleteMessage(messageId);
            setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, isDeleted: true, message: 'Message deleted', fileUrl: undefined } : msg));
          } catch (error) { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  const startEdit = (message: Message) => {
    setEditingMessage(message);
    setInputText(message.message);
    setShowOptionsModal(false);
  };

  // --- Render Helpers ---

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUserId;
    const isImage = item.messageType === 'image' || item.mimeType?.startsWith('image/');
    const isVideo = item.messageType === 'video' || item.mimeType?.startsWith('video/');
    const isFile = item.messageType === 'file' || item.messageType === 'document' || (!isImage && !isVideo && item.fileUrl);

    return (
      <View style={[styles.messageWrapper, { opacity: item.isPending ? 0.7 : 1 }]}>
        <View style={[styles.messageRow, isOwnMessage ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
          {!isOwnMessage && (
            <Image source={{ uri: Config.API_BASE_URL + '/' + partnerInfo?.logo }} style={styles.senderAvatar} />
          )}

          <TouchableOpacity
            style={[
              styles.messageContainer,
              isOwnMessage ? styles.ownMessage : styles.partnerMessage,
              item.isError && { borderColor: '#EF4444', borderWidth: 1 }
            ]}
            onLongPress={() => { if (isOwnMessage && !item.isDeleted) { setSelectedMessage(item); setShowOptionsModal(true); }}}
            onPress={() => { if ((isImage || isVideo) && item.fileUrl) setFullScreenMedia({ url: item.fileUrl, mimeType: item.mimeType || '' }); }}
            activeOpacity={0.9}
          >
            {item.isDeleted ? (
              <View style={styles.deletedMessage}>
                <Trash2 size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
                <Text style={styles.deletedText}>Message deleted</Text>
              </View>
            ) : (
              <>
                {(isImage || isVideo) && item.fileUrl && (
                  <View style={styles.mediaWrapper}>
                    <Image source={{ uri: item.fileUrl.startsWith('http') || item.fileUrl.startsWith('file') ? item.fileUrl : `${Config.API_BASE_URL}/${item.fileUrl}` }} style={styles.messageImage} resizeMode="cover" />
                    <View style={styles.mediaOverlay}>
                      {!item.isPending && <Maximize size={24} color="#FFF" />}
                      {isVideo && <Text style={styles.videoLabel}>VIDEO</Text>}
                    </View>
                  </View>
                )}
                {isFile && item.fileUrl && (
                  <View style={styles.fileContainer}>
                    <File size={28} color="#E5E7EB" />
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>{item.fileName || 'Document'}</Text>
                      {item.fileSize && <Text style={styles.fileSize}>{(item.fileSize / 1024 / 1024).toFixed(2)} MB</Text>}
                    </View>
                  </View>
                )}
                {item.message ? <Text style={styles.messageText}>{item.message}</Text> : null}
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={[styles.timeRow, isOwnMessage ? { justifyContent: 'flex-end', marginRight: 4 } : { marginLeft: 48 }]}>
           <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </Text>
           {item.isPending && <ActivityIndicator size="small" color="#9CA3AF" style={{ marginLeft: 4, transform: [{scale: 0.7}] }} />}
        </View>
      </View>
    );
  };

  // --- Dynamic Padding Logic ---
  // When keyboard is visible, standard small padding (10px).
  // When hidden, padding = Safe Area Bottom + Tab Bar Height (Responsive) + Spacing.
  // TabBar approx height is 60-70px in design, scaled up by responsive function.
  const tabBarHeight = getResponsiveSize(85); 
  const bottomPadding = keyboardVisible ? 10 : (insets.bottom + tabBarHeight);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        
        {/* HEADER */}
        {isSearching ? (
          <View style={styles.headerSearchContainer}>
            <TouchableOpacity onPress={cancelSearch} style={styles.backButton}>
              <ArrowLeft size={getResponsiveSize(24)} color="#8FA8CC" />
            </TouchableOpacity>
            <TextInput
              style={styles.headerSearchInput}
              placeholder="Search..."
              placeholderTextColor="#8EA8CC"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
              <X size={getResponsiveSize(20)} color="#8FA8CC" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={getResponsiveSize(24)} color="#8FA8CC" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCenter} onPress={handleOpenProfile}>
              <Image source={{ uri: partnerInfo?.logo ? `${Config.API_BASE_URL}/${partnerInfo.logo}` : 'https://via.placeholder.com/32' }} style={styles.headerAvatar} />
              <Text style={styles.headerTitle} numberOfLines={1}>{partnerInfo?.companyName || 'Chat'}</Text>
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleCall}>
                <Phone size={getResponsiveSize(22)} color="#8FA8CC" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={toggleSearch}>
                <Search size={getResponsiveSize(22)} color="#8FA8CC" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* MESSAGES */}
        <FlatList
          ref={flatListRef}
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => !isSearching && flatListRef.current?.scrollToEnd()}
        />

        {/* SELECTED FILES */}
        {selectedFiles.length > 0 && (
          <View style={styles.selectedFilesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.selectedFileItem}>
                  {file.type.startsWith('image/') ? (
                    <Image source={{ uri: file.uri }} style={styles.selectedFileImage} />
                  ) : (
                    <View style={[styles.selectedFileImage, { justifyContent: 'center', alignItems: 'center' }]}>
                        <File size={24} color="#9CA3AF" />
                    </View>
                  )}
                  <TouchableOpacity style={styles.removeFileButton} onPress={() => removeSelectedFile(index)}>
                    <X size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* INPUT AREA */}
        {!isSearching && (
          <View style={[styles.inputContainer, { paddingBottom: bottomPadding }]}>
            <View style={styles.inputCapsule}>
              <TextInput
                style={styles.input}
                placeholder="Message"
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity onPress={handleAttachment} style={styles.attachBtn}>
                <Paperclip size={20} color="#8FA8CC" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleSend} style={styles.sendFab}>
              <Send size={20} color="#FFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ATTACHMENT MENU MODAL */}
      <Modal visible={showAttachMenu} transparent animationType="fade" onRequestClose={() => setShowAttachMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAttachMenu(false)} activeOpacity={1}>
          <View style={styles.attachModal}>
            <Text style={styles.attachTitle}>Attachment</Text>
            <View style={styles.attachRow}>
                <TouchableOpacity style={styles.attachOption} onPress={pickImage}>
                    <View style={[styles.attachIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                        <ImageIcon size={24} color="#3B82F6" />
                    </View>
                    <Text style={styles.attachText}>Photos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachOption} onPress={pickDocument}>
                    <View style={[styles.attachIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                        <File size={24} color="#10B981" />
                    </View>
                    <Text style={styles.attachText}>Document</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAttachMenu(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* OPTIONS MODAL */}
      <Modal visible={showOptionsModal} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowOptionsModal(false)}>
          <View style={styles.optionsModal}>
            <TouchableOpacity style={styles.optionButton} onPress={() => selectedMessage && startEdit(selectedMessage)}>
              <Edit3 size={20} color="#3B82F6" />
              <Text style={styles.optionText}>Edit Message</Text>
            </TouchableOpacity>
            <View style={styles.optionDivider} />
            <TouchableOpacity style={styles.optionButton} onPress={() => selectedMessage && deleteMessage(selectedMessage.id)}>
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete Message</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!fullScreenMedia} transparent animationType="fade" onRequestClose={() => setFullScreenMedia(null)}>
        <View style={styles.mediaViewerContainer}>
          <TouchableOpacity style={styles.mediaViewerCloseButton} onPress={() => setFullScreenMedia(null)}>
            <X size={28} color="#FFF" />
          </TouchableOpacity>
          {fullScreenMedia && <Image source={{ uri: fullScreenMedia.url.startsWith('http') ? fullScreenMedia.url : `${Config.API_BASE_URL}/${fullScreenMedia.url}` }} style={styles.fullScreenMedia} resizeMode="contain" />}
        </View>
      </Modal>

      <SuccessToast message={successMessage} visible={showSuccessToast} onDismiss={() => setShowSuccessToast(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 60, backgroundColor: '#0F1623', borderBottomWidth: 1, borderBottomColor: '#1F2937'
  },
  headerSearchContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 60, backgroundColor: '#0F1623', gap: 10
  },
  headerSearchInput: { flex: 1, color: '#FFF', fontSize: 16, backgroundColor: '#1F2937', padding: 8, borderRadius: 8 },
  clearSearchButton: { padding: 4 },
  backButton: { padding: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#374151', marginRight: 10 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', flex: 1 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 6 },
  
  messageList: { paddingHorizontal: 12, paddingBottom: 20 },
  messageWrapper: { marginVertical: 4 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 },
  senderAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, marginBottom: 4 },
  messageContainer: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  ownMessage: { backgroundColor: '#2563EB', borderBottomRightRadius: 2 }, // Light Blue
  partnerMessage: { backgroundColor: '#374151', borderBottomLeftRadius: 2 }, // Dark Gray
  messageText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  messageTime: { fontSize: 11, color: '#9CA3AF' },
  deletedMessage: { flexDirection: 'row', alignItems: 'center' },
  deletedText: { fontStyle: 'italic', color: '#9CA3AF', fontSize: 13 },
  
  // Media Styles
  mediaWrapper: { borderRadius: 8, overflow: 'hidden', marginBottom: 4 },
  messageImage: { width: 200, height: 150 },
  mediaOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  videoLabel: { color: '#FFF', fontWeight: 'bold', marginTop: 4 },
  fileContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 8, marginBottom: 4 },
  fileInfo: { marginLeft: 8, flex: 1 },
  fileName: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  fileSize: { color: '#D1D5DB', fontSize: 11 },

  // Input Area - Compact & Professional
  inputContainer: { 
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 10,
    backgroundColor: '#000', 
  },
  inputCapsule: {
    flex: 1, flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#1F2937', borderRadius: 20, 
    paddingLeft: 16, paddingRight: 8, paddingVertical: 4,
    marginRight: 8, minHeight: 40,
  },
  input: { 
    flex: 1, color: '#FFF', fontSize: 16, maxHeight: 100, 
    paddingTop: Platform.OS === 'ios' ? 4 : 2,
    paddingBottom: Platform.OS === 'ios' ? 4 : 2,
    marginRight: 4, textAlignVertical: 'center'
  },
  attachBtn: { padding: 6 },
  sendFab: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#0057D9', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4
  },

  // Selected Files
  selectedFilesContainer: { backgroundColor: '#111827', padding: 8, maxHeight: 100 },
  selectedFileItem: { marginRight: 8, position: 'relative' },
  selectedFileImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  removeFileButton: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },

  // Attach Menu Modal
  attachModal: { backgroundColor: '#1F2937', width: '90%', borderRadius: 16, padding: 24, alignItems: 'center' },
  attachTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 24 },
  attachRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 24 },
  attachOption: { alignItems: 'center', gap: 8 },
  attachIconBg: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  attachText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  cancelButton: { width: '100%', paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#374151' },
  cancelText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },

  // Modals & Misc
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  optionsModal: { width: 280, backgroundColor: '#1F2937', borderRadius: 12, padding: 16 },
  optionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  optionText: { color: '#FFF', fontSize: 16, marginLeft: 12, fontWeight: '600' },
  optionDivider: { height: 1, backgroundColor: '#374151' },
  mediaViewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  mediaViewerCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  fullScreenMedia: { width: '100%', height: '100%' },
  
  // Toast
  toastContainer: { position: 'absolute', top: 100, alignSelf: 'center', zIndex: 20 },
  toastContent: { flexDirection: 'row', backgroundColor: '#0057D9', padding: 12, borderRadius: 24, gap: 8 },
  toastText: { color: '#FFF', fontWeight: 'bold' },
  
  todaySeparator: { alignItems: 'center', marginVertical: 10 },
  todayText: { color: '#6B7280', fontSize: 12, fontWeight: '600', backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 }
});

