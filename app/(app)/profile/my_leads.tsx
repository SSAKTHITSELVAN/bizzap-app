
// // app/(app)/profile/my_leads.tsx

// import React, { useState, useEffect } from 'react';
// import {
//     View,
//     Text,
//     ScrollView,
//     TouchableOpacity,
//     StyleSheet,
//     Dimensions,
//     Image,
//     ActivityIndicator,
//     RefreshControl,
//     Alert,
//     Switch,
//     Modal,
//     TextInput
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
// import { apiCall } from '../../../services/apiClient'; // Assuming you have a generic API client
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Config } from '../../../constants/config'; // Your config path

// // --- Responsive Sizing Utility ---
// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const STANDARD_WIDTH = 390;
// const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// // --- Placeholder Image ---
// const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/1a1a1a/666?text=IMG';

// // --- Interfaces based on your API ---
// interface Company {
//     id: string;
//     companyName: string;
//     logo?: string;
//     phoneNumber?: string;
// }

// interface LeadData {
//     id: string;
//     title: string;
//     description: string;
//     imageUrl?: string;
//     budget?: string;
//     quantity?: string;
//     location?: string;
//     isActive: boolean;
//     viewCount: number;
//     consumedCount?: number; // Only for posted leads
//     createdAt: string;
//     company?: Company;
// }

// interface ConsumedLeadResponse {
//     id: string;
//     lead: LeadData;
//     consumedAt: string;
// }

// // --- Card Component for "My Requirements" (Posted Leads) ---
// interface RequirementCardProps {
//     data: LeadData;
//     onToggleActive: (id: string, currentValue: boolean) => void;
// }

// const RequirementCard = ({ data, onToggleActive }: RequirementCardProps) => {
//     const dateStr = new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
//     return (
//         <View style={styles.cardContainer}>
//             {/* Header Row */}
//             <View style={styles.cardHeader}>
//                 <View style={styles.headerTextContainer}>
//                     <Text style={styles.cardTitle} numberOfLines={1}>{data.title}</Text>
//                     <View style={styles.locationRow}>
//                         <Feather name="map-pin" size={12} color="#0095f6" />
//                         <Text style={styles.locationText}>{data.location || 'Unknown'}</Text>
//                         <Feather name="clock" size={12} color="#0095f6" style={{marginLeft: 8}} />
//                         <Text style={styles.locationText}>{dateStr}</Text>
//                     </View>
//                 </View>
//                 <Switch
//                     trackColor={{ false: "#767577", true: "#10b981" }}
//                     thumbColor={"#f4f3f4"}
//                     ios_backgroundColor="#3e3e3e"
//                     onValueChange={() => onToggleActive(data.id, data.isActive)}
//                     value={data.isActive}
//                     style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
//                 />
//             </View>

//             <View style={styles.divider} />

//             {/* Middle Section: Image + Stats */}
//             <View style={styles.cardBody}>
//                 <Image 
//                     source={{ uri: data.imageUrl || PLACEHOLDER_IMG }} 
//                     style={styles.circleImage} 
//                 />
                
//                 <View style={styles.statsRow}>
//                     <View style={styles.statColumn}>
//                         <Text style={styles.statLabel}>Quantity</Text>
//                         <Text style={styles.statValue}>{data.quantity || 'N/A'}</Text>
//                     </View>
//                     <View style={styles.statVerticalLine} />
//                     <View style={styles.statColumn}>
//                         <Text style={styles.statLabel}>Budget</Text>
//                         <Text style={styles.statValue}>{data.budget || 'N/A'}</Text>
//                     </View>
//                     <View style={styles.statVerticalLine} />
//                     {/* Assuming Material might come from description or static for now as API lacks it */}
//                     <View style={styles.statColumn}>
//                         <Text style={styles.statLabel}>Material</Text>
//                         <Text style={styles.statValue}>-</Text> 
//                     </View>
//                 </View>
//             </View>

//             {/* Footer: Views & Checks */}
//             <View style={styles.cardFooter}>
//                 <View style={styles.footerStat}>
//                     <Feather name="eye" size={14} color="#6B7280" />
//                     <Text style={styles.footerStatText}>{data.viewCount || 0}</Text>
//                 </View>
//                 <View style={styles.footerStat}>
//                     <Feather name="check-circle" size={14} color="#6B7280" />
//                     <Text style={styles.footerStatText}>{data.consumedCount || 0}</Text>
//                 </View>
//             </View>
//         </View>
//     );
// };

