
// ============================================
// FILE 2: app/(app)/profile/index.tsx
// ============================================

import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Menu Item Component ---
interface MenuItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    rightText?: string;
    onPress: () => void;
    showArrow?: boolean;
}

function MenuItem({ icon, title, subtitle, rightText, onPress, showArrow = true }: MenuItemProps) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
                <Feather name={icon as any} size={sizeScale(24)} color="#fff" />
                <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{title}</Text>
                    {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <View style={styles.menuItemRight}>
                {rightText && <Text style={styles.menuItemRightText}>{rightText}</Text>}
                {showArrow && (
                    <Feather name="chevron-right" size={sizeScale(20)} color="#666" />
                )}
            </View>
        </TouchableOpacity>
    );
}

// --- Section Header Component ---
function SectionHeader({ title }: { title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );
}

// --- Main Profile Component ---
export default function ProfileScreen() {
    const router = useRouter();

    const handleExternalLink = (url: string) => {
        Linking.openURL(url).catch(err => 
            console.error('Failed to open URL:', err)
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings and activity</Text>
            </View>

            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Feather name="search" size={sizeScale(18)} color="#666" />
                    <Text style={styles.searchPlaceholder}>Search</Text>
                </View>

                {/* Your Account Section */}
                <SectionHeader title="Your account" />
                
                <View style={styles.accountHeader}>
                    <Feather name="info" size={sizeScale(16)} color="#0095f6" />
                    <Text style={styles.metaText}>Bizzap</Text>
                </View>

                <MenuItem
                    icon="user"
                    title="Accounts Center"
                    subtitle="Password, security, personal details, ad preferences"
                    onPress={() => router.push('/profile/accounts-center')}
                />

                <Text style={styles.infoText}>
                    Manage your connected experiences and account settings across Bizzap technologies.{' '}
                    <Text style={styles.linkText}>Learn more</Text>
                </Text>

                {/* How you use Bizzap Section */}
                <SectionHeader title="How you use Bizzap" />
                
                <MenuItem
                    icon="bookmark"
                    title="Saved"
                    onPress={() => router.push('/(app)/profile/saved')}
                />
                
                <MenuItem
                    icon="file-text"
                    title="My Leads"
                    onPress={() => router.push('/(app)/profile/my_leads')}
                />
                
                <MenuItem
                    icon="credit-card"
                    title="Payment History"
                    onPress={() => router.push('/profile/payment_history')}
                />
                
                <MenuItem
                    icon="bell"
                    title="Notifications"
                    onPress={() => router.push('/profile/notifications')}
                />

                {/* More Options Section */}
                <SectionHeader title="More options" />
                
                <MenuItem
                    icon="help-circle"
                    title="Help"
                    subtitle="Get assistance and support"
                    onPress={() => handleExternalLink('https://chatgpt.com')}
                />
                
                <MenuItem
                    icon="info"
                    title="About"
                    subtitle="Learn more about Bizzap"
                    onPress={() => handleExternalLink('https://chatgpt.com')}
                    showArrow={false}
                />

                {/* Bottom Padding for Fixed Tab Bar */}
                <View style={styles.bottomPadding} />
            </ScrollView>
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
        paddingHorizontal: sizeScale(16),
        paddingVertical: sizeScale(12),
        paddingTop: sizeScale(50),
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerTitle: {
        fontSize: sizeScale(24),
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        marginHorizontal: sizeScale(16),
        marginTop: sizeScale(16),
        marginBottom: sizeScale(8),
        paddingHorizontal: sizeScale(12),
        paddingVertical: sizeScale(10),
        borderRadius: sizeScale(10),
        gap: sizeScale(8),
    },
    searchPlaceholder: {
        fontSize: sizeScale(16),
        color: '#666',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: sizeScale(20),
    },
    sectionHeader: {
        paddingHorizontal: sizeScale(16),
        paddingTop: sizeScale(20),
        paddingBottom: sizeScale(8),
    },
    sectionHeaderText: {
        fontSize: sizeScale(13),
        color: '#666',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: sizeScale(0.5),
    },
    accountHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: sizeScale(16),
        paddingBottom: sizeScale(8),
        gap: sizeScale(6),
    },
    metaText: {
        fontSize: sizeScale(14),
        color: '#0095f6',
        fontWeight: '600',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: sizeScale(16),
        paddingVertical: sizeScale(12),
        backgroundColor: '#000',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(16),
        flex: 1,
    },
    menuItemText: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: sizeScale(16),
        color: '#fff',
        fontWeight: '400',
    },
    menuItemSubtitle: {
        fontSize: sizeScale(13),
        color: '#666',
        marginTop: sizeScale(2),
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(8),
    },
    menuItemRightText: {
        fontSize: sizeScale(14),
        color: '#666',
    },
    infoText: {
        fontSize: sizeScale(13),
        color: '#666',
        paddingHorizontal: sizeScale(16),
        paddingVertical: sizeScale(12),
        lineHeight: sizeScale(18),
    },
    linkText: {
        color: '#0095f6',
    },
    bottomPadding: {
        height: sizeScale(120),
    },
});

