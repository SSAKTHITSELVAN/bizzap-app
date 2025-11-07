// // app/(app)/posts/videos.tsx

// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   StyleSheet, 
//   FlatList, 
//   TouchableOpacity, 
//   Dimensions,
//   ActivityIndicator,
//   Alert,
//   Pressable,
//   StatusBar,
//   Modal,
//   TextInput,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { Feather, Ionicons } from '@expo/vector-icons';
// import { postsAPI, Post, Comment } from '../../../services/posts';
// import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
// import { getCompanyLogoUrl, getUserPhotoUrl } from '../../../utils/s3Utils';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// const STANDARD_WIDTH = 390;
// const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// // --- Comments Modal Component ---
// const CommentsModal = ({ 
//   visible, 
//   postId, 
//   onClose,
//   onCommentAdded
// }: { 
//   visible: boolean; 
//   postId: string | null;
//   onClose: () => void;
//   onCommentAdded: () => void;
// }) => {
//   const [comments, setComments] = useState<Comment[]>([]);
//   const [newComment, setNewComment] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     if (visible && postId) {
//       fetchComments();
//     } else {
//       setComments([]);
//       setNewComment('');
//     }
//   }, [visible, postId]);

//   const fetchComments = async () => {
//     if (!postId) return;
    
//     setLoading(true);
//     try {
//       const response = await postsAPI.getComments(postId);
//       setComments(response.data);
//     } catch (error: any) {
//       console.error('Error fetching comments:', error);
//       Alert.alert('Error', error.message || 'Failed to load comments');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddComment = async () => {
//     if (!newComment.trim() || !postId) return;

//     setSubmitting(true);
//     try {
//       const response = await postsAPI.addComment(postId, {
//         comment: newComment.trim()
//       });
      
//       setComments(prev => [response.data, ...prev]);
//       setNewComment('');
//       onCommentAdded();
//     } catch (error: any) {
//       console.error('Error adding comment:', error);
//       Alert.alert('Error', error.message || 'Failed to add comment');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const getTimeAgo = (dateString: string) => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
//     if (seconds < 60) return 'Just now';
//     if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
//     if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
//     return `${Math.floor(seconds / 86400)}d ago`;
//   };

//   const renderComment = ({ item }: { item: Comment }) => {
//     const userPhotoResult = getUserPhotoUrl(
//       item.company.userPhoto,
//       item.company.userName || item.company.companyName
//     );
    
//     const companyLogoResult = getCompanyLogoUrl(
//       item.company.logo,
//       item.company.companyName
//     );
    
//     const commentAvatarUrl = userPhotoResult || companyLogoResult;
    
//     return (
//       <View style={styles.commentItem}>
//         <Image
//           source={{ uri: commentAvatarUrl }}
//           style={styles.commentAvatar}
//         />
//         <View style={styles.commentContent}>
//           <View style={styles.commentHeader}>
//             <View style={styles.commentAuthorSection}>
//               {item.company.userName && (
//                 <Text style={styles.commentAuthor}>{item.company.userName}</Text>
//               )}
//               <Text style={styles.commentCompanyName}>{item.company.companyName}</Text>
//             </View>
//             <Text style={styles.commentTime}>{getTimeAgo(item.createdAt)}</Text>
//           </View>
//           <Text style={styles.commentText}>{item.comment}</Text>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       transparent={true}
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContainer}>
//           <KeyboardAvoidingView
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//             style={styles.modalKeyboardView}
//           >
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Comments</Text>
//               <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//                 <Ionicons name="close" size={28} color="#FFFFFF" />
//               </TouchableOpacity>
//             </View>

//             {loading ? (
//               <View style={styles.modalLoadingContainer}>
//                 <ActivityIndicator size="large" color="#4C1D95" />
//               </View>
//             ) : (
//               <FlatList
//                 data={comments}
//                 renderItem={renderComment}
//                 keyExtractor={(item) => item.id}
//                 contentContainerStyle={styles.commentsList}
//                 showsVerticalScrollIndicator={false}
//                 ListEmptyComponent={
//                   <View style={styles.emptyContainer}>
//                     <Ionicons name="chatbubbles-outline" size={64} color="#555" />
//                     <Text style={styles.emptyText}>No comments yet</Text>
//                     <Text style={styles.emptySubtext}>Be the first to comment!</Text>
//                   </View>
//                 }
//               />
//             )}