// // --- Card Component for "My Leads" (Consumed Leads) ---
// interface ConsumedCardProps {
//     data: LeadData;
// }

// const ConsumedCard = ({ data }: ConsumedCardProps) => {
//     const dateStr = new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//     return (
//         <View style={styles.cardContainer}>
//             {/* Header Row */}
//             <View style={styles.cardHeader}>
//                 <View style={styles.headerTextContainer}>
//                     <Text style={styles.cardTitle} numberOfLines={1}>{data.title}</Text>
//                     <View style={styles.locationRow}>
//                         <Feather name="map-pin" size={12} color="#0095f6" />
//                         <Text style={styles.locationText}>{data.location || 'Unknown'}</Text>
//                         <Feather name="clock" size={12} color="#0095f6" style={{marginLeft: 8}} />
//                         <Text style={styles.locationText}>{dateStr}</Text>
//                     </View>
//                 </View>
//                 {/* Info Icon instead of switch */}
//                 <TouchableOpacity>
//                     <Feather name="alert-circle" size={20} color="#4B5563" />
//                 </TouchableOpacity>
//             </View>

//             <View style={styles.divider} />

//             {/* Middle Section */}
//             <View style={styles.cardBody}>
//                 <Image 
//                     source={{ uri: data.imageUrl || PLACEHOLDER_IMG }} 
//                     style={styles.circleImage} 
//                 />
                
//                 <View style={styles.statsRow}>
//                     <View style={styles.statColumn}>
//                         <Text style={styles.statLabel}>Quantity</Text>
//                         <Text style={styles.statValue}>{data.quantity || 'N/A'}</Text>
//                     </View>
//                     <View style={styles.statVerticalLine} />
//                     <View style={styles.statColumn}>
//                         <Text style={styles.statLabel}>Budget</Text>
//                         <Text style={styles.statValue}>{data.budget || 'N/A'}</Text>
//                     </View>
//                     <View style={styles.statVerticalLine} />
//                     <View style={styles.statColumn}>
//                         <Text style={styles.statLabel}>Material</Text>
//                         <Text style={styles.statValue}>-</Text>
//                     </View>
//                 </View>
//             </View>

//             {/* Deal Closed Action Bar */}
//             <View style={styles.dealClosedBar}>
//                 <Text style={styles.dealClosedText}>Deal Closed?</Text>
//                 <View style={styles.thumbsContainer}>
//                     <TouchableOpacity style={styles.thumbButton}>
//                         <Feather name="thumbs-up" size={18} color="#10B981" />
//                     </TouchableOpacity>
//                     <TouchableOpacity style={styles.thumbButton}>
//                         <Feather name="thumbs-down" size={18} color="#EF4444" />
//                     </TouchableOpacity>
//                 </View>
//             </View>
//         </View>
//     );
// };

// // --- Main Screen ---
// export default function MyLeadsScreen() {
//     const router = useRouter();
//     const [activeTab, setActiveTab] = useState<'requirements' | 'leads'>('requirements');
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
    
//     // Data
//     const [myRequirements, setMyRequirements] = useState<LeadData[]>([]);
//     const [myConsumedLeads, setMyConsumedLeads] = useState<ConsumedLeadResponse[]>([]);

//     // Deactivation Modal State
//     const [modalVisible, setModalVisible] = useState(false);
//     const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
//     const [deactivationReason, setDeactivationReason] = useState('');
//     const [deactivating, setDeactivating] = useState(false);

//     useEffect(() => {
//         fetchData();
//     }, []);

//     const fetchData = async () => {
//         setLoading(true);
//         try {
//             const token = await AsyncStorage.getItem('authToken');
//             const headers = { Authorization: `Bearer ${token}` };

//             // 1. Fetch My Requirements (Posted Leads)
//             const reqRes = await axios.get(`${Config.API_BASE_URL}/leads/my-leads`, { headers });
//             setMyRequirements(reqRes.data.data);

//             // 2. Fetch My Leads (Consumed Leads)
//             const leadsRes = await axios.get(`${Config.API_BASE_URL}/companies/consumed-leads`, { headers });
//             setMyConsumedLeads(leadsRes.data.data);

