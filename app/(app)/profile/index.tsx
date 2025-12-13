// // ============================================
// // FILE 2: app/(app)/profile/index.tsx 
// // ============================================

// import React, { useState, useMemo } from 'react'; // ADDED useMemo
// import {
//     View,
//     Text,
//     ScrollView,
//     TouchableOpacity,
//     StyleSheet,
//     Dimensions,
//     Linking,
//     TextInput, // ADDED TextInput
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Feather } from '@expo/vector-icons';

// // --- Responsive Sizing Utility ---
// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const STANDARD_WIDTH = 390;
// const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// // --- Menu Item Data Structure ---
// // Define a structure for all menu items for easy filtering
// interface MenuItemType {
//     id: string;
//     section: 'Account' | 'Activity' | 'Support';
//     icon: string;
//     title: string;
//     subtitle?: string;
//     rightText?: string;
//     route: string;
//     isExternal?: boolean;
//     showArrow?: boolean;
// }

// // --- ALL MENU ITEM DATA ---
// const ALL_MENU_ITEMS: MenuItemType[] = [
//     // Account and tools
//     { id: '1', section: 'Account', icon: 'lock', title: 'Privacy & Security Center', subtitle: 'Password, security, personal details', route: '/profile/accounts-center' },
//     // Activity and business
//     { id: '2', section: 'Activity', icon: 'heart', title: 'Favorites & Saved', route: '/(app)/profile/saved' },
//     { id: '3', section: 'Activity', icon: 'briefcase', title: 'My Leads / Inbox', route: '/(app)/profile/my_leads' },
//     { id: '4', section: 'Activity', icon: 'credit-card', title: 'Payment History', rightText: 'View', route: '/profile/payment_history' },
//     { id: '5', section: 'Activity', icon: 'shopping-bag', title: 'My Products & Offerings', route: '/profile/my_products' },
//     { id: '6', section: 'Activity', icon: 'bell', title: 'Push Notifications', route: '/profile/notifications' },
//     // Support and about
//     { id: '7', section: 'Support', icon: 'help-circle', title: 'Help Center', subtitle: 'Get assistance and support', route: 'https://chatgpt.com/support', isExternal: true },
//     { id: '8', section: 'Support', icon: 'info', title: 'About Bizzap', subtitle: 'Terms, policies, and app version', route: 'https://chatgpt.com/about', isExternal: true, showArrow: false },
//     { id: '9', section: 'Support', icon: 'log-out', title: 'Log out', route: 'logout', showArrow: false }, // Placeholder route
// ];

// // --- Menu Item Component ---
// interface MenuItemProps {
//     icon: string;
//     title: string;
//     subtitle?: string;
//     rightText?: string;
//     onPress: () => void;
//     showArrow?: boolean;
// }

// function MenuItem({ icon, title, subtitle, rightText, onPress, showArrow = true }: MenuItemProps) {
//     return (
//         <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
//             <View style={styles.menuItemLeft}>
//                 <Feather name={icon as any} size={sizeScale(24)} color="#fff" />
//                 <View style={styles.menuItemText}>
//                     <Text style={styles.menuItemTitle}>{title}</Text>
//                     {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
//                 </View>
//             </View>
//             <View style={styles.menuItemRight}>
//                 {rightText && <Text style={styles.menuItemRightText}>{rightText}</Text>}
//                 {showArrow && (
//                     <Feather name="chevron-right" size={sizeScale(20)} color="#888" />
//                 )}
//             </View>
//         </TouchableOpacity>
//     );
// }

// // --- Section Header Component ---
// function SectionHeader({ title }: { title: string }) {
//     return (
//         <View style={styles.sectionHeader}>
//             <Text style={styles.sectionHeaderText}>{title}</Text>
//         </View>
//     );
// }

// // --- Main Profile Component ---
// export default function ProfileScreen() {
//     const router = useRouter();
//     const [searchQuery, setSearchQuery] = useState(''); // ADDED State for search query

//     const handleExternalLink = (url: string) => {
//         Linking.openURL(url).catch(err => 
//             console.error('Failed to open URL:', err)
//         );
//     };

//     const handleMenuItemPress = (item: MenuItemType) => {
//         if (item.isExternal) {
//             handleExternalLink(item.route);
//         } else if (item.route === 'logout') {
//             console.log('Logout action triggered');
//         } else {
//             // Use original route names as requested
//             router.push(item.route as any); 
//         }
//     };
    
