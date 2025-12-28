// // app/(app)/bizzapai/index.tsx
// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Modal,
//   Image,
//   ActivityIndicator,
//   Alert,
//   Platform,
//   KeyboardAvoidingView,
//   Dimensions,
//   useWindowDimensions,
// } from 'react-native';
// import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import * as ImagePicker from 'expo-image-picker';
// import { LinearGradient } from 'expo-linear-gradient'; // Still needed for the Card Border
// import { aiAPI, ExtractedLeadData } from '../../../services/ai';
// import { leadsAPI } from '../../../services/leads';

// const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// // Rainbow Colors for the Card border only
// const RAINBOW_COLORS = [
//   '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#8B00FF'
// ];

// export default function BizzapAIScreen() {
//   const router = useRouter();
//   const { width: screenWidth } = useWindowDimensions();
  
//   const [inputText, setInputText] = useState('');
//   const [uploadedImage, setUploadedImage] = useState<any>(null);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showPreview, setShowPreview] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [extractedData, setExtractedData] = useState<ExtractedLeadData | null>(null);

//   // Editable fields for preview
//   const [editableTitle, setEditableTitle] = useState('');
//   const [editableDescription, setEditableDescription] = useState('');
//   const [editableQuantity, setEditableQuantity] = useState('');
//   const [editableLocation, setEditableLocation] = useState('');
//   const [editableBudget, setEditableBudget] = useState('');

//   const handleImagePicker = async () => {
//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permission.granted) {
//       Alert.alert('Permission Required', 'We need access to your photos.');
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 0.8,
//     });

//     if (!result.canceled && result.assets[0]) {
//       setUploadedImage(result.assets[0]);
//     }
//   };

//   const handleCancelImage = () => {
//     setUploadedImage(null);
//   };

//   const handleGenerate = async () => {
//     if (!inputText.trim()) {
//       Alert.alert('Missing Info', 'Please describe your requirement first.');
//       return;
//     }

//     setIsGenerating(true);
//     try {
//       const response = await aiAPI.extractFromText(inputText);
      
//       if (response && response.data) {
//         const data = response.data;
//         setExtractedData(data);
        
//         // Pre-fill editable fields
//         setEditableTitle(data.title || '');
//         setEditableDescription(data.description || '');
//         setEditableQuantity(data.quantity || '');
//         setEditableLocation(data.location || '');
//         setEditableBudget(data.budget || '');
        
