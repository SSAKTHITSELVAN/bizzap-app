// app/(auth)/gst-entry.tsx
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
  Keyboard,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyGSTNumber } from '../../services/gstVerification';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GstEntryPage = () => {
  const [gstNumber, setGstNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string;
  const otp = params.otp as string;

  useEffect(() => {
    if (!phoneNumber || !otp) {
      router.replace('/(auth)/phone-entry');
    }
  }, [phoneNumber, otp]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  // Regex to validate GST Format
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[A-Z]{1}[A-Z0-9]{1}$/;

  const handleGstChange = (text: string) => {
    // Force uppercase
    const upperText = text.toUpperCase();
    setGstNumber(upperText);
    
    // Clear error if user starts typing
    if (error) setError('');
  };

  const handleFetchDetails = async () => {
    setError('');
    Keyboard.dismiss();
    
    // Double check before API call (though button is disabled otherwise)
    if (!gstNumber.trim()) {
      setError('GST Number is required');
      return;
    }
    
    if (!gstRegex.test(gstNumber)) {
      setError('Please enter a valid 15-digit GST number');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyGSTNumber(gstNumber);
      
      if (result.statusCode !== 200 || result.status !== 'success' || !result.data) {
        setLoading(false);
        setError(result.message || 'Invalid GST Number.');
        return;
      }

      if (result.data.sts !== 'Active') {
        setLoading(false);
        setError('This GST number is not active');
        return;
      }

      router.replace({
        pathname: '/(auth)/complete-profile',
        params: {
          phoneNumber,
          otp,
          gstNumber: gstNumber,
          gstData: JSON.stringify(result.data),
        }
      });
      
    } catch (err: any) {
      setError('Failed to verify GST. Please try again.');
      setLoading(false);
    }
  };

  // Check validity for button state
  const isValidGst = gstRegex.test(gstNumber);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/phone-entry')} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GST Number</Text>
          <View style={{ width: 24 }} /> 
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.logoContainer}>
             <Image 
               source={{ uri: "https://image2url.com/images/1765428960732-cd2e3e5e-9d7f-44b8-a152-7d8b71d21f75.png" }}
               style={styles.logo}
               contentFit="contain"
             />
          </View>

          <View style={styles.textSection}>
            <Text style={styles.title}>Enter your GST number</Text>
            <Text style={styles.subtitle}>
              We'll auto-fill your business details from the GST database.
            </Text>
          </View>

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

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.button, 
              // Disable visual style if loading OR invalid regex
              (loading || !isValidGst) && styles.buttonDisabled
            ]}
            onPress={handleFetchDetails}
            // Disable interaction if loading OR invalid regex
            disabled={loading || !isValidGst}
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    height: SCREEN_HEIGHT * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
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
  },
  inputError: { borderColor: '#EF4444' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  errorText: { color: '#EF4444', fontSize: 13 },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  button: {
    backgroundColor: '#005CE6',
    height: 54,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { 
    opacity: 0.5, 
    backgroundColor: '#1E293B' // Darker/Greyed out color
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },
});