//     // Filtering logic using useMemo to optimize performance
//     const filteredMenuItems = useMemo(() => {
//         if (!searchQuery) {
//             return ALL_MENU_ITEMS;
//         }
//         const lowerCaseQuery = searchQuery.toLowerCase();
//         return ALL_MENU_ITEMS.filter(item => 
//             item.title.toLowerCase().includes(lowerCaseQuery) ||
//             (item.subtitle && item.subtitle.toLowerCase().includes(lowerCaseQuery))
//         );
//     }, [searchQuery]);

//     // Group filtered items by section
//     const groupedItems = filteredMenuItems.reduce((acc, item) => {
//         acc[item.section] = acc[item.section] || [];
//         acc[item.section].push(item);
//         return acc;
//     }, {} as Record<string, MenuItemType[]>);


//     // Determine which sections to render
//     const sections = Object.keys(groupedItems);
    
//     // Map section names back to their display titles
//     const sectionTitleMap: Record<string, string> = {
//         'Account': 'Account and tools',
//         'Activity': 'Activity and business',
//         'Support': 'Support and about',
//     };


//     return (
//         <View style={styles.container}>
//             <View style={styles.header}>
//                 <Text style={styles.headerTitle}>Settings and privacy</Text>
//             </View>

//             <ScrollView 
//                 style={styles.scrollView}
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={styles.scrollContent}
//             >
//                 {/* Search Bar (Now a functional TextInput) */}
//                 <View style={styles.searchContainer}>
//                     <Feather name="search" size={sizeScale(18)} color="#888" />
//                     <TextInput
//                         style={styles.searchInput} // Use new style for TextInput
//                         placeholder="Search settings"
//                         placeholderTextColor="#888"
//                         value={searchQuery}
//                         onChangeText={setSearchQuery} // Update state on text change
//                         clearButtonMode="while-editing"
//                     />
//                 </View>

//                 {/* Render Filtered Menu Items */}
//                 {sections.map((sectionKey) => {
//                     const sectionTitle = sectionTitleMap[sectionKey];
//                     const itemsInSection = groupedItems[sectionKey];
                    
//                     if (itemsInSection.length === 0) return null;

//                     return (
//                         <React.Fragment key={sectionKey}>
//                             <SectionHeader title={sectionTitle} />
//                             {itemsInSection.map(item => (
//                                 <MenuItem
//                                     key={item.id}
//                                     icon={item.icon}
//                                     title={item.title}
//                                     subtitle={item.subtitle}
//                                     rightText={item.rightText}
//                                     showArrow={item.showArrow}
//                                     onPress={() => handleMenuItemPress(item)}
//                                 />
//                             ))}
//                         </React.Fragment>
//                     );
//                 })}

//                 {/* Show a message if no results are found */}
//                 {sections.length === 0 && searchQuery.length > 0 && (
//                     <View style={styles.noResultsContainer}>
//                         <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
//                     </View>
//                 )}


//                 {/* Bottom Padding for Fixed Tab Bar */}
//                 <View style={styles.bottomPadding} />
//             </ScrollView>
//         </View>
//     );
// }

