// // // app/(app)/dashboard/index.tsx

// // import React, { useState, useEffect } from 'react';
// // import { 
// //   View, 
// //   Text, 
// //   StyleSheet, 
// //   ScrollView,
// //   TouchableOpacity,
// //   Dimensions,
// //   ActivityIndicator,
// //   Image,
// //   RefreshControl,
// //   Alert,
// // } from 'react-native';
// // import { useRouter } from 'expo-router';
// // import { Ionicons } from '@expo/vector-icons';
// // import { LinearGradient } from 'expo-linear-gradient';
// // import { postsAPI } from '../../../services/posts';
// // import { leadsAPI } from '../../../services/leads';
// // import { chatAPI } from '../../../services/chat-websocket';

// // const SCREEN_WIDTH = Dimensions.get('window').width;
// // const STANDARD_WIDTH = 390;
// // const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// // interface Post {
// //   id: string;
// //   content: string;
// //   likesCount: number;
// //   commentsCount: number;
// //   images?: string[];
// //   video?: string;
// //   company: {
// //     companyName: string;
// //     logo?: string;
// //     userPhoto?: string;
// //   };
// // }

// // interface Lead {
// //   id: string;
// //   title: string;
// //   description: string;
// //   companyName: string;
// //   city: string;
// //   state: string;
// //   budget?: string;
// //   quantity?: string;
// //   location?: string;
// //   image?: string;
// //   isDeleted: boolean;
// //   isActive: boolean;
// //   company?: {
// //     companyName: string;
// //     logo?: string;
// //   };
// // }

// // interface Conversation {
// //   partnerId: string;
// //   partner: {
// //     id: string;
// //     companyName: string;
// //     phoneNumber: string;
// //     logo: string | null;
// //   };
// //   lastMessage: string;
// //   lastMessageAt: string;
// //   messageCount: number;
// //   unreadCount: number;
// // }

// // // --- Trending Post Card ---
// // const PostCard = ({ post, onPress }: { post: Post; onPress?: () => void }) => {
// //   const formatCount = (num: number) => {
// //     if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
// //     if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
// //     return num.toString();
// //   };

// //   const hasMedia = (post.images && post.images.length > 0) || post.video;
// //   const mediaUrl = post.video || (post.images && post.images[0]);

// //   return (
// //     <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.7}>
// //       {/* Post Header */}
// //       <View style={styles.postHeader}>
// //         <View style={styles.postAvatar}>
// //           {post.company?.logo || post.company?.userPhoto ? (
// //             <Image 
// //               source={{ uri: post.company.logo || post.company.userPhoto }} 
// //               style={styles.postAvatarImage}
// //             />
// //           ) : (
// //             <Text style={styles.postAvatarText}>
// //               {post.company?.companyName?.charAt(0) || 'B'}
// //             </Text>
// //           )}
// //         </View>
// //         <Text style={styles.postCompany} numberOfLines={1}>
// //           {post.company?.companyName || 'Company'}
// //         </Text>
// //       </View>

// //       {/* Post Media */}
// //       {hasMedia && (
// //         <View style={styles.postMediaContainer}>
// //           <Image
// //             source={{ uri: mediaUrl }}
// //             style={styles.postMedia}
// //             resizeMode="cover"
// //           />
// //           {post.video && (
// //             <View style={styles.videoIndicator}>
// //               <Ionicons name="play-circle" size={sizeScale(40)} color="rgba(255,255,255,0.9)" />
// //             </View>
// //           )}
// //         </View>
// //       )}

// //       {/* Post Content */}
// //       <View style={styles.postContent}>
// //         <Text style={styles.postText} numberOfLines={3}>
// //           {post.content}
// //         </Text>
// //       </View>

// //       {/* Post Footer */}
// //       <View style={styles.postFooter}>
// //         <View style={styles.postStat}>
// //           <Ionicons name="heart" size={sizeScale(18)} color="#FF0050" />
// //           <Text style={styles.postStatText}>{formatCount(post.likesCount)}</Text>
// //         </View>
// //         <View style={styles.postStat}>
// //           <Ionicons name="chatbubble" size={sizeScale(16)} color="#00ADEF" />
// //           <Text style={styles.postStatText}>{formatCount(post.commentsCount)}</Text>
// //         </View>
// //       </View>
// //     </TouchableOpacity>
// //   );
// // };

// // // --- Lead Card (Compact) ---
// // const LeadCardCompact = ({ lead, onPress }: { lead: Lead; onPress?: () => void }) => {
// //   const formatNumber = (num: string | null) => {
// //     if (!num) return null;
// //     const n = parseInt(num);
// //     if (isNaN(n)) return num;
// //     if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
// //     if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
// //     return num;
// //   };

// //   const imageUrl = lead.image?.startsWith('data:image')
// //     ? lead.image
// //     : lead.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400';

// //   return (
// //     <TouchableOpacity style={styles.leadCard} onPress={onPress} activeOpacity={0.7}>
// //       {/* Lead Image */}
// //       <View style={styles.leadImageContainer}>
// //         <Image
// //           source={{ uri: imageUrl }}
// //           style={styles.leadImage}
// //           resizeMode="cover"
// //         />
// //         {lead.budget && (
// //           <View style={styles.budgetBadge}>
// //             <Text style={styles.budgetText}>{lead.budget}</Text>
// //           </View>
// //         )}
// //       </View>

// //       {/* Lead Content */}
// //       <View style={styles.leadContent}>
// //         <Text style={styles.leadTitle} numberOfLines={2}>
// //           {lead.title}
// //         </Text>
// //         <Text style={styles.leadDescription} numberOfLines={2}>
// //           {lead.description}
// //         </Text>

// //         {/* Lead Meta */}
// //         <View style={styles.leadMeta}>
// //           {lead.location && (
// //             <View style={styles.leadMetaItem}>
// //               <Ionicons name="location" size={sizeScale(12)} color="#888" />
// //               <Text style={styles.leadMetaText} numberOfLines={1}>
// //                 {lead.location}
// //               </Text>
// //             </View>
// //           )}
// //           {lead.quantity && (
// //             <View style={styles.leadMetaItem}>
// //               <Ionicons name="cube" size={sizeScale(12)} color="#888" />
// //               <Text style={styles.leadMetaText}>
// //                 {formatNumber(lead.quantity)}
// //               </Text>
// //             </View>
// //           )}
// //         </View>

// //         {/* CTA Button */}
// //         <TouchableOpacity onPress={onPress}>
// //           <LinearGradient
// //             colors={['#3b82f6', '#8b5cf6']}
// //             start={{ x: 0, y: 0.5 }}
// //             end={{ x: 1, y: 0.5 }}
// //             style={styles.leadButton}
// //           >
// //             <Text style={styles.leadButtonText}>View Details</Text>
// //           </LinearGradient>
// //         </TouchableOpacity>
// //       </View>
// //     </TouchableOpacity>
// //   );
// // };

// // // --- Chat Card ---
// // const ChatCard = ({ conversation, onPress }: { conversation: Conversation; onPress?: () => void }) => {
// //   const formatTime = (timestamp: string) => {
// //     if (!timestamp) return '';
// //     const date = new Date(timestamp);
// //     const now = new Date();
// //     const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
// //     if (diffInMinutes < 1) return 'now';
// //     if (diffInMinutes < 60) return `${diffInMinutes}m`;
// //     if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
// //     return `${Math.floor(diffInMinutes / 1440)}d`;
// //   };

