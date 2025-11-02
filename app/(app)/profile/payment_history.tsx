
// ============================================
// FILE 3: app/(app)/profile/payment_history.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { apiCall } from '../../../services/apiClient';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Interfaces ---
interface SubscriptionHistory {
    id: string;
    companyId: string;
    tier: 'FREEMIUM' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    razorpaySubscriptionId: string | null;
    razorpayPaymentId: string | null;
    razorpayOrderId: string | null;
    startDate: string;
    endDate: string | null;
    permanentLeadQuota: number;
    subscriptionLeadQuota: number;
    leadQuota: number;
    consumedLeads: number;
    postingQuota: number;
    postedLeads: number;
    hasVerifiedBadge: boolean;
    hasVerifiedLeadAccess: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse {
    statusCode: number;
    status: string;
    message: string;
    data: SubscriptionHistory[];
    errors: any;
}

// --- Tier Config ---
const TIER_CONFIG = {
    FREEMIUM: {
        name: 'Free Plan',
        color: '#6b7280',
        icon: 'gift',
    },
    STARTER: {
        name: 'Starter',
        color: '#3b82f6',
        icon: 'zap',
    },
    PROFESSIONAL: {
        name: 'Professional',
        color: '#8b5cf6',
        icon: 'trending-up',
    },
    ENTERPRISE: {
        name: 'Enterprise',
        color: '#f59e0b',
        icon: 'award',
    },
};

const STATUS_CONFIG = {
    ACTIVE: {
        label: 'Active',
        color: '#10b981',
        bgColor: '#064e3b',
    },
    EXPIRED: {
        label: 'Expired',
        color: '#6b7280',
        bgColor: '#1f2937',
    },
    CANCELLED: {
        label: 'Cancelled',
        color: '#ef4444',
        bgColor: '#7f1d1d',
    },
};

// --- Transaction Card Component ---
interface TransactionCardProps {
    subscription: SubscriptionHistory;
    isLatest: boolean;
}

function TransactionCard({ subscription, isLatest }: TransactionCardProps) {
    const tierConfig = TIER_CONFIG[subscription.tier];
    const statusConfig = STATUS_CONFIG[subscription.status];
    
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <View style={[styles.transactionCard, isLatest && styles.latestCard]}>
            {isLatest && (
                <View style={styles.latestBadge}>
                    <Text style={styles.latestBadgeText}>Current Plan</Text>
                </View>
            )}

            {/* Card Header */}
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: tierConfig.color + '20' }]}>
                    <Feather name={tierConfig.icon as any} size={sizeScale(24)} color={tierConfig.color} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.tierName}>{tierConfig.name}</Text>
                    <Text style={styles.transactionId}>
                        ID: {subscription.id.slice(0, 8)}...
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                    </Text>
                </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Plan Details */}
            <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <Feather name="calendar" size={sizeScale(16)} color="#666" />
                        <View style={styles.detailText}>
                            <Text style={styles.detailLabel}>Start Date</Text>
                            <Text style={styles.detailValue}>{formatDate(subscription.startDate)}</Text>
                        </View>
                    </View>
                    {subscription.endDate && (
                        <View style={styles.detailItem}>
                            <Feather name="clock" size={sizeScale(16)} color="#666" />
                            <View style={styles.detailText}>
                                <Text style={styles.detailLabel}>Valid Until</Text>
                                <Text style={styles.detailValue}>{formatDate(subscription.endDate)}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Quota Information */}
            <View style={styles.quotaSection}>
                <Text style={styles.quotaSectionTitle}>Plan Benefits</Text>
                
                <View style={styles.quotaGrid}>
                    <View style={styles.quotaCard}>
                        <Feather name="file-text" size={sizeScale(18)} color="#0095f6" />
                        <Text style={styles.quotaValue}>{subscription.leadQuota}</Text>
                        <Text style={styles.quotaLabel}>Lead Quota</Text>
                        <Text style={styles.quotaSubtext}>
                            {subscription.consumedLeads} used
                        </Text>
                    </View>

                    <View style={styles.quotaCard}>
                        <Feather name="edit-3" size={sizeScale(18)} color="#8b5cf6" />
                        <Text style={styles.quotaValue}>{subscription.postingQuota}</Text>
                        <Text style={styles.quotaLabel}>Posting Limit</Text>
                        <Text style={styles.quotaSubtext}>
                            {subscription.postedLeads} posted
                        </Text>
                    </View>
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                    {subscription.hasVerifiedBadge && (
                        <View style={styles.featureItem}>
                            <Feather name="check-circle" size={sizeScale(14)} color="#10b981" />
                            <Text style={styles.featureText}>Verified Badge</Text>
                        </View>
                    )}
                    {subscription.hasVerifiedLeadAccess && (
                        <View style={styles.featureItem}>
                            <Feather name="shield" size={sizeScale(14)} color="#10b981" />
                            <Text style={styles.featureText}>Verified Lead Access</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Payment Details */}
            {subscription.razorpayPaymentId && (
                <View style={styles.paymentSection}>
                    <Text style={styles.paymentLabel}>Payment ID</Text>
                    <Text style={styles.paymentValue}>{subscription.razorpayPaymentId}</Text>
                    {subscription.razorpayOrderId && (
                        <>
                            <Text style={[styles.paymentLabel, { marginTop: sizeScale(8) }]}>Order ID</Text>
                            <Text style={styles.paymentValue}>{subscription.razorpayOrderId}</Text>
                        </>
                    )}
                </View>
            )}
        </View>
    );
}

