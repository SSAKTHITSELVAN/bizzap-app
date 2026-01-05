import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Permission Screen Component ---
export default function NotificationsPermissionScreen() {
    const router = useRouter();
    const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        checkPermissionStatus();
    }, []);

    const checkPermissionStatus = async () => {
        try {
            // Web always has permissions
            if (Platform.OS === 'web') {
                setPermissionStatus('granted');
                setIsLoading(false);
                return;
            }

            const { status } = await Notifications.getPermissionsAsync();
            
            if (status === 'granted') {
                setPermissionStatus('granted');
            } else if (status === 'denied') {
                setPermissionStatus('denied');
            } else {
                setPermissionStatus('undetermined');
            }
            
            setIsLoading(false);
        } catch (error) {
            console.error('Error checking permission status:', error);
            setIsLoading(false);
        }
    };

    const requestPermission = async () => {
        try {
            if (Platform.OS === 'web') {
                Alert.alert('Success', 'Notifications are enabled for web!');
                return;
            }

            const { status } = await Notifications.requestPermissionsAsync();
            
            if (status === 'granted') {
                setPermissionStatus('granted');
                Alert.alert(
                    'Success!',
                    'Push notifications have been enabled. You will now receive updates about new leads and important events.',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                setPermissionStatus('denied');
                Alert.alert(
                    'Permission Denied',
                    'You have denied notification permissions. You can enable them later in your device settings.'
                );
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
            Alert.alert('Error', 'Failed to request notification permission. Please try again.');
        }
    };

    const openSettings = () => {
        Alert.alert(
            'Enable Notifications',
            'To receive push notifications, please enable them in your device settings:\n\nSettings > Apps > YourApp > Notifications',
            [{ text: 'OK' }]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Feather name="chevron-left" size={sizeScale(24)} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Push Notifications</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.mainMessage}>Loading...</Text>
                </View>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            {/* Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="chevron-left" size={sizeScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Push Notifications</Text>
            </View>

            {/* Content Area */}
            <View style={styles.content}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Feather 
                        name={permissionStatus === 'granted' ? 'bell' : 'bell-off'} 
                        size={sizeScale(60)} 
                        color={permissionStatus === 'granted' ? '#01BE8B' : '#888'} 
                    />
                </View>

                {/* Status-based Content */}
                {permissionStatus === 'undetermined' && (
                    <>
                        <Text style={styles.mainMessage}>
                            Stay Updated with Push Notifications
                        </Text>
                        <Text style={styles.subMessage}>
                            Enable notifications to receive instant updates about:
                        </Text>
                        
                        {/* Benefits List */}
                        <View style={styles.benefitsList}>
                            <View style={styles.benefitItem}>
                                <Feather name="check-circle" size={sizeScale(20)} color="#01BE8B" />
                                <Text style={styles.benefitText}>New lead opportunities</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Feather name="check-circle" size={sizeScale(20)} color="#01BE8B" />
                                <Text style={styles.benefitText}>Lead consumption alerts</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Feather name="check-circle" size={sizeScale(20)} color="#01BE8B" />
                                <Text style={styles.benefitText}>Important announcements</Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <TouchableOpacity 
                            style={styles.primaryButton}
                            onPress={requestPermission}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>Enable Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.secondaryButton}
                            onPress={() => router.back()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </>
                )}

                {permissionStatus === 'granted' && (
                    <>
                        <Text style={styles.mainMessage}>
                            Notifications Enabled! ✓
                        </Text>
                        <Text style={styles.subMessage}>
                            You're all set! You'll receive push notifications for new leads, updates, and important announcements.
                        </Text>

                        <TouchableOpacity 
                            style={styles.primaryButton}
                            onPress={() => router.back()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>Done</Text>
                        </TouchableOpacity>
                    </>
                )}

                {permissionStatus === 'denied' && (
                    <>
                        <Text style={styles.mainMessage}>
                            Notifications Are Disabled
                        </Text>
                        <Text style={styles.subMessage}>
                            You have denied notification permissions. To enable them, please go to your device settings.
                        </Text>

                        <TouchableOpacity 
                            style={styles.primaryButton}
                            onPress={openSettings}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>Open Settings Guide</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.secondaryButton}
                            onPress={() => router.back()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: sizeScale(10),
        paddingVertical: sizeScale(12),
        paddingTop: sizeScale(50),
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1c1c1c',
    },
    backButton: {
        padding: sizeScale(6),
    },
    headerTitle: {
        flex: 1,
        fontSize: sizeScale(18),
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginRight: sizeScale(36), 
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: sizeScale(30),
    },
    iconContainer: {
        width: sizeScale(100),
        height: sizeScale(100),
        borderRadius: sizeScale(50),
        backgroundColor: 'rgba(143, 168, 204, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: sizeScale(20),
        borderWidth: 2,
        borderColor: 'rgba(143, 168, 204, 0.2)',
    },
    mainMessage: {
        fontSize: sizeScale(22),
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: sizeScale(10),
    },
    subMessage: {
        fontSize: sizeScale(14),
        color: '#888',
        textAlign: 'center',
        lineHeight: sizeScale(20),
        marginBottom: sizeScale(30),
    },
    benefitsList: {
        width: '100%',
        marginBottom: sizeScale(30),
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: sizeScale(15),
        paddingHorizontal: sizeScale(10),
    },
    benefitText: {
        fontSize: sizeScale(14),
        color: '#fff',
        marginLeft: sizeScale(12),
        flex: 1,
    },
    primaryButton: {
        width: '100%',
        backgroundColor: '#01BE8B',
        paddingVertical: sizeScale(16),
        borderRadius: sizeScale(12),
        alignItems: 'center',
        marginBottom: sizeScale(12),
        shadowColor: '#01BE8B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonText: {
        fontSize: sizeScale(16),
        fontWeight: '700',
        color: '#fff',
    },
    secondaryButton: {
        width: '100%',
        backgroundColor: 'transparent',
        paddingVertical: sizeScale(16),
        borderRadius: sizeScale(12),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    secondaryButtonText: {
        fontSize: sizeScale(16),
        fontWeight: '600',
        color: '#888',
    },
});