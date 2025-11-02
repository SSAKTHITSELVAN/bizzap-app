// app/(app)/chat/index.tsx

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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Edit, X } from 'lucide-react-native';
import { chatAPI } from '../../../services/chat-websocket';
import { followersAPI } from '../../../services/user';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const sizeScale = (size: number) => (SCREEN_WIDTH / 390) * size;

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
  lastMessageFileUrl?: string | null;
  lastMessageThumbnailUrl?: string | null;
  messageCount: number;
  unreadCount: number;
}

interface Contact {
  id: string;
  companyName: string;
  logo: string | null;
  phoneNumber: string;
  type: 'follower' | 'following';
}

export default function ChatListScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'followers' | 'following'>('all');

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data);
      
      const unreadResponse = await chatAPI.getUnreadCount();
      setTotalUnread(unreadResponse.data.unreadCount);
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const [followersData, followingData] = await Promise.all([
        followersAPI.getFollowers(),
        followersAPI.getFollowing(),
      ]);

      const followersWithType: Contact[] = followersData.map((f) => ({
        id: f.id,
        companyName: f.companyName,
        logo: f.logo,
        phoneNumber: f.phoneNumber,
        type: 'follower' as const,
      }));

      const followingWithType: Contact[] = followingData.map((f) => ({
        id: f.id,
        companyName: f.companyName,
        logo: f.logo,
        phoneNumber: f.phoneNumber,
        type: 'following' as const,
      }));

      const allContacts = [...followersWithType, ...followingWithType];
      const uniqueContacts = allContacts.reduce((acc: Contact[], current) => {
        const existing = acc.find((item) => item.id === current.id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);

      setContacts(uniqueContacts);
    } catch (error: any) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
    fetchContacts();
  }, []);

  const getFilteredContacts = () => {
    if (activeTab === 'all') return contacts;
    return contacts.filter((c) => c.type === activeTab.slice(0, -1) as 'follower' | 'following');
  };

  const filteredContacts = getFilteredContacts();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getLastMessageDisplay = (item: Conversation) => {
    if (item.lastMessageType === 'image') {
      return '📷 Photo';
    }
    if (item.lastMessageType === 'file' || item.lastMessageType === 'document') {
      return '📎 File';
    }
    return item.lastMessage;
  };

  const openChat = (companyId: string) => {
    router.push(`/(app)/chat/${companyId}`);
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => openChat(item.partnerId)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: item.partner.logo || 'https://via.placeholder.com/60',
          }}
          style={styles.avatar}
        />
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.companyName} numberOfLines={1}>
            {item.partner.companyName}
          </Text>
          <Text style={styles.timeText}>{formatTime(item.lastMessageAt)}</Text>
        </View>
        <Text
          style={[
            styles.lastMessage,
            item.unreadCount > 0 && styles.unreadMessage,
          ]}
          numberOfLines={1}
        >
          {getLastMessageDisplay(item)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.followerItem}
      onPress={() => {
        setShowNewChatModal(false);
        openChat(item.id);
      }}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: item.logo || 'https://via.placeholder.com/60',
        }}
        style={styles.followerAvatar}
      />
      <View style={styles.followerInfo}>
        <Text style={styles.followerName} numberOfLines={1}>
          {item.companyName}
        </Text>
        <Text style={styles.followerPhone} numberOfLines={1}>
          {item.phoneNumber}
        </Text>
      </View>
      <View style={styles.contactTypeBadge}>
        <Text style={styles.contactTypeText}>
          {item.type === 'follower' ? 'Follower' : 'Following'}
        </Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => setShowNewChatModal(true)}
          activeOpacity={0.7}
        >
          <Edit size={sizeScale(24)} color="#3B82F6" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.partnerId}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.emptyList,
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
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a new chat with your connections
            </Text>
            <TouchableOpacity
              style={styles.startChatButton}
              onPress={() => setShowNewChatModal(true)}
            >
              <Text style={styles.startChatText}>Start New Chat</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={showNewChatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Chat</Text>
              <TouchableOpacity
                onPress={() => setShowNewChatModal(false)}
                style={styles.closeButton}
              >
                <X size={sizeScale(24)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                onPress={() => setActiveTab('all')}
              >
                <Text
                  style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}
                >
                  All ({contacts.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
                onPress={() => setActiveTab('followers')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'followers' && styles.activeTabText,
                  ]}
                >
                  Followers ({contacts.filter((c) => c.type === 'follower').length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'following' && styles.activeTab]}
                onPress={() => setActiveTab('following')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'following' && styles.activeTabText,
                  ]}
                >
                  Following ({contacts.filter((c) => c.type === 'following').length})
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredContacts}
              renderItem={renderContactItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.followersListContent}
              ListEmptyComponent={
                <View style={styles.emptyFollowersContainer}>
                  <Text style={styles.emptyFollowersText}>
                    {activeTab === 'all' && 'No contacts yet'}
                    {activeTab === 'followers' && 'No followers yet'}
                    {activeTab === 'following' && 'Not following anyone yet'}
                  </Text>
                  <Text style={styles.emptyFollowersSubtext}>
                    {activeTab === 'followers' && 'When people follow you, they will appear here'}
                    {activeTab === 'following' &&
                      'Follow companies to start chatting with them'}
                    {activeTab === 'all' && 'Follow companies or get followers to start chatting'}
                  </Text>
                </View>
              }
            />
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerTitle: {
    fontSize: sizeScale(28),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  newChatButton: {
    padding: sizeScale(8),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: sizeScale(100),
  },
  emptyList: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: sizeScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: sizeScale(12),
  },
  avatar: {
    width: sizeScale(56),
    height: sizeScale(56),
    borderRadius: sizeScale(28),
    backgroundColor: '#374151',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: sizeScale(12),
    minWidth: sizeScale(20),
    height: sizeScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sizeScale(6),
    borderWidth: 2,
    borderColor: '#000000',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: sizeScale(10),
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizeScale(4),
  },
  companyName: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: sizeScale(8),
  },
  timeText: {
    fontSize: sizeScale(12),
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: sizeScale(14),
    color: '#9CA3AF',
  },
  unreadMessage: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sizeScale(32),
  },
  emptyTitle: {
    fontSize: sizeScale(20),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: sizeScale(8),
  },
  emptySubtitle: {
    fontSize: sizeScale(14),
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: sizeScale(24),
  },
  startChatButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: sizeScale(24),
    paddingVertical: sizeScale(12),
    borderRadius: sizeScale(12),
  },
  startChatText: {
    color: '#FFFFFF',
    fontSize: sizeScale(16),
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: sizeScale(24),
    borderTopRightRadius: sizeScale(24),
    maxHeight: '80%',
    paddingBottom: sizeScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizeScale(20),
    paddingVertical: sizeScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  modalTitle: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: sizeScale(4),
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: sizeScale(16),
    paddingTop: sizeScale(12),
    paddingBottom: sizeScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  tab: {
    flex: 1,
    paddingVertical: sizeScale(10),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: sizeScale(14),
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  followersListContent: {
    paddingTop: sizeScale(8),
  },
  followerItem: {
    flexDirection: 'row',
    padding: sizeScale(16),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  followerAvatar: {
    width: sizeScale(50),
    height: sizeScale(50),
    borderRadius: sizeScale(25),
    backgroundColor: '#374151',
    marginRight: sizeScale(12),
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: sizeScale(2),
  },
  followerPhone: {
    fontSize: sizeScale(13),
    color: '#9CA3AF',
  },
  contactTypeBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: sizeScale(10),
    paddingVertical: sizeScale(4),
    borderRadius: sizeScale(12),
  },
  contactTypeText: {
    fontSize: sizeScale(11),
    color: '#9CA3AF',
    fontWeight: '600',
  },
  emptyFollowersContainer: {
    padding: sizeScale(32),
    alignItems: 'center',
  },
  emptyFollowersText: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: sizeScale(4),
  },
  emptyFollowersSubtext: {
    fontSize: sizeScale(14),
    color: '#9CA3AF',
    textAlign: 'center',
  },
});