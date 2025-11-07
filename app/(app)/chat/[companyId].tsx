// app/(app)/chat/[companyId].tsx - FIXED: Message Order & Keyboard Handling

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  Animated,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Trash2,
  Edit3,
  X,
  Image as ImageIcon,
  File,
  Check,
  CheckCheck,
  Maximize,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { chatAPI } from '../../../services/chat-websocket';
import { companyAPI } from '../../../services/user';
import { Config } from '../../../constants/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const sizeScale = (size: number) => (SCREEN_WIDTH / 390) * size;

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

  if (!visible && fadeAnim._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.toastContainer, { opacity: fadeAnim }]}
      pointerEvents="none"
    >
      <View style={styles.toastContent}>
        <Check size={sizeScale(20)} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

export default function ChatScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList<Message>>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fullScreenMedia, setFullScreenMedia] = useState<{ url: string; mimeType: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (companyId) {
      fetchCurrentUser();
      fetchPartnerInfo();
      fetchChatHistory();
    }

    // Keyboard listeners
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
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
    };
  }, [companyId]);

  useEffect(() => {
    if (companyId && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) => msg.receiverId === currentUserId && !msg.isRead
      );
      if (unreadMessages.length > 0) {
        markMessagesAsRead();
      }
    }
  }, [messages, currentUserId, companyId]);

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
      
      // FIXED: Don't reverse - API returns oldest first, we want newest at bottom
      setMessages(response.data);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 300);
    } catch (error: any) {
      console.error('Failed to fetch chat history:', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load chat history');
      }
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

  const sendMessage = async () => {
    if (!inputText.trim() && !editingMessage) return;

    try {
      setSending(true);
      const messageText = inputText.trim();

      if (editingMessage) {
        const response = await chatAPI.editMessage(editingMessage.id, {
          message: messageText,
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === editingMessage.id ? response.data : msg
          )
        );

        setEditingMessage(null);
      } else {
        const response = await chatAPI.sendMessage({
          receiverId: companyId,
          message: messageText,
        });

        setMessages((prev) => [...prev, response.data]);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }

      setInputText('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const sendFilesWithMessage = async () => {
    if (selectedFiles.length === 0) {
      await sendMessage();
      return;
    }

    try {
      setSending(true);
      setUploadProgress(0);

      const messageText = inputText.trim();

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        const response = await chatAPI.sendFile(
          companyId,
          file,
          i === 0 ? messageText : '',
          (progress) => {
            const totalProgress = ((i / selectedFiles.length) * 100) + (progress / selectedFiles.length);
            setUploadProgress(Math.round(totalProgress));
          }
        );

        setMessages((prev) => [...prev, response.data]);
      }

      setInputText('');
      setSelectedFiles([]);
      setUploadProgress(0);

      setSuccessMessage(selectedFiles.length > 1 ? 'Files sent! 📎' : 'File sent! 📎');
      setShowSuccessToast(true);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('❌ File send error:', error);
      Alert.alert('Error', error.message || 'Failed to send files');
      setUploadProgress(0);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (selectedFiles.length > 0) {
      await sendFilesWithMessage();
    } else {
      await sendMessage();
    }
  };

  const deleteMessage = async (messageId: string) => {
    setShowOptionsModal(false);

    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
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
                  ? {
                      ...msg,
                      isDeleted: true,
                      message: 'This message was deleted.',
                      fileUrl: undefined,
                    }
                  : msg
              )
            );

            setSuccessMessage('Message deleted');
            setShowSuccessToast(true);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete message');
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
    
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    
    return `${Config.API_BASE_URL}/${fileUrl}`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUserId;
    const isImage = item.messageType === 'image' || item.mimeType?.startsWith('image/');
    const isVideo = item.messageType === 'video' || item.mimeType?.startsWith('video/');
    const isFile = item.messageType === 'file' || item.messageType === 'document' || (!isImage && !isVideo && item.fileUrl);

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.partnerMessage,
        ]}
        onLongPress={() => {
          if (isOwnMessage && !item.isDeleted) {
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
            <Trash2 size={sizeScale(14)} color="#9CA3AF" style={{ marginRight: sizeScale(4) }} />
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
                <View style={styles.mediaOverlay}>
                  <Maximize size={sizeScale(24)} color="#FFFFFF" />
                  {isVideo && <Text style={styles.videoLabel}>VIDEO</Text>}
                </View>
              </View>
            )}

            {isFile && item.fileUrl && (
              <TouchableOpacity
                style={styles.fileContainer}
                onPress={() => {
                  Alert.alert('File', `Open ${item.fileName || 'file'}`);
                }}
              >
                <File size={sizeScale(32)} color="#3B82F6" />
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
              </TouchableOpacity>
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

            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isOwnMessage ? styles.ownMessageTime : styles.partnerMessageTime,
                ]}
              >
                {new Date(item.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {item.isEdited && (
                <Text
                  style={[
                    styles.editedLabel,
                    isOwnMessage ? styles.ownMessageTime : styles.partnerMessageTime,
                  ]}
                >
                  {' '}
                  · Edited
                </Text>
              )}
              {isOwnMessage && (
                <View style={styles.readReceiptContainer}>
                  {item.isRead ? (
                    <CheckCheck size={sizeScale(14)} color="#3B82F6" strokeWidth={2.5} />
                  ) : (
                    <Check size={sizeScale(14)} color="rgba(255, 255, 255, 0.5)" strokeWidth={2.5} />
                  )}
                </View>
              )}
            </View>
          </>
        )}
      </TouchableOpacity>
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
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={sizeScale(24)} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Image
              source={{
                uri: getImageUrl(partnerInfo?.logo) || 'https://via.placeholder.com/40',
              }}
              style={styles.headerAvatar}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {partnerInfo?.companyName || 'Chat Partner'}
              </Text>
              <Text style={styles.headerStatus}>Last seen recently</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {}}
            style={styles.moreOptionsButton}
            activeOpacity={0.7}
          >
            <MoreVertical size={sizeScale(24)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* CHAT MESSAGES LIST - FIXED: inverted={false} so oldest is top, newest is bottom */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          inverted={false}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          showsVerticalScrollIndicator={false}
        />

        {/* EDITING BAR */}
        {editingMessage && (
          <View style={styles.editingBar}>
            <View style={styles.editingBarIcon}>
              <Edit3 size={sizeScale(16)} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.editingTitle}>Editing Message</Text>
              <Text style={styles.editingText} numberOfLines={1}>
                {editingMessage.message}
              </Text>
            </View>
            <TouchableOpacity onPress={cancelEdit} activeOpacity={0.7}>
              <X size={sizeScale(20)} color="#FFFFFF" />
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
                      <File size={sizeScale(24)} color="#3B82F6" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => removeSelectedFile(index)}
                    activeOpacity={0.7}
                  >
                    <X size={sizeScale(16)} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.selectedFileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* UPLOAD PROGRESS BAR */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <View style={styles.uploadProgressContainer}>
            <View style={[styles.uploadProgressBar, { width: `${uploadProgress}%` }]} />
            <Text style={styles.uploadProgressText}>Uploading: {uploadProgress}%</Text>
          </View>
        )}

        {/* MESSAGE INPUT - FIXED: Proper padding and positioning */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            onPress={pickImage} 
            style={styles.attachmentButton} 
            activeOpacity={0.7}
            disabled={sending}
          >
            <ImageIcon size={sizeScale(20)} color={sending ? "#666" : "#FFFFFF"} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={pickDocument} 
            style={styles.attachmentButton} 
            activeOpacity={0.7}
            disabled={sending}
          >
            <File size={sizeScale(20)} color={sending ? "#666" : "#FFFFFF"} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline={true}
            returnKeyType="default"
            editable={!sending}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton, 
              (!inputText.trim() && selectedFiles.length === 0 && !editingMessage) && styles.sendButtonDisabled
            ]}
            disabled={(!inputText.trim() && selectedFiles.length === 0 && !editingMessage) || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={sizeScale(20)} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
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
                    <Edit3 size={sizeScale(20)} color="#3B82F6" />
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
                <Trash2 size={sizeScale(20)} color="#EF4444" />
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
            <X size={sizeScale(28)} color="#FFFFFF" />
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
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    backgroundColor: '#111827',
  },
  backButton: {
    padding: sizeScale(4),
    marginRight: sizeScale(12),
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: sizeScale(40),
    height: sizeScale(40),
    borderRadius: sizeScale(20),
    backgroundColor: '#374151',
    marginRight: sizeScale(12),
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: sizeScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: sizeScale(2),
  },
  headerStatus: {
    fontSize: sizeScale(12),
    color: '#9CA3AF',
  },
  moreOptionsButton: {
    padding: sizeScale(4),
    marginLeft: sizeScale(12),
  },
  messageList: {
    paddingHorizontal: sizeScale(12),
    paddingVertical: sizeScale(12),
    paddingBottom: sizeScale(20),
  },
  messageContainer: {
    maxWidth: '80%',
    padding: sizeScale(10),
    borderRadius: sizeScale(12),
    marginVertical: sizeScale(4),
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
  },
  partnerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F2937',
  },
  messageText: {
    fontSize: sizeScale(15),
    lineHeight: sizeScale(20),
    marginBottom: sizeScale(4),
    color: '#FFFFFF',
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  partnerMessageText: {
    color: '#FFFFFF',
  },
  messageImage: {
    width: sizeScale(200),
    height: sizeScale(150),
    borderRadius: sizeScale(10),
    marginBottom: sizeScale(4),
  },
  mediaWrapper: {
    borderRadius: sizeScale(10),
    overflow: 'hidden',
    position: 'relative',
    marginBottom: sizeScale(4),
  },
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    color: '#FFFFFF',
    fontSize: sizeScale(12),
    fontWeight: '700',
    marginTop: sizeScale(4),
    letterSpacing: 1,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: sizeScale(8),
    padding: sizeScale(10),
    marginBottom: sizeScale(4),
  },
  fileInfo: {
    marginLeft: sizeScale(10),
    flexShrink: 1,
  },
  fileName: {
    fontSize: sizeScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: sizeScale(2),
  },
  fileSize: {
    fontSize: sizeScale(12),
    color: '#9CA3AF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: sizeScale(11),
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  partnerMessageTime: {
    color: '#9CA3AF',
  },
  editedLabel: {
    fontSize: sizeScale(11),
    marginLeft: sizeScale(4),
    fontStyle: 'italic',
  },
  readReceiptContainer: {
    marginLeft: sizeScale(4),
  },
  deletedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sizeScale(4),
  },
  deletedText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontSize: sizeScale(13),
  },
  selectedFilesContainer: {
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingVertical: sizeScale(8),
  },
  selectedFilesScroll: {
    paddingHorizontal: sizeScale(12),
    gap: sizeScale(8),
  },
  selectedFileItem: {
    width: sizeScale(80),
    alignItems: 'center',
  },
  selectedFileImage: {
    width: sizeScale(80),
    height: sizeScale(80),
    borderRadius: sizeScale(8),
    backgroundColor: '#374151',
  },
  selectedFileIcon: {
    width: sizeScale(80),
    height: sizeScale(80),
    borderRadius: sizeScale(8),
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFileButton: {
    position: 'absolute',
    top: sizeScale(-6),
    right: sizeScale(-6),
    backgroundColor: '#EF4444',
    borderRadius: sizeScale(12),
    width: sizeScale(24),
    height: sizeScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFileName: {
    fontSize: sizeScale(10),
    color: '#9CA3AF',
    marginTop: sizeScale(4),
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: sizeScale(16),
    paddingTop: sizeScale(10),
    paddingBottom: Platform.OS === 'ios' ? sizeScale(30) : sizeScale(90),
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    backgroundColor: '#000000',
  },
  input: {
    flex: 1,
    maxHeight: sizeScale(100),
    backgroundColor: '#1F2937',
    borderRadius: sizeScale(20),
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(10),
    fontSize: sizeScale(15),
    color: '#FFFFFF',
    marginHorizontal: sizeScale(8),
  },
  attachmentButton: {
    padding: sizeScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: sizeScale(40),
    height: sizeScale(40),
    borderRadius: sizeScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  editingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(10),
    backgroundColor: '#1F2937',
    gap: sizeScale(10),
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
  },
  editingBarIcon: {
    padding: sizeScale(6),
    backgroundColor: '#3B82F6',
    borderRadius: sizeScale(6),
  },
  editingTitle: {
    fontSize: sizeScale(12),
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: sizeScale(2),
  },
  editingText: {
    fontSize: sizeScale(14),
    color: '#9CA3AF',
  },
  uploadProgressContainer: {
    height: sizeScale(24),
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  uploadProgressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  uploadProgressText: {
    color: '#FFFFFF',
    fontSize: sizeScale(12),
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sizeScale(20),
  },
  optionsModal: {
    backgroundColor: '#111827',
    borderRadius: sizeScale(16),
    width: '100%',
    maxWidth: sizeScale(340),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  optionsHeader: {
    padding: sizeScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#1F2937',
  },
  optionsTitle: {
    fontSize: sizeScale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sizeScale(16),
  },
  optionIconContainer: {
    width: sizeScale(44),
    height: sizeScale(44),
    borderRadius: sizeScale(22),
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sizeScale(14),
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: sizeScale(2),
  },
  optionSubtext: {
    fontSize: sizeScale(13),
    color: '#9CA3AF',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginHorizontal: sizeScale(16),
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
    top: Platform.OS === 'android' ? sizeScale(30) : sizeScale(60),
    right: sizeScale(20),
    zIndex: 10,
    padding: sizeScale(10),
    borderRadius: sizeScale(25),
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
    paddingVertical: sizeScale(12),
    paddingHorizontal: sizeScale(20),
    borderRadius: sizeScale(25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    gap: sizeScale(8),
  },
  toastText: {
    color: '#fff',
    fontSize: sizeScale(15),
    fontWeight: '600',
  },
});