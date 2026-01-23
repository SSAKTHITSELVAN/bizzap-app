

// // app/(app)/settings/notifications.tsx - IMPROVED PERMISSION SCREEN
// // app/(app)/settings/notifications.tsx - SUPER SIMPLE VERSION
// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   Dimensions, 
//   TouchableOpacity, 
//   Platform, 
//   Alert, 
//   ActivityIndicator, 
//   Linking 
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Feather } from '@expo/vector-icons';
// import { useNotifications } from '../../../context/NotificationContext';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const STANDARD_WIDTH = 390;
// const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// export default function NotificationsPermissionScreen() {
//   const router = useRouter();
//   const { pushPermissionStatus, requestPushPermission } = useNotifications();
//   const [isRequesting, setIsRequesting] = useState(false);
  
//   useEffect(() => {
//     console.log('[PermissionScreen] Current status:', pushPermissionStatus);
    
//     // Auto-request on mount if undetermined
//     if (pushPermissionStatus === 'undetermined') {
//       handleRequestPermission();
//     }
//   }, [pushPermissionStatus]);

//   const handleRequestPermission = async () => {
//     try {
//       setIsRequesting(true);
//       console.log('[PermissionScreen] Requesting permission...');
      
//       const granted = await requestPushPermission();
      
//       if (granted) {
//         Alert.alert(
//           'Success! ✅',
//           'Push notifications are now enabled.',
//           [{ text: 'OK', onPress: () => router.back() }]
//         );
//       } else {
//         // Permission denied - just go back
//         Alert.alert(
//           'Notifications Disabled',
//           'You can enable notifications later in your device settings.',
//           [{ text: 'OK', onPress: () => router.back() }]
//         );
//       }
//     } catch (error) {
//       console.error('[PermissionScreen] Request error:', error);
//       router.back();
//     } finally {
//       setIsRequesting(false);
//     }
//   };

//   const showManualSettingsGuide = () => {
//     const settingsInstructions = Platform.select({
//       ios: `To enable notifications manually:

// 1. Open iPhone Settings
// 2. Scroll down and tap on your app
// 3. Tap "Notifications"
// 4. Turn on "Allow Notifications"
// 5. Return to the app`,
      
//       android: `To enable notifications manually:

// 1. Open Android Settings
// 2. Tap "Apps" or "Applications"
// 3. Find and tap your app
// 4. Tap "Notifications"
// 5. Turn on "Show notifications"
// 6. Return to the app`,
      
//       default: 'Please enable notifications in your device settings'
//     });

//     Alert.alert(
//       'Enable Notifications Manually',
//       settingsInstructions,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Open Settings', 
//           onPress: () => {
//             if (Platform.OS === 'ios') {
//               Linking.openURL('app-settings:');
//             } else {
//               Linking.openSettings();
//             }
//           }
//         }
//       ]
//     );
//   };

//   const renderContent = () => {
//     // Loading/Requesting state
//     if (isRequesting) {
//       return (
//         <>
//           <View style={styles.iconContainer}>
//             <ActivityIndicator size={sizeScale(60)} color="#01BE8B" />
//           </View>
          
//           <Text style={styles.mainMessage}>
//             Requesting Permission...
//           </Text>
//           <Text style={styles.subMessage}>
//             Please allow notifications when prompted
//           </Text>
//         </>
//       );
//     }

//     // Unavailable (Expo Go or Web)
//     if (pushPermissionStatus === 'unavailable') {
//       return (
//         <>
//           <View style={styles.iconContainer}>
//             <Feather name="smartphone" size={sizeScale(60)} color="#888" />
//           </View>
          
//           <Text style={styles.mainMessage}>
//             Push Notifications Not Available
//           </Text>
//           <Text style={styles.subMessage}>
//             {Platform.OS === 'web' 
//               ? 'Web platform uses in-app notifications only.'
//               : 'Push notifications are not available in development mode.'}
//           </Text>

//           <TouchableOpacity 
//             style={styles.primaryButton}
//             onPress={() => router.back()}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.primaryButtonText}>Got it</Text>
//           </TouchableOpacity>
//         </>
//       );
//     }

//     // Permission granted
//     if (pushPermissionStatus === 'granted') {
//       return (
//         <>
//           <View style={styles.iconContainer}>
//             <Feather name="bell" size={sizeScale(60)} color="#01BE8B" />
//           </View>
          
//           <Text style={styles.mainMessage}>
//             Notifications Enabled! ✅
//           </Text>
//           <Text style={styles.subMessage}>
//             You'll receive push notifications for new leads and updates.
//           </Text>

//           <TouchableOpacity 
//             style={styles.primaryButton}
//             onPress={() => router.back()}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.primaryButtonText}>Done</Text>
//           </TouchableOpacity>
//         </>
//       );
//     }