//         setShowPreview(true);
//       }
//     } catch (error: any) {
//       console.error('Generate Error:', error);
//       Alert.alert('Error', error.message || 'Failed to process requirement. Please try again.');
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const handleSubmitLead = async () => {
//     if (!editableTitle.trim()) {
//       Alert.alert('Missing Title', 'Please provide a title for the lead.');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const leadPayload: any = {
//         title: editableTitle.trim(),
//         description: editableDescription.trim(),
//         quantity: editableQuantity.trim(),
//         location: editableLocation.trim(),
//         budget: editableBudget.trim(),
//       };

//       // Only add image if it exists
//       if (uploadedImage) {
//         const imageFile: any = {
//           uri: Platform.OS === 'ios' ? uploadedImage.uri.replace('file://', '') : uploadedImage.uri,
//           name: uploadedImage.fileName || `lead_${Date.now()}.jpg`,
//           type: uploadedImage.type || uploadedImage.mimeType || 'image/jpeg',
//         };
//         leadPayload.image = imageFile;
//       }

//       console.log('Submitting lead payload:', leadPayload);

//       const response = await leadsAPI.createLead(leadPayload);

//       console.log('Create lead response:', response);

//       if (response && (response.statusCode === 201 || response.status === 'success')) {
//         setShowPreview(false);
//         setShowSuccessModal(true);
        
//         // Reset form and hide success modal after delay
//         setTimeout(() => {
//           setShowSuccessModal(false);
//           setInputText('');
//           setUploadedImage(null);
//           setExtractedData(null);
//           setEditableTitle('');
//           setEditableDescription('');
//           setEditableQuantity('');
//           setEditableLocation('');
//           setEditableBudget('');
//         }, 2000);
//       } else {
//         throw new Error('Failed to create lead');
//       }
//     } catch (error: any) {
//       console.error('Submit Error:', error);
//       console.error('Error details:', JSON.stringify(error, null, 2));
//       Alert.alert('Submission Failed', error.message || 'Unable to post lead. Please check your connection and try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDoAgain = () => {
//     setShowPreview(false);
//     setExtractedData(null);
//     setEditableTitle('');
//     setEditableDescription('');
//     setEditableQuantity('');
//     setEditableLocation('');
//     setEditableBudget('');
//   };

//   // Calculate responsive width (max 389px like design)
//   const containerWidth = Math.min(screenWidth, 389);

//   return (
//     <View style={styles.transactions}>
//       {/* Header - Buy Leads Screen */}
//       <View style={styles.buyLeadsScreen}>
//         <View style={styles.container2}>
//           <TouchableOpacity 
//             onPress={() => router.back()} 
//             style={styles.iconWrapper}
//             activeOpacity={0.7}
//           >
//             <View style={styles.icon}>
//               <Ionicons name="chevron-back" size={24} color="#fff" />
//             </View>
//           </TouchableOpacity>
//           <View style={styles.heading}>
//             <Text style={styles.textWrapper4}>Post a Requirement</Text>
//           </View>
//         </View>
//       </View>

//       {/* App Content */}
//       <View style={[styles.app, { width: containerWidth }]}>
//         <View style={styles.transactionHistory}>
          
//           {/* --- MAIN INPUT CARD WITH RAINBOW BORDER (Kept as requested) --- */}
//           <LinearGradient
//              colors={RAINBOW_COLORS}
//              start={{ x: 0, y: 0 }}
//              end={{ x: 1, y: 1 }}
//              style={[styles.rainbowCardBorder, { width: containerWidth - 31 }]}
//           >
//             <View style={styles.containerInner}>
//               {/* Top Bar - Attach Image */}
//               <View style={styles.div}>
//                 <TouchableOpacity onPress={handleImagePicker} activeOpacity={0.7}>
//                   {uploadedImage ? (
//                     <View style={styles.imageContainer}>
//                       <Image source={{ uri: uploadedImage.uri }} style={styles.imageSquare} />
//                       <TouchableOpacity 
//                         style={styles.cancelImageButton}
//                         onPress={handleCancelImage}
//                         activeOpacity={0.7}
//                       >
//                         <MaterialCommunityIcons name="close" size={16} color="#fff" />
//                       </TouchableOpacity>
//                     </View>
//                   ) : (
//                     <View style={styles.imageSquarePlaceholder}>
//                       <MaterialCommunityIcons name="image-outline" size={32} color="#8FA8CC" />
//                     </View>
//                   )}
//                 </TouchableOpacity>
//                 <View style={styles.boldText}>
//                   <Text style={styles.textWrapper2}>
//                     {uploadedImage ? 'Image Attached' : 'Attach Image (Optional)'}
//                   </Text>
//                 </View>
//               </View>

//               {/* Text Area Wrapper */}
//               <View style={styles.textAreaWrapper}>
//                 <View style={styles.textArea}>
//                   <TextInput
//                     style={styles.textWrapper3}
//                     placeholder="Type your message..."
//                     placeholderTextColor="#61738D"
//                     multiline
//                     value={inputText}
//                     onChangeText={setInputText}
//                     textAlignVertical="top"
//                   />
//                 </View>
//               </View>

//               {/* Generate Button at Bottom */}
//               <View style={styles.frame}>
//                 <View style={styles.buttonWrapper}>
                  
//                   {/* --- PRIMARY BLUE BUTTON (Reverted) --- */}
//                   <TouchableOpacity
//                     style={[styles.primaryButton, isGenerating && { opacity: 0.7 }]}
//                     onPress={handleGenerate}
//                     disabled={isGenerating}
//                     activeOpacity={0.8}
//                   >
//                     {isGenerating ? (
//                       <ActivityIndicator color="#fff" size="small" />
//                     ) : (
//                       <Text style={styles.designComponentInstanceNode}>Generate</Text>
//                     )}
//                   </TouchableOpacity>

//                 </View>
//               </View>
//             </View>
//           </LinearGradient>
//         </View>
//       </View>

//       {/* Preview Modal */}
//       <Modal 
//         visible={showPreview} 
//         animationType="slide" 
//         transparent
//         onRequestClose={() => !isSubmitting && handleDoAgain()}
//       >
//         <KeyboardAvoidingView
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           style={styles.modalContainer}
//         >
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContent}>
//               <View style={styles.modalHeader}>
//                 <Text style={styles.modalTitle}>Review Your Lead</Text>
//                 <Text style={styles.modalSubtitle}>Edit any field before posting</Text>
//               </View>
              
//               <ScrollView 
//                 style={styles.previewScroll} 
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={styles.previewScrollContent}
//                 keyboardShouldPersistTaps="handled"
//               >
//                 <View style={styles.leadCardPreview}>
//                   {/* Title */}
//                   <View style={styles.titleSection}>
//                     <Text style={styles.fieldLabel}>Title *</Text>
//                     <TextInput
//                       style={styles.editableTitle}
//                       value={editableTitle}
//                       onChangeText={setEditableTitle}
//                       placeholder="Enter lead title"
//                       placeholderTextColor="#61738D"
//                       multiline
//                     />
//                   </View>