// --- Main Payment History Screen ---
export default function PaymentHistoryScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [subscriptions, setSubscriptions] = useState<SubscriptionHistory[]>([]);

    useEffect(() => {
        loadPaymentHistory();
    }, []);

    const loadPaymentHistory = async () => {
        try {
            setLoading(true);
            const response = await apiCall<ApiResponse>(
                'companies/subscription/history',
                'GET',
                null,
                true
            );
            setSubscriptions(response.data);
        } catch (error: any) {
            console.error('Failed to load payment history:', error);
            Alert.alert('Error', error.message || 'Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPaymentHistory();
        setRefreshing(false);
    };

    const activeSubscription = subscriptions.find(s => s.status === 'ACTIVE');

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0095f6" />
                <Text style={styles.loadingText}>Loading payment history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={sizeScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment History</Text>
                <View style={styles.headerButton} />
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
                {/* Summary Card */}
                {activeSubscription && (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Feather name="activity" size={sizeScale(24)} color="#0095f6" />
                            <Text style={styles.summaryTitle}>Current Plan</Text>
                        </View>
                        
                        <View style={styles.summaryContent}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Active Plan</Text>
                                <Text style={styles.summaryValue}>
                                    {TIER_CONFIG[activeSubscription.tier].name}
                                </Text>
                            </View>
                            
                            <View style={styles.summaryDivider} />
                            
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Remaining Leads</Text>
                                <Text style={styles.summaryValue}>
                                    {activeSubscription.leadQuota - activeSubscription.consumedLeads}
                                </Text>
                            </View>
                        </View>

                        {activeSubscription.endDate && (
                            <View style={styles.expiryWarning}>
                                <Feather name="alert-circle" size={sizeScale(14)} color="#f59e0b" />
                                <Text style={styles.expiryText}>
                                    Expires on {new Date(activeSubscription.endDate).toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Transaction History */}
                <View style={styles.historySection}>
                    <View style={styles.historySectionHeader}>
                        <Text style={styles.historySectionTitle}>Transaction History</Text>
                        <Text style={styles.transactionCount}>
                            {subscriptions.length} {subscriptions.length === 1 ? 'transaction' : 'transactions'}
                        </Text>
                    </View>

                    {subscriptions.length > 0 ? (
                        subscriptions.map((subscription, index) => (
                            <TransactionCard
                                key={subscription.id}
                                subscription={subscription}
                                isLatest={index === 0 && subscription.status === 'ACTIVE'}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Feather name="credit-card" size={sizeScale(64)} color="#333" />
                            <Text style={styles.emptyTitle}>No transactions yet</Text>
                            <Text style={styles.emptyText}>
                                Your payment history will appear here
                            </Text>
                        </View>
                    )}
                </View>

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
        paddingTop: sizeScale(50),
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: sizeScale(16),
        paddingBottom: sizeScale(120),
    },
    summaryCard: {
        backgroundColor: '#0a0a0a',
        borderRadius: sizeScale(16),
        padding: sizeScale(20),
        marginBottom: sizeScale(24),
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: sizeScale(20),
        gap: sizeScale(12),
    },
    summaryTitle: {
        fontSize: sizeScale(18),
        fontWeight: '600',
        color: '#fff',
    },
    summaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: sizeScale(13),
        color: '#666',
        marginBottom: sizeScale(6),
    },
    summaryValue: {
        fontSize: sizeScale(24),
        fontWeight: 'bold',
        color: '#fff',
    },
    summaryDivider: {
        width: 1,
        backgroundColor: '#1a1a1a',
    },
    expiryWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(8),
        marginTop: sizeScale(16),
        padding: sizeScale(12),
        backgroundColor: '#1a1100',
        borderRadius: sizeScale(8),
        borderWidth: 1,
        borderColor: '#332200',
    },
    expiryText: {
        fontSize: sizeScale(13),
        color: '#f59e0b',
        flex: 1,
    },
    historySection: {
        marginTop: sizeScale(8),
    },
    historySectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: sizeScale(16),
    },
    historySectionTitle: {
        fontSize: sizeScale(16),
        fontWeight: '600',
        color: '#fff',
    },
    transactionCount: {
        fontSize: sizeScale(13),
        color: '#666',
    },
    transactionCard: {
        backgroundColor: '#0a0a0a',
        borderRadius: sizeScale(16),
        padding: sizeScale(20),
        marginBottom: sizeScale(16),
        borderWidth: 1,
        borderColor: '#1a1a1a',
        position: 'relative',
    },
    latestCard: {
        borderColor: '#0095f6',
        borderWidth: 2,
    },
    latestBadge: {
        position: 'absolute',
        top: sizeScale(-8),
        left: sizeScale(20),
        backgroundColor: '#0095f6',
        paddingHorizontal: sizeScale(12),
        paddingVertical: sizeScale(4),
        borderRadius: sizeScale(12),
    },
    latestBadgeText: {
        fontSize: sizeScale(11),
        fontWeight: '600',
        color: '#fff',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: sizeScale(16),
    },
    iconContainer: {
        width: sizeScale(48),
        height: sizeScale(48),
        borderRadius: sizeScale(24),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: sizeScale(12),
    },
    headerInfo: {
        flex: 1,
    },
    tierName: {
        fontSize: sizeScale(16),
        fontWeight: '600',
        color: '#fff',
        marginBottom: sizeScale(2),
    },
    transactionId: {
        fontSize: sizeScale(12),
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: sizeScale(12),
        paddingVertical: sizeScale(6),
        borderRadius: sizeScale(12),
    },
    statusText: {
        fontSize: sizeScale(12),
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#1a1a1a',
        marginBottom: sizeScale(16),
    },
    detailsSection: {
        marginBottom: sizeScale(16),
    },
    detailRow: {
        flexDirection: 'row',
        gap: sizeScale(16),
    },
    detailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(8),
    },
    detailText: {
        flex: 1,
    },
    detailLabel: {
        fontSize: sizeScale(11),
        color: '#666',
        marginBottom: sizeScale(2),
    },
    detailValue: {
        fontSize: sizeScale(13),
        fontWeight: '500',
        color: '#fff',
    },
    quotaSection: {
        marginTop: sizeScale(16),
        padding: sizeScale(16),
        backgroundColor: '#0d0d0d',
        borderRadius: sizeScale(12),
    },
    quotaSectionTitle: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
        marginBottom: sizeScale(12),
    },
    quotaGrid: {
        flexDirection: 'row',
        gap: sizeScale(12),
        marginBottom: sizeScale(16),
    },
    quotaCard: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        padding: sizeScale(16),
        borderRadius: sizeScale(12),
        alignItems: 'center',
    },
    quotaValue: {
        fontSize: sizeScale(24),
        fontWeight: 'bold',
        color: '#fff',
        marginTop: sizeScale(8),
        marginBottom: sizeScale(4),
    },
    quotaLabel: {
        fontSize: sizeScale(12),
        color: '#999',
        marginBottom: sizeScale(4),
    },
    quotaSubtext: {
        fontSize: sizeScale(11),
        color: '#666',
    },
    featuresSection: {
        gap: sizeScale(8),
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(8),
    },
    featureText: {
        fontSize: sizeScale(13),
        color: '#999',
    },
    paymentSection: {
        marginTop: sizeScale(16),
        padding: sizeScale(16),
        backgroundColor: '#0d0d0d',
        borderRadius: sizeScale(12),
    },
    paymentLabel: {
        fontSize: sizeScale(11),
        color: '#666',
        marginBottom: sizeScale(4),
    },
    paymentValue: {
        fontSize: sizeScale(13),
        fontFamily: 'monospace',
        color: '#0095f6',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: sizeScale(60),
    },
    emptyTitle: {
        fontSize: sizeScale(18),
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