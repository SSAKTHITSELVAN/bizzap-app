
// // app/(app)/dashboard/_layout.tsx

// import { Stack, useRouter, usePathname } from 'expo-router';
// import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Dimensions, ActivityIndicator } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Search, Bell } from 'lucide-react-native';
// import { useState, useEffect } from 'react';
// import { companyAPI } from '../../../services/user';

// // --- Responsive Sizing Utility ---
// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const STANDARD_WIDTH = 390;
// const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// // --- Custom Header Component ---
// function CustomHeader() {
//     const router = useRouter();
//     const pathname = usePathname();
//     const [userProfile, setUserProfile] = useState<{
//         userPhoto?: string;
//         logo?: string;
//         userName?: string;
//         companyName?: string;
//     } | null>(null);
//     const [loading, setLoading] = useState(true);

//     // Hide header on notifications page
//     const isNotificationsPage = pathname?.includes('/notifications');
    
//     useEffect(() => {
//         fetchUserProfile();
//     }, []);

//     const fetchUserProfile = async () => {
//         try {
//             const profile = await companyAPI.getProfile();
//             setUserProfile({
//                 userPhoto: profile.userPhoto,
//                 logo: profile.logo,
//                 userName: profile.userName,
//                 companyName: profile.companyName,
//             });
//         } catch (error) {
//             console.error('Error fetching user profile:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Don't render header on notifications page
//     if (isNotificationsPage) {
//         return null;
//     }

//     // Determine which image to display (prioritize userPhoto, fallback to logo)
//     const displayImage = userProfile?.userPhoto || userProfile?.logo;
//     const displayInitial = (userProfile?.userName || userProfile?.companyName || 'B').charAt(0).toUpperCase();

//     return (
//         <View style={styles.headerWrapper}>
//             <View style={styles.headerContainer}>
//                 <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
//                     <View style={styles.headerContent}>
//                         <Text style={styles.headerTitle}>bizzap</Text>

//                         <View style={styles.headerRight}>
//                             <TouchableOpacity 
//                                 style={styles.headerIcon}
//                                 onPress={() => router.push('/(app)/search')}
//                             >
//                                 <Search size={sizeScale(24)} color="#fff" strokeWidth={2} />
//                             </TouchableOpacity>

//                             <TouchableOpacity 
//                                 style={styles.headerIcon}
//                                 onPress={() => router.push('/(app)/dashboard/notifications')}
//                             >
//                                 <Bell size={sizeScale(24)} color="#fff" strokeWidth={2} />
//                             </TouchableOpacity>

//                             <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
//                                 {loading ? (
//                                     <View style={styles.headerProfileImage}>
//                                         <ActivityIndicator size="small" color="#fff" />
//                                     </View>
//                                 ) : displayImage ? (
//                                     <Image
//                                         source={{ uri: displayImage }}
//                                         style={styles.headerProfileImage}
//                                     />
//                                 ) : (
//                                     <View style={[styles.headerProfileImage, styles.profilePlaceholder]}>
//                                         <Text style={styles.profileInitial}>{displayInitial}</Text>
//                                     </View>
//                                 )}
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </SafeAreaView>
//             </View>
//         </View>
//     );
// }

// // This is a Stack Layout for the dashboard screens with custom header
// export default function DashboardLayout() {
//   return (
//     <>
//       <CustomHeader />
//       <Stack screenOptions={{ headerShown: false }} />
//     </>
//   );
// }

// // --- Stylesheet ---
// const styles = StyleSheet.create({
//     // Header Styles
//     headerWrapper: {
//         position: 'absolute', 
//         top: 0,
//         left: 0,
//         right: 0,
//         zIndex: 1000,
//     },
//     headerContainer: {
//         backgroundColor: 'rgba(0, 0, 0, 0.85)',
//         marginHorizontal: sizeScale(10),
//         marginTop: Platform.OS === 'ios' ? sizeScale(50) : sizeScale(10),
//         borderRadius: sizeScale(20),
//         overflow: 'hidden',
//     },
//     headerSafeArea: {
//         backgroundColor: 'transparent',
//     },
//     headerContent: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: sizeScale(20),
//         paddingVertical: sizeScale(12),
//     },
//     headerTitle: {
//         fontSize: sizeScale(28),
//         fontWeight: 'bold',
//         color: '#fff',
//         letterSpacing: sizeScale(0.5),
//         fontFamily: 'Nunito',
//     },
//     headerRight: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: sizeScale(16),
//     },
//     headerIcon: {
//         padding: sizeScale(4),
//     },
//     headerProfileImage: {
//         width: sizeScale(40),
//         height: sizeScale(40),
//         borderRadius: sizeScale(20),
//         backgroundColor: '#ccc',
//         borderWidth: sizeScale(2),
//         borderColor: 'rgba(255, 255, 255, 0.3)',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     profilePlaceholder: {
//         backgroundColor: '#8b5cf6',
//     },
//     profileInitial: {
//         fontSize: sizeScale(16),
//         fontWeight: '700',
//         color: '#fff',
//     },
// });



// app/(app)/dashboard/_layout.tsx

import { Stack, useRouter, usePathname } from 'expo-router';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell } from 'lucide-react-native';
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

    // Hide header on notifications page
    const isNotificationsPage = pathname?.includes('/notifications');
    
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

    // Don't render header on notifications page
    if (isNotificationsPage) {
        return null;
    }

    // Determine which image to display (prioritize userPhoto, fallback to logo)
    const displayImage = userProfile?.userPhoto || userProfile?.logo;
    const displayInitial = (userProfile?.userName || userProfile?.companyName || 'B').charAt(0).toUpperCase();

    return (
        <View style={styles.headerWrapper}>
            <View style={styles.headerContainer}>
                <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>bizzap</Text>

                        <View style={styles.headerRight}>
                            {/* SEARCH NAVIGATION CODE STARTS HERE */}
                            <TouchableOpacity 
                                style={styles.headerIcon}
                                onPress={() => router.push('/(app)/search')}
                            >
                                <Search size={sizeScale(24)} color="#fff" strokeWidth={2} />
                            </TouchableOpacity>
                            {/* SEARCH NAVIGATION CODE ENDS HERE */}

                            <TouchableOpacity 
                                style={styles.headerIcon}
                                onPress={() => router.push('/(app)/dashboard/notifications')}
                            >
                                <Bell size={sizeScale(24)} color="#fff" strokeWidth={2} />
                            </TouchableOpacity>

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
                                    <View style={[styles.headerProfileImage, styles.profilePlaceholder]}>
                                        <Text style={styles.profileInitial}>{displayInitial}</Text>
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
    // Header Styles
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
    headerIcon: {
        padding: sizeScale(4),
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
    profilePlaceholder: {
        backgroundColor: '#8b5cf6',
    },
    profileInitial: {
        fontSize: sizeScale(16),
        fontWeight: '700',
        color: '#fff',
    },
});