// //   return (
// //     <TouchableOpacity style={styles.chatCard} onPress={onPress} activeOpacity={0.7}>
// //       <View style={styles.chatAvatar}>
// //         {conversation.partner?.logo ? (
// //           <Image 
// //             source={{ uri: conversation.partner.logo }} 
// //             style={styles.chatAvatarImage}
// //           />
// //         ) : (
// //           <Text style={styles.chatAvatarText}>
// //             {conversation.partner?.companyName?.charAt(0) || 'C'}
// //           </Text>
// //         )}
// //       </View>
// //       <View style={styles.chatInfo}>
// //         <Text style={styles.chatName}>
// //           {conversation.partner?.companyName || 'Unknown'}
// //         </Text>
// //         <Text style={styles.chatMessage} numberOfLines={1}>
// //           {conversation.lastMessage || 'No messages yet'}
// //         </Text>
// //       </View>
// //       <View style={styles.chatMeta}>
// //         <Text style={styles.chatTime}>
// //           {formatTime(conversation.lastMessageAt)}
// //         </Text>
// //         {conversation.unreadCount > 0 && (
// //           <View style={styles.unreadBadge}>
// //             <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
// //           </View>
// //         )}
// //       </View>
// //     </TouchableOpacity>
// //   );
// // };

// // // --- Main Dashboard Component ---
// // export default function DashboardScreen() {
// //   const router = useRouter();
// //   const [loading, setLoading] = useState(true);
// //   const [refreshing, setRefreshing] = useState(false);
// //   const [posts, setPosts] = useState<Post[]>([]);
// //   const [leads, setLeads] = useState<Lead[]>([]);
// //   const [conversations, setConversations] = useState<Conversation[]>([]);

// //   useEffect(() => {
// //     fetchAllData();
// //   }, []);

// //   const fetchAllData = async () => {
// //     try {
// //       setLoading(true);
      
// //       const results = await Promise.allSettled([
// //         postsAPI.getAllPosts(1, 10),
// //         leadsAPI.getAllLeads(),
// //         chatAPI.getConversations(),
// //       ]);

// //       const postsResult = results[0];
// //       const leadsResult = results[1];
// //       const chatsResult = results[2];

// //       if (postsResult.status === 'fulfilled' && postsResult.value?.data) {
// //         const sortedPosts = postsResult.value.data
// //           .sort((a: Post, b: Post) => b.likesCount - a.likesCount)
// //           .slice(0, 6);
// //         setPosts(sortedPosts);
// //       }

// //       if (leadsResult.status === 'fulfilled' && leadsResult.value?.data) {
// //         const activeLeads = leadsResult.value.data
// //           .filter((lead: Lead) => 
// //             !lead.isDeleted && 
// //             lead.isActive && 
// //             lead.title && 
// //             lead.title.trim() !== ''
// //           )
// //           .slice(0, 4);
// //         setLeads(activeLeads);
// //       }

// //       if (chatsResult.status === 'fulfilled' && chatsResult.value?.data) {
// //         const recentChats = chatsResult.value.data
// //           .sort((a: Conversation, b: Conversation) => 
// //             new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
// //           )
// //           .slice(0, 5);
// //         setConversations(recentChats);
// //       }

// //     } catch (error) {
// //       console.error('Error fetching dashboard data:', error);
// //       Alert.alert('Error', 'Failed to load dashboard data');
// //     } finally {
// //       setLoading(false);
// //       setRefreshing(false);
// //     }
// //   };

// //   const onRefresh = () => {
// //     setRefreshing(true);
// //     fetchAllData();
// //   };

// //   // Navigation handlers for specific items
// //   const handlePostPress = (postId: string) => {
// //     // Navigate to posts screen and scroll to specific post
// //     router.push({
// //       pathname: '/(app)/posts',
// //       params: { scrollToPostId: postId }
// //     });
// //   };

// //   const handleLeadPress = (leadId: string) => {
// //     // Navigate to leads screen and scroll to specific lead
// //     router.push({
// //       pathname: '/(app)/lead',
// //       params: { scrollToLeadId: leadId }
// //     });
// //   };

// //   const handleChatPress = (partnerId: string) => {
// //     // Navigate to chat screen and open specific conversation
// //     router.push({
// //       pathname: '/(app)/chat',
// //       params: { openChatWithId: partnerId }
// //     });
// //   };

// //   if (loading) {
// //     return (
// //       <View style={styles.loadingContainer}>
// //         <ActivityIndicator size="large" color="#4C1D95" />
// //         <Text style={styles.loadingText}>Loading dashboard...</Text>
// //       </View>
// //     );
// //   }

// //   return (
// //     <ScrollView 
// //       style={styles.container}
// //       contentContainerStyle={styles.contentContainer}
// //       showsVerticalScrollIndicator={false}
// //       refreshControl={
// //         <RefreshControl
// //           refreshing={refreshing}
// //           onRefresh={onRefresh}
// //           tintColor="#4C1D95"
// //           colors={['#4C1D95']}
// //         />
// //       }
// //     >
// //       {/* Welcome Section */}
// //       <View style={styles.welcomeSection}>
// //         <Text style={styles.welcomeTitle}>Welcome back! 👋</Text>
// //         <Text style={styles.welcomeSubtitle}>Here's what's happening today</Text>
// //       </View>

// //       {/* Trending Posts Section */}
// //       {posts.length > 0 && (
// //         <View style={styles.section}>
// //           <View style={styles.sectionHeader}>
// //             <Text style={styles.sectionTitle}>Trending Posts</Text>
// //             <TouchableOpacity onPress={() => router.push('/(app)/posts')}>
// //               <Text style={styles.seeAllText}>See All</Text>
// //             </TouchableOpacity>
// //           </View>
// //           <ScrollView 
// //             horizontal 
// //             showsHorizontalScrollIndicator={false}
// //             contentContainerStyle={styles.postsScroll}
// //           >
// //             {posts.map((post) => (
// //               <PostCard 
// //                 key={post.id}
// //                 post={post}
// //                 onPress={() => handlePostPress(post.id)}
// //               />
// //             ))}
// //           </ScrollView>
// //         </View>
// //       )}

// //       {/* Business Leads Section */}
// //       {leads.length > 0 && (
// //         <View style={styles.section}>
// //           <View style={styles.sectionHeader}>
// //             <View style={styles.sectionTitleContainer}>
// //               <Ionicons name="flash" size={sizeScale(24)} color="#8b5cf6" />
// //               <Text style={styles.sectionTitle}>Hot Leads</Text>
// //             </View>
// //             <TouchableOpacity onPress={() => router.push('/(app)/lead')}>
// //               <Text style={styles.seeAllText}>See All</Text>
// //             </TouchableOpacity>
// //           </View>
// //           <ScrollView 
// //             horizontal 
// //             showsHorizontalScrollIndicator={false}
// //             contentContainerStyle={styles.leadsScroll}
// //           >
// //             {leads.map((lead) => (
// //               <LeadCardCompact 
// //                 key={lead.id}
// //                 lead={lead}
// //                 onPress={() => handleLeadPress(lead.id)}
// //               />
// //             ))}
// //           </ScrollView>
// //         </View>
// //       )}

// //       {/* Recent Chats Section */}
// //       {conversations.length > 0 && (
// //         <View style={styles.section}>
// //           <View style={styles.sectionHeader}>
// //             <Text style={styles.sectionTitle}>Recent Chats</Text>
// //             <TouchableOpacity onPress={() => router.push('/(app)/chat')}>
// //               <Text style={styles.seeAllText}>See All</Text>
// //             </TouchableOpacity>
// //           </View>
// //           <View style={styles.chatsContainer}>
// //             {conversations.map((conversation) => (
// //               <ChatCard 
// //                 key={conversation.partnerId}
// //                 conversation={conversation}
// //                 onPress={() => handleChatPress(conversation.partnerId)}
// //               />
// //             ))}
// //           </View>
// //         </View>
// //       )}