//             <View style={styles.inputContainer}>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Add a comment..."
//                 placeholderTextColor="#888"
//                 value={newComment}
//                 onChangeText={setNewComment}
//                 multiline
//                 maxLength={500}
//               />
//               <TouchableOpacity
//                 style={[
//                   styles.sendButton,
//                   (!newComment.trim() || submitting) && styles.sendButtonDisabled
//                 ]}
//                 onPress={handleAddComment}
//                 disabled={!newComment.trim() || submitting}
//               >
//                 {submitting ? (
//                   <ActivityIndicator size="small" color="#FFFFFF" />
//                 ) : (
//                   <Ionicons name="send" size={20} color="#FFFFFF" />
//                 )}
//               </TouchableOpacity>
//             </View>
//           </KeyboardAvoidingView>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// // --- Reels Video Item Component ---
// const ReelsVideoItem = React.memo(({ 
//   post, 
//   isActive,
//   onLike,
//   onSave,
//   onComment,
//   onBack,
// }: { 
//   post: Post;
//   isActive: boolean;
//   onLike: (postId: string) => void;
//   onSave: (postId: string) => void;
//   onComment: (postId: string) => void;
//   onBack: () => void;
// }) => {
//   const videoRef = useRef<Video>(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isExpanded, setIsExpanded] = useState(false);

//   useEffect(() => {
//     if (isActive) {
//       videoRef.current?.playAsync();
//     } else {
//       videoRef.current?.pauseAsync();
//     }
//   }, [isActive]);

//   const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
//     if (status.isLoaded) {
//       setIsPlaying(status.isPlaying);
//     }
//   };

//   const togglePlayPause = async () => {
//     if (isPlaying) {
//       await videoRef.current?.pauseAsync();
//     } else {
//       await videoRef.current?.playAsync();
//     }
//   };

//   const formatCount = (num: number) => {
//     if (num >= 1000000) {
//       return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
//     }
//     if (num >= 1000) {
//       return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
//     }
//     return num.toString();
//   };

//   const renderContent = (text: string, expanded: boolean) => {
//     const parts = text.split(/(#\w+)/g);
//     const maxLength = expanded ? 1000 : 50;
//     let currentLength = 0;
//     let truncated = false;
    
//     const renderedParts = parts.map((part, index) => {
//       if (currentLength >= maxLength && !expanded) {
//         if (!truncated) {
//           truncated = true;
//           return <Text key={index} style={styles.reelsContent}>...</Text>;
//         }
//         return null;
//       }
//       currentLength += part.length;
      
//       if (part.startsWith('#')) {
//         return (
//           <Text key={index} style={styles.reelsHashtag}>
//             {part}
//           </Text>
//         );
//       }
//       return <Text key={index}>{part}</Text>;
//     }).filter(Boolean);

//     return (
//       <Text 
//         style={styles.reelsContent} 
//         numberOfLines={expanded ? undefined : 2}
//       >
//         {renderedParts}
//       </Text>
//     );
//   };

//   const userPhotoResult = getUserPhotoUrl(
//     post.company.userPhoto,
//     post.company.userName || post.company.companyName
//   );
  
//   const companyLogoResult = getCompanyLogoUrl(
//     post.company.logo,
//     post.company.companyName
//   );
  
//   const avatarUrl = userPhotoResult || companyLogoResult;

//   return (
//     <View style={styles.reelsContainer}>
//       {/* Video Player */}
//       <Pressable 
//         style={styles.videoWrapper}
//         onPress={togglePlayPause}
//       >
//         <Video
//           ref={videoRef}
//           source={{ uri: post.video }}
//           style={styles.reelsVideo}
//           resizeMode={ResizeMode.CONTAIN}
//           isLooping
//           shouldPlay={isActive}
//           isMuted={isMuted}
//           onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
//         />

//         {/* Play/Pause Indicator */}
//         {!isPlaying && (
//           <View style={styles.pauseIndicator}>
//             <Ionicons name="play" size={60} color="rgba(255, 255, 255, 0.8)" />
//           </View>
//         )}
//       </Pressable>

