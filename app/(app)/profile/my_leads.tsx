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
    TextInput,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { leadsAPI, Lead } from '../../../services/leads';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Placeholder Image ---
const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/f3f4f6/6b7280?text=No+Image';

// --- Lead Card Component ---
interface LeadCardProps {
    lead: Lead;
    onDeactivate: (leadId: string, reason: string) => void;
    onDelete: (leadId: string) => void;
}

function LeadCard({ lead, onDeactivate, onDelete }: LeadCardProps) {
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivateReason, setDeactivateReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const formatNumber = (num: string | null) => {
        if (!num) return 'N/A';
        const n = parseInt(num);
        if (isNaN(n)) return num;
        if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return num;
    };

    const handleDeactivate = async () => {
        if (!deactivateReason.trim()) {
            Alert.alert('Error', 'Please provide a reason for deactivation');
            return;
        }

        setIsProcessing(true);
        try {
            await onDeactivate(lead.id, deactivateReason.trim());
            setShowDeactivateModal(false);
            setDeactivateReason('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to deactivate lead');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Lead',
            'Are you sure you want to delete this lead? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(lead.id)
                }
            ]
        );
    };

    const imageUrl = lead.image || lead.imageUrl || PLACEHOLDER_IMG;

    return (
        <View style={styles.leadCard}>
            {/* Lead Image */}
            {lead.image && (
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.leadImage}
                    resizeMode="cover"
                    defaultSource={{ uri: PLACEHOLDER_IMG }}
                />
            )}

            {/* Status Badge */}
            <View style={[styles.statusBadge, lead.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={styles.statusText}>
                    {lead.isActive ? 'Active' : 'Inactive'}
                </Text>
            </View>

            {/* Lead Content */}
            <View style={styles.leadContent}>
                <Text style={styles.leadTitle} numberOfLines={2}>
                    {lead.title}
                </Text>
                <Text style={styles.leadDescription} numberOfLines={3}>
                    {lead.description}
                </Text>

                {/* Lead Info */}
                <View style={styles.infoContainer}>
                    {lead.budget && (
                        <View style={styles.infoRow}>
                            <Feather name="dollar-sign" size={sizeScale(14)} color="#0095f6" />
                            <Text style={styles.infoText}>{lead.budget}</Text>
                        </View>
                    )}
                    {lead.quantity && (
                        <View style={styles.infoRow}>
                            <Feather name="package" size={sizeScale(14)} color="#0095f6" />
                            <Text style={styles.infoText}>{formatNumber(lead.quantity)}</Text>
                        </View>
                    )}
                    {lead.location && (
                        <View style={styles.infoRow}>
                            <Feather name="map-pin" size={sizeScale(14)} color="#0095f6" />
                            <Text style={styles.infoText}>{lead.location}</Text>
                        </View>
                    )}
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>
                        Views: {lead.viewCount || 0}
                    </Text>
                    <Text style={styles.statsText}>•</Text>
                    <Text style={styles.statsText}>
                        Consumed: {lead.consumedCount || 0}
                    </Text>
                    <Text style={styles.statsText}>•</Text>
                    <Text style={styles.statsText}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                {/* Deactivation Reason */}
                {!lead.isActive && lead.reasonForDeactivation && (
                    <View style={styles.reasonContainer}>
                        <Text style={styles.reasonLabel}>Reason:</Text>
                        <Text style={styles.reasonText}>{lead.reasonForDeactivation}</Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {lead.isActive && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deactivateButton]}
                            onPress={() => setShowDeactivateModal(true)}
                        >
                            <Feather name="pause-circle" size={sizeScale(16)} color="#fff" />
                            <Text style={styles.actionButtonText}>Deactivate</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDelete}
                    >
                        <Feather name="trash-2" size={sizeScale(16)} color="#fff" />
                        <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Deactivate Modal */}
            <Modal
                visible={showDeactivateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeactivateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Deactivate Lead</Text>
                        <Text style={styles.modalDescription}>
                            Please provide a reason for deactivating this lead:
                        </Text>
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g., Lead fulfilled, No longer needed"
                            placeholderTextColor="#666"
                            value={deactivateReason}
                            onChangeText={setDeactivateReason}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={() => {
                                    setShowDeactivateModal(false);
                                    setDeactivateReason('');
                                }}
                                disabled={isProcessing}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalConfirmButton]}
                                onPress={handleDeactivate}
                                disabled={isProcessing || !deactivateReason.trim()}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalConfirmText}>Deactivate</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// --- Main My Leads Screen ---
