// app/(auth)/otp-verification.tsx

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    Alert,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');
const OTP_TIMER_DURATION = 60;

// Responsive sizing utility
const getResponsiveSize = (size: number) => {
  const baseWidth = 390;
  return Math.round((width / baseWidth) * size);
};

const OtpVerificationPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [activeInputIndex, setActiveInputIndex] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(OTP_TIMER_DURATION);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login, sendOtp } = useAuth();
  const phoneNumber = params.phoneNumber as string;

  useEffect(() => {
    if (!phoneNumber) {
      router.replace('/(auth)/phone-entry');
    }
  }, [phoneNumber]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleBack = () => {
    try {
      router.back();
    } catch (err) {
      console.error('Navigation error:', err);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    try {
      const newOtp = [...otp];
      
      if (text.length > 1) {
        const pastedCode = text.slice(0, 6).split('');
        for (let i = 0; i < 6; i++) {
          newOtp[i] = pastedCode[i] || '';
        }
        setOtp(newOtp);
        const nextFocus = Math.min(text.length, 5);
        inputRefs.current[nextFocus]?.focus();
        setActiveInputIndex(nextFocus);
        return;
      }

      newOtp[index] = text;
      setOtp(newOtp);
      setError('');

      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
        setActiveInputIndex(index + 1);
      }
    } catch (err) {
      console.error('Error handling OTP change:', err);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    try {
      if (e.nativeEvent.key === 'Backspace') {
        if (!otp[index] && index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
          inputRefs.current[index - 1]?.focus();
          setActiveInputIndex(index - 1);
        }
      }
    } catch (err) {
      console.error('Error handling key press:', err);
    }
  };

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
      console.log('🔐 Starting verification...');
      const result = await login(phoneNumber, otpString);
      
      console.log('✅ Verification successful:', result);
      setLoading(false);
      setIsVerified(true);

      setTimeout(() => {
        try {
          if (result.isNewUser) {
            router.replace({
              pathname: '/(auth)/gst-entry', 
              params: { phoneNumber, otp: otpString } 
            });
          } else {
            router.replace('/(app)/dashboard');
          }
        } catch (navErr) {
          console.error('❌ Navigation error:', navErr);
          setError('Navigation failed. Please restart the app.');
        }
      }, 1500);

    } catch (err: any) {
      console.error('❌ Verification error:', err);
      setLoading(false);
      setIsVerified(false);
      
      let errorMessage = 'Verification failed. Please try again.';
      
      try {
        if (err?.message) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } catch (extractErr) {
        console.error('Error extracting message:', extractErr);
      }
      
      if (errorMessage.toLowerCase().includes('invalid otp')) {
        errorMessage = 'Invalid OTP. Please check and try again.';
      } else if (errorMessage.toLowerCase().includes('expired')) {
        errorMessage = 'OTP has expired. Please request a new one.';
      } else if (errorMessage.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        try {
          inputRefs.current[0]?.focus();
          setActiveInputIndex(0);
        } catch (focusErr) {
          console.error('Focus error:', focusErr);
        }
      }, 100);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('📤 Resending OTP...');
      await sendOtp(phoneNumber);
      setTimer(OTP_TIMER_DURATION);
      setOtp(['', '', '', '', '', '']);
      
      Alert.alert(
        'OTP Sent', 
        'A new OTP has been sent to your phone number.',
        [{ text: 'OK' }]
      );
      
      setTimeout(() => {
        try {
          inputRefs.current[0]?.focus();
          setActiveInputIndex(0);
        } catch (focusErr) {
          console.error('Focus error:', focusErr);
        }
      }, 100);
    } catch (err: any) {
      console.error('❌ Resend error:', err);
      let errorMessage = 'Failed to resend OTP. Please try again.';
      try {
        if (err?.message) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
      } catch (extractErr) {
        console.error('Error extracting message:', extractErr);
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <View style={styles.successContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
        <View style={styles.successContent}>
          <Text style={styles.successTitle}>Verified!</Text>
          <View style={styles.successBadge}>
             <Ionicons name="checkmark-circle" size={getResponsiveSize(24)} color="#10B981" />
             <Text style={styles.successBadgeText}>OTP Verified</Text>
          </View>
          <Text style={styles.successSubtitle}>Thank you for your cooperation.</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={getResponsiveSize(24)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.brandText}>bizzap</Text>
          <View style={{ width: getResponsiveSize(24) }} /> 
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.illustrationContainer}>
             <Image 
               source={{ uri: "https://image2url.com/images/1765428756913-8dd2c659-7f6d-4ddc-821a-5cfe9ef6f085.svg" }}
               style={styles.illustration}
               contentFit="contain"
             />
          </View>

          <View style={styles.textSection}>
            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit OTP to <Text style={styles.phoneHighlight}>{phoneNumber}</Text>
            </Text>
          </View>

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

          <View style={styles.timerContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Didn't receive OTP? Resend in <Text style={styles.timerHighlight}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={loading}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={getResponsiveSize(20)} color="#EF4444" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

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
    backgroundColor: '#0B0E11' 
  },
  container: { 
    flex: 1 
  },
  // Success Screen Styles - Perfectly Centered
  successContainer: { 
    flex: 1, 
    backgroundColor: '#0B0E11', 
    justifyContent: 'center', 
    alignItems: 'center',
    width: '100%',
    height: '100%'
  },
  successContent: { 
    width: '100%',
    alignItems: 'center', 
    paddingHorizontal: getResponsiveSize(40),
    justifyContent: 'center'
  },
  successTitle: { 
    fontSize: getResponsiveSize(28), 
    fontWeight: '700', 
    color: '#FFFFFF', 
    marginBottom: getResponsiveSize(24),
    textAlign: 'center'
  },
  successBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
    borderWidth: 1, 
    borderColor: '#10B981', 
    borderRadius: 8, 
    paddingVertical: getResponsiveSize(12), 
    paddingHorizontal: getResponsiveSize(32), 
    gap: 10, 
    marginBottom: getResponsiveSize(20), 
    justifyContent: 'center',
    maxWidth: '80%'
  },
  successBadgeText: { 
    color: '#FFFFFF', 
    fontSize: getResponsiveSize(16), 
    fontWeight: '600' 
  },
  successSubtitle: { 
    fontSize: getResponsiveSize(14), 
    color: '#FFFFFF', 
    opacity: 0.8, 
    textAlign: 'center' 
  },
  // Main UI Styles
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: getResponsiveSize(20), 
    height: getResponsiveSize(56) 
  },
  backButton: { 
    padding: 4 
  },
  brandText: { 
    fontSize: getResponsiveSize(18), 
    fontWeight: '700', 
    color: '#FFFFFF', 
    letterSpacing: 0.5 
  },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: getResponsiveSize(24), 
    paddingBottom: getResponsiveSize(20) 
  },
  illustrationContainer: { 
    height: getResponsiveSize(180), 
    width: '100%', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginVertical: getResponsiveSize(20) 
  },
  illustration: { 
    width: getResponsiveSize(200), 
    height: getResponsiveSize(160) 
  },
  textSection: { 
    alignItems: 'center', 
    marginBottom: getResponsiveSize(30) 
  },
  title: { 
    fontSize: getResponsiveSize(24), 
    fontWeight: '700', 
    color: '#FFFFFF', 
    marginBottom: getResponsiveSize(12),
    textAlign: 'center'
  },
  subtitle: { 
    fontSize: getResponsiveSize(14), 
    color: '#9CA3AF', 
    textAlign: 'center' 
  },
  phoneHighlight: { 
    color: '#3B82F6', 
    fontWeight: '600' 
  },
  inputContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    marginBottom: getResponsiveSize(24), 
    paddingHorizontal: 5 
  },
  otpBox: { 
    width: getResponsiveSize(45), 
    height: getResponsiveSize(50), 
    borderRadius: 8, 
    backgroundColor: '#1A1D21', 
    borderWidth: 1, 
    borderColor: '#374151', 
    color: '#FFFFFF', 
    fontSize: getResponsiveSize(20), 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  otpBoxActive: { 
    borderColor: '#3B82F6', 
    backgroundColor: '#1E293B', 
    elevation: 5 
  },
  otpBoxError: { 
    borderColor: '#EF4444' 
  },
  timerContainer: { 
    marginBottom: getResponsiveSize(20), 
    alignItems: 'center' 
  },
  timerText: { 
    fontSize: getResponsiveSize(13), 
    color: '#9CA3AF' 
  },
  timerHighlight: { 
    color: '#10B981', 
    fontWeight: '600' 
  },
  resendLink: { 
    color: '#3B82F6', 
    fontWeight: '600', 
    fontSize: getResponsiveSize(14) 
  },
  errorContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
    borderRadius: 8, 
    padding: getResponsiveSize(12), 
    marginTop: 10, 
    borderLeftWidth: 3, 
    borderLeftColor: '#EF4444' 
  },
  errorIcon: {
    marginRight: 8
  },
  errorText: { 
    flex: 1,
    color: '#EF4444', 
    fontSize: getResponsiveSize(13), 
    fontWeight: '500' 
  },
  footer: { 
    padding: getResponsiveSize(24), 
    width: '100%',
    marginBottom: Platform.OS === 'ios' ? 0 : 10
  },
  button: { 
    width: '100%', 
    backgroundColor: '#005CE6', 
    height: getResponsiveSize(54), 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  buttonDisabled: { 
    opacity: 0.5, 
    backgroundColor: '#1E293B' 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: getResponsiveSize(16), 
    fontWeight: '700' 
  },
});