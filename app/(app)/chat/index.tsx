// // app/(app)/chat/index.tsx - Updated UI to match React design

// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   RefreshControl,
//   Dimensions,
//   ActivityIndicator,
//   Modal,
//   TextInput,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { Edit, X, Search } from 'lucide-react-native';
// import { chatAPI } from '../../../services/chat-websocket';
// import { followersAPI } from '../../../services/user';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// // Responsive sizing function
// const getResponsiveSize = (size: number) => {
//   const baseWidth = 390; // Design base width
//   const scale = SCREEN_WIDTH / baseWidth;
//   const newSize = size * scale;
//   return Math.round(newSize);
// };

// // Font scaling with limits
// const getFontSize = (size: number) => {
//   const scale = SCREEN_WIDTH / 390;
//   const newSize = size * scale;
//   // Limit font scaling between 0.85 and 1.15
//   if (scale < 0.85) return Math.round(size * 0.85);
//   if (scale > 1.15) return Math.round(size * 1.15);
//   return Math.round(newSize);
// };

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
//   lastMessageType?: string;
//   lastMessageFileUrl?: string | null;
//   lastMessageThumbnailUrl?: string | null;
//   messageCount: number;
//   unreadCount: number;
// }

// interface Contact {
//   id: string;
//   companyName: string;
//   logo: string | null;
//   phoneNumber: string;
//   type: 'follower' | 'following';
// }

