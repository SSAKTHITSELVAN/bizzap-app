// app/(app)/_layout.tsx

import { Tabs, usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, DeviceEventEmitter } from 'react-native';
import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const shouldShowLabels = SCREEN_WIDTH >= 340;

// --- Icon Components ---
const LeadIcon = ({ color, isActive }: { color: string; isActive: boolean }) => (
  <Svg width={sizeScale(24)} height={sizeScale(24)} viewBox="0 0 24 24" fill="none">
    <G clipPath="url(#clip0_lead)">
      {isActive ? (
        <Path d="M20.04 6.81969L14.28 2.78969C12.71 1.68969 10.3 1.74969 8.78999 2.91969L3.77999 6.82969C2.77999 7.60969 1.98999 9.20969 1.98999 10.4697V17.3697C1.98999 19.9197 4.05999 21.9997 6.60999 21.9997H17.39C19.94 21.9997 22.01 19.9297 22.01 17.3797V10.5997C22.01 9.24969 21.14 7.58969 20.04 6.81969ZM16.88 13.3997C16.88 13.7897 16.57 14.0997 16.18 14.0997C15.79 14.0997 15.48 13.7897 15.48 13.3997V13.2197L12.76 15.9397C12.61 16.0897 12.41 16.1597 12.2 16.1397C12 16.1197 11.81 15.9997 11.7 15.8297L10.68 14.3097L8.29999 16.6897C8.15999 16.8297 7.98999 16.8897 7.80999 16.8897C7.62999 16.8897 7.44999 16.8197 7.31999 16.6897C7.04999 16.4197 7.04999 15.9797 7.31999 15.6997L10.3 12.7197C10.45 12.5697 10.65 12.4997 10.86 12.5197C11.07 12.5397 11.26 12.6497 11.37 12.8297L12.39 14.3497L14.5 12.2397H14.32C13.93 12.2397 13.62 11.9297 13.62 11.5397C13.62 11.1497 13.93 10.8397 14.32 10.8397H16.18C16.27 10.8397 16.36 10.8597 16.45 10.8897C16.62 10.9597 16.76 11.0997 16.83 11.2697C16.87 11.3597 16.88 11.4497 16.88 11.5397V13.3997Z" fill={color}/>
      ) : (
        <>
          <Path d="M9.02 2.84016L3.63 7.04016C2.73 7.74016 2 9.23016 2 10.3602V17.7702C2 20.0902 3.89 21.9902 6.21 21.9902H17.79C20.11 21.9902 22 20.0902 22 17.7802V10.5002C22 9.29016 21.19 7.74016 20.2 7.05016L14.02 2.72016C12.62 1.74016 10.37 1.79016 9.02 2.84016Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          <G opacity={0.4}>
            <Path d="M16.5 11.5L12.3 15.7L10.7 13.3L7.5 16.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M14.5 11.5H16.5V13.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </G>
        </>
      )}
    </G>
    <Defs><ClipPath id="clip0_lead"><Rect width="24" height="24" fill="white"/></ClipPath></Defs>
  </Svg>
);

const SearchIcon = ({ color, isActive }: { color: string; isActive: boolean }) => (
  <Svg width={sizeScale(24)} height={sizeScale(24)} viewBox="0 0 24 24" fill="none">
    {isActive ? (
      <>
        <Path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" fill={color}/>
        <Path d="M21.3001 22.0001C21.1201 22.0001 20.9401 21.9301 20.8101 21.8001L18.9501 19.9401C18.6801 19.6701 18.6801 19.2301 18.9501 18.9501C19.2201 18.6801 19.6601 18.6801 19.9401 18.9501L21.8001 20.8101C22.0701 21.0801 22.0701 21.5201 21.8001 21.8001C21.6601 21.9301 21.4801 22.0001 21.3001 22.0001Z" fill={color}/>
      </>
    ) : (
      <>
        <Path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        <Path opacity={0.4} d="M22 22L20 20" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      </>
    )}
  </Svg>
);

