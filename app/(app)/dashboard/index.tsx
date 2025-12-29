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
  Linking,
  Image
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const leadRefs = useRef<Map<string, any>>(new Map());

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const [quotaResponse, availableLeadsResponse, profileResponse] = await Promise.all([
        companyAPI.getLeadQuota(),
        leadsAPI.getAvailableLeads(),
        companyAPI.getProfile(),
      ]);
      
      if (quotaResponse.status === 'success') {
        setQuotaData(quotaResponse.data);
      }
      
      if (availableLeadsResponse.status === 'success') {
        setLeads(availableLeadsResponse.data.leads);
      }

      setUserProfile(profileResponse);

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

  // --- Deep Link & Params Logic ---
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      const leadIdMatch = url.match(/[?&]leadId=([a-zA-Z0-9-]+)/);
      
      if (leadIdMatch && leadIdMatch[1]) {
        const leadId = leadIdMatch[1];
        try {
          const response = await leadsAPI.getLeadById(leadId);
          if (response.status === 'success') {
            const leadIndex = leads.findIndex(l => l.id === leadId);
            if (leadIndex !== -1) {
              setHighlightedLeadId(leadId);
              setTimeout(() => flatListRef.current?.scrollToIndex({ index: leadIndex, animated: true, viewPosition: 0.5 }), 500);
              setTimeout(() => setHighlightedLeadId(null), 3500);
            }
          }
        } catch (error) { console.error('Error fetching shared lead:', error); }
      }
    };
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [leads]);

  // --- Handlers ---
  const handleReferClick = async () => {
    setShowReferralModal(true);
  };

  const handleCopyLink = async () => {
    if (quotaData?.referralCode) {
      const link = `https://bizzap.app/signup?ref=${quotaData.referralCode}`;
      await Clipboard.setStringAsync(link);
      Alert.alert('Success', 'Referral link copied to clipboard!');
    }
  };

  const handleShareLink = async () => {
    if (quotaData?.referralCode) {
      const link = `https://bizzap.app/signup?ref=${quotaData.referralCode}`;
      await Share.share({ message: `Join Bizzap and get bonus leads! Code: ${quotaData.referralCode}\n${link}` });
    }
  };

  // --- Render Components ---

  const renderHeader = () => {
    // Header Data
    const displayImage = userProfile?.userPhoto || userProfile?.logo;
    const displayInitial = (userProfile?.userName || userProfile?.companyName || 'B').charAt(0).toUpperCase();

    // Quota Data
    if (!quotaData) return <View style={{ height: sizeScale(20) }} />; 

    const { remainingLeads, totalLeadQuota, daysUntilReset } = quotaData;
    const usedLeads = totalLeadQuota - remainingLeads;
    const isLowQuota = remainingLeads < 5; 

    return (
      <View>
        {/* Scrollable Nav Bar (Header) - Updated with Bottom Padding & Margin */}
        <View style={styles.navRow}>
            <Text style={styles.navTitle}>Leads</Text>
            <TouchableOpacity 
                style={styles.profileContainer}
                onPress={() => router.push('/(app)/profile')}
            >
                {displayImage ? (
                    <Image source={{ uri: displayImage }} style={styles.profileThumb} />
                ) : (
                    <View style={[styles.profileThumb, styles.profilePlaceholder]}>
                        <Text style={styles.profileInitial}>{displayInitial}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>

        {/* Quota Card Design */}
        <View style={styles.headerArea}>
          <View style={styles.quotaCard}>
            
            {/* Top Row: Usage & Expiry */}
            <View style={styles.quotaRow}>
              <Text style={styles.quotaText}>
                <Text style={styles.greenText}>{usedLeads}/{totalLeadQuota} leads used</Text>
              </Text>
              <Text style={styles.expiryText}>
                Expire in: <Text style={styles.boldWhite}>{daysUntilReset} Days</Text>
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(usedLeads / totalLeadQuota) * 100}%` }
                ]} 
              />
            </View>

            {/* Conditional Warning Box */}
            {isLowQuota && (
              <View style={styles.warningBox}>
                <View style={styles.warningRow}>
                  <AlertTriangle size={sizeScale(16)} color="#EA580C" /> 
                  <Text style={styles.warningTitle}>You're almost running out of leads</Text>
                </View>
                <Text style={styles.warningSubtext}>Refer to get more leads.</Text>
              </View>
            )}

            {/* Get More Leads Button */}
            <TouchableOpacity 
              style={styles.getMoreBtn}
              onPress={handleReferClick}
            >
              <Text style={styles.getMoreText}>Get More Leads</Text>
            </TouchableOpacity>

          </View>
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FlatList
        ref={flatListRef}
        data={leads}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View 
            ref={(ref) => { if (ref) leadRefs.current.set(item.id, ref); }}
            style={[highlightedLeadId === item.id && styles.highlightedCard]}
          >
            <LeadCard lead={item} onConsumeSuccess={() => fetchData(true)} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => { setIsRefreshing(true); fetchData(true); }}
            tintColor="#0057D9"
            colors={['#0057D9']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}><Gift size={48} color="#00D1B2" /></View>
            <Text style={styles.emptyTitle}>No Leads Available Right Now</Text>
            <Text style={styles.emptyText}>Share Bizzap with friends to help them post leads!</Text>
            <TouchableOpacity style={styles.emptyReferBtn} onPress={handleReferClick}>
              <Gift size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.emptyReferText}>Invite Friends Now</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Referral Modal */}
      <Modal visible={showReferralModal} transparent animationType="slide" onRequestClose={() => setShowReferralModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.referralCard}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowReferralModal(false)}>
              <X size={24} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.giftIconCircle}><Gift size={40} color="#0057D9" /></View>
            <Text style={styles.modalTitle}>Share & Earn Leads</Text>
            <Text style={styles.modalDesc}>Invite friends to join Bizzap. You get <Text style={styles.highlightText}>3 bonus leads</Text> when they sign up!</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Your Referral Code</Text>
              <Text style={styles.codeValue}>{quotaData?.referralCode}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCopy} onPress={handleCopyLink}><Text style={styles.btnCopyText}>Copy Link</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnShare} onPress={handleShareLink}><Text style={styles.btnShareText}>Share</Text></TouchableOpacity>
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
    backgroundColor: '#000000',
  },
  // --- Header & Nav Styles ---
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    paddingTop: sizeScale(16),
    paddingBottom: sizeScale(24), // Added Extra Bottom Padding for Header
    marginBottom: sizeScale(16),  // Margin to separate Header from Card
    backgroundColor: '#121924',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: sizeScale(24),
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  profileContainer: {
    borderRadius: sizeScale(16),
    overflow: 'hidden',
  },
  profileThumb: {
    width: sizeScale(32),
    height: sizeScale(32),
    borderRadius: sizeScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholder: {
    backgroundColor: '#8b5cf6',
  },
  profileInitial: {
    fontSize: sizeScale(14),
    fontWeight: '700',
    color: '#fff',
  },

  // --- Quota Card Styles ---
  headerArea: { 
    paddingHorizontal: sizeScale(16), 
    paddingBottom: sizeScale(16),
  },
  quotaCard: { 
    width: '100%', 
    borderRadius: sizeScale(12), 
    padding: sizeScale(16), 
    backgroundColor: '#111827', // Dark Card Background
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  quotaRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: sizeScale(12),
  },
  quotaText: { 
    fontSize: sizeScale(16),
    fontWeight: '500',
  },
  greenText: {
    color: '#10B981', 
    fontWeight: '700',
  },
  expiryText: { 
    color: '#9CA3AF', 
    fontSize: sizeScale(14), 
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressTrack: { 
    height: sizeScale(6), 
    backgroundColor: '#374151', 
    borderRadius: sizeScale(3), 
    marginBottom: sizeScale(16),
    overflow: 'hidden',
  },
  progressFill: { 
    height: '100%', 
    borderRadius: sizeScale(3),
    backgroundColor: '#00D1B2', 
  },
  
  // Warning Box
  warningBox: {
    backgroundColor: 'rgba(69, 26, 3, 0.6)', // Dark brown/orange bg
    borderWidth: 1,
    borderColor: '#7C2D12',
    borderRadius: sizeScale(8),
    padding: sizeScale(12),
    marginBottom: sizeScale(16),
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sizeScale(4),
    gap: sizeScale(8),
  },
  warningTitle: {
    color: '#EA580C', // Orange text
    fontSize: sizeScale(14),
    fontWeight: '600',
  },
  warningSubtext: {
    color: '#9CA3AF',
    fontSize: sizeScale(13),
    marginLeft: sizeScale(24), 
  },

  // Get More Button
  getMoreBtn: { 
    width: '100%',
    height: sizeScale(44), 
    backgroundColor: '#EA580C', // Solid Orange
    borderRadius: sizeScale(8), 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  getMoreText: { 
    color: '#FFFFFF', 
    fontSize: sizeScale(15), 
    fontWeight: '600',
  },

  // --- List Styles ---
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
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000000',
  },
  
  // Empty State
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

  // Modal
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