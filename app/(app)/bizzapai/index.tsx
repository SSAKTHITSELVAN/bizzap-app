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

interface Suggestion {
  icon: string;
  title: string;
  description: string;
  isNavigate?: boolean;
  navigateTo?: string;
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

// --- Suggestion Card Component ---
const SuggestionCard = ({
  icon,
  title,
  description,
  onPress
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.suggestionCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.suggestionIcon}>
      <MaterialCommunityIcons name={icon as any} size={sizeScale(24)} color="#4C1D95" />
    </View>
    <Text style={styles.suggestionTitle}>{title}</Text>
    <Text style={styles.suggestionDescription}>{description}</Text>
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

  const suggestions: Suggestion[] = [
    {
      icon: 'post',
      title: 'Create Posts',
      description: 'Share your story with photos or videos',
      isNavigate: true,
      navigateTo: '/bizzapai/create-post',
    },
    {
      icon: 'package-variant',
      title: 'Product Lead',
      description: 'I need 1000 units of cotton fabric',
    },
    {
      icon: 'office-building',
      title: 'Service Lead',
      description: 'Looking for web development services',
    },
    {
      icon: 'lightbulb-on',
      title: 'Custom Request',
      description: 'Describe your requirement',
    },
  ];

  const handleSuggestionPress = (suggestion: Suggestion) => {
    if (suggestion.isNavigate && suggestion.navigateTo) {
      router.push(suggestion.navigateTo as any);
    } else {
      setInputText(suggestion.description);
    }
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

    try {
      console.log('📄 Calling AI API with:', {
        input: currentInput,
        historyLength: conversationHistory.length,
      });

      const response = await aiAPI.generateLead(currentInput, conversationHistory);
      console.log('✅ AI API Response received:', response);

      if (!response || !response.data) {
        throw new Error('AI service returned invalid response format');
      }

      const bizData = response.data;

      if (typeof bizData.code === 'undefined' || bizData.code === null) {
        throw new Error('AI service returned incomplete data (missing code field)');
      }

      console.log('📊 Processing response with code:', bizData.code);

      if (hasMinimumRequiredData(bizData)) {
        console.log('✅ Minimum required data met, setting preview data');
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
      console.error('❌ AI API error:', error);

      const isConnectionError =
        error.message?.includes('connect') ||
        error.message?.includes('network') ||
        error.message?.includes('ECONNREFUSED');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: isConnectionError
          ? '❌ Cannot connect to AI service. Please check:\n\n' +
            '• Backend server is running\n' +
            '• Correct URL in config.ts\n' +
            '• CORS is enabled\n\n' +
            'Current AI URL: ' + (Config.AI_BASE_URL || 'Not configured')
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
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0]);
        console.log('🖼️ Image selected:', {
          uri: result.assets[0].uri,
          type: result.assets[0].type || result.assets[0].mimeType,
          name: result.assets[0].fileName,
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSkip = () => {
    setShowPreviewModal(false);
    setUploadedImage(null);
  };

  const handleSubmit = async () => {
    if (!aiGeneratedData) {
      Alert.alert('Error', 'No lead data available');
      return;
    }

    if (!uploadedImage) {
      Alert.alert('Image Required', 'Please upload an image before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare lead data
      const leadData: any = {
        title: aiGeneratedData.title,
        description: aiGeneratedData.description !== 'No description provided'
          ? aiGeneratedData.description
          : `${aiGeneratedData.title} - ${aiGeneratedData.quantity} ${aiGeneratedData.unit}`,
        quantity: `${aiGeneratedData.quantity} ${aiGeneratedData.unit}`,
      };

      // Add optional fields
      if (aiGeneratedData.location && aiGeneratedData.location !== 'Location not specified') {
        leadData.location = aiGeneratedData.location;
      }

      if (aiGeneratedData.min_budget !== '0' && aiGeneratedData.max_budget !== '0') {
        leadData.budget = `₹${aiGeneratedData.min_budget} - ₹${aiGeneratedData.max_budget}`;
      }

      // CRITICAL FIX: Format image for different platforms
      const imageUri = uploadedImage.uri;
      const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = uploadedImage.fileName || 
                      uploadedImage.name || 
                      `lead_image_${Date.now()}.${fileExtension}`;
      
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
      };
      const mimeType = uploadedImage.type || 
                      uploadedImage.mimeType || 
                      mimeTypes[fileExtension] || 
                      'image/jpeg';

      console.log('🔍 Image debug info:', {
        uri: imageUri,
        fileName,
        mimeType,
        platform: Platform.OS,
      });

      // Platform-specific image formatting
      if (Platform.OS === 'web') {
        // For web: Convert blob URI to File object
        try {
          console.log('🌐 Converting image for web...');
          const response = await fetch(imageUri);
          const blob = await response.blob();
          leadData.image = new File([blob], fileName, { type: mimeType });
          console.log('✅ Web File created:', leadData.image);
        } catch (error) {
          console.error('Failed to convert image to File:', error);
          throw new Error('Failed to process image. Please try again.');
        }
      } else {
        // For native (iOS/Android)
        leadData.image = {
          uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
          name: fileName,
          type: mimeType,
        };
        console.log('📱 Native image object created:', leadData.image);
      }

      console.log('📤 Submitting lead:', {
        title: leadData.title,
        hasImage: true,
        platform: Platform.OS,
      });

      const response = await leadsAPI.createLead(leadData);

      console.log('✅ Lead created successfully:', response);

      if (response.statusCode === 201) {
        Alert.alert('Success', 'Lead created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);

        const successMessage: Message = {
          id: Date.now().toString(),
          text: '🎉 Lead submitted successfully!',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);

        setShowPreviewModal(false);
        setAiGeneratedData(null);
        setUploadedImage(null);
        setConversationHistory('');
      }

    } catch (error: any) {
      console.error('❌ Submission error:', error);
      
      const errorMessage = error.message || 'Failed to create lead. Please try again.';
      Alert.alert('Error', errorMessage);
      
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
      });
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
          Your intelligent lead creation assistant
        </Text>
      </View>

      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Try these examples:</Text>
        <View style={styles.suggestionsGrid}>
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={index}
              icon={suggestion.icon}
              title={suggestion.title}
              description={suggestion.description}
              onPress={() => handleSuggestionPress(suggestion)}
            />
          ))}
        </View>
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
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
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
                  {/* Title */}
                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>Title</Text>
                    <Text style={styles.previewValue}>{aiGeneratedData.title}</Text>
                  </View>

                  {/* Description */}
                  {aiGeneratedData.description !== 'No description provided' && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewLabel}>Description</Text>
                      <Text style={styles.previewValue}>{aiGeneratedData.description}</Text>
                    </View>
                  )}