//       {/* Top Overlay - Back Button */}
//       <SafeAreaView style={styles.topOverlay} edges={['top']}>
//         <View style={styles.topControls}>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={onBack}
//           >
//             <Ionicons name="arrow-back" size={28} color="#fff" />
//           </TouchableOpacity>
//           <Text style={styles.reelsTitle}>Bizz</Text>
//           <TouchableOpacity style={styles.cameraButton}>
//             <Ionicons name="camera-outline" size={28} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>

//       {/* Bottom Overlay - User Info & Content */}
//       <TouchableOpacity 
//         activeOpacity={1}
//         onPress={() => setIsExpanded(!isExpanded)}
//         style={styles.bottomOverlay}
//       >
//         <View style={styles.userSection}>
//           {/* User Info */}
//           <View style={styles.userRow}>
//             <View style={styles.reelsAvatarContainer}>
//               <Image 
//                 source={{ uri: avatarUrl }} 
//                 style={styles.reelsAvatar} 
//               />
//             </View>
//             <View style={styles.userInfoSection}>
//               {post.company.userName ? (
//                 <>
//                   <Text 
//                     style={styles.reelsUsername} 
//                     numberOfLines={isExpanded ? undefined : 1}
//                   >
//                     {post.company.userName}
//                   </Text>
//                   <Text 
//                     style={styles.reelsCompanyName}
//                     numberOfLines={isExpanded ? undefined : 1}
//                   >
//                     {post.company.companyName}
//                   </Text>
//                 </>
//               ) : (
//                 <Text 
//                   style={styles.reelsUsername} 
//                   numberOfLines={isExpanded ? undefined : 1}
//                 >
//                   {post.company.companyName}
//                 </Text>
//               )}
//             </View>
//             <TouchableOpacity style={styles.followButton}>
//               <Text style={styles.followButtonText}>Follow</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Content */}
//           <View style={styles.contentContainer}>
//             {renderContent(post.content, isExpanded)}
//           </View>

//           {/* Audio/Music indicator */}
//           <View style={styles.audioRow}>
//             <Ionicons name="musical-notes" size={14} color="#fff" />
//             <Text 
//               style={styles.audioText} 
//               numberOfLines={isExpanded ? undefined : 1}
//             >
//               Original audio
//             </Text>
//           </View>
//         </View>
//       </TouchableOpacity>

//       {/* Right Side Actions */}
//       <View style={styles.rightActions}>
//         {/* Like */}
//         <TouchableOpacity 
//           style={styles.actionButton}
//           onPress={() => onLike(post.id)}
//         >
//           <Ionicons 
//             name={post.isLiked ? "heart" : "heart-outline"} 
//             size={32} 
//             color={post.isLiked ? "#FF0050" : "#fff"} 
//           />
//           <Text style={styles.actionText}>{formatCount(post.likesCount)}</Text>
//         </TouchableOpacity>

//         {/* Comment */}
//         <TouchableOpacity 
//           style={styles.actionButton}
//           onPress={() => onComment(post.id)}
//         >
//           <Ionicons name="chatbubble-outline" size={30} color="#fff" />
//           <Text style={styles.actionText}>{formatCount(post.commentsCount)}</Text>
//         </TouchableOpacity>

//         {/* Save */}
//         <TouchableOpacity 
//           style={styles.actionButton}
//           onPress={() => onSave(post.id)}
//         >
//           <Ionicons 
//             name={post.isSaved ? "bookmark" : "bookmark-outline"} 
//             size={30} 
//             color={post.isSaved ? "#FFD700" : "#fff"} 
//           />
//           <Text style={styles.actionText}>{formatCount(post.savesCount)}</Text>
//         </TouchableOpacity>

//         {/* Share */}
//         <TouchableOpacity style={styles.actionButton}>
//           <Ionicons name="paper-plane-outline" size={30} color="#fff" />
//           <Text style={styles.actionText}>{formatCount(post.sharesCount)}</Text>
//         </TouchableOpacity>

