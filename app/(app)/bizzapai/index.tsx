// app/(app)/bizzapai/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { aiAPI, ExtractedLeadData } from '../../../services/ai';
import { leadsAPI } from '../../../services/leads';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BizzapAIScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  
  const [inputText, setInputText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedLeadData | null>(null);

  // Editable fields for preview
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
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
      setUploadedImage(result.assets[0]);
    }
  };

  const handleCancelImage = () => {
    setUploadedImage(null);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      Alert.alert('Missing Info', 'Please describe your requirement first.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await aiAPI.extractFromText(inputText);
      
      if (response && response.data) {
        const data = response.data;
        setExtractedData(data);
        
        // Pre-fill editable fields
        setEditableTitle(data.title || '');
        setEditableDescription(data.description || '');
        setEditableQuantity(data.quantity || '');
        setEditableLocation(data.location || '');
        setEditableBudget(data.budget || '');
        
        setShowPreview(true);
      }
    } catch (error: any) {
      console.error('Generate Error:', error);
      Alert.alert('Error', error.message || 'Failed to process requirement. Please try again.');
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
        description: editableDescription.trim(),
        quantity: editableQuantity.trim(),
        location: editableLocation.trim(),
        budget: editableBudget.trim(),
      };

      // Only add image if it exists
      if (uploadedImage) {
        const imageFile: any = {
          uri: Platform.OS === 'ios' ? uploadedImage.uri.replace('file://', '') : uploadedImage.uri,
          name: uploadedImage.fileName || `lead_${Date.now()}.jpg`,
          type: uploadedImage.type || uploadedImage.mimeType || 'image/jpeg',
        };
        leadPayload.image = imageFile;
      }

      console.log('Submitting lead payload:', leadPayload);

      const response = await leadsAPI.createLead(leadPayload);

      console.log('Create lead response:', response);

      if (response && (response.statusCode === 201 || response.status === 'success')) {
        setShowPreview(false);
        setShowSuccessModal(true);
        
        // Reset form and hide success modal after delay
        setTimeout(() => {
          setShowSuccessModal(false);
          setInputText('');
          setUploadedImage(null);
          setExtractedData(null);
          setEditableTitle('');
          setEditableDescription('');
          setEditableQuantity('');
          setEditableLocation('');
          setEditableBudget('');
        }, 2000);
      } else {
        throw new Error('Failed to create lead');
      }
    } catch (error: any) {
      console.error('Submit Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Submission Failed', error.message || 'Unable to post lead. Please check your connection and try again.');
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

  // Calculate responsive width (max 389px like design)
  const containerWidth = Math.min(screenWidth, 389);

  return (
    <View style={styles.transactions}>
      {/* Header - Buy Leads Screen */}
      <View style={styles.buyLeadsScreen}>
        <View style={styles.container2}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.iconWrapper}
            activeOpacity={0.7}
          >
            <View style={styles.icon}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.heading}>
            <Text style={styles.textWrapper4}>Post a Requirement</Text>
          </View>
        </View>
      </View>

      {/* App Content */}
      <View style={[styles.app, { width: containerWidth }]}>
        <View style={styles.transactionHistory}>
          {/* Container - Main Input Card */}
          <View style={[styles.container, { width: containerWidth - 31 }]}>
            {/* Top Bar - Attach Image */}
            <View style={styles.div}>
              <TouchableOpacity onPress={handleImagePicker} activeOpacity={0.7}>
                {uploadedImage ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: uploadedImage.uri }} style={styles.imageSquare} />
                    <TouchableOpacity 
                      style={styles.cancelImageButton}
                      onPress={handleCancelImage}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageSquarePlaceholder}>
                    <MaterialCommunityIcons name="image-outline" size={32} color="#8FA8CC" />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.boldText}>
                <Text style={styles.textWrapper2}>
                  {uploadedImage ? 'Image Attached' : 'Attach Image (Optional)'}
                </Text>
              </View>
            </View>

            {/* Text Area Wrapper */}
            <View style={styles.textAreaWrapper}>
              <View style={styles.textArea}>
                <TextInput
                  style={styles.textWrapper3}
                  placeholder="Type your message..."
                  placeholderTextColor="#61738D"
                  multiline
                  value={inputText}
                  onChangeText={setInputText}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Generate Button at Bottom */}
            <View style={styles.frame}>
              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={[styles.buttonInstance, isGenerating && { opacity: 0.7 }]}
                  onPress={handleGenerate}
                  disabled={isGenerating}
                  activeOpacity={0.8}
                >
                  {isGenerating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.designComponentInstanceNode}>Generate</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

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
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Review Your Lead</Text>
                <Text style={styles.modalSubtitle}>Edit any field before posting</Text>
              </View>
              
              <ScrollView 
                style={styles.previewScroll} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.previewScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.leadCardPreview}>
                  {/* Title */}
                  <View style={styles.titleSection}>
                    <Text style={styles.fieldLabel}>Title *</Text>
                    <TextInput
                      style={styles.editableTitle}
                      value={editableTitle}
                      onChangeText={setEditableTitle}
                      placeholder="Enter lead title"
                      placeholderTextColor="#61738D"
                      multiline
                    />
                  </View>

                  {/* Location */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Location</Text>
                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons name="map-marker" size={18} color="#8FA8CC" />
                      <TextInput
                        style={styles.editableField}
                        value={editableLocation}
                        onChangeChange={setEditableLocation}
                        placeholder="Ask Buyer"
                        placeholderTextColor="#8FA8CC"
                      />
                    </View>
                  </View>

                  {/* Image Preview */}
                  {uploadedImage && (
                    <View style={styles.imagePreviewContainer}>
                      <Text style={styles.fieldLabel}>Attached Image</Text>
                      <Image 
                        source={{ uri: uploadedImage.uri }} 
                        style={styles.previewImage} 
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* Quantity & Budget */}
                  <View style={styles.statsRow}>
                    <View style={styles.statField}>
                      <Text style={styles.fieldLabel}>Quantity</Text>
                      <TextInput
                        style={styles.editableStatInput}
                        value={editableQuantity}
                        onChangeText={setEditableQuantity}
                        placeholder="Ask Buyer"
                        placeholderTextColor="#8FA8CC"
                      />
                    </View>
                    
                    <View style={styles.statDivider} />
                    
                    <View style={styles.statField}>
                      <Text style={styles.fieldLabel}>Budget</Text>
                      <TextInput
                        style={styles.editableStatInput}
                        value={editableBudget}
                        onChangeText={setEditableBudget}
                        placeholder="Ask Buyer"
                        placeholderTextColor="#8FA8CC"
                      />
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Description</Text>
                    <TextInput
                      style={styles.editableDescription}
                      value={editableDescription}
                      onChangeText={setEditableDescription}
                      placeholder="Enter description (optional)"
                      placeholderTextColor="#61738D"
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.doAgainButton} 
                  onPress={handleDoAgain}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="refresh" size={20} color="#8FA8CC" />
                  <Text style={styles.doAgainButtonText}>Do Again</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleSubmitLead}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="send" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Post Lead</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Success Modal */}
      <Modal 
        visible={showSuccessModal} 
        animationType="fade" 
        transparent
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check" size={48} color="#00C288" />
            </View>
            <Text style={styles.successTitle}>Lead Posted Successfully!</Text>
            <Text style={styles.successMessage}>Your requirement has been posted and is now visible to sellers.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Container
  transactions: {
    backgroundColor: '#ffffff',
    minHeight: 853,
    position: 'relative',
    width: '100%',
    flex: 1,
  },

  // Header - Buy Leads Screen
  buyLeadsScreen: {
    alignItems: 'flex-start',
    backgroundColor: '#121924',
    borderBottomWidth: 1.18,
    borderBottomColor: '#354152',
    borderStyle: 'solid',
    height: 61,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 1.18,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  container2: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    height: 28,
    width: '100%',
  },
  iconWrapper: {
    alignItems: 'flex-start',
    height: 24,
    width: 24,
  },
  icon: {
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    height: 28,
  },
  textWrapper4: {
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 28,
  },

  // App Content Area
  app: {
    alignItems: 'flex-start',
    backgroundColor: '#020618',
    flexDirection: 'column',
    gap: 3,
    height: SCREEN_HEIGHT - 61,
    position: 'absolute',
    top: 61,
    left: 0,
    alignSelf: 'center',
  },
  transactionHistory: {
    alignItems: 'flex-start',
    backgroundColor: '#000000',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  // Main Container Card
  container: {
    backgroundColor: 'rgba(15, 23, 43, 0.2)',
    borderRadius: 10,
    height: 454,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(43, 127, 255, 0.3)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
  },

  // Top Bar - Attach Image
  div: {
    alignItems: 'center',
    borderBottomWidth: 0.8,
    borderBottomColor: '#1c283c',
    borderStyle: 'solid',
    flexDirection: 'row',
    gap: 8,
    height: 70,
    paddingLeft: 8,
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  imageSquare: {
    height: 56,
    width: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0057D9',
  },
  imageSquarePlaceholder: {
    height: 56,
    width: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8FA8CC',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(143, 168, 204, 0.05)',
  },
  cancelImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1c283c',
  },
  boldText: {
    alignItems: 'flex-start',
    flex: 1,
  },
  textWrapper2: {
    color: '#8FA8CC',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 20,
  },

  // Text Area
  textAreaWrapper: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(29, 41, 61, 0.32)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    gap: 8,
    height: 328,
    padding: 12,
    position: 'absolute',
    top: 70,
    left: 1,
    right: 1,
  },
  textArea: {
    alignItems: 'flex-start',
    flex: 1,
    height: 60,
    width: '100%',
  },
  textWrapper3: {
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
    width: '100%',
    minHeight: 300,
  },

  // Generate Button Area
  frame: {
    alignItems: 'flex-start',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    position: 'absolute',
    bottom: 0,
    left: 1,
    right: 1,
    paddingTop: 16,
  },
  buttonWrapper: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  buttonInstance: {
    backgroundColor: '#0057D9',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  designComponentInstanceNode: {
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 16,
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
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1c283c',
    paddingBottom: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#8FA8CC',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  previewScroll: {
    flex: 1,
    marginBottom: 16,
  },
  previewScrollContent: {
    paddingBottom: 20,
  },
  leadCardPreview: {
    backgroundColor: '#121924',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1c283c',
  },
  fieldLabel: {
    color: '#8FA8CC',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  titleSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(0, 87, 217, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 87, 217, 0.2)',
  },
  editableTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 24,
    minHeight: 48,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(29, 41, 61, 0.4)',
    padding: 12,
    borderRadius: 8,
  },
  editableField: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    flex: 1,
  },
  imagePreviewContainer: {
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
    backgroundColor: 'rgba(29, 41, 61, 0.4)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  statField: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#1c283c',
  },
  editableStatInput: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
    minWidth: 100,
  },
  editableDescription: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    backgroundColor: 'rgba(29, 41, 61, 0.4)',
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1c283c',
  },
  doAgainButton: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#354152',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  doAgainButtonText: {
    color: '#8FA8CC',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#0057D9',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: '#121924',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#00C288',
  },
  successIconCircle: {
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
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    color: '#8FA8CC',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
    lineHeight: 22,
  },
});