                  {/* Location */}
                  {aiGeneratedData.location !== 'Location not specified' && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewLabel}>Location</Text>
                      <Text style={styles.previewValue}>{aiGeneratedData.location}</Text>
                    </View>
                  )}

                  {/* Quantity */}
                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>Quantity</Text>
                    <Text style={styles.previewValue}>
                      {aiGeneratedData.quantity} {aiGeneratedData.unit}
                    </Text>
                  </View>

                  {/* Budget */}
                  {aiGeneratedData.min_budget !== '0' && aiGeneratedData.max_budget !== '0' && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewLabel}>Budget</Text>
                      <Text style={styles.previewValue}>
                        ₹{aiGeneratedData.min_budget} - ₹{aiGeneratedData.max_budget}
                      </Text>
                    </View>
                  )}

                  {/* Image Upload */}
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

              {/* Action Buttons */}
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
  suggestionsContainer: {
    flex: 1,
  },
  suggestionsTitle: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#fff',
    marginBottom: sizeScale(16),
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizeScale(12),
  },
  suggestionCard: {
    width: (SCREEN_WIDTH - sizeScale(52)) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(16),
    padding: sizeScale(16),
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  suggestionIcon: {
    width: sizeScale(48),
    height: sizeScale(48),
    borderRadius: sizeScale(24),
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sizeScale(12),
  },
  suggestionTitle: {
    fontSize: sizeScale(15),
    fontWeight: '700',
    color: '#fff',
    marginBottom: sizeScale(4),
  },
  suggestionDescription: {
    fontSize: sizeScale(13),
    color: '#666',
    lineHeight: sizeScale(18),
  },
  messagesList: {
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(20),
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
});