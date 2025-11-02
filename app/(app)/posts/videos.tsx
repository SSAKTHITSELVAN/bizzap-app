// app/(app)/posts/videos.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Alert,
  Pressable,
  StatusBar,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { postsAPI, Post } from '../../../services/posts';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { getS3ImageUrl } from '../../../utils/s3Utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Reels Video Item Component ---
const ReelsVideoItem = React.memo(({ 
  post, 
  isActive,
  onLike,
  onSave,
  onComment,
}: { 
  post: Post;
  isActive: boolean;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onComment: (postId: string) => void;
}) => {
  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isActive]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  };

  const renderContent = (text: string, expanded: boolean) => {
    const parts = text.split(/(#\w+)/g);
    const maxLength = expanded ? 1000 : 50;
    let currentLength = 0;
    let truncated = false;
    
    const renderedParts = parts.map((part, index) => {
      if (currentLength >= maxLength && !expanded) {
        if (!truncated) {
          truncated = true;
          return <Text key={index} style={styles.reelsContent}>...</Text>;
        }
        return null;
      }
      currentLength += part.length;
      
      if (part.startsWith('#')) {
        return (
          <Text key={index} style={styles.reelsHashtag}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    }).filter(Boolean);

    return (
      <Text 
        style={styles.reelsContent} 
        numberOfLines={expanded ? undefined : 2}
      >
        {renderedParts}
      </Text>
    );
  };

  return (
    <View style={styles.reelsContainer}>
      {/* Video Player */}
      <Pressable 
        style={styles.videoWrapper}
        onPress={togglePlayPause}
      >
        <Video
          ref={videoRef}
          source={{ uri: post.video }}
          style={styles.reelsVideo}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isActive}
          isMuted={isMuted}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Play/Pause Indicator */}
        {!isPlaying && (
          <View style={styles.pauseIndicator}>
            <Ionicons name="play" size={60} color="rgba(255, 255, 255, 0.8)" />
          </View>
        )}
      </Pressable>

      {/* Top Overlay - Back Button */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.topControls}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              const router = useRouter();
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.reelsTitle}>Bizz</Text>
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom Overlay - User Info & Content */}
      <TouchableOpacity 
        activeOpacity={1}
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.bottomOverlay}
      >
        <View style={styles.userSection}>
          {/* User Info */}
          <View style={styles.userRow}>
            <View style={styles.reelsAvatarContainer}>
              <Image 
                source={{ 
                  uri: getS3ImageUrl(post.company.userPhoto || post.company.logo) || 
                  'https://via.placeholder.com/48/0D0D0D/ffffff?text=B' 
                }} 
                style={styles.reelsAvatar} 
              />
            </View>
            <Text 
              style={styles.reelsUsername} 
              numberOfLines={isExpanded ? undefined : 1}
            >
              {post.company.companyName}
            </Text>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {renderContent(post.content, isExpanded)}
          </View>

          {/* Audio/Music indicator */}
          <View style={styles.audioRow}>
            <Ionicons name="musical-notes" size={14} color="#fff" />
            <Text 
              style={styles.audioText} 
              numberOfLines={isExpanded ? undefined : 1}
            >
              Original audio
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Side Actions */}
      <View style={styles.rightActions}>
        {/* Like */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Ionicons 
            name={post.isLiked ? "heart" : "heart-outline"} 
            size={32} 
            color={post.isLiked ? "#FF0050" : "#fff"} 
          />
          <Text style={styles.actionText}>{formatCount(post.likesCount)}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onComment(post.id)}
        >
          <Ionicons name="chatbubble-outline" size={30} color="#fff" />
          <Text style={styles.actionText}>{formatCount(post.commentsCount)}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onSave(post.id)}
        >
          <Ionicons 
            name={post.isSaved ? "bookmark" : "bookmark-outline"} 
            size={30} 
            color={post.isSaved ? "#FFD700" : "#fff"} 
          />
          <Text style={styles.actionText}>{formatCount(post.savesCount)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={30} color="#fff" />
          <Text style={styles.actionText}>{formatCount(post.sharesCount)}</Text>
        </TouchableOpacity>

        {/* Mute/Unmute */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Ionicons 
            name={isMuted ? "volume-mute" : "volume-high"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>

        {/* More Options */}
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="more-vertical" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Company Logo/Avatar at Bottom */}
        <View style={styles.bottomAvatar}>
          <Image 
            source={{ 
              uri: getS3ImageUrl(post.company.logo || post.company.userPhoto) || 
              'https://via.placeholder.com/48/0D0D0D/ffffff?text=B' 
            }} 
            style={styles.bottomAvatarImage} 
          />
        </View>
      </View>
    </View>
  );
});