// //       {/* Empty State */}
// //       {leads.length === 0 && conversations.length === 0 && posts.length === 0 && (
// //         <View style={styles.emptyState}>
// //           <Ionicons name="rocket-outline" size={64} color="#555" />
// //           <Text style={styles.emptyTitle}>Start Your Journey</Text>
// //           <Text style={styles.emptySubtitle}>
// //             Connect with businesses, create posts, and generate leads
// //           </Text>
// //           <TouchableOpacity 
// //             style={styles.emptyButton}
// //             onPress={() => router.push('/(app)/posts')}
// //           >
// //             <Text style={styles.emptyButtonText}>Explore Now</Text>
// //           </TouchableOpacity>
// //         </View>
// //       )}
// //     </ScrollView>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#000000',
// //   },
// //   contentContainer: {
// //     paddingTop: sizeScale(110),
// //     paddingBottom: sizeScale(120),
// //   },
// //   loadingContainer: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     backgroundColor: '#000000',
// //   },
// //   loadingText: {
// //     marginTop: 16,
// //     fontSize: 16,
// //     color: '#888',
// //   },
// //   welcomeSection: {
// //     paddingHorizontal: sizeScale(16),
// //     marginBottom: sizeScale(24),
// //   },
// //   welcomeTitle: {
// //     fontSize: sizeScale(28),
// //     fontWeight: '700',
// //     color: '#FFFFFF',
// //     marginBottom: sizeScale(4),
// //   },
// //   welcomeSubtitle: {
// //     fontSize: sizeScale(15),
// //     color: '#888888',
// //   },
// //   section: {
// //     marginBottom: sizeScale(32),
// //   },
// //   sectionHeader: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     paddingHorizontal: sizeScale(16),
// //     marginBottom: sizeScale(16),
// //   },
// //   sectionTitleContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: sizeScale(8),
// //   },
// //   sectionTitle: {
// //     fontSize: sizeScale(22),
// //     fontWeight: '700',
// //     color: '#FFFFFF',
// //   },
// //   seeAllText: {
// //     fontSize: sizeScale(14),
// //     color: '#8b5cf6',
// //     fontWeight: '600',
// //   },

// //   // Posts Scroll
// //   postsScroll: {
// //     paddingHorizontal: sizeScale(16),
// //     gap: sizeScale(12),
// //   },
// //   postCard: {
// //     width: sizeScale(240),
// //     backgroundColor: '#1A1A1A',
// //     borderRadius: sizeScale(12),
// //     overflow: 'hidden',
// //     borderWidth: 1,
// //     borderColor: '#2A2A2A',
// //   },
// //   postHeader: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     padding: sizeScale(10),
// //   },
// //   postAvatar: {
// //     width: sizeScale(24),
// //     height: sizeScale(24),
// //     borderRadius: sizeScale(12),
// //     backgroundColor: '#10B981',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     marginRight: sizeScale(8),
// //     overflow: 'hidden',
// //   },
// //   postAvatarImage: {
// //     width: '100%',
// //     height: '100%',
// //   },
// //   postAvatarText: {
// //     fontSize: sizeScale(11),
// //     fontWeight: '700',
// //     color: '#FFFFFF',
// //   },
// //   postCompany: {
// //     fontSize: sizeScale(12),
// //     fontWeight: '600',
// //     color: '#FFFFFF',
// //     flex: 1,
// //   },
// //   postMediaContainer: {
// //     width: '100%',
// //     height: sizeScale(150),
// //     backgroundColor: '#0D0D0D',
// //     position: 'relative',
// //   },
// //   postMedia: {
// //     width: '100%',
// //     height: '100%',
// //   },
// //   videoIndicator: {
// //     position: 'absolute',
// //     top: '50%',
// //     left: '50%',
// //     transform: [{ translateX: -20 }, { translateY: -20 }],
// //   },
// //   postContent: {
// //     padding: sizeScale(10),
// //   },
// //   postText: {
// //     fontSize: sizeScale(12),
// //     color: '#CCCCCC',
// //     lineHeight: sizeScale(16),
// //   },
// //   postFooter: {
// //     flexDirection: 'row',
// //     gap: sizeScale(16),
// //     paddingHorizontal: sizeScale(10),
// //     paddingBottom: sizeScale(10),
// //   },
// //   postStat: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: sizeScale(4),
// //   },
// //   postStatText: {
// //     fontSize: sizeScale(11),
// //     color: '#888888',
// //   },

// //   // Leads Section
// //   leadsScroll: {
// //     paddingHorizontal: sizeScale(16),
// //     gap: sizeScale(12),
// //   },
// //   leadCard: {
// //     width: sizeScale(280),
// //     backgroundColor: '#1A1A1A',
// //     borderRadius: sizeScale(12),
// //     overflow: 'hidden',
// //     borderWidth: 1,
// //     borderColor: '#2A2A2A',
// //   },
// //   leadImageContainer: {
// //     width: '100%',
// //     height: sizeScale(140),
// //     backgroundColor: '#0D0D0D',
// //     position: 'relative',
// //   },
// //   leadImage: {
// //     width: '100%',
// //     height: '100%',
// //   },
// //   budgetBadge: {
// //     position: 'absolute',
// //     bottom: sizeScale(8),
// //     right: sizeScale(8),
// //     backgroundColor: 'rgba(139, 92, 246, 0.9)',
// //     paddingHorizontal: sizeScale(10),
// //     paddingVertical: sizeScale(4),
// //     borderRadius: sizeScale(12),
// //   },
// //   budgetText: {
// //     fontSize: sizeScale(11),
// //     fontWeight: '700',
// //     color: '#FFFFFF',
// //   },
// //   leadContent: {
// //     padding: sizeScale(12),
// //   },
// //   leadTitle: {
// //     fontSize: sizeScale(15),
// //     fontWeight: '700',
// //     color: '#FFFFFF',
// //     marginBottom: sizeScale(4),
// //     lineHeight: sizeScale(20),
// //   },
// //   leadDescription: {
// //     fontSize: sizeScale(12),
// //     color: '#CCCCCC',
// //     marginBottom: sizeScale(10),
// //     lineHeight: sizeScale(16),
// //   },
// //   leadMeta: {
// //     flexDirection: 'row',
// //     gap: sizeScale(12),
// //     marginBottom: sizeScale(10),
// //   },
// //   leadMetaItem: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: sizeScale(4),
// //     flex: 1,
// //   },
// //   leadMetaText: {
// //     fontSize: sizeScale(11),
// //     color: '#888888',
// //     flex: 1,
// //   },
// //   leadButton: {
// //     paddingVertical: sizeScale(8),
// //     borderRadius: sizeScale(6),
// //     alignItems: 'center',
// //   },
// //   leadButtonText: {
// //     fontSize: sizeScale(12),
// //     fontWeight: '700',
// //     color: '#FFFFFF',
// //   },

// //   // Chats Section
// //   chatsContainer: {
// //     paddingHorizontal: sizeScale(16),
// //     gap: sizeScale(10),
// //   },
// //   chatCard: {
// //     backgroundColor: '#1A1A1A',
// //     borderRadius: sizeScale(12),
// //     padding: sizeScale(12),
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     borderWidth: 1,
// //     borderColor: '#2A2A2A',
// //   },
// //   chatAvatar: {
// //     width: sizeScale(40),
// //     height: sizeScale(40),
// //     borderRadius: sizeScale(20),
// //     backgroundColor: '#00ADEF',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     marginRight: sizeScale(12),
// //     overflow: 'hidden',
// //   },
// //   chatAvatarImage: {
// //     width: '100%',
// //     height: '100%',
// //   },
// //   chatAvatarText: {
// //     fontSize: sizeScale(16),
// //     fontWeight: '700',
// //     color: '#FFFFFF',
// //   },
// //   chatInfo: {
// //     flex: 1,
// //   },
// //   chatName: {
// //     fontSize: sizeScale(15),
// //     fontWeight: '600',
// //     color: '#FFFFFF',
// //     marginBottom: sizeScale(2),
// //   },
// //   chatMessage: {
// //     fontSize: sizeScale(13),
// //     color: '#888888',
// //   },
// //   chatMeta: {
// //     alignItems: 'flex-end',
// //   },
// //   chatTime: {
// //     fontSize: sizeScale(12),
// //     color: '#666666',
// //     marginBottom: sizeScale(4),
// //   },
// //   unreadBadge: {
// //     backgroundColor: '#8b5cf6',
// //     borderRadius: sizeScale(10),
// //     minWidth: sizeScale(20),
// //     height: sizeScale(20),
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     paddingHorizontal: sizeScale(6),
// //   },
// //   unreadText: {
// //     fontSize: sizeScale(11),
// //     fontWeight: '700',
// //     color: '#FFFFFF',
// //   },

