// app/(auth)/complete-profile.tsx - FIXED IMAGE UPLOAD

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
  Image,
  Alert,
  BackHandler,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

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
}

const CompleteProfilePage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    userName: '',
    userPhoto: null,
    logo: null,
    coverImage: null,
    address: '',
    description: '',
    referredBy: '',
    category: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const phoneNumber = params.phoneNumber as string;
  const otp = params.otp as string;
  const gstNumber = params.gstNumber as string;

  useEffect(() => {
    if (!phoneNumber || !otp || !gstNumber) {
      console.error('Missing required params:', { phoneNumber, otp, gstNumber });
      router.replace('/(auth)/phone-entry');
    }
  }, [phoneNumber, otp, gstNumber]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload images.'
        );
      }
    })();
  }, []);

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Convert blob URI to File object for web
  const uriToFile = async (uri: string, fileName: string, mimeType: string): Promise<File | null> => {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new File([blob], fileName, { type: mimeType });
      }
      return null;
    } catch (error) {
      console.error('Error converting URI to File:', error);
      return null;
    }
  };

  const pickImage = async (imageType: 'userPhoto' | 'logo' | 'coverImage') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: imageType === 'coverImage' ? [16, 9] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `${imageType}_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';
        
        // For web, convert to File object
        // const file = Platform.OS === 'web' 
        //   ? await uriToFile(asset.uri, fileName, mimeType)
        //   : null;

        const imageAsset: ImageAsset = {
          uri: asset.uri,
          type: mimeType,
          name: fileName,
        };

        setFormData(prev => ({
          ...prev,
          [imageType]: imageAsset
        }));

        console.log(`✅ ${imageType} selected:`, fileName);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (imageType: 'userPhoto' | 'logo' | 'coverImage') => {
    setFormData(prev => ({
      ...prev,
      [imageType]: null
    }));
  };

  const validateForm = () => {
    const { companyName, userName } = formData;
    
    if (!companyName.trim()) {
      setError('Company Name is required');
      return false;
    }
    
    if (!userName.trim()) {
      setError('Your Name is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert image objects to proper format for FormData
      const registrationData = {
        phoneNumber,
        otp,
        gstNumber,
        companyName: formData.companyName.trim(),
        userName: formData.userName.trim(),
        // Pass the image assets directly - they'll be formatted in auth.ts
        userPhoto: formData.userPhoto,
        logo: formData.logo,
        coverImage: formData.coverImage,
        address: formData.address.trim(),
        description: formData.description.trim(),
        referredBy: formData.referredBy.trim(),
        category: formData.category.trim()
      };

      console.log('📤 Submitting registration with:', {
        phoneNumber,
        companyName: registrationData.companyName,
        hasUserPhoto: !!registrationData.userPhoto,
        hasLogo: !!registrationData.logo,
        hasCoverImage: !!registrationData.coverImage,
      });
      
      await register(registrationData);
      
      router.replace('/');
      
    } catch (err) {
      console.error('Registration error:', err);
      setError((err as Error).message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.progressBar}>
              <View style={[styles.progressStep, styles.progressStepActive]} />
              <View style={[styles.progressStep, styles.progressStepActive]} />
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Set up your company profile to start networking
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            {/* Company Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.companyName}
                onChangeText={(text) => handleInputChange('companyName', text)}
                placeholder="Your Company Name"
                editable={!loading}
              />
            </View>

            {/* Your Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.userName}
                onChangeText={(text) => handleInputChange('userName', text)}
                placeholder="Your Full Name"
                editable={!loading}
              />
            </View>

            {/* Profile Photo Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Photo</Text>
              {formData.userPhoto ? (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: formData.userPhoto.uri }} 
                    style={styles.profileImage}
                  />
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={() => pickImage('userPhoto')}
                      disabled={loading}
                    >
                      <Ionicons name="camera" size={16} color="#4C1D95" />
                      <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage('userPhoto')}
                      disabled={loading}
                    >
                      <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={() => pickImage('userPhoto')}
                  disabled={loading}
                >
                  <View style={styles.uploadIconContainer}>
                    <Ionicons name="person-add" size={40} color="#4C1D95" />
                  </View>
                  <Text style={styles.uploadTitle}>Upload Profile Photo</Text>
                  <Text style={styles.uploadSubtitle}>Tap to choose from gallery</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.hint}>Recommended: Square image, at least 400x400px</Text>
            </View>

            {/* Company Logo Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Logo</Text>
              {formData.logo ? (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: formData.logo.uri }} 
                    style={styles.profileImage}
                  />
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={() => pickImage('logo')}
                      disabled={loading}
                    >
                      <Ionicons name="camera" size={16} color="#4C1D95" />
                      <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage('logo')}
                      disabled={loading}
                    >
                      <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={() => pickImage('logo')}
                  disabled={loading}
                >
                  <View style={styles.uploadIconContainer}>
                    <Ionicons name="business" size={40} color="#4C1D95" />
                  </View>
                  <Text style={styles.uploadTitle}>Upload Company Logo</Text>
                  <Text style={styles.uploadSubtitle}>Tap to choose from gallery</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.hint}>Recommended: Square image, at least 400x400px</Text>
            </View>

            {/* Cover Image Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cover Image</Text>
              {formData.coverImage ? (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: formData.coverImage.uri }} 
                    style={styles.coverImage}
                  />
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={() => pickImage('coverImage')}
                      disabled={loading}
                    >
                      <Ionicons name="camera" size={16} color="#4C1D95" />
                      <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage('coverImage')}
                      disabled={loading}
                    >
                      <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadBox, styles.uploadBoxWide]}
                  onPress={() => pickImage('coverImage')}
                  disabled={loading}
                >
                  <View style={styles.uploadIconContainer}>
                    <Ionicons name="image" size={40} color="#4C1D95" />
                  </View>
                  <Text style={styles.uploadTitle}>Upload Cover Image</Text>
                  <Text style={styles.uploadSubtitle}>Tap to choose from gallery</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.hint}>Recommended: 1600x900px or 16:9 ratio</Text>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Category</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => handleInputChange('category', text)}
                placeholder="e.g., IT Services, Manufacturing"
                editable={!loading}
              />
            </View>

            {/* Company Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => handleInputChange('address', text)}
                placeholder="Enter your company address"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Company Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Brief description of your company and services"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Referral Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Referral Code (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.referredBy}
                onChangeText={(text) => handleInputChange('referredBy', text)}
                placeholder="BIZAP1234"
                autoCapitalize="characters"
                editable={!loading}
              />
              <Text style={styles.hint}>
                Enter a referral code to get bonus leads
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Complete Registration</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CompleteProfilePage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6D28D9',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  card: {
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  progressStep: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#4C1D95',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4C1D95', 
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorBox: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  uploadBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxWide: {
    paddingVertical: 48,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C1D95',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  imageContainer: {
    alignItems: 'center',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  imageActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    gap: 6,
  },
  changeImageText: {
    color: '#4C1D95',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    gap: 6,
  },
  removeText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    backgroundColor: '#4C1D95', 
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});