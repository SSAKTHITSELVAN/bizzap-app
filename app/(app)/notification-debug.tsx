// app/(app)/notification-debug.tsx
// Create this file in your app directory

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { notificationService } from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationDebugScreen() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const diag = await notificationService.getDiagnostics();
      setDiagnostics(diag);
      
      const storedToken = await AsyncStorage.getItem('notification_token');
      setToken(storedToken);
    } catch (error) {
      console.error('Error loading diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const testInitialize = async () => {
    try {
      setLoading(true);
      Alert.alert('Info', 'Initializing notification service...');
      
      const success = await notificationService.initialize();
      
      if (success) {
        Alert.alert('Success', 'Notification service initialized!');
      } else {
        Alert.alert('Failed', 'Could not initialize notification service');
      }
      
      await loadDiagnostics();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetToken = async () => {
    try {
      setLoading(true);
      Alert.alert('Info', 'Getting push token...');
      
      const pushToken = await notificationService.registerForPushNotifications();
      
      if (pushToken) {
        Alert.alert('Success', `Token: ${pushToken.substring(0, 40)}...`);
        setToken(pushToken);
      } else {
        Alert.alert('Failed', 'Could not get push token. Check console for details.');
      }
      
      await loadDiagnostics();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testRegisterBackend = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'No token available. Get token first.');
        return;
      }
      
      setLoading(true);
      Alert.alert('Info', 'Registering with backend...');
      
      const success = await notificationService.registerTokenWithBackend(token);
      
      if (success) {
        Alert.alert('Success', 'Backend registration successful!');
      } else {
        Alert.alert('Failed', 'Backend registration failed. Check console.');
      }
      
      await loadDiagnostics();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testFullFlow = async () => {
    try {
      setLoading(true);
      
      // Step 1: Initialize
      Alert.alert('Step 1/3', 'Initializing...');
      const initialized = await notificationService.initialize();
      if (!initialized) {
        Alert.alert('Failed', 'Initialization failed');
        return;
      }
      
      // Step 2: Get token
      Alert.alert('Step 2/3', 'Getting token...');
      const pushToken = await notificationService.registerForPushNotifications();
      if (!pushToken) {
        Alert.alert('Failed', 'Could not get token');
        return;
      }
      setToken(pushToken);
      
      // Step 3: Register backend
      Alert.alert('Step 3/3', 'Registering with backend...');
      const success = await notificationService.registerTokenWithBackend(pushToken);
      if (!success) {
        Alert.alert('Warning', 'Backend registration failed, but token is valid');
      } else {
        Alert.alert('Success!', 'All steps completed successfully!');
      }
      
      await loadDiagnostics();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        'notification_token',
        'notification_token_timestamp',
        'backend_registration_timestamp',
        'device_id'
      ]);
      setToken(null);
      Alert.alert('Success', 'All notification data cleared');
      await loadDiagnostics();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading && !diagnostics) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#01BE8B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Debug</Text>
        <TouchableOpacity onPress={loadDiagnostics} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Diagnostics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Diagnostics</Text>
        {diagnostics && (
          <View style={styles.diagnosticsBox}>
            <DiagnosticRow label="Platform" value={diagnostics.platform} />
            <DiagnosticRow label="Is Real Device" value={diagnostics.isDevice ? 'Yes' : 'No'} />
            <DiagnosticRow label="Is Expo Go" value={diagnostics.isExpoGo ? 'Yes' : 'No'} />
            <DiagnosticRow label="Project ID" value={diagnostics.projectId || 'MISSING!'} status={diagnostics.projectId ? 'success' : 'error'} />
            <DiagnosticRow label="Module Loaded" value={diagnostics.moduleLoaded ? 'Yes' : 'No'} status={diagnostics.moduleLoaded ? 'success' : 'warning'} />
            <DiagnosticRow label="Is Initialized" value={diagnostics.isInitialized ? 'Yes' : 'No'} status={diagnostics.isInitialized ? 'success' : 'warning'} />
            <DiagnosticRow label="Permission" value={diagnostics.permissionStatus || 'Unknown'} />
            <DiagnosticRow label="Has Token" value={diagnostics.storedToken ? 'Yes' : 'No'} status={diagnostics.storedToken ? 'success' : 'warning'} />
            <DiagnosticRow label="Backend Registered" value={diagnostics.backendRegistered ? 'Yes' : 'No'} status={diagnostics.backendRegistered ? 'success' : 'warning'} />
          </View>
        )}
      </View>

      {/* Current Token */}
      {token && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Token</Text>
          <View style={styles.tokenBox}>
            <Text style={styles.tokenText} selectable>{token}</Text>
          </View>
        </View>
      )}

      {/* Test Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Actions</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={testFullFlow}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Testing...' : '🚀 Run Full Test'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={testInitialize}
          disabled={loading}
        >
          <Text style={styles.buttonText}>1️⃣ Test Initialize</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={testGetToken}
          disabled={loading}
        >
          <Text style={styles.buttonText}>2️⃣ Test Get Token</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={testRegisterBackend}
          disabled={loading || !token}
        >
          <Text style={styles.buttonText}>3️⃣ Test Backend Registration</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={clearAllData}
        >
          <Text style={styles.buttonText}>🗑️ Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What to Check</Text>
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionText}>✅ Project ID must be present</Text>
          <Text style={styles.instructionText}>✅ Module should be loaded</Text>
          <Text style={styles.instructionText}>✅ Permission should be 'granted'</Text>
          <Text style={styles.instructionText}>✅ Token should be obtained</Text>
          <Text style={styles.instructionText}>✅ Backend registration should succeed</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function DiagnosticRow({ label, value, status }: { label: string; value: string; status?: 'success' | 'warning' | 'error' }) {
  const getColor = () => {
    if (status === 'success') return '#01BE8B';
    if (status === 'warning') return '#FFA500';
    if (status === 'error') return '#FF3B30';
    return '#8FA8CC';
  };

  return (
    <View style={styles.diagnosticRow}>
      <Text style={styles.diagnosticLabel}>{label}:</Text>
      <Text style={[styles.diagnosticValue, { color: getColor() }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#121924',
    borderRadius: 8,
  },
  refreshText: {
    color: '#01BE8B',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  diagnosticsBox: {
    backgroundColor: '#121924',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1c283c',
  },
  diagnosticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1c283c',
  },
  diagnosticLabel: {
    fontSize: 14,
    color: '#8FA8CC',
  },
  diagnosticValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tokenBox: {
    backgroundColor: '#121924',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1c283c',
  },
  tokenText: {
    fontSize: 12,
    color: '#01BE8B',
    fontFamily: 'monospace',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#01BE8B',
  },
  secondaryButton: {
    backgroundColor: '#121924',
    borderWidth: 1,
    borderColor: '#01BE8B',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: '#121924',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1c283c',
  },
  instructionText: {
    fontSize: 14,
    color: '#8FA8CC',
    marginBottom: 8,
  },
});