// app/(auth)/otp-verification.tsx

import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const OTP_TIMER_DURATION = 60; // 60 seconds

const OtpVerificationPage = () => {
  // Input State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [activeInputIndex, setActiveInputIndex] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Logic State
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Controls success view
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(OTP_TIMER_DURATION);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login, sendOtp } = useAuth();
  const phoneNumber = params.phoneNumber as string;

  // --- Effects ---

  // Timer Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle Back Button
  const handleBack = () => {
    router.back();
  };

  // --- Input Handling ---

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    
    // Handle paste event (if user pastes full code)
    if (text.length > 1) {
      const pastedCode = text.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedCode[i] || '';
      }
      setOtp(newOtp);
      // Focus last filled input
      const nextFocus = Math.min(text.length, 5);
      inputRefs.current[nextFocus]?.focus();
      setActiveInputIndex(nextFocus);
      return;
    }

    // Handle single char input
    newOtp[index] = text;
    setOtp(newOtp);
    setError('');

    // Auto-advance focus
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveInputIndex(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box empty, move back and delete previous
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        setActiveInputIndex(index - 1);
      }
    }
  };

  // --- Actions ---

  const handleVerify = async () => {
    const otpString = otp.join('');
    setError('');

    if (otpString.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const result = await login(phoneNumber, otpString);
      
      // SHOW SUCCESS ANIMATION
      setLoading(false);
      setIsVerified(true);

      // Delay navigation slightly to show success screen
      setTimeout(() => {
        if (result.isNewUser) {
          router.replace({
            pathname: '/(auth)/gst-entry', 
            params: { phoneNumber, otp: otpString } 
          });
        } else {
          router.replace('/(app)/dashboard');
        }
      }, 1500); // 1.5s delay

    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    setLoading(true);
    try {
      await sendOtp(phoneNumber);
      setTimer(OTP_TIMER_DURATION);
      setOtp(['', '', '', '', '', '']); // Clear input
      inputRefs.current[0]?.focus();
      setActiveInputIndex(0);
      alert('OTP resent successfully!');
    } catch (err: any) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // --- Success View Render ---
  if (isVerified) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.successContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
        <View style={styles.successContent}>
          <Text style={styles.successTitle}>Verified!</Text>
          
          <View style={styles.successBadge}>
             <Ionicons name="checkmark-circle" size={24} color="#10B981" />
             <Text style={styles.successBadgeText}>OTP Verified</Text>
          </View>

          <Text style={styles.successSubtitle}>Thank you for your cooperation with us.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.brandText}>bizzap</Text>
          <View style={{ width: 24 }} /> 
        </View>

        <View style={styles.contentContainer}>
          
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
             <Image 
               source={{ uri: "https://image2url.com/images/1765428756913-8dd2c659-7f6d-4ddc-821a-5cfe9ef6f085.svg" }}
               style={styles.illustration}
               contentFit="contain"
               transition={500}
             />
          </View>

          {/* Texts */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit OTP to <Text style={styles.phoneHighlight}>{phoneNumber}</Text>
            </Text>
          </View>

          {/* OTP Input Boxes */}
          <View style={styles.inputContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  activeInputIndex === index && styles.otpBoxActive,
                  error ? styles.otpBoxError : null
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => setActiveInputIndex(index)}
                selectionColor="#3B82F6"
              />
            ))}
          </View>

          {/* Timer & Resend */}
          <View style={styles.timerContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Didn't receive OTP? Resend in <Text style={styles.timerHighlight}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

        </View>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, (loading || otp.join('').length !== 6) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OtpVerificationPage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0E11',
  },
  container: {
    flex: 1,
  },
  successContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  // Illustration
  illustrationContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  illustration: {
    width: 220,
    height: 180,
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
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  phoneHighlight: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // OTP Inputs
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  otpBox: {
    width: 45,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#1A1D21', // Dark grey bg
    borderWidth: 1,
    borderColor: '#374151',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpBoxActive: {
    borderColor: '#3B82F6', // Blue border when focused
    backgroundColor: '#1E293B',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  otpBoxError: {
    borderColor: '#EF4444',
  },

  // Timer
  timerContainer: {
    marginBottom: 20,
  },
  timerText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  timerHighlight: {
    color: '#10B981', // Green for timer count
    fontWeight: '600',
  },
  resendLink: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 10,
  },

  // Footer Button
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

  // Success View Styles
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Transparent Green
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    gap: 10,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  successBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
});