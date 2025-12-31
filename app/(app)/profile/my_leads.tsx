// app/(app)/profile/my_leads.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Eye, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { leadsAPI, ConsumedLeadResponse, Lead, UpdateConsumedLeadStatusData } from '../../../services/leads';

// --- Responsive Sizing ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const getResponsiveSize = (size: number) => {
  const baseWidth = 390;
  const scale = SCREEN_WIDTH / baseWidth;
  return Math.round(size * scale);
};

// --- Placeholder Image ---
const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/1a1a1a/666?text=IMG';

// --- Gradient Icons ---
const GradientMapPin = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="mapPinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="50%" stopColor="#003E9C" stopOpacity="1" />
        <Stop offset="50%" stopColor="#01BE8B" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke="url(#mapPinGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="10"
      r="3"
      stroke="url(#mapPinGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const GradientClock = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="clockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="50%" stopColor="#003E9C" stopOpacity="1" />
        <Stop offset="50%" stopColor="#01BE8B" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Circle
      cx="12"
      cy="12"
      r="10"
      stroke="url(#clockGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 6v6l4 2"
      stroke="url(#clockGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    year: past.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  };
  return past.toLocaleDateString('en-US', options);
};

// --- Requirement Card (Posted Leads) ---
const RequirementCard = ({ data, onToggleActive }: { data: Lead; onToggleActive: (id: string, val: boolean) => void }) => {
    return (
        <View style={styles.cardOuter}>
            {/* Title Section with Visible White Border */}
            <View style={styles.titleSection}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.mainTitle} numberOfLines={2}>{data.title}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaGroup}>
                            <GradientMapPin size={14} />
                            <Text style={styles.metaLabel} numberOfLines={1}>{data.location || 'Location not set'}</Text>
                        </View>
                        <View style={styles.metaGroup}>
                            <GradientClock size={14} />
                            <Text style={styles.metaLabel} numberOfLines={1}>{formatTimeAgo(data.createdAt)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Details Body */}
            <View style={styles.detailBody}>
                <Image source={{ uri: data.imageUrl || PLACEHOLDER_IMG }} style={styles.leadThumb} />
                <View style={styles.statsContainer}>
                    <View style={styles.statCol}>
                        <Text style={styles.sLabel} numberOfLines={1}>Quantity</Text>
                        <Text style={styles.sValue} numberOfLines={1}>{data.quantity || 'N/A'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statCol}>
                        <Text style={styles.sLabel} numberOfLines={1}>Budget</Text>
                        <Text style={styles.sValue} numberOfLines={1}>{data.budget || 'N/A'}</Text>
                    </View>
                </View>
            </View>

            {/* Footer with Visible Top Border */}
            <View style={styles.footerBar}>
                <View style={styles.utilIcons}>
                    <View style={styles.statIconItem}>
                        <Eye size={16} color="#8FA8CC" />
                        <Text style={styles.footerStatText}>{data.viewCount || 0}</Text>
                    </View>
                    <View style={styles.statIconItem}>
                        <CheckCircle size={16} color="#8FA8CC" />
                        <Text style={styles.footerStatText}>{data.consumedCount || 0}</Text>
                    </View>
                </View>
                
                {data.isActive ? (
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.deactivateBtn]}
                        onPress={() => onToggleActive(data.id, data.isActive)}
                    >
                        <Text style={styles.actionBtnText}>Deactivate</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.reactivateBtn]}
                        onPress={() => onToggleActive(data.id, data.isActive)}
                    >
                        <Text style={styles.actionBtnText}>Reactivate</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// --- Consumed Card (My Leads) ---