//         {/* Mute/Unmute */}
//         <TouchableOpacity 
//           style={styles.actionButton}
//           onPress={() => setIsMuted(!isMuted)}
//         >
//           <Ionicons 
//             name={isMuted ? "volume-mute" : "volume-high"} 
//             size={28} 
//             color="#fff" 
//           />
//         </TouchableOpacity>

//         {/* More Options */}
//         <TouchableOpacity style={styles.actionButton}>
//           <Feather name="more-vertical" size={28} color="#fff" />
//         </TouchableOpacity>

//         {/* Company Logo/Avatar at Bottom */}
//         <View style={styles.bottomAvatar}>
//           <Image 
//             source={{ uri: companyLogoResult || avatarUrl }} 
//             style={styles.bottomAvatarImage} 
//           />
//         </View>
//       </View>
//     </View>
//   );
// });

// // --- Main Reels Screen ---
// export default function VideosScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const [posts, setPosts] = useState<Post[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [commentsModalVisible, setCommentsModalVisible] = useState(false);
//   const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
//   const flatListRef = useRef<FlatList>(null);

//   // Hide tab bar when this screen is focused
//   useFocusEffect(
//     useCallback(() => {
//       // Get parent navigation to access tab bar
//       const parent = router as any;
//       if (parent?.setOptions) {
//         parent.setOptions({
//           tabBarStyle: { display: 'none' }
//         });
//       }

//       // Show tab bar when leaving this screen
//       return () => {
//         if (parent?.setOptions) {
//           parent.setOptions({
//             tabBarStyle: { display: 'flex' }
//           });
//         }
//       };
//     }, [router])
//   );

//   const fetchVideoPosts = async (pageNum: number = 1) => {
//     try {
//       const response = await postsAPI.getVideoPosts(pageNum, 10);
      
//       if (pageNum === 1) {
//         setPosts(response.data);
        
//         // If there's a startPostId, find its index
//         if (params.startPostId) {
//           const startIndex = response.data.findIndex(p => p.id === params.startPostId);
//           if (startIndex !== -1) {
//             setCurrentIndex(startIndex);
//             setTimeout(() => {
//               flatListRef.current?.scrollToIndex({ index: startIndex, animated: false });
//             }, 100);
//           }
//         }
//       } else {
//         setPosts(prev => [...prev, ...response.data]);
//       }
      
//       setHasMore(response.data.length === 10);
//     } catch (error: any) {
//       console.error('Error fetching video posts:', error);
//       Alert.alert('Error', error.message || 'Failed to load videos');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchVideoPosts(1);
//   }, []);

//   const loadMore = () => {
//     if (!loading && hasMore) {
//       const nextPage = page + 1;
//       setPage(nextPage);
//       fetchVideoPosts(nextPage);
//     }
//   };

//   const handleLike = async (postId: string) => {
//     try {
//       setPosts(prevPosts => 
//         prevPosts.map(post => {
//           if (post.id === postId) {
//             const newIsLiked = !post.isLiked;
//             return {
//               ...post,
//               isLiked: newIsLiked,
//               likesCount: newIsLiked ? post.likesCount + 1 : post.likesCount - 1
//             };
//           }
//           return post;
//         })
//       );

//       const response = await postsAPI.toggleLike(postId);
      
//       setPosts(prevPosts => 
//         prevPosts.map(post => {
//           if (post.id === postId) {
//             return {
//               ...post,
//               isLiked: response.data.liked,
//               likesCount: response.data.likesCount
//             };
//           }
//           return post;
//         })
//       );
//     } catch (error: any) {
//       console.error('Error toggling like:', error);
//       setPosts(prevPosts => 
//         prevPosts.map(post => {
//           if (post.id === postId) {
//             const revertIsLiked = !post.isLiked;
//             return {
//               ...post,
//               isLiked: revertIsLiked,
//               likesCount: revertIsLiked ? post.likesCount + 1 : post.likesCount - 1
//             };
//           }
//           return post;
//         })
//       );
//     }
//   };

//   const handleSave = async (postId: string) => {
//     try {
//       setPosts(prevPosts => 
//         prevPosts.map(post => {
//           if (post.id === postId) {
//             const newIsSaved = !post.isSaved;
//             return {
//               ...post,
//               isSaved: newIsSaved,
//               savesCount: newIsSaved ? post.savesCount + 1 : post.savesCount - 1
//             };
//           }
//           return post;
//         })
//       );

