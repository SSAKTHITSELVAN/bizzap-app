// app/(app)/bizzapai/create-post.tsx

import React, { useState, useCallback } from 'react'; // Import useCallback
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Animated, // Import Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { postsAPI } from '../../../services/posts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

interface MediaFile {
  uri: string;
  type: string;
  name: string;
  file?: File; // For web
}

// --- New Toast/Pop-up Component ---
interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

const PostSuccessToast: React.FC<ToastProps> = ({ message, visible, onDismiss }) => {
  const [fadeAnim] = useState(new Animated.Value(0)); // Initial value for opacity: 0

  React.useEffect(() => {
    if (visible) {
      // Show animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Automatically hide after 2 seconds
        const timer = setTimeout(() => {
          // Hide animation
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
        {
          opacity: fadeAnim, // Bind opacity to animated value
        },
      ]}
      pointerEvents="none" // Ensure it doesn't block taps
    >
      <View style={styles.toastContent}>
        <Ionicons name="checkmark-circle" size={sizeScale(20)} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};
// --- End Toast/Pop-up Component ---


export default function CreatePostScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- New state for success pop-up ---
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Function to reset the form
  const resetForm = useCallback(() => {
    setContent('');
    setMediaFiles([]);
    setMediaType(null);
  }, []);
  // --- End New state for success pop-up ---


  // Convert blob URI to File object for web
  const uriToFile = async (uri: string, fileName: string, mimeType: string): Promise<File | null> => {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new File([blob], fileName, { type: mimeType });
      }
      return null;
    } catch (error) {
      console.error('Error converting URI to File:', error);
      return null;
    }
  };

  const handlePickImages = async () => {
    if (mediaType === 'video') {
      Alert.alert('Media Limit', 'You can only upload either images or a video, not both.');
      return;
    }

    if (mediaFiles.length >= 5) {
      Alert.alert('Image Limit', 'You can only upload up to 5 images.');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - mediaFiles.length,
      });

      if (!result.canceled) {
        const newImages: MediaFile[] = await Promise.all(
          result.assets.map(async (asset, index) => {
            const fileName = asset.fileName || `image_${Date.now()}_${index}.jpg`;
            const mimeType = asset.mimeType || 'image/jpeg';
            const file = Platform.OS === 'web' 
              ? await uriToFile(asset.uri, fileName, mimeType)
              : undefined;

            return {
              uri: asset.uri,
              type: mimeType,
              name: fileName,
              file: file || undefined,
            };
          })
        );

        setMediaFiles([...mediaFiles, ...newImages]);
        setMediaType('image');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const handlePickVideo = async () => {
    if (mediaType === 'image') {
      Alert.alert('Media Limit', 'You can only upload either images or a video, not both.');
      return;
    }

    if (mediaFiles.length > 0) {
      Alert.alert('Video Limit', 'You can only upload one video.');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const fileName = result.assets[0].fileName || `video_${Date.now()}.mp4`;
        const mimeType = result.assets[0].mimeType || 'video/mp4';
        const file = Platform.OS === 'web' 
          ? await uriToFile(result.assets[0].uri, fileName, mimeType)
          : undefined;

        const video: MediaFile = {
          uri: result.assets[0].uri,
          type: mimeType,
          name: fileName,
          file: file || undefined,
        };

        setMediaFiles([video]);
        setMediaType('video');
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const handleRemoveMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    if (newFiles.length === 0) {
      setMediaType(null);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!content.trim()) {
      Alert.alert('Required Field', 'Please enter content for your post.');
      return;
    }

    if (mediaFiles.length === 0) {
      Alert.alert('Media Required', 'Please add at least one image or video.');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData: any = {
        content: content.trim(),
      };

      if (mediaType === 'image') {
        // For web, use File objects; for native, use original format
        postData.images = mediaFiles.map(file => 
          Platform.OS === 'web' && file.file
            ? file.file
            : {
                uri: file.uri,
                type: file.type,
                name: file.name,
              }
        );
      } else if (mediaType === 'video') {
        // For web, use File object; for native, use original format
        const videoFile = mediaFiles[0];
        postData.video = Platform.OS === 'web' && videoFile.file
          ? videoFile.file
          : {
              uri: videoFile.uri,
              type: videoFile.type,
              name: videoFile.name,
            };
      }

      console.log('📤 Submitting post:', {
        contentLength: content.length,
        mediaType,
        mediaCount: mediaFiles.length,
      });

      const response = await postsAPI.createPostWithMedia(postData);

      if (response.statusCode === 201) {
        // --- NEW: Show success toast instead of Alert ---
        setSuccessMessage('Post created successfully! 🎉');
        setShowSuccessToast(true);
        resetForm(); // Reset the form immediately
        // --- END NEW ---
      }
    } catch (error: any) {
      console.error('❌ Post creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NEW: Function to dismiss the toast ---
  const handleDismissToast = () => {
    setShowSuccessToast(false);
    setSuccessMessage('');
  };
  // --- END NEW ---

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={sizeScale(24)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          style={[
            styles.postButton,
            (!content.trim() || mediaFiles.length === 0 || isSubmitting) &&
              styles.postButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!content.trim() || mediaFiles.length === 0 || isSubmitting}
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Media Preview Section */}
        <View style={styles.mediaSection}>
          <Text style={styles.sectionLabel}>Media *</Text>
          <Text style={styles.sectionHint}>
            Add up to 5 images (10MB each) OR 1 video (100MB max)
          </Text>
          
          {mediaFiles.length === 0 ? (
            <View style={styles.mediaPickerContainer}>
              <TouchableOpacity
                style={styles.mediaPickerButton}
                onPress={handlePickImages}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="image-multiple"
                  size={sizeScale(40)}
                  color="#4C1D95"
                />
                <Text style={styles.mediaPickerText}>Add Photos</Text>
                <Text style={styles.mediaPickerSubtext}>Up to 5 images</Text>
              </TouchableOpacity>

              <View style={styles.mediaDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.mediaPickerButton}
                onPress={handlePickVideo}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="video-plus"
                  size={sizeScale(40)}
                  color="#4C1D95"
                />
                <Text style={styles.mediaPickerText}>Add Video</Text>
                <Text style={styles.mediaPickerSubtext}>Max 60 seconds</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mediaPreviewContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaPreviewScroll}
              >
                {mediaFiles.map((file, index) => (
                  <View key={index} style={styles.mediaPreviewItem}>
                    {mediaType === 'image' ? (
                      <Image source={{ uri: file.uri }} style={styles.previewImage} />
                    ) : (
                      <Video
                        source={{ uri: file.uri }}
                        style={styles.previewVideo}
                        useNativeControls
                        resizeMode="cover"
                      />
                    )}
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => handleRemoveMedia(index)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={sizeScale(24)} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {mediaType === 'image' && mediaFiles.length < 5 && (
                  <TouchableOpacity
                    style={styles.addMoreButton}
                    onPress={handlePickImages}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={sizeScale(32)}
                      color="#666"
                    />
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Content Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>What's on your mind? *</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            placeholder="Share your story, product details, or announcement... 🚀"
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
            maxLength={2000}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <Text style={styles.charCount}>{content.length}/2000}</Text>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* --- NEW: Success Pop-up Renderer --- */}
      <PostSuccessToast
        message={successMessage}
        visible={showSuccessToast}
        onDismiss={handleDismissToast}
      />
      {/* --- END NEW --- */}
    </SafeAreaView>
  );
}

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
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    padding: sizeScale(8),
  },
  headerTitle: {
    fontSize: sizeScale(18),
    fontWeight: '700',
    color: '#fff',
  },
  postButton: {
    backgroundColor: '#4C1D95',
    paddingHorizontal: sizeScale(20),
    paddingVertical: sizeScale(8),
    borderRadius: sizeScale(20),
    minWidth: sizeScale(70),
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#2a2a2a',
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: sizeScale(15),
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  mediaSection: {
    padding: sizeScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  sectionLabel: {
    fontSize: sizeScale(14),
    fontWeight: '600',
    color: '#fff',
    marginBottom: sizeScale(4),
  },
  sectionHint: {
    fontSize: sizeScale(12),
    color: '#666',
    marginBottom: sizeScale(12),
  },
  mediaPickerContainer: {
    gap: sizeScale(16),
  },
  mediaPickerButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(16),
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    padding: sizeScale(32),
    alignItems: 'center',
    gap: sizeScale(8),
  },
  mediaPickerText: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#fff',
    marginTop: sizeScale(8),
  },
  mediaPickerSubtext: {
    fontSize: sizeScale(13),
    color: '#666',
  },
  mediaDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(12),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  dividerText: {
    fontSize: sizeScale(13),
    color: '#666',
    fontWeight: '600',
  },
  mediaPreviewContainer: {
    marginTop: sizeScale(8),
  },
  mediaPreviewScroll: {
    gap: sizeScale(12),
  },
  mediaPreviewItem: {
    position: 'relative',
    width: sizeScale(160),
    height: sizeScale(200),
    borderRadius: sizeScale(12),
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  removeMediaButton: {
    position: 'absolute',
    top: sizeScale(8),
    right: sizeScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: sizeScale(12),
  },
  addMoreButton: {
    width: sizeScale(160),
    height: sizeScale(200),
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(12),
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputSection: {
    padding: sizeScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(12),
    padding: sizeScale(16),
    fontSize: sizeScale(15),
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  contentInput: {
    minHeight: sizeScale(180),
    paddingTop: sizeScale(16),
  },
  charCount: {
    fontSize: sizeScale(12),
    color: '#666',
    textAlign: 'right',
    marginTop: sizeScale(8),
  },
  bottomPadding: {
    height: sizeScale(40),
  },
  // --- NEW Styles for Toast/Pop-up ---
  toastContainer: {
    position: 'absolute',
    top: '40%', // Position it in the middle (vertically)
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 29, 149, 0.95)', // A dark-ish background, maybe matching the primary color
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
  // --- END NEW Styles ---
});