// // --- Stylesheet (Updated for functional search and No Results) ---
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#000',
//     },
//     header: {
//         paddingHorizontal: sizeScale(16),
//         paddingVertical: sizeScale(12),
//         paddingTop: sizeScale(50),
//         backgroundColor: '#000',
//         alignItems: 'center', 
//     },
//     headerTitle: {
//         fontSize: sizeScale(20), 
//         fontWeight: '600',
//         color: '#fff',
//     },
//     searchContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#1c1c1c', 
//         marginHorizontal: sizeScale(16),
//         marginTop: sizeScale(16),
//         marginBottom: sizeScale(8),
//         paddingHorizontal: sizeScale(12),
//         paddingVertical: sizeScale(4), // Slightly less vertical padding for TextInput
//         borderRadius: sizeScale(8), 
//         gap: sizeScale(8),
//     },
//     searchInput: { // NEW style for TextInput
//         flex: 1,
//         fontSize: sizeScale(16),
//         color: '#fff', // White text input color
//         paddingVertical: sizeScale(6), // Add back some internal padding
//     },
//     searchPlaceholder: {
//         // This style is no longer used, kept for reference but will be ignored by TextInput
//         fontSize: sizeScale(16),
//         color: '#888', 
//     },
//     scrollView: {
//         flex: 1,
//     },
//     scrollContent: {
//         paddingBottom: sizeScale(20),
//     },
//     sectionHeader: {
//         paddingHorizontal: sizeScale(16),
//         paddingTop: sizeScale(24), 
//         paddingBottom: sizeScale(8),
//     },
//     sectionHeaderText: {
//         fontSize: sizeScale(14), 
//         color: '#888', 
//         fontWeight: 'bold',
//     },
//     menuItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: sizeScale(16),
//         paddingVertical: sizeScale(14), 
//         backgroundColor: '#000',
//     },
//     menuItemLeft: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: sizeScale(16),
//         flex: 1,
//     },
//     menuItemText: {
//         flex: 1,
//     },
//     menuItemTitle: {
//         fontSize: sizeScale(16),
//         color: '#fff',
//         fontWeight: '400',
//     },
//     menuItemSubtitle: {
//         fontSize: sizeScale(13),
//         color: '#888', 
//         marginTop: sizeScale(2),
//     },
//     menuItemRight: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: sizeScale(8),
//     },
//     menuItemRightText: {
//         fontSize: sizeScale(14),
//         color: '#888', 
//     },
//     // NEW styles for No Results message
//     noResultsContainer: {
//         padding: sizeScale(30),
//         alignItems: 'center',
//     },
//     noResultsText: {
//         fontSize: sizeScale(16),
//         color: '#888',
//     },
//     bottomPadding: {
//         height: sizeScale(120),
//     },
// });



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
    SafeAreaView,
    StatusBar,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Placeholder for Avatar ---
const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/1a1a1a/666?text=User';

// --- Menu Item Component ---
interface MenuItemProps {
    icon: keyof typeof Feather.glyphMap;
    iconColor: string;
    iconBgColor?: string;
    title: string;
    onPress: () => void;
}

function MenuItem({ icon, iconColor, title, onPress }: MenuItemProps) {
    return (
        <TouchableOpacity 
            style={styles.menuItem} 
            onPress={onPress} 
            activeOpacity={0.7}
        >
            <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#111315' }]}>
                    <Feather name={icon} size={sizeScale(20)} color={iconColor} />
                </View>
                <Text style={styles.menuItemTitle}>{title}</Text>
            </View>
            <Feather name="chevron-right" size={sizeScale(20)} color="#666" />
        </TouchableOpacity>
    );
}

// --- Bottom Grid Card Component ---
interface InfoCardProps {
    icon: any;
    title: string;
    subtitle: string;
    onPress: () => void;
    iconColor?: string;
}

