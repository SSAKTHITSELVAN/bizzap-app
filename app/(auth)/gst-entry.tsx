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
  BackHandler
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const GstEntryPage = () => {
  const [gstNumber, setGstNumber] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter();
  const params = useLocalSearchParams();

  const phoneNumber = params.phoneNumber as string;
  const otp = params.otp as string;

  // Validate required params
  useEffect(() => {
    if (!phoneNumber || !otp) {
      console.error('Missing required params:', { phoneNumber, otp });
      router.replace('/(auth)/phone-entry');
    }
  }, [phoneNumber, otp]);

  // Prevent hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  const handleContinue = () => {
    setError('');
    
    if (!gstNumber.trim()) {
      setError('GST Number is required');
      return;
    }
    
    if (!gstRegex.test(gstNumber.toUpperCase())) {
      setError('Please enter a valid 15-digit GST number');
      return;
    }

    // Navigate to complete profile using replace to prevent going back
    router.replace({
      pathname: '/(auth)/complete-profile',
      params: {
        phoneNumber,
        otp,
        gstNumber: gstNumber.toUpperCase()
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.progressBar}>
              <View style={[styles.progressStep, styles.progressStepActive]} />
              <View style={styles.progressStep} />
            </View>
            <Text style={styles.title}>Business Verification</Text>
            <Text style={styles.subtitle}>
              Enter your GST number to verify your business
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GST Number</Text>
            <TextInput
              style={styles.input}
              value={gstNumber}
              onChangeText={setGstNumber}
              placeholder="22AAAAA0000A1Z5"
              autoCapitalize="characters"
              maxLength={15}
              autoFocus
            />
            <Text style={styles.hint}>Enter your 15-digit GST identification number</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.button, !gstNumber.trim() && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!gstNumber.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your GST information helps us verify your business authenticity
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GstEntryPage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6D28D9',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  card: {
    width: '100%',
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
    fontSize: 26,
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
    marginBottom: 20,
    padding: 12,
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
  inputGroup: {
    marginBottom: 20,
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
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  button: {
    width: '100%',
    backgroundColor: '#4C1D95',
    padding: 14,
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
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 25,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});