const PlusIcon = ({ isActive }: { isActive?: boolean }) => (
  <Svg width={sizeScale(24)} height={sizeScale(24)} viewBox="0 0 24 24" fill="none">
    <G clipPath="url(#clip0_plus)">
      {isActive ? (
        <Path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2ZM16 12.75H12.75V16C12.75 16.41 12.41 16.75 12 16.75C11.59 16.75 11.25 16.41 11.25 16V12.75H8C7.59 12.75 7.25 12.41 7.25 12C7.25 11.59 7.59 11.25 8 11.25H11.25V8C11.25 7.59 11.59 7.25 12 7.25C12.41 7.25 12.75 7.59 12.75 8V11.25H16C16.41 11.25 16.75 11.59 16.75 12C16.75 12.41 16.41 12.75 16 12.75Z" fill="white"/>
      ) : (
        <>
          <G opacity={0.4}>
            <Path d="M8 12H16" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M12 16V8" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </G>
          <Path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </>
      )}
    </G>
    <Defs><ClipPath id="clip0_plus"><Rect width="24" height="24" fill="white"/></ClipPath></Defs>
  </Svg>
);

const NotificationIcon = ({ color, isActive }: { color: string; isActive: boolean }) => (
  <Svg width={sizeScale(24)} height={sizeScale(24)} viewBox="0 0 24 24" fill="none">
    <G clipPath="url(#clip0_notification)">
      {isActive ? (
        <>
          <Path d="M20.19 14.0608L19.06 12.1808C18.81 11.7708 18.59 10.9808 18.59 10.5008V8.63078C18.59 5.00078 15.64 2.05078 12.02 2.05078C8.38996 2.06078 5.43996 5.00078 5.43996 8.63078V10.4908C5.43996 10.9708 5.21996 11.7608 4.97996 12.1708L3.84996 14.0508C3.41996 14.7808 3.31996 15.6108 3.58996 16.3308C3.85996 17.0608 4.46996 17.6408 5.26996 17.9008C6.34996 18.2608 7.43996 18.5208 8.54996 18.7108C8.65996 18.7308 8.76996 18.7408 8.87996 18.7608C9.01996 18.7808 9.16996 18.8008 9.31996 18.8208C9.57996 18.8608 9.83996 18.8908 10.11 18.9108C10.74 18.9708 11.38 19.0008 12.02 19.0008C12.65 19.0008 13.28 18.9708 13.9 18.9108C14.13 18.8908 14.36 18.8708 14.58 18.8408C14.76 18.8208 14.94 18.8008 15.12 18.7708C15.23 18.7608 15.34 18.7408 15.45 18.7208C16.57 18.5408 17.68 18.2608 18.76 17.9008C19.53 17.6408 20.12 17.0608 20.4 16.3208C20.68 15.5708 20.6 14.7508 20.19 14.0608ZM12.75 10.0008C12.75 10.4208 12.41 10.7608 11.99 10.7608C11.57 10.7608 11.23 10.4208 11.23 10.0008V6.90078C11.23 6.48078 11.57 6.14078 11.99 6.14078C12.41 6.14078 12.75 6.48078 12.75 6.90078V10.0008Z" fill={color}/>
          <Path d="M14.8299 20.01C14.4099 21.17 13.2999 22 11.9999 22C11.2099 22 10.4299 21.68 9.87993 21.11C9.55993 20.81 9.31993 20.41 9.17993 20C9.30993 20.02 9.43993 20.03 9.57993 20.05C9.80993 20.08 10.0499 20.11 10.2899 20.13C10.8599 20.18 11.4399 20.21 12.0199 20.21C12.5899 20.21 13.1599 20.18 13.7199 20.13C13.9299 20.11 14.1399 20.1 14.3399 20.07C14.4999 20.05 14.6599 20.03 14.8299 20.01Z" fill={color}/>
        </>
      ) : (
        <>
          <Path opacity={0.4} d="M12 6.43945V9.76945" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round"/>
          <Path d="M12.0199 2C8.3399 2 5.3599 4.98 5.3599 8.66V10.76C5.3599 11.44 5.0799 12.46 4.7299 13.04L3.4599 15.16C2.6799 16.47 3.2199 17.93 4.6599 18.41C9.4399 20 14.6099 20 19.3899 18.41C20.7399 17.96 21.3199 16.38 20.5899 15.16L19.3199 13.04C18.9699 12.46 18.6899 11.43 18.6899 10.76V8.66C18.6799 5 15.6799 2 12.0199 2Z" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round"/>
          <Path opacity={0.4} d="M15.3299 18.8203C15.3299 20.6503 13.8299 22.1503 11.9999 22.1503C11.0899 22.1503 10.2499 21.7703 9.64992 21.1703C9.04992 20.5703 8.66992 19.7303 8.66992 18.8203" stroke={color} strokeWidth={1.5} strokeMiterlimit={10}/>
        </>
      )}
    </G>
    <Defs><ClipPath id="clip0_notification"><Rect width="24" height="24" fill="white"/></ClipPath></Defs>
  </Svg>
);