//       const response = await postsAPI.toggleSave(postId);
      
//       setPosts(prevPosts => 
//         prevPosts.map(post => {
//           if (post.id === postId) {
//             return {
//               ...post,
//               isSaved: response.data.saved,
//               savesCount: response.data.savesCount
//             };
//           }
//           return post;
//         })
//       );
//     } catch (error: any) {
//       console.error('Error toggling save:', error);
//       setPosts(prevPosts => 
//         prevPosts.map(post => {
//           if (post.id === postId) {
//             const revertIsSaved = !post.isSaved;
//             return {
//               ...post,
//               isSaved: revertIsSaved,
//               savesCount: revertIsSaved ? post.savesCount + 1 : post.savesCount - 1
//             };
//           }
//           return post;
//         })
//       );
//     }
//   };

//   const handleComment = (postId: string) => {
//     setSelectedPostId(postId);
//     setCommentsModalVisible(true);
//   };

//   const handleCommentAdded = () => {
//     if (selectedPostId) {
//       setPosts(prevPosts =>
//         prevPosts.map(post => {
//           if (post.id === selectedPostId) {
//             return {
//               ...post,
//               commentsCount: post.commentsCount + 1
//             };
//           }
//           return post;
//         })
//       );
//     }
//   };

//   const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
//     if (viewableItems.length > 0) {
//       setCurrentIndex(viewableItems[0].index || 0);
//     }
//   }, []);

//   const viewabilityConfig = {
//     itemVisiblePercentThreshold: 50,
//   };

//   const handleBack = () => {
//     if (router.canGoBack()) {
//       router.back();
//     } else {
//       router.replace('/posts');
//     }
//   };

//   const renderItem = ({ item, index }: { item: Post; index: number }) => (
//     <ReelsVideoItem
//       post={item}
//       isActive={index === currentIndex}
//       onLike={handleLike}
//       onSave={handleSave}
//       onComment={handleComment}
//       onBack={handleBack}
//     />
//   );

//   if (loading && posts.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#fff" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.screen}>
//       <StatusBar barStyle="light-content" backgroundColor="#000" />
      
//       <FlatList
//         ref={flatListRef}
//         data={posts}
//         renderItem={renderItem}
//         keyExtractor={(item) => item.id}
//         pagingEnabled
//         showsVerticalScrollIndicator={false}
//         snapToInterval={SCREEN_HEIGHT}
//         snapToAlignment="start"
//         decelerationRate="fast"
//         onViewableItemsChanged={onViewableItemsChanged}
//         viewabilityConfig={viewabilityConfig}
//         onEndReached={loadMore}
//         onEndReachedThreshold={0.5}
//         removeClippedSubviews
//         maxToRenderPerBatch={3}
//         windowSize={5}
//         initialNumToRender={2}
//         getItemLayout={(data, index) => ({
//           length: SCREEN_HEIGHT,
//           offset: SCREEN_HEIGHT * index,
//           index,
//         })}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="videocam-outline" size={64} color="#555" />
//             <Text style={styles.emptyText}>No videos yet</Text>
//           </View>
//         }
//       />

//       <CommentsModal
//         visible={commentsModalVisible}
//         postId={selectedPostId}
//         onClose={() => setCommentsModalVisible(false)}
//         onCommentAdded={handleCommentAdded}
//       />
//     </View>
//   );
// }

// // --- Stylesheet ---
// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//     backgroundColor: '#000000',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000000',
//   },

//   // Reels Container
//   reelsContainer: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     backgroundColor: '#000',
//     position: 'relative',
//   },
//   videoWrapper: {
//     width: '100%',
//     height: '100%',
//   },
//   reelsVideo: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#000',
//   },
//   pauseIndicator: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -30,
//     marginTop: -30,
//   },

//   // Top Overlay
//   topOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 10,
//   },
//   topControls: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   backButton: {
//     padding: 8,
//   },
//   reelsTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   cameraButton: {
//     padding: 8,
//   },