//                   {/* Location */}
//                   <View style={styles.fieldContainer}>
//                     <Text style={styles.fieldLabel}>Location</Text>
//                     <View style={styles.locationRow}>
//                       <MaterialCommunityIcons name="map-marker" size={18} color="#8FA8CC" />
//                       <TextInput
//                         style={styles.editableField}
//                         value={editableLocation}
//                         onChangeChange={setEditableLocation}
//                         placeholder="Ask Buyer"
//                         placeholderTextColor="#8FA8CC"
//                       />
//                     </View>
//                   </View>

//                   {/* Image Preview */}
//                   {uploadedImage && (
//                     <View style={styles.imagePreviewContainer}>
//                       <Text style={styles.fieldLabel}>Attached Image</Text>
//                       <Image 
//                         source={{ uri: uploadedImage.uri }} 
//                         style={styles.previewImage} 
//                         resizeMode="cover"
//                       />
//                     </View>
//                   )}

//                   {/* Quantity & Budget */}
//                   <View style={styles.statsRow}>
//                     <View style={styles.statField}>
//                       <Text style={styles.fieldLabel}>Quantity</Text>
//                       <TextInput
//                         style={styles.editableStatInput}
//                         value={editableQuantity}
//                         onChangeText={setEditableQuantity}
//                         placeholder="Ask Buyer"
//                         placeholderTextColor="#8FA8CC"
//                       />
//                     </View>
                    
//                     <View style={styles.statDivider} />
                    
//                     <View style={styles.statField}>
//                       <Text style={styles.fieldLabel}>Budget</Text>
//                       <TextInput
//                         style={styles.editableStatInput}
//                         value={editableBudget}
//                         onChangeText={setEditableBudget}
//                         placeholder="Ask Buyer"
//                         placeholderTextColor="#8FA8CC"
//                       />
//                     </View>
//                   </View>

//                   {/* Description */}
//                   <View style={styles.fieldContainer}>
//                     <Text style={styles.fieldLabel}>Description</Text>
//                     <TextInput
//                       style={styles.editableDescription}
//                       value={editableDescription}
//                       onChangeText={setEditableDescription}
//                       placeholder="Enter description (optional)"
//                       placeholderTextColor="#61738D"
//                       multiline
//                       numberOfLines={4}
//                     />
//                   </View>
//                 </View>
//               </ScrollView>

//               {/* Action Buttons */}
//               <View style={styles.modalActions}>
//                 <TouchableOpacity 
//                   style={styles.doAgainButton} 
//                   onPress={handleDoAgain}
//                   disabled={isSubmitting}
//                   activeOpacity={0.7}
//                 >
//                   <MaterialCommunityIcons name="refresh" size={20} color="#8FA8CC" />
//                   <Text style={styles.doAgainButtonText}>Do Again</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity 
//                   style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
//                   onPress={handleSubmitLead}
//                   disabled={isSubmitting}
//                   activeOpacity={0.7}
//                 >
//                   {isSubmitting ? (
//                     <ActivityIndicator color="#fff" size="small" />
//                   ) : (
//                     <>
//                       <MaterialCommunityIcons name="send" size={20} color="#fff" />
//                       <Text style={styles.submitButtonText}>Post Lead</Text>
//                     </>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>

//       {/* Success Modal */}
//       <Modal 
//         visible={showSuccessModal} 
//         animationType="fade" 
//         transparent
//       >
//         <View style={styles.successModalOverlay}>
//           <View style={styles.successModalContent}>
//             <View style={styles.successIconCircle}>
//               <MaterialCommunityIcons name="check" size={48} color="#00C288" />
//             </View>
//             <Text style={styles.successTitle}>Lead Posted Successfully!</Text>
//             <Text style={styles.successMessage}>Your requirement has been posted and is now visible to sellers.</Text>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   // Main Container
//   transactions: {
//     backgroundColor: '#ffffff',
//     minHeight: 853,
//     position: 'relative',
//     width: '100%',
//     flex: 1,
//   },

//   // Header - Buy Leads Screen
//   buyLeadsScreen: {
//     alignItems: 'flex-start',
//     backgroundColor: '#121924',
//     borderBottomWidth: 1.18,
//     borderBottomColor: '#354152',
//     borderStyle: 'solid',
//     height: 61,
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     paddingBottom: 1.18,
//     width: '100%',
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     zIndex: 10,
//   },
//   container2: {
//     alignItems: 'center',
//     flexDirection: 'row',
//     gap: 12,
//     height: 28,
//     width: '100%',
//   },
//   iconWrapper: {
//     alignItems: 'flex-start',
//     height: 24,
//     width: 24,
//   },
//   icon: {
//     height: 24,
//     width: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   heading: {
//     height: 28,
//   },
//   textWrapper4: {
//     color: '#ffffff',
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     fontSize: 18,
//     fontWeight: '600',
//     letterSpacing: 0,
//     lineHeight: 28,
//   },

