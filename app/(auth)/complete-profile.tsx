

// // app/(auth)/complete-profile.tsx - WITH AUTO-FILLED GST DATA

// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   TextInput, 
//   TouchableOpacity, 
//   StyleSheet,
//   SafeAreaView, 
//   ScrollView, 
//   ActivityIndicator,
//   Image,
//   Alert,
//   BackHandler,
//   Platform
// } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { useAuth } from '../../context/AuthContext';
// import * as ImagePicker from 'expo-image-picker';
// import { Ionicons } from '@expo/vector-icons';
// import { GSTData, formatGSTAddress, getCompanyNameFromGST, getUserNameFromGST } from '../../services/gstVerification';

// interface ImageAsset {
//   uri: string;
//   type: string;
//   name: string;
// }

// interface FormData {
//   companyName: string;
//   userName: string;
//   userPhoto: ImageAsset | null;
//   logo: ImageAsset | null;
//   coverImage: ImageAsset | null;
//   address: string;
//   description: string;
//   referredBy: string;
//   category: string;
// }

// const CompleteProfilePage = () => {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const { register } = useAuth();
  
//   const [formData, setFormData] = useState<FormData>({
//     companyName: '',
//     userName: '',
//     userPhoto: null,
//     logo: null,
//     coverImage: null,
//     address: '',
//     description: '',
//     referredBy: '',
//     category: ''
//   });
  
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [gstVerified, setGstVerified] = useState(false);
  
//   const phoneNumber = params.phoneNumber as string;
//   const otp = params.otp as string;
//   const gstNumber = params.gstNumber as string;
//   const gstDataString = params.gstData as string;

//   useEffect(() => {
//     if (!phoneNumber || !otp || !gstNumber) {
//       console.error('Missing required params:', { phoneNumber, otp, gstNumber });
//       router.replace('/(auth)/phone-entry');
//       return;
//     }

//     // Parse and populate GST data
//     if (gstDataString) {
//       try {
//         const gstData: GSTData = JSON.parse(gstDataString);
        
//         // Auto-fill form with GST data
//         const companyName = getCompanyNameFromGST(gstData);
//         const userName = getUserNameFromGST(gstData);
//         const address = formatGSTAddress(gstData);
        
//         setFormData(prev => ({
//           ...prev,
//           companyName: companyName,
//           userName: userName,
//           address: address,
//         }));
        
//         setGstVerified(true);
        
//         console.log('✅ GST Data Auto-filled:', {
//           companyName,
//           userName,
//           address: address.substring(0, 50) + '...',
//         });
        
//       } catch (err) {
//         console.error('Failed to parse GST data:', err);
//         Alert.alert(
//           'Error',
//           'Failed to load GST information. Please go back and try again.',
//           [
//             {
//               text: 'Go Back',
//               onPress: () => router.replace('/(auth)/gst-entry'),
//             }
//           ]
//         );
//       }
//     }
//   }, [phoneNumber, otp, gstNumber, gstDataString]);

//   useEffect(() => {
//     const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
//       return true;
//     });
//     return () => backHandler.remove();
//   }, []);

//   useEffect(() => {
//     (async () => {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert(
//           'Permission Required',
//           'Sorry, we need camera roll permissions to upload images.'
//         );
//       }
//     })();
//   }, []);

//   const handleInputChange = (name: keyof FormData, value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const pickImage = async (imageType: 'userPhoto' | 'logo' | 'coverImage') => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: imageType === 'coverImage' ? [16, 9] : [1, 1],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets[0]) {
//         const asset = result.assets[0];
//         const fileName = asset.fileName || `${imageType}_${Date.now()}.jpg`;
//         const mimeType = asset.mimeType || 'image/jpeg';

//         const imageAsset: ImageAsset = {
//           uri: asset.uri,
//           type: mimeType,
//           name: fileName,
//         };

//         setFormData(prev => ({
//           ...prev,
//           [imageType]: imageAsset
//         }));

//         console.log(`✅ ${imageType} selected:`, fileName);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     }
//   };

//   const removeImage = (imageType: 'userPhoto' | 'logo' | 'coverImage') => {
//     setFormData(prev => ({
//       ...prev,
//       [imageType]: null
//     }));
//   };

