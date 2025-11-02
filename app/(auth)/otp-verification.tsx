// app/(auth)/otp-verification.tsx

import React, { useState, useEffect } from 'react';
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
  BackHandler
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const OtpVerificationPage = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();

  const phoneNumber = params.phoneNumber as string;

  // Validate required params
  useEffect(() => {
    if (!phoneNumber) {
      console.error('Missing phoneNumber param');
      router.replace('/(auth)/phone-entry');
    }
  }, [phoneNumber]);

  // Prevent hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  const handleVerifyOtp = async () => {
    setError('');
    
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      const result = await login(phoneNumber, otp);
      
      if (result.isNewUser) {
        // New user - go to GST entry
        router.replace({
          pathname: '/(auth)/gst-entry', 
          params: { 
            phoneNumber: phoneNumber, 
            otp: otp 
          } 
        });
      } else {
        // Existing user - login successful, navigate to dashboard
        // Use replace to prevent going back to auth screens
        router.replace('/(app)/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setLoading(false); // Only set loading false on error
    }
    // Don't set loading false on success - let navigation happen
  };

  const handleChangePhone = () => {
    router.replace('/(auth)/phone-entry');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Your Number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to
            </Text>
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              autoFocus
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.button, 
              (loading || otp.length !== 6) && styles.buttonDisabled
            ]}
            onPress={handleVerifyOtp}
            disabled={loading || otp.length !== 6}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleChangePhone}
            disabled={loading}
            style={styles.changePhoneButton}
          >
            <Text style={styles.changePhoneText}>
              Change phone number
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Didn't receive the code? Check your messages or try again
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OtpVerificationPage;

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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4C1D95',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C1D95',
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
    textAlign: 'center',
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
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
    fontWeight: '600',
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
  changePhoneButton: {
    marginTop: 15,
  },
  changePhoneText: {
    color: '#4B5563',
    textAlign: 'center',
    fontSize: 14,
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