// //   // Empty State
// //   emptyState: {
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     paddingVertical: sizeScale(60),
// //     paddingHorizontal: sizeScale(16),
// //   },
// //   emptyTitle: {
// //     fontSize: sizeScale(20),
// //     fontWeight: '700',
// //     color: '#FFFFFF',
// //     marginTop: sizeScale(16),
// //     marginBottom: sizeScale(8),
// //   },
// //   emptySubtitle: {
// //     fontSize: sizeScale(14),
// //     color: '#888888',
// //     textAlign: 'center',
// //     marginBottom: sizeScale(24),
// //   },
// //   emptyButton: {
// //     backgroundColor: '#8b5cf6',
// //     paddingHorizontal: sizeScale(24),
// //     paddingVertical: sizeScale(12),
// //     borderRadius: sizeScale(20),
// //   },
// //   emptyButtonText: {
// //     fontSize: sizeScale(15),
// //     fontWeight: '600',
// //     color: '#FFFFFF',
// //   },
// // });



// // app/(app)/dashboard/index.tsx

// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   ScrollView,
//   TouchableOpacity,
//   Dimensions,
//   ActivityIndicator,
//   Image,
//   RefreshControl,
//   Alert,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { postsAPI } from '../../../services/posts';
// import { leadsAPI } from '../../../services/leads';
// import { chatAPI } from '../../../services/chat-websocket';

// const SCREEN_WIDTH = Dimensions.get('window').width;
// const STANDARD_WIDTH = 390;
// const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// interface Post {
//   id: string;
//   content: string;
//   likesCount: number;
//   commentsCount: number;
//   images?: string[];
//   video?: string;
//   company: {
//     companyName: string;
//     logo?: string;
//     userPhoto?: string;
//   };
// }

// interface Lead {
//   id: string;
//   title: string;
//   description: string;
//   companyName: string;
//   city: string;
//   state: string;
//   budget?: string;
//   quantity?: string;
//   location?: string;
//   image?: string;
//   isDeleted: boolean;
//   isActive: boolean;
//   company?: {
//     companyName: string;
//     logo?: string;
//   };
// }

// interface Conversation {
//   partnerId: string;
//   partner: {
//     id: string;
//     companyName: string;
//     phoneNumber: string;
//     logo: string | null;
//   };
//   lastMessage: string;
//   lastMessageAt: string;
//   messageCount: number;
//   unreadCount: number;
// }

// // --- Trending Post Card ---
// const PostCard = ({ post, onPress }: { post: Post; onPress?: () => void }) => {
//   const formatCount = (num: number) => {
//     if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
//     if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
//     return num.toString();
//   };

//   const hasMedia = (post.images && post.images.length > 0) || post.video;
//   const mediaUrl = post.video || (post.images && post.images[0]);

//   return (
//     <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.7}>
//       {/* Post Header */}
//       <View style={styles.postHeader}>
//         <View style={styles.postAvatar}>
//           {post.company?.logo || post.company?.userPhoto ? (
//             <Image 
//               source={{ uri: post.company.logo || post.company.userPhoto }} 
//               style={styles.postAvatarImage}
//             />
//           ) : (
//             <Text style={styles.postAvatarText}>
//               {post.company?.companyName?.charAt(0) || 'B'}
//             </Text>
//           )}
//         </View>
//         <Text style={styles.postCompany} numberOfLines={1}>
//           {post.company?.companyName || 'Company'}
//         </Text>
//       </View>

//       {/* Post Media */}
//       {hasMedia && (
//         <View style={styles.postMediaContainer}>
//           <Image
//             source={{ uri: mediaUrl }}
//             style={styles.postMedia}
//             resizeMode="cover"
//           />
//           {post.video && (
//             <View style={styles.videoIndicator}>
//               <Ionicons name="play-circle" size={sizeScale(40)} color="rgba(255,255,255,0.9)" />
//             </View>
//           )}
//         </View>
//       )}

//       {/* Post Content */}
//       <View style={styles.postContent}>
//         <Text style={styles.postText} numberOfLines={3}>
//           {post.content}
//         </Text>
//       </View>

//       {/* Post Footer */}
//       <View style={styles.postFooter}>
//         <View style={styles.postStat}>
//           <Ionicons name="heart" size={sizeScale(18)} color="#FF0050" />
//           <Text style={styles.postStatText}>{formatCount(post.likesCount)}</Text>
//         </View>
//         <View style={styles.postStat}>
//           <Ionicons name="chatbubble" size={sizeScale(16)} color="#00ADEF" />
//           <Text style={styles.postStatText}>{formatCount(post.commentsCount)}</Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// // --- Lead Card (Compact) ---
// const LeadCardCompact = ({ lead, onPress }: { lead: Lead; onPress?: () => void }) => {
//   const formatNumber = (num: string | null) => {
//     if (!num) return null;
//     const n = parseInt(num);
//     if (isNaN(n)) return num;
//     if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
//     if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
//     return num;
//   };

//   const imageUrl = lead.image?.startsWith('data:image')
//     ? lead.image
//     : lead.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400';

//   return (
//     <TouchableOpacity style={styles.leadCard} onPress={onPress} activeOpacity={0.7}>
//       {/* Lead Image */}
//       <View style={styles.leadImageContainer}>
//         <Image
//           source={{ uri: imageUrl }}
//           style={styles.leadImage}
//           resizeMode="cover"
//         />
//         {lead.budget && (
//           <View style={styles.budgetBadge}>
//             <Text style={styles.budgetText}>{lead.budget}</Text>
//           </View>
//         )}
//       </View>

//       {/* Lead Content */}
//       <View style={styles.leadContent}>
//         <Text style={styles.leadTitle} numberOfLines={2}>
//           {lead.title}
//         </Text>
//         <Text style={styles.leadDescription} numberOfLines={2}>
//           {lead.description}
//         </Text>

//         {/* Lead Meta */}
//         <View style={styles.leadMeta}>
//           {lead.location && (
//             <View style={styles.leadMetaItem}>
//               <Ionicons name="location" size={sizeScale(12)} color="#888" />
//               <Text style={styles.leadMetaText} numberOfLines={1}>
//                 {lead.location}
//               </Text>
//             </View>
//           )}
//           {lead.quantity && (
//             <View style={styles.leadMetaItem}>
//               <Ionicons name="cube" size={sizeScale(12)} color="#888" />
//               <Text style={styles.leadMetaText}>
//                 {formatNumber(lead.quantity)}
//               </Text>
//             </View>
//           )}
//         </View>

//         {/* CTA Button */}
//         <TouchableOpacity onPress={onPress}>
//           <LinearGradient
//             colors={['#3b82f6', '#8b5cf6']}
//             start={{ x: 0, y: 0.5 }}
//             end={{ x: 1, y: 0.5 }}
//             style={styles.leadButton}
//           >
//             <Text style={styles.leadButtonText}>View Details</Text>
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </TouchableOpacity>
//   );
// };

// // --- Chat Card ---
// const ChatCard = ({ conversation, onPress }: { conversation: Conversation; onPress?: () => void }) => {
//   const formatTime = (timestamp: string) => {
//     if (!timestamp) return '';
//     const date = new Date(timestamp);
//     const now = new Date();
//     const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
//     if (diffInMinutes < 1) return 'now';
//     if (diffInMinutes < 60) return `${diffInMinutes}m`;
//     if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
//     return `${Math.floor(diffInMinutes / 1440)}d`;
//   };