//   const validateForm = () => {
//     const { companyName, userName, address } = formData;
    
//     if (!companyName.trim()) {
//       setError('Company Name is required');
//       return false;
//     }
    
//     if (!userName.trim()) {
//       setError('Your Name is required');
//       return false;
//     }

//     if (!address.trim()) {
//       setError('Company Address is required');
//       return false;
//     }
    
//     return true;
//   };

//   const handleSubmit = async () => {
//     setError('');
    
//     if (!validateForm()) {
//       return;
//     }
    
//     setLoading(true);
    
//     try {
//       const registrationData = {
//         phoneNumber,
//         otp,
//         gstNumber,
//         companyName: formData.companyName.trim(),
//         userName: formData.userName.trim(),
//         userPhoto: formData.userPhoto,
//         logo: formData.logo,
//         coverImage: formData.coverImage,
//         address: formData.address.trim(),
//         description: formData.description.trim(),
//         referredBy: formData.referredBy.trim(),
//         category: formData.category.trim()
//       };

//       console.log('📤 Submitting registration with:', {
//         phoneNumber,
//         companyName: registrationData.companyName,
//         hasUserPhoto: !!registrationData.userPhoto,
//         hasLogo: !!registrationData.logo,
//         hasCoverImage: !!registrationData.coverImage,
//       });
      
//       await register(registrationData);
      
//       router.replace('/');
      
//     } catch (err) {
//       console.error('Registration error:', err);
//       setError((err as Error).message || 'Registration failed');
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.card}>
//           <View style={styles.header}>
//             <View style={styles.progressBar}>
//               <View style={[styles.progressStep, styles.progressStepActive]} />
//               <View style={[styles.progressStep, styles.progressStepActive]} />
//             </View>
//             <Text style={styles.title}>Complete Your Profile</Text>
//             <Text style={styles.subtitle}>
//               Set up your company profile to start networking
//             </Text>
            
//             {gstVerified && (
//               <View style={styles.verifiedBadge}>
//                 <Ionicons name="checkmark-circle" size={16} color="#059669" />
//                 <Text style={styles.verifiedText}>GST Verified</Text>
//               </View>
//             )}
//           </View>

//           {error ? (
//             <View style={styles.errorBox}>
//               <Text style={styles.errorText}>{error}</Text>
//             </View>
//           ) : null}

//           <View style={styles.formContainer}>
//             {/* Company Name - Auto-filled from GST */}
//             <View style={styles.inputGroup}>
//               <View style={styles.labelRow}>
//                 <Text style={styles.label}>Company Name *</Text>
//                 <View style={styles.autoFilledBadge}>
//                   <Ionicons name="shield-checkmark" size={12} color="#059669" />
//                   <Text style={styles.autoFilledText}>From GST</Text>
//                 </View>
//               </View>
//               <View style={styles.disabledInputContainer}>
//                 <TextInput
//                   style={[styles.input, styles.disabledInput]}
//                   value={formData.companyName}
//                   editable={false}
//                 />
//                 <Ionicons name="lock-closed" size={16} color="#9CA3AF" style={styles.lockIcon} />
//               </View>
//               <Text style={styles.hint}>Auto-filled from verified GST records</Text>
//             </View>

//             {/* Your Name - Auto-filled from GST */}
//             <View style={styles.inputGroup}>
//               <View style={styles.labelRow}>
//                 <Text style={styles.label}>Your Name *</Text>
//                 <View style={styles.autoFilledBadge}>
//                   <Ionicons name="shield-checkmark" size={12} color="#059669" />
//                   <Text style={styles.autoFilledText}>From GST</Text>
//                 </View>
//               </View>
//               <View style={styles.disabledInputContainer}>
//                 <TextInput
//                   style={[styles.input, styles.disabledInput]}
//                   value={formData.userName}
//                   editable={false}
//                 />
//                 <Ionicons name="lock-closed" size={16} color="#9CA3AF" style={styles.lockIcon} />
//               </View>
//               <Text style={styles.hint}>Auto-filled from verified GST records</Text>
//             </View>

