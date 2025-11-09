// app/(app)/bizzapai/index.tsx - COMPLETE UPDATED VERSION

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { aiAPI, AIGeneratedData } from '../../../services/ai';
import { leadsAPI } from '../../../services/leads';
import { Config } from '@/constants/config';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;
const NAV_BAR_HEIGHT = sizeScale(80);

// --- Types ---
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface DebugLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

// --- Helper Function ---
const hasMinimumRequiredData = (data: AIGeneratedData | null): boolean => {
  if (!data) return false;
  return !!(
    data.title &&
    data.quantity &&
    data.unit &&
    (data.description || data.location || data.min_budget || data.max_budget)
  );
};

// --- Debug Log Component ---
const DebugConsole = ({ 
  logs, 
  visible, 
  onClose 
}: { 
  logs: DebugLog[]; 
  visible: boolean; 
  onClose: () => void;
}) => {
  const getLogColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  const getLogIcon = (type: DebugLog['type']) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.debugModalOverlay}>
        <View style={styles.debugModalContent}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>🛠 Debug Console</Text>
            <TouchableOpacity onPress={onClose} style={styles.debugCloseButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.debugLogContainer}>
            {logs.map((log) => (
              <View key={log.id} style={styles.debugLogItem}>
                <View style={styles.debugLogHeader}>
                  <Ionicons 
                    name={getLogIcon(log.type) as any} 
                    size={16} 
                    color={getLogColor(log.type)} 
                  />
                  <Text style={[styles.debugLogType, { color: getLogColor(log.type) }]}>
                    {log.type.toUpperCase()}
                  </Text>
                  <Text style={styles.debugLogTime}>{log.timestamp}</Text>
                </View>
                <Text style={styles.debugLogMessage}>{log.message}</Text>
                {log.details && (
                  <Text style={styles.debugLogDetails}>
                    {typeof log.details === 'string' 
                      ? log.details 
                      : JSON.stringify(log.details, null, 2)}
                  </Text>
                )}
              </View>
            ))}
            {logs.length === 0 && (
              <Text style={styles.debugEmpty}>No logs yet. Perform an action to see logs.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// --- Action Button Component ---
const ActionButton = ({
  icon,
  title,
  description,
  onPress,
  color = '#4C1D95'
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.actionIcon, { backgroundColor: color }]}>
      <MaterialCommunityIcons name={icon as any} size={sizeScale(24)} color="#fff" />
    </View>
    <View style={styles.actionTextContainer}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={sizeScale(20)} color="#666" />
  </TouchableOpacity>
);

// --- Message Bubble Component ---
const MessageBubble = ({ message }: { message: Message }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.aiBubble,
        { opacity: fadeAnim }
      ]}
    >
      {!message.isUser && (
        <View style={styles.aiIconContainer}>
          <MaterialCommunityIcons name="robot" size={sizeScale(20)} color="#4C1D95" />
        </View>
      )}
      <Text style={[
        styles.messageText,
        message.isUser ? styles.userMessageText : styles.aiMessageText
      ]}>
        {message.text}
      </Text>
      {message.isUser && (
        <View style={styles.userIconContainer}>
          <Ionicons name="person" size={sizeScale(16)} color="#fff" />
        </View>
      )}
    </Animated.View>
  );
};

