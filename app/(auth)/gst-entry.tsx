// app/(auth)/gst-entry.tsx

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Keyboard,
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
import { verifyGSTNumber } from '../../services/gstVerification';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GstEntryPage = () => {
  const [gstNumber, setGstNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
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

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[A-Z]{1}[A-Z0-9]{1}$/;

  const handleGstChange = (text: string) => {
    const upperText = text.toUpperCase();
    setGstNumber(upperText);
    if (error) setError('');
  };

  const handleFetchDetails = async () => {
    setError('');
    Keyboard.dismiss();
    
    if (!gstNumber.trim()) return setError('GST Number is required');
    if (!gstRegex.test(gstNumber)) return setError('Please enter a valid 15-digit GST number');

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

  const isValidGst = gstRegex.test(gstNumber);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) }]}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/phone-entry')} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GST Number</Text>
          <View style={{ width: 24 }} /> 
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {/* Scrollable Content to prevent overlap on small screens */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
        </ScrollView>

        {/* Footer sticks to bottom (or top of keyboard) */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <TouchableOpacity
            style={[
              styles.button, 
              (loading || !isValidGst) && styles.buttonDisabled
            ]}
            onPress={handleFetchDetails}
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
    </View>
  );
};

export default GstEntryPage;

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'center', // Centers content vertically if space allows
  },
  logoContainer: {
    height: SCREEN_HEIGHT * 0.2, // Responsive height
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
    backgroundColor: '#0B0E11',
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
    backgroundColor: '#1E293B' 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },
});