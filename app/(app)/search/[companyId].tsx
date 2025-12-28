// app/(app)/chat/partner-profile/[companyId].tsx

import React, { useState, useEffect } from 'react';
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
    ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { companyAPI } from '../../../services/user';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Assets & Constants ---
const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/150/1a1a1a/666?text=User';
const PLACEHOLDER_COVER = 'https://via.placeholder.com/390x150/0F1115/333333?text=Cover';

// Define Colors
const COLORS = {
    bg: '#000000',
    cardBg: '#0F1115',
    iconColor: '#8FA8CC',
    textWhite: '#FFFFFF',
    textBlue: '#589AFD',
    cardBorder: 'rgba(120, 120, 120, 0.2)',
    glassBg: 'rgba(255, 255, 255, 0.04)',
};

export default function PartnerProfileScreen() {
    const router = useRouter();
    const { companyId } = useLocalSearchParams<{ companyId: string }>();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        if (companyId) {
            loadPartnerData();
        }
    }, [companyId]);

    const loadPartnerData = async () => {
        try {
            setLoading(true);
            const data = await companyAPI.getCompanyById(companyId);
            setProfileData(data);
        } catch (error) {
            console.error('Partner profile load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => router.back();
    
    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${profileData?.companyName || 'this profile'} on Bizzap!`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    // --- Image Logic ---
    const avatarImage = profileData?.logo || profileData?.userPhoto || PLACEHOLDER_AVATAR;
    const coverImage = profileData?.coverImage || PLACEHOLDER_COVER;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0057D9" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* --- 1. Top Section (Cover + Back Button) --- */}
                <View style={styles.coverSection}>
                    <Image 
                        source={{ uri: coverImage }} 
                        style={styles.coverImage} 
                        resizeMode="cover" 
                    />
                    
                    {/* Back Button */}
                    <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
                        <Feather name="chevron-left" size={sizeScale(28)} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* --- 2. Main Depth Frame (Profile Card) --- */}
                <View style={styles.depthFrame}>
                    <View style={styles.cardBackground}>
                        
                        {/* Share Icon Only (No Edit) */}
                        <TouchableOpacity style={styles.iconShare} onPress={handleShare}>
                            <Ionicons name="share-social-outline" size={sizeScale(22)} color="#fff" />
                        </TouchableOpacity>

                        {/* Avatar */}
                        <View style={styles.avatarContainer}>
                            <Image 
                                source={{ uri: avatarImage }} 
                                style={styles.avatar} 
                                resizeMode="cover"
                            />
                        </View>

                        {/* Spacer where "Change Profile" used to be */}
                        <View style={{ height: sizeScale(16) }} />

                        {/* Info Glass Box */}
                        <View style={styles.glassInfoBox}>
                            <View style={styles.infoColumn}>
                                <Text style={styles.label}>Company Name</Text>
                                <Text style={styles.valueLarge} numberOfLines={1}>
                                    {profileData?.companyName || 'Unknown Company'}
                                </Text>
                            </View>

                            <View style={styles.verticalLine} />

                            <View style={styles.infoColumn}>
                                <Text style={styles.label}>Phone</Text>
                                <Text style={styles.valueLarge} numberOfLines={1}>
                                    {profileData?.phoneNumber || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* --- 3. Details Section --- */}
                <View style={styles.detailsContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Company Details</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelCol}>
                            <Text style={styles.detailLabel}>GST Number</Text>
                        </View>
                        <View style={styles.detailValueCol}>
                            <Text style={styles.detailValue}>{profileData?.gstNumber || 'Not Provided'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelCol}>
                            <Text style={styles.detailLabel}>Category</Text>
                        </View>
                        <View style={styles.detailValueCol}>
                            <Text style={styles.detailValue}>{profileData?.category || 'General'}</Text>
                        </View>
                    </View>

                    {profileData?.description && (
                        <View style={styles.detailRow}>
                            <View style={styles.detailLabelCol}>
                                <Text style={styles.detailLabel}>About</Text>
                            </View>
                            <View style={styles.detailValueCol}>
                                <Text style={styles.detailValue}>{profileData.description}</Text>
                            </View>
                        </View>
                    )}

                    <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: COLORS.cardBorder }]}>
                        <View style={styles.detailLabelCol}>
                            <Text style={styles.detailLabel}>Address</Text>
                        </View>
                        <View style={styles.detailValueCol}>
                            <Text style={styles.detailValue} numberOfLines={3}>
                                {profileData?.address || 'No address provided'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Spacer */}
                <View style={{ height: sizeScale(40) }} />
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: sizeScale(40),
    },
    // --- Cover Section ---
    coverSection: {
        height: sizeScale(150),
        width: '100%',
        position: 'relative',
        zIndex: 0,
    },
    coverImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
    },
    backButton: {
        position: 'absolute',
        top: sizeScale(50),
        left: sizeScale(16),
        width: sizeScale(40),
        height: sizeScale(40),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)', 
        borderRadius: sizeScale(20),
        zIndex: 20,
    },
    // --- Depth Frame ---
    depthFrame: {
        marginTop: sizeScale(-75),
        paddingHorizontal: sizeScale(16),
        width: '100%',
        zIndex: 1,
        position: 'relative',
    },
    cardBackground: {
        backgroundColor: COLORS.cardBg,
        borderRadius: sizeScale(8),
        paddingTop: sizeScale(18),
        paddingBottom: sizeScale(16),
        alignItems: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    iconShare: {
        position: 'absolute',
        top: sizeScale(16),
        right: sizeScale(16),
        zIndex: 10,
    },
    avatarContainer: {
        width: sizeScale(100),
        height: sizeScale(100),
        borderRadius: sizeScale(50),
        borderWidth: 4,
        borderColor: '#000',
        overflow: 'hidden',
        marginBottom: sizeScale(8),
        backgroundColor: '#1a1a1a', 
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: sizeScale(50),
    },
    // --- Glass Info Box ---
    glassInfoBox: {
        width: '92%',
        backgroundColor: COLORS.glassBg,
        borderRadius: sizeScale(10),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        padding: sizeScale(12),
    },
    infoColumn: {
        flex: 1,
        paddingHorizontal: sizeScale(4),
        alignItems: 'center',
    },
    verticalLine: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        height: '80%',
        alignSelf: 'center',
    },
    label: {
        color: COLORS.iconColor,
        fontSize: sizeScale(12),
        marginBottom: sizeScale(2),
    },
    valueLarge: {
        color: COLORS.textWhite,
        fontSize: sizeScale(16),
        fontWeight: '600',
    },
    // --- Details ---
    detailsContainer: {
        marginTop: sizeScale(24),
        marginHorizontal: sizeScale(16),
        backgroundColor: '#000',
        paddingVertical: sizeScale(8),
    },
    sectionHeader: {
        marginBottom: sizeScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
        paddingBottom: sizeScale(8),
    },
    sectionTitle: {
        color: COLORS.textWhite,
        fontSize: sizeScale(16),
        fontWeight: '600',
    },
    detailRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: COLORS.cardBorder,
        paddingVertical: sizeScale(14),
        alignItems: 'flex-start',
    },
    detailLabelCol: {
        width: sizeScale(100),
    },
    detailValueCol: {
        flex: 1,
        alignItems: 'flex-end',
    },
    detailLabel: {
        color: COLORS.iconColor,
        fontSize: sizeScale(14),
        fontWeight: '400',
    },
    detailValue: {
        color: COLORS.textWhite,
        fontSize: sizeScale(14),
        fontWeight: '400',
        textAlign: 'right',
        lineHeight: sizeScale(20),
    },
});