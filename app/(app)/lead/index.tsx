// app/(app)/lead/index.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LeadCard } from '../../../components/cards/lead-card';
import { leadsAPI, Lead, subscriptionAPI, CurrentSubscription } from '../../../services/leads';
import { companyAPI } from '../../../services/user';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

const HEADER_HEIGHT = sizeScale(140);

export default function LeadScreen() {
  const params = useLocalSearchParams();
  const scrollToLeadId = params.scrollToLeadId as string | undefined;
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasScrolledToItem, setHasScrolledToItem] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

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

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);
      
      // Fetch current user profile, leads and subscription in parallel
      const [profileResponse, leadsResponse, subscriptionResponse] = await Promise.all([
        companyAPI.getProfile(),
        leadsAPI.getAllLeads(),
        subscriptionAPI.getCurrentSubscription(),
      ]);
      
      // Set current user ID
      if (profileResponse) {
        setCurrentUserId(profileResponse.id);
        console.log('✅ Current user ID:', profileResponse.id);
      }
      
      if (leadsResponse.status === 'success' && leadsResponse.data) {
        // Filter out:
        // 1. Deleted leads
        // 2. Inactive leads
        // 3. User's own leads (where companyId matches current user)
        const filteredLeads = leadsResponse.data.filter(
          lead => !lead.isDeleted && 
                  lead.isActive && 
                  lead.companyId !== profileResponse.id
        );
        
        console.log('📊 Total leads:', leadsResponse.data.length);
        console.log('📊 Filtered leads (excluding own):', filteredLeads.length);
        
        setLeads(filteredLeads);
      }

      if (subscriptionResponse.status === 'success' && subscriptionResponse.data) {
        setSubscription(subscriptionResponse.data);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Scroll to specific lead when coming from dashboard
  useEffect(() => {
    if (scrollToLeadId && leads.length > 0 && !hasScrolledToItem) {
      const index = leads.findIndex(lead => lead.id === scrollToLeadId);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.3,
          });
          setHasScrolledToItem(true);
        }, 500);
      }
    }
  }, [scrollToLeadId, leads, hasScrolledToItem]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasScrolledToItem(false);
    fetchData(true);
  };

  const handleConsumeSuccess = (contact: string) => {
    fetchData(true);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const handleScrollToIndexFailed = (info: any) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0.3,
      });
    });
  };

  const availableLeads = subscription 
    ? subscription.leadQuota - subscription.consumedLeads 
    : 0;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading leads...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>Pull down to retry</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          },
        ]}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Leads</Text>
              
              <View style={styles.headerActions}>
                {/* Available Leads Counter */}
                <View style={styles.leadsCounter}>
                  <Ionicons name="business" size={sizeScale(16)} color="#8b5cf6" />
                  <Text style={styles.leadsCountText}>{availableLeads}</Text>
                </View>

                {/* Upgrade Button */}
                <TouchableOpacity 
                  style={styles.upgradeButton}
                  onPress={() => router.push('/lead/subscription')}
                >
                  <Ionicons name="trending-up" size={sizeScale(16)} color="#fff" />
                  <Text style={styles.upgradeText}>Upgrade</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.headerSubtitle}>
              {leads.length} {leads.length === 1 ? 'opportunity' : 'opportunities'} available
            </Text>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Leads List */}
      <Animated.FlatList
        ref={flatListRef}
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <LeadCard
            lead={item}
            gradientIndex={index}
            onConsumeSuccess={handleConsumeSuccess}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          leads.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
            progressViewOffset={HEADER_HEIGHT}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={80} color="#555" />
            <Text style={styles.emptyText}>No leads available</Text>
            <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    paddingHorizontal: sizeScale(20),
    paddingBottom: sizeScale(16),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizeScale(10),
  },
  headerTitle: {
    fontSize: sizeScale(32),
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(12),
  },
  leadsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(6),
    backgroundColor: '#1a1a1a',
    paddingHorizontal: sizeScale(14),
    paddingVertical: sizeScale(10),
    borderRadius: sizeScale(20),
    borderWidth: 1.5,
    borderColor: '#8b5cf6',
  },
  leadsCountText: {
    fontSize: sizeScale(15),
    fontWeight: '700',
    color: '#8b5cf6',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(6),
    backgroundColor: '#8b5cf6',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(10),
    borderRadius: sizeScale(20),
  },
  upgradeText: {
    fontSize: sizeScale(14),
    fontWeight: '600',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: sizeScale(15),
    color: '#888',
    fontWeight: '500',
  },
  listContent: {
    paddingTop: HEADER_HEIGHT + sizeScale(16),
    paddingHorizontal: sizeScale(20),
    paddingBottom: sizeScale(120),
  },
  emptyListContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});