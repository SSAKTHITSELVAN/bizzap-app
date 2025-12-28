// app/(app)/profile/my_leads.tsx - REAL-TIME API DATA

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
    Linking // Added for opening URL
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { leadsAPI, ConsumedLeadResponse, Lead, UpdateConsumedLeadStatusData } from '../../../services/leads';

// --- Responsive Sizing ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Placeholder Image ---
const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/1a1a1a/666?text=IMG';

// --- Rainbow Colors ---
const RAINBOW_COLORS = [
  '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#8B00FF'
];

// --- Requirement Card (Posted Leads) ---
interface RequirementCardProps {
    data: Lead;
    onToggleActive: (id: string, currentValue: boolean) => void;
}

const RequirementCard = ({ data, onToggleActive }: RequirementCardProps) => {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMins > 0) {
            return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    };
    
    return (
        <LinearGradient
            colors={RAINBOW_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rainbowCardContainer}
        >
            <View style={styles.innerCardContent}>
                {/* Title Bar */}
                <View style={styles.titleBar}>
                    <View style={styles.titleContent}>
                        <Text style={styles.title} numberOfLines={2}>{data.title}</Text>
                        <View style={styles.metaInfo}>
                            <View style={styles.metaItem}>
                                <Feather name="map-pin" size={14} color="#60A5FA" />
                                <Text style={styles.metaText}>{data.location || 'Location not set'}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Feather name="clock" size={14} color="#60A5FA" />
                                <Text style={styles.metaText}>{formatTime(data.createdAt)}</Text>
                            </View>
                        </View>
                    </View>
                    
                    {/* Aligned & Resized Action Button */}
                    <View style={styles.actionButtonContainer}>
                        {data.isActive ? (
                            <TouchableOpacity 
                                style={[styles.statusBtn, styles.deactivateBtn]}
                                onPress={() => onToggleActive(data.id, data.isActive)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.statusBtnText}>Deactivate</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.statusBtn, styles.reactivateBtn]}
                                onPress={() => onToggleActive(data.id, data.isActive)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.statusBtnText}>Reactivate</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                    <Image 
                        source={{ uri: data.imageUrl || PLACEHOLDER_IMG }} 
                        style={styles.productImage} 
                    />
                    
                    <View style={styles.statsSection}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Quantity</Text>
                            <Text style={styles.statValue}>{data.quantity || 'N/A'}</Text>
                        </View>
                        
                        <View style={styles.verticalDivider} />
                        
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Budget</Text>
                            <Text style={styles.statValue}>{data.budget || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer Stats */}
                <View style={styles.footerStats}>
                    <View style={styles.footerStatItem}>
                        <Feather name="eye" size={18} color="#FFF" />
                        <Text style={styles.footerStatText}>{data.viewCount || 0}</Text>
                    </View>
                    <View style={styles.footerStatItem}>
                        <Feather name="check-circle" size={18} color="#FFF" />
                        <Text style={styles.footerStatText}>{data.consumedCount || 0}</Text>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
};

// --- Consumed Card (My Leads) ---
interface ConsumedCardProps {
    data: ConsumedLeadResponse;
    onUpdateStatus: (consumedLeadId: string, currentStatus: string | null) => void;
}