const ChatIcon = ({ color, hasUnread, isActive }: { color: string; hasUnread?: boolean; isActive: boolean }) => (
  <View>
    <Svg width={sizeScale(24)} height={sizeScale(24)} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#clip0_chat)">
        {isActive ? (
          <>
            <Path d="M18.4699 16.83L18.8599 19.99C18.9599 20.82 18.0699 21.4 17.3599 20.97L13.8999 18.91C13.6599 18.77 13.5999 18.47 13.7299 18.23C14.2299 17.31 14.4999 16.27 14.4999 15.23C14.4999 11.57 11.3599 8.59 7.49989 8.59C6.70989 8.59 5.93989 8.71 5.21989 8.95C4.84989 9.07 4.48989 8.73 4.57989 8.35C5.48989 4.71 8.98989 2 13.1699 2C18.0499 2 21.9999 5.69 21.9999 10.24C21.9999 12.94 20.6099 15.33 18.4699 16.83Z" fill={color}/>
            <Path d="M13 15.2298C13 16.4198 12.56 17.5198 11.82 18.3898C10.83 19.5898 9.26 20.3598 7.5 20.3598L4.89 21.9098C4.45 22.1798 3.89 21.8098 3.95 21.2998L4.2 19.3298C2.86 18.3998 2 16.9098 2 15.2298C2 13.4698 2.94 11.9198 4.38 10.9998C5.27 10.4198 6.34 10.0898 7.5 10.0898C10.54 10.0898 13 12.3898 13 15.2298Z" fill={color}/>
          </>
        ) : (
          <>
            <Path opacity={0.4} d="M18.4698 16.83L18.8598 19.99C18.9598 20.82 18.0698 21.4 17.3598 20.97L13.1698 18.48C12.7098 18.48 12.2599 18.45 11.8199 18.39C12.5599 17.52 12.9998 16.42 12.9998 15.23C12.9998 12.39 10.5398 10.09 7.49985 10.09C6.33985 10.09 5.26985 10.42 4.37985 11C4.34985 10.75 4.33984 10.5 4.33984 10.24C4.33984 5.68999 8.28985 2 13.1698 2C18.0498 2 21.9998 5.68999 21.9998 10.24C21.9998 12.94 20.6098 15.33 18.4698 16.83Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M13 15.2298C13 16.4198 12.56 17.5198 11.82 18.3898C10.83 19.5898 9.26 20.3598 7.5 20.3598L4.89 21.9098C4.45 22.1798 3.89 21.8098 3.95 21.2998L4.2 19.3298C2.86 18.3998 2 16.9098 2 15.2298C2 13.4698 2.94 11.9198 4.38 10.9998C5.27 10.4198 6.34 10.0898 7.5 10.0898C10.54 10.0898 13 12.3898 13 15.2298Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </>
        )}
      </G>
      <Defs><ClipPath id="clip0_chat"><Rect width="24" height="24" fill="white"/></ClipPath></Defs>
    </Svg>
    {hasUnread && <View style={styles.unreadDot} />}
  </View>
);

// --- Custom Tab Bar ---
interface CustomTabBarProps {
    state: any;
    descriptors: any;
    navigation: any;
    unreadCount: number;
    onTabPress: (route: string) => void;
}