const ConsumedCard = ({ data, onUpdateStatus }: { data: ConsumedLeadResponse; onUpdateStatus: (id: string, status: string | null) => void }) => {
    const handleReportPress = () => {
        Linking.openURL('https://bizzap.app/report').catch(err => console.error(err));
    };
    
    return (
        <View style={styles.cardOuter}>
            {/* Title Section with Visible White Border */}
            <View style={styles.titleSection}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.mainTitle} numberOfLines={2}>{data.lead.title || 'Lead Title Unavailable'}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaGroup}>
                            <GradientMapPin size={14} />
                            <Text style={styles.metaLabel} numberOfLines={1}>{data.lead.location || 'Location not set'}</Text>
                        </View>
                        <View style={styles.metaGroup}>
                            <GradientClock size={14} />
                            <Text style={styles.metaLabel} numberOfLines={1}>Consumed {formatTimeAgo(data.consumedAt)}</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity onPress={handleReportPress} style={styles.reportIcon}>
                    <AlertCircle size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.detailBody}>
                <Image source={{ uri: data.lead.imageUrl || PLACEHOLDER_IMG }} style={styles.leadThumb} />
                <View style={styles.statsContainer}>
                    <View style={styles.statCol}>
                        <Text style={styles.sLabel}>Quantity</Text>
                        <Text style={styles.sValue}>{data.lead.quantity || 'N/A'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statCol}>
                        <Text style={styles.sLabel}>Budget</Text>
                        <Text style={styles.sValue}>{data.lead.budget || 'N/A'}</Text>
                    </View>
                </View>
            </View>

            {/* Footer with Visible Top Border & Neutral Buttons */}
            <View style={[styles.footerBar, styles.dealFooter]}>
                <Text style={styles.dealLabel}>Deal Closed?</Text>
                
                <View style={styles.dealButtons}>
                    {/* YES BUTTON */}
                    <TouchableOpacity 
                        style={[
                            styles.dealBtn,
                            data.dealStatus === 'COMPLETED' ? styles.dealBtnActive : styles.dealBtnInactive
                        ]}
                        onPress={() => onUpdateStatus(data.id, data.dealStatus)}
                    >
                        <ThumbsUp size={14} color={data.dealStatus === 'COMPLETED' ? '#FFF' : '#9CA3AF'} />
                        <Text style={[
                            styles.dealBtnText, 
                            data.dealStatus === 'COMPLETED' && { color: '#FFF' }
                        ]}>Yes</Text>
                    </TouchableOpacity>

                    {/* NO BUTTON */}
                    <TouchableOpacity 
                        style={[
                            styles.dealBtn,
                            data.dealStatus === 'CANCELLED' ? styles.dealBtnActive : styles.dealBtnInactive
                        ]}
                        onPress={() => onUpdateStatus(data.id, data.dealStatus)}
                    >
                        <ThumbsDown size={14} color={data.dealStatus === 'CANCELLED' ? '#FFF' : '#9CA3AF'} />
                        <Text style={[
                            styles.dealBtnText, 
                            data.dealStatus === 'CANCELLED' && { color: '#FFF' }
                        ]}>No</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// --- Deal Status Modal ---
const DealStatusModal = ({ visible, currentStatus, onClose, onConfirm, loading }: any) => {
    const [selectedStatus, setSelectedStatus] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED'>(currentStatus || 'PENDING');
    const [notes, setNotes] = useState('');
    const [dealValue, setDealValue] = useState('');

    useEffect(() => {
        if (visible) { setSelectedStatus(currentStatus || 'PENDING'); setNotes(''); setDealValue(''); }
    }, [visible, currentStatus]);

    const handleConfirm = () => {
        if (selectedStatus === 'COMPLETED' && !dealValue.trim()) return Alert.alert('Required', 'Please enter deal value');
        onConfirm(selectedStatus, notes, dealValue);
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.dealModalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Update Deal Status</Text>
                        <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color="#fff" /></TouchableOpacity>
                    </View>
                    <Text style={styles.sectionLabel}>Deal Status</Text>
                    <View style={styles.statusOptions}>
                        <TouchableOpacity style={[styles.statusOption, selectedStatus === 'PENDING' && styles.statusOptionActive]} onPress={() => setSelectedStatus('PENDING')}>
                            <Feather name="clock" size={20} color={selectedStatus === 'PENDING' ? '#F59E0B' : '#666'} />
                            <Text style={[styles.statusOptionText, selectedStatus === 'PENDING' && styles.statusOptionTextActive]}>Pending</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.statusOption, selectedStatus === 'COMPLETED' && styles.statusOptionActive]} onPress={() => setSelectedStatus('COMPLETED')}>
                            <Feather name="check-circle" size={20} color={selectedStatus === 'COMPLETED' ? '#10B981' : '#666'} />
                            <Text style={[styles.statusOptionText, selectedStatus === 'COMPLETED' && styles.statusOptionTextActive]}>Completed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.statusOption, selectedStatus === 'CANCELLED' && styles.statusOptionActive]} onPress={() => setSelectedStatus('CANCELLED')}>
                            <Feather name="x-circle" size={20} color={selectedStatus === 'CANCELLED' ? '#EF4444' : '#666'} />
                            <Text style={[styles.statusOptionText, selectedStatus === 'CANCELLED' && styles.statusOptionTextActive]}>Cancelled</Text>
                        </TouchableOpacity>
                    </View>
                    {selectedStatus === 'COMPLETED' && (
                        <>
                            <Text style={styles.sectionLabel}>Deal Value (₹) *</Text>
                            <TextInput style={styles.modalInput} placeholder="Enter value" placeholderTextColor="#666" value={dealValue} onChangeText={setDealValue} keyboardType="numeric" />
                        </>
                    )}
                    <Text style={styles.sectionLabel}>Notes (Optional)</Text>
                    <TextInput style={[styles.modalInput, styles.modalTextArea]} placeholder="Notes..." placeholderTextColor="#666" value={notes} onChangeText={setNotes} multiline />
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={onClose}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleConfirm} disabled={loading}>
                            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmBtnText}>Update</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// --- Main Screen ---
