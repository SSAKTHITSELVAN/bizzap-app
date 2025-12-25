// app/(app)/dashboard/index.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  Dimensions, 
  TouchableOpacity,
  Modal,
  Share,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, Gift, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LeadCard } from '../../../components/cards/lead-card';
import { leadsAPI, Lead } from '../../../services/leads';
import { companyAPI, LeadQuotaData } from '../../../services/user';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotaData, setQuotaData] = useState<LeadQuotaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const leadRefs = useRef<Map<string, any>>(new Map());

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const [quotaResponse, availableLeadsResponse] = await Promise.all([
        companyAPI.getLeadQuota(),
        leadsAPI.getAvailableLeads(),
      ]);
      
      if (quotaResponse.status === 'success') {
        setQuotaData(quotaResponse.data);
      }
      
      if (availableLeadsResponse.status === 'success') {
        setLeads(availableLeadsResponse.data.leads);
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsLoading(false); 
      setIsRefreshing(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  // --- Deep Link Handler ---
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received in dashboard:', url);
      
      // Parse leadId from URL: bizzap://dashboard?leadId=xxx or https://bizzap.app/dashboard?leadId=xxx
      const leadIdMatch = url.match(/[?&]leadId=([a-zA-Z0-9-]+)/);
      
      if (leadIdMatch && leadIdMatch[1]) {
        const leadId = leadIdMatch[1];
        console.log('Extracted leadId:', leadId);
        
        // Fetch lead details from public API
        try {
          const response = await leadsAPI.getLeadById(leadId);
          
          if (response.status === 'success') {
            const sharedLead = response.data;
            
            // Check if lead is already in the available leads list
            const leadIndex = leads.findIndex(l => l.id === leadId);
            
            if (leadIndex !== -1) {
              // Lead exists in list - scroll to it and highlight
              setHighlightedLeadId(leadId);
              
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: leadIndex,
                  animated: true,
                  viewPosition: 0.5
                });
              }, 500);
              
              // Remove highlight after 3 seconds
              setTimeout(() => {
                setHighlightedLeadId(null);
              }, 3500);
              
            } else {
              // Lead not in available list (might be consumed or posted by user)
              Alert.alert(
                'Lead Not Available',
                `This lead "${sharedLead.title}" is no longer available in your feed. It may have been consumed or posted by you.`,
                [{ text: 'OK' }]
              );
            }
          }
        } catch (error) {
          console.error('Error fetching shared lead:', error);
          Alert.alert(
            'Error',
            'Could not load the shared lead. It may no longer exist.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    // Get initial URL (app opened via link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for incoming links (app already open)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [leads]); // Re-run when leads change

  // --- Handle leadId from URL params (Expo Router) ---
  useEffect(() => {
    if (params.leadId && typeof params.leadId === 'string') {
      const leadId = params.leadId;
      console.log('LeadId from params:', leadId);
      
      const leadIndex = leads.findIndex(l => l.id === leadId);
      
      if (leadIndex !== -1) {
        setHighlightedLeadId(leadId);
        
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: leadIndex,
            animated: true,
            viewPosition: 0.5
          });
        }, 500);
        
        setTimeout(() => {
          setHighlightedLeadId(null);
        }, 3500);
      }
    }
  }, [params.leadId, leads]);

  const handleReferClick = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        Alert.alert('Error', 'User data not found');
        return;
      }
      
      const userData = JSON.parse(userDataString);
      const referralCode = userData.referralCode || quotaData?.referralCode;
      
      if (!referralCode) {
        Alert.alert('Error', 'Referral code not found');
        return;
      }

      setShowReferralModal(true);
    } catch (error) {
      console.error('Error getting referral code:', error);
      Alert.alert('Error', 'Failed to get referral code');
    }
  };

  const getReferralLink = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) return '';
      
      const userData = JSON.parse(userDataString);
      const referralCode = userData.referralCode || quotaData?.referralCode;
      
      return `https://bizzap.app/signup?ref=${referralCode}`;
    } catch (error) {
      return '';
    }
  };

  const handleCopyLink = async () => {
    const link = await getReferralLink();
    if (link) {
      await Clipboard.setStringAsync(link);
      Alert.alert('Success', 'Referral link copied to clipboard!');
    }
  };

  const handleShareLink = async () => {
    try {
      const link = await getReferralLink();
      const userDataString = await AsyncStorage.getItem('userData');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      const referralCode = userData?.referralCode || quotaData?.referralCode;
      
      const message = `Join Bizzap and get 5 bonus leads! Use my referral code: ${referralCode}\n\nSign up here: ${link}`;
      
      await Share.share({
        message,
        title: 'Join Bizzap',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderHeader = () => {
    if (!quotaData) return null;

    const { remainingLeads, totalLeadQuota, daysUntilReset } = quotaData;
    const isLowQuota = remainingLeads < 3;

    return (
      <View style={styles.headerArea}>
        {isLowQuota && (
          <View style={styles.warningBanner}>
            <AlertTriangle size={20} color="#F97316" />
            <Text style={styles.warningText}>
              Low on leads! Refer friends to earn 5 bonus leads each.
            </Text>
          </View>
        )}

        <View style={styles.quotaOuter}>
          <View style={styles.quotaInner}>
            <View style={styles.quotaRow}>
              <Text style={styles.quotaText}>
                {remainingLeads} leads available out of {totalLeadQuota} leads
              </Text>
              <Text style={styles.quotaBadge}>
                {remainingLeads}/{totalLeadQuota} Free Leads
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(remainingLeads / totalLeadQuota) * 100}%`,
                    backgroundColor: isLowQuota ? '#F97316' : '#00D1B2'
                  }
                ]} 
              />
            </View>
            <Text style={styles.expiryText}>
              Expires in: <Text style={{ color: '#F97316' }}>{daysUntilReset} days</Text>
            </Text>
            <Text style={styles.needMore}>Need more leads?</Text>
            <View style={styles.quotaActions}>
              <TouchableOpacity 
                style={styles.referBtn}
                onPress={handleReferClick}
              >
                <Gift size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnLabel}>1 Refer = 5 Leads</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.leadsHeaderSection}>
          <Text style={styles.leadsHeaderTitle}>Available Leads</Text>
          <Text style={styles.leadsHeaderCount}>{leads.length} Leads</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#0057D9" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        ref={flatListRef}
        data={leads}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View 
            ref={(ref) => {
              if (ref) leadRefs.current.set(item.id, ref);
            }}
            style={[
              highlightedLeadId === item.id && styles.highlightedCard
            ]}
          >
            <LeadCard 
              lead={item} 
              onConsumeSuccess={() => fetchData(true)} 
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => {
              setIsRefreshing(true);
              fetchData(true);
            }}
            tintColor="#0057D9"
            colors={['#0057D9']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Gift size={48} color="#00D1B2" />
            </View>
            <Text style={styles.emptyTitle}>No Leads Available Right Now</Text>
            <Text style={styles.emptyText}>
              Share Bizzap with your friends to help them post leads! 
              The more businesses join, the more opportunities for everyone.
            </Text>
            <TouchableOpacity 
              style={styles.emptyReferBtn}
              onPress={handleReferClick}
            >
              <Gift size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.emptyReferText}>Invite Friends Now</Text>
            </TouchableOpacity>
          </View>
        }
        onScrollToIndexFailed={(info) => {
          // Fallback if scroll fails
          console.log('Scroll to index failed:', info);
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }, 100);
        }}
      />

      {/* Referral Modal */}
      <Modal
        visible={showReferralModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.referralCard}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowReferralModal(false)}
            >
              <X size={24} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.giftIconCircle}>
              <Gift size={40} color="#0057D9" />
            </View>

            <Text style={styles.modalTitle}>Share & Earn Leads</Text>
            <Text style={styles.modalDesc}>
              Invite friends to join Bizzap. You both get <Text style={styles.highlightText}>5 bonus leads</Text> when they sign up!
            </Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Your Referral Code</Text>
              <Text style={styles.codeValue}>{quotaData?.referralCode}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.btnCopy}
                onPress={handleCopyLink}
              >
                <Text style={styles.btnCopyText}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.btnShare}
                onPress={handleShareLink}
              >
                <Text style={styles.btnShareText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121924',
    paddingTop: sizeScale(140),
  },
  headerArea: { 
    paddingHorizontal: sizeScale(16), 
    paddingTop: sizeScale(8),
    backgroundColor: '#121924',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: sizeScale(8),
    padding: sizeScale(12),
    marginBottom: sizeScale(12),
    gap: sizeScale(10),
  },
  warningText: {
    flex: 1,
    color: '#F97316',
    fontSize: sizeScale(13),
    fontWeight: '600',
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#121924',
  },
  listContent: { 
    paddingBottom: sizeScale(120),
  },
  highlightedCard: {
    backgroundColor: 'rgba(0, 87, 217, 0.15)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0057D9',
    marginHorizontal: -2,
    padding: 2,
  },
  quotaOuter: { 
    width: '100%', 
    paddingVertical: sizeScale(12),
  },
  quotaInner: { 
    width: '100%', 
    borderRadius: sizeScale(8), 
    padding: sizeScale(16), 
    backgroundColor: 'rgba(0, 93, 212, 0.19)',
  },
  quotaRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: sizeScale(12),
    flexWrap: 'wrap',
    gap: sizeScale(8),
  },
  quotaText: { 
    color: '#fff', 
    fontSize: sizeScale(12),
    flex: 1,
    minWidth: sizeScale(150),
  },
  quotaBadge: { 
    color: '#fff', 
    fontSize: sizeScale(14), 
    fontWeight: '700',
  },
  progressTrack: { 
    height: sizeScale(4), 
    backgroundColor: '#1E293B', 
    borderRadius: sizeScale(2), 
    marginBottom: sizeScale(12),
  },
  progressFill: { 
    height: '100%', 
    borderRadius: sizeScale(2),
  },
  expiryText: { 
    color: '#8B949E', 
    fontSize: sizeScale(12), 
    marginBottom: sizeScale(8),
  },
  needMore: { 
    color: '#fff', 
    fontSize: sizeScale(14), 
    fontWeight: '500', 
    marginBottom: sizeScale(12),
  },
  quotaActions: { 
    flexDirection: 'row', 
    gap: sizeScale(12),
    flexWrap: 'wrap',
  },
  referBtn: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: sizeScale(140),
    height: sizeScale(36), 
    backgroundColor: '#0057D9', 
    borderRadius: sizeScale(4), 
  },
  btnLabel: { 
    color: '#fff', 
    fontSize: sizeScale(12), 
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: sizeScale(60),
    paddingHorizontal: sizeScale(24),
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: sizeScale(96),
    height: sizeScale(96),
    borderRadius: sizeScale(48),
    backgroundColor: 'rgba(0, 209, 178, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sizeScale(20),
  },
  emptyTitle: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#FFF',
    marginBottom: sizeScale(12),
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: sizeScale(14),
    textAlign: 'center',
    lineHeight: sizeScale(22),
    marginBottom: sizeScale(24),
  },
  emptyReferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0057D9',
    paddingHorizontal: sizeScale(24),
    paddingVertical: sizeScale(12),
    borderRadius: sizeScale(8),
  },
  emptyReferText: {
    color: '#FFF',
    fontSize: sizeScale(14),
    fontWeight: '600',
  },
  leadsHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sizeScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  leadsHeaderTitle: {
    fontSize: sizeScale(18),
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Outfit',
  },
  leadsHeaderCount: {
    fontSize: sizeScale(14),
    fontWeight: '600',
    color: '#00D1B2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  referralCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  giftIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 87, 217, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
    fontFamily: 'Outfit',
  },
  modalDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  highlightText: {
    color: '#00D1B2',
    fontWeight: '700',
  },
  codeContainer: {
    width: '100%',
    backgroundColor: '#0F1417',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#495565',
  },
  codeLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00D1B2',
    letterSpacing: 2,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btnCopy: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0057D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCopyText: {
    color: '#0057D9',
    fontWeight: '600',
  },
  btnShare: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0057D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnShareText: {
    color: '#FFF',
    fontWeight: '600',
  },
});