//         } catch (error) {
//             console.error("Error fetching data:", error);
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//         }
//     };

//     const handleToggleRequirement = (id: string, isActive: boolean) => {
//         if (isActive) {
//             // Turning OFF -> Show Modal
//             setSelectedLeadId(id);
//             setModalVisible(true);
//         } else {
//             // Turning ON -> Direct API call (if your API supports re-activating)
//             Alert.alert("Info", "Re-activating leads is not currently supported in this demo.");
//         }
//     };

//     const confirmDeactivation = async () => {
//         if (!selectedLeadId || !deactivationReason.trim()) return;
        
//         setDeactivating(true);
//         try {
//             const token = await AsyncStorage.getItem('authToken');
//             // Assuming PATCH endpoint for deactivation based on typical patterns
//             // Adjust URL if your specific deactivation endpoint is different
//             await axios.patch(
//                 `${Config.API_BASE_URL}/leads/${selectedLeadId}/deactivate`, 
//                 { reasonForDeactivation: deactivationReason },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
            
//             // Update local state
//             setMyRequirements(prev => prev.map(item => 
//                 item.id === selectedLeadId ? { ...item, isActive: false } : item
//             ));
            
//             setModalVisible(false);
//             setDeactivationReason('');
//             setSelectedLeadId(null);
//             Alert.alert("Success", "Requirement deactivated.");

//         } catch (error) {
//             console.error("Deactivation failed:", error);
//             Alert.alert("Error", "Failed to deactivate.");
//         } finally {
//             setDeactivating(false);
//         }
//     };

//     const onRefresh = () => {
//         setRefreshing(true);
//         fetchData();
//     };

//     return (
//         <View style={styles.container}>
//             {/* Header */}
//             <View style={styles.header}>
//                 <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//                     <Feather name="arrow-left" size={24} color="#fff" />
//                 </TouchableOpacity>
//                 <Text style={styles.headerTitle}>My leads /Requirements</Text>
//                 <TouchableOpacity style={styles.searchButton}>
//                     <Feather name="search" size={24} color="#fff" />
//                 </TouchableOpacity>
//             </View>

//             {/* Custom Segmented Control */}
//             <View style={styles.tabContainer}>
//                 <View style={styles.tabWrapper}>
//                     <TouchableOpacity 
//                         style={[styles.tabButton, activeTab === 'requirements' && styles.activeTab]}
//                         onPress={() => setActiveTab('requirements')}
//                     >
//                         <Text style={[styles.tabText, activeTab === 'requirements' && styles.activeTabText]}>
//                             My Requirements ({myRequirements.length})
//                         </Text>
//                     </TouchableOpacity>
                    
//                     <TouchableOpacity 
//                         style={[styles.tabButton, activeTab === 'leads' && styles.activeTab]}
//                         onPress={() => setActiveTab('leads')}
//                     >
//                         <Text style={[styles.tabText, activeTab === 'leads' && styles.activeTabText]}>
//                             My Leads ({myConsumedLeads.length})
//                         </Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>

//             <ScrollView 
//                 style={styles.content}
//                 refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0095f6" />}
//                 contentContainerStyle={{ paddingBottom: 40 }}
//             >
//                 {loading ? (
//                     <ActivityIndicator size="large" color="#0095f6" style={{ marginTop: 40 }} />
//                 ) : (
//                     <>
//                         {activeTab === 'requirements' ? (
//                             myRequirements.length > 0 ? (
//                                 myRequirements.map(item => (
//                                     <RequirementCard 
//                                         key={item.id} 
//                                         data={item} 
//                                         onToggleActive={handleToggleRequirement}
//                                     />
//                                 ))
//                             ) : (
//                                 <Text style={styles.emptyText}>No requirements posted yet.</Text>
//                             )
//                         ) : (
//                             myConsumedLeads.length > 0 ? (
//                                 myConsumedLeads.map(item => (
//                                     <ConsumedCard key={item.id} data={item.lead} />
//                                 ))
//                             ) : (
//                                 <Text style={styles.emptyText}>No leads consumed yet.</Text>
//                             )
//                         )}
//                     </>
//                 )}
//             </ScrollView>