export default function MyLeadsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'requirements' | 'leads'>('requirements');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [myRequirements, setMyRequirements] = useState<Lead[]>([]);
    const [myConsumedLeads, setMyConsumedLeads] = useState<ConsumedLeadResponse[]>([]);
    
    const [dealStatusModalVisible, setDealStatusModalVisible] = useState(false);
    const [selectedConsumedLeadId, setSelectedConsumedLeadId] = useState<string | null>(null);
    const [currentDealStatus, setCurrentDealStatus] = useState<string | null>(null);
    const [updatingDealStatus, setUpdatingDealStatus] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, leadsRes] = await Promise.all([leadsAPI.getMyLeads(), leadsAPI.getConsumedLeads()]);
            setMyRequirements(reqRes.data || []);
            setMyConsumedLeads(leadsRes.data || []);
        } catch (error: any) { Alert.alert('Error', error.message); } 
        finally { setLoading(false); setRefreshing(false); }
    };

    const handleToggleRequirement = async (id: string, isActive: boolean) => {
        try {
            await leadsAPI.toggleLeadStatus(id, !isActive);
            setMyRequirements(prev => prev.map(item => item.id === id ? { ...item, isActive: !isActive } : item));
        } catch (error: any) { Alert.alert("Error", error.message); }
    };

    const handleUpdateDealStatus = (id: string, status: string | null) => {
        setSelectedConsumedLeadId(id); setCurrentDealStatus(status); setDealStatusModalVisible(true);
    };

    const confirmDealStatusUpdate = async (status: any, notes: string, value: string) => {
        if (!selectedConsumedLeadId) return;
        setUpdatingDealStatus(true);
        try {
            const updateData: UpdateConsumedLeadStatusData = { dealStatus: status, dealNotes: notes, dealValue: value ? parseFloat(value) : undefined };
            const response = await leadsAPI.updateConsumedLeadStatus(selectedConsumedLeadId, updateData);
            setMyConsumedLeads(prev => prev.map(item => item.id === selectedConsumedLeadId ? response.data : item));
            setDealStatusModalVisible(false);
            Alert.alert("Success", "Updated!");
        } catch (error: any) { Alert.alert("Error", error.message); } 
        finally { setUpdatingDealStatus(false); }
    };

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><ArrowLeft size={24} color="#fff" /></TouchableOpacity>
                <Text style={styles.headerTitle}>My Leads & Requirements</Text>
                <View style={{ width: 40 }} />
            </View>
            <View style={styles.tabContainer}>
                <View style={styles.tabWrapper}>
                    <TouchableOpacity style={[styles.tabButton, activeTab === 'requirements' && styles.activeTab]} onPress={() => setActiveTab('requirements')}>
                        <Text style={[styles.tabText, activeTab === 'requirements' && styles.activeTabText]}>My Requirements ({myRequirements.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tabButton, activeTab === 'leads' && styles.activeTab]} onPress={() => setActiveTab('leads')}>
                        <Text style={[styles.tabText, activeTab === 'leads' && styles.activeTabText]}>My Leads ({myConsumedLeads.length})</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0095f6" />} contentContainerStyle={{ paddingBottom: 40 }}>
                {loading ? <ActivityIndicator size="large" color="#0095f6" style={{ marginTop: 40 }} /> : (
                    activeTab === 'requirements' ? 
                    (myRequirements.length ? myRequirements.map(item => <RequirementCard key={item.id} data={item} onToggleActive={handleToggleRequirement} />) : <Text style={styles.emptyText}>No requirements posted.</Text>) : 
                    (myConsumedLeads.length ? myConsumedLeads.map(item => <ConsumedCard key={item.id} data={item} onUpdateStatus={handleUpdateDealStatus} />) : <Text style={styles.emptyText}>No leads consumed.</Text>)
                )}
            </ScrollView>
            <DealStatusModal visible={dealStatusModalVisible} currentStatus={currentDealStatus} onClose={() => setDealStatusModalVisible(false)} onConfirm={confirmDealStatusUpdate} loading={updatingDealStatus} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 50, backgroundColor: '#0E1114' },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
    tabContainer: { backgroundColor: '#0E1114', paddingVertical: 10, paddingHorizontal: 16 },
    tabWrapper: { flexDirection: 'row', backgroundColor: '#000', borderRadius: 8, padding: 2, borderWidth: 1, borderColor: '#1F2937' },
    tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    activeTab: { backgroundColor: '#111827' },
    tabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    activeTabText: { color: '#fff', fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 14 },

    // --- CARD STYLES ---
    cardOuter: {
        backgroundColor: '#121924',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignSelf: 'center',
        width: '100%',
        maxWidth: 400,
    },
    titleSection: {
        width: '100%',
        borderRadius: 4,
        padding: 8,
        backgroundColor: 'rgba(0, 87, 217, 0.04)',
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)', // VISIBLE WHITE LINE
    },
    mainTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 8, lineHeight: 22 },
    metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    metaGroup: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
    metaLabel: { color: '#8FA8CC', fontSize: 12, fontWeight: '700' },
    
    detailBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    leadThumb: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#595959', backgroundColor: '#1E293B' },
    statsContainer: { flex: 1, flexDirection: 'row', marginLeft: 12, justifyContent: 'space-around', alignItems: 'center' },
    statCol: { flex: 1, alignItems: 'center', gap: 3 },
    divider: { width: 1, height: 38, backgroundColor: '#595959' },
    sLabel: { color: '#8FA8CC', fontSize: 12, fontWeight: '700' },
    sValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

    // Footer Styling
    footerBar: {
        height: 40,
        backgroundColor: 'rgba(0, 87, 217, 0.17)',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderTopWidth: 1,
        borderTopColor: '#374151', // VISIBLE SEPARATOR
        marginTop: 4,
    },
    utilIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statIconItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerStatText: { fontSize: 12, color: '#8FA8CC', fontWeight: '600' },
    
    actionBtn: { borderRadius: 4, justifyContent: 'center', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, minWidth: 90 },
    deactivateBtn: { backgroundColor: '#DC2626' },
    reactivateBtn: { backgroundColor: '#10B981' },
    actionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    reportIcon: { padding: 4 },

    // Deal Status Specifics
    dealFooter: { 
        backgroundColor: 'transparent', 
        paddingHorizontal: 0, 
        marginTop: -10,
        borderTopWidth: 1,
        borderTopColor: '#374151',
        paddingTop: 12,
    },
    dealLabel: { fontSize: 13, fontWeight: '600', color: '#8FA8CC' },
    dealButtons: { flexDirection: 'row', gap: 8 },
    dealBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4, 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 6, 
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    dealBtnInactive: { borderColor: '#374151' },
    dealBtnActive: { borderColor: '#0057D9', backgroundColor: 'rgba(0, 87, 217, 0.2)' },
    
    dealBtnText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: { backgroundColor: '#1a1a1a', width: '100%', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#333' },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    modalSubtitle: { color: '#9CA3AF', fontSize: 14, marginBottom: 16 },
    modalInput: { backgroundColor: '#000', color: '#fff', borderRadius: 8, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#333', fontSize: 14 },
    modalTextArea: { height: 80, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, minWidth: 100, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#333' },
    confirmBtn: { backgroundColor: '#0095f6' },
    cancelBtnText: { color: '#ccc', fontWeight: '600', fontSize: 14 },
    confirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    dealModalContent: { backgroundColor: '#1a1a1a', width: '100%', maxWidth: 500, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#333' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionLabel: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 8 },
    statusOptions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statusOption: { flex: 1, alignItems: 'center', gap: 6, padding: 12, backgroundColor: '#000', borderRadius: 8, borderWidth: 2, borderColor: '#333' },
    statusOptionActive: { borderColor: '#0095f6', backgroundColor: '#0a1929' },
    statusOptionText: { color: '#666', fontSize: 12, fontWeight: '600' },
    statusOptionTextActive: { color: '#fff' },
});