// --- Main BizzapAI Screen ---
export default function BizzapAIScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: "Hi there! I can help you create leads for your business. Just describe what you're looking for!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inputHeight, setInputHeight] = useState(sizeScale(40));
  const [inputAreaHeight, setInputAreaHeight] = useState(sizeScale(80));
  const flatListRef = useRef<FlatList>(null);

  // AI and Lead states
  const [conversationHistory, setConversationHistory] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<AIGeneratedData | null>(null);
  const [uploadedImage, setUploadedImage] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug states
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebugConsole, setShowDebugConsole] = useState(false);

  // Debug logging function
  const addDebugLog = (type: DebugLog['type'], message: string, details?: any) => {
    const log: DebugLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details,
    };
    setDebugLogs(prev => [...prev, log]);
    console.log(`[${type.toUpperCase()}]`, message, details || '');
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
    addDebugLog('info', 'Debug logs cleared');
  };

  const handlePostLeadPress = () => {
    setInputText("I need help creating a lead for my business requirement");
    addDebugLog('info', 'Post Lead button pressed');
  };

  const handleCreatePostPress = () => {
    addDebugLog('info', 'Navigating to create post screen');
    router.push('/bizzapai/create-post' as any);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setInputHeight(sizeScale(40));
    setIsTyping(true);

    addDebugLog('info', 'Sending message to AI', { input: currentInput });

    try {
      addDebugLog('info', 'Calling AI API...', {
        baseURL: Config.AI_BASE_URL,
        endpoint: 'process_requirement',
        inputLength: currentInput.length,
      });

      const response = await aiAPI.generateLead(currentInput, conversationHistory);
      
      addDebugLog('success', 'AI API Response received', {
        code: response.data.code,
        hasTitle: !!response.data.title,
        hasDescription: !!response.data.description,
      });

      if (!response || !response.data) {
        throw new Error('AI service returned invalid response format');
      }

      const bizData = response.data;

      if (typeof bizData.code === 'undefined' || bizData.code === null) {
        throw new Error('AI service returned incomplete data (missing code field)');
      }

      if (hasMinimumRequiredData(bizData)) {
        addDebugLog('success', 'Minimum required data met, showing preview modal');
        setAiGeneratedData({
          ...bizData,
          title: bizData.title || 'Untitled',
          description: bizData.description || 'No description provided',
          location: bizData.location || 'Location not specified',
          quantity: bizData.quantity || '0',
          unit: bizData.unit || 'pieces',
          min_budget: bizData.min_budget || '0',
          max_budget: bizData.max_budget || '0',
          certifications: Array.isArray(bizData.certifications)
            ? bizData.certifications
            : (typeof bizData.certifications === 'string'
                ? [bizData.certifications]
                : []),
        });

        setShowPreviewModal(true);
      }

      if (bizData.code === '0') {
        if (bizData.conversation) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: bizData.conversation,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);

          setConversationHistory(prev =>
            prev + `User: ${currentInput}\nAI: ${bizData.conversation}\n`
          );

          if (hasMinimumRequiredData(bizData)) {
            setTimeout(() => {
              const previewMessage: Message = {
                id: (Date.now() + 2).toString(),
                text: '📋 I\'ve prepared a preview of your lead! You can review and submit it, or continue our conversation to refine it further.',
                isUser: false,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, previewMessage]);
            }, 500);
          }
        } else {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: 'I\'m processing your request. Could you provide more details?',
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      } else if (bizData.code === '1') {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: '✅ Your lead is ready! Please review and add an image to submit.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: bizData.conversation || 'I\'ve processed your request. Please let me know if you need any adjustments.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error: any) {
      addDebugLog('error', 'AI API Error', {
        message: error.message,
        code: error.code,
        name: error.name,
      });

      const isConnectionError =
        error.message?.includes('connect') ||
        error.message?.includes('network') ||
        error.message?.includes('ECONNREFUSED');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: isConnectionError
          ? '❌ Cannot connect to AI service. Check Debug Console for details.'
          : `❌ ${error.message || 'Something went wrong. Please try again.'}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleImagePicker = async () => {
    try {
      addDebugLog('info', 'Opening image picker...');
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        addDebugLog('warning', 'Image picker permission denied');
        Alert.alert('Permission Required', 'Please allow access to your photos to upload an image.');
        return;
      }

      addDebugLog('success', 'Image picker permission granted');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0]);
        addDebugLog('success', 'Image selected', {
          uri: result.assets[0].uri.substring(0, 50) + '...',
          fileName: result.assets[0].fileName,
          width: result.assets[0].width,
          height: result.assets[0].height,
          type: result.assets[0].type || result.assets[0].mimeType,
        });
      } else {
        addDebugLog('info', 'Image picker cancelled');
      }
    } catch (error: any) {
      addDebugLog('error', 'Image picker error', error.message);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSkip = () => {
    addDebugLog('info', 'Preview modal skipped');
    setShowPreviewModal(false);
    setUploadedImage(null);
  };

  const handleSubmit = async () => {
    if (!aiGeneratedData) {
      addDebugLog('error', 'Submit failed: No lead data available');
      Alert.alert('Error', 'No lead data available');
      return;
    }

    if (!uploadedImage) {
      addDebugLog('error', 'Submit failed: No image uploaded');
      Alert.alert('Image Required', 'Please upload an image before submitting');
      return;
    }

    setIsSubmitting(true);
    addDebugLog('info', '=== STARTING LEAD SUBMISSION ===');

    try {
      // Prepare lead data matching backend API exactly
      const leadData: any = {
        title: aiGeneratedData.title,
        description: aiGeneratedData.description !== 'No description provided'
          ? aiGeneratedData.description
          : `${aiGeneratedData.title} - ${aiGeneratedData.quantity} ${aiGeneratedData.unit}`,
        quantity: `${aiGeneratedData.quantity} ${aiGeneratedData.unit}`,
      };

      // Optional fields
      if (aiGeneratedData.location && aiGeneratedData.location !== 'Location not specified') {
        leadData.location = aiGeneratedData.location;
      }

      if (aiGeneratedData.min_budget !== '0' && aiGeneratedData.max_budget !== '0') {
        leadData.budget = `₹${aiGeneratedData.min_budget} - ₹${aiGeneratedData.max_budget}`;
      }

      addDebugLog('info', 'Lead data prepared', {
        title: leadData.title,
        description: leadData.description.substring(0, 50) + '...',
        quantity: leadData.quantity,
        location: leadData.location || '(not set)',
        budget: leadData.budget || '(not set)',
      });

      // PROCESS IMAGE - CRITICAL SECTION
      const imageUri = uploadedImage.uri;
      
      addDebugLog('info', 'Raw uploadedImage from picker', {
        uri: imageUri.substring(0, 60) + '...',
        fileName: uploadedImage.fileName,
        type: uploadedImage.type,
        mimeType: uploadedImage.mimeType,
        width: uploadedImage.width,
        height: uploadedImage.height,
        fileSize: uploadedImage.fileSize,
      });

      // Get filename
      let fileName = uploadedImage.fileName;
      
      if (!fileName) {
        // Extract from URI
        const uriParts = imageUri.split('/');
        const uriFileName = uriParts[uriParts.length - 1];
        
        // Clean up the filename (remove query params if any)
        fileName = uriFileName.split('?')[0];
        
        // If no extension, add .jpg
        if (!fileName.includes('.')) {
          fileName = `image_${Date.now()}.jpg`;
        }
      }

      // Get MIME type
      let mimeType = uploadedImage.type || uploadedImage.mimeType;
      
      // If mimeType is missing or just "image", determine from filename
      if (!mimeType || mimeType === 'image') {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const mimeMap: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'heic': 'image/heic',
          'heif': 'image/heif',
        };
        mimeType = mimeMap[extension || 'jpg'] || 'image/jpeg';
      }

      addDebugLog('info', 'Image metadata processed', {
        fileName,
        mimeType,
        platform: Platform.OS,
      });

      // Create image object based on platform
      if (Platform.OS === 'web') {
        // Web platform
        try {
          addDebugLog('info', 'Converting to File object for web');
          const response = await fetch(imageUri);
          if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status}`);
          }
          const blob = await response.blob();
          leadData.image = new File([blob], fileName, { type: mimeType });
          
          addDebugLog('success', 'Web File created', {
            name: leadData.image.name,
            size: leadData.image.size,
            type: leadData.image.type,
          });
        } catch (error: any) {
          addDebugLog('error', 'Failed to create File object', error.message);
          throw new Error('Failed to process image for upload');
        }
      } else {
        // Native platform (Android/iOS)
        
        // React Native FormData expects exactly this format
        leadData.image = {
          uri: imageUri, // Keep original URI with file:// if present
          name: fileName,
          type: mimeType,
        };
        
        addDebugLog('info', 'Native image object created', {
          uri: imageUri.substring(0, 60) + '...',
          name: fileName,
          type: mimeType,
          hasFilePrefix: imageUri.startsWith('file://'),
        });

        // Validate the object
        if (!leadData.image.uri || !leadData.image.name || !leadData.image.type) {
          addDebugLog('error', 'Image object validation failed', leadData.image);
          throw new Error('Invalid image data after processing');
        }
      }

      addDebugLog('info', 'Calling leadsAPI.createLead', {
        endpoint: `${Config.API_BASE_URL}/leads`,
        method: 'POST',
        contentType: 'multipart/form-data',
        hasTitle: !!leadData.title,
        hasDescription: !!leadData.description,
        hasImage: !!leadData.image,
        platform: Platform.OS,
      });

      // Call the API
      const response = await leadsAPI.createLead(leadData);

      addDebugLog('success', 'Lead created successfully!', {
        statusCode: response.statusCode,
        message: response.message,
        leadId: response.data?.id,
        imageUrl: response.data?.imageUrl?.substring(0, 60) + '...',
      });

      if (response.statusCode === 201) {
        addDebugLog('success', '=== LEAD SUBMISSION COMPLETE ===');
        
        Alert.alert('Success! 🎉', 'Lead created successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              router.back();
            }
          }
        ]);

        // Add success message to chat
        const successMessage: Message = {
          id: Date.now().toString(),
          text: '🎉 Lead submitted successfully! You can view it in the Leads section.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);

        // Reset state
        setShowPreviewModal(false);
        setAiGeneratedData(null);
        setUploadedImage(null);
        setConversationHistory('');
      }

    } catch (error: any) {
      addDebugLog('error', '=== LEAD SUBMISSION FAILED ===', {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        requestConfig: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        },
        isNetworkError: !error.response && !!error.request,
        isTimeout: error.code === 'ECONNABORTED',
      });
      
      let errorMessage = error.message || 'Failed to create lead. Please try again.';
      
      Alert.alert('Error', errorMessage + '\n\nCheck Debug Console for details.');
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentSizeChange = (event: any) => {
    const height = event.nativeEvent.contentSize.height;
    const minHeight = sizeScale(40);
    const maxHeight = sizeScale(120);
    const newHeight = Math.max(minHeight, Math.min(height, maxHeight));
    setInputHeight(newHeight);
    const totalHeight = newHeight + sizeScale(8) + sizeScale(40);
    setInputAreaHeight(totalHeight);
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text.trim() === '') {
      setInputHeight(sizeScale(40));
      setInputAreaHeight(sizeScale(80));
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  const renderEmptyState = () => (
    <ScrollView
      contentContainerStyle={styles.emptyStateContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <MaterialCommunityIcons name="robot" size={sizeScale(48)} color="#4C1D95" />
        </View>
        <Text style={styles.welcomeTitle}>Hello! I'm BizzapAI</Text>
        <Text style={styles.welcomeSubtitle}>
          Your intelligent assistant for leads and posts
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Get started:</Text>
        <ActionButton
          icon="package-variant"
          title="Post a Lead"
          description="Create your lead requirement with AI"
          onPress={handlePostLeadPress}
          color="#4C1D95"
        />
        <ActionButton
          icon="post"
          title="Create Post"
          description="Share your story with photos or videos"
          onPress={handleCreatePostPress}
          color="#7C3AED"
        />
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.contentArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={{ flex: 1, marginBottom: inputAreaHeight }}>
          {messages.length === 1 ? (
            renderEmptyState()
          ) : (
            <>
              {/* Top Bar with Create Post and Debug Button */}
              <View style={styles.topBarContainer}>
                <TouchableOpacity 
                  style={styles.createPostButton}
                  onPress={handleCreatePostPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={sizeScale(20)} color="#7C3AED" />
                  <Text style={styles.createPostText}>Create Post</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.debugButton}
                  onPress={() => setShowDebugConsole(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bug" size={sizeScale(20)} color="#EF4444" />
                  <View style={styles.debugBadge}>
                    <Text style={styles.debugBadgeText}>{debugLogs.length}</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Messages List */}
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            </>
          )}

          {isTyping && (
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDotDelay1]} />
              <View style={[styles.typingDot, styles.typingDotDelay2]} />
            </View>
          )}
        </View>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={[styles.inputContainer, { minHeight: inputHeight + sizeScale(8) }]}>
            <TextInput
              style={[styles.input, { height: inputHeight }]}
              placeholder="Describe your lead requirement..."
              placeholderTextColor="#666"
              value={inputText}
              onChangeText={handleTextChange}
              onContentSizeChange={handleContentSizeChange}
              multiline
              maxLength={2000}
              textAlignVertical="center"
              editable={!isTyping}
            />

            {inputText.trim() && !isTyping ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-up" size={sizeScale(22)} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.sendButtonDisabled}>
                <Ionicons name="arrow-up" size={sizeScale(22)} color="#666" />
              </View>
            )}
          </View>

          <Text style={styles.footerText}>
            BizzapAI can make mistakes. Consider checking important information.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleSkip}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>📋 Review Your Lead</Text>

              {aiGeneratedData && (
                <View style={styles.previewContainer}>
                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>Title</Text>
                    <Text style={styles.previewValue}>{aiGeneratedData.title}</Text>
                  </View>

                  {aiGeneratedData.description !== 'No description provided' && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewLabel}>Description</Text>
                      <Text style={styles.previewValue}>{aiGeneratedData.description}</Text>
                    </View>
                  )}

                  {aiGeneratedData.location !== 'Location not specified' && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewLabel}>Location</Text>
                      <Text style={styles.previewValue}>{aiGeneratedData.location}</Text>
                    </View>
                  )}

                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>Quantity</Text>
                    <Text style={styles.previewValue}>
                      {aiGeneratedData.quantity} {aiGeneratedData.unit}
                    </Text>
                  </View>

                  {aiGeneratedData.min_budget !== '0' && aiGeneratedData.max_budget !== '0' && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewLabel}>Budget</Text>
                      <Text style={styles.previewValue}>
                        ₹{aiGeneratedData.min_budget} - ₹{aiGeneratedData.max_budget}
                      </Text>
                    </View>
                  )}

                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>Product Image *</Text>
                    <TouchableOpacity
                      style={styles.imageUploadContainer}
                      onPress={handleImagePicker}
                      activeOpacity={0.7}
                    >
                      {uploadedImage ? (
                        <Image
                          source={{ uri: uploadedImage.uri }}
                          style={styles.uploadedImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="camera-plus"
                            size={sizeScale(40)}
                            color="#666"
                          />
                          <Text style={styles.uploadText}>Tap to upload image</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.skipButton]}
                  onPress={handleSkip}
                  disabled={isSubmitting}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.submitButton,
                    (!uploadedImage || isSubmitting) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!uploadedImage || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Debug Console Modal */}
      <DebugConsole 
        logs={debugLogs} 
        visible={showDebugConsole} 
        onClose={() => setShowDebugConsole(false)} 
      />
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentArea: {
    flex: 1,
    marginBottom: NAV_BAR_HEIGHT,
  },
  emptyStateContainer: {
    flexGrow: 1,
    paddingHorizontal: sizeScale(20),
    paddingTop: sizeScale(40),
    paddingBottom: sizeScale(20),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: sizeScale(40),
  },
  logo: {
    width: sizeScale(80),
    height: sizeScale(80),
    borderRadius: sizeScale(40),
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sizeScale(16),
  },
  welcomeTitle: {
    fontSize: sizeScale(28),
    fontWeight: '700',
    color: '#fff',
    marginBottom: sizeScale(8),
  },
  welcomeSubtitle: {
    fontSize: sizeScale(16),
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    flex: 1,
    gap: sizeScale(12),
  },
  actionsTitle: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#fff',
    marginBottom: sizeScale(4),
  },
  actionButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(16),
    padding: sizeScale(20),
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(16),
  },
  actionIcon: {
    width: sizeScale(48),
    height: sizeScale(48),
    borderRadius: sizeScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: sizeScale(17),
    fontWeight: '700',
    color: '#fff',
    marginBottom: sizeScale(4),
  },
  actionDescription: {
    fontSize: sizeScale(14),
    color: '#666',
  },
  topBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(10),
    borderRadius: sizeScale(20),
    borderWidth: 1,
    borderColor: '#7C3AED',
    gap: sizeScale(8),
  },
  createPostText: {
    fontSize: sizeScale(15),
    fontWeight: '600',
    color: '#7C3AED',
  },
  debugButton: {
    width: sizeScale(40),
    height: sizeScale(40),
    borderRadius: sizeScale(20),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  debugBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  debugBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  messagesList: {
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
    paddingBottom: sizeScale(120),
  },
  messageBubble: {
    marginBottom: sizeScale(16),
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: sizeScale(8),
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiBubble: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: sizeScale(15),
    lineHeight: sizeScale(22),
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
    borderRadius: sizeScale(20),
  },
  userMessageText: {
    backgroundColor: '#4C1D95',
    color: '#fff',
    borderBottomRightRadius: sizeScale(4),
  },
  aiMessageText: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderBottomLeftRadius: sizeScale(4),
  },
  aiIconContainer: {
    width: sizeScale(32),
    height: sizeScale(32),
    borderRadius: sizeScale(16),
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIconContainer: {
    width: sizeScale(32),
    height: sizeScale(32),
    borderRadius: sizeScale(16),
    backgroundColor: '#4C1D95',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
    gap: sizeScale(4),
  },
  typingDot: {
    width: sizeScale(8),
    height: sizeScale(8),
    borderRadius: sizeScale(4),
    backgroundColor: '#4C1D95',
    opacity: 0.5,
  },
  typingDotDelay1: {
    opacity: 0.7,
  },
  typingDotDelay2: {
    opacity: 0.9,
  },
  inputArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    paddingHorizontal: sizeScale(16),
    paddingTop: sizeScale(12),
    paddingBottom: Platform.OS === 'ios' ? sizeScale(8) : sizeScale(12),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(24),
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(4),
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: sizeScale(12),
  },
  input: {
    flex: 1,
    fontSize: sizeScale(15),
    color: '#fff',
    paddingVertical: sizeScale(10),
    paddingHorizontal: 0,
    maxHeight: sizeScale(120),
  },
  sendButton: {
    width: sizeScale(32),
    height: sizeScale(32),
    borderRadius: sizeScale(16),
    backgroundColor: '#4C1D95',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sizeScale(4),
  },
  sendButtonDisabled: {
    width: sizeScale(32),
    height: sizeScale(32),
    borderRadius: sizeScale(16),
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sizeScale(4),
  },
  footerText: {
    fontSize: sizeScale(11),
    color: '#666',
    textAlign: 'center',
    marginTop: sizeScale(8),
    paddingHorizontal: sizeScale(16),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: sizeScale(24),
    borderTopRightRadius: sizeScale(24),
    paddingHorizontal: sizeScale(20),
    paddingTop: sizeScale(24),
    paddingBottom: sizeScale(32),
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: sizeScale(24),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: sizeScale(24),
  },
  previewContainer: {
    gap: sizeScale(20),
  },
  previewSection: {
    gap: sizeScale(8),
  },
  previewLabel: {
    fontSize: sizeScale(13),
    color: '#999',
    fontWeight: '600',
  },
  previewValue: {
    fontSize: sizeScale(15),
    color: '#fff',
    lineHeight: sizeScale(22),
  },
  imageUploadContainer: {
    height: sizeScale(200),
    backgroundColor: '#0D0D0D',
    borderRadius: sizeScale(12),
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadText: {
    fontSize: sizeScale(14),
    color: '#666',
    marginTop: sizeScale(8),
  },
  modalActions: {
    flexDirection: 'row',
    gap: sizeScale(12),
    marginTop: sizeScale(24),
  },
  modalButton: {
    flex: 1,
    height: sizeScale(50),
    borderRadius: sizeScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  skipButtonText: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4C1D95',
  },
  submitButtonDisabled: {
    backgroundColor: '#2a2a2a',
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  // Debug Console Styles
  debugModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  debugModalContent: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizeScale(20),
    paddingVertical: sizeScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  debugTitle: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#fff',
  },
  debugCloseButton: {
    width: sizeScale(40),
    height: sizeScale(40),
    borderRadius: sizeScale(20),
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugLogContainer: {
    flex: 1,
    paddingHorizontal: sizeScale(16),
  },
  debugLogItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(8),
    padding: sizeScale(12),
    marginVertical: sizeScale(6),
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  debugLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sizeScale(8),
    gap: sizeScale(8),
  },
  debugLogType: {
    fontSize: sizeScale(12),
    fontWeight: '700',
  },
  debugLogTime: {
    fontSize: sizeScale(11),
    color: '#666',
    marginLeft: 'auto',
  },
  debugLogMessage: {
    fontSize: sizeScale(14),
    color: '#fff',
    marginBottom: sizeScale(6),
    lineHeight: sizeScale(20),
  },
  debugLogDetails: {
    fontSize: sizeScale(12),
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#0a0a0a',
    padding: sizeScale(8),
    borderRadius: sizeScale(4),
    lineHeight: sizeScale(18),
  },
  debugEmpty: {
    fontSize: sizeScale(14),
    color: '#666',
    textAlign: 'center',
    marginTop: sizeScale(40),
  },
});