const ConsumedCard = ({ data, onUpdateStatus }: ConsumedCardProps) => {
    
    // --- Navigation Handler for Report ---
    const handleReportPress = () => {
        Linking.openURL('https://bizzap.app/report').catch(err => 
            console.error("Couldn't load page", err)
        );
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMins > 0) {
            return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    };
    
    return (
        <LinearGradient
            colors={RAINBOW_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rainbowCardContainer}
        >
            <View style={styles.innerCardContent}>
                {/* Title Bar with Report Button */}
                <View style={styles.titleBar}>
                    <View style={styles.titleContent}>
                        <Text style={styles.title} numberOfLines={2}>{data.lead.title}</Text>
                        <View style={styles.metaInfo}>
                            <View style={styles.metaItem}>
                                <Feather name="map-pin" size={14} color="#60A5FA" />
                                <Text style={styles.metaText}>{data.lead.location || 'Location not set'}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Feather name="clock" size={14} color="#60A5FA" />
                                <Text style={styles.metaText}>{formatTime(data.consumedAt)}</Text>
                            </View>
                        </View>
                    </View>
                    
                    {/* Report Button Navigate to URL */}
                    <TouchableOpacity 
                        style={styles.reportBtn} 
                        onPress={handleReportPress}
                        activeOpacity={0.7}
                    >
                        <Feather name="alert-circle" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Content Section */}
                <View style={styles.contentSection}>
                    <Image 
                        source={{ uri: data.lead.imageUrl || PLACEHOLDER_IMG }} 
                        style={styles.productImage} 
                    />
                    
                    <View style={styles.statsSection}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Quantity</Text>
                            <Text style={styles.statValue}>{data.lead.quantity || 'N/A'}</Text>
                        </View>
                        
                        <View style={styles.verticalDivider} />
                        
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Budget</Text>
                            <Text style={styles.statValue}>{data.lead.budget || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Deal Status Bar */}
                <View style={styles.dealStatusBar}>
                    <Text style={styles.dealStatusLabel}>Deal Closed?</Text>
                    <View style={styles.dealStatusButtons}>
                        <TouchableOpacity 
                            style={[
                                styles.dealBtn,
                                styles.dealBtnClosed,
                                data.dealStatus === 'COMPLETED' && styles.dealBtnClosedActive
                            ]}
                            onPress={() => onUpdateStatus(data.id, data.dealStatus)}
                        >
                            <Feather 
                                name="thumbs-up" 
                                size={16} 
                                color={data.dealStatus === 'COMPLETED' ? '#10B981' : '#FFF'} 
                            />
                            <Text style={[
                                styles.dealBtnText,
                                data.dealStatus === 'COMPLETED' && styles.dealBtnTextClosed
                            ]}>
                                Closed
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[
                                styles.dealBtn,
                                styles.dealBtnNotYet,
                                data.dealStatus === 'CANCELLED' && styles.dealBtnNotYetActive
                            ]}
                            onPress={() => onUpdateStatus(data.id, data.dealStatus)}
                        >
                            <Feather 
                                name="thumbs-down" 
                                size={16} 
                                color={data.dealStatus === 'CANCELLED' ? '#EF4444' : '#FFF'} 
                            />
                            <Text style={[
                                styles.dealBtnText,
                                data.dealStatus === 'CANCELLED' && styles.dealBtnTextNotYet
                            ]}>
                                Not Yet
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
};

// --- Deal Status Modal (Unchanged Logic) ---
interface DealStatusModalProps {
    visible: boolean;
    currentStatus: string | null;
    onClose: () => void;
    onConfirm: (status: 'PENDING' | 'COMPLETED' | 'CANCELLED', notes: string, value: string) => void;
    loading: boolean;
}