// export default function ChatListScreen() {
//   const router = useRouter();
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [contacts, setContacts] = useState<Contact[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [showNewChatModal, setShowNewChatModal] = useState(false);
//   const [totalUnread, setTotalUnread] = useState(0);
//   const [activeTab, setActiveTab] = useState<'all' | 'followers' | 'following'>('all');
//   const [searchQuery, setSearchQuery] = useState('');

//   const fetchConversations = async () => {
//     try {
//       const response = await chatAPI.getConversations();
//       setConversations(response.data);
      
//       const unreadResponse = await chatAPI.getUnreadCount();
//       setTotalUnread(unreadResponse.data.unreadCount);
//     } catch (error: any) {
//       console.error('Failed to fetch conversations:', error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const fetchContacts = async () => {
//     try {
//       const [followersData, followingData] = await Promise.all([
//         followersAPI.getFollowers(),
//         followersAPI.getFollowing(),
//       ]);

//       const followersWithType: Contact[] = followersData.map((f) => ({
//         id: f.id,
//         companyName: f.companyName,
//         logo: f.logo,
//         phoneNumber: f.phoneNumber,
//         type: 'follower' as const,
//       }));

//       const followingWithType: Contact[] = followingData.map((f) => ({
//         id: f.id,
//         companyName: f.companyName,
//         logo: f.logo,
//         phoneNumber: f.phoneNumber,
//         type: 'following' as const,
//       }));

//       const allContacts = [...followersWithType, ...followingWithType];
//       const uniqueContacts = allContacts.reduce((acc: Contact[], current) => {
//         const existing = acc.find((item) => item.id === current.id);
//         if (!existing) {
//           acc.push(current);
//         }
//         return acc;
//       }, []);

//       setContacts(uniqueContacts);
//     } catch (error: any) {
//       console.error('Failed to fetch contacts:', error);
//     }
//   };

//   useEffect(() => {
//     fetchConversations();
//     fetchContacts();
//   }, []);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchConversations();
//     fetchContacts();
//   }, []);

//   const getFilteredContacts = () => {
//     if (activeTab === 'all') return contacts;
//     return contacts.filter((c) => c.type === activeTab.slice(0, -1) as 'follower' | 'following');
//   };

//   const filteredContacts = getFilteredContacts();

//   const formatTime = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleTimeString('en-US', { 
//       hour: 'numeric', 
//       minute: '2-digit',
//       hour12: true 
//     });
//   };

//   const getLastMessageDisplay = (item: Conversation) => {
//     if (item.lastMessageType === 'image') {
//       return '📷 Photo';
//     }
//     if (item.lastMessageType === 'file' || item.lastMessageType === 'document') {
//       return '📎 File';
//     }
//     return item.lastMessage;
//   };

//   const openChat = (companyId: string) => {
//     router.push(`/(app)/chat/${companyId}`);
//   };

//   const renderConversationItem = ({ item }: { item: Conversation }) => (
//     <TouchableOpacity
//       style={styles.conversationItem}
//       onPress={() => openChat(item.partnerId)}
//       activeOpacity={0.8}
//     >
//       <View style={styles.messageRow}>
//         <View style={styles.avatarSection}>
//           <View style={styles.avatarWrapper}>
//             <Image
//               source={{
//                 uri: item.partner.logo || 'https://via.placeholder.com/70',
//               }}
//               style={styles.avatar}
//             />
//           </View>
//         </View>

//         <View style={styles.messageContent}>
//           <View style={styles.nameRow}>
//             <Text style={styles.companyName} numberOfLines={1}>
//               {item.partner.companyName}
//             </Text>
//           </View>
          
//           <View style={styles.messagesColumn}>
//             <Text style={styles.lastMessage} numberOfLines={1}>
//               {getLastMessageDisplay(item)}
//             </Text>
//             <Text style={styles.secondaryMessage} numberOfLines={1}>
//               Hey, how's the new collection coming along?
//             </Text>
//           </View>
//         </View>

//         <View style={styles.metaSection}>
//           <View style={styles.timeWrapper}>
//             <Text style={styles.timeText}>{formatTime(item.lastMessageAt)}</Text>
//           </View>
//           {item.unreadCount > 0 && (
//             <View style={styles.unreadBadge}>
//               <View style={styles.unreadDot} />
//             </View>
//           )}
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   const renderContactItem = ({ item }: { item: Contact }) => (
//     <TouchableOpacity
//       style={styles.followerItem}
//       onPress={() => {
//         setShowNewChatModal(false);
//         openChat(item.id);
//       }}
//       activeOpacity={0.7}
//     >
//       <Image
//         source={{
//           uri: item.logo || 'https://via.placeholder.com/60',
//         }}
//         style={styles.followerAvatar}
//       />
//       <View style={styles.followerInfo}>
//         <Text style={styles.followerName} numberOfLines={1}>
//           {item.companyName}
//         </Text>
//         <Text style={styles.followerPhone} numberOfLines={1}>
//           {item.phoneNumber}
//         </Text>
//       </View>
//       <View style={styles.contactTypeBadge}>
//         <Text style={styles.contactTypeText}>
//           {item.type === 'follower' ? 'Follower' : 'Following'}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Chats</Text>
//         </View>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#3B82F6" />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <Text style={styles.headerTitle}>Chats</Text>
//         </View>
//         <View style={styles.headerRight}>
//           <TouchableOpacity
//             style={styles.profileButton}
//             onPress={() => {}}
//             activeOpacity={0.7}
//           >
//             <Image
//               source={{ uri: 'https://via.placeholder.com/32' }}
//               style={styles.profileImage}
//             />
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchIconWrapper}>
//           <Search size={getResponsiveSize(20)} color="#8FA8CC" strokeWidth={2.5} />
//         </View>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search"
//           placeholderTextColor="#99A1AE"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//       </View>

//       {/* Conversations List */}
//       <FlatList
//         data={conversations}
//         renderItem={renderConversationItem}
//         keyExtractor={(item) => item.partnerId}
//         contentContainerStyle={[
//           styles.listContent,
//           conversations.length === 0 && styles.emptyList,
//         ]}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor="#3B82F6"
//           />
//         }
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Text style={styles.emptyTitle}>No conversations yet</Text>
//             <Text style={styles.emptySubtitle}>
//               Start a new chat with your connections
//             </Text>
//             <TouchableOpacity
//               style={styles.startChatButton}
//               onPress={() => setShowNewChatModal(true)}
//             >
//               <Text style={styles.startChatText}>Start New Chat</Text>
//             </TouchableOpacity>
//           </View>
//         }
//       />

//       {/* New Chat FAB */}
//       <TouchableOpacity
//         style={styles.fab}
//         onPress={() => setShowNewChatModal(true)}
//         activeOpacity={0.8}
//       >
//         <Edit size={getResponsiveSize(24)} color="#FFFFFF" strokeWidth={2.5} />
//       </TouchableOpacity>

//       {/* New Chat Modal */}
//       <Modal
//         visible={showNewChatModal}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setShowNewChatModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>New Chat</Text>
//               <TouchableOpacity
//                 onPress={() => setShowNewChatModal(false)}
//                 style={styles.closeButton}
//               >
//                 <X size={getResponsiveSize(24)} color="#9CA3AF" />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.tabsContainer}>
//               <TouchableOpacity
//                 style={[styles.tab, activeTab === 'all' && styles.activeTab]}
//                 onPress={() => setActiveTab('all')}
//               >
//                 <Text
//                   style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}
//                 >
//                   All ({contacts.length})
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
//                 onPress={() => setActiveTab('followers')}
//               >
//                 <Text
//                   style={[
//                     styles.tabText,
//                     activeTab === 'followers' && styles.activeTabText,
//                   ]}
//                 >
//                   Followers ({contacts.filter((c) => c.type === 'follower').length})
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.tab, activeTab === 'following' && styles.activeTab]}
//                 onPress={() => setActiveTab('following')}
//               >
//                 <Text
//                   style={[
//                     styles.tabText,
//                     activeTab === 'following' && styles.activeTabText,
//                   ]}
//                 >
//                   Following ({contacts.filter((c) => c.type === 'following').length})
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             <FlatList
//               data={filteredContacts}
//               renderItem={renderContactItem}
//               keyExtractor={(item) => item.id}
//               contentContainerStyle={styles.followersListContent}
//               ListEmptyComponent={
//                 <View style={styles.emptyFollowersContainer}>
//                   <Text style={styles.emptyFollowersText}>
//                     {activeTab === 'all' && 'No contacts yet'}
//                     {activeTab === 'followers' && 'No followers yet'}
//                     {activeTab === 'following' && 'Not following anyone yet'}
//                   </Text>
//                   <Text style={styles.emptyFollowersSubtext}>
//                     {activeTab === 'followers' && 'When people follow you, they will appear here'}
//                     {activeTab === 'following' &&
//                       'Follow companies to start chatting with them'}
//                     {activeTab === 'all' && 'Follow companies or get followers to start chatting'}
//                   </Text>
//                 </View>
//               }
//             />
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000000',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: getResponsiveSize(16),
//     paddingTop: getResponsiveSize(16),
//     paddingBottom: getResponsiveSize(8),
//     backgroundColor: '#000000',
//   },
//   headerLeft: {
//     flex: 1,
//     paddingLeft: getResponsiveSize(48),
//   },
//   headerTitle: {
//     fontSize: getFontSize(18),
//     fontWeight: '700',
//     color: '#FFFFFF',
//     textAlign: 'center',
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: getResponsiveSize(12),
//   },
//   profileButton: {
//     width: getResponsiveSize(48),
//     height: getResponsiveSize(48),
//     borderRadius: getResponsiveSize(8),
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//   },
//   profileImage: {
//     width: getResponsiveSize(32),
//     height: getResponsiveSize(32),
//     borderRadius: getResponsiveSize(16),
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: getResponsiveSize(16),
//     height: getResponsiveSize(54),
//     position: 'relative',
//   },
//   searchIconWrapper: {
//     position: 'absolute',
//     left: getResponsiveSize(16),
//     zIndex: 1,
//   },
//   searchInput: {
//     flex: 1,
//     height: getResponsiveSize(46),
//     backgroundColor: '#0F1417',
//     borderRadius: getResponsiveSize(10),
//     borderWidth: 1.18,
//     borderColor: '#495565',
//     paddingLeft: getResponsiveSize(40),
//     paddingRight: getResponsiveSize(16),
//     color: '#FFFFFF',
//     fontSize: getFontSize(16),
//     fontWeight: '700',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   listContent: {
//     paddingBottom: getResponsiveSize(100),
//   },
//   emptyList: {
//     flexGrow: 1,
//   },
//   conversationItem: {
//     backgroundColor: '#0F1417',
//     paddingHorizontal: getResponsiveSize(16),
//     paddingVertical: getResponsiveSize(12),
//     borderBottomWidth: 0,
//   },
//   messageRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: getResponsiveSize(16),
//   },
//   avatarSection: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: getResponsiveSize(16),
//   },
//   avatarWrapper: {
//     width: getResponsiveSize(70),
//     height: getResponsiveSize(70),
//     borderRadius: getResponsiveSize(35),
//     overflow: 'hidden',
//     backgroundColor: '#1F2937',
//   },
//   avatar: {
//     width: '100%',
//     height: '100%',
//   },
//   messageContent: {
//     flex: 1,
//     justifyContent: 'center',
//     gap: getResponsiveSize(0),
//   },
//   nameRow: {
//     marginBottom: getResponsiveSize(0),
//   },
//   companyName: {
//     fontSize: getFontSize(16),
//     fontWeight: '500',
//     color: '#FFFFFF',
//     lineHeight: getFontSize(24),
//   },
//   messagesColumn: {
//     gap: getResponsiveSize(0),
//   },
//   lastMessage: {
//     fontSize: getFontSize(14),
//     color: '#8EA8CC',
//     lineHeight: getFontSize(21),
//   },
//   secondaryMessage: {
//     fontSize: getFontSize(14),
//     color: '#8EA8CC',
//     lineHeight: getFontSize(21),
//   },
//   metaSection: {
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'flex-start',
//     gap: getResponsiveSize(12),
//     height: getResponsiveSize(108),
//     paddingTop: getResponsiveSize(0),
//   },
//   timeWrapper: {
//     alignItems: 'flex-start',
//   },
//   timeText: {
//     fontSize: getFontSize(14),
//     color: '#8EA8CC',
//     lineHeight: getFontSize(21),
//   },
//   unreadBadge: {
//     width: getResponsiveSize(12),
//     height: getResponsiveSize(12),
//     borderRadius: getResponsiveSize(6),
//     backgroundColor: '#FF383C',
//     shadowColor: '#FF383C',
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.38,
//     shadowRadius: 7,
//     elevation: 7,
//   },
//   unreadDot: {
//     width: '100%',
//     height: '100%',
//     borderRadius: getResponsiveSize(6),
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: getResponsiveSize(32),
//     marginTop: getResponsiveSize(100),
//   },
//   emptyTitle: {
//     fontSize: getFontSize(20),
//     fontWeight: '600',
//     color: '#FFFFFF',
//     marginBottom: getResponsiveSize(8),
//   },
//   emptySubtitle: {
//     fontSize: getFontSize(14),
//     color: '#9CA3AF',
//     textAlign: 'center',
//     marginBottom: getResponsiveSize(24),
//   },
//   startChatButton: {
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: getResponsiveSize(24),
//     paddingVertical: getResponsiveSize(12),
//     borderRadius: getResponsiveSize(12),
//   },
//   startChatText: {
//     color: '#FFFFFF',
//     fontSize: getFontSize(16),
//     fontWeight: '600',
//   },
//   fab: {
//     position: 'absolute',
//     bottom: getResponsiveSize(24),
//     right: getResponsiveSize(24),
//     width: getResponsiveSize(56),
//     height: getResponsiveSize(56),
//     borderRadius: getResponsiveSize(28),
//     backgroundColor: '#0057D9',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     backgroundColor: '#111827',
//     borderTopLeftRadius: getResponsiveSize(24),
//     borderTopRightRadius: getResponsiveSize(24),
//     maxHeight: SCREEN_HEIGHT * 0.8,
//     paddingBottom: getResponsiveSize(20),
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: getResponsiveSize(20),
//     paddingVertical: getResponsiveSize(16),
//     borderBottomWidth: 1,
//     borderBottomColor: '#1F2937',
//   },
//   modalTitle: {
//     fontSize: getFontSize(20),
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   closeButton: {
//     padding: getResponsiveSize(4),
//   },
//   tabsContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: getResponsiveSize(16),
//     paddingTop: getResponsiveSize(12),
//     paddingBottom: getResponsiveSize(8),
//     borderBottomWidth: 1,
//     borderBottomColor: '#1F2937',
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: getResponsiveSize(10),
//     alignItems: 'center',
//     borderBottomWidth: 2,
//     borderBottomColor: 'transparent',
//   },
//   activeTab: {
//     borderBottomColor: '#3B82F6',
//   },
//   tabText: {
//     fontSize: getFontSize(14),
//     fontWeight: '600',
//     color: '#9CA3AF',
//   },
//   activeTabText: {
//     color: '#3B82F6',
//   },
//   followersListContent: {
//     paddingTop: getResponsiveSize(8),
//   },
//   followerItem: {
//     flexDirection: 'row',
//     padding: getResponsiveSize(16),
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: '#1F2937',
//   },
//   followerAvatar: {
//     width: getResponsiveSize(50),
//     height: getResponsiveSize(50),
//     borderRadius: getResponsiveSize(25),
//     backgroundColor: '#374151',
//     marginRight: getResponsiveSize(12),
//   },
//   followerInfo: {
//     flex: 1,
//   },
//   followerName: {
//     fontSize: getFontSize(16),
//     fontWeight: '600',
//     color: '#FFFFFF',
//     marginBottom: getResponsiveSize(2),
//   },
//   followerPhone: {
//     fontSize: getFontSize(13),
//     color: '#9CA3AF',
//   },
//   contactTypeBadge: {
//     backgroundColor: '#374151',
//     paddingHorizontal: getResponsiveSize(10),
//     paddingVertical: getResponsiveSize(4),
//     borderRadius: getResponsiveSize(12),
//   },
//   contactTypeText: {
//     fontSize: getFontSize(11),
//     color: '#9CA3AF',
//     fontWeight: '600',
//   },
//   emptyFollowersContainer: {
//     padding: getResponsiveSize(32),
//     alignItems: 'center',
//   },
//   emptyFollowersText: {
//     fontSize: getFontSize(16),
//     fontWeight: '600',
//     color: '#FFFFFF',
//     marginBottom: getResponsiveSize(4),
//   },
//   emptyFollowersSubtext: {
//     fontSize: getFontSize(14),
//     color: '#9CA3AF',
//     textAlign: 'center',
//   },
// });



// app/(app)/chat/index.tsx - Updated UI & Functionality

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { chatAPI } from '../../../services/chat-websocket';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive sizing function
const getResponsiveSize = (size: number) => {
  const baseWidth = 390;
  const scale = SCREEN_WIDTH / baseWidth;
  const newSize = size * scale;
  return Math.round(newSize);
};

// Font scaling
const getFontSize = (size: number) => {
  const scale = SCREEN_WIDTH / 390;
  const newSize = size * scale;
  if (scale < 0.85) return Math.round(size * 0.85);
  if (scale > 1.15) return Math.round(size * 1.15);
  return Math.round(newSize);
};

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
  lastMessageType?: string;
  messageCount: number;
  unreadCount: number;
}

