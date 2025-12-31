// app/(app)/profile/index.tsx
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Linking,
    Image,
    StatusBar,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Colors ---
const COLORS = {
    bg: '#000000',
    depthFrame: '#0F1623',
    orange: '#FF7A00',
    textWhite: '#FFFFFF',
    textSecondary: '#8FA8CC',
    iconBoxStart: 'rgba(0, 93, 212, 0.08)',
    iconBoxEnd: 'rgba(1, 190, 139, 0.08)',
    fallbackAvatarBg: '#0057D9',
};

// --- Components ---

interface MenuRowProps {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    onPress: () => void;
}

const MenuRow = ({ icon, title, onPress }: MenuRowProps) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.menuRowLeft}>
            <LinearGradient
                colors={[COLORS.iconBoxStart, COLORS.iconBoxEnd]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.menuIconContainer}
            >
                <Feather name={icon} size={sizeScale(20)} color="#fff" style={{ opacity: 0.9 }} />
            </LinearGradient>
            <Text style={styles.menuRowTitle}>{title}</Text>
        </View>
        <Feather name="chevron-right" size={sizeScale(18)} color={COLORS.textSecondary} />
    </TouchableOpacity>
);

interface InfoBlockProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
}

const InfoBlock = ({ icon, title, subtitle, onPress }: InfoBlockProps) => (
    <TouchableOpacity style={styles.infoBlock} onPress={onPress} activeOpacity={0.8}>
        {icon}
        <View style={styles.infoBlockTextContainer}>
            <Text style={styles.infoBlockTitle}>{title}</Text>
            <Text style={styles.infoBlockSubtitle}>{subtitle}</Text>
        </View>
    </TouchableOpacity>
);

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets(); // Access safe area insets

    // --- Data Logic ---
    const displayName = user?.companyName || user?.userName || 'User';
    const avatarUrl = user?.logo || user?.userPhoto; 

    // --- Actions ---
    const handleNavigation = (route: string) => {
        router.push(route as any);
    };

    const handleExternalLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (logout) {
                                await logout();
                            }
                        } catch (error) {
                            console.error('Logout error:', error);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* --- Header with Dynamic Top Padding --- */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + sizeScale(10) }]}>
                <View style={styles.headerSpacer} />
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* --- 1. Profile Card --- */}
                <LinearGradient
                    colors={['rgba(1, 185, 143, 0.12)', 'rgba(0, 93, 212, 0.03)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileCard}
                >
                    <TouchableOpacity
                        style={styles.profileCardContent}
                        onPress={() => handleNavigation('/profile/accounts-center')}
                        activeOpacity={0.9}
                    >
                        {/* Avatar Image Logic */}
                        <View style={styles.avatarContainer}>
                            {avatarUrl ? (
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={styles.avatarImage}
                                    resizeMode="cover"
                                    key={avatarUrl} 
                                />
                            ) : (
                                <View style={[styles.avatarImage, styles.avatarFallback]}>
                                    <Text style={styles.avatarLetter}>
                                        {displayName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName} numberOfLines={1}>
                                {displayName}
                            </Text>
                            <View style={styles.viewProfileBadge}>
                                <Text style={styles.viewProfileText}>View profile</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </LinearGradient>

                {/* --- 2. Menu Items --- */}
                <View style={styles.menuContainer}>
                    <MenuRow
                        icon="zap"
                        title="My Leads & Requirements"
                        onPress={() => handleNavigation('/(app)/profile/my_leads')}
                    />
                    <View style={styles.divider} />
                    <MenuRow
                        icon="bell"
                        title="Push Notifications"
                        onPress={() => handleNavigation('/profile/notifications')}
                    />
                </View>

                {/* --- 3. Info Blocks --- */}
                <View style={styles.infoRow}>
                    <InfoBlock
                        icon={
                            <View style={styles.bLogoContainer}>
                                <Text style={styles.bLogoText}>b</Text>
                            </View>
                        }
                        title="About Bizzap"
                        subtitle="Terms, policies and app versions"
                        onPress={() => handleExternalLink('https://bizzap.app/about')}
                    />

                    <InfoBlock
                        icon={<Feather name="headphones" size={sizeScale(24)} color="#0057D9" />}
                        title="Help Center"
                        subtitle="Get assistance and Support"
                        onPress={() => handleExternalLink('https://bizzap.app/support')}
                    />
                </View>

                {/* --- 4. Logout Button --- */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Feather name="log-out" size={sizeScale(16)} color="#FF383C" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: sizeScale(40) + insets.bottom }} />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.depthFrame,
        paddingHorizontal: sizeScale(16),
        paddingBottom: sizeScale(12),
    },
    headerSpacer: { width: sizeScale(48) },
    headerTitle: {
        fontSize: sizeScale(18),
        fontWeight: '700',
        color: COLORS.textWhite,
        textAlign: 'center',
    },
    scrollView: { flex: 1 },
    scrollContent: {
        paddingTop: sizeScale(20),
        alignItems: 'center',
    },
    // --- Profile Card ---
    profileCard: {
        width: '90%',
        borderRadius: sizeScale(20),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: sizeScale(24),
    },
    profileCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: sizeScale(12),
        paddingHorizontal: sizeScale(16),
        gap: sizeScale(14),
    },
    // --- Avatar Styles ---
    avatarContainer: {
        width: sizeScale(64),
        height: sizeScale(64),
        borderRadius: sizeScale(32),
        backgroundColor: '#333',
        overflow: 'hidden', 
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: sizeScale(32),
    },
    avatarFallback: {
        backgroundColor: COLORS.fallbackAvatarBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetter: {
        fontSize: sizeScale(28),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    profileInfo: {
        flex: 1,
        gap: sizeScale(4),
    },
    profileName: {
        fontSize: sizeScale(20),
        fontWeight: '600',
        color: COLORS.textWhite,
    },
    viewProfileBadge: {
        backgroundColor: COLORS.orange,
        borderRadius: sizeScale(23),
        paddingVertical: sizeScale(2),
        paddingHorizontal: sizeScale(12),
        alignSelf: 'flex-start',
    },
    viewProfileText: {
        color: COLORS.textWhite,
        fontSize: sizeScale(12),
        fontWeight: '500',
    },
    // --- Menu Items ---
    menuContainer: {
        width: '100%',
        paddingHorizontal: sizeScale(16),
        marginBottom: sizeScale(24),
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: sizeScale(12),
    },
    menuRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(12),
    },
    menuIconContainer: {
        width: sizeScale(40),
        height: sizeScale(40),
        borderRadius: sizeScale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuRowTitle: {
        fontSize: sizeScale(16),
        fontWeight: '500',
        color: COLORS.textWhite,
    },
    divider: {
        height: 1,
        backgroundColor: '#1F2937',
        opacity: 0,
    },
    // --- Info Grid ---
    infoRow: {
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: sizeScale(16),
        gap: sizeScale(14),
        marginBottom: sizeScale(30),
    },
    infoBlock: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: sizeScale(8),
        padding: sizeScale(12),
        gap: sizeScale(14),
    },
    // Updated 'b' icon styles
    bLogoContainer: {
        width: sizeScale(30),
        height: sizeScale(30),
        justifyContent: 'center',
        alignItems: 'center',
        // Optional: faint background to define the icon shape like others
        // backgroundColor: 'rgba(0, 87, 217, 0.1)', 
        // borderRadius: sizeScale(8),
    },
    bLogoText: {
        fontSize: sizeScale(28),
        fontWeight: '900',
        color: '#0057D9',
        lineHeight: sizeScale(32),
    },
    infoBlockTextContainer: {
        gap: sizeScale(6),
    },
    infoBlockTitle: {
        fontSize: sizeScale(18),
        fontWeight: '500',
        color: COLORS.textWhite,
    },
    infoBlockSubtitle: {
        fontSize: sizeScale(14),
        color: COLORS.textSecondary,
        lineHeight: sizeScale(20),
    },
    // --- Logout ---
    logoutButton: {
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#151A22',
        paddingVertical: sizeScale(14),
        borderRadius: sizeScale(30),
        gap: sizeScale(8),
        borderWidth: 1,
        borderColor: '#333',
    },
    logoutText: {
        color: COLORS.textWhite,
        fontSize: sizeScale(16),
        fontWeight: '600',
    },
});