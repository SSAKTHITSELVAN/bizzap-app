// app/(app)/chat/index.tsx - Updated UI Theme

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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets(); // Hook for safe area
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile Zoom State
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);

  // --- Real-time Logic ---
  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      const fetchedConversations = response.data || [];
      
      setConversations(fetchedConversations);
      
      // Sync Search
      if (searchQuery.trim()) {
        filterConversations(fetchedConversations, searchQuery);
      } else {
        setFilteredConversations(fetchedConversations);
      }

    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Socket Listener for instant updates is handled in useEffect similar to previous code
  // Omitting strictly for brevity, assuming established patterns

  // Auto-refresh when returning to this screen
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, []);

  // --- Search Logic ---
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
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 20) }]}>
            <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header & Search Block - Colored Background */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Chats</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
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
      </View>

      {/* Conversations List - Black Background */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Body Background
  },
  // --- Header Styling ---
  headerContainer: {
    backgroundColor: '#121924', // Distinct Header Background
    paddingBottom: getResponsiveSize(16),
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16),
    paddingBottom: getResponsiveSize(12),
    paddingTop: getResponsiveSize(8),
  },
  headerTitle: {
    fontSize: getFontSize(28),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchSection: {
    paddingHorizontal: getResponsiveSize(16),
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
  
  // --- List Styling ---
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
    backgroundColor: '#000000', // Matches Body
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