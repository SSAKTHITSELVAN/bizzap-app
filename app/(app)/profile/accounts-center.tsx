import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
    StatusBar,
    Share,
    ActivityIndicator,
    ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { companyAPI } from '../../../services/user';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Assets & Constants ---
const DEFAULT_COVER = 'https://via.placeholder.com/390x200/000000/000000?text='; 
const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/150/1a1a1a/666?text=Logo';

// Colors from the design
const COLORS = {
    bg: '#000000',
    cardBg: '#0A0A0A',
    cardBorder: '#1F1F1F',
    textWhite: '#FFFFFF',
    textGrey: '#888888',
    cyan: '#00E0FF', // Glow color
    blueLink: '#2980b9'
};

export default function AccountsCenterScreen() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);

    useFocusEffect(
        React.useCallback(() => {
            loadAllData();
        }, [])
    );

    const loadAllData = async () => {
        try {
            setLoading(true);
            // Removed followers/following/leads APIs as stats are no longer displayed
            const profileRes = await companyAPI.getProfile();
            setProfileData(profileRes);
            
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error('Data load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => router.back();
    const handleEdit = () => router.push('/profile/edit-profile');
    
    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${user?.companyName || 'my profile'} on Bizzap!`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const displayData = profileData || user || {};
    const avatarImage = displayData.logo || displayData.userPhoto || PLACEHOLDER_AVATAR;
    
    const hasCustomCover = !!displayData.coverImage;
    const coverImageSource = hasCustomCover ? { uri: displayData.coverImage } : { uri: DEFAULT_COVER };

    if (loading && !profileData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.cyan} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Simulated Grid Background */}
            <View style={styles.gridBackground}>
                {/* Vertical Lines */}
                {[...Array(10)].map((_, i) => (
                    <View key={`v-${i}`} style={[styles.gridLineVertical, { left: i * (SCREEN_WIDTH / 8) }]} />
                ))}
                {/* Horizontal Lines */}
                {[...Array(15)].map((_, i) => (
                    <View key={`h-${i}`} style={[styles.gridLineHorizontal, { top: i * 60 }]} />
                ))}
            </View>

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* --- HEADER SECTION --- */}
                <View style={styles.headerContainer}>
                    {/* Header Image / Horizon */}
                    <View style={styles.horizonWrapper}>
                        {hasCustomCover ? (
                            <Image source={coverImageSource} style={styles.coverImage} resizeMode="cover" />
                        ) : (
                            // CSS-based Planet Horizon Simulation
                            <View style={styles.simulatedHorizonContainer}>
                                <LinearGradient
                                    colors={['rgba(0,0,0,1)', '#001a33', '#003366', '#000000']}
                                    locations={[0, 0.4, 0.8, 1]}
                                    style={styles.horizonGradient}
                                />
                                <View style={styles.glowingArc} />
                            </View>
                        )}
                        
                        {/* Overlay to blend bottom into black */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
                            style={styles.bottomFade}
                        />
                    </View>

                    {/* Navbar Buttons */}
                    <View style={styles.navbar}>
                        <TouchableOpacity onPress={handleBack} style={styles.navButton}>
                            <Feather name="chevron-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.navActions}>
                            <TouchableOpacity onPress={handleEdit} style={styles.navButton}>
                                <Feather name="edit-2" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleShare} style={styles.navButton}>
                                <Ionicons name="share-social-outline" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Avatar - Centered & Overlapping Horizon */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <Image source={{ uri: avatarImage }} style={styles.avatar} />
                            {/* Inner Shine Effect */}
                            <LinearGradient
                                colors={['rgba(255,255,255,0.1)', 'transparent']}
                                style={StyleSheet.absoluteFill}
                            />
                        </View>
                        <TouchableOpacity onPress={handleEdit}>
                            <Text style={styles.changeProfileText}>Change Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- MAIN CARD (Updated: Removed Stats Row) --- */}
                <View style={styles.cardContainer}>
                    <LinearGradient
                        colors={[COLORS.cardBorder, 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 0.5 }}
                        style={styles.cardBorderGradient}
                    >
                        <View style={styles.cardInner}>
                            {/* Row 1: Names Only */}
                            <View style={styles.namesRow}>
                                <View style={styles.nameCol}>
                                    <Text style={styles.labelSmall}>Company Name</Text>
                                    <Text style={styles.nameText} numberOfLines={2}>
                                        {displayData.companyName || 'Company Name'}
                                    </Text>
                                </View>
                                <View style={styles.verticalDivider} />
                                <View style={styles.nameCol}>
                                    <Text style={styles.labelSmall}>User Name</Text>
                                    <Text style={styles.nameText} numberOfLines={2}>
                                        {displayData.userName || 'User Name'}
                                    </Text>
                                </View>
                            </View>

                            {/* Removed Horizontal Divider & Stats Row */}
                        </View>
                    </LinearGradient>
                </View>

                {/* --- DETAILS LIST --- */}
                <View style={styles.detailsList}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>GST Number</Text>
                        <Text style={styles.detailValue}>{displayData.gstNumber || '2357AGYHF123568'}</Text>
                    </View>
                    <View style={styles.detailDivider} />

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>PAN</Text>
                        <Text style={styles.detailValue}>{displayData.panNumber || 'JPR56478'}</Text>
                    </View>
                    <View style={styles.detailDivider} />

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Address</Text>
                        <Text style={styles.detailValue} numberOfLines={2}>
                            {displayData.address || '123, MG Road, Chennai - 600001'}
                        </Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // --- Background Grid ---
    gridBackground: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
        opacity: 0.1,
    },
    gridLineVertical: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: '#333',
    },
    gridLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#333',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: sizeScale(40),
    },
    
    // --- Header & Horizon ---
    headerContainer: {
        width: '100%',
        height: sizeScale(240),
        position: 'relative',
    },
    horizonWrapper: {
        width: '100%',
        height: sizeScale(180),
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    simulatedHorizonContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        overflow: 'hidden',
        alignItems: 'center',
    },
    horizonGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    glowingArc: {
        width: SCREEN_WIDTH * 1.5,
        height: SCREEN_WIDTH * 1.5,
        borderRadius: SCREEN_WIDTH,
        borderTopWidth: 2,
        borderColor: 'rgba(60, 150, 255, 0.5)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        position: 'absolute',
        top: sizeScale(80),
        shadowColor: '#0088ff',
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
    },
    bottomFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: sizeScale(60),
        zIndex: 2,
    },
    
    // --- Navbar ---
    navbar: {
        position: 'absolute',
        top: sizeScale(40),
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: sizeScale(16),
        zIndex: 10,
    },
    navButton: {
        padding: 8,
    },
    navActions: {
        flexDirection: 'row',
        gap: 16,
    },

    // --- Avatar Section ---
    avatarSection: {
        position: 'absolute',
        top: sizeScale(100),
        width: '100%',
        alignItems: 'center',
        zIndex: 20,
    },
    avatarWrapper: {
        width: sizeScale(100),
        height: sizeScale(100),
        borderRadius: sizeScale(50),
        borderWidth: 2,
        borderColor: COLORS.cyan,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.cyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
        marginBottom: sizeScale(10),
    },
    avatar: {
        width: sizeScale(92),
        height: sizeScale(92),
        borderRadius: sizeScale(46),
    },
    changeProfileText: {
        color: COLORS.blueLink,
        fontSize: sizeScale(13),
        fontWeight: '500',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // --- Main Card ---
    cardContainer: {
        marginTop: sizeScale(10),
        marginHorizontal: sizeScale(16),
        borderRadius: sizeScale(16),
        zIndex: 5,
    },
    cardBorderGradient: {
        borderRadius: sizeScale(16),
        padding: 1, // Border width
    },
    cardInner: {
        backgroundColor: COLORS.cardBg,
        borderRadius: sizeScale(15),
        paddingVertical: sizeScale(20),
        paddingHorizontal: sizeScale(16),
    },
    namesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // marginBottom removed since stats are gone
    },
    nameCol: {
        flex: 1,
        paddingHorizontal: 8,
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#333',
        height: '100%',
    },
    labelSmall: {
        color: '#666',
        fontSize: sizeScale(11),
        marginBottom: 4,
    },
    nameText: {
        color: '#fff',
        fontSize: sizeScale(15),
        fontWeight: '700',
    },
    
    // --- Details List ---
    detailsList: {
        marginTop: sizeScale(24),
        paddingHorizontal: sizeScale(24),
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: sizeScale(12),
    },
    detailLabel: {
        color: '#666',
        fontSize: sizeScale(13),
        fontWeight: '500',
        flex: 0.35,
    },
    detailValue: {
        color: '#fff',
        fontSize: sizeScale(13),
        fontWeight: '500',
        textAlign: 'right',
        flex: 0.65,
    },
    detailDivider: {
        height: 1,
        backgroundColor: '#1F1F1F',
        width: '100%',
    },
});