//   // Bottom Overlay
//   bottomOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 80,
//     paddingBottom: 40,
//     paddingHorizontal: 16,
//     paddingTop: 100,
//     backgroundColor: 'transparent',
//   },
//   userSection: {
//     gap: 10,
//   },
//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   reelsAvatarContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     overflow: 'hidden',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   reelsAvatar: {
//     width: '100%',
//     height: '100%',
//   },
//   userInfoSection: {
//     flex: 1,
//   },
//   reelsUsername: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#fff',
//     textShadowColor: 'rgba(0, 0, 0, 0.75)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
//   reelsCompanyName: {
//     fontSize: 13,
//     fontWeight: '500',
//     color: '#fff',
//     opacity: 0.8,
//     marginTop: 2,
//     textShadowColor: 'rgba(0, 0, 0, 0.75)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
//   followButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 6,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: '#fff',
//   },
//   followButtonText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   contentContainer: {
//     gap: 4,
//   },
//   reelsContent: {
//     fontSize: 14,
//     color: '#fff',
//     lineHeight: 18,
//     textShadowColor: 'rgba(0, 0, 0, 0.75)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
//   reelsHashtag: {
//     color: '#1D9BF0',
//     fontWeight: '600',
//     textShadowColor: 'rgba(0, 0, 0, 0.75)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
//   audioRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   audioText: {
//     fontSize: 13,
//     color: '#fff',
//     fontWeight: '500',
//     flex: 1,
//     textShadowColor: 'rgba(0, 0, 0, 0.75)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   // Right Actions
//   rightActions: {
//     position: 'absolute',
//     right: 12,
//     bottom: 100,
//     gap: 24,
//     alignItems: 'center',
//   },
//   actionButton: {
//     alignItems: 'center',
//     gap: 4,
//   },
//   actionText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#fff',
//     textShadowColor: 'rgba(0, 0, 0, 0.75)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
//   bottomAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 8,
//     overflow: 'hidden',
//     borderWidth: 2,
//     borderColor: '#fff',
//     marginTop: 8,
//   },
//   bottomAvatarImage: {
//     width: '100%',
//     height: '100%',
//   },

//   // Empty State
//   emptyContainer: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#fff',
//     marginTop: 16,
//   },

//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     justifyContent: 'flex-end',
//   },
//   modalContainer: {
//     backgroundColor: '#1A1A1A',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: SCREEN_HEIGHT * 0.75,
//     height: SCREEN_HEIGHT * 0.75,
//   },
//   modalKeyboardView: {
//     flex: 1,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#333',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   modalLoadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   commentsList: {
//     padding: 16,
//   },
//   commentItem: {
//     flexDirection: 'row',
//     marginBottom: 20,
//   },
//   commentAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#0D0D0D',
//     marginRight: 12,
//   },
//   commentContent: {
//     flex: 1,
//   },
//   commentHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//     marginBottom: 6,
//   },
//   commentAuthorSection: {
//     flex: 1,
//   },
//   commentAuthor: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   commentCompanyName: {
//     fontSize: 12,
//     color: '#888',
//     marginTop: 2,
//   },
//   commentTime: {
//     fontSize: 12,
//     color: '#666',
//   },
//   commentText: {
//     fontSize: 14,
//     color: '#CCCCCC',
//     lineHeight: 20,
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 60,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     padding: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#333',
//     backgroundColor: '#1A1A1A',
//   },
//   input: {
//     flex: 1,
//     backgroundColor: '#0D0D0D',
//     borderRadius: 24,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     paddingTop: 10,
//     marginRight: 12,
//     fontSize: 14,
//     color: '#FFFFFF',
//     maxHeight: 100,
//   },
//   sendButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#4C1D95',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   sendButtonDisabled: {
//     opacity: 0.5,
//   },
// });


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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { postsAPI, Post, Comment } from '../../../services/posts';
import { followersAPI } from '../../../services/user';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { getCompanyLogoUrl, getUserPhotoUrl } from '../../../utils/s3Utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

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
                  <View style={styles.emptyCommentsContainer}>
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

