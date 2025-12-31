// app/(auth)/phone-entry.tsx

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Linking,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Keyboard,
    ScrollView,
    Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// Responsive utility
const getResponsiveSize = (size: number) => {
  const baseWidth = 390;
  return Math.round((width / baseWidth) * size);
};

const PhoneEntryPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  const router = useRouter();
  const { sendOtp } = useAuth();
  const insets = useSafeAreaInsets();

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  // Listen for keyboard events to hide UI elements
  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleSendOtp = async () => {
    setError('');
    
    const trimmedNumber = phoneNumber.trim();
    if (!trimmedNumber) {
      setError('Please enter your phone number');
      return;
    }

    let finalNumber = trimmedNumber;
    if (!finalNumber.startsWith('+')) {
      if (/^\d{10}$/.test(finalNumber)) {
        finalNumber = '+91' + finalNumber;
      } else if (!/^\d+$/.test(finalNumber)) {
        setError('Phone number should contain only digits');
        return;
      } else if (finalNumber.length < 10) {
        setError('Phone number should be at least 10 digits');
        return;
      } else if (finalNumber.length > 15) {
        setError('Phone number is too long');
        return;
      } else {
        setError('Please add country code (e.g., +91 for India)');
        return;
      }
    }

    if (!phoneRegex.test(finalNumber)) {
      setError('Please enter a valid phone number with country code');
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
      console.error('❌ Phone entry error:', err);
      let errorMsg = 'Failed to send OTP. Please try again.';
      if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPolicies = () => {
    Linking.openURL('https://bizzap.app/polices').catch(console.error);
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    if (error) setError('');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            isKeyboardVisible ? styles.scrollContentKeyboardOpen : null
          ]}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header & Branding - Hidden when keyboard is open to save space */}
          {!isKeyboardVisible && (
            <>
              <View style={styles.brandHeader}>
                <Text style={styles.brandText}>bizzap</Text>
              </View>

              <View style={styles.illustrationContainer}>
                <Image 
                  source={{ uri: "https://image2url.com/images/1765428466632-f867d4de-c2ed-4ff3-b83b-acbc69a597fa.svg" }} 
                  style={styles.illustration}
                  contentFit="contain"
                  transition={500}
                />
              </View>
            </>
          )}

          {/* Form Section - Always visible, moves up */}
          <View style={[styles.formSection, isKeyboardVisible && styles.formSectionKeyboardOpen]}>
            <Text style={styles.title}>
              Get started with <Text style={styles.titleHighlight}>Bizzap</Text>
            </Text>
            <Text style={styles.subtitle}>Enter your phone number to continue</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={[
              styles.inputContainer,
              error ? styles.inputContainerError : null
            ]}>
              <Text style={styles.countryCode}>+91</Text>
              <View style={styles.verticalDivider} />
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder="Phone number"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!loading}
                maxLength={15}
              />
            </View>
            
            <Text style={styles.helperText}>
              Enter 10-digit mobile number or number with country code
            </Text>
          </View>

          {/* Bottom Section */}
          <View style={[
              styles.bottomContainer, 
              { paddingBottom: isKeyboardVisible ? 20 : Math.max(insets.bottom, 20) }
          ]}>
            {!isKeyboardVisible && (
                <Text style={styles.policyText}>
                By continuing, you agree to our{' '}
                <Text style={styles.linkText} onPress={handleOpenPolicies}>
                    Terms & Privacy Policy
                </Text>.
                </Text>
            )}

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

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default PhoneEntryPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E11',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: getResponsiveSize(24),
    justifyContent: 'space-between',
  },
  scrollContentKeyboardOpen: {
    justifyContent: 'center', // Center form when keyboard is open
  },
  
  // Header
  brandHeader: {
    alignItems: 'center',
    paddingTop: getResponsiveSize(20),
    marginBottom: getResponsiveSize(10),
  },
  brandText: {
    fontSize: getResponsiveSize(22),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: getResponsiveSize(20),
    height: getResponsiveSize(250), // Fixed height to prevent layout jumps before image loads
  },
  illustration: {
    width: getResponsiveSize(250),
    height: getResponsiveSize(250),
  },

  // Form
  formSection: {
    width: '100%',
    marginBottom: getResponsiveSize(20),
  },
  formSectionKeyboardOpen: {
    marginBottom: getResponsiveSize(10),
  },
  title: {
    fontSize: getResponsiveSize(26),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: getResponsiveSize(8),
    textAlign: 'center',
  },
  titleHighlight: {
    color: '#A5B4FC',
  },
  subtitle: {
    fontSize: getResponsiveSize(15),
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: getResponsiveSize(24),
  },
  
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    height: getResponsiveSize(56),
    paddingHorizontal: 16,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  countryCode: {
    fontSize: getResponsiveSize(16),
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
    fontSize: getResponsiveSize(16),
    height: '100%',
    fontWeight: '500',
  },
  helperText: {
    fontSize: getResponsiveSize(12),
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Error
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Bottom
  bottomContainer: {
    width: '100%',
  },
  policyText: {
    fontSize: getResponsiveSize(12),
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
    height: getResponsiveSize(54),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(16),
    fontWeight: '700',
  },
});