//             {/* Profile Photo Upload */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Profile Photo</Text>
//               {formData.userPhoto ? (
//                 <View style={styles.imageContainer}>
//                   <Image 
//                     source={{ uri: formData.userPhoto.uri }} 
//                     style={styles.profileImage}
//                   />
//                   <View style={styles.imageActions}>
//                     <TouchableOpacity
//                       style={styles.changeImageButton}
//                       onPress={() => pickImage('userPhoto')}
//                       disabled={loading}
//                     >
//                       <Ionicons name="camera" size={16} color="#4C1D95" />
//                       <Text style={styles.changeImageText}>Change</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={styles.removeButton}
//                       onPress={() => removeImage('userPhoto')}
//                       disabled={loading}
//                     >
//                       <Ionicons name="trash-outline" size={16} color="#B91C1C" />
//                       <Text style={styles.removeText}>Remove</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               ) : (
//                 <TouchableOpacity
//                   style={styles.uploadBox}
//                   onPress={() => pickImage('userPhoto')}
//                   disabled={loading}
//                 >
//                   <View style={styles.uploadIconContainer}>
//                     <Ionicons name="person-add" size={40} color="#4C1D95" />
//                   </View>
//                   <Text style={styles.uploadTitle}>Upload Profile Photo</Text>
//                   <Text style={styles.uploadSubtitle}>Tap to choose from gallery</Text>
//                 </TouchableOpacity>
//               )}
//               <Text style={styles.hint}>Recommended: Square image, at least 400x400px</Text>
//             </View>

//             {/* Company Logo Upload */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Company Logo</Text>
//               {formData.logo ? (
//                 <View style={styles.imageContainer}>
//                   <Image 
//                     source={{ uri: formData.logo.uri }} 
//                     style={styles.profileImage}
//                   />
//                   <View style={styles.imageActions}>
//                     <TouchableOpacity
//                       style={styles.changeImageButton}
//                       onPress={() => pickImage('logo')}
//                       disabled={loading}
//                     >
//                       <Ionicons name="camera" size={16} color="#4C1D95" />
//                       <Text style={styles.changeImageText}>Change</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={styles.removeButton}
//                       onPress={() => removeImage('logo')}
//                       disabled={loading}
//                     >
//                       <Ionicons name="trash-outline" size={16} color="#B91C1C" />
//                       <Text style={styles.removeText}>Remove</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               ) : (
//                 <TouchableOpacity
//                   style={styles.uploadBox}
//                   onPress={() => pickImage('logo')}
//                   disabled={loading}
//                 >
//                   <View style={styles.uploadIconContainer}>
//                     <Ionicons name="business" size={40} color="#4C1D95" />
//                   </View>
//                   <Text style={styles.uploadTitle}>Upload Company Logo</Text>
//                   <Text style={styles.uploadSubtitle}>Tap to choose from gallery</Text>
//                 </TouchableOpacity>
//               )}
//               <Text style={styles.hint}>Recommended: Square image, at least 400x400px</Text>
//             </View>

//             {/* Cover Image Upload */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Cover Image</Text>
//               {formData.coverImage ? (
//                 <View style={styles.imageContainer}>
//                   <Image 
//                     source={{ uri: formData.coverImage.uri }} 
//                     style={styles.coverImage}
//                   />
//                   <View style={styles.imageActions}>
//                     <TouchableOpacity
//                       style={styles.changeImageButton}
//                       onPress={() => pickImage('coverImage')}
//                       disabled={loading}
//                     >
//                       <Ionicons name="camera" size={16} color="#4C1D95" />
//                       <Text style={styles.changeImageText}>Change</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={styles.removeButton}
//                       onPress={() => removeImage('coverImage')}
//                       disabled={loading}
//                     >
//                       <Ionicons name="trash-outline" size={16} color="#B91C1C" />
//                       <Text style={styles.removeText}>Remove</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               ) : (
//                 <TouchableOpacity
//                   style={[styles.uploadBox, styles.uploadBoxWide]}
//                   onPress={() => pickImage('coverImage')}
//                   disabled={loading}
//                 >
//                   <View style={styles.uploadIconContainer}>
//                     <Ionicons name="image" size={40} color="#4C1D95" />
//                   </View>
//                   <Text style={styles.uploadTitle}>Upload Cover Image</Text>
//                   <Text style={styles.uploadSubtitle}>Tap to choose from gallery</Text>
//                 </TouchableOpacity>
//               )}
//               <Text style={styles.hint}>Recommended: 1600x900px or 16:9 ratio</Text>
//             </View>