// --- Main Reels Screen ---
export default function VideosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const flatListRef = useRef<FlatList>(null);

  const fetchVideoPosts = async (pageNum: number = 1) => {
    try {
      const response = await postsAPI.getVideoPosts(pageNum, 10);
      
      if (pageNum === 1) {
        setPosts(response.data);
        
        // If there's a startPostId, find its index
        if (params.startPostId) {
          const startIndex = response.data.findIndex(p => p.id === params.startPostId);
          if (startIndex !== -1) {
            setCurrentIndex(startIndex);
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: startIndex, animated: false });
            }, 100);
          }
        }
      } else {
        setPosts(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === 10);
    } catch (error: any) {
      console.error('Error fetching video posts:', error);
      Alert.alert('Error', error.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoPosts(1);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideoPosts(nextPage);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const newIsLiked = !post.isLiked;
            return {
              ...post,
              isLiked: newIsLiked,
              likesCount: newIsLiked ? post.likesCount + 1 : post.likesCount - 1
            };
          }
          return post;
        })
      );

      const response = await postsAPI.toggleLike(postId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: response.data.liked,
              likesCount: response.data.likesCount
            };
          }
          return post;
        })
      );
    } catch (error: any) {
      console.error('Error toggling like:', error);
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const revertIsLiked = !post.isLiked;
            return {
              ...post,
              isLiked: revertIsLiked,
              likesCount: revertIsLiked ? post.likesCount + 1 : post.likesCount - 1
            };
          }
          return post;
        })
      );
    }
  };

  const handleSave = async (postId: string) => {
    try {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const newIsSaved = !post.isSaved;
            return {
              ...post,
              isSaved: newIsSaved,
              savesCount: newIsSaved ? post.savesCount + 1 : post.savesCount - 1
            };
          }
          return post;
        })
      );

      const response = await postsAPI.toggleSave(postId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isSaved: response.data.saved,
              savesCount: response.data.savesCount
            };
          }
          return post;
        })
      );
    } catch (error: any) {
      console.error('Error toggling save:', error);
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const revertIsSaved = !post.isSaved;
            return {
              ...post,
              isSaved: revertIsSaved,
              savesCount: revertIsSaved ? post.savesCount + 1 : post.savesCount - 1
            };
          }
          return post;
        })
      );
    }
  };

  const handleComment = (postId: string) => {
    Alert.alert('Comments', 'Comments feature for reels');
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderItem = ({ item, index }: { item: Post; index: number }) => (
    <ReelsVideoItem
      post={item}
      isActive={index === currentIndex}
      onLike={handleLike}
      onSave={handleSave}
      onComment={handleComment}
    />
  );

  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>No videos yet</Text>
          </View>
        }
      />
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },

  // Reels Container
  reelsContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  reelsVideo: {
    width: '100%',
    height: '100%',
  },
  pauseIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
  },

  // Top Overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  reelsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  cameraButton: {
    padding: 8,
  },

  // Bottom Overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 80,
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 100,
    backgroundColor: 'transparent',
  },
  userSection: {
    gap: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  reelsAvatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  reelsAvatar: {
    width: '100%',
    height: '100%',
  },
  reelsUsername: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  contentContainer: {
    gap: 4,
  },
  reelsContent: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  reelsHashtag: {
    color: '#1D9BF0',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Right Actions
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    gap: 24,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    marginTop: 8,
  },
  bottomAvatarImage: {
    width: '100%',
    height: '100%',
  },

  // Empty State
  emptyContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
});