const DealStatusModal = ({ visible, currentStatus, onClose, onConfirm, loading }: DealStatusModalProps) => {
    const [selectedStatus, setSelectedStatus] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED'>(
        (currentStatus as any) || 'PENDING'
    );
    const [notes, setNotes] = useState('');
    const [dealValue, setDealValue] = useState('');

    useEffect(() => {
        if (visible) {
            setSelectedStatus((currentStatus as any) || 'PENDING');
            setNotes('');
            setDealValue('');
        }
    }, [visible, currentStatus]);

    const handleConfirm = () => {
        if (selectedStatus === 'COMPLETED' && !dealValue.trim()) {
            Alert.alert('Required', 'Please enter the deal value for completed deals');
            return;
        }
        onConfirm(selectedStatus, notes, dealValue);
    };

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.dealModalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Update Deal Status</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionLabel}>Deal Status</Text>
                    <View style={styles.statusOptions}>
                        <TouchableOpacity
                            style={[
                                styles.statusOption,
                                selectedStatus === 'PENDING' && styles.statusOptionActive
                            ]}
                            onPress={() => setSelectedStatus('PENDING')}
                        >
                            <Feather 
                                name="clock" 
                                size={20} 
                                color={selectedStatus === 'PENDING' ? '#F59E0B' : '#666'} 
                            />
                            <Text style={[
                                styles.statusOptionText,
                                selectedStatus === 'PENDING' && styles.statusOptionTextActive
                            ]}>
                                Pending
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.statusOption,
                                selectedStatus === 'COMPLETED' && styles.statusOptionActive
                            ]}
                            onPress={() => setSelectedStatus('COMPLETED')}
                        >
                            <Feather 
                                name="check-circle" 
                                size={20} 
                                color={selectedStatus === 'COMPLETED' ? '#10B981' : '#666'} 
                            />
                            <Text style={[
                                styles.statusOptionText,
                                selectedStatus === 'COMPLETED' && styles.statusOptionTextActive
                            ]}>
                                Completed
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.statusOption,
                                selectedStatus === 'CANCELLED' && styles.statusOptionActive
                            ]}
                            onPress={() => setSelectedStatus('CANCELLED')}
                        >
                            <Feather 
                                name="x-circle" 
                                size={20} 
                                color={selectedStatus === 'CANCELLED' ? '#EF4444' : '#666'} 
                            />
                            <Text style={[
                                styles.statusOptionText,
                                selectedStatus === 'CANCELLED' && styles.statusOptionTextActive
                            ]}>
                                Cancelled
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {selectedStatus === 'COMPLETED' && (
                        <>
                            <Text style={styles.sectionLabel}>Deal Value (₹) *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter deal value"
                                placeholderTextColor="#666"
                                value={dealValue}
                                onChangeText={setDealValue}
                                keyboardType="numeric"
                            />
                        </>
                    )}

                    <Text style={styles.sectionLabel}>Notes (Optional)</Text>
                    <TextInput
                        style={[styles.modalInput, styles.modalTextArea]}
                        placeholder="Add any additional notes..."
                        placeholderTextColor="#666"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalBtn, styles.cancelBtn]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalBtn, styles.confirmBtn]}
                            onPress={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.confirmBtnText}>Update Status</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// --- Main Screen (Unchanged Logic) ---