export default function MyLeadsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeLeads, setActiveLeads] = useState<Lead[]>([]);
    const [inactiveLeads, setInactiveLeads] = useState<Lead[]>([]);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const [activeRes, inactiveRes] = await Promise.all([
                leadsAPI.getMyActiveLeads(),
                leadsAPI.getMyInactiveLeads(),
            ]);

            setActiveLeads(activeRes.data);
            setInactiveLeads(inactiveRes.data);
        } catch (error: any) {
            console.error('Failed to load leads:', error);
            Alert.alert('Error', error.message || 'Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLeads();
        setRefreshing(false);
    };

    const handleDeactivate = async (leadId: string, reason: string) => {
        try {
            await leadsAPI.deactivateLead(leadId, { reasonForDeactivation: reason });
            await loadLeads();
            Alert.alert('Success', 'Lead deactivated successfully');
        } catch (error: any) {
            throw error;
        }
    };

    const handleDelete = async (leadId: string) => {
        try {
            await leadsAPI.deleteLead(leadId);
            await loadLeads();
            Alert.alert('Success', 'Lead deleted successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete lead');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0095f6" />
                <Text style={styles.loadingText}>Loading your leads...</Text>
            </View>
        );
    }

    const currentLeads = activeTab === 'active' ? activeLeads : inactiveLeads;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.push('/(app)/profile')}
                >
                    <Feather name="arrow-left" size={sizeScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Leads</Text>
                <View style={styles.headerButton} />
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                        Active ({activeLeads.length})
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'inactive' && styles.activeTab]}
                    onPress={() => setActiveTab('inactive')}
                >
                    <Text style={[styles.tabText, activeTab === 'inactive' && styles.activeTabText]}>
                        Inactive ({inactiveLeads.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#0095f6"
                        colors={['#0095f6']}
                    />
                }
            >
                {currentLeads.length > 0 ? (
                    currentLeads.map((lead) => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            onDeactivate={handleDeactivate}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Feather name="file-text" size={sizeScale(64)} color="#333" />
                        <Text style={styles.emptyTitle}>
                            No {activeTab} leads
                        </Text>
                        <Text style={styles.emptyText}>
                            {activeTab === 'active' 
                                ? 'Create your first lead to get started'
                                : 'Deactivated leads will appear here'
                            }
                        </Text>
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: sizeScale(16),
        fontSize: sizeScale(16),
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: sizeScale(16),
        paddingVertical: sizeScale(12),
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        padding: sizeScale(8),
    },
    headerTitle: {
        fontSize: sizeScale(18),
        fontWeight: '600',
        color: '#fff',
    },
    headerButton: {
        width: sizeScale(40),
    },
    
    // Tab Styles
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    tab: {
        flex: 1,
        paddingVertical: sizeScale(12),
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#0095f6',
    },
    tabText: {
        fontSize: sizeScale(14),
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#0095f6',
        fontWeight: '600',
    },
    
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: sizeScale(16),
        paddingBottom: sizeScale(120),
    },
    
    // Lead Card Styles
    leadCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: sizeScale(12),
        marginBottom: sizeScale(16),
        overflow: 'hidden',
        position: 'relative',
    },
    leadImage: {
        width: '100%',
        height: sizeScale(200),
        backgroundColor: '#333',
    },
    statusBadge: {
        position: 'absolute',
        top: sizeScale(12),
        right: sizeScale(12),
        paddingHorizontal: sizeScale(12),
        paddingVertical: sizeScale(6),
        borderRadius: sizeScale(16),
        zIndex: 1,
    },
    activeBadge: {
        backgroundColor: '#10b981',
    },
    inactiveBadge: {
        backgroundColor: '#6b7280',
    },
    statusText: {
        fontSize: sizeScale(12),
        fontWeight: '600',
        color: '#fff',
    },
    leadContent: {
        padding: sizeScale(16),
    },
    leadTitle: {
        fontSize: sizeScale(18),
        fontWeight: '600',
        color: '#fff',
        marginBottom: sizeScale(8),
    },
    leadDescription: {
        fontSize: sizeScale(14),
        color: '#999',
        lineHeight: sizeScale(20),
        marginBottom: sizeScale(12),
    },
    infoContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: sizeScale(12),
        marginBottom: sizeScale(12),
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(4),
    },
    infoText: {
        fontSize: sizeScale(13),
        color: '#999',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(8),
        marginBottom: sizeScale(12),
    },
    statsText: {
        fontSize: sizeScale(12),
        color: '#666',
    },
    reasonContainer: {
        backgroundColor: '#2a2a2a',
        padding: sizeScale(12),
        borderRadius: sizeScale(8),
        marginBottom: sizeScale(12),
    },
    reasonLabel: {
        fontSize: sizeScale(12),
        fontWeight: '600',
        color: '#999',
        marginBottom: sizeScale(4),
    },
    reasonText: {
        fontSize: sizeScale(14),
        color: '#fff',
        lineHeight: sizeScale(20),
    },
    actionButtons: {
        flexDirection: 'row',
        gap: sizeScale(12),
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: sizeScale(10),
        borderRadius: sizeScale(8),
        gap: sizeScale(6),
    },
    deactivateButton: {
        backgroundColor: '#f59e0b',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
    },
    actionButtonText: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: sizeScale(20),
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: sizeScale(12),
        padding: sizeScale(20),
        width: '100%',
        maxWidth: sizeScale(400),
    },
    modalTitle: {
        fontSize: sizeScale(20),
        fontWeight: '600',
        color: '#fff',
        marginBottom: sizeScale(8),
    },
    modalDescription: {
        fontSize: sizeScale(14),
        color: '#999',
        marginBottom: sizeScale(16),
        lineHeight: sizeScale(20),
    },
    modalInput: {
        backgroundColor: '#2a2a2a',
        borderRadius: sizeScale(8),
        padding: sizeScale(12),
        fontSize: sizeScale(14),
        color: '#fff',
        minHeight: sizeScale(80),
        marginBottom: sizeScale(16),
    },
    modalButtons: {
        flexDirection: 'row',
        gap: sizeScale(12),
    },
    modalButton: {
        flex: 1,
        paddingVertical: sizeScale(12),
        borderRadius: sizeScale(8),
        alignItems: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#2a2a2a',
    },
    modalConfirmButton: {
        backgroundColor: '#f59e0b',
    },
    modalCancelText: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
    },
    modalConfirmText: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
    },
    
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: sizeScale(100),
    },
    emptyTitle: {
        fontSize: sizeScale(20),
        fontWeight: 'bold',
        color: '#fff',
        marginTop: sizeScale(16),
    },
    emptyText: {
        fontSize: sizeScale(14),
        color: '#666',
        marginTop: sizeScale(8),
        textAlign: 'center',
    },
    
    bottomPadding: {
        height: sizeScale(20),
    },
});