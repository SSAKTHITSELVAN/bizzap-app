// app/(auth)/gst-entry.tsx - UPDATED for new API

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
  Alert,
  StatusBar,
  Keyboard
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyGSTNumber } from '../../services/gstVerification';
import { Ionicons } from '@expo/vector-icons';

const GstEntryPage = () => {
  const [gstNumber, setGstNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string;
  const otp = params.otp as string;

  // --- Effects ---
  
  // Validate params
  useEffect(() => {
    if (!phoneNumber || !otp) {
      console.error('Missing required params:', { phoneNumber, otp });
      router.replace('/(auth)/phone-entry');
    }
  }, [phoneNumber, otp]);

  // Prevent Hardware Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; 
    });
    return () => backHandler.remove();
  }, []);

  // --- Logic ---

  // GST regex - Accepts all valid GSTIN formats
  // Format: 06AACCG0527D1Z8 or 35AADCD4946L1CO
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[A-Z]{1}[A-Z0-9]{1}$/;

  const handleGstChange = (text: string) => {
    // Auto-capitalize input
    setGstNumber(text.toUpperCase());
    setError('');
  };

  const handleFetchDetails = async () => {
    setError('');
    Keyboard.dismiss();
    
    if (!gstNumber.trim()) {
      setError('GST Number is required');
      return;
    }
    
    const upperGST = gstNumber.toUpperCase().trim();
    if (!gstRegex.test(upperGST)) {
      setError('Please enter a valid 15-digit GST number');
      return;
    }

    setLoading(true);

    try {
      // Verify GST with internal API
      const result = await verifyGSTNumber(upperGST);
      
      // Check if request was successful
      if (result.statusCode !== 200 || result.status !== 'success' || !result.data) {
        setLoading(false);
        setError(result.message || 'Invalid GST Number. Please check and try again.');
        Alert.alert('Verification Failed', result.errors || result.message || 'Could not verify GST number.');
        return;
      }

      // Check Active Status
      if (result.data.sts !== 'Active') {
        setLoading(false);
        setError('This GST number is not active');
        Alert.alert('Inactive Business', 'The GST number entered is currently inactive.');
        return;
      }

      // Success! Navigate to profile completion
      console.log('✅ GST Verified');
      
      router.replace({
        pathname: '/(auth)/complete-profile',
        params: {
          phoneNumber,
          otp,
          gstNumber: upperGST,
          gstData: JSON.stringify(result.data),
        }
      });
      
    } catch (err: any) {
      console.error('GST Verification Error:', err);
      setError('Failed to verify GST. Please try again.');
      Alert.alert('Error', err.message || 'Failed to verify GST. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header (Back Arrow + Title) */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/phone-entry')} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GST Number</Text>
          <View style={{ width: 24 }} /> 
        </View>

        <View style={styles.contentContainer}>
          
          {/* GST Logo Illustration */}
          <View style={styles.logoContainer}>
             <Image 
               source={{ uri: "https://image2url.com/images/1765428960732-cd2e3e5e-9d7f-44b8-a152-7d8b71d21f75.png" }}
               style={styles.logo}
               contentFit="contain"
               transition={500}
             />
          </View>

          {/* Texts */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Enter your GST number</Text>
            <Text style={styles.subtitle}>
              We'll auto-fill your business details from the GST database.
            </Text>
          </View>

          {/* Input Field */}
          <View style={styles.inputWrapper}>
             <TextInput
               style={[styles.input, error ? styles.inputError : null]}
               value={gstNumber}
               onChangeText={handleGstChange}
               placeholder="e.g., 27AAEPM1234C1Z5"
               placeholderTextColor="#6B7280"
               autoCapitalize="characters"
               maxLength={15}
               autoCorrect={false}
               editable={!loading}
             />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

        </View>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, (loading || !gstNumber.trim()) && styles.buttonDisabled]}
            onPress={handleFetchDetails}
            disabled={loading || !gstNumber.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Fetch Details</Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GstEntryPage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0E11',
  },
  container: {
    flex: 1,
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

  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  // Logo
  logoContainer: {
    height: 180,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  logo: {
    width: 200,
    height: 140,
  },

  // Texts
  textSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  // Input
  inputWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#1A1D21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#EF4444',
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },

  // Footer
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 24,
    width: '100%',
  },
  button: {
    width: '100%',
    backgroundColor: '#005CE6',
    height: 54,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: '#1E293B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});