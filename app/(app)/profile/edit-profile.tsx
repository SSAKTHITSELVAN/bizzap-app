// app/(app)/profile/edit-profile.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform,
    Animated,
    StatusBar,
    Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../../../constants/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/f3f4f6/6b7280?text=No+Image';

interface MediaFile {
    uri: string;
    type: string;
    name: string;
    file?: File;
}

// --- Success Toast Component ---
interface ToastProps {
    message: string;
    visible: boolean;
    onDismiss: () => void;
}

const SuccessToast: React.FC<ToastProps> = ({ message, visible, onDismiss }) => {
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                const timer = setTimeout(() => {
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }).start(onDismiss);
                }, 2000);
                return () => clearTimeout(timer);
            });
        }
    }, [visible, fadeAnim, onDismiss]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]} pointerEvents="none">
            <View style={styles.toastContent}>
                <Feather name="check-circle" size={sizeScale(20)} color="#fff" />
                <Text style={styles.toastText}>{message}</Text>
            </View>
        </Animated.View>
    );
};

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const insets = useSafeAreaInsets();
    
    const [loading, setLoading] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    // --- Editable Fields ---
    const [userName, setUserName] = useState(user?.userName || '');
    const [description, setDescription] = useState(user?.description || '');
    const [about, setAbout] = useState(user?.about || '');
    const [category, setCategory] = useState(user?.category || '');
    const [registeredAddress, setRegisteredAddress] = useState(user?.registeredAddress || '');
    const [operationalAddress, setOperationalAddress] = useState(user?.operationalAddress || '');
    
    // Fixed/Read-only States
    const companyName = user?.companyName || '';
    const address = user?.address || '';
    
    // Images
    const [userPhoto, setUserPhoto] = useState<MediaFile | null>(null);
    const [logo, setLogo] = useState<MediaFile | null>(null);
    const [coverImage, setCoverImage] = useState<MediaFile | null>(null);

    useEffect(() => {
        if (user) {
            setUserName(user.userName || '');
            setDescription(user.description || '');
            setAbout(user.about || '');
            setCategory(user.category || '');
            setRegisteredAddress(user.registeredAddress || '');
            setOperationalAddress(user.operationalAddress || '');
        }
    }, [user]);

    const handleSupportClick = () => {
        Linking.openURL('http://bizzap.app/support').catch(err => console.error("Couldn't load page", err));
    };

    const handleSave = async () => {
        if (!userName.trim()) {
            Alert.alert('Required Field', 'Please enter your name.');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const formData = new FormData();

            formData.append('userName', userName.trim());
            formData.append('description', description.trim());
            formData.append('about', about.trim());
            formData.append('category', category.trim());
            formData.append('registeredAddress', registeredAddress.trim());
            formData.append('operationalAddress', operationalAddress.trim());

            const appendImage = (key: string, data: MediaFile | null) => {
                if (data) {
                    if (Platform.OS === 'web' && data.file) {
                        formData.append(key, data.file);
                    } else {
                        formData.append(key, { uri: data.uri, type: data.type, name: data.name } as any);
                    }
                }
            };

            appendImage('userPhoto', userPhoto);
            appendImage('logo', logo);
            appendImage('coverImage', coverImage);

            const response = await axios.patch(`${Config.API_BASE_URL}/companies/profile`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` },
            });

            if (response.data.statusCode === 200) {
                if (typeof refreshUser === 'function') await refreshUser();
                setSuccessMessage('Profile updated successfully! 🎉');
                setShowSuccessToast(true);
                setTimeout(() => router.back(), 2500);
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Update failed.');
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async (type: 'userPhoto' | 'logo' | 'coverImage') => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return Alert.alert('Permission Required', 'Allow access to photos.');

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: type === 'coverImage' ? [16, 9] : [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const media: MediaFile = {
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `${type}.jpg`,
            };
            if (type === 'userPhoto') setUserPhoto(media);
            else if (type === 'logo') setLogo(media);
            else setCoverImage(media);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={sizeScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                
                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <MaterialCommunityIcons name="shield-check" size={sizeScale(20)} color="#10B981" />
                    <Text style={styles.infoBannerText}>
                        Verified business details cannot be edited. Contact{' '}
                        <Text style={styles.brandText} onPress={handleSupportClick}>
                            Bizzap Support
                        </Text>{' '}
                        to request changes.
                    </Text>
                </View>

                {/* Images Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Branding</Text>
                    <TouchableOpacity style={styles.coverImageContainer} onPress={() => handlePickImage('coverImage')}>
                        {/* Use user.coverImage (from local storage) if no new image selected */}
                        <Image 
                            source={{ uri: coverImage?.uri || user?.coverImage || PLACEHOLDER_IMG }} 
                            style={styles.coverImage} 
                        />
                        <View style={styles.cameraOverlay}><Feather name="camera" size={20} color="#fff" /></View>
                    </TouchableOpacity>

                    <View style={styles.imagesRow}>
                        <View style={styles.imageBox}>
                            <Text style={styles.imageLabel}>Your Photo</Text>
                            <TouchableOpacity style={styles.imageContainer} onPress={() => handlePickImage('userPhoto')}>
                                <Image 
                                    source={{ uri: userPhoto?.uri || user?.userPhoto || PLACEHOLDER_IMG }} 
                                    style={styles.profileImage} 
                                />
                                <View style={styles.cameraOverlay}><Feather name="camera" size={16} color="#fff" /></View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.imageBox}>
                            <Text style={styles.imageLabel}>Business Logo</Text>
                            <TouchableOpacity style={styles.imageContainer} onPress={() => handlePickImage('logo')}>
                                <Image 
                                    source={{ uri: logo?.uri || user?.logo || PLACEHOLDER_IMG }} 
                                    style={styles.profileImage} 
                                />
                                <View style={styles.cameraOverlay}><Feather name="camera" size={16} color="#fff" /></View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Basic Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Company Name (Verified)</Text>
                        <View style={styles.readOnlyInput}>
                            <Text style={styles.readOnlyText}>{companyName}</Text>
                            <Feather name="lock" size={14} color="#666" />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Your Name</Text>
                        <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Enter name" placeholderTextColor="#666" />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Tagline / Description</Text>
                        <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Brief tagline" placeholderTextColor="#666" />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Category</Text>
                        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Business category" placeholderTextColor="#666" />
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About Business</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={about}
                        onChangeText={setAbout}
                        placeholder="Tell us about your company..."
                        multiline
                        numberOfLines={4}
                        placeholderTextColor="#666"
                    />
                </View>

                {/* Address Section - Editable */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Addresses</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Business Address (Verified)</Text>
                        <View style={[styles.readOnlyInput, styles.multiLineReadOnly]}>
                            <Text style={styles.readOnlyText}>{address || 'Not Provided'}</Text>
                            <Feather name="lock" size={14} color="#666" />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Registered Address</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={registeredAddress} 
                            onChangeText={setRegisteredAddress}
                            placeholder="Enter registered address"
                            placeholderTextColor="#666"
                            multiline
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Operational Address</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={operationalAddress} 
                            onChangeText={setOperationalAddress}
                            placeholder="Enter operational address"
                            placeholderTextColor="#666"
                            multiline
                        />
                    </View>
                </View>

                <View style={[styles.bottomPadding, { height: insets.bottom + 80 }]} />
            </ScrollView>

            <SuccessToast message={successMessage} visible={showSuccessToast} onDismiss={() => setShowSuccessToast(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: sizeScale(16),
        paddingVertical: sizeScale(12),
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: { padding: sizeScale(8) },
    headerTitle: { fontSize: sizeScale(18), fontWeight: '700', color: '#fff' },
    saveButton: { backgroundColor: '#005CE6', paddingHorizontal: sizeScale(20), paddingVertical: sizeScale(8), borderRadius: sizeScale(8) },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { fontSize: sizeScale(14), fontWeight: '600', color: '#fff' },
    scrollView: { flex: 1 },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: '#064E3B',
        margin: sizeScale(16),
        padding: sizeScale(12),
        borderRadius: sizeScale(8),
        alignItems: 'center',
        gap: sizeScale(10),
    },
    infoBannerText: { flex: 1, fontSize: sizeScale(12), color: '#D1FAE5', lineHeight: sizeScale(18) },
    brandText: { fontWeight: '700', color: '#10B981', textDecorationLine: 'underline' },
    section: { padding: sizeScale(16), borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
    sectionTitle: { fontSize: sizeScale(16), fontWeight: '700', color: '#fff', marginBottom: sizeScale(16) },
    coverImageContainer: { width: '100%', height: sizeScale(160), borderRadius: sizeScale(12), overflow: 'hidden', backgroundColor: '#1a1a1a' },
    coverImage: { width: '100%', height: '100%' },
    cameraOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 },
    imagesRow: { flexDirection: 'row', gap: sizeScale(16), marginTop: sizeScale(16) },
    imageBox: { flex: 1 },
    imageLabel: { fontSize: sizeScale(12), color: '#999', marginBottom: sizeScale(8) },
    imageContainer: { width: '100%', aspectRatio: 1, borderRadius: sizeScale(12), overflow: 'hidden', backgroundColor: '#1a1a1a' },
    profileImage: { width: '100%', height: '100%' },
    inputGroup: { marginBottom: sizeScale(20) },
    inputLabel: { fontSize: sizeScale(13), color: '#ccc', marginBottom: sizeScale(8), fontWeight: '600' },
    input: { backgroundColor: '#111', borderRadius: sizeScale(8), padding: sizeScale(14), fontSize: sizeScale(15), color: '#fff', borderWidth: 1, borderColor: '#222' },
    readOnlyInput: { 
        backgroundColor: '#1a1a1a', 
        borderRadius: sizeScale(8), 
        padding: sizeScale(14), 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2a2a'
    },
    readOnlyText: { color: '#888', fontSize: sizeScale(15), flex: 1 },
    multiLineReadOnly: { minHeight: sizeScale(50) },
    textArea: { minHeight: sizeScale(100), textAlignVertical: 'top' },
    bottomPadding: { height: sizeScale(100) },
    
    // Updated Toast Container to Center on Screen
    toastContainer: { 
        position: 'absolute', 
        top: 0, 
        bottom: 0, 
        left: 0, 
        right: 0, 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 100 
    },
    toastContent: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#059669', 
        paddingVertical: sizeScale(12), 
        paddingHorizontal: sizeScale(24), 
        borderRadius: sizeScale(30), 
        gap: sizeScale(8),
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    toastText: { color: '#fff', fontSize: sizeScale(14), fontWeight: '600' },
});