//   return (
//     <TouchableOpacity style={styles.chatCard} onPress={onPress} activeOpacity={0.7}>
//       <View style={styles.chatAvatar}>
//         {conversation.partner?.logo ? (
//           <Image 
//             source={{ uri: conversation.partner.logo }} 
//             style={styles.chatAvatarImage}
//           />
//         ) : (
//           <Text style={styles.chatAvatarText}>
//             {conversation.partner?.companyName?.charAt(0) || 'C'}
//           </Text>
//         )}
//       </View>
//       <View style={styles.chatInfo}>
//         <Text style={styles.chatName}>
//           {conversation.partner?.companyName || 'Unknown'}
//         </Text>
//         <Text style={styles.chatMessage} numberOfLines={1}>
//           {conversation.lastMessage || 'No messages yet'}
//         </Text>
//       </View>
//       <View style={styles.chatMeta}>
//         <Text style={styles.chatTime}>
//           {formatTime(conversation.lastMessageAt)}
//         </Text>
//         {conversation.unreadCount > 0 && (
//           <View style={styles.unreadBadge}>
//             <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
//           </View>
//         )}
//       </View>
//     </TouchableOpacity>
//   );
// };

// // --- Main Dashboard Component ---
// export default function DashboardScreen() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [posts, setPosts] = useState<Post[]>([]);
//   const [leads, setLeads] = useState<Lead[]>([]);
//   const [conversations, setConversations] = useState<Conversation[]>([]);

//   useEffect(() => {
//     fetchAllData();
//   }, []);

//   const fetchAllData = async () => {
//     try {
//       setLoading(true);
      
//       const results = await Promise.allSettled([
//         postsAPI.getAllPosts(1, 10),
//         leadsAPI.getAllLeads(),
//         chatAPI.getConversations(),
//       ]);

//       const postsResult = results[0];
//       const leadsResult = results[1];
//       const chatsResult = results[2];

//       if (postsResult.status === 'fulfilled' && postsResult.value?.data) {
//         const sortedPosts = postsResult.value.data
//           .sort((a: Post, b: Post) => b.likesCount - a.likesCount)
//           .slice(0, 6);
//         setPosts(sortedPosts);
//       }

//       if (leadsResult.status === 'fulfilled' && leadsResult.value?.data) {
//         const activeLeads = leadsResult.value.data
//           .filter((lead: Lead) => 
//             !lead.isDeleted && 
//             lead.isActive && 
//             lead.title && 
//             lead.title.trim() !== ''
//           )
//           .slice(0, 4);
//         setLeads(activeLeads);
//       }

//       if (chatsResult.status === 'fulfilled' && chatsResult.value?.data) {
//         const recentChats = chatsResult.value.data
//           .sort((a: Conversation, b: Conversation) => 
//             new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
//           )
//           .slice(0, 5);
//         setConversations(recentChats);
//       }

//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//       Alert.alert('Error', 'Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchAllData();
//   };

//   // Navigation handlers for specific items
//   const handlePostPress = (postId: string) => {
//     // Navigate to posts screen and scroll to specific post
//     router.push({
//       pathname: '/(app)/posts',
//       params: { scrollToPostId: postId }
//     });
//   };

//   const handleLeadPress = (leadId: string) => {
//     // Navigate to leads screen and scroll to specific lead
//     router.push({
//       pathname: '/(app)/lead',
//       params: { scrollToLeadId: leadId }
//     });
//   };

//   // UPDATED: Navigate to chat index first, then to specific conversation
//   const handleChatPress = (partnerId: string) => {
//     // First navigate to chat index, then immediately to the specific chat
//     // This ensures back button goes to chat index, not dashboard
//     router.push('/(app)/chat');
//     setTimeout(() => {
//       router.push(`/(app)/chat/${partnerId}`);
//     }, 50);
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#4C1D95" />
//         <Text style={styles.loadingText}>Loading dashboard...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView 
//       style={styles.container}
//       contentContainerStyle={styles.contentContainer}
//       showsVerticalScrollIndicator={false}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           tintColor="#4C1D95"
//           colors={['#4C1D95']}
//         />
//       }
//     >
//       {/* Welcome Section */}
//       <View style={styles.welcomeSection}>
//         <Text style={styles.welcomeTitle}>Welcome back! 👋</Text>
//         <Text style={styles.welcomeSubtitle}>Here's what's happening today</Text>
//       </View>

//       {/* Trending Posts Section */}
//       {posts.length > 0 && (
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Trending Posts</Text>
//             <TouchableOpacity onPress={() => router.push('/(app)/posts')}>
//               <Text style={styles.seeAllText}>See All</Text>
//             </TouchableOpacity>
//           </View>
//           <ScrollView 
//             horizontal 
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.postsScroll}
//           >
//             {posts.map((post) => (
//               <PostCard 
//                 key={post.id}
//                 post={post}
//                 onPress={() => handlePostPress(post.id)}
//               />
//             ))}
//           </ScrollView>
//         </View>
//       )}

//       {/* Business Leads Section */}
//       {leads.length > 0 && (
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <View style={styles.sectionTitleContainer}>
//               <Ionicons name="flash" size={sizeScale(24)} color="#8b5cf6" />
//               <Text style={styles.sectionTitle}>Hot Leads</Text>
//             </View>
//             <TouchableOpacity onPress={() => router.push('/(app)/lead')}>
//               <Text style={styles.seeAllText}>See All</Text>
//             </TouchableOpacity>
//           </View>
//           <ScrollView 
//             horizontal 
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.leadsScroll}
//           >
//             {leads.map((lead) => (
//               <LeadCardCompact 
//                 key={lead.id}
//                 lead={lead}
//                 onPress={() => handleLeadPress(lead.id)}
//               />
//             ))}
//           </ScrollView>
//         </View>
//       )}

//       {/* Recent Chats Section */}
//       {conversations.length > 0 && (
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Recent Chats</Text>
//             <TouchableOpacity onPress={() => router.push('/(app)/chat')}>
//               <Text style={styles.seeAllText}>See All</Text>
//             </TouchableOpacity>
//           </View>
//           <View style={styles.chatsContainer}>
//             {conversations.map((conversation) => (
//               <ChatCard 
//                 key={conversation.partnerId}
//                 conversation={conversation}
//                 onPress={() => handleChatPress(conversation.partnerId)}
//               />
//             ))}
//           </View>
//         </View>
//       )}

