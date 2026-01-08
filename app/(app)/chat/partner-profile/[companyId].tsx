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
    ActivityIndicator,
    Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { companyAPI } from '../../../../services/user';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

const DEFAULT_COVER = 'https://via.placeholder.com/390x200/000000/000000?text='; 
const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/150/1a1a1a/666?text=User';

const COLORS = {
    bg: '#000000',
    cardBg: '#0A0A0A',
    cardBorder: '#1F1F1F',
    textWhite: '#FFFFFF',
    textGrey: '#888888',
    cyan: '#00E0FF', 
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
    
    const generateProfileLink = () => {
        if (!companyId) return 'https://bizzap.app';
        return `https://bizzap.app/companies/${companyId}`;
    };

    const handleShare = async () => {
        try {
            const profileLink = generateProfileLink();
            const name = profileData?.companyName || profileData?.userName || 'Profile';
            
            const shareMessage = `📱 Check out ${name} on Bizzap!\n\n` +
                (profileData?.description ? `${profileData.description}\n\n` : '') +
                (profileData?.address ? `📍 ${profileData.address}\n\n` : '') +
                `View full profile: ${profileLink}`;

            await Share.share({
                message: shareMessage,
                title: `${name} - Bizzap Profile`,
                url: profileLink,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    // --- Image Logic ---
    const avatarImage = profileData?.logo || profileData?.userPhoto || PLACEHOLDER_AVATAR;
    const coverImageSource = profileData?.coverImage ? { uri: profileData.coverImage } : { uri: DEFAULT_COVER };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.cyan} />
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
                {/* --- HEADER SECTION --- */}
                <View style={styles.headerContainer}>
                    <View style={styles.horizonWrapper}>
                        <Image source={coverImageSource} style={styles.coverImage} resizeMode="cover" />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)', '#000000']}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>

                    {/* Navbar - Back Button */}
                    <View style={styles.navbar}>
                        <TouchableOpacity onPress={handleBack} style={styles.navButton}>
                            <Feather name="chevron-left" size={sizeScale(28)} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Avatar & Floating Actions */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <Image source={{ uri: avatarImage }} style={styles.avatar} />
                        </View>
                        
                        {/* Action Bar - Share Only for Partner */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity onPress={handleShare} style={styles.circleAction}>
                                <Ionicons name="share-social-outline" size={sizeScale(20)} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* --- BUSINESS CARD --- */}
                <View style={styles.cardContainer}>
                    <LinearGradient
                        colors={[COLORS.cardBorder, 'transparent']}
                        style={styles.cardBorderGradient}
                    >
                        <View style={styles.cardInner}>
                            <View style={styles.namesRow}>
                                <View style={styles.nameCol}>
                                    <Text style={styles.labelSmall}>Company Name</Text>
                                    <Text style={styles.nameText}>{profileData?.companyName || '---'}</Text>
                                </View>
                                <View style={styles.verticalDivider} />
                                <View style={styles.nameCol}>
                                    <Text style={styles.labelSmall}>User Name</Text>
                                    <Text style={styles.nameText}>{profileData?.userName || '---'}</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* --- DETAILS LIST --- */}
                <View style={styles.detailsList}>
                    <DetailItem label="GST Number" value={profileData?.gstNumber} />
                    <DetailItem label="Category" value={profileData?.category} />
                    {profileData?.description && (
                        <DetailItem label="About" value={profileData?.description} />
                    )}
                    <DetailItem label="Address" value={profileData?.address} isLast />
                </View>

                <View style={{ height: sizeScale(40) }} />
            </ScrollView>
        </View>
    );
}

// Helper Component
const DetailItem = ({ label, value, isLast }: any) => (
    <>
        <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue} numberOfLines={3}>{value || 'Not provided'}</Text>
        </View>
        {!isLast && <View style={styles.detailDivider} />}
    </>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    loadingContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: sizeScale(20) },
    
    // Header
    headerContainer: { width: '100%', height: sizeScale(280), position: 'relative' },
    horizonWrapper: { width: '100%', height: sizeScale(200), position: 'absolute', top: 0 },
    coverImage: { width: '100%', height: '100%' },
    
    navbar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? sizeScale(50) : sizeScale(30),
        left: sizeScale(16),
        zIndex: 50,
    },
    navButton: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: sizeScale(20),
        padding: 4,
    },

    // Avatar & Actions
    avatarSection: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        alignItems: 'center',
        zIndex: 20,
    },
    avatarWrapper: {
        width: sizeScale(110),
        height: sizeScale(110),
        borderRadius: sizeScale(55),
        borderWidth: 3,
        borderColor: COLORS.cyan,
        backgroundColor: '#000',
        padding: 2,
        shadowColor: COLORS.cyan,
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 12,
    },
    avatar: { width: '100%', height: '100%', borderRadius: sizeScale(55) },
    
    actionRow: {
        flexDirection: 'row',
        marginTop: sizeScale(15),
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: sizeScale(6),
        borderRadius: sizeScale(30),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    circleAction: {
        width: sizeScale(40),
        height: sizeScale(40),
        borderRadius: sizeScale(20),
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },

    // Card
    cardContainer: { marginTop: sizeScale(20), marginHorizontal: sizeScale(16) },
    cardBorderGradient: { borderRadius: sizeScale(16), padding: 1 },
    cardInner: {
        backgroundColor: COLORS.cardBg,
        borderRadius: sizeScale(15),
        padding: sizeScale(20),
    },
    namesRow: { flexDirection: 'row' },
    nameCol: { flex: 1, paddingHorizontal: sizeScale(10) },
    verticalDivider: { width: 1, backgroundColor: '#222', height: '100%' },
    labelSmall: { color: '#666', fontSize: sizeScale(11), marginBottom: 4, textTransform: 'uppercase' },
    nameText: { color: '#fff', fontSize: sizeScale(16), fontWeight: '700' },
    
    // Details
    detailsList: { marginTop: sizeScale(30), paddingHorizontal: sizeScale(24) },
    detailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: sizeScale(16) },
    detailLabel: { color: '#888', fontSize: sizeScale(14), flex: 0.3 },
    detailValue: { color: '#fff', fontSize: sizeScale(14), fontWeight: '600', textAlign: 'right', flex: 0.7 },
    detailDivider: { height: 1, backgroundColor: '#111' },
});