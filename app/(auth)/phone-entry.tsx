// app/(auth)/phone-entry.tsx

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const PhoneEntryPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { sendOtp } = useAuth();

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  const handleSendOtp = async () => {
    setError('');
    
    // Auto-prepend +91 if user just types 10 digits
    let finalNumber = phoneNumber.trim();
    if (!finalNumber.startsWith('+') && finalNumber.length === 10) {
      finalNumber = '+91' + finalNumber;
    }

    if (!finalNumber) {
      setError('Please enter your phone number');
      return;
    }

    if (!phoneRegex.test(finalNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(finalNumber);
      router.push({
        pathname: '/(auth)/otp-verification',
        params: { phoneNumber: finalNumber }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPolicies = () => {
    Linking.openURL('https://bizzap.app/polices').catch(err => 
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.contentContainer}>
          
          {/* 1. Branding Header */}
          <View style={styles.brandHeader}>
            <Text style={styles.brandText}>bizzap</Text>
          </View>

          {/* 2. Illustration Area */}
          <View style={styles.illustrationContainer}>
            <Image 
              source={{ uri: "https://image2url.com/images/1765428466632-f867d4de-c2ed-4ff3-b83b-acbc69a597fa.svg" }} 
              style={styles.illustration}
              contentFit="contain"
              transition={1000}
            />
          </View>

          {/* 3. Main Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.title}>Get started with <Text style={styles.titleHighlight}>Bizzap</Text></Text>
            <Text style={styles.subtitle}>Enter your phone number to continue</Text>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Input Field Container */}
            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <View style={styles.verticalDivider} />
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Phone number"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!loading}
                autoFocus={false}
              />
            </View>
          </View>

          {/* 4. Bottom Section (Policy + Button) */}
          <View style={styles.bottomContainer}>
            <Text style={styles.policyText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText} onPress={handleOpenPolicies}>
                Terms & Privacy Policy
              </Text>.
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PhoneEntryPage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0E11',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  
  // Header
  brandHeader: {
    alignItems: 'center',
    paddingTop: 40,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Illustration
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  illustration: {
    width: 280,
    height: 280,
  },

  // Form Section
  formSection: {
    width: '100%',
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleHighlight: {
    color: '#A5B4FC',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  
  // Input Styling
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    height: 56,
    paddingHorizontal: 16,
  },
  countryCode: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#4B5563',
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    height: '100%',
    fontWeight: '500',
  },

  // Error Message
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Bottom Footer
  bottomContainer: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  policyText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  linkText: {
    color: '#3B82F6',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});