export default function MyLeadsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'requirements' | 'leads'>('requirements');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [myRequirements, setMyRequirements] = useState<Lead[]>([]);
    const [myConsumedLeads, setMyConsumedLeads] = useState<ConsumedLeadResponse[]>([]);

    const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [deactivationReason, setDeactivationReason] = useState('');
    const [deactivating, setDeactivating] = useState(false);

    const [dealStatusModalVisible, setDealStatusModalVisible] = useState(false);
    const [selectedConsumedLeadId, setSelectedConsumedLeadId] = useState<string | null>(null);
    const [currentDealStatus, setCurrentDealStatus] = useState<string | null>(null);
    const [updatingDealStatus, setUpdatingDealStatus] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch My Requirements (Posted Leads)
            const reqRes = await leadsAPI.getMyLeads();
            setMyRequirements(reqRes.data || []);

            // Fetch My Consumed Leads
            const leadsRes = await leadsAPI.getConsumedLeads();
            setMyConsumedLeads(leadsRes.data || []);

        } catch (error: any) {
            console.error("Error fetching data:", error);
            Alert.alert('Error', error.message || 'Failed to load data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleToggleRequirement = async (id: string, isActive: boolean) => {
        if (isActive) {
            setSelectedLeadId(id);
            setDeactivateModalVisible(true);
        } else {
            try {
                await leadsAPI.toggleLeadStatus(id, true);
                setMyRequirements(prev => prev.map(item => 
                    item.id === id ? { ...item, isActive: true } : item
                ));
                Alert.alert("Success", "Requirement activated successfully.");
            } catch (error: any) {
                console.error("Activation failed:", error);
                Alert.alert("Error", error.message || "Failed to activate requirement.");
            }
        }
    };

    const confirmDeactivation = async () => {
        if (!selectedLeadId || !deactivationReason.trim()) {
            Alert.alert('Required', 'Please provide a reason for deactivation');
            return;
        }
        setDeactivating(true);
        try {
            await leadsAPI.deactivateLead(selectedLeadId, { 
                reasonForDeactivation: deactivationReason 
            });
            setMyRequirements(prev => prev.map(item => 
                item.id === selectedLeadId 
                    ? { ...item, isActive: false, reasonForDeactivation: deactivationReason } 
                    : item
            ));
            setDeactivateModalVisible(false);
            setDeactivationReason('');
            setSelectedLeadId(null);
            Alert.alert("Success", "Requirement deactivated successfully.");
        } catch (error: any) {
            console.error("Deactivation failed:", error);
            Alert.alert("Error", error.message || "Failed to deactivate requirement.");
        } finally {
            setDeactivating(false);
        }
    };

    const handleUpdateDealStatus = (consumedLeadId: string, currentStatus: string | null) => {
        setSelectedConsumedLeadId(consumedLeadId);
        setCurrentDealStatus(currentStatus);
        setDealStatusModalVisible(true);
    };

    const confirmDealStatusUpdate = async (
        status: 'PENDING' | 'COMPLETED' | 'CANCELLED',
        notes: string,
        value: string
    ) => {
        if (!selectedConsumedLeadId) return;

        setUpdatingDealStatus(true);
        try {
            const updateData: UpdateConsumedLeadStatusData = {
                dealStatus: status,
                dealNotes: notes || undefined,
                dealValue: value ? parseFloat(value) : undefined,
            };

            const response = await leadsAPI.updateConsumedLeadStatus(
                selectedConsumedLeadId, 
                updateData
            );

            setMyConsumedLeads(prev => prev.map(item => 
                item.id === selectedConsumedLeadId ? response.data : item
            ));

            setDealStatusModalVisible(false);
            setSelectedConsumedLeadId(null);
            setCurrentDealStatus(null);
            Alert.alert("Success", "Deal status updated successfully!");

        } catch (error: any) {
            console.error("Deal status update failed:", error);
            Alert.alert("Error", error.message || "Failed to update deal status.");
        } finally {
            setUpdatingDealStatus(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Leads & Requirements</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabContainer}>
                <View style={styles.tabWrapper}>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'requirements' && styles.activeTab]}
                        onPress={() => setActiveTab('requirements')}
                    >
                        <Text style={[styles.tabText, activeTab === 'requirements' && styles.activeTabText]}>
                            My Requirements ({myRequirements.length})
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'leads' && styles.activeTab]}
                        onPress={() => setActiveTab('leads')}
                    >
                        <Text style={[styles.tabText, activeTab === 'leads' && styles.activeTabText]}>
                            My Leads ({myConsumedLeads.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0095f6" />}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#0095f6" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {activeTab === 'requirements' ? (
                            myRequirements.length > 0 ? (
                                myRequirements.map(item => (
                                    <RequirementCard 
                                        key={item.id} 
                                        data={item} 
                                        onToggleActive={handleToggleRequirement}
                                    />
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No requirements posted yet.</Text>
                            )
                        ) : (
                            myConsumedLeads.length > 0 ? (
                                myConsumedLeads.map(item => (
                                    <ConsumedCard 
                                        key={item.id} 
                                        data={item}
                                        onUpdateStatus={handleUpdateDealStatus}
                                    />
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No leads consumed yet.</Text>
                            )
                        )}
                    </>
                )}
            </ScrollView>

            {/* Deactivation Modal */}
            <Modal
                transparent={true}
                visible={deactivateModalVisible}
                animationType="fade"
                onRequestClose={() => setDeactivateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Deactivate Requirement</Text>
                        <Text style={styles.modalSubtitle}>Please tell us why you are closing this requirement:</Text>
                        
                        <TextInput 
                            style={styles.modalInput}
                            placeholder="Reason (e.g. Fulfilled elsewhere)"
                            placeholderTextColor="#666"
                            value={deactivationReason}
                            onChangeText={setDeactivationReason}
                            multiline
                        />
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setDeactivateModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.confirmBtn]}
                                onPress={confirmDeactivation}
                                disabled={deactivating}
                            >
                                {deactivating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.confirmBtnText}>Deactivate</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <DealStatusModal
                visible={dealStatusModalVisible}
                currentStatus={currentDealStatus}
                onClose={() => setDealStatusModalVisible(false)}
                onConfirm={confirmDealStatusUpdate}
                loading={updatingDealStatus}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
        backgroundColor: '#0E1114',
    },
    backButton: { 
        padding: 4 
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    
    // Tabs
    tabContainer: {
        backgroundColor: '#0E1114',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    tabWrapper: {
        flexDirection: 'row',
        backgroundColor: '#000',
        borderRadius: 8,
        padding: 2,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#111827',
    },
    tabText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '600',
    },

    content: {
        flex: 1,
        padding: 16,
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },

    // --- CARD STYLES ---
    rainbowCardContainer: {
        borderRadius: 12,
        marginBottom: 16,
        padding: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    innerCardContent: {
        backgroundColor: '#000',
        borderRadius: 10.5,
        overflow: 'hidden',
    },

    // Title Bar Section
    titleBar: {
        backgroundColor: 'rgba(0, 87, 217, 0.08)',
        padding: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 87, 217, 0.15)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Allows multi-line title to not stretch button
    },
    titleContent: {
        flex: 1,
        paddingRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        lineHeight: 22,
    },
    metaInfo: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#60A5FA',
        fontWeight: '500',
    },

    // Action Button Container
    actionButtonContainer: {
        justifyContent: 'flex-start',
        paddingTop: 2, // Slight offset to align with first line of title if needed
    },
    
    // Updated Status Buttons
    statusBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deactivateBtn: {
        backgroundColor: '#DC2626',
    },
    reactivateBtn: {
        backgroundColor: '#10B981',
    },
    statusBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    
    reportBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Content Section
    contentSection: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
        alignItems: 'center',
    },
    productImage: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#1a1a1a',
        borderWidth: 2,
        borderColor: '#333',
    },
    statsSection: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    verticalDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#333',
    },
    statLabel: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    statValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Footer Stats (For Requirements)
    footerStats: {
        height: 48,
        backgroundColor: 'rgba(0, 87, 217, 0.12)',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 87, 217, 0.2)',
    },
    footerStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    footerStatText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Deal Status Bar (For Consumed Leads)
    dealStatusBar: {
        height: 56,
        backgroundColor: 'rgba(0, 87, 217, 0.12)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 87, 217, 0.2)',
    },
    dealStatusLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    dealStatusButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    dealBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 2,
    },
    dealBtnClosed: {
        borderColor: '#10B981',
        backgroundColor: 'transparent',
    },
    dealBtnClosedActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    dealBtnNotYet: {
        borderColor: '#EF4444',
        backgroundColor: 'transparent',
    },
    dealBtnNotYetActive: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    dealBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    dealBtnTextClosed: {
        color: '#10B981',
    },
    dealBtnTextNotYet: {
        color: '#EF4444',
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        width: '100%',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalSubtitle: {
        color: '#9CA3AF',
        fontSize: 14,
        marginBottom: 16,
    },
    modalInput: {
        backgroundColor: '#000',
        color: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 14,
    },
    modalTextArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#333',
    },
    confirmBtn: {
        backgroundColor: '#0095f6',
    },
    cancelBtnText: { 
        color: '#ccc', 
        fontWeight: '600',
        fontSize: 14,
    },
    confirmBtnText: { 
        color: '#fff', 
        fontWeight: '600',
        fontSize: 14,
    },

    // Deal Status Modal
    dealModalContent: {
        backgroundColor: '#1a1a1a',
        width: '100%',
        maxWidth: 500,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 8,
    },
    statusOptions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statusOption: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: 12,
        backgroundColor: '#000',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#333',
    },
    statusOptionActive: {
        borderColor: '#0095f6',
        backgroundColor: '#0a1929',
    },
    statusOptionText: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600',
    },
    statusOptionTextActive: {
        color: '#fff',
    },
});