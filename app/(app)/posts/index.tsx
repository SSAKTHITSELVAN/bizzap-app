// app/(app)/posts/index.tsx - FIXED PROFILE NAVIGATION

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
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { postsAPI, Post, Comment } from '../../../services/posts';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { getCompanyLogoUrl, getUserPhotoUrl } from '../../../utils/s3Utils';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

const HEADER_HEIGHT = sizeScale(110);

// --- Animated Header with Tabs ---
const AnimatedHeader = ({ 
  scrollY, 
  activeTab, 
  onTabChange 
}: { 
  scrollY: Animated.Value;
  activeTab: 'posts' | 'bizz';
  onTabChange: (tab: 'posts' | 'bizz') => void;
}) => {
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View 
      style={[
        styles.headerWrapper,
        {
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
        }
      ]}
    >
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.topBar}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>Bizz</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => onTabChange('posts')}
          >
            <MaterialCommunityIcons 
              name="post-outline" 
              size={sizeScale(20)} 
              color={activeTab === 'posts' ? '#fff' : '#888'} 
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Posts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bizz' && styles.activeTab]}
            onPress={() => onTabChange('bizz')}
          >
            <MaterialCommunityIcons 
              name="video-outline" 
              size={sizeScale(20)} 
              color={activeTab === 'bizz' ? '#fff' : '#888'} 
            />
            <Text style={[styles.tabText, activeTab === 'bizz' && styles.activeTabText]}>
              Videos
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