//   // App Content Area
//   app: {
//     alignItems: 'flex-start',
//     backgroundColor: '#020618',
//     flexDirection: 'column',
//     gap: 3,
//     height: SCREEN_HEIGHT - 61,
//     position: 'absolute',
//     top: 61,
//     left: 0,
//     alignSelf: 'center',
//   },
//   transactionHistory: {
//     alignItems: 'flex-start',
//     backgroundColor: '#000000',
//     flexDirection: 'column',
//     gap: 12,
//     width: '100%',
//     flex: 1,
//     paddingHorizontal: 16,
//     paddingTop: 18,
//   },

//   // --- Rainbow Card Styles ---
//   rainbowCardBorder: {
//     height: 454, // Match original height
//     borderRadius: 12, // Rounded corners for the glass border
//     padding: 1.5, // The thickness of the rainbow border
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 5,
//     elevation: 8,
//   },
//   containerInner: {
//     flex: 1,
//     backgroundColor: '#0F1723', // Dark background inside the card
//     borderRadius: 10.5, // Slightly less than outer to fit perfectly
//     position: 'relative',
//     overflow: 'hidden',
//   },

//   // Top Bar - Attach Image
//   div: {
//     alignItems: 'center',
//     borderBottomWidth: 0.8,
//     borderBottomColor: '#1c283c',
//     borderStyle: 'solid',
//     flexDirection: 'row',
//     gap: 8,
//     height: 70,
//     paddingLeft: 8,
//     position: 'absolute',
//     top: 0, // Adjusted to 0 relative to inner container
//     left: 0,
//     right: 0,
//   },
//   imageContainer: {
//     position: 'relative',
//   },
//   imageSquare: {
//     height: 56,
//     width: 56,
//     borderRadius: 8,
//     borderWidth: 2,
//     borderColor: '#0057D9',
//   },
//   imageSquarePlaceholder: {
//     height: 56,
//     width: 56,
//     borderRadius: 8,
//     borderWidth: 2,
//     borderColor: '#8FA8CC',
//     borderStyle: 'dashed',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'rgba(143, 168, 204, 0.05)',
//   },
//   cancelImageButton: {
//     position: 'absolute',
//     top: -8,
//     right: -8,
//     backgroundColor: '#ff4444',
//     borderRadius: 12,
//     width: 24,
//     height: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: '#1c283c',
//   },
//   boldText: {
//     alignItems: 'flex-start',
//     flex: 1,
//   },
//   textWrapper2: {
//     color: '#8FA8CC',
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     fontSize: 14,
//     fontWeight: '500',
//     letterSpacing: 0,
//     lineHeight: 20,
//   },

//   // Text Area
//   textAreaWrapper: {
//     alignItems: 'flex-start',
//     backgroundColor: 'rgba(29, 41, 61, 0.32)',
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//     gap: 8,
//     height: 328,
//     padding: 12,
//     position: 'absolute',
//     top: 70,
//     left: 0,
//     right: 0,
//   },
//   textArea: {
//     alignItems: 'flex-start',
//     flex: 1,
//     height: 60,
//     width: '100%',
//   },
//   textWrapper3: {
//     color: '#ffffff',
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     fontSize: 16,
//     fontWeight: '400',
//     letterSpacing: 0,
//     lineHeight: 24,
//     width: '100%',
//     minHeight: 300,
//   },

//   // Generate Button Area
//   frame: {
//     alignItems: 'flex-start',
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: 16,
//     backgroundColor: '#0F1723', // Ensure it covers content behind it
//   },
//   buttonWrapper: {
//     width: '100%',
//   },
//   // Primary Button Styles
//   primaryButton: {
//     backgroundColor: '#0057D9',
//     borderRadius: 8,
//     height: 48,
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: '100%',
//     shadowColor: '#0057D9',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 5,
//     elevation: 4,
//   },
//   designComponentInstanceNode: {
//     color: '#ffffff',
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     fontSize: 16,
//     fontWeight: '600',
//     letterSpacing: 0,
//     lineHeight: 16,
//   },