//             {/* Deactivation Modal */}
//             <Modal
//                 transparent={true}
//                 visible={modalVisible}
//                 animationType="fade"
//                 onRequestClose={() => setModalVisible(false)}
//             >
//                 <View style={styles.modalOverlay}>
//                     <View style={styles.modalContent}>
//                         <Text style={styles.modalTitle}>Deactivate Requirement</Text>
//                         <Text style={styles.modalSubtitle}>Please tell us why you are closing this requirement:</Text>
                        
//                         <TextInput 
//                             style={styles.modalInput}
//                             placeholder="Reason (e.g. Fulfilled elsewhere)"
//                             placeholderTextColor="#666"
//                             value={deactivationReason}
//                             onChangeText={setDeactivationReason}
//                             multiline
//                         />
                        
//                         <View style={styles.modalActions}>
//                             <TouchableOpacity 
//                                 style={[styles.modalBtn, styles.cancelBtn]}
//                                 onPress={() => setModalVisible(false)}
//                             >
//                                 <Text style={styles.cancelBtnText}>Cancel</Text>
//                             </TouchableOpacity>
                            
//                             <TouchableOpacity 
//                                 style={[styles.modalBtn, styles.confirmBtn]}
//                                 onPress={confirmDeactivation}
//                                 disabled={deactivating}
//                             >
//                                 {deactivating ? (
//                                     <ActivityIndicator size="small" color="#fff" />
//                                 ) : (
//                                     <Text style={styles.confirmBtnText}>Deactivate</Text>
//                                 )}
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </View>
//             </Modal>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#000', // Deep black background
//     },
//     header: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: sizeScale(16),
//         paddingVertical: sizeScale(12),
//         paddingTop: sizeScale(50),
//         backgroundColor: '#0E1114', // Slightly lighter header
//     },
//     backButton: { padding: 4 },
//     searchButton: { padding: 4 },
//     headerTitle: {
//         fontSize: sizeScale(18),
//         fontWeight: '600',
//         color: '#fff',
//     },
    
//     // Tab Styles
//     tabContainer: {
//         backgroundColor: '#0E1114',
//         paddingVertical: sizeScale(10),
//         paddingHorizontal: sizeScale(16),
//     },
//     tabWrapper: {
//         flexDirection: 'row',
//         backgroundColor: '#000',
//         borderRadius: sizeScale(8),
//         padding: 2,
//         borderWidth: 1,
//         borderColor: '#1F2937',
//     },
//     tabButton: {
//         flex: 1,
//         paddingVertical: sizeScale(10),
//         alignItems: 'center',
//         borderRadius: sizeScale(6),
//     },
//     activeTab: {
//         backgroundColor: '#111827', // Selected tab bg
//     },
//     tabText: {
//         fontSize: sizeScale(13),
//         color: '#6B7280',
//         fontWeight: '500',
//     },
//     activeTabText: {
//         color: '#fff',
//         fontWeight: '600',
//     },

//     content: {
//         flex: 1,
//         padding: sizeScale(16),
//     },
//     emptyText: {
//         color: '#666',
//         textAlign: 'center',
//         marginTop: sizeScale(40),
//         fontSize: sizeScale(14),
//     },

//     // --- Card Styles ---
//     cardContainer: {
//         backgroundColor: '#0D1117', // Dark card bg
//         borderRadius: sizeScale(12),
//         borderWidth: 1,
//         borderColor: '#1F2937',
//         marginBottom: sizeScale(16),
//         overflow: 'hidden',
//     },
//     cardHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-start',
//         padding: sizeScale(16),
//         paddingBottom: sizeScale(12),
//     },
//     headerTextContainer: {
//         flex: 1,
//         paddingRight: sizeScale(10),
//     },
//     cardTitle: {
//         fontSize: sizeScale(15),
//         fontWeight: '600',
//         color: '#fff',
//         marginBottom: sizeScale(6),
//     },
//     locationRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     locationText: {
//         fontSize: sizeScale(12),
//         color: '#9CA3AF',
//         marginLeft: 4,
//     },
//     divider: {
//         height: 1,
//         backgroundColor: '#1F2937', // Separator line
//         marginHorizontal: sizeScale(16),
//     },
    