function CustomTabBar({ state, descriptors, navigation, unreadCount, onTabPress }: CustomTabBarProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const segments = useSegments();
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    
    useEffect(() => {
        const shouldHide = pathname?.includes('/posts/videos');
        setIsVisible(!shouldHide);
    }, [pathname]);
    
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

    const handleNavigation = (route: string) => {
        router.push(route as any);
        onTabPress(route);
    };

    if (!isVisible) return null;

    return (
        <View style={styles.tabBarWrapper}>
            <View style={[
                styles.tabBarContainer, 
                { paddingBottom: Math.max(insets.bottom, sizeScale(8)) }
            ]}>
                <View style={styles.tabBarContent}>
                    <TabButton icon={(isActive) => <LeadIcon color={isActive ? '#FFFFFF' : '#8FA8CC'} isActive={isActive} />} label="Lead" isFocused={activeIndex === 0} onPress={() => handleNavigation('/(app)/dashboard')} />
                    <TabButton icon={(isActive) => <SearchIcon color={isActive ? '#FFFFFF' : '#8FA8CC'} isActive={isActive} />} label="Search" isFocused={activeIndex === 1} onPress={() => handleNavigation('/(app)/search')} />
                    <TabButton icon={(isActive) => <PlusIcon isActive={isActive} />} label="" isFocused={activeIndex === 2} onPress={() => handleNavigation('/(app)/bizzapai')} isCenter />
                    <TabButton icon={(isActive) => <NotificationIcon color={isActive ? '#FFFFFF' : '#8FA8CC'} isActive={isActive} />} label="Alerts" isFocused={activeIndex === 3} onPress={() => handleNavigation('/(app)/notification')} />
                    <TabButton icon={(isActive) => <ChatIcon color={isActive ? '#FFFFFF' : '#8FA8CC'} hasUnread={unreadCount > 0} isActive={isActive} />} label="Chat" isFocused={activeIndex === 4} onPress={() => handleNavigation('/(app)/chat')} />
                </View>
            </View>
        </View>
    );
}

interface TabButtonProps {
    icon: (isActive: boolean) => JSX.Element;
    label: string;
    isFocused: boolean;
    onPress: () => void;
    isCenter?: boolean;
}

function TabButton({ icon, label, isFocused, onPress, isCenter }: TabButtonProps) {
    const color = isFocused ? '#FFFFFF' : '#8FA8CC';
    return (
        <TouchableOpacity onPress={onPress} style={[styles.tabButton, isCenter && styles.centerButton]} activeOpacity={0.7}>
            <View style={styles.iconContainer}>{icon(isFocused)}</View>
            {!isCenter && shouldShowLabels && (
                <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>{label}</Text>
            )}
        </TouchableOpacity>
    );
}

export default function AppLayout() {
    const [totalUnread, setTotalUnread] = useState(0);

    const fetchUnread = async () => {
        try {
            const response = await chatAPI.getUnreadCount();
            setTotalUnread(response.data.unreadCount);
        } catch (error) {
            console.log('Failed to fetch unread count');
        }
    };

    useEffect(() => {
        fetchUnread();
        const setupSocket = async () => {
            try {
                const socket = await initializeChatSocket();
                socket.on('newMessage', () => fetchUnread());
                socket.on('messagesRead', () => fetchUnread());
                socket.on('messageRead', () => fetchUnread());
                const subscription = DeviceEventEmitter.addListener('updateUnreadCount', (count: number) => {
                    if (typeof count === 'number') setTotalUnread(count);
                    else fetchUnread();
                });
                return () => {
                    socket.off('newMessage');
                    socket.off('messagesRead');
                    socket.off('messageRead');
                    subscription.remove();
                };
            } catch (e) {
                console.log('Socket setup failed in layout');
            }
        };
        setupSocket();
    }, []);

    const handleTabPress = (route: string) => {
        if (route.includes('chat')) fetchUnread();
    };

    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} unreadCount={totalUnread} onTabPress={handleTabPress} />}
            screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: { display: 'none' } }}
        >
            <Tabs.Screen name="search" options={{ title: 'Search', href: '/(app)/search' }} />
            <Tabs.Screen name="bizzapai" options={{ title: 'Bizzap AI', href: '/(app)/bizzapai' }} />
            <Tabs.Screen name="dashboard" options={{ title: 'Notifications', href: '/(app)/dashboard' }} />
            <Tabs.Screen name="chat" options={{ title: 'Chat', href: '/(app)/chat' }} />
            <Tabs.Screen name="posts" options={{ title: 'Posts', href: null }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} /> 
        </Tabs>
    );
}

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
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(143, 168, 204, 0.1)',
    },
    tabBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: sizeScale(8),
        paddingHorizontal: sizeScale(4),
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: sizeScale(3),
        paddingVertical: sizeScale(4),
        paddingHorizontal: sizeScale(2),
        minWidth: 0,
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
        fontSize: Math.min(sizeScale(10), 10),
        fontWeight: '500',
        letterSpacing: 0,
        lineHeight: sizeScale(12),
        textAlign: 'center',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    unreadDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: sizeScale(8),
        height: sizeScale(8),
        borderRadius: sizeScale(4),
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#111924',
    }
});