// --- Reels Video Item Component ---
const ReelsVideoItem = React.memo(({ 
  post, 
  isActive,
  onLike,
  onSave,
  onComment,
  onBack,
  onFollowToggle,
}: { 
  post: Post;
  isActive: boolean;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onComment: (postId: string) => void;
  onBack: () => void;
  onFollowToggle: (companyId: string, currentStatus: boolean) => Promise<boolean>;
}) => {
  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isActive]);

  useEffect(() => {
    // Check follow status when component mounts or post changes
    checkFollowStatus();
  }, [post.company.id]);

  const checkFollowStatus = async () => {
    try {
      const status = await followersAPI.checkFollowStatus(post.company.id);
      setIsFollowing(status.isFollowing);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const handleFollowPress = async () => {
    if (followLoading) return;

    setFollowLoading(true);
    try {
      const newStatus = await onFollowToggle(post.company.id, isFollowing);
      setIsFollowing(newStatus);
    } catch (error) {
      console.error('Error in follow toggle:', error);
    } finally {
      setFollowLoading(false);
    }
  };

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

  const userPhotoResult = getUserPhotoUrl(
    post.company.userPhoto,
    post.company.userName || post.company.companyName
  );
  
  const companyLogoResult = getCompanyLogoUrl(
    post.company.logo,
    post.company.companyName
  );
  
  const avatarUrl = userPhotoResult || companyLogoResult;

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
          resizeMode={ResizeMode.CONTAIN}
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
            onPress={onBack}
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
                source={{ uri: avatarUrl }} 
                style={styles.reelsAvatar} 
              />
            </View>
            <View style={styles.userInfoSection}>
              {post.company.userName ? (
                <>
                  <Text 
                    style={styles.reelsUsername} 
                    numberOfLines={isExpanded ? undefined : 1}
                  >
                    {post.company.userName}
                  </Text>
                  <Text 
                    style={styles.reelsCompanyName}
                    numberOfLines={isExpanded ? undefined : 1}
                  >
                    {post.company.companyName}
                  </Text>
                </>
              ) : (
                <Text 
                  style={styles.reelsUsername} 
                  numberOfLines={isExpanded ? undefined : 1}
                >
                  {post.company.companyName}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
                followLoading && styles.followButtonDisabled
              ]}
              onPress={handleFollowPress}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? "#4C1D95" : "#fff"} />
              ) : (
                <Text style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText
                ]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
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
            source={{ uri: companyLogoResult || avatarUrl }} 
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
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  // Hide tab bar when this screen is focused
  useFocusEffect(
    useCallback(() => {
      // Get parent navigation to access tab bar
      const parent = router as any;
      if (parent?.setOptions) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }

      // Show tab bar when leaving this screen
      return () => {
        if (parent?.setOptions) {
          parent.setOptions({
            tabBarStyle: { display: 'flex' }
          });
        }
      };
    }, [router])
  );

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

  const handleFollowToggle = async (companyId: string, currentStatus: boolean): Promise<boolean> => {
    try {
      if (currentStatus) {
        await followersAPI.unfollowCompany(companyId);
        return false;
      } else {
        await followersAPI.followCompany(companyId);
        return true;
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', error.message || 'Failed to update follow status');
      // Return current status on error to maintain state
      return currentStatus;
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
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
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

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/posts');
    }
  };

  const renderItem = ({ item, index }: { item: Post; index: number }) => (
    <ReelsVideoItem
      post={item}
      isActive={index === currentIndex}
      onLike={handleLike}
      onSave={handleSave}
      onComment={handleComment}
      onBack={handleBack}
      onFollowToggle={handleFollowToggle}
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
    backgroundColor: '#000',
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
  },
  reelsAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  reelsAvatar: {
    width: '100%',
    height: '100%',
  },
  userInfoSection: {
    flex: 1,
  },
  reelsUsername: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  reelsCompanyName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
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
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'rgba(76, 29, 149, 0.2)',
    borderColor: '#4C1D95',
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  followingButtonText: {
    color: '#4C1D95',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.75,
    height: SCREEN_HEIGHT * 0.75,
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
    borderBottomColor: '#333',
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
    backgroundColor: '#0D0D0D',
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
    color: '#888',
    marginTop: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1A1A1A',
  },
  input: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    marginRight: 12,
    fontSize: 14,
    color: '#FFFFFF',
    maxHeight: 100,
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