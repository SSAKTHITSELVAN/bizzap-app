// // app/(auth)/complete-profile.tsx

// import { Ionicons } from '@expo/vector-icons';
// import { Image } from 'expo-image';
// import * as ImagePicker from 'expo-image-picker';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   BackHandler,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useAuth } from '../../context/AuthContext';
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
//   gstNumber: string;
//   pan: string;
// }

// const CompleteProfilePage = () => {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const { register } = useAuth();
//   const insets = useSafeAreaInsets();
//   const scrollViewRef = useRef<ScrollView>(null);
  
//   // --- State ---
//   const [formData, setFormData] = useState<FormData>({
//     companyName: '',
//     userName: '',
//     userPhoto: null,
//     logo: null,
//     coverImage: null,
//     address: '',
//     description: '',
//     referredBy: '',
//     category: '',
//     gstNumber: '',
//     pan: ''
//   });
  
//   const [loading, setLoading] = useState(false);
  
//   const phoneNumber = params.phoneNumber as string;
//   const otp = params.otp as string;
//   const paramGstNumber = params.gstNumber as string;
//   const gstDataString = params.gstData as string;

//   // --- Effects ---

//   useEffect(() => {
//     if (!phoneNumber || !otp || !paramGstNumber) {
//       console.error('Missing required params');
//       router.replace('/(auth)/phone-entry');
//       return;
//     }

//     if (gstDataString) {
//       try {
//         const gstData: GSTData = JSON.parse(gstDataString);
        
//         const companyName = getCompanyNameFromGST(gstData);
//         const userName = getUserNameFromGST(gstData);
//         const address = formatGSTAddress(gstData);
//         const panNumber = paramGstNumber.substring(2, 12);

//         setFormData(prev => ({
//           ...prev,
//           companyName: companyName,
//           userName: userName,
//           address: address,
//           gstNumber: paramGstNumber,
//           pan: panNumber
//         }));
        
//       } catch (err) {
//         console.error('Failed to parse GST data:', err);
//         Alert.alert('Error', 'Failed to load GST data. Please try again.');
//       }
//     }
//   }, [phoneNumber, otp, paramGstNumber, gstDataString]);

//   useEffect(() => {
//     const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
//       handleEditGST();
//       return true;
//     });
//     return () => backHandler.remove();
//   }, []);

//   // --- Actions ---

//   const pickImage = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Required', 'We need access to your gallery to upload a profile logo.');
//       return;
//     }

//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets[0]) {
//         const asset = result.assets[0];
//         const fileName = asset.fileName || `logo_${Date.now()}.jpg`;
//         const mimeType = asset.mimeType || 'image/jpeg';

//         setFormData(prev => ({
//           ...prev,
//           logo: { uri: asset.uri, type: mimeType, name: fileName }
//         }));
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//     }
//   };

//   const handleEditGST = () => {
//     router.replace('/(auth)/gst-entry');
//   };

//   const handleSubmit = async () => {
//     // Mandatory Image Check
//     if (!formData.logo) {
//         Alert.alert(
//             "Profile Picture Required", 
//             "Please upload a business logo or profile picture to continue.",
//             [{ text: "Select Image", onPress: pickImage }]
//         );
//         return;
//     }

//     setLoading(true);
    
//     try {
//       const registrationData = {
//         phoneNumber,
//         otp,
//         gstNumber: formData.gstNumber,
//         companyName: formData.companyName,
//         userName: formData.userName,
//         userPhoto: formData.logo, 
//         logo: formData.logo,
//         coverImage: null,
//         address: formData.address,
//         description: formData.description,
//         referredBy: formData.referredBy,
//         category: formData.category
//       };

//       await register(registrationData);
//       router.replace('/');
      
//     } catch (err: any) {
//       console.error('Registration error:', err);
//       Alert.alert('Registration Failed', err.message || 'Please try again.');
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
      
//       {/* Header with Dynamic Safe Area Padding */}
//       <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) }]}>
//           <TouchableOpacity onPress={handleEditGST} style={styles.backButton}>
//               <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Business Details</Text>
//           <View style={{ width: 24 }} /> 
//       </View>

//       <KeyboardAvoidingView 
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardContainer}
//       >
//         <ScrollView 
//             ref={scrollViewRef}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//         >
//             {/* Profile Image Section */}
//             <View style={styles.profileSection}>
//               <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
//                   {formData.logo ? (
//                   <Image 
//                       source={{ uri: formData.logo.uri }} 
//                       style={styles.avatar}
//                       contentFit="cover"
//                   />
//                   ) : (
//                   <View style={styles.placeholderAvatar}>
//                       <Ionicons name="business" size={40} color="#FFFFFF" />
//                   </View>
//                   )}
//                   <View style={styles.avatarBorder} />
//                   <View style={styles.editIconBadge}>
//                       <Ionicons name="camera" size={14} color="#FFF" />
//                   </View>
//               </TouchableOpacity>
              