// --- Comments Modal Component ---
const CommentsModal = ({ 
  visible, 
  postId, 
  onClose,
  onCommentAdded
}: { 
  visible: boolean; 
  postId: string | null;
  onClose: () => void;
  onCommentAdded: () => void;
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      fetchComments();
    } else {
      setComments([]);
      setNewComment('');
    }
  }, [visible, postId]);

  const fetchComments = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const response = await postsAPI.getComments(postId);
      setComments(response.data);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', error.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId) return;

    setSubmitting(true);
    try {
      const response = await postsAPI.addComment(postId, {
        comment: newComment.trim()
      });
      
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      onCommentAdded();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const userPhotoResult = getUserPhotoUrl(
      item.company.userPhoto,
      item.company.userName || item.company.companyName
    );
    
    const companyLogoResult = getCompanyLogoUrl(
      item.company.logo,
      item.company.companyName
    );
    
    const commentAvatarUrl = userPhotoResult || companyLogoResult;
    
    return (
      <View style={styles.commentItem}>
        <Image
          source={{ uri: commentAvatarUrl }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <View style={styles.commentAuthorSection}>
              {item.company.userName && (
                <Text style={styles.commentAuthor}>{item.company.userName}</Text>
              )}
              <Text style={styles.commentCompanyName}>{item.company.companyName}</Text>
            </View>
            <Text style={styles.commentTime}>{getTimeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.commentText}>{item.comment}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#4C1D95" />
              </View>
            ) : (
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.commentsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#555" />
                    <Text style={styles.emptyText}>No comments yet</Text>
                    <Text style={styles.emptySubtext}>Be the first to comment!</Text>
                  </View>
                }
              />
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="#888"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newComment.trim() || submitting) && styles.sendButtonDisabled
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

// --- Post Card Component (Community Style) ---
const PostCard = React.memo(({ 
  post, 
  onLike,
  onSave,
  onComment,
  onVideoPress,
  onProfilePress,
  isVisible
}: { 
  post: Post; 
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onComment: (postId: string) => void;
  onVideoPress: (postId: string) => void;
  onProfilePress: (companyId: string) => void;
  isVisible: boolean;
}) => {
  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const userPhotoResult = getUserPhotoUrl(
    post.company.userPhoto,
    post.company.userName || post.company.companyName
  );
  
  const companyLogoResult = getCompanyLogoUrl(
    post.company.logo,
    post.company.companyName
  );
  
  const avatarUrl = userPhotoResult || companyLogoResult;

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const renderContent = (text: string) => {
    const maxLength = 200;
    const shouldTruncate = text.length > maxLength && !expanded;
    const displayText = shouldTruncate ? text.substring(0, maxLength) + '...' : text;
    
    const parts = displayText.split(/(#\w+)/g);
    return (
      <View>
        <Text style={styles.postContent}>
          {parts.map((part, index) => {
            if (part.startsWith('#')) {
              return (
                <Text key={index} style={styles.hashtag}>
                  {part}
                </Text>
              );
            }
            return <Text key={index}>{part}</Text>;
          })}
        </Text>
        {text.length > maxLength && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.showMoreText}>
              {expanded ? 'Show less' : 'Show more'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const hasImages = post.images && post.images.length > 0;
  const hasVideo = post.video && post.video.length > 0;
  const hasMultipleImages = hasImages && post.images.length > 1;

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };

  useEffect(() => {
    if (hasVideo) {
      if (isVisible) {
        videoRef.current?.playAsync();
      } else {
        videoRef.current?.pauseAsync();
        videoRef.current?.setPositionAsync(0);
      }
    }
  }, [isVisible, hasVideo]);

  return (
    <View style={styles.cardContainer}>
      {/* Header - FIXED: Added onPress handler */}
      <TouchableOpacity 
        style={styles.cardHeader}
        onPress={() => onProfilePress(post.company.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.avatar}
          />
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameSection}>
            {post.company.userName ? (
              <>
                <Text style={styles.userName}>{post.company.userName}</Text>
                <Feather name="check-circle" size={sizeScale(14)} color="#4C1D95" style={styles.verifiedBadge} />
              </>
            ) : (
              <Text style={styles.userName}>{post.company.companyName}</Text>
            )}
          </View>
          {post.company.userName && (
            <Text style={styles.companyName}>{post.company.companyName}</Text>
          )}
          <Text style={styles.timestamp}>{getTimeAgo(post.createdAt)}</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={sizeScale(20)} color="#888" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.contentSection}>
        {renderContent(post.content)}
      </View>

      {/* Media Section */}
      {hasImages ? (
        <View style={styles.mediaContainer}>
          <Image 
            source={{ uri: post.images[0] }} 
            style={styles.postImage} 
            resizeMode="cover"
          />
          
          {hasMultipleImages && (
            <View style={styles.imageCountBadge}>
              <Ionicons name="images" size={sizeScale(16)} color="#fff" />
              <Text style={styles.imageCountText}>1/{post.images.length}</Text>
            </View>
          )}
        </View>
      ) : hasVideo ? (
        <TouchableOpacity 
          style={styles.videoContainer}
          onPress={() => onVideoPress(post.id)}
          activeOpacity={0.9}
        >
          <Video
            ref={videoRef}
            source={{ uri: post.video }}
            style={styles.postVideo}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={false}
            isMuted={isMuted}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          
          <View style={styles.videoOverlay}>
            <View style={styles.playIconContainer}>
              <Ionicons name="play-circle" size={sizeScale(56)} color="rgba(255, 255, 255, 0.9)" />
            </View>
            <View style={styles.videoBadge}>
              <MaterialCommunityIcons name="video" size={sizeScale(16)} color="#fff" />
              <Text style={styles.videoBadgeText}>Video</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Engagement Stats */}
      <View style={styles.engagementStats}>
        <View style={styles.statsLeft}>
          {post.likesCount > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="heart" size={sizeScale(14)} color="#FF0050" />
              <Text style={styles.statText}>{formatCount(post.likesCount)}</Text>
            </View>
          )}
        </View>
        <View style={styles.statsRight}>
          {post.commentsCount > 0 && (
            <Text style={styles.statText}>{formatCount(post.commentsCount)} comments</Text>
          )}
          {post.sharesCount > 0 && (
            <Text style={styles.statText}> • {formatCount(post.sharesCount)} shares</Text>
          )}
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Ionicons 
            name={post.isLiked ? "heart" : "heart-outline"} 
            size={sizeScale(22)} 
            color={post.isLiked ? "#FF0050" : "#888"} 
          />
          <Text style={[styles.actionText, post.isLiked && styles.actionTextActive]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onComment(post.id)}
        >
          <MaterialCommunityIcons 
            name="comment-outline" 
            size={sizeScale(22)} 
            color="#888" 
          />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onSave(post.id)}
        >
          <Ionicons 
            name={post.isSaved ? "bookmark" : "bookmark-outline"} 
            size={sizeScale(22)} 
            color={post.isSaved ? "#4C1D95" : "#888"} 
          />
          <Text style={[styles.actionText, post.isSaved && styles.actionTextSaved]}>
            Save
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Feather name="share-2" size={sizeScale(20)} color="#888" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const formatCount = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

// --- Main Posts Feed Component ---
export default function PostsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollToPostId = params.scrollToPostId as string | undefined;
  
  const [activeTab, setActiveTab] = useState<'posts' | 'bizz'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasScrolledToItem, setHasScrolledToItem] = useState(false);
  const [visibleItemId, setVisibleItemId] = useState<string | null>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const fetchPosts = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      const response = await postsAPI.getAllPosts(pageNum, 10);
      
      if (isRefresh) {
        setPosts(response.data);
      } else {
        setPosts(prev => pageNum === 1 ? response.data : [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === 10);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', error.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts(1);
    } else {
      router.push('/posts/videos');
    }
  }, [activeTab]);

  useEffect(() => {
    if (scrollToPostId && posts.length > 0 && !hasScrolledToItem) {
      const index = posts.findIndex(post => post.id === scrollToPostId);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
          setHasScrolledToItem(true);
        }, 500);
      }
    }
  }, [scrollToPostId, posts, hasScrolledToItem]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasScrolledToItem(false);
    fetchPosts(1, true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const firstVisibleItem = viewableItems[0];
      setVisibleItemId(firstVisibleItem.item.id);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 300,
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
      Alert.alert('Error', error.message || 'Failed to update like');
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
      Alert.alert('Error', error.message || 'Failed to update save');
    }
  };

  const handleComment = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
  };

  const handleVideoPress = (postId: string) => {
    router.push({
      pathname: '/posts/videos',
      params: { startPostId: postId }
    });
  };

  // FIXED: Profile navigation handler
  const handleProfilePress = (companyId: string) => {
    console.log('Navigating to company profile:', companyId);
    router.push(`/posts/${companyId}`);
  };

  const handleCommentAdded = () => {
    if (selectedPostId) {
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === selectedPostId) {
            return {
              ...post,
              commentsCount: post.commentsCount + 1
            };
          }
          return post;
        })
      );
    }
  };

  const handleScrollToIndexFailed = (info: any) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0.5,
      });
    });
  };

  const renderItem = ({ item }: { item: Post }) => (
    <PostCard 
      post={item} 
      onLike={handleLike}
      onSave={handleSave}
      onComment={handleComment}
      onVideoPress={handleVideoPress}
      onProfilePress={handleProfilePress}
      isVisible={item.id === visibleItemId}
    />
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4C1D95" />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C1D95" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AnimatedHeader 
        scrollY={scrollY} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <Animated.FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4C1D95"
            progressViewOffset={HEADER_HEIGHT + 20}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={7}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <MaterialCommunityIcons name="post-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to create a post!</Text>
          </View>
        }
      />

      <CommentsModal
        visible={commentsModalVisible}
        postId={selectedPostId}
        onClose={() => setCommentsModalVisible(false)}
        onCommentAdded={handleCommentAdded}
      />
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  
  // Header
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
  },
  backButton: {
    width: sizeScale(40),
  },
  headerTitle: {
    fontSize: sizeScale(22),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: sizeScale(0.3),
  },
  iconButton: {
    width: sizeScale(40),
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: sizeScale(16),
    gap: sizeScale(12),
    paddingBottom: sizeScale(12),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(6),
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(8),
    borderRadius: sizeScale(20),
    backgroundColor: '#1A1A1A',
  },
  activeTab: {
    backgroundColor: '#4C1D95',
  },
  tabText: {
    fontSize: sizeScale(14),
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#fff',
  },
  
  // FlatList
  flatListContent: {
    paddingTop: HEADER_HEIGHT + sizeScale(8),
    paddingBottom: sizeScale(120),
  },
  
  // Card Container
  cardContainer: {
    backgroundColor: '#0F0F0F',
    marginHorizontal: sizeScale(12),
    marginVertical: sizeScale(6),
    borderRadius: sizeScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: sizeScale(14),
    paddingBottom: sizeScale(12),
  },
  avatarContainer: {
    width: sizeScale(44),
    height: sizeScale(44),
    borderRadius: sizeScale(22),
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
    marginRight: sizeScale(12),
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sizeScale(2),
  },
  userName: {
    fontSize: sizeScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: sizeScale(4),
  },
  verifiedBadge: {
    marginLeft: sizeScale(2),
  },
  companyName: {
    fontSize: sizeScale(13),
    color: '#999',
    marginBottom: sizeScale(2),
  },
  timestamp: {
    fontSize: sizeScale(12),
    color: '#666',
  },
  menuButton: {
    padding: sizeScale(4),
  },
  
  // Content Section
  contentSection: {
    paddingHorizontal: sizeScale(14),
    paddingBottom: sizeScale(12),
  },
  postContent: {
    fontSize: sizeScale(15),
    color: '#E5E5E5',
    lineHeight: sizeScale(22),
  },
  hashtag: {
    color: '#4C1D95',
    fontWeight: '500',
  },
  showMoreText: {
    fontSize: sizeScale(14),
    color: '#999',
    marginTop: sizeScale(6),
    fontWeight: '500',
  },
  
  // Media Container
  mediaContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageCountBadge: {
    position: 'absolute',
    top: sizeScale(12),
    right: sizeScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(4),
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: sizeScale(10),
    paddingVertical: sizeScale(6),
    borderRadius: sizeScale(16),
  },
  imageCountText: {
    fontSize: sizeScale(12),
    color: '#fff',
    fontWeight: '600',
  },
  
  // Video Container
  videoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  postVideo: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    width: sizeScale(64),
    height: sizeScale(64),
    borderRadius: sizeScale(32),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: sizeScale(12),
    left: sizeScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(4),
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: sizeScale(10),
    paddingVertical: sizeScale(6),
    borderRadius: sizeScale(16),
  },
  videoBadgeText: {
    fontSize: sizeScale(12),
    color: '#fff',
    fontWeight: '600',
  },
  
  // Engagement Stats
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizeScale(14),
    paddingVertical: sizeScale(10),
    borderTopWidth: 0.5,
    borderTopColor: '#1F1F1F',
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(8),
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(4),
  },
  statText: {
    fontSize: sizeScale(13),
    color: '#999',
  },
  
  // Action Bar
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#1F1F1F',
    paddingHorizontal: sizeScale(6),
    paddingVertical: sizeScale(4),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeScale(6),
    paddingVertical: sizeScale(10),
    borderRadius: sizeScale(6),
  },
  actionText: {
    fontSize: sizeScale(14),
    color: '#999',
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#FF0050',
  },
  actionTextSaved: {
    color: '#4C1D95',
  },
  
  // Empty State
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.75,
    height: SCREEN_HEIGHT * 0.75,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthorSection: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentCompanyName: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#E5E5E5',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    backgroundColor: '#0F0F0F',
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    marginRight: 12,
    fontSize: 14,
    color: '#FFFFFF',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4C1D95',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});