// app/(app)/_layout.tsx

import { Tabs, usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, DeviceEventEmitter } from 'react-native';
import { Defs, LinearGradient, Path, Rect, Stop, Svg, Circle } from 'react-native-svg';
import { chatAPI, initializeChatSocket } from '../../services/chat-websocket';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const STANDARD_HEIGHT = 844;

const sizeScale = (size: number): number => {
    const widthScale = SCREEN_WIDTH / STANDARD_WIDTH;
    const heightScale = SCREEN_HEIGHT / STANDARD_HEIGHT;
    const scale = Math.max(widthScale, heightScale);
    return size * scale;
};

// --- Icon Components ---
const TwoUserIcon = ({ color }: { color: string }) => (
    <Svg width={sizeScale(24)} height={sizeScale(24)} viewBox="0 0 24 24" fill="none">
        <Path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3 21V19C3 17.9391 3.42143 16.9217 4.17157 16.1716C4.92172 15.4214 5.93913 15 7 15H11C12.0609 15 13.0783 15.4214 13.8284 16.1716C14.5786 16.9217 15 17.9391 15 19V21" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M21 21V19C20.9949 18.1172 20.6979 17.2608 20.1553 16.5644C19.6126 15.868 18.8548 15.3707 18 15.15" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
);

const SearchIcon = ({ color }: { color: string }) => (
    <Svg width={sizeScale(24)} height={sizeScale(24)} viewBox="0 0 24 24" fill="none">
        <Path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M21 21L16.65 16.65" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
);

const PlusIcon = () => (
    <Svg width={sizeScale(28)} height={sizeScale(28)} viewBox="0 0 32 32" fill="none">
        <Defs>
            <LinearGradient id="plusGrad" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="rgba(0, 93, 212, 1)" />
                <Stop offset="1" stopColor="rgba(1, 190, 139, 1)" />
            </LinearGradient>
        </Defs>
        <Rect x="2" y="2" width="28" height="28" rx="6" fill="url(#plusGrad)"/>
        <Path d="M16 11V21M11 16H21" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
);

const NotificationIcon = ({ color }: { color: string }) => (
    <Svg width={sizeScale(24)} height={sizeScale(24)} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
);

const ChatIcon = ({ color, hasUnread }: { color: string, hasUnread?: boolean }) => (
    <View>
        <Svg width={sizeScale(24)} height={sizeScale(24)} viewBox="0 0 24 24" fill="none">
            <Path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
        {hasUnread && <View style={styles.unreadDot} />}
    </View>
);

// --- Custom Tab Bar Component ---
interface CustomTabBarProps {
    state: any;
    descriptors: any;
    navigation: any;
    unreadCount: number;
}

function CustomTabBar({ state, descriptors, navigation, unreadCount }: CustomTabBarProps) {
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    
    // Hide tab bar on video screen
    useEffect(() => {
        const shouldHide = pathname?.includes('/posts/videos');
        setIsVisible(!shouldHide);
    }, [pathname]);
    
    // Determine active tab based on current route
    const getActiveIndex = () => {
        const currentRoute = segments[segments.length - 1] || segments[segments.length - 2];
        
        if (currentRoute === 'dashboard') return 0;
        if (currentRoute === 'search') return 1;
        if (currentRoute === 'bizzapai') return 2;
        if (currentRoute === 'notification') return 3;
        if (currentRoute === 'chat') return 4;
        
        return state.index;
    };

    const activeIndex = getActiveIndex();

    if (!isVisible) {
        return null;
    }

    return (
        <View style={styles.tabBarWrapper}>
            <View style={styles.tabBarContainer}>
                <View style={styles.tabBarContent}>
                    <TabButton
                        icon={() => <TwoUserIcon color={activeIndex === 0 ? '#FFFFFF' : '#8FA8CC'} />}
                        label="Lead"
                        isFocused={activeIndex === 0}
                        onPress={() => router.push('/(app)/dashboard')}
                    />
                    <TabButton
                        icon={() => <SearchIcon color={activeIndex === 1 ? '#FFFFFF' : '#8FA8CC'} />}
                        label="Search"
                        isFocused={activeIndex === 1}
                        onPress={() => router.push('/(app)/search')}
                    />
                    <TabButton
                        icon={() => <PlusIcon />}
                        label=""
                        isFocused={activeIndex === 2}
                        onPress={() => router.push('/(app)/bizzapai')}
                        isCenter
                    />
                    <TabButton
                        icon={() => <NotificationIcon color={activeIndex === 3 ? '#FFFFFF' : '#8FA8CC'} />}
                        label="Notifications"
                        isFocused={activeIndex === 3}
                        onPress={() => router.push('/(app)/notification')}
                    />
                    <TabButton
                        icon={() => <ChatIcon color={activeIndex === 4 ? '#FFFFFF' : '#8FA8CC'} hasUnread={unreadCount > 0} />}
                        label="Chat"
                        isFocused={activeIndex === 4}
                        onPress={() => router.push('/(app)/chat')}
                    />
                </View>
            </View>
        </View>
    );
}

