// // app/(app)/_layout.tsx

// import { Tabs, useRouter, useSegments } from 'expo-router'; 
// import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import {
//     Home,
//     TrendingUp,
//     PlusSquare,
//     Inbox,
//     MessageCircle,
// } from 'lucide-react-native';

// // --- Responsive Sizing Utility ---
// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const STANDARD_WIDTH = 390;
// const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// // --- Custom Tab Bar Component ---
// interface CustomTabBarProps {
//     state: any;
//     descriptors: any;
//     navigation: any;
// }

// function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
//     const router = useRouter();
//     const segments = useSegments();
    
//     // Determine active tab based on current route
//     const getActiveIndex = () => {
//         const currentRoute = segments[segments.length - 1] || segments[segments.length - 2];
        
//         if (currentRoute === 'dashboard' || currentRoute === 'index') return 0;
//         if (currentRoute === 'posts') return 1;
//         if (currentRoute === 'bizzapai') return 2;
//         if (currentRoute === 'lead') return 3;
//         if (currentRoute === 'chat') return 4;
        
//         return state.index;
//     };

//     const activeIndex = getActiveIndex();

//     return (
//         <View style={styles.tabBarWrapper}>
//             <SafeAreaView style={styles.tabBarContainer} edges={['bottom']}>
//                 <View style={styles.tabBarContent}>
//                     <TabButton
//                         icon={Home}
//                         isFocused={activeIndex === 0}
//                         onPress={() => router.push('/(app)/dashboard')} 
//                     />
//                     <TabButton
//                         icon={TrendingUp}
//                         isFocused={activeIndex === 1}
//                         onPress={() => router.push('/(app)/posts')}
//                     />
//                     <TabButton
//                         icon={PlusSquare}
//                         isFocused={activeIndex === 2}
//                         onPress={() => router.push('/(app)/bizzapai')}
//                     />
//                     <TabButton
//                         icon={Inbox}
//                         isFocused={activeIndex === 3}
//                         onPress={() => router.push('/(app)/lead')}
//                     />
//                     <TabButton
//                         icon={MessageCircle}
//                         isFocused={activeIndex === 4}
//                         onPress={() => router.push('/(app)/chat')}
//                     />
//                 </View>
//             </SafeAreaView>
//         </View>
//     );
// }

// // Tab Button Component
// interface TabButtonProps {
//     icon: any;
//     isFocused: boolean;
//     onPress: () => void;
// }

// function TabButton({ icon: Icon, isFocused, onPress }: TabButtonProps) {
//     const color = isFocused ? '#3B82F6' : '#FFFFFF';

//     return (
//         <TouchableOpacity 
//             onPress={onPress} 
//             style={styles.tabButton}
//             activeOpacity={0.7}
//         >
//             <Icon 
//                 color={color} 
//                 size={sizeScale(26)} 
//                 strokeWidth={2.5}
//                 fill="none"
//             />
//         </TouchableOpacity>
//     );
// }

// // --- Tabs Layout Configuration ---
// export default function AppLayout() {
//     return (
//         <Tabs
//             tabBar={(props) => <CustomTabBar {...props} />}
//             screenOptions={{
//                 headerShown: false,
//                 tabBarShowLabel: false,
//                 tabBarStyle: { display: 'none' },
//             }}
//         >
//             <Tabs.Screen 
//                 name="dashboard" 
//                 options={{ 
//                     title: 'Home', 
//                     href: '/(app)/dashboard'
//                 }} 
//             />
//             <Tabs.Screen 
//                 name="posts" 
//                 options={{ 
//                     title: 'Posts', 
//                     href: '/(app)/posts'
//                 }} 
//             />
//             <Tabs.Screen 
//                 name="search" 
//                 options={{ 
//                     title: 'Search', 
//                     href: null  // Accessible only via header search icon
//                 }} 
//             />
//             <Tabs.Screen 
//                 name="bizzapai" 
//                 options={{ 
//                     title: 'Bizzap AI', 
//                     href: '/(app)/bizzapai'
//                 }} 
//             />
//             <Tabs.Screen 
//                 name="lead" 
//                 options={{ 
//                     title: 'Lead', 
//                     href: '/(app)/lead'
//                 }} 
//             />
//             <Tabs.Screen 
//                 name="chat" 
//                 options={{ 
//                     title: 'Chat', 
//                     href: '/(app)/chat'
//                 }} 
//             />
//             <Tabs.Screen 
//                 name="profile" 
//                 options={{ 
//                     title: 'Profile', 
//                     href: null  // Accessible only via header profile icon
//                 }} 
//             /> 
//         </Tabs>
//     );
// }

