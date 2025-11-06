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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../../../constants/config';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Placeholder Image ---
const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/f3f4f6/6b7280?text=No+Image';

// --- Interfaces ---
interface MediaFile {
    uri: string;
    type: string;
    name: string;
    file?: File; // For web - we need this!
}

// --- Success Toast Component ---
interface ToastProps {
    message: string;
    visible: boolean;
    onDismiss: () => void;
}

const SuccessToast: React.FC<ToastProps> = ({ message, visible, onDismiss }) => {
    const [fadeAnim] = useState(new Animated.Value(0));

    React.useEffect(() => {
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

    if (!visible && fadeAnim._value === 0) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                { opacity: fadeAnim },
            ]}
            pointerEvents="none"
        >
            <View style={styles.toastContent}>
                <Feather name="check-circle" size={sizeScale(20)} color="#fff" />
                <Text style={styles.toastText}>{message}</Text>
            </View>
        </Animated.View>
    );
};

// --- Main Edit Profile Screen ---
export default function EditProfileScreen() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    
    const [loading, setLoading] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    const [userName, setUserName] = useState(user?.userName || '');
    const [companyName, setCompanyName] = useState(user?.companyName || '');
    const [description, setDescription] = useState(user?.description || '');
    const [about, setAbout] = useState(user?.about || '');
    const [category, setCategory] = useState(user?.category || '');
    const [address, setAddress] = useState(user?.address || '');
    const [registeredAddress, setRegisteredAddress] = useState(user?.registeredAddress || '');
    const [operationalAddress, setOperationalAddress] = useState(user?.operationalAddress || '');
    
    const [userPhoto, setUserPhoto] = useState<MediaFile | null>(null);
    const [logo, setLogo] = useState<MediaFile | null>(null);
    const [coverImage, setCoverImage] = useState<MediaFile | null>(null);

    // Convert blob URI to File object for web
    const uriToFile = async (uri: string, fileName: string, mimeType: string): Promise<File | null> => {
        try {
            if (Platform.OS === 'web') {
                console.log('🔄 Converting URI to File:', { uri: uri.substring(0, 50) + '...', fileName, mimeType });
                const response = await fetch(uri);
                const blob = await response.blob();
                console.log('📦 Blob created:', { size: blob.size, type: blob.type });
                const file = new File([blob], fileName, { type: mimeType });
                console.log('✅ File created:', { name: file.name, size: file.size, type: file.type });
                return file;
            }
            return null;
        } catch (error) {
            console.error('❌ Error converting URI to File:', error);
            return null;
        }
    };

    const handlePickImage = async (type: 'userPhoto' | 'logo' | 'coverImage') => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === 'coverImage' ? [16, 9] : [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const fileName = asset.fileName || `${type}_${Date.now()}.jpg`;
                const mimeType = asset.mimeType || 'image/jpeg';

                // For web, convert to File object
                const file = Platform.OS === 'web' 
                    ? await uriToFile(asset.uri, fileName, mimeType)
                    : null;

                const mediaFile: MediaFile = {
                    uri: asset.uri,
                    type: mimeType,
                    name: fileName,
                    file: file || undefined,
                };

                if (type === 'userPhoto') setUserPhoto(mediaFile);
                else if (type === 'logo') setLogo(mediaFile);
                else setCoverImage(mediaFile);
                
                console.log(`✅ ${type} selected:`, fileName, file ? `(File size: ${file.size})` : '(Native)');
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const handleRemoveImage = (type: 'userPhoto' | 'logo' | 'coverImage') => {
        if (type === 'userPhoto') setUserPhoto(null);
        else if (type === 'logo') setLogo(null);
        else setCoverImage(null);
    };

    const handleSave = async () => {
        // Validation
        if (!userName.trim()) {
            Alert.alert('Required Field', 'Please enter your name.');
            return;
        }

        if (!companyName.trim()) {
            Alert.alert('Required Field', 'Please enter company name.');
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('authToken');
            
            const formData = new FormData();

            // Add text fields
            formData.append('userName', userName.trim());
            formData.append('companyName', companyName.trim());
            formData.append('description', description.trim());
            formData.append('about', about.trim());
            formData.append('category', category.trim());
            formData.append('address', address.trim());
            formData.append('registeredAddress', registeredAddress.trim());
            formData.append('operationalAddress', operationalAddress.trim());

            // Add images - send empty string if not updating, otherwise send the file
            if (userPhoto) {
                if (Platform.OS === 'web' && userPhoto.file) {
                    // Web: Send File object
                    formData.append('userPhoto', userPhoto.file);
                    console.log('📸 Adding userPhoto (web File):', userPhoto.name, userPhoto.file.size, 'bytes');
                } else {
                    // Native: Send URI object
                    formData.append('userPhoto', {
                        uri: userPhoto.uri,
                        type: userPhoto.type,
                        name: userPhoto.name,
                    } as any);
                    console.log('📸 Adding userPhoto (native URI):', userPhoto.name);
                }
            } else {
                formData.append('userPhoto', '');
            }

            if (logo) {
                if (Platform.OS === 'web' && logo.file) {
                    formData.append('logo', logo.file);
                    console.log('🏢 Adding logo (web File):', logo.name, logo.file.size, 'bytes');
                } else {
                    formData.append('logo', {
                        uri: logo.uri,
                        type: logo.type,
                        name: logo.name,
                    } as any);
                    console.log('🏢 Adding logo (native URI):', logo.name);
                }
            } else {
                formData.append('logo', '');
            }

            if (coverImage) {
                if (Platform.OS === 'web' && coverImage.file) {
                    formData.append('coverImage', coverImage.file);
                    console.log('🖼️ Adding coverImage (web File):', coverImage.name, coverImage.file.size, 'bytes');
                } else {
                    formData.append('coverImage', {
                        uri: coverImage.uri,
                        type: coverImage.type,
                        name: coverImage.name,
                    } as any);
                    console.log('🖼️ Adding coverImage (native URI):', coverImage.name);
                }
            } else {
                formData.append('coverImage', '');
            }

            console.log('📤 Submitting profile update...');
            console.log('📋 Form fields:', {
                userName: userName.trim(),
                companyName: companyName.trim(),
                hasUserPhoto: !!userPhoto,
                hasLogo: !!logo,
                hasCoverImage: !!coverImage,
            });

            const response = await axios.patch(
                `${Config.API_BASE_URL}/companies/profile`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                    },
                    timeout: 120000,
                }
            );

            console.log('✅ Profile update response:', response.data);

            if (response.data.statusCode === 200) {
                // Clear selected images since they're now uploaded
                setUserPhoto(null);
                setLogo(null);
                setCoverImage(null);
                
                // Try to refresh user data from server
                if (typeof refreshUser === 'function') {
                    try {
                        console.log('🔄 Refreshing user data from server...');
                        await refreshUser();
                        console.log('✅ User data refreshed successfully');
                    } catch (err) {
                        console.log('⚠️ Could not refresh user, but update was successful:', err);
                    }
                } else {
                    console.log('ℹ️ refreshUser not available, manually fetching profile...');
                    // Fallback: manually fetch and update user context
                    try {
                        const token = await AsyncStorage.getItem('authToken');
                        const profileResponse = await axios.get(
                            `${Config.API_BASE_URL}/companies/profile`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            }
                        );
                        console.log('✅ Profile fetched:', profileResponse.data);
                    } catch (err) {
                        console.error('❌ Error fetching profile:', err);
                    }
                }
                
                // Show success toast
                setSuccessMessage('Profile updated successfully! 🎉');
                setShowSuccessToast(true);
                
                // Navigate back after a short delay
                setTimeout(() => {
                    router.back();
                }, 2500);
            }
        } catch (error: any) {
            console.error('❌ Profile update error:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to update profile. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={sizeScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Cover Image Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cover Image</Text>
                    <TouchableOpacity
                        style={styles.coverImageContainer}
                        onPress={() => handlePickImage('coverImage')}
                    >
                        {coverImage || user?.coverImage ? (
                            <>
                                <Image
                                    source={{ uri: coverImage?.uri || user?.coverImage || PLACEHOLDER_IMG }}
                                    style={styles.coverImage}
                                />
                                {coverImage && (
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => handleRemoveImage('coverImage')}
                                    >
                                        <Feather name="x" size={sizeScale(16)} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Feather name="camera" size={sizeScale(32)} color="#666" />
                                <Text style={styles.imagePlaceholderText}>Add Cover Image</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Profile Images Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Images</Text>
                    <View style={styles.imagesRow}>
                        {/* User Photo */}
                        <View style={styles.imageBox}>
                            <Text style={styles.imageLabel}>Your Photo</Text>
                            <TouchableOpacity
                                style={styles.imageContainer}
                                onPress={() => handlePickImage('userPhoto')}
                            >
                                {userPhoto || user?.userPhoto ? (
                                    <>
                                        <Image
                                            source={{ uri: userPhoto?.uri || user?.userPhoto || PLACEHOLDER_IMG }}
                                            style={styles.profileImage}
                                        />
                                        {userPhoto && (
                                            <TouchableOpacity
                                                style={styles.removeImageButtonSmall}
                                                onPress={() => handleRemoveImage('userPhoto')}
                                            >
                                                <Feather name="x" size={sizeScale(12)} color="#fff" />
                                            </TouchableOpacity>
                                        )}
                                    </>
                                ) : (
                                    <View style={styles.imagePlaceholderSmall}>
                                        <Feather name="user" size={sizeScale(24)} color="#666" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Company Logo */}
                        <View style={styles.imageBox}>
                            <Text style={styles.imageLabel}>Company Logo</Text>
                            <TouchableOpacity
                                style={styles.imageContainer}
                                onPress={() => handlePickImage('logo')}
                            >
                                {logo || user?.logo ? (
                                    <>
                                        <Image
                                            source={{ uri: logo?.uri || user?.logo || PLACEHOLDER_IMG }}
                                            style={styles.profileImage}
                                        />
                                        {logo && (
                                            <TouchableOpacity
                                                style={styles.removeImageButtonSmall}
                                                onPress={() => handleRemoveImage('logo')}
                                            >
                                                <Feather name="x" size={sizeScale(12)} color="#fff" />
                                            </TouchableOpacity>
                                        )}
                                    </>
                                ) : (
                                    <View style={styles.imagePlaceholderSmall}>
                                        <Feather name="briefcase" size={sizeScale(24)} color="#666" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Basic Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Your Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your name"
                            placeholderTextColor="#666"
                            value={userName}
                            onChangeText={setUserName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Company Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter company name"
                            placeholderTextColor="#666"
                            value={companyName}
                            onChangeText={setCompanyName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Brief description"
                            placeholderTextColor="#666"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Category</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Business category"
                            placeholderTextColor="#666"
                            value={category}
                            onChangeText={setCategory}
                        />
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Tell us about your company..."
                        placeholderTextColor="#666"
                        value={about}
                        onChangeText={setAbout}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Address Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Address Information</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Business Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter business address"
                            placeholderTextColor="#666"
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Registered Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter registered address"
                            placeholderTextColor="#666"
                            value={registeredAddress}
                            onChangeText={setRegisteredAddress}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Operational Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter operational address"
                            placeholderTextColor="#666"
                            value={operationalAddress}
                            onChangeText={setOperationalAddress}
                        />
                    </View>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Success Toast */}
            <SuccessToast
                message={successMessage}
                visible={showSuccessToast}
                onDismiss={() => setShowSuccessToast(false)}
            />
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
        justifyContent: 'space-between',
        paddingHorizontal: sizeScale(16),
        paddingVertical: sizeScale(12),
        paddingTop: sizeScale(50),
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        padding: sizeScale(8),
    },
    headerTitle: {
        fontSize: sizeScale(18),
        fontWeight: '600',
        color: '#fff',
    },
    saveButton: {
        backgroundColor: '#0095f6',
        paddingHorizontal: sizeScale(20),
        paddingVertical: sizeScale(8),
        borderRadius: sizeScale(8),
        minWidth: sizeScale(60),
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: sizeScale(120),
    },
    section: {
        padding: sizeScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    sectionTitle: {
        fontSize: sizeScale(16),
        fontWeight: '600',
        color: '#fff',
        marginBottom: sizeScale(16),
    },
    coverImageContainer: {
        width: '100%',
        height: sizeScale(200),
        borderRadius: sizeScale(12),
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: sizeScale(8),
    },
    imagePlaceholderText: {
        fontSize: sizeScale(14),
        color: '#666',
    },
    removeImageButton: {
        position: 'absolute',
        top: sizeScale(12),
        right: sizeScale(12),
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: sizeScale(32),
        height: sizeScale(32),
        borderRadius: sizeScale(16),
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagesRow: {
        flexDirection: 'row',
        gap: sizeScale(16),
    },
    imageBox: {
        flex: 1,
    },
    imageLabel: {
        fontSize: sizeScale(13),
        color: '#999',
        marginBottom: sizeScale(8),
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: sizeScale(12),
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        position: 'relative',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholderSmall: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageButtonSmall: {
        position: 'absolute',
        top: sizeScale(8),
        right: sizeScale(8),
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: sizeScale(24),
        height: sizeScale(24),
        borderRadius: sizeScale(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputGroup: {
        marginBottom: sizeScale(16),
    },
    inputLabel: {
        fontSize: sizeScale(14),
        color: '#fff',
        marginBottom: sizeScale(8),
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: sizeScale(8),
        padding: sizeScale(12),
        fontSize: sizeScale(15),
        color: '#fff',
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    textArea: {
        minHeight: sizeScale(100),
        paddingTop: sizeScale(12),
    },
    bottomPadding: {
        height: sizeScale(20),
    },
    // Toast Styles
    toastContainer: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 149, 246, 0.95)',
        paddingVertical: sizeScale(12),
        paddingHorizontal: sizeScale(20),
        borderRadius: sizeScale(25),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        gap: sizeScale(8),
    },
    toastText: {
        color: '#fff',
        fontSize: sizeScale(15),
        fontWeight: '600',
    },
});