//             {/* Category */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Business Category</Text>
//               <TextInput
//                 style={styles.input}
//                 value={formData.category}
//                 onChangeText={(text) => handleInputChange('category', text)}
//                 placeholder="e.g., IT Services, Manufacturing"
//                 editable={!loading}
//               />
//             </View>

//             {/* Company Address - Auto-filled from GST */}
//             <View style={styles.inputGroup}>
//               <View style={styles.labelRow}>
//                 <Text style={styles.label}>Company Address *</Text>
//                 <View style={styles.autoFilledBadge}>
//                   <Ionicons name="shield-checkmark" size={12} color="#059669" />
//                   <Text style={styles.autoFilledText}>From GST</Text>
//                 </View>
//               </View>
//               <View style={styles.disabledInputContainer}>
//                 <TextInput
//                   style={[styles.input, styles.textArea, styles.disabledInput]}
//                   value={formData.address}
//                   multiline
//                   numberOfLines={3}
//                   textAlignVertical="top"
//                   editable={false}
//                 />
//                 <Ionicons name="lock-closed" size={16} color="#9CA3AF" style={[styles.lockIcon, styles.lockIconTextArea]} />
//               </View>
//               <Text style={styles.hint}>Auto-filled from verified GST records</Text>
//             </View>

//             {/* Company Description */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Company Description</Text>
//               <TextInput
//                 style={[styles.input, styles.textArea]}
//                 value={formData.description}
//                 onChangeText={(text) => handleInputChange('description', text)}
//                 placeholder="Brief description of your company and services"
//                 multiline
//                 numberOfLines={3}
//                 textAlignVertical="top"
//                 editable={!loading}
//               />
//             </View>

//             {/* Referral Code */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Referral Code (Optional)</Text>
//               <TextInput
//                 style={styles.input}
//                 value={formData.referredBy}
//                 onChangeText={(text) => handleInputChange('referredBy', text)}
//                 placeholder="BIZAP1234"
//                 autoCapitalize="characters"
//                 editable={!loading}
//               />
//               <Text style={styles.hint}>
//                 Enter a referral code to get bonus leads
//               </Text>
//             </View>