//   // Modal Styles
//   modalContainer: {
//     flex: 1,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.85)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     backgroundColor: '#0F1723',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     maxHeight: SCREEN_HEIGHT * 0.9,
//     paddingTop: 20,
//     paddingHorizontal: 20,
//     paddingBottom: Platform.OS === 'ios' ? 34 : 20,
//   },
//   modalHeader: {
//     marginBottom: 20,
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: '#1c283c',
//     paddingBottom: 16,
//   },
//   modalTitle: {
//     color: '#ffffff',
//     fontSize: 22,
//     fontWeight: '700',
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     marginBottom: 6,
//   },
//   modalSubtitle: {
//     color: '#8FA8CC',
//     fontSize: 14,
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//   },
//   previewScroll: {
//     flex: 1,
//     marginBottom: 16,
//   },
//   previewScrollContent: {
//     paddingBottom: 20,
//   },
//   leadCardPreview: {
//     backgroundColor: '#121924',
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: '#1c283c',
//   },
//   fieldLabel: {
//     color: '#8FA8CC',
//     fontSize: 12,
//     fontWeight: '600',
//     marginBottom: 6,
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   fieldContainer: {
//     marginBottom: 16,
//   },
//   titleSection: {
//     marginBottom: 16,
//     backgroundColor: 'rgba(0, 87, 217, 0.05)',
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: 'rgba(0, 87, 217, 0.2)',
//   },
//   editableTitle: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: '700',
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     lineHeight: 24,
//     minHeight: 48,
//   },
//   locationRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     backgroundColor: 'rgba(29, 41, 61, 0.4)',
//     padding: 12,
//     borderRadius: 8,
//   },
//   editableField: {
//     color: '#FFFFFF',
//     fontSize: 15,
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     flex: 1,
//   },
//   imagePreviewContainer: {
//     marginBottom: 16,
//   },
//   previewImage: {
//     width: '100%',
//     height: 180,
//     borderRadius: 10,
//     backgroundColor: '#1E293B',
//   },
//   statsRow: {
//     flexDirection: 'row',
//     alignItems: 'stretch',
//     marginBottom: 16,
//     backgroundColor: 'rgba(29, 41, 61, 0.4)',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   statField: {
//     flex: 1,
//     padding: 12,
//     alignItems: 'center',
//   },
//   statDivider: {
//     width: 1,
//     backgroundColor: '#1c283c',
//   },
//   editableStatInput: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     textAlign: 'center',
//     minWidth: 100,
//   },
//   editableDescription: {
//     color: '#FFFFFF',
//     fontSize: 15,
//     lineHeight: 22,
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     backgroundColor: 'rgba(29, 41, 61, 0.4)',
//     padding: 12,
//     borderRadius: 8,
//     minHeight: 100,
//     textAlignVertical: 'top',
//   },
//   modalActions: {
//     flexDirection: 'row',
//     gap: 12,
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#1c283c',
//   },
//   doAgainButton: {
//     flex: 1,
//     height: 52,
//     borderRadius: 10,
//     borderWidth: 1.5,
//     borderColor: '#354152',
//     backgroundColor: 'transparent',
//     justifyContent: 'center',
//     alignItems: 'center',
//     flexDirection: 'row',
//     gap: 8,
//   },
//   doAgainButtonText: {
//     color: '#8FA8CC',
//     fontSize: 16,
//     fontWeight: '600',
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//   },
//   submitButton: {
//     flex: 2,
//     backgroundColor: '#0057D9',
//     height: 52,
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     flexDirection: 'row',
//     gap: 8,
//   },
//   submitButtonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '700',
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//   },

//   // Success Modal Styles
//   successModalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   successModalContent: {
//     backgroundColor: '#121924',
//     borderRadius: 20,
//     padding: 32,
//     alignItems: 'center',
//     width: '90%',
//     maxWidth: 340,
//     borderWidth: 1,
//     borderColor: '#00C288',
//   },
//   successIconCircle: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: 'rgba(0, 194, 136, 0.15)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     borderWidth: 2,
//     borderColor: '#00C288',
//   },
//   successTitle: {
//     color: '#ffffff',
//     fontSize: 22,
//     fontWeight: '700',
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   successMessage: {
//     color: '#8FA8CC',
//     fontSize: 15,
//     fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
// });

// app/(app)/bizzapai/index.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { aiAPI, ExtractedLeadData } from '../../../services/ai';
import { leadsAPI } from '../../../services/leads';

// Rainbow Colors for the Card border only
const RAINBOW_COLORS = [
  '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#8B00FF'
];

export default function BizzapAIScreen() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
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

  // const handleImagePicker = async () => {
  //   const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //   if (!permission.granted) {
  //     Alert.alert('Permission Required', 'We need access to your photos.');
  //     return;
  //   }

  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [4, 3],
  //     quality: 0.8,
  //   });

  //   if (!result.canceled && result.assets[0]) {
  //     setUploadedImage(result.assets[0]);
  //   }
  // };

  const handleImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'We need access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Updated syntax
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Reduced quality to 0.5 to compress image
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      // Check file size (if available)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { // 5MB limit
        Alert.alert(
          'Image Too Large',
          'Please select an image smaller than 5MB.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      
      // Ensure we have proper MIME type
      const uri = asset.uri;
      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      let mimeType = asset.mimeType || asset.type;
      
      // Fix MIME type if needed
      if (!mimeType || mimeType === 'image') {
        if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
          mimeType = 'image/jpeg';
        } else if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'webp') {
          mimeType = 'image/webp';
        } else {
          mimeType = 'image/jpeg';
        }
      }
      
      setUploadedImage({
        ...asset,
        mimeType: mimeType,
        type: mimeType,
      });
    }
  };
  
  const handleCancelImage = () => {
    setUploadedImage(null);
  };

  const handleGenerate = async () => {
    const trimmedInput = inputText.trim();
    
    if (!trimmedInput) {
      Alert.alert('Missing Info', 'Please describe your requirement first.');
      return;
    }

    if (trimmedInput.length < 10) {
      Alert.alert(
        'Input Too Short', 
        'Please provide more details about your requirement (at least 10 characters).',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsGenerating(true);
    try {
      const response = await aiAPI.extractFromText(trimmedInput);
      
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
    const trimmedTitle = editableTitle.trim();
    
    if (!trimmedTitle) {
      Alert.alert(
        'Missing Title', 
        'Please provide a title for the lead.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (trimmedTitle.length < 5) {
      Alert.alert(
        'Title Too Short', 
        'Please provide a more descriptive title (at least 5 characters).',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    const trimmedDescription = editableDescription.trim();
    if (trimmedDescription && trimmedDescription.length < 10) {
      Alert.alert(
        'Description Too Short', 
        'If you provide a description, please make it more detailed (at least 10 characters).',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const leadPayload: any = {
        title: trimmedTitle,
        description: trimmedDescription,
        quantity: editableQuantity.trim(),
        location: editableLocation.trim(),
        budget: editableBudget.trim(),
      };

      // Add image if exists
      if (uploadedImage) {
        leadPayload.image = {
          uri: uploadedImage.uri,
          name: uploadedImage.fileName || `lead_${Date.now()}.jpg`,
          type: uploadedImage.type || uploadedImage.mimeType || 'image/jpeg',
        };
      }

      console.log('Submitting lead...');

      const response = await leadsAPI.createLead(leadPayload);

      console.log('Lead created successfully:', response);

      if (response && (response.statusCode === 201 || response.status === 'success')) {
        setShowPreview(false);
        setShowSuccessModal(true);
        
        // Reset form after delay
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
      
      // Better error messages for user
      let errorMessage = 'Unable to post lead. Please try again.';
      
      if (error.message.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.toLowerCase().includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Submission Failed', 
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
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
  const isMediumScreen = screenWidth >= 360 && screenWidth < 768;
  const isLargeScreen = screenWidth >= 768;

  // Responsive dimensions
  const contentPadding = isSmallScreen ? 12 : isMediumScreen ? 16 : 24;
  const cardWidth = screenWidth - (contentPadding * 2);
  const cardHeight = isSmallScreen ? 400 : isMediumScreen ? 454 : 500;
  const imageSize = isSmallScreen ? 48 : 56;
  const headerFontSize = isSmallScreen ? 16 : isMediumScreen ? 18 : 20;
  const buttonHeight = isSmallScreen ? 44 : 48;
  const inputFontSize = isSmallScreen ? 14 : 16;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#121924" />
      <View style={styles.transactions}>
        {/* Header - NO BACK BUTTON */}
        <View style={styles.buyLeadsScreen}>
          <View style={styles.container2}>
            <View style={styles.heading}>
              <Text style={[styles.textWrapper4, { fontSize: headerFontSize }]}>
                Post a Requirement
              </Text>
            </View>
          </View>
        </View>

        {/* App Content */}
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: contentPadding }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.app}>
              <View style={styles.transactionHistory}>
                
                {/* MAIN INPUT CARD WITH RAINBOW BORDER - RESPONSIVE */}
                <LinearGradient
                  colors={RAINBOW_COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.rainbowCardBorder, { 
                    width: cardWidth,
                    height: cardHeight,
                  }]}
                >
                  <View style={styles.containerInner}>
                    {/* Top Bar - Attach Image */}
                    <View style={[styles.div, { 
                      height: imageSize + 14,
                      paddingLeft: isSmallScreen ? 6 : 8,
                    }]}>
                      <TouchableOpacity onPress={handleImagePicker} activeOpacity={0.7}>
                        {uploadedImage ? (
                          <View style={styles.imageContainer}>
                            <Image 
                              source={{ uri: uploadedImage.uri }} 
                              style={[styles.imageSquare, { 
                                height: imageSize, 
                                width: imageSize 
                              }]} 
                            />
                            <TouchableOpacity 
                              style={styles.cancelImageButton}
                              onPress={handleCancelImage}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons name="close" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={[styles.imageSquarePlaceholder, { 
                            height: imageSize, 
                            width: imageSize 
                          }]}>
                            <MaterialCommunityIcons 
                              name="image-outline" 
                              size={isSmallScreen ? 24 : 32} 
                              color="#8FA8CC" 
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                      <View style={styles.boldText}>
                        <Text style={[styles.textWrapper2, { fontSize: isSmallScreen ? 13 : 14 }]}>
                          {uploadedImage ? 'Image Attached' : 'Attach Image (Optional)'}
                        </Text>
                      </View>
                    </View>

                    {/* Text Area Wrapper - RESPONSIVE */}
                    <View style={[styles.textAreaWrapper, {
                      top: imageSize + 14,
                      height: cardHeight - (imageSize + 14) - (buttonHeight + 32),
                      padding: isSmallScreen ? 10 : 12,
                    }]}>
                      <View style={styles.textArea}>
                        <TextInput
                          style={[styles.textWrapper3, { 
                            fontSize: inputFontSize,
                            minHeight: cardHeight - (imageSize + 14) - (buttonHeight + 56),
                          }]}
                          placeholder="Type your message..."
                          placeholderTextColor="#61738D"
                          multiline
                          value={inputText}
                          onChangeText={setInputText}
                          textAlignVertical="top"
                        />
                      </View>
                    </View>

                    {/* Generate Button at Bottom - RESPONSIVE */}
                    <View style={[styles.frame, { 
                      padding: isSmallScreen ? 12 : 16 
                    }]}>
                      <View style={styles.buttonWrapper}>
                        <TouchableOpacity
                          style={[styles.primaryButton, { 
                            height: buttonHeight 
                          }, isGenerating && { opacity: 0.7 }]}
                          onPress={handleGenerate}
                          disabled={isGenerating}
                          activeOpacity={0.8}
                        >
                          {isGenerating ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={[styles.designComponentInstanceNode, { 
                              fontSize: inputFontSize 
                            }]}>
                              Generate
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Preview Modal - RESPONSIVE */}
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
              <View style={[styles.modalContent, { 
                maxHeight: screenHeight * 0.9,
                paddingHorizontal: contentPadding,
              }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { 
                    fontSize: isSmallScreen ? 20 : 22 
                  }]}>
                    Review Your Lead
                  </Text>
                  <Text style={[styles.modalSubtitle, { 
                    fontSize: isSmallScreen ? 13 : 14 
                  }]}>
                    Edit any field before posting
                  </Text>
                </View>
                
                <ScrollView 
                  style={styles.previewScroll} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.previewScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={[styles.leadCardPreview, { 
                    padding: isSmallScreen ? 12 : 16 
                  }]}>
                    {/* Title */}
                    <View style={[styles.titleSection, { 
                      padding: isSmallScreen ? 10 : 12 
                    }]}>
                      <Text style={styles.fieldLabel}>Title *</Text>
                      <TextInput
                        style={[styles.editableTitle, { 
                          fontSize: isSmallScreen ? 16 : 18 
                        }]}
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
                      <View style={[styles.locationRow, { 
                        padding: isSmallScreen ? 10 : 12 
                      }]}>
                        <MaterialCommunityIcons 
                          name="map-marker" 
                          size={isSmallScreen ? 16 : 18} 
                          color="#8FA8CC" 
                        />
                        <TextInput
                          style={[styles.editableField, { 
                            fontSize: isSmallScreen ? 14 : 15 
                          }]}
                          value={editableLocation}
                          onChangeText={setEditableLocation}
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
                          style={[styles.previewImage, { 
                            height: isSmallScreen ? 150 : 180 
                          }]} 
                          resizeMode="cover"
                        />
                      </View>
                    )}

                    {/* Quantity & Budget */}
                    <View style={styles.statsRow}>
                      <View style={[styles.statField, { 
                        padding: isSmallScreen ? 10 : 12 
                      }]}>
                        <Text style={styles.fieldLabel}>Quantity</Text>
                        <TextInput
                          style={[styles.editableStatInput, { 
                            fontSize: isSmallScreen ? 14 : 16 
                          }]}
                          value={editableQuantity}
                          onChangeText={setEditableQuantity}
                          placeholder="Ask Buyer"
                          placeholderTextColor="#8FA8CC"
                        />
                      </View>
                      
                      <View style={styles.statDivider} />
                      
                      <View style={[styles.statField, { 
                        padding: isSmallScreen ? 10 : 12 
                      }]}>
                        <Text style={styles.fieldLabel}>Budget</Text>
                        <TextInput
                          style={[styles.editableStatInput, { 
                            fontSize: isSmallScreen ? 14 : 16 
                          }]}
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
                        style={[styles.editableDescription, { 
                          fontSize: isSmallScreen ? 14 : 15,
                          padding: isSmallScreen ? 10 : 12,
                        }]}
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

                {/* Action Buttons - RESPONSIVE */}
                <View style={[styles.modalActions, { 
                  gap: isSmallScreen ? 8 : 12 
                }]}>
                  <TouchableOpacity 
                    style={[styles.doAgainButton, { 
                      height: buttonHeight 
                    }]} 
                    onPress={handleDoAgain}
                    disabled={isSubmitting}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons 
                      name="refresh" 
                      size={isSmallScreen ? 18 : 20} 
                      color="#8FA8CC" 
                    />
                    <Text style={[styles.doAgainButtonText, { 
                      fontSize: isSmallScreen ? 14 : 16 
                    }]}>
                      Do Again
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.submitButton, { 
                      height: buttonHeight 
                    }, isSubmitting && { opacity: 0.6 }]}
                    onPress={handleSubmitLead}
                    disabled={isSubmitting}
                    activeOpacity={0.7}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons 
                          name="send" 
                          size={isSmallScreen ? 18 : 20} 
                          color="#fff" 
                        />
                        <Text style={[styles.submitButtonText, { 
                          fontSize: isSmallScreen ? 14 : 16 
                        }]}>
                          Post Lead
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Success Modal - RESPONSIVE */}
        <Modal 
          visible={showSuccessModal} 
          animationType="fade" 
          transparent
        >
          <View style={styles.successModalOverlay}>
            <View style={[styles.successModalContent, {
              width: isSmallScreen ? '85%' : '90%',
              maxWidth: isLargeScreen ? 400 : 340,
              padding: isSmallScreen ? 24 : 32,
            }]}>
              <View style={[styles.successIconCircle, {
                width: isSmallScreen ? 70 : 80,
                height: isSmallScreen ? 70 : 80,
                borderRadius: isSmallScreen ? 35 : 40,
              }]}>
                <MaterialCommunityIcons 
                  name="check" 
                  size={isSmallScreen ? 40 : 48} 
                  color="#00C288" 
                />
              </View>
              <Text style={[styles.successTitle, { 
                fontSize: isSmallScreen ? 20 : 22 
              }]}>
                Lead Posted Successfully!
              </Text>
              <Text style={[styles.successMessage, { 
                fontSize: isSmallScreen ? 14 : 15 
              }]}>
                Your requirement has been posted and is now visible to sellers.
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121924',
  },
  transactions: {
    backgroundColor: '#020618',
    position: 'relative',
    width: '100%',
    flex: 1,
  },
  buyLeadsScreen: {
    alignItems: 'flex-start',
    backgroundColor: '#121924',
    borderBottomWidth: 1.18,
    borderBottomColor: '#354152',
    borderStyle: 'solid',
    height: 61,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
    justifyContent: 'center',
  },
  container2: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 28,
    width: '100%',
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
    textAlign: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 18,
    paddingBottom: 20,
  },
  app: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: 3,
    width: '100%',
  },
  transactionHistory: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  rainbowCardBorder: {
    borderRadius: 12,
    padding: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  containerInner: {
    flex: 1,
    backgroundColor: '#0F1723',
    borderRadius: 10.5,
    position: 'relative',
    overflow: 'hidden',
  },
  div: {
    alignItems: 'center',
    borderBottomWidth: 0.8,
    borderBottomColor: '#1c283c',
    borderStyle: 'solid',
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  imageContainer: {
    position: 'relative',
  },
  imageSquare: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0057D9',
  },
  imageSquarePlaceholder: {
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
  textAreaWrapper: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(29, 41, 61, 0.32)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    gap: 8,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  textArea: {
    alignItems: 'flex-start',
    flex: 1,
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
  },
  frame: {
    alignItems: 'flex-start',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F1723',
  },
  buttonWrapper: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#0057D9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#0057D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  designComponentInstanceNode: {
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSafeArea: {
    maxHeight: '90%',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#0F1723',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1,
  },
  modalHeader: {
    marginBottom: 16,
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
    
  },
  previewScrollContent: {
    paddingBottom: 8,
  },
  leadCardPreview: {
    backgroundColor: '#121924',
    borderRadius: 12,
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
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderTopColor: '#1c283c',
    backgroundColor: '#0F1723',
  },
  doAgainButton: {
    flex: 1,
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00C288',
  },
  successIconCircle: {
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