export default function ChatListScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile Zoom State
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data);
      // If search query exists, filter immediately
      if (searchQuery.trim()) {
        filterConversations(response.data, searchQuery);
      } else {
        setFilteredConversations(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh when screen comes into focus (e.g., returning from chat)
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, []);

  // Search Logic
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterConversations(conversations, text);
  };

  const filterConversations = (data: Conversation[], query: string) => {
    if (!query.trim()) {
      setFilteredConversations(data);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = data.filter((item) => 
      item.partner.companyName.toLowerCase().includes(lowerQuery)
    );
    setFilteredConversations(filtered);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getLastMessageDisplay = (item: Conversation) => {
    if (item.lastMessageType === 'image') return '📷 Photo';
    if (item.lastMessageType === 'video') return '🎥 Video';
    if (item.lastMessageType === 'file' || item.lastMessageType === 'document') return '📎 File';
    return item.lastMessage;
  };

  const openChat = (companyId: string) => {
    router.push(`/(app)/chat/${companyId}`);
  };

  const handleProfilePress = (imageUrl: string | null) => {
    if (imageUrl) {
      setSelectedProfileImage(imageUrl);
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => openChat(item.partnerId)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContentWrapper}>
        {/* Avatar Section */}
        <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleProfilePress(item.partner.logo)}
        >
            <Image
            source={{
                uri: item.partner.logo || 'https://via.placeholder.com/70',
            }}
            style={styles.avatar}
            />
        </TouchableOpacity>

        {/* Message Content */}
        <View style={styles.textContainer}>
          <View style={styles.topRow}>
            <Text style={styles.companyName} numberOfLines={1}>
              {item.partner.companyName}
            </Text>
            <Text style={styles.timeText}>{formatTime(item.lastMessageAt)}</Text>
          </View>
          
          <View style={styles.bottomRow}>
            <Text 
                style={[
                    styles.lastMessage,
                    item.unreadCount > 0 ? styles.unreadMessageText : null
                ]} 
                numberOfLines={1}
            >
              {getLastMessageDisplay(item)}
            </Text>
            
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCountText}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <View style={styles.searchIconWrapper}>
            <Search size={getResponsiveSize(20)} color="#8FA8CC" strokeWidth={2.5} />
            </View>
            <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#99A1AE"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            />
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.partnerId}
        contentContainerStyle={[
          styles.listContent,
          filteredConversations.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
                {searchQuery ? 'No results found' : 'No conversations yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {searchQuery 
                    ? `We couldn't find any chat matching "${searchQuery}"`
                    : 'Your conversations will appear here'}
            </Text>
          </View>
        }
      />

      {/* Profile Zoom Modal */}
      <Modal
        visible={!!selectedProfileImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedProfileImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={() => setSelectedProfileImage(null)}
          >
            <TouchableOpacity 
                style={styles.closeModalButton} 
                onPress={() => setSelectedProfileImage(null)}
            >
              <X size={getResponsiveSize(32)} color="#FFF" />
            </TouchableOpacity>
            
            {selectedProfileImage && (
                <Image 
                source={{ uri: selectedProfileImage }} 
                style={styles.zoomedImage}
                resizeMode="contain"
                />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16),
    paddingTop: getResponsiveSize(12),
    paddingBottom: getResponsiveSize(8),
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: getFontSize(28),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: getResponsiveSize(16),
    paddingVertical: getResponsiveSize(12),
    backgroundColor: '#000000',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1417',
    borderRadius: getResponsiveSize(10),
    borderWidth: 1,
    borderColor: '#374151',
    height: getResponsiveSize(46),
  },
  searchIconWrapper: {
    paddingLeft: getResponsiveSize(12),
    paddingRight: getResponsiveSize(8),
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: getFontSize(16),
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: getResponsiveSize(100),
  },
  emptyList: {
    flexGrow: 1,
  },
  conversationItem: {
    backgroundColor: '#000000', // Match bg
    paddingHorizontal: getResponsiveSize(16),
    paddingVertical: getResponsiveSize(12),
  },
  itemContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: getResponsiveSize(56),
    height: getResponsiveSize(56),
    borderRadius: getResponsiveSize(28),
    backgroundColor: '#1F2937',
    marginRight: getResponsiveSize(14),
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingBottom: getResponsiveSize(12),
    // Ensures text container takes full remaining width
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(4),
  },
  companyName: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: getResponsiveSize(8),
  },
  timeText: {
    fontSize: getFontSize(12),
    color: '#8FA8CC',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: getFontSize(14),
    color: '#9CA3AF',
    flex: 1,
    marginRight: getResponsiveSize(12),
  },
  unreadMessageText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#0057D9',
    borderRadius: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(8),
    paddingVertical: getResponsiveSize(2),
    minWidth: getResponsiveSize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCountText: {
    fontSize: getFontSize(11),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(32),
    marginTop: getResponsiveSize(100),
  },
  emptyTitle: {
    fontSize: getFontSize(18),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: getResponsiveSize(8),
  },
  emptySubtitle: {
    fontSize: getFontSize(14),
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? getResponsiveSize(40) : getResponsiveSize(60),
    right: getResponsiveSize(20),
    zIndex: 10,
    padding: getResponsiveSize(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: getResponsiveSize(30),
  },
  zoomedImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});