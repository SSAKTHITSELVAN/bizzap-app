// app/(app)/dashboard/_layout.tsx

import { Stack, useRouter, usePathname } from 'expo-router';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { companyAPI } from '../../../services/user';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Custom Header Component ---
function CustomHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const [userProfile, setUserProfile] = useState<{
        userPhoto?: string;
        logo?: string;
        userName?: string;
        companyName?: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    // Hide header on notifications page AND dashboard index (Index now handles its own header for scrolling)
    const isNotificationsPage = pathname?.includes('/notifications');
    const isDashboardIndex = pathname === '/(app)/dashboard' || pathname === '/dashboard';
    
    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const profile = await companyAPI.getProfile();
            setUserProfile({
                userPhoto: profile.userPhoto,
                logo: profile.logo,
                userName: profile.userName,
                companyName: profile.companyName,
            });
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    // Don't render header on notifications page or Dashboard Index (it scrolls there now)
    if (isNotificationsPage || isDashboardIndex) {
        return null;
    }

    // Default header for other pages (like Search, etc if they share this layout)
    const displayImage = userProfile?.userPhoto || userProfile?.logo;
    const displayInitial = (userProfile?.userName || userProfile?.companyName || 'B').charAt(0).toUpperCase();

    return (
        <View style={styles.headerWrapper}>
            <View style={styles.headerContainer}>
                <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>bizzap</Text>

                        <View style={styles.headerRight}>
                            <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
                                {loading ? (
                                    <View style={styles.headerProfileImage}>
                                        <ActivityIndicator size="small" color="#fff" />
                                    </View>
                                ) : displayImage ? (
                                    <Image
                                        source={{ uri: displayImage }}
                                        style={styles.headerProfileImage}
                                    />
                                ) : (
                                    <View style={[styles.headerProfileImage, styles.profilePlaceholder2]}>
                                        <Text style={styles.profileInitial2}>{displayInitial}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </View>
    );
}

// This is a Stack Layout for the dashboard screens with custom header
export default function DashboardLayout() {
  return (
    <>
      <CustomHeader />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
    // Default Header Styles (for other pages)
    headerWrapper: {
        position: 'absolute', 
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    headerContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        marginHorizontal: sizeScale(10),
        marginTop: Platform.OS === 'ios' ? sizeScale(50) : sizeScale(10),
        borderRadius: sizeScale(20),
        overflow: 'hidden',
    },
    headerSafeArea: {
        backgroundColor: 'transparent',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: sizeScale(20),
        paddingVertical: sizeScale(12),
    },
    headerTitle: {
        fontSize: sizeScale(28),
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: sizeScale(0.5),
        fontFamily: 'Nunito',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(16),
    },
    headerProfileImage: {
        width: sizeScale(40),
        height: sizeScale(40),
        borderRadius: sizeScale(20),
        backgroundColor: '#ccc',
        borderWidth: sizeScale(2),
        borderColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePlaceholder2: {
        backgroundColor: '#8b5cf6',
    },
    profileInitial2: {
        fontSize: sizeScale(16),
        fontWeight: '700',
        color: '#fff',
    },
});