//               <TouchableOpacity onPress={pickImage}>
//                   <Text style={styles.changeProfileText}>Change Profile *</Text>
//               </TouchableOpacity>
//             </View>

//             {/* Info Card Section */}
//             <View style={styles.card}>
//               <View style={styles.fieldGroup}>
//                   <Text style={styles.label}>Company Name</Text>
//                   <Text style={styles.valueText}>{formData.companyName || 'Loading...'}</Text>
//               </View>
//               <View style={styles.divider} />
//               <View style={styles.row}>
//                   <Text style={styles.label}>GST Number</Text>
//                   <Text style={styles.valueTextRight}>{formData.gstNumber}</Text>
//               </View>
//               <View style={styles.divider} />
//               <View style={styles.row}>
//                   <Text style={styles.label}>PAN</Text>
//                   <Text style={styles.valueTextRight}>{formData.pan || 'N/A'}</Text>
//               </View>
//               <View style={styles.divider} />
//               <View style={styles.fieldGroup}>
//                   <Text style={styles.label}>Address</Text>
//                   <Text style={styles.valueText} numberOfLines={2}>
//                   {formData.address || 'Loading address...'}
//                   </Text>
//               </View>
//             </View>

//             {/* Referral Input */}
//             <View style={styles.inputContainer}>
//               <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
//               <TextInput
//                   style={styles.input}
//                   value={formData.referredBy}
//                   onChangeText={(text) => setFormData(prev => ({ ...prev, referredBy: text }))}
//                   placeholder="Enter code"
//                   placeholderTextColor="#6B7280"
//                   autoCapitalize="characters"
//                   editable={!loading}
//                   onFocus={() => {
//                       setTimeout(() => {
//                           scrollViewRef.current?.scrollToEnd({ animated: true });
//                       }, 100);
//                   }}
//               />
//             </View>
//         </ScrollView>

//         {/* Footer Actions - Inside KeyboardAvoidingView to push up */}
//         <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
//             <TouchableOpacity
//               style={[styles.button, loading && styles.buttonDisabled]}
//               onPress={handleSubmit}
//               disabled={loading}
//               activeOpacity={0.8}
//             >
//               {loading ? (
//                   <ActivityIndicator color="#FFFFFF" />
//               ) : (
//                   <Text style={styles.buttonText}>Confirm & Finish</Text>
//               )}
//             </TouchableOpacity>

//             <TouchableOpacity onPress={handleEditGST} style={styles.linkContainer}>
//               <Text style={styles.footerLinkText}>
//                   Not your company? <Text style={styles.linkHighlight}>Edit GST number</Text>
//               </Text>
//             </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </View>
//   );
// };

// export default CompleteProfilePage;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#0B0E11',
//   },
//   keyboardContainer: {
//     flex: 1,
//   },
//   topBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingBottom: 10,
//     backgroundColor: '#0B0E11',
//   },
//   backButton: {
//     padding: 4,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//     flexGrow: 1,
//   },
//   profileSection: {
//     alignItems: 'center',
//     marginVertical: 20,
//   },
//   avatarContainer: {
//     width: 100,
//     height: 100,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     zIndex: 2,
//   },
//   placeholderAvatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#1A1D21',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   avatarBorder: {
//     position: 'absolute',
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     borderWidth: 1.5,
//     borderColor: '#3B82F6',
//     opacity: 0.6,
//     zIndex: 1,
//   },
//   editIconBadge: {
//     position: 'absolute',
//     bottom: 10,
//     right: 10,
//     backgroundColor: '#3B82F6',
//     borderRadius: 12,
//     width: 24,
//     height: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 3,
//     borderWidth: 2,
//     borderColor: '#0B0E11'
//   },
//   changeProfileText: {
//     color: '#3B82F6',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   card: {
//     backgroundColor: '#16191D',
//     borderRadius: 12,
//     padding: 20,
//     marginBottom: 20,
//   },
//   fieldGroup: { marginBottom: 10 },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   label: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
//   valueText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
//   valueTextRight: { fontSize: 15, color: '#FFFFFF', fontWeight: '500' },
//   divider: { height: 1, backgroundColor: '#2D333B', marginVertical: 12 },
//   inputContainer: { marginBottom: 20 },
//   inputLabel: { fontSize: 14, color: '#E5E7EB', marginBottom: 8, marginLeft: 4 },
//   input: {
//     height: 54,
//     backgroundColor: '#16191D',
//     borderRadius: 10,
//     paddingHorizontal: 16,
//     color: '#FFFFFF',
//     fontSize: 14,
//     borderWidth: 1,
//     borderColor: '#2D333B',
//   },
//   footer: {
//     padding: 20,
//     backgroundColor: '#0B0E11',
//     borderTopWidth: 1,
//     borderTopColor: '#1A1D21',
//   },
//   button: {
//     width: '100%',
//     backgroundColor: '#005CE6',
//     height: 52,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   buttonDisabled: { opacity: 0.6 },
//   buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
//   linkContainer: { alignItems: 'center' },
//   footerLinkText: { color: '#9CA3AF', fontSize: 13 },
//   linkHighlight: { color: '#3B82F6', fontWeight: '500' },
// });