function InfoCard({ icon, title, subtitle, onPress, iconColor = "#fff" }: InfoCardProps) {
    return (
        <TouchableOpacity style={styles.infoCard} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.infoCardHeader}>
                {icon}
            </View>
            <Text style={styles.infoCardTitle}>{title}</Text>
            <Text style={styles.infoCardSubtitle}>{subtitle}</Text>
        </TouchableOpacity>
    );
}

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth(); // Assuming useAuth provides user data and logout function

    // --- Actions ---

    const handleNavigation = (route: string) => {
        router.push(route as any);
    };

    const handleExternalLink = (url: string) => {
        Linking.openURL(url).catch(err => 
            console.error('Failed to open URL:', err)
        );
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
                        if (logout) await logout();
                        router.replace('/(auth)/phone-entry');
                    }
                }
            ]
        );
    };

    // User Data Fallback
    const displayName = user?.userName || user?.companyName || 'Guest User';
    const displayAvatar = user?.userPhoto || user?.logo || PLACEHOLDER_IMG;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* --- 1. Header Profile Card --- */}
                <TouchableOpacity 
                    style={styles.profileHeaderCard}
                    onPress={() => handleNavigation('/profile/accounts-center')}
                    activeOpacity={0.9}
                >
                    <View style={styles.profileInfo}>
                        <Image 
                            source={{ uri: displayAvatar }} 
                            style={styles.avatar} 
                        />
                        <View style={styles.profileTextContainer}>
                            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
                            <View style={styles.viewProfileBadge}>
                                <Text style={styles.viewProfileText}>View profile</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.arrowCircle}>
                        <Feather name="chevron-right" size={sizeScale(20)} color="#fff" />
                    </View>
                </TouchableOpacity>

                {/* --- 2. Menu List --- */}
                <View style={styles.menuContainer}>
                    <MenuItem 
                        icon="zap" 
                        iconColor="#2DD4BF" // Teal
                        title="My Leads & Requirements" 
                        onPress={() => handleNavigation('/(app)/profile/my_leads')}
                    />
                    
                    <MenuItem 
                        icon="credit-card" 
                        iconColor="#3B82F6" // Blue
                        title="Payment History" 
                        onPress={() => handleNavigation('/profile/payment_history')}
                    />
                    
                    <MenuItem 
                        icon="package" 
                        iconColor="#60A5FA" // Light Blue
                        title="My products & offerings" 
                        onPress={() => handleNavigation('/profile/my_products')}
                    />
                    
                    <MenuItem 
                        icon="bookmark" 
                        iconColor="#2DD4BF" // Teal
                        title="Saved" 
                        onPress={() => handleNavigation('/(app)/profile/saved')}
                    />
                    
                    <MenuItem 
                        icon="bell" 
                        iconColor="#2DD4BF" // Teal
                        title="Push Notifications" 
                        onPress={() => handleNavigation('/profile/notifications')}
                    />
                </View>

                {/* --- 3. Bottom Grid (About & Help) --- */}
                <View style={styles.bottomGrid}>
                    <InfoCard 
                        icon={<Text style={{ fontSize: 24, fontWeight: '900', color: '#3B82F6' }}>b</Text>}
                        title="About Bizzap"
                        subtitle="Terms, policies and app versions"
                        onPress={() => handleExternalLink('https://bizzap.com/about')}
                    />
                    
                    <InfoCard 
                        icon={<Feather name="headphones" size={sizeScale(24)} color="#3B82F6" />}
                        title="Help Center"
                        subtitle="Get assistance and Support"
                        onPress={() => handleExternalLink('https://bizzap.com/support')}
                    />
                </View>

                {/* --- 4. Logout Button --- */}
                <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Feather name="log-out" size={sizeScale(18)} color="#EF4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
                
                <View style={styles.bottomSpacer} />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: sizeScale(20),
        paddingTop: sizeScale(10),
    },

    // --- Header Profile Card ---
    profileHeaderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#111315', // Subtle card bg
        borderRadius: sizeScale(24),
        padding: sizeScale(16),
        marginBottom: sizeScale(24),
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(16),
        flex: 1,
    },
    avatar: {
        width: sizeScale(56),
        height: sizeScale(56),
        borderRadius: sizeScale(28),
        backgroundColor: '#333',
    },
    profileTextContainer: {
        flex: 1,
    },
    profileName: {
        fontSize: sizeScale(18),
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: sizeScale(6),
    },
    viewProfileBadge: {
        backgroundColor: '#F97316', // Orange badge
        paddingHorizontal: sizeScale(12),
        paddingVertical: sizeScale(4),
        borderRadius: sizeScale(12),
        alignSelf: 'flex-start',
    },
    viewProfileText: {
        color: '#FFFFFF',
        fontSize: sizeScale(10),
        fontWeight: '700',
    },
    arrowCircle: {
        width: sizeScale(40),
        height: sizeScale(40),
        borderRadius: sizeScale(20),
        borderWidth: 2,
        borderColor: '#374151',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // --- Menu Items ---
    menuContainer: {
        marginBottom: sizeScale(24),
        gap: sizeScale(8),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: sizeScale(14),
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(16),
    },
    iconContainer: {
        width: sizeScale(36),
        height: sizeScale(36),
        borderRadius: sizeScale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemTitle: {
        fontSize: sizeScale(16),
        color: '#FFFFFF',
        fontWeight: '500',
    },

    // --- Bottom Grid ---
    bottomGrid: {
        flexDirection: 'row',
        gap: sizeScale(16),
        marginBottom: sizeScale(30),
    },
    infoCard: {
        flex: 1,
        backgroundColor: '#111315',
        borderRadius: sizeScale(16),
        padding: sizeScale(16),
        minHeight: sizeScale(140),
        justifyContent: 'space-between',
    },
    infoCardHeader: {
        marginBottom: sizeScale(12),
    },
    infoCardTitle: {
        fontSize: sizeScale(16),
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: sizeScale(4),
    },
    infoCardSubtitle: {
        fontSize: sizeScale(12),
        color: '#9CA3AF',
        lineHeight: sizeScale(16),
    },

    // --- Logout Button ---
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111315',
        paddingVertical: sizeScale(16),
        borderRadius: sizeScale(24),
        gap: sizeScale(8),
        marginBottom: sizeScale(20),
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: sizeScale(16),
        fontWeight: '600',
    },
    bottomSpacer: {
        height: sizeScale(40),
    },
});