import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Placeholder Screen Component ---
export default function NotificationsScreenPlaceholder() {
    const router = useRouter();
    
    return (
        <View style={styles.container}>
            {/* Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="chevron-left" size={sizeScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Push Notifications</Text>
            </View>

            {/* Content Area */}
            <View style={styles.content}>
                <Feather name="bell-off" size={sizeScale(60)} color="#888" style={styles.icon} />
                <Text style={styles.mainMessage}>
                    We are working on bringing this feature to you!
                </Text>
                <Text style={styles.subMessage}>
                    Please check back later for full control over your push notification settings.
                </Text>
            </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: sizeScale(10),
        paddingVertical: sizeScale(12),
        paddingTop: sizeScale(50),
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1c1c1c',
    },
    backButton: {
        padding: sizeScale(6),
    },
    headerTitle: {
        flex: 1,
        fontSize: sizeScale(18),
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        // Offset to visually center the text when the back button is present
        marginRight: sizeScale(36), 
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: sizeScale(30),
    },
    icon: {
        marginBottom: sizeScale(20),
    },
    mainMessage: {
        fontSize: sizeScale(18),
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: sizeScale(10),
    },
    subMessage: {
        fontSize: sizeScale(14),
        color: '#888',
        textAlign: 'center',
        lineHeight: sizeScale(20),
    },
});