//             <TouchableOpacity
//               style={[styles.button, loading && styles.buttonDisabled]}
//               onPress={handleSubmit}
//               disabled={loading}
//               activeOpacity={0.7}
//             >
//               {loading ? (
//                 <ActivityIndicator color="#FFFFFF" />
//               ) : (
//                 <Text style={styles.buttonText}>Complete Registration</Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default CompleteProfilePage;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#6D28D9',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingVertical: 40,
//     paddingHorizontal: 20,
//     backgroundColor: 'transparent',
//   },
//   card: {
//     maxWidth: 700,
//     width: '100%',
//     alignSelf: 'center',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 8,
//   },
//   header: {
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   progressBar: {
//     flexDirection: 'row',
//     gap: 8,
//     marginBottom: 20,
//   },
//   progressStep: {
//     width: 40,
//     height: 4,
//     backgroundColor: '#E5E7EB',
//     borderRadius: 2,
//   },
//   progressStepActive: {
//     backgroundColor: '#4C1D95',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#4C1D95', 
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   verifiedBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     backgroundColor: '#D1FAE5',
//     borderRadius: 16,
//     marginTop: 8,
//   },
//   verifiedText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#059669',
//   },
//   errorBox: {
//     marginBottom: 25,
//     padding: 15,
//     backgroundColor: '#FEE2E2',
//     borderColor: '#F87171',
//     borderWidth: 1,
//     borderRadius: 8,
//   },
//   errorText: {
//     color: '#B91C1C',
//     fontSize: 14,
//     textAlign: 'center',
//   },
//   formContainer: {
//     gap: 20,
//   },
//   inputGroup: {
//     marginBottom: 0,
//   },
//   labelRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#374151',
//   },
//   autoFilledBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     backgroundColor: '#D1FAE5',
//     borderRadius: 12,
//   },
//   autoFilledText: {
//     fontSize: 10,
//     fontWeight: '600',
//     color: '#059669',
//   },
//   input: {
//     width: '100%',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     borderRadius: 8,
//     fontSize: 16,
//   },
//   disabledInputContainer: {
//     position: 'relative',
//   },
//   disabledInput: {
//     backgroundColor: '#F9FAFB',
//     color: '#6B7280',
//   },
//   lockIcon: {
//     position: 'absolute',
//     right: 16,
//     top: 14,
//   },
//   lockIconTextArea: {
//     top: 16,
//   },
//   textArea: {
//     minHeight: 100,
//   },
//   hint: {
//     fontSize: 12,
//     color: '#6B7280',
//     marginTop: 6,
//   },
//   uploadBox: {
//     width: '100%',
//     backgroundColor: '#F9FAFB',
//     borderWidth: 2,
//     borderColor: '#D1D5DB',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   uploadBoxWide: {
//     paddingVertical: 48,
//   },
//   uploadIconContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#EDE9FE',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   uploadTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#4C1D95',
//     marginBottom: 4,
//   },
//   uploadSubtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//   },
//   imageContainer: {
//     alignItems: 'center',
//   },
//   profileImage: {
//     width: 150,
//     height: 150,
//     borderRadius: 12,
//     borderWidth: 3,
//     borderColor: '#E5E7EB',
//   },
//   coverImage: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//     borderWidth: 3,
//     borderColor: '#E5E7EB',
//   },
//   imageActions: {
//     flexDirection: 'row',
//     marginTop: 12,
//     gap: 12,
//   },
//   changeImageButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     backgroundColor: '#EDE9FE',
//     borderRadius: 8,
//     gap: 6,
//   },
//   changeImageText: {
//     color: '#4C1D95',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   removeButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     backgroundColor: '#FEE2E2',
//     borderRadius: 8,
//     gap: 6,
//   },
//   removeText: {
//     color: '#B91C1C',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   button: {
//     width: '100%',
//     backgroundColor: '#4C1D95', 
//     padding: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 10,
//   },
//   buttonDisabled: {
//     opacity: 0.5,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// });





// app/(auth)/complete-profile.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  StatusBar
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { GSTData, formatGSTAddress, getCompanyNameFromGST, getUserNameFromGST } from '../../services/gstVerification';

interface ImageAsset {
  uri: string;
  type: string;
  name: string;
}

interface FormData {
  companyName: string;
  userName: string;
  userPhoto: ImageAsset | null;
  logo: ImageAsset | null;
  coverImage: ImageAsset | null;
  address: string;
  description: string;
  referredBy: string;
  category: string;
  gstNumber: string;
  pan: string; // Added PAN field shown in image
}

const CompleteProfilePage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { register } = useAuth();
  
  // --- State ---
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    userName: '',
    userPhoto: null,
    logo: null,
    coverImage: null,
    address: '',
    description: '',
    referredBy: '',
    category: '',
    gstNumber: '',
    pan: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  const phoneNumber = params.phoneNumber as string;
  const otp = params.otp as string;
  const paramGstNumber = params.gstNumber as string;
  const gstDataString = params.gstData as string;

  // --- Effects ---

  // 1. Data Parsing & Auto-fill
  useEffect(() => {
    if (!phoneNumber || !otp || !paramGstNumber) {
      console.error('Missing required params');
      router.replace('/(auth)/phone-entry');
      return;
    }

    if (gstDataString) {
      try {
        const gstData: GSTData = JSON.parse(gstDataString);
        
        const companyName = getCompanyNameFromGST(gstData);
        const userName = getUserNameFromGST(gstData);
        const address = formatGSTAddress(gstData);
        
        // Extract PAN from GST (usually characters 3-12 of GSTIN)
        const panNumber = paramGstNumber.substring(2, 12);

        setFormData(prev => ({
          ...prev,
          companyName: companyName,
          userName: userName,
          address: address,
          gstNumber: paramGstNumber,
          pan: panNumber
        }));
        
      } catch (err) {
        console.error('Failed to parse GST data:', err);
        Alert.alert('Error', 'Failed to load GST data. Please try again.');
      }
    }
  }, [phoneNumber, otp, paramGstNumber, gstDataString]);

  // 2. Hardware Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // --- Actions ---

  const pickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your gallery to upload a profile logo.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `logo_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';

        setFormData(prev => ({
          ...prev,
          logo: { uri: asset.uri, type: mimeType, name: fileName }
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleEditGST = () => {
    router.replace('/(auth)/gst-entry');
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Prepare registration data
      const registrationData = {
        phoneNumber,
        otp,
        gstNumber: formData.gstNumber,
        companyName: formData.companyName,
        userName: formData.userName,
        // Using same image for both user photo and logo for simplicity, or handle separately
        userPhoto: formData.logo, 
        logo: formData.logo,
        coverImage: null,
        address: formData.address,
        description: formData.description,
        referredBy: formData.referredBy,
        category: formData.category
      };

      console.log('📤 Submitting Registration');
      await register(registrationData);
      
      // Success - Navigate to Home/Dashboard
      router.replace('/');
      
    } catch (err: any) {
      console.error('Registration error:', err);
      Alert.alert('Registration Failed', err.message || 'Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
      
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleEditGST} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Details</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Profile Image Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {formData.logo ? (
              <Image 
                source={{ uri: formData.logo.uri }} 
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.placeholderAvatar}>
                 <Ionicons name="business" size={40} color="#FFFFFF" />
              </View>
            )}
            {/* Blue Glow Effect Border */}
            <View style={styles.avatarBorder} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.changeProfileText}>Change Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card Section */}
        <View style={styles.card}>
          
          {/* Company Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Company Name</Text>
            <Text style={styles.valueText}>{formData.companyName || 'Loading...'}</Text>
          </View>

          <View style={styles.divider} />

          {/* GST Number */}
          <View style={styles.row}>
            <Text style={styles.label}>GST Number</Text>
            <Text style={styles.valueTextRight}>{formData.gstNumber}</Text>
          </View>

          <View style={styles.divider} />

          {/* PAN Number */}
          <View style={styles.row}>
            <Text style={styles.label}>PAN</Text>
            <Text style={styles.valueTextRight}>{formData.pan || 'N/A'}</Text>
          </View>
          
          <View style={styles.divider} />

          {/* Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.valueText} numberOfLines={2}>
              {formData.address || 'Loading address...'}
            </Text>
          </View>

        </View>

        {/* Referral Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={formData.referredBy}
            onChangeText={(text) => setFormData(prev => ({ ...prev, referredBy: text }))}
            placeholder="Add referral code (if any)"
            placeholderTextColor="#6B7280"
            autoCapitalize="characters"
            editable={!loading}
          />
        </View>

      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Confirm & Finish</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleEditGST} style={styles.linkContainer}>
          <Text style={styles.footerLinkText}>
            Not your company? <Text style={styles.linkHighlight}>Edit GST number</Text>
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

export default CompleteProfilePage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0E11',
  },
  
  // Header
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for footer
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: 2,
  },
  placeholderAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1D21',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  avatarBorder: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#3B82F6', // Blue glow ring
    opacity: 0.6,
    zIndex: 1,
  },
  changeProfileText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },

  // Info Card
  card: {
    backgroundColor: '#16191D', // Slightly lighter dark card
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: '#9CA3AF', // Gray label
    marginBottom: 4,
  },
  valueText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  valueTextRight: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#2D333B', // Divider line
    marginVertical: 12,
  },

  // Referral Input
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 54,
    backgroundColor: '#16191D',
    borderRadius: 10,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#0B0E11', // Matches bg to cover content scrolling behind
    borderTopWidth: 1,
    borderTopColor: '#1A1D21',
  },
  button: {
    width: '100%',
    backgroundColor: '#005CE6', // Primary Blue
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linkContainer: {
    alignItems: 'center',
  },
  footerLinkText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  linkHighlight: {
    color: '#3B82F6',
    fontWeight: '500',
  },
});