// Tab Button Component
interface TabButtonProps {
    icon: () => JSX.Element;
    label: string;
    isFocused: boolean;
    onPress: () => void;
    isCenter?: boolean;
}

function TabButton({ icon, label, isFocused, onPress, isCenter }: TabButtonProps) {
    const color = isFocused ? '#FFFFFF' : '#8FA8CC';

    return (
        <TouchableOpacity 
            onPress={onPress} 
            style={[styles.tabButton, isCenter && styles.centerButton]}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                {icon()}
            </View>
            {!isCenter && (
                <Text style={[styles.tabLabel, { color }]}>
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );
}

// --- Tabs Layout Configuration ---
export default function AppLayout() {
    const [totalUnread, setTotalUnread] = useState(0);

    // Initial fetch and socket listener for global unread count
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const response = await chatAPI.getUnreadCount();
                setTotalUnread(response.data.unreadCount);
            } catch (error) {
                console.log('Failed to fetch unread count');
            }
        };

        const setupSocket = async () => {
            try {
                const socket = await initializeChatSocket();
                
                // Increment on new message
                socket.on('newMessage', () => {
                    setTotalUnread(prev => prev + 1);
                });

                // Listen for custom event from Index/Chat screens to sync precise count
                const subscription = DeviceEventEmitter.addListener('updateUnreadCount', (count: number) => {
                    setTotalUnread(count);
                });

                return () => {
                    socket.off('newMessage', () => {});
                    subscription.remove();
                };
            } catch (e) {
                console.log('Socket setup failed in layout');
            }
        };

        fetchUnread();
        setupSocket();
    }, []);

    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} unreadCount={totalUnread} />}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: { display: 'none' },
            }}
        >
            <Tabs.Screen name="lead" options={{ title: 'Lead', href: '/(app)/lead' }} />
            <Tabs.Screen name="search" options={{ title: 'Search', href: '/(app)/search' }} />
            <Tabs.Screen name="bizzapai" options={{ title: 'Bizzap AI', href: '/(app)/bizzapai' }} />
            <Tabs.Screen name="dashboard" options={{ title: 'Notifications', href: '/(app)/dashboard' }} />
            <Tabs.Screen name="chat" options={{ title: 'Chat', href: '/(app)/chat' }} />
            <Tabs.Screen name="posts" options={{ title: 'Posts', href: null }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} /> 
        </Tabs>
    );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
    tabBarWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    tabBarContainer: {
        backgroundColor: '#111924',
        paddingBottom: sizeScale(4),
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(143, 168, 204, 0.1)',
    },
    tabBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: sizeScale(8),
        paddingHorizontal: sizeScale(8),
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: sizeScale(4),
        paddingVertical: sizeScale(4),
    },
    centerButton: {
        justifyContent: 'center',
        marginTop: sizeScale(-4),
    },
    iconContainer: {
        height: sizeScale(24),
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    tabLabel: {
        fontFamily: 'Outfit-Medium',
        fontSize: sizeScale(10),
        fontWeight: '500',
        letterSpacing: 0,
        lineHeight: sizeScale(14),
        textAlign: 'center',
    },
    unreadDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: sizeScale(8),
        height: sizeScale(8),
        borderRadius: sizeScale(4),
        backgroundColor: '#EF4444', // Red color
        borderWidth: 1,
        borderColor: '#111924',
    }
});