// app/(auth)/complete-profile.tsx

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
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
  pan: string;
}

const CompleteProfilePage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
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

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEditGST();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // --- Actions ---

  const pickImage = async () => {
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
    
    // Auto-generate random logo if not provided
    let finalLogo = formData.logo;
    
    if (!finalLogo) {
      // Use UI Avatars to generate a professional-looking "random" logo based on company name
      const seedName = formData.companyName || 'Business';
      const randomAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(seedName)}&background=random&color=fff&size=512&bold=true`;
      
      finalLogo = {
        uri: randomAvatarUrl,
        type: 'image/png',
        name: 'default_logo.png'
      };
    }

    try {
      const registrationData = {
        phoneNumber,
        otp,
        gstNumber: formData.gstNumber,
        companyName: formData.companyName,
        userName: formData.userName,
        userPhoto: finalLogo, // Use the final logo (picked or generated)
        logo: finalLogo,      // Use the final logo
        coverImage: null,
        address: formData.address,
        description: formData.description,
        referredBy: formData.referredBy,
        category: formData.category
      };

      console.log('📤 Submitting Registration');
      await register(registrationData);
      
      router.replace('/');
      
    } catch (err: any) {
      console.error('Registration error:', err);
      Alert.alert('Registration Failed', err.message || 'Please try again.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
      
      {/* Header with Dynamic Safe Area Padding */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) }]}>
          <TouchableOpacity onPress={handleEditGST} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Details</Text>
          <View style={{ width: 24 }} /> 
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
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
                  <View style={styles.avatarBorder} />
                  <View style={styles.editIconBadge}>
                      <Ionicons name="camera" size={14} color="#FFF" />
                  </View>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={pickImage}>
                  <Text style={styles.changeProfileText}>Change Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Info Card Section */}
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Company Name</Text>
                  <Text style={styles.valueText}>{formData.companyName || 'Loading...'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                  <Text style={styles.label}>GST Number</Text>
                  <Text style={styles.valueTextRight}>{formData.gstNumber}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                  <Text style={styles.label}>PAN</Text>
                  <Text style={styles.valueTextRight}>{formData.pan || 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={styles.valueText} numberOfLines={2}>
                  {formData.address || 'Loading address...'}
                  </Text>
              </View>
            </View>

            {/* Referral Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
              <TextInput
                  style={styles.input}
                  value={formData.referredBy}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, referredBy: text }))}
                  placeholder="Enter code"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="characters"
                  editable={!loading}
                  onFocus={() => {
                      setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                  }}
              />
            </View>
        </ScrollView>

        {/* Footer Actions - Inside KeyboardAvoidingView to push up */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
      </KeyboardAvoidingView>
    </View>
  );
};

export default CompleteProfilePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E11',
  },
  keyboardContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#0B0E11',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
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
    borderColor: '#3B82F6',
    opacity: 0.6,
    zIndex: 1,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    borderWidth: 2,
    borderColor: '#0B0E11'
  },
  changeProfileText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#16191D',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  fieldGroup: { marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  valueText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
  valueTextRight: { fontSize: 15, color: '#FFFFFF', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#2D333B', marginVertical: 12 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, color: '#E5E7EB', marginBottom: 8, marginLeft: 4 },
  input: {
    height: 54,
    backgroundColor: '#16191D',
    borderRadius: 10,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2D333B',
  },
  footer: {
    padding: 20,
    backgroundColor: '#0B0E11',
    borderTopWidth: 1,
    borderTopColor: '#1A1D21',
  },
  button: {
    width: '100%',
    backgroundColor: '#005CE6',
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  linkContainer: { alignItems: 'center' },
  footerLinkText: { color: '#9CA3AF', fontSize: 13 },
  linkHighlight: { color: '#3B82F6', fontWeight: '500' },
});