//       {/* Empty State */}
//       {leads.length === 0 && conversations.length === 0 && posts.length === 0 && (
//         <View style={styles.emptyState}>
//           <Ionicons name="rocket-outline" size={64} color="#555" />
//           <Text style={styles.emptyTitle}>Start Your Journey</Text>
//           <Text style={styles.emptySubtitle}>
//             Connect with businesses, create posts, and generate leads
//           </Text>
//           <TouchableOpacity 
//             style={styles.emptyButton}
//             onPress={() => router.push('/(app)/posts')}
//           >
//             <Text style={styles.emptyButtonText}>Explore Now</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000000',
//   },
//   contentContainer: {
//     paddingTop: sizeScale(110),
//     paddingBottom: sizeScale(120),
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000000',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#888',
//   },
//   welcomeSection: {
//     paddingHorizontal: sizeScale(16),
//     marginBottom: sizeScale(24),
//   },
//   welcomeTitle: {
//     fontSize: sizeScale(28),
//     fontWeight: '700',
//     color: '#FFFFFF',
//     marginBottom: sizeScale(4),
//   },
//   welcomeSubtitle: {
//     fontSize: sizeScale(15),
//     color: '#888888',
//   },
//   section: {
//     marginBottom: sizeScale(32),
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: sizeScale(16),
//     marginBottom: sizeScale(16),
//   },
//   sectionTitleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: sizeScale(8),
//   },
//   sectionTitle: {
//     fontSize: sizeScale(22),
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   seeAllText: {
//     fontSize: sizeScale(14),
//     color: '#8b5cf6',
//     fontWeight: '600',
//   },

//   // Posts Scroll
//   postsScroll: {
//     paddingHorizontal: sizeScale(16),
//     gap: sizeScale(12),
//   },
//   postCard: {
//     width: sizeScale(240),
//     backgroundColor: '#1A1A1A',
//     borderRadius: sizeScale(12),
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#2A2A2A',
//   },
//   postHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: sizeScale(10),
//   },
//   postAvatar: {
//     width: sizeScale(24),
//     height: sizeScale(24),
//     borderRadius: sizeScale(12),
//     backgroundColor: '#10B981',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: sizeScale(8),
//     overflow: 'hidden',
//   },
//   postAvatarImage: {
//     width: '100%',
//     height: '100%',
//   },
//   postAvatarText: {
//     fontSize: sizeScale(11),
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   postCompany: {
//     fontSize: sizeScale(12),
//     fontWeight: '600',
//     color: '#FFFFFF',
//     flex: 1,
//   },
//   postMediaContainer: {
//     width: '100%',
//     height: sizeScale(150),
//     backgroundColor: '#0D0D0D',
//     position: 'relative',
//   },
//   postMedia: {
//     width: '100%',
//     height: '100%',
//   },
//   videoIndicator: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: [{ translateX: -20 }, { translateY: -20 }],
//   },
//   postContent: {
//     padding: sizeScale(10),
//   },
//   postText: {
//     fontSize: sizeScale(12),
//     color: '#CCCCCC',
//     lineHeight: sizeScale(16),
//   },
//   postFooter: {
//     flexDirection: 'row',
//     gap: sizeScale(16),
//     paddingHorizontal: sizeScale(10),
//     paddingBottom: sizeScale(10),
//   },
//   postStat: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: sizeScale(4),
//   },
//   postStatText: {
//     fontSize: sizeScale(11),
//     color: '#888888',
//   },

//   // Leads Section
//   leadsScroll: {
//     paddingHorizontal: sizeScale(16),
//     gap: sizeScale(12),
//   },
//   leadCard: {
//     width: sizeScale(280),
//     backgroundColor: '#1A1A1A',
//     borderRadius: sizeScale(12),
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#2A2A2A',
//   },
//   leadImageContainer: {
//     width: '100%',
//     height: sizeScale(140),
//     backgroundColor: '#0D0D0D',
//     position: 'relative',
//   },
//   leadImage: {
//     width: '100%',
//     height: '100%',
//   },
//   budgetBadge: {
//     position: 'absolute',
//     bottom: sizeScale(8),
//     right: sizeScale(8),
//     backgroundColor: 'rgba(139, 92, 246, 0.9)',
//     paddingHorizontal: sizeScale(10),
//     paddingVertical: sizeScale(4),
//     borderRadius: sizeScale(12),
//   },
//   budgetText: {
//     fontSize: sizeScale(11),
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   leadContent: {
//     padding: sizeScale(12),
//   },
//   leadTitle: {
//     fontSize: sizeScale(15),
//     fontWeight: '700',
//     color: '#FFFFFF',
//     marginBottom: sizeScale(4),
//     lineHeight: sizeScale(20),
//   },
//   leadDescription: {
//     fontSize: sizeScale(12),
//     color: '#CCCCCC',
//     marginBottom: sizeScale(10),
//     lineHeight: sizeScale(16),
//   },
//   leadMeta: {
//     flexDirection: 'row',
//     gap: sizeScale(12),
//     marginBottom: sizeScale(10),
//   },
//   leadMetaItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: sizeScale(4),
//     flex: 1,
//   },
//   leadMetaText: {
//     fontSize: sizeScale(11),
//     color: '#888888',
//     flex: 1,
//   },
//   leadButton: {
//     paddingVertical: sizeScale(8),
//     borderRadius: sizeScale(6),
//     alignItems: 'center',
//   },
//   leadButtonText: {
//     fontSize: sizeScale(12),
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },

//   // Chats Section
//   chatsContainer: {
//     paddingHorizontal: sizeScale(16),
//     gap: sizeScale(10),
//   },
//   chatCard: {
//     backgroundColor: '#1A1A1A',
//     borderRadius: sizeScale(12),
//     padding: sizeScale(12),
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#2A2A2A',
//   },
//   chatAvatar: {
//     width: sizeScale(40),
//     height: sizeScale(40),
//     borderRadius: sizeScale(20),
//     backgroundColor: '#00ADEF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: sizeScale(12),
//     overflow: 'hidden',
//   },
//   chatAvatarImage: {
//     width: '100%',
//     height: '100%',
//   },
//   chatAvatarText: {
//     fontSize: sizeScale(16),
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   chatInfo: {
//     flex: 1,
//   },
//   chatName: {
//     fontSize: sizeScale(15),
//     fontWeight: '600',
//     color: '#FFFFFF',
//     marginBottom: sizeScale(2),
//   },
//   chatMessage: {
//     fontSize: sizeScale(13),
//     color: '#888888',
//   },
//   chatMeta: {
//     alignItems: 'flex-end',
//   },
//   chatTime: {
//     fontSize: sizeScale(12),
//     color: '#666666',
//     marginBottom: sizeScale(4),
//   },
//   unreadBadge: {
//     backgroundColor: '#8b5cf6',
//     borderRadius: sizeScale(10),
//     minWidth: sizeScale(20),
//     height: sizeScale(20),
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: sizeScale(6),
//   },
//   unreadText: {
//     fontSize: sizeScale(11),
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },

//   // Empty State
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: sizeScale(60),
//     paddingHorizontal: sizeScale(16),
//   },
//   emptyTitle: {
//     fontSize: sizeScale(20),
//     fontWeight: '700',
//     color: '#FFFFFF',
//     marginTop: sizeScale(16),
//     marginBottom: sizeScale(8),
//   },
//   emptySubtitle: {
//     fontSize: sizeScale(14),
//     color: '#888888',
//     textAlign: 'center',
//     marginBottom: sizeScale(24),
//   },
//   emptyButton: {
//     backgroundColor: '#8b5cf6',
//     paddingHorizontal: sizeScale(24),
//     paddingVertical: sizeScale(12),
//     borderRadius: sizeScale(20),
//   },
//   emptyButtonText: {
//     fontSize: sizeScale(15),
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
// });



// app/(app)/dashboard/index.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard'; // Necessary for the copy button
import { postsAPI } from '../../../services/posts';
import { leadsAPI } from '../../../services/leads';
import { chatAPI } from '../../../services/chat-websocket';
import { companyAPI, CompanyProfile } from '../../../services/user';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

interface Post {
  id: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  images?: string[];
  video?: string;
  company: {
    companyName: string;
    logo?: string;
    userPhoto?: string;
  };
}

interface Lead {
  id: string;
  title: string;
  description: string;
  companyName: string;
  city: string;
  state: string;
  budget?: string;
  quantity?: string;
  location?: string;
  image?: string;
  isDeleted: boolean;
  isActive: boolean;
  company?: {
    companyName: string;
    logo?: string;
  };
}

interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    companyName: string;
    phoneNumber: string;
    logo: string | null;
  };
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
}