//     // Middle Section
//     cardBody: {
//         flexDirection: 'row',
//         padding: sizeScale(16),
//         alignItems: 'center',
//     },
//     circleImage: {
//         width: sizeScale(56),
//         height: sizeScale(56),
//         borderRadius: sizeScale(28),
//         backgroundColor: '#333',
//         marginRight: sizeScale(16),
//     },
//     statsRow: {
//         flex: 1,
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//     },
//     statColumn: {
//         alignItems: 'center',
//         flex: 1,
//     },
//     statLabel: {
//         fontSize: sizeScale(11),
//         color: '#9CA3AF',
//         marginBottom: 2,
//     },
//     statValue: {
//         fontSize: sizeScale(13),
//         color: '#fff',
//         fontWeight: '500',
//     },
//     statVerticalLine: {
//         width: 1,
//         height: '80%',
//         backgroundColor: '#374151',
//     },

//     // Footer (Requirement)
//     cardFooter: {
//         backgroundColor: '#0F1318',
//         flexDirection: 'row',
//         paddingVertical: sizeScale(10),
//         paddingHorizontal: sizeScale(16),
//         gap: sizeScale(20),
//         borderTopWidth: 1,
//         borderTopColor: '#1F2937',
//     },
//     footerStat: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//     },
//     footerStatText: {
//         color: '#9CA3AF',
//         fontSize: sizeScale(12),
//     },

//     // Deal Closed Bar (Consumed Lead)
//     dealClosedBar: {
//         backgroundColor: '#0F1318',
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingVertical: sizeScale(12),
//         paddingHorizontal: sizeScale(16),
//         borderTopWidth: 1,
//         borderTopColor: '#1F2937',
//     },
//     dealClosedText: {
//         color: '#fff',
//         fontSize: sizeScale(14),
//         fontWeight: '500',
//     },
//     thumbsContainer: {
//         flexDirection: 'row',
//         gap: sizeScale(16),
//     },
//     thumbButton: {
//         padding: 4,
//     },

//     // Modal
//     modalOverlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.8)',
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: sizeScale(24),
//     },
//     modalContent: {
//         backgroundColor: '#1a1a1a',
//         width: '100%',
//         borderRadius: sizeScale(12),
//         padding: sizeScale(20),
//         borderWidth: 1,
//         borderColor: '#333',
//     },
//     modalTitle: {
//         color: '#fff',
//         fontSize: sizeScale(18),
//         fontWeight: 'bold',
//         marginBottom: 8,
//     },
//     modalSubtitle: {
//         color: '#9CA3AF',
//         fontSize: sizeScale(14),
//         marginBottom: 16,
//     },
//     modalInput: {
//         backgroundColor: '#000',
//         color: '#fff',
//         borderRadius: 8,
//         padding: 12,
//         height: 80,
//         textAlignVertical: 'top',
//         marginBottom: 20,
//         borderWidth: 1,
//         borderColor: '#333',
//     },
//     modalActions: {
//         flexDirection: 'row',
//         justifyContent: 'flex-end',
//         gap: 12,
//     },
//     modalBtn: {
//         paddingVertical: 10,
//         paddingHorizontal: 16,
//         borderRadius: 6,
//     },
//     cancelBtn: {
//         backgroundColor: '#333',
//     },
//     confirmBtn: {
//         backgroundColor: '#0095f6',
//     },
//     cancelBtnText: { color: '#ccc', fontWeight: '600' },
//     confirmBtnText: { color: '#fff', fontWeight: '600' },
// });



// app/(app)/profile/my_leads.tsx - COMPLETE UPDATED VERSION

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
    Switch,
    Modal,
    TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { leadsAPI, subscriptionAPI, ConsumedLeadResponse, Lead, UpdateConsumedLeadStatusData } from '../../../services/leads';

// --- Responsive Sizing ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Placeholder Image ---
const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/1a1a1a/666?text=IMG';

// --- Requirement Card (Posted Leads) ---
interface RequirementCardProps {
    data: Lead;
    onToggleActive: (id: string, currentValue: boolean) => void;
}