// // --- Stylesheet ---
// const styles = StyleSheet.create({
//     tabBarWrapper: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         backgroundColor: 'transparent',
//         paddingHorizontal: sizeScale(10),
//         paddingBottom: sizeScale(10),
//     },
//     tabBarContainer: {
//         backgroundColor: 'rgba(0, 0, 0, 0.85)',
//         borderRadius: sizeScale(18),
//         overflow: 'hidden',
//         shadowColor: '#000',
//         shadowOffset: {
//             width: 0,
//             height: 4,
//         },
//         shadowOpacity: 0.3,
//         shadowRadius: 8,
//         elevation: 10,
//     },
//     tabBarContent: {
//         flexDirection: 'row',
//         justifyContent: 'space-around',
//         alignItems: 'center',
//         paddingVertical: sizeScale(12),
//         paddingHorizontal: sizeScale(10),
//     },
//     tabButton: {
//         padding: sizeScale(8),
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderRadius: sizeScale(12),
//     },
// });


// app/(app)/_layout.tsx

import { Tabs, useRouter, useSegments, usePathname } from 'expo-router'; 
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Home,
    TrendingUp,
    PlusSquare,
    Inbox,
    MessageCircle,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Custom Tab Bar Component ---
interface CustomTabBarProps {
    state: any;
    descriptors: any;
    navigation: any;
}

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
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
        
        if (currentRoute === 'dashboard' || currentRoute === 'index') return 0;
        if (currentRoute === 'posts') return 1;
        if (currentRoute === 'bizzapai') return 2;
        if (currentRoute === 'lead') return 3;
        if (currentRoute === 'chat') return 4;
        
        return state.index;
    };

    const activeIndex = getActiveIndex();

    if (!isVisible) {
        return null;
    }

    return (
        <View style={styles.tabBarWrapper}>
            <SafeAreaView style={styles.tabBarContainer} edges={['bottom']}>
                <View style={styles.tabBarContent}>
                    <TabButton
                        icon={Home}
                        isFocused={activeIndex === 0}
                        onPress={() => router.push('/(app)/dashboard')} 
                    />
                    <TabButton
                        icon={TrendingUp}
                        isFocused={activeIndex === 1}
                        onPress={() => router.push('/(app)/posts')}
                    />
                    <TabButton
                        icon={PlusSquare}
                        isFocused={activeIndex === 2}
                        onPress={() => router.push('/(app)/bizzapai')}
                    />
                    <TabButton
                        icon={Inbox}
                        isFocused={activeIndex === 3}
                        onPress={() => router.push('/(app)/lead')}
                    />
                    <TabButton
                        icon={MessageCircle}
                        isFocused={activeIndex === 4}
                        onPress={() => router.push('/(app)/chat')}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
}

// Tab Button Component
interface TabButtonProps {
    icon: any;
    isFocused: boolean;
    onPress: () => void;
}

function TabButton({ icon: Icon, isFocused, onPress }: TabButtonProps) {
    const color = isFocused ? '#3B82F6' : '#FFFFFF';

    return (
        <TouchableOpacity 
            onPress={onPress} 
            style={styles.tabButton}
            activeOpacity={0.7}
        >
            <Icon 
                color={color} 
                size={sizeScale(26)} 
                strokeWidth={2.5}
                fill="none"
            />
        </TouchableOpacity>
    );
}

// --- Tabs Layout Configuration ---
export default function AppLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: { display: 'none' },
            }}
        >
            <Tabs.Screen 
                name="dashboard" 
                options={{ 
                    title: 'Home', 
                    href: '/(app)/dashboard'
                }} 
            />
            <Tabs.Screen 
                name="posts" 
                options={{ 
                    title: 'Posts', 
                    href: '/(app)/posts'
                }} 
            />
            <Tabs.Screen 
                name="search" 
                options={{ 
                    title: 'Search', 
                    href: null  // Accessible only via header search icon
                }} 
            />
            <Tabs.Screen 
                name="bizzapai" 
                options={{ 
                    title: 'Bizzap AI', 
                    href: '/(app)/bizzapai'
                }} 
            />
            <Tabs.Screen 
                name="lead" 
                options={{ 
                    title: 'Lead', 
                    href: '/(app)/lead'
                }} 
            />
            <Tabs.Screen 
                name="chat" 
                options={{ 
                    title: 'Chat', 
                    href: '/(app)/chat'
                }} 
            />
            <Tabs.Screen 
                name="profile" 
                options={{ 
                    title: 'Profile', 
                    href: null  // Accessible only via header profile icon
                }} 
            /> 
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
        paddingHorizontal: sizeScale(10),
        paddingBottom: sizeScale(10),
    },
    tabBarContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderRadius: sizeScale(18),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    tabBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: sizeScale(12),
        paddingHorizontal: sizeScale(10),
    },
    tabButton: {
        padding: sizeScale(8),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: sizeScale(12),
    },
});