//     // Permission denied
//     if (pushPermissionStatus === 'denied') {
//       return (
//         <>
//           <View style={styles.iconContainer}>
//             <Feather name="bell-off" size={sizeScale(60)} color="#FF3B30" />
//           </View>
          
//           <Text style={styles.mainMessage}>
//             Notifications Disabled
//           </Text>
//           <Text style={styles.subMessage}>
//             You can enable notifications in your device settings if needed.
//           </Text>

//           <TouchableOpacity 
//             style={styles.primaryButton}
//             onPress={() => router.back()}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.primaryButtonText}>Continue</Text>
//           </TouchableOpacity>
//         </>
//       );
//     }

//     // This shouldn't happen since we auto-request, but just in case
//     return null;
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Feather name="chevron-left" size={sizeScale(24)} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Push Notifications</Text>
//       </View>

//       {/* Content */}
//       <View style={styles.content}>
//         {renderContent()}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: sizeScale(10),
//     paddingVertical: sizeScale(12),
//     paddingTop: sizeScale(50),
//     backgroundColor: '#000',
//     borderBottomWidth: 1,
//     borderBottomColor: '#1c1c1c',
//   },
//   backButton: {
//     padding: sizeScale(6),
//   },
//   headerTitle: {
//     flex: 1,
//     fontSize: sizeScale(18),
//     fontWeight: '600',
//     color: '#fff',
//     textAlign: 'center',
//     marginRight: sizeScale(36),
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: sizeScale(30),
//   },
//   iconContainer: {
//     width: sizeScale(100),
//     height: sizeScale(100),
//     borderRadius: sizeScale(50),
//     backgroundColor: 'rgba(143, 168, 204, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: sizeScale(20),
//     borderWidth: 2,
//     borderColor: 'rgba(143, 168, 204, 0.2)',
//   },
//   mainMessage: {
//     fontSize: sizeScale(22),
//     fontWeight: 'bold',
//     color: '#fff',
//     textAlign: 'center',
//     marginBottom: sizeScale(10),
//   },
//   subMessage: {
//     fontSize: sizeScale(14),
//     color: '#888',
//     textAlign: 'center',
//     lineHeight: sizeScale(20),
//     marginBottom: sizeScale(30),
//   },
//   primaryButton: {
//     width: '100%',
//     backgroundColor: '#01BE8B',
//     paddingVertical: sizeScale(16),
//     borderRadius: sizeScale(12),
//     alignItems: 'center',
//     marginBottom: sizeScale(12),
//     shadowColor: '#01BE8B',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   primaryButtonText: {
//     fontSize: sizeScale(16),
//     fontWeight: '700',
//     color: '#fff',
//   },
//   secondaryButton: {
//     width: '100%',
//     backgroundColor: 'transparent',
//     paddingVertical: sizeScale(16),
//     borderRadius: sizeScale(12),
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#333',
//     marginBottom: sizeScale(12),
//   },
//   secondaryButtonText: {
//     fontSize: sizeScale(16),
//     fontWeight: '600',
//     color: '#888',
//   },
//   buttonDisabled: {
//     opacity: 0.5,
//   },
// });


// app/(app)/settings/notifications.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={sizeScale(24)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="bell" size={sizeScale(48)} color="#8FA8CC" />
          <View style={styles.badge}>
             <Feather name="clock" size={sizeScale(14)} color="#000" />
          </View>
        </View>
        
        <Text style={styles.mainMessage}>
          Coming Next Update
        </Text>
        <Text style={styles.subMessage}>
          We're fine-tuning the notification system to ensure you never miss a lead. This feature will be available shortly.
        </Text>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Okay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
    paddingTop: sizeScale(50),
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1c',
  },
  backButton: {
    padding: sizeScale(8),
    marginRight: sizeScale(8),
  },
  headerTitle: {
    fontSize: sizeScale(18),
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sizeScale(32),
  },
  iconContainer: {
    width: sizeScale(90),
    height: sizeScale(90),
    borderRadius: sizeScale(45),
    backgroundColor: 'rgba(143, 168, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sizeScale(24),
    borderWidth: 1,
    borderColor: 'rgba(143, 168, 204, 0.2)',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#01BE8B',
    padding: sizeScale(6),
    borderRadius: sizeScale(12),
    borderWidth: 2,
    borderColor: '#000',
  },
  mainMessage: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: sizeScale(12),
  },
  subMessage: {
    fontSize: sizeScale(14),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: sizeScale(22),
    marginBottom: sizeScale(40),
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#0057D9',
    paddingVertical: sizeScale(16),
    borderRadius: sizeScale(12),
    alignItems: 'center',
    shadowColor: '#0057D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#fff',
  },
});