const RequirementCard = ({ data, onToggleActive }: RequirementCardProps) => {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const timeStr = formatTime(data.createdAt);
    const dateStr = formatDate(data.createdAt);
    
    return (
        <View style={styles.newCardContainer}>
            {/* Header with Title and Toggle */}
            <View style={styles.newCardHeader}>
                <Text style={styles.newCardTitle} numberOfLines={2}>{data.title}</Text>
                <Switch
                    trackColor={{ false: "#374151", true: "#10b981" }}
                    thumbColor={data.isActive ? "#fff" : "#9CA3AF"}
                    ios_backgroundColor="#374151"
                    onValueChange={() => onToggleActive(data.id, data.isActive)}
                    value={data.isActive}
                    style={{ transform: [{ scaleX: .85 }, { scaleY: .85 }] }}
                />
            </View>

            {/* Location and Time Row */}
            <View style={styles.newMetaRow}>
                <View style={styles.newMetaItem}>
                    <Feather name="map-pin" size={12} color="#0095f6" />
                    <Text style={styles.newMetaText}>{data.location || 'Location'}</Text>
                </View>
                <View style={styles.newMetaItem}>
                    <Feather name="clock" size={12} color="#0095f6" />
                    <Text style={styles.newMetaText}>{timeStr} {dateStr}</Text>
                </View>
            </View>

            {/* Image and Stats Row */}
            <View style={styles.newContentRow}>
                <Image 
                    source={{ uri: data.imageUrl || PLACEHOLDER_IMG }} 
                    style={styles.newLeadImage} 
                />
                
                <View style={styles.newStatsContainer}>
                    <View style={styles.newStatBox}>
                        <Text style={styles.newStatLabel}>Quantity</Text>
                        <Text style={styles.newStatValue}>{data.quantity || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.newStatBox}>
                        <Text style={styles.newStatLabel}>Budget</Text>
                        <Text style={styles.newStatValue}>{data.budget || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.newStatBox}>
                        <Text style={styles.newStatLabel}>Material</Text>
                        <Text style={styles.newStatValue}>100% cotton</Text>
                    </View>
                </View>
            </View>

            {/* Footer Stats */}
            <View style={styles.newFooter}>
                <View style={styles.newFooterStat}>
                    <Feather name="eye" size={16} color="#6B7280" />
                    <Text style={styles.newFooterStatText}>{data.viewCount || 0}</Text>
                </View>
                <View style={styles.newFooterStat}>
                    <Feather name="check-circle" size={16} color="#6B7280" />
                    <Text style={styles.newFooterStatText}>{data.consumedCount || 0}</Text>
                </View>
            </View>
        </View>
    );
};

// --- Consumed Card (My Leads) ---
interface ConsumedCardProps {
    data: ConsumedLeadResponse;
    onUpdateStatus: (consumedLeadId: string, currentStatus: string | null) => void;
}

const ConsumedCard = ({ data, onUpdateStatus }: ConsumedCardProps) => {
    const dateStr = new Date(data.lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Get status badge style
    const getStatusStyle = () => {
        switch (data.dealStatus) {
            case 'COMPLETED':
                return { color: '#10B981', icon: 'check-circle' };
            case 'CANCELLED':
                return { color: '#EF4444', icon: 'x-circle' };
            case 'PENDING':
            default:
                return { color: '#F59E0B', icon: 'clock' };
        }
    };

    const statusStyle = getStatusStyle();

    return (
        <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{data.lead.title}</Text>
                    <View style={styles.locationRow}>
                        <Feather name="map-pin" size={12} color="#0095f6" />
                        <Text style={styles.locationText}>{data.lead.location || 'Unknown'}</Text>
                        <Feather name="clock" size={12} color="#0095f6" style={{marginLeft: 8}} />
                        <Text style={styles.locationText}>{dateStr}</Text>
                    </View>
                </View>
                <View style={styles.statusBadge}>
                    <Feather name={statusStyle.icon as any} size={14} color={statusStyle.color} />
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>
                        {data.dealStatus || 'PENDING'}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBody}>
                <Image 
                    source={{ uri: data.lead.imageUrl || PLACEHOLDER_IMG }} 
                    style={styles.circleImage} 
                />
                
                <View style={styles.statsRow}>
                    <View style={styles.statColumn}>
                        <Text style={styles.statLabel}>Quantity</Text>
                        <Text style={styles.statValue}>{data.lead.quantity || 'N/A'}</Text>
                    </View>
                    <View style={styles.statVerticalLine} />
                    <View style={styles.statColumn}>
                        <Text style={styles.statLabel}>Budget</Text>
                        <Text style={styles.statValue}>{data.lead.budget || 'N/A'}</Text>
                    </View>
                    <View style={styles.statVerticalLine} />
                    <View style={styles.statColumn}>
                        <Text style={styles.statLabel}>Deal Value</Text>
                        <Text style={styles.statValue}>{data.dealValue ? `₹${data.dealValue}` : '-'}</Text>
                    </View>
                </View>
            </View>

            {/* Deal Status Action Bar */}
            <TouchableOpacity 
                style={styles.dealClosedBar}
                onPress={() => onUpdateStatus(data.id, data.dealStatus)}
                activeOpacity={0.7}
            >
                <Text style={styles.dealClosedText}>
                    {data.dealStatus === 'COMPLETED' ? 'Update Deal Status' : 'Update Deal Status'}
                </Text>
                <Feather name="edit-3" size={18} color="#0095f6" />
            </TouchableOpacity>
        </View>
    );
};

