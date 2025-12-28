// // app/(auth)/complete-profile.tsx

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
//   Alert,
//   BackHandler,
//   Platform,
//   StatusBar
// } from 'react-native';
// import { Image } from 'expo-image';
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
//   gstNumber: string;
//   pan: string; // Added PAN field shown in image
// }

// const CompleteProfilePage = () => {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const { register } = useAuth();
  
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

//   // 1. Data Parsing & Auto-fill
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
        
//         // Extract PAN from GST (usually characters 3-12 of GSTIN)
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

//   // 2. Hardware Back Button
//   useEffect(() => {
//     const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
//       return true;
//     });
//     return () => backHandler.remove();
//   }, []);

//   // --- Actions ---

//   const pickImage = async () => {
//     // Request permission first
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
//     setLoading(true);
    
//     try {
//       // Prepare registration data
//       const registrationData = {
//         phoneNumber,
//         otp,
//         gstNumber: formData.gstNumber,
//         companyName: formData.companyName,
//         userName: formData.userName,
//         // Using same image for both user photo and logo for simplicity, or handle separately
//         userPhoto: formData.logo, 
//         logo: formData.logo,
//         coverImage: null,
//         address: formData.address,
//         description: formData.description,
//         referredBy: formData.referredBy,
//         category: formData.category
//       };

//       console.log('📤 Submitting Registration');
//       await register(registrationData);
      
//       // Success - Navigate to Home/Dashboard
//       router.replace('/');
      
//     } catch (err: any) {
//       console.error('Registration error:', err);
//       Alert.alert('Registration Failed', err.message || 'Please try again.');
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
      
//       {/* Header */}
//       <View style={styles.topBar}>
//         <TouchableOpacity onPress={handleEditGST} style={styles.backButton}>
//            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Business Details</Text>
//         <View style={{ width: 24 }} /> 
//       </View>

//       <ScrollView contentContainerStyle={styles.scrollContainer}>
        
//         {/* Profile Image Section */}
//         <View style={styles.profileSection}>
//           <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
//             {formData.logo ? (
//               <Image 
//                 source={{ uri: formData.logo.uri }} 
//                 style={styles.avatar}
//                 contentFit="cover"
//               />
//             ) : (
//               <View style={styles.placeholderAvatar}>
//                  <Ionicons name="business" size={40} color="#FFFFFF" />
//               </View>
//             )}
//             {/* Blue Glow Effect Border */}
//             <View style={styles.avatarBorder} />
//           </TouchableOpacity>
          
//           <TouchableOpacity onPress={pickImage}>
//             <Text style={styles.changeProfileText}>Change Profile</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Info Card Section */}
//         <View style={styles.card}>
          
//           {/* Company Name */}
//           <View style={styles.fieldGroup}>
//             <Text style={styles.label}>Company Name</Text>
//             <Text style={styles.valueText}>{formData.companyName || 'Loading...'}</Text>
//           </View>

//           <View style={styles.divider} />

//           {/* GST Number */}
//           <View style={styles.row}>
//             <Text style={styles.label}>GST Number</Text>
//             <Text style={styles.valueTextRight}>{formData.gstNumber}</Text>
//           </View>

//           <View style={styles.divider} />

//           {/* PAN Number */}
//           <View style={styles.row}>
//             <Text style={styles.label}>PAN</Text>
//             <Text style={styles.valueTextRight}>{formData.pan || 'N/A'}</Text>
//           </View>
          
//           <View style={styles.divider} />

//           {/* Address */}
//           <View style={styles.fieldGroup}>
//             <Text style={styles.label}>Address</Text>
//             <Text style={styles.valueText} numberOfLines={2}>
//               {formData.address || 'Loading address...'}
//             </Text>
//           </View>

//         </View>

//         {/* Referral Input */}
//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.input}
//             value={formData.referredBy}
//             onChangeText={(text) => setFormData(prev => ({ ...prev, referredBy: text }))}
//             placeholder="Add referral code (if any)"
//             placeholderTextColor="#6B7280"
//             autoCapitalize="characters"
//             editable={!loading}
//           />
//         </View>

//       </ScrollView>

//       {/* Footer Actions */}
//       <View style={styles.footer}>
//         <TouchableOpacity
//           style={[styles.button, loading && styles.buttonDisabled]}
//           onPress={handleSubmit}
//           disabled={loading}
//           activeOpacity={0.8}
//         >
//           {loading ? (
//             <ActivityIndicator color="#FFFFFF" />
//           ) : (
//             <Text style={styles.buttonText}>Confirm & Finish</Text>
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity onPress={handleEditGST} style={styles.linkContainer}>
//           <Text style={styles.footerLinkText}>
//             Not your company? <Text style={styles.linkHighlight}>Edit GST number</Text>
//           </Text>
//         </TouchableOpacity>
//       </View>

//     </SafeAreaView>
//   );
// };

// export default CompleteProfilePage;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#0B0E11',
//   },
  
//   // Header
//   topBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 10,
//     marginBottom: 10,
//   },
//   backButton: {
//     padding: 4,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },

//   scrollContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 100, // Space for footer
//   },

//   // Profile Section
//   profileSection: {
//     alignItems: 'center',
//     marginVertical: 30,
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
//     borderColor: '#3B82F6', // Blue glow ring
//     opacity: 0.6,
//     zIndex: 1,
//   },
//   changeProfileText: {
//     color: '#3B82F6',
//     fontSize: 14,
//     fontWeight: '500',
//   },

//   // Info Card
//   card: {
//     backgroundColor: '#16191D', // Slightly lighter dark card
//     borderRadius: 12,
//     padding: 20,
//     marginBottom: 20,
//   },
//   fieldGroup: {
//     marginBottom: 10,
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   label: {
//     fontSize: 13,
//     color: '#9CA3AF', // Gray label
//     marginBottom: 4,
//   },
//   valueText: {
//     fontSize: 16,
//     color: '#FFFFFF',
//     fontWeight: '600',
//   },
//   valueTextRight: {
//     fontSize: 15,
//     color: '#FFFFFF',
//     fontWeight: '500',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#2D333B', // Divider line
//     marginVertical: 12,
//   },

//   // Referral Input
//   inputContainer: {
//     marginBottom: 20,
//   },
//   input: {
//     height: 54,
//     backgroundColor: '#16191D',
//     borderRadius: 10,
//     paddingHorizontal: 16,
//     color: '#FFFFFF',
//     fontSize: 14,
//   },

//   // Footer
//   footer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: 20,
//     backgroundColor: '#0B0E11', // Matches bg to cover content scrolling behind
//     borderTopWidth: 1,
//     borderTopColor: '#1A1D21',
//   },
//   button: {
//     width: '100%',
//     backgroundColor: '#005CE6', // Primary Blue
//     height: 52,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   linkContainer: {
//     alignItems: 'center',
//   },
//   footerLinkText: {
//     color: '#9CA3AF',
//     fontSize: 13,
//   },
//   linkHighlight: {
//     color: '#3B82F6',
//     fontWeight: '500',
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
  pan: string;
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
          companyName: companyName.toUpperCase(),
          userName: userName.toUpperCase(),
          address: address.toUpperCase(),
          gstNumber: paramGstNumber.toUpperCase(),
          pan: panNumber.toUpperCase()
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