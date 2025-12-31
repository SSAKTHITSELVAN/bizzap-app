// app/(app)/bizzapai/index.tsx

import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiAPI, ExtractedLeadData } from '../../../services/ai';
import { leadsAPI } from '../../../services/leads';

// --- Theme Colors ---
const GRADIENT_COLORS = ['#003E9C', '#01BE8B']; 
const PURE_BLUE = '#0057D9';

export default function BizzapAIScreen() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const [inputText, setInputText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedLeadData | null>(null);

  // Editable fields for preview
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState(''); // Kept in state for API, hidden from UI
  const [editableQuantity, setEditableQuantity] = useState('');
  const [editableLocation, setEditableLocation] = useState('');
  const [editableBudget, setEditableBudget] = useState('');

  const handleImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'We need access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let mimeType = asset.mimeType || asset.type;
      if (!mimeType || mimeType === 'image') mimeType = 'image/jpeg';
      
      setUploadedImage({ ...asset, mimeType });
    }
  };

  const handleCancelImage = () => {
    setUploadedImage(null);
  };

  const handleGenerate = async () => {
    // 1. Mandatory Image Check
    if (!uploadedImage) {
        Alert.alert(
            "Image Required", 
            "Please attach an image before generating.",
            [{ text: "OK", onPress: handleImagePicker }]
        );
        return;
    }

    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      Alert.alert('Missing Info', 'Please describe your requirement first.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await aiAPI.extractFromText(trimmedInput);
      if (response && response.data) {
        const data = response.data;
        setExtractedData(data);
        setEditableTitle(data.title || '');
        setEditableDescription(data.description || ''); // Saved for API
        setEditableQuantity(data.quantity || '');
        setEditableLocation(data.location || '');
        setEditableBudget(data.budget || '');
        setShowPreview(true);
      }
    } catch (error: any) {
      console.error('Generate Error:', error);
      Alert.alert('Error', error.message || 'Failed to process requirement.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitLead = async () => {
    if (!editableTitle.trim()) {
      Alert.alert('Missing Title', 'Please provide a title for the lead.');
      return;
    }

    setIsSubmitting(true);
    try {
      const leadPayload: any = {
        title: editableTitle.trim(),
        description: editableDescription.trim(), // Sent to API, but hidden from Preview UI
        quantity: editableQuantity.trim(),
        location: editableLocation.trim(),
        budget: editableBudget.trim(),
      };

      if (uploadedImage) {
        leadPayload.image = {
          uri: Platform.OS === 'ios' ? uploadedImage.uri.replace('file://', '') : uploadedImage.uri,
          name: uploadedImage.fileName || `lead_${Date.now()}.jpg`,
          type: uploadedImage.mimeType,
        };
      }

      const response = await leadsAPI.createLead(leadPayload);

      if (response && (response.statusCode === 201 || response.status === 'success')) {
        setShowPreview(false);
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          handleDoAgain();
          setInputText('');
          setUploadedImage(null);
        }, 2000);
      } else {
        throw new Error('Failed to create lead');
      }
    } catch (error: any) {
      console.error('Submit Error:', error);
      Alert.alert('Submission Failed', error.message || 'Unable to post lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoAgain = () => {
    setShowPreview(false);
    setExtractedData(null);
    setEditableTitle('');
    setEditableDescription('');
    setEditableQuantity('');
    setEditableLocation('');
    setEditableBudget('');
  };

  // Responsive calculations
  const isSmallScreen = screenWidth < 360;
  const contentPadding = 16;
  const cardWidth = screenWidth - (contentPadding * 2);
  const cardHeight = isSmallScreen ? 450 : 500;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121924" translucent={false} />
      
      {/* Header - No Back Button */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Post a Requirement</Text>
        </View>
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Input Card with Blue-Teal Gradient Border */}
          <LinearGradient
            colors={GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientBorder, { width: cardWidth, minHeight: cardHeight }]}
          >
            <View style={styles.cardInner}>
              
              {/* Image Attachment Bar */}
              <View style={styles.attachmentBar}>
                <TouchableOpacity onPress={handleImagePicker} activeOpacity={0.7} style={styles.imagePickerBtn}>
                  {uploadedImage ? (
                    <View>
                      <Image source={{ uri: uploadedImage.uri }} style={styles.attachedThumbnail} />
                      <TouchableOpacity style={styles.removeImageBtn} onPress={handleCancelImage}>
                        <MaterialCommunityIcons name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.placeholderThumbnail}>
                      <MaterialCommunityIcons name="image-outline" size={24} color="#8FA8CC" />
                    </View>
                  )}
                  <Text style={styles.attachmentText}>
                    {uploadedImage ? 'Image Attached' : 'Attach Image (Mandatory)'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Text Area */}
              <View style={styles.inputArea}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe your requirement here..."
                  placeholderTextColor="#61738D"
                  multiline
                  value={inputText}
                  onChangeText={setInputText}
                  textAlignVertical="top"
                />
              </View>

              {/* Generate Button: Gradient Border, Pure Blue Fill */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleGenerate}
                  disabled={isGenerating}
                  activeOpacity={0.8}
                  style={styles.touchableButton}
                >
                  <LinearGradient
                    colors={GRADIENT_COLORS}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButtonBorder}
                  >
                    <View style={styles.solidButtonInner}>
                        {isGenerating ? (
                        <ActivityIndicator color="#fff" size="small" />
                        ) : (
                        <Text style={styles.buttonText}>Post</Text>
                        )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Preview Modal */}
      <Modal 
        visible={showPreview} 
        animationType="slide" 
        transparent
        onRequestClose={() => !isSubmitting && handleDoAgain()}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: screenHeight * 0.9 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Review Your Lead</Text>
                <Text style={styles.modalSubtitle}>Edit any field before posting</Text>
              </View>
              
              <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.previewForm}>
                  {/* Title */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Title *</Text>
                    <TextInput
                      style={styles.previewInput}
                      value={editableTitle}
                      onChangeText={setEditableTitle}
                      placeholderTextColor="#61738D"
                    />
                  </View>

                  {/* Location */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Location</Text>
                    <View style={styles.iconInputRow}>
                      <MaterialCommunityIcons name="map-marker" size={18} color="#8FA8CC" />
                      <TextInput
                        style={styles.rowInput}
                        value={editableLocation}
                        onChangeText={setEditableLocation}
                        placeholderTextColor="#61738D"
                      />
                    </View>
                  </View>

                  {/* Image Preview */}
                  {uploadedImage && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Attached Image</Text>
                      <Image 
                        source={{ uri: uploadedImage.uri }} 
                        style={styles.fullPreviewImage} 
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* Stats Row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.label}>Quantity</Text>
                      <TextInput
                        style={styles.statInput}
                        value={editableQuantity}
                        onChangeText={setEditableQuantity}
                        placeholderTextColor="#61738D"
                      />
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.statCol}>
                      <Text style={styles.label}>Budget</Text>
                      <TextInput
                        style={styles.statInput}
                        value={editableBudget}
                        onChangeText={setEditableBudget}
                        placeholderTextColor="#61738D"
                      />
                    </View>
                  </View>

                  {/* Description Removed from Preview UI */}
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.secondaryButton} 
                  onPress={handleDoAgain}
                  disabled={isSubmitting}
                >
                  <MaterialCommunityIcons name="refresh" size={20} color="#8FA8CC" />
                  <Text style={styles.secondaryButtonText}>Do Again</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.submitTouch}
                  onPress={handleSubmitLead}
                  disabled={isSubmitting}
                >
                  {/* Same Gradient Border Button Style for Submit */}
                  <LinearGradient
                    colors={GRADIENT_COLORS}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradientBorder}
                  >
                    <View style={styles.submitSolidInner}>
                        {isSubmitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                        ) : (
                        <>
                            <MaterialCommunityIcons name="send" size={18} color="#fff" />
                            <Text style={styles.buttonText}>Post Lead</Text>
                        </>
                        )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} animationType="fade" transparent>
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <View style={styles.successIcon}>
              <MaterialCommunityIcons name="check" size={40} color="#00C288" />
            </View>
            <Text style={styles.successTitle}>Lead Posted Successfully!</Text>
            <Text style={styles.successText}>Your requirement is now live.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    backgroundColor: '#121924',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Centered Title
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 40,
  },
  
  // Main Card
  gradientBorder: {
    borderRadius: 16,
    padding: 2,
  },
  cardInner: {
    flex: 1,
    backgroundColor: '#0F1723',
    borderRadius: 14,
    overflow: 'hidden',
  },
  
  // Attachment Bar
  attachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  attachedThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0057D9',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  placeholderThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(143, 168, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
  },
  attachmentText: {
    color: '#8FA8CC',
    fontSize: 14,
    fontWeight: '500',
  },

  // Input Area
  inputArea: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
  },

  // Button Container
  buttonContainer: {
    padding: 16,
    backgroundColor: '#0F1723',
  },
  touchableButton: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#003E9C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Button Gradient Border
  gradientButtonBorder: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2, // Thickness of the gradient border
    borderRadius: 10,
  },
  // Solid Blue Inner Button
  solidButtonInner: {
    flex: 1,
    width: '100%',
    backgroundColor: PURE_BLUE,
    borderRadius: 8, // Slightly less than outer radius
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F1723',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#8FA8CC',
    fontSize: 14,
  },
  previewForm: {
    backgroundColor: '#121924',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#8FA8CC',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  previewInput: {
    backgroundColor: 'rgba(0, 87, 217, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 87, 217, 0.2)',
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  iconInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  rowInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  fullPreviewImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  statCol: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statInput: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: '100%',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#374151',
  },
  
  // Modal Actions
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#8FA8CC',
    fontSize: 16,
    fontWeight: '600',
  },
  submitTouch: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitGradientBorder: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderRadius: 10,
  },
  submitSolidInner: {
    flex: 1,
    width: '100%',
    backgroundColor: PURE_BLUE,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContent: {
    backgroundColor: '#121924',
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00C288',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 194, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00C288',
  },
  successTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    color: '#8FA8CC',
    fontSize: 15,
    textAlign: 'center',
  },
});