// --- Deal Status Modal ---
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

                    {/* Status Selection */}
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

                    {/* Deal Value (Required for Completed) */}
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

                    {/* Notes */}
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

                    {/* Actions */}
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

// --- Main Screen ---
export default function MyLeadsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'requirements' | 'leads'>('requirements');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Data
    const [myRequirements, setMyRequirements] = useState<Lead[]>([]);
    const [myConsumedLeads, setMyConsumedLeads] = useState<ConsumedLeadResponse[]>([]);

    // Deactivation Modal State
    const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [deactivationReason, setDeactivationReason] = useState('');
    const [deactivating, setDeactivating] = useState(false);

    // Deal Status Modal State
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
            setMyRequirements(reqRes.data);

            // Fetch My Consumed Leads
            const leadsRes = await subscriptionAPI.getConsumedLeads();
            setMyConsumedLeads(leadsRes.data);

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
            // Turning OFF -> Show deactivation modal
            setSelectedLeadId(id);
            setDeactivateModalVisible(true);
        } else {
            // Turning ON -> Direct API call
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

            // Update local state
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Leads & Requirements</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Custom Segmented Control */}
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

            {/* Deal Status Modal */}
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
        paddingHorizontal: sizeScale(16),
        paddingVertical: sizeScale(12),
        paddingTop: sizeScale(50),
        backgroundColor: '#0E1114',
    },
    backButton: { padding: 4 },
    headerTitle: {
        fontSize: sizeScale(18),
        fontWeight: '600',
        color: '#fff',
    },
    
    // Tab Styles
    tabContainer: {
        backgroundColor: '#0E1114',
        paddingVertical: sizeScale(10),
        paddingHorizontal: sizeScale(16),
    },
    tabWrapper: {
        flexDirection: 'row',
        backgroundColor: '#000',
        borderRadius: sizeScale(8),
        padding: 2,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    tabButton: {
        flex: 1,
        paddingVertical: sizeScale(10),
        alignItems: 'center',
        borderRadius: sizeScale(6),
    },
    activeTab: {
        backgroundColor: '#111827',
    },
    tabText: {
        fontSize: sizeScale(13),
        color: '#6B7280',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '600',
    },

    content: {
        flex: 1,
        padding: sizeScale(16),
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: sizeScale(40),
        fontSize: sizeScale(14),
    },

    // NEW CARD STYLES - Matching Design
    newCardContainer: {
        backgroundColor: '#0F1621',
        borderRadius: sizeScale(16),
        padding: sizeScale(16),
        marginBottom: sizeScale(16),
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    newCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: sizeScale(12),
    },
    newCardTitle: {
        flex: 1,
        fontSize: sizeScale(16),
        fontWeight: '600',
        color: '#fff',
        lineHeight: sizeScale(22),
        paddingRight: sizeScale(12),
    },
    newMetaRow: {
        flexDirection: 'row',
        gap: sizeScale(16),
        marginBottom: sizeScale(16),
    },
    newMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(6),
    },
    newMetaText: {
        fontSize: sizeScale(12),
        color: '#9CA3AF',
    },
    newContentRow: {
        flexDirection: 'row',
        gap: sizeScale(16),
        marginBottom: sizeScale(16),
    },
    newLeadImage: {
        width: sizeScale(80),
        height: sizeScale(80),
        borderRadius: sizeScale(12),
        backgroundColor: '#1F2937',
    },
    newStatsContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: sizeScale(8),
    },
    newStatBox: {
        flex: 1,
        backgroundColor: '#1a2332',
        borderRadius: sizeScale(10),
        padding: sizeScale(10),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2a3442',
    },
    newStatLabel: {
        fontSize: sizeScale(10),
        color: '#6B7280',
        marginBottom: sizeScale(4),
        textAlign: 'center',
    },
    newStatValue: {
        fontSize: sizeScale(13),
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    newFooter: {
        flexDirection: 'row',
        gap: sizeScale(20),
        paddingTop: sizeScale(12),
        borderTopWidth: 1,
        borderTopColor: '#1F2937',
    },
    newFooterStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(6),
    },
    newFooterStatText: {
        fontSize: sizeScale(14),
        color: '#9CA3AF',
        fontWeight: '500',
    },

    // OLD CARD STYLES (Keep for Consumed Leads)
    cardContainer: {
        backgroundColor: '#0D1117',
        borderRadius: sizeScale(12),
        borderWidth: 1,
        borderColor: '#1F2937',
        marginBottom: sizeScale(16),
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: sizeScale(16),
        paddingBottom: sizeScale(12),
    },
    headerTextContainer: {
        flex: 1,
        paddingRight: sizeScale(10),
    },
    cardTitle: {
        fontSize: sizeScale(15),
        fontWeight: '600',
        color: '#fff',
        marginBottom: sizeScale(6),
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: sizeScale(12),
        color: '#9CA3AF',
        marginLeft: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#1F2937',
    },
    statusText: {
        fontSize: sizeScale(11),
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#1F2937',
        marginHorizontal: sizeScale(16),
    },
    
    // Middle Section
    cardBody: {
        flexDirection: 'row',
        padding: sizeScale(16),
        alignItems: 'center',
    },
    circleImage: {
        width: sizeScale(56),
        height: sizeScale(56),
        borderRadius: sizeScale(28),
        backgroundColor: '#333',
        marginRight: sizeScale(16),
    },
    statsRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statColumn: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: sizeScale(11),
        color: '#9CA3AF',
        marginBottom: 2,
    },
    statValue: {
        fontSize: sizeScale(13),
        color: '#fff',
        fontWeight: '500',
    },
    statVerticalLine: {
        width: 1,
        height: '80%',
        backgroundColor: '#374151',
    },

    // Footer
    cardFooter: {
        backgroundColor: '#0F1318',
        flexDirection: 'row',
        paddingVertical: sizeScale(10),
        paddingHorizontal: sizeScale(16),
        gap: sizeScale(20),
        borderTopWidth: 1,
        borderTopColor: '#1F2937',
    },
    footerStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerStatText: {
        color: '#9CA3AF',
        fontSize: sizeScale(12),
    },

    // Deal Closed Bar
    dealClosedBar: {
        backgroundColor: '#0F1318',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: sizeScale(12),
        paddingHorizontal: sizeScale(16),
        borderTopWidth: 1,
        borderTopColor: '#1F2937',
    },
    dealClosedText: {
        color: '#fff',
        fontSize: sizeScale(14),
        fontWeight: '500',
    },

    // Deactivation Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: sizeScale(24),
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        width: '100%',
        borderRadius: sizeScale(12),
        padding: sizeScale(20),
        borderWidth: 1,
        borderColor: '#333',
    },
    modalTitle: {
        color: '#fff',
        fontSize: sizeScale(18),
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalSubtitle: {
        color: '#9CA3AF',
        fontSize: sizeScale(14),
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
        paddingHorizontal: 16,
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
        fontWeight: '600' 
    },
    confirmBtnText: { 
        color: '#fff', 
        fontWeight: '600' 
    },

    // Deal Status Modal
    dealModalContent: {
        backgroundColor: '#1a1a1a',
        width: '100%',
        maxWidth: 500,
        borderRadius: sizeScale(12),
        padding: sizeScale(20),
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
        fontSize: sizeScale(14),
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
        fontSize: sizeScale(12),
        fontWeight: '600',
    },
    statusOptionTextActive: {
        color: '#fff',
    },
});