// --- Referral Banner Component (Updated) ---
const ReferralBanner = ({ referralCode }: { referralCode: string | undefined }) => {
  if (!referralCode) return null;

  const handleCopy = async () => {
    // This requires 'expo-clipboard' to be installed (npx expo install expo-clipboard)
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('Copied!', `Referral Code ${referralCode} copied to clipboard.`);
  };

  return (
    <View style={styles.referralBanner}>
      <View style={styles.referralHeader}>
        {/* Simplified Title with Heart Emoji */}
        <Text style={styles.referralTitleSimple}>
          You <Text style={styles.heartText}>❤️</Text> Bizzap
        </Text>
        
        {/* Simple Subtitle combining the reward info */}
        <Text style={styles.referralSubtitleSimple}>
          Your friends are going to love us too! Refer & Win up to **5 Leads**.
        </Text>
      </View>
      
      <View style={styles.referralCodeBlock}>
        <View>
          <Text style={styles.referralCodeLabel}>Your Referral Code</Text>
          {/* Referral Code Value (no stars for highlight, but color highlighted) */}
          <Text style={styles.referralCodeValue} selectable={true}>
            {referralCode}
          </Text>
        </View>

        {/* Copy Button */}
        <TouchableOpacity 
          style={styles.copyButton}
          onPress={handleCopy}
          activeOpacity={0.8}
        >
          <Ionicons name="copy-outline" size={sizeScale(16)} color="#FFFFFF" />
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


// --- Trending Post Card (Remains the same) ---
const PostCard = ({ post, onPress }: { post: Post; onPress?: () => void }) => {
  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
  };

  const hasMedia = (post.images && post.images.length > 0) || post.video;
  const mediaUrl = post.video || (post.images && post.images[0]);

  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.7}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          {post.company?.logo || post.company?.userPhoto ? (
            <Image 
              source={{ uri: post.company.logo || post.company.userPhoto }} 
              style={styles.postAvatarImage}
            />
          ) : (
            <Text style={styles.postAvatarText}>
              {post.company?.companyName?.charAt(0) || 'B'}
            </Text>
          )}
        </View>
        <Text style={styles.postCompany} numberOfLines={1}>
          {post.company?.companyName || 'Company'}
        </Text>
      </View>

      {/* Post Media */}
      {hasMedia && (
        <View style={styles.postMediaContainer}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.postMedia}
            resizeMode="cover"
          />
          {post.video && (
            <View style={styles.videoIndicator}>
              <Ionicons name="play-circle" size={sizeScale(40)} color="rgba(255,255,255,0.9)" />
            </View>
          )}
        </View>
      )}

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={styles.postText} numberOfLines={3}>
          {post.content}
        </Text>
      </View>

      {/* Post Footer */}
      <View style={styles.postFooter}>
        <View style={styles.postStat}>
          <Ionicons name="heart" size={sizeScale(18)} color="#FF0050" />
          <Text style={styles.postStatText}>{formatCount(post.likesCount)}</Text>
        </View>
        <View style={styles.postStat}>
          <Ionicons name="chatbubble" size={sizeScale(16)} color="#00ADEF" />
          <Text style={styles.postStatText}>{formatCount(post.commentsCount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- Lead Card (Compact) (Remains the same) ---
const LeadCardCompact = ({ lead, onPress }: { lead: Lead; onPress?: () => void }) => {
  const formatNumber = (num: string | null) => {
    if (!num) return null;
    const n = parseInt(num);
    if (isNaN(n)) return num;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return num;
  };

  const imageUrl = lead.image?.startsWith('data:image')
    ? lead.image
    : lead.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400';

  return (
    <TouchableOpacity style={styles.leadCard} onPress={onPress} activeOpacity={0.7}>
      {/* Lead Image */}
      <View style={styles.leadImageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.leadImage}
          resizeMode="cover"
        />
        {lead.budget && (
          <View style={styles.budgetBadge}>
            <Text style={styles.budgetText}>{lead.budget}</Text>
          </View>
        )}
      </View>

      {/* Lead Content */}
      <View style={styles.leadContent}>
        <Text style={styles.leadTitle} numberOfLines={2}>
          {lead.title}
        </Text>
        <Text style={styles.leadDescription} numberOfLines={2}>
          {lead.description}
        </Text>

        {/* Lead Meta */}
        <View style={styles.leadMeta}>
          {lead.location && (
            <View style={styles.leadMetaItem}>
              <Ionicons name="location" size={sizeScale(12)} color="#888" />
              <Text style={styles.leadMetaText} numberOfLines={1}>
                {lead.location}
              </Text>
            </View>
          )}
          {lead.quantity && (
            <View style={styles.leadMetaItem}>
              <Ionicons name="cube" size={sizeScale(12)} color="#888" />
              <Text style={styles.leadMetaText}>
                {formatNumber(lead.quantity)}
              </Text>
            </View>
          )}
        </View>

        {/* CTA Button */}
        <TouchableOpacity onPress={onPress}>
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.leadButton}
          >
            <Text style={styles.leadButtonText}>View Details</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// --- Chat Card (Remains the same) ---
const ChatCard = ({ conversation, onPress }: { conversation: Conversation; onPress?: () => void }) => {
  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <TouchableOpacity style={styles.chatCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.chatAvatar}>
        {conversation.partner?.logo ? (
          <Image 
            source={{ uri: conversation.partner.logo }} 
            style={styles.chatAvatarImage}
          />
        ) : (
          <Text style={styles.chatAvatarText}>
            {conversation.partner?.companyName?.charAt(0) || 'C'}
          </Text>
        )}
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>
          {conversation.partner?.companyName || 'Unknown'}
        </Text>
        <Text style={styles.chatMessage} numberOfLines={1}>
          {conversation.lastMessage || 'No messages yet'}
        </Text>
      </View>
      <View style={styles.chatMeta}>
        <Text style={styles.chatTime}>
          {formatTime(conversation.lastMessageAt)}
        </Text>
        {conversation.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// --- Empty Chat State Component (Updated for search navigation) ---
const EmptyChatState = ({ onSearchPress }: { onSearchPress: () => void }) => (
  <View style={styles.emptyStateChat}>
    <Ionicons name="chatbubbles-outline" size={sizeScale(48)} color="#8b5cf6" />
    <Text style={styles.emptyTitleChat}>Start Connecting!</Text>
    <Text style={styles.emptySubtitleChat}>
      Follow companies and start a chat to collaborate on leads.
    </Text>
    <TouchableOpacity 
      style={styles.emptyButtonChat}
      onPress={onSearchPress}
    >
      <Text style={styles.emptyButtonText}>Find Businesses</Text>
    </TouchableOpacity>
  </View>
);


// --- Main Dashboard Component ---
export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profile, setProfile] = useState<Partial<CompanyProfile>>({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const results = await Promise.allSettled([
        postsAPI.getAllPosts(1, 10),
        leadsAPI.getAllLeads(),
        chatAPI.getConversations(),
        companyAPI.getProfile(), // Fetch user profile for referralCode
      ]);

      const postsResult = results[0];
      const leadsResult = results[1];
      const chatsResult = results[2];
      const profileResult = results[3];

      if (postsResult.status === 'fulfilled' && postsResult.value?.data) {
        const sortedPosts = postsResult.value.data
          .sort((a: Post, b: Post) => b.likesCount - a.likesCount)
          .slice(0, 6);
        setPosts(sortedPosts);
      }

      if (leadsResult.status === 'fulfilled' && leadsResult.value?.data) {
        const activeLeads = leadsResult.value.data
          .filter((lead: Lead) => 
            !lead.isDeleted && 
            lead.isActive && 
            lead.title && 
            lead.title.trim() !== ''
          )
          .slice(0, 4);
        setLeads(activeLeads);
      }

      if (chatsResult.status === 'fulfilled' && chatsResult.value?.data) {
        const recentChats = chatsResult.value.data
          .sort((a: Conversation, b: Conversation) => 
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          )
          .slice(0, 5);
        setConversations(recentChats);
      }
      
      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Navigation handlers
  const handlePostPress = (postId: string) => {
    router.push({
      pathname: '/(app)/posts',
      params: { scrollToPostId: postId }
    });
  };

  const handleLeadPress = (leadId: string) => {
    router.push({
      pathname: '/(app)/lead',
      params: { scrollToLeadId: leadId }
    });
  };

  const handleChatPress = (partnerId: string) => {
    router.push('/(app)/chat');
    setTimeout(() => {
      router.push(`/(app)/chat/${partnerId}`);
    }, 50);
  };
  
  // Navigation handler for empty chat state button
  const handleSearchPress = () => {
    router.push('/(app)/search');
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C1D95" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const isInitialUser = profile.followersCount === 0 && profile.following?.length === 0;


  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#4C1D95"
          colors={['#4C1D95']}
        />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome back! 👋</Text>
        <Text style={styles.welcomeSubtitle}>Here's what's happening today</Text>
      </View>
      
      {/* Referral Banner */}
      <View style={{ paddingHorizontal: sizeScale(16), marginBottom: sizeScale(24) }}>
        <ReferralBanner referralCode={profile.referralCode} />
      </View>


      {/* Trending Posts Section */}
      {posts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Posts</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/posts')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.postsScroll}
          >
            {posts.map((post) => (
              <PostCard 
                key={post.id}
                post={post}
                onPress={() => handlePostPress(post.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Business Leads Section */}
      {leads.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flash" size={sizeScale(24)} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Hot Leads</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/lead')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.leadsScroll}
          >
            {leads.map((lead) => (
              <LeadCardCompact 
                key={lead.id}
                lead={lead}
                onPress={() => handleLeadPress(lead.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Chats Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Chats</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/chat')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chatsContainer}>
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <ChatCard 
                key={conversation.partnerId}
                conversation={conversation}
                onPress={() => handleChatPress(conversation.partnerId)}
              />
            ))
          ) : (
            <EmptyChatState onSearchPress={handleSearchPress} />
          )}
        </View>
      </View>

      {/* General Empty State (Only if ALL sections are empty AND we are not showing the EmptyChatState) */}
      {posts.length === 0 && leads.length === 0 && conversations.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="rocket-outline" size={64} color="#555" />
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptySubtitle}>
            Connect with businesses, create posts, and generate leads
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/(app)/posts')}
          >
            <Text style={styles.emptyButtonText}>Explore Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    paddingTop: sizeScale(110),
    paddingBottom: sizeScale(120),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  welcomeSection: {
    paddingHorizontal: sizeScale(16),
    marginBottom: sizeScale(24),
  },
  welcomeTitle: {
    fontSize: sizeScale(28),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: sizeScale(4),
  },
  welcomeSubtitle: {
    fontSize: sizeScale(15),
    color: '#888888',
  },
  
  // --- UPDATED Referral Banner Styles ---
  referralBanner: {
    backgroundColor: '#1A1A1A',
    borderRadius: sizeScale(12),
    padding: sizeScale(16),
    borderWidth: 1,
    borderColor: '#8b5cf6', // Highlight border with primary color
  },
  referralHeader: {
    marginBottom: sizeScale(12),
  },
  // New simple title style
  referralTitleSimple: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: sizeScale(4),
  },
  // New heart style to make it prominent
  heartText: {
    color: '#FF0050', // Red color for the heart
    fontSize: sizeScale(24),
  },
  // New simple subtitle style
  referralSubtitleSimple: {
    fontSize: sizeScale(14),
    color: '#CCCCCC',
  },
  referralCodeBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A', // Darker background for the code block
    borderRadius: sizeScale(8),
    padding: sizeScale(12),
    borderWidth: 1,
    borderColor: '#444444',
  },
  referralCodeLabel: {
    fontSize: sizeScale(11),
    color: '#888888',
    marginBottom: sizeScale(2),
  },
  referralCodeValue: {
    fontSize: sizeScale(16),
    fontWeight: '700',
    color: '#00ADEF', // Highlight code with a secondary color
    letterSpacing: sizeScale(1),
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(4),
    backgroundColor: '#8b5cf6',
    paddingHorizontal: sizeScale(12),
    paddingVertical: sizeScale(6),
    borderRadius: sizeScale(6),
  },
  copyButtonText: {
    fontSize: sizeScale(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // ------------------------------------
  
  section: {
    marginBottom: sizeScale(32),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    marginBottom: sizeScale(16),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(8),
  },
  sectionTitle: {
    fontSize: sizeScale(22),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: sizeScale(14),
    color: '#8b5cf6',
    fontWeight: '600',
  },

  // Posts Scroll
  postsScroll: {
    paddingHorizontal: sizeScale(16),
    gap: sizeScale(12),
  },
  postCard: {
    width: sizeScale(240),
    backgroundColor: '#1A1A1A',
    borderRadius: sizeScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sizeScale(10),
  },
  postAvatar: {
    width: sizeScale(24),
    height: sizeScale(24),
    borderRadius: sizeScale(12),
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sizeScale(8),
    overflow: 'hidden',
  },
  postAvatarImage: {
    width: '100%',
    height: '100%',
  },
  postAvatarText: {
    fontSize: sizeScale(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postCompany: {
    fontSize: sizeScale(12),
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  postMediaContainer: {
    width: '100%',
    height: sizeScale(150),
    backgroundColor: '#0D0D0D',
    position: 'relative',
  },
  postMedia: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  postContent: {
    padding: sizeScale(10),
  },
  postText: {
    fontSize: sizeScale(12),
    color: '#CCCCCC',
    lineHeight: sizeScale(16),
  },
  postFooter: {
    flexDirection: 'row',
    gap: sizeScale(16),
    paddingHorizontal: sizeScale(10),
    paddingBottom: sizeScale(10),
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(4),
  },
  postStatText: {
    fontSize: sizeScale(11),
    color: '#888888',
  },

  // Leads Section
  leadsScroll: {
    paddingHorizontal: sizeScale(16),
    gap: sizeScale(12),
  },
  leadCard: {
    width: sizeScale(280),
    backgroundColor: '#1A1A1A',
    borderRadius: sizeScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  leadImageContainer: {
    width: '100%',
    height: sizeScale(140),
    backgroundColor: '#0D0D0D',
    position: 'relative',
  },
  leadImage: {
    width: '100%',
    height: '100%',
  },
  budgetBadge: {
    position: 'absolute',
    bottom: sizeScale(8),
    right: sizeScale(8),
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: sizeScale(10),
    paddingVertical: sizeScale(4),
    borderRadius: sizeScale(12),
  },
  budgetText: {
    fontSize: sizeScale(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leadContent: {
    padding: sizeScale(12),
  },
  leadTitle: {
    fontSize: sizeScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: sizeScale(4),
    lineHeight: sizeScale(20),
  },
  leadDescription: {
    fontSize: sizeScale(12),
    color: '#CCCCCC',
    marginBottom: sizeScale(10),
    lineHeight: sizeScale(16),
  },
  leadMeta: {
    flexDirection: 'row',
    gap: sizeScale(12),
    marginBottom: sizeScale(10),
  },
  leadMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(4),
    flex: 1,
  },
  leadMetaText: {
    fontSize: sizeScale(11),
    color: '#888888',
    flex: 1,
  },
  leadButton: {
    paddingVertical: sizeScale(8),
    borderRadius: sizeScale(6),
    alignItems: 'center',
  },
  leadButtonText: {
    fontSize: sizeScale(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Chats Section
  chatsContainer: {
    paddingHorizontal: sizeScale(16),
    gap: sizeScale(10),
  },
  chatCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: sizeScale(12),
    padding: sizeScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chatAvatar: {
    width: sizeScale(40),
    height: sizeScale(40),
    borderRadius: sizeScale(20),
    backgroundColor: '#00ADEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sizeScale(12),
    overflow: 'hidden',
  },
  chatAvatarImage: {
    width: '100%',
    height: '100%',
  },
  chatAvatarText: {
    fontSize: sizeScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: sizeScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: sizeScale(2),
  },
  chatMessage: {
    fontSize: sizeScale(13),
    color: '#888888',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  chatTime: {
    fontSize: sizeScale(12),
    color: '#666666',
    marginBottom: sizeScale(4),
  },
  unreadBadge: {
    backgroundColor: '#8b5cf6',
    borderRadius: sizeScale(10),
    minWidth: sizeScale(20),
    height: sizeScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sizeScale(6),
  },
  unreadText: {
    fontSize: sizeScale(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // --- Empty Chat State Styles (for new user experience) ---
  emptyStateChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sizeScale(30),
    backgroundColor: '#1A1A1A',
    borderRadius: sizeScale(12),
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: sizeScale(16),
  },
  emptyTitleChat: {
    fontSize: sizeScale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: sizeScale(12),
    marginBottom: sizeScale(4),
  },
  emptySubtitleChat: {
    fontSize: sizeScale(13),
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: sizeScale(16),
  },
  emptyButtonChat: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(8),
    borderRadius: sizeScale(8),
  },
  emptyButtonText: {
    fontSize: sizeScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // -----------------------------

  // Empty State (General, for entire dashboard)
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sizeScale(60),
    paddingHorizontal: sizeScale(16),
  },
  emptyTitle: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: sizeScale(16),
    marginBottom: sizeScale(8),
  },
  emptySubtitle: {
    fontSize: sizeScale(14),
    color: '#888888',
    textAlign: 'center',
    marginBottom: sizeScale(24),
  },
  emptyButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: sizeScale(24),
    paddingVertical: sizeScale(12),
    borderRadius: sizeScale(20),
  },
  emptyButtonText: {
    fontSize: sizeScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});