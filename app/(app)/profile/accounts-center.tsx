// // // app/(app)/profile/accounts-center.tsx

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
//     Share,
//     Modal,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Feather } from '@expo/vector-icons';
// import { useAuth } from '../../../context/AuthContext';
// import { companyAPI, followersAPI, Company, Lead, ConsumedLead } from '../../../services/user';
// import { useFocusEffect } from '@react-navigation/native';

// // --- Responsive Sizing Utility ---
// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const STANDARD_WIDTH = 390;
// const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// // --- Placeholder Image ---
// const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/f3f4f6/6b7280?text=No+Image';

// // --- Unfollow Confirmation Modal Component ---
// interface UnfollowModalProps {
//     visible: boolean;
//     companyName: string;
//     onConfirm: () => void;
//     onCancel: () => void;
//     loading?: boolean;
// }

// function UnfollowModal({ visible, companyName, onConfirm, onCancel, loading = false }: UnfollowModalProps) {
//     return (
//         <Modal
//             visible={visible}
//             transparent={true}
//             animationType="fade"
//             onRequestClose={onCancel}
//         >
//             <View style={styles.modalOverlay}>
//                 <View style={styles.modalContent}>
//                     <View style={styles.modalHeader}>
//                         <Feather name="user-x" size={sizeScale(32)} color="#ff4444" />
//                     </View>
                    
//                     <Text style={styles.modalTitle}>Unfollow Company?</Text>
                    
//                     <Text style={styles.modalMessage}>
//                         Are you sure you want to unfollow{'\n'}
//                         <Text style={styles.modalCompanyName}>{companyName}</Text>?
//                     </Text>
                    
//                     <View style={styles.modalButtons}>
//                         <TouchableOpacity
//                             style={[styles.modalButton, styles.modalCancelButton]}
//                             onPress={onCancel}
//                             disabled={loading}
//                             activeOpacity={0.7}
//                         >
//                             <Text style={styles.modalCancelText}>Cancel</Text>
//                         </TouchableOpacity>
                        
//                         <TouchableOpacity
//                             style={[styles.modalButton, styles.modalConfirmButton]}
//                             onPress={onConfirm}
//                             disabled={loading}
//                             activeOpacity={0.7}
//                         >
//                             {loading ? (
//                                 <ActivityIndicator size="small" color="#fff" />
//                             ) : (
//                                 <Text style={styles.modalConfirmText}>Unfollow</Text>
//                             )}
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </View>
//         </Modal>
//     );
// }

// // --- Connection Card Component ---
// interface ConnectionCardProps {
//     company: Company;
//     showUnfollow?: boolean;
//     onUnfollow?: (companyId: string) => void;
//     unfollowLoading?: boolean;
// }

// function ConnectionCard({ company, showUnfollow = false, onUnfollow, unfollowLoading = false }: ConnectionCardProps) {
//     const router = useRouter();
    
//     if (!company || !company.id) return null;

//     const handleUnfollowPress = () => {
//         if (onUnfollow) {
//             onUnfollow(company.id);
//         }
//     };

//     const handleCardPress = () => {
//         router.push(`/companies/${company.id}`);
//     };

//     return (
//         <View style={styles.connectionCard}>
//             <TouchableOpacity 
//                 onPress={handleCardPress}
//                 style={styles.connectionCardContent}
//                 activeOpacity={0.7}
//             >
//                 <Image
//                     source={{ uri: company.logo || PLACEHOLDER_IMG }}
//                     style={styles.connectionAvatar}
//                     defaultSource={{ uri: PLACEHOLDER_IMG }}
//                 />
//                 <Text style={styles.connectionName} numberOfLines={1}>
//                     {company.companyName}
//                 </Text>
//                 {company.userName && (
//                     <Text style={styles.connectionUsername} numberOfLines={1}>
//                         @{company.userName}
//                     </Text>
//                 )}
//                 {company.category && (
//                     <Text style={styles.connectionCategory} numberOfLines={1}>
//                         {company.category}
//                     </Text>
//                 )}
//             </TouchableOpacity>
//             {showUnfollow && onUnfollow && (
//                 <TouchableOpacity
//                     onPress={handleUnfollowPress}
//                     style={[styles.unfollowButton, unfollowLoading && styles.unfollowButtonDisabled]}
//                     disabled={unfollowLoading}
//                     activeOpacity={0.7}
//                 >
//                     {unfollowLoading ? (
//                         <ActivityIndicator size="small" color="#fff" />
//                     ) : (
//                         <Text style={styles.unfollowButtonText}>Unfollow</Text>
//                     )}
//                 </TouchableOpacity>
//             )}
//         </View>
//     );
// }

// // --- Lead Card Component ---
// interface LeadCardProps {
//     lead: Lead;
//     showCompanyInfo?: boolean;
// }

// function LeadCard({ lead, showCompanyInfo = false }: LeadCardProps) {
//     const router = useRouter();
    
//     return (
//         <TouchableOpacity 
//             style={styles.leadCard}
//             onPress={() => router.push(`/leads/${lead.id}`)}
//             activeOpacity={0.7}
//         >
//             <Text style={styles.leadTitle} numberOfLines={2}>{lead.title}</Text>
//             <Text style={styles.leadDescription} numberOfLines={3}>
//                 {lead.description}
//             </Text>
//             {lead.budget && (
//                 <View style={styles.leadInfo}>
//                     <Feather name="dollar-sign" size={sizeScale(14)} color="#0095f6" />
//                     <Text style={styles.leadInfoText}>{lead.budget}</Text>
//                 </View>
//             )}
//             {lead.location && (
//                 <View style={styles.leadInfo}>
//                     <Feather name="map-pin" size={sizeScale(14)} color="#0095f6" />
//                     <Text style={styles.leadInfoText}>{lead.location}</Text>
//                 </View>
//             )}
//             <Text style={styles.leadDate}>
//                 {new Date(lead.createdAt).toLocaleDateString()}
//             </Text>
//         </TouchableOpacity>
//     );
// }

// // --- Main Profile Component ---
// export default function AccountsCenterScreen() {
//     const router = useRouter();
//     const { user, refreshUser } = useAuth();
    
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [unfollowingId, setUnfollowingId] = useState<string | null>(null);
//     const [showUnfollowModal, setShowUnfollowModal] = useState(false);
//     const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    
//     // Store fresh profile data from API
//     const [profileData, setProfileData] = useState<any>(null);
    
//     const [followers, setFollowers] = useState<Company[]>([]);
//     const [following, setFollowing] = useState<Company[]>([]);
//     const [postedLeads, setPostedLeads] = useState<Lead[]>([]);
//     const [consumedLeads, setConsumedLeads] = useState<ConsumedLead[]>([]);
//     const [activeTab, setActiveTab] = useState<'posted' | 'consumed'>('posted');

//     // Load data when screen comes into focus
//     useFocusEffect(
//         React.useCallback(() => {
//             console.log('🔄 Screen focused, loading fresh data...');
//             loadProfileData();
//         }, [])
//     );

//     const loadProfileData = async () => {
//         try {
//             setLoading(true);
//             const [profileRes, consumedRes, followersRes, followingRes] = await Promise.all([
//                 companyAPI.getProfile(),
//                 companyAPI.getConsumedLeads(),
//                 followersAPI.getFollowers(),
//                 followersAPI.getFollowing(),
//             ]);

//             console.log('📥 Fresh profile data loaded:', {
//                 userName: profileRes.userName,
//                 companyName: profileRes.companyName,
//                 userPhoto: profileRes.userPhoto?.substring(0, 60) + '...',
//                 logo: profileRes.logo?.substring(0, 60) + '...',
//                 coverImage: profileRes.coverImage?.substring(0, 60) + '...',
//             });

//             // Store fresh profile data
//             setProfileData(profileRes);

//             // Try to refresh auth context
//             if (typeof refreshUser === 'function') {
//                 try {
//                     await refreshUser();
//                 } catch (err) {
//                     console.log('⚠️ Could not update auth context, using local data');
//                 }
//             }

//             setPostedLeads(profileRes.leads || []);
//             setConsumedLeads(consumedRes || []);
//             setFollowers(followersRes || []);
//             setFollowing(followingRes || []);
//         } catch (error: any) {
//             console.error('Failed to load profile data:', error);
//             Alert.alert('Error', error.message || 'Failed to load profile data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const onRefresh = async () => {
//         setRefreshing(true);
//         await loadProfileData();
//         setRefreshing(false);
//     };

//     const handleUnfollowRequest = (companyId: string) => {
//         const company = following.find(c => c.id === companyId);
//         if (company) {
//             setSelectedCompany(company);
//             setShowUnfollowModal(true);
//         }
//     };

//     const handleUnfollowConfirm = async () => {
//         if (!selectedCompany) return;

//         try {
//             setUnfollowingId(selectedCompany.id);
            
//             await followersAPI.unfollowCompany(selectedCompany.id);
            
//             setFollowing(prev => prev.filter(company => company.id !== selectedCompany.id));
            
//             setShowUnfollowModal(false);
//             Alert.alert('Success', `You have unfollowed ${selectedCompany.companyName}`);
//         } catch (error: any) {
//             console.error('Failed to unfollow:', error);
//             Alert.alert('Error', error.message || 'Failed to unfollow company');
//         } finally {
//             setUnfollowingId(null);
//             setSelectedCompany(null);
//         }
//     };

//     const handleUnfollowCancel = () => {
//         setShowUnfollowModal(false);
//         setSelectedCompany(null);
//     };

//     const handleShareProfile = async () => {
//         try {
//             const displayName = profileData?.companyName || user?.companyName;
//             const message = `Check out ${displayName}'s profile on Bizzap!`;
//             await Share.share({
//                 message: message,
//                 title: `${displayName} Profile`,
//             });
//         } catch (error) {
//             console.error('Share failed:', error);
//         }
//     };

//     const handleEditProfile = () => {
//         router.push('/profile/edit-profile');
//     };

//     const handleManageCatalog = () => {
//         router.push('/products');
//     };

//     if (loading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color="#0095f6" />
//                 <Text style={styles.loadingText}>Loading profile...</Text>
//             </View>
//         );
//     }

//     if (!user && !profileData) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <Text style={styles.errorText}>User not found</Text>
//             </View>
//         );
//     }

//     // Use profileData if available, fallback to user
//     const displayData = profileData || user;

//     return (
//         <View style={styles.container}>
//             {/* Unfollow Confirmation Modal */}
//             <UnfollowModal
//                 visible={showUnfollowModal}
//                 companyName={selectedCompany?.companyName || ''}
//                 onConfirm={handleUnfollowConfirm}
//                 onCancel={handleUnfollowCancel}
//                 loading={unfollowingId === selectedCompany?.id}
//             />

//             {/* Custom Header */}
//             <View style={styles.header}>
//                 <TouchableOpacity 
//                     style={styles.backButton}
//                     onPress={() => router.push('/(app)/profile')}
//                 >
//                     <Feather name="arrow-left" size={sizeScale(24)} color="#fff" />
//                 </TouchableOpacity>
//                 <Text style={styles.headerTitle}>{displayData?.userName || displayData?.companyName}</Text>
//                 <TouchableOpacity 
//                     style={styles.headerButton}
//                     onPress={handleShareProfile}
//                 >
//                     <Feather name="share-2" size={sizeScale(20)} color="#fff" />
//                 </TouchableOpacity>
//             </View>

//             <ScrollView 
//                 style={styles.scrollView}
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={styles.scrollContent}
//                 refreshControl={
//                     <RefreshControl
//                         refreshing={refreshing}
//                         onRefresh={onRefresh}
//                         tintColor="#0095f6"
//                         colors={['#0095f6']}
//                     />
//                 }
//             >
//                 {/* Profile Header Section */}
//                 <View style={styles.profileHeader}>
//                     {/* Cover Image - Use fresh data */}
//                     <View style={styles.coverImageContainer}>
//                         {displayData?.coverImage ? (
//                             <Image
//                                 source={{ uri: displayData.coverImage }}
//                                 style={styles.coverImage}
//                                 defaultSource={{ uri: PLACEHOLDER_IMG }}
//                                 key={displayData.coverImage} // Force re-render on URL change
//                             />
//                         ) : (
//                             <View style={styles.coverImagePlaceholder} />
//                         )}
//                     </View>

//                     {/* Profile Info */}
//                     <View style={styles.profileInfoContainer}>
//                         {/* User Photo - Use fresh data */}
//                         <View style={styles.avatarContainer}>
//                             <Image
//                                 source={{ uri: displayData?.userPhoto || displayData?.logo || PLACEHOLDER_IMG }}
//                                 style={styles.avatar}
//                                 defaultSource={{ uri: PLACEHOLDER_IMG }}
//                                 key={displayData?.userPhoto || displayData?.logo} // Force re-render on URL change
//                             />
//                         </View>

//                         {/* User Details */}
//                         <View style={styles.userDetails}>
//                             <Text style={styles.userName}>{displayData?.userName || 'User'}</Text>
//                             <Text style={styles.companyName}>{displayData?.companyName}</Text>
//                             {displayData?.description && (
//                                 <Text style={styles.description}>{displayData.description}</Text>
//                             )}
//                         </View>

//                         {/* Stats Row */}
//                         <View style={styles.statsRow}>
//                             <View style={styles.statItem}>
//                                 <Text style={styles.statNumber}>{postedLeads.length}</Text>
//                                 <Text style={styles.statLabel}>Leads</Text>
//                             </View>
//                             <View style={styles.statItem}>
//                                 <Text style={styles.statNumber}>{followers.length}</Text>
//                                 <Text style={styles.statLabel}>Followers</Text>
//                             </View>
//                             <View style={styles.statItem}>
//                                 <Text style={styles.statNumber}>{following.length}</Text>
//                                 <Text style={styles.statLabel}>Following</Text>
//                             </View>
//                         </View>

//                         {/* Action Buttons */}
//                         <View style={styles.actionButtons}>
//                             <TouchableOpacity
//                                 style={[styles.actionButton, styles.primaryButton]}
//                                 onPress={handleEditProfile}
//                             >
//                                 <Feather name="edit-2" size={sizeScale(16)} color="#fff" />
//                                 <Text style={styles.primaryButtonText}>Edit Profile</Text>
//                             </TouchableOpacity>
                            
//                             <TouchableOpacity
//                                 style={[styles.actionButton, styles.secondaryButton]}
//                                 onPress={handleManageCatalog}
//                             >
//                                 <Feather name="package" size={sizeScale(16)} color="#0095f6" />
//                                 <Text style={styles.secondaryButtonText}>Catalog</Text>
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </View>

//                 {/* About Section */}
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>About</Text>
//                     <Text style={styles.aboutText}>
//                         {displayData?.about || 'No information provided.'}
//                     </Text>
//                     {displayData?.category && (
//                         <View style={styles.infoRow}>
//                             <Feather name="tag" size={sizeScale(14)} color="#0095f6" />
//                             <Text style={styles.infoLabel}>Category:</Text>
//                             <Text style={styles.infoValue}>{displayData.category}</Text>
//                         </View>
//                     )}
//                     {displayData?.address && (
//                         <View style={styles.infoRow}>
//                             <Feather name="map-pin" size={sizeScale(14)} color="#0095f6" />
//                             <Text style={styles.infoLabel}>Address:</Text>
//                             <Text style={styles.infoValue}>{displayData.address}</Text>
//                         </View>
//                     )}
//                 </View>

//                 {/* Followers Section */}
//                 <View style={styles.section}>
//                     <View style={styles.sectionHeaderRow}>
//                         <Text style={styles.sectionTitle}>
//                             Followers
//                         </Text>
//                         <Text style={styles.sectionCount}>{followers.length}</Text>
//                     </View>
//                     {followers.length > 0 ? (
//                         <ScrollView
//                             horizontal
//                             showsHorizontalScrollIndicator={false}
//                             contentContainerStyle={styles.connectionsScroll}
//                         >
//                             {followers.map((company) => (
//                                 <ConnectionCard
//                                     key={company.id}
//                                     company={company}
//                                     showUnfollow={false}
//                                 />
//                             ))}
//                         </ScrollView>
//                     ) : (
//                         <Text style={styles.emptyText}>No followers yet.</Text>
//                     )}
//                 </View>

//                 {/* Following Section */}
//                 <View style={styles.section}>
//                     <View style={styles.sectionHeaderRow}>
//                         <Text style={styles.sectionTitle}>
//                             Following
//                         </Text>
//                         <Text style={styles.sectionCount}>{following.length}</Text>
//                     </View>
//                     {following.length > 0 ? (
//                         <ScrollView
//                             horizontal
//                             showsHorizontalScrollIndicator={false}
//                             contentContainerStyle={styles.connectionsScroll}
//                         >
//                             {following.map((company) => (
//                                 <ConnectionCard
//                                     key={company.id}
//                                     company={company}
//                                     showUnfollow={true}
//                                     onUnfollow={handleUnfollowRequest}
//                                     unfollowLoading={unfollowingId === company.id}
//                                 />
//                             ))}
//                         </ScrollView>
//                     ) : (
//                         <Text style={styles.emptyText}>Not following any companies yet.</Text>
//                     )}
//                 </View>

//                 {/* Leads Section */}
//                 <View style={styles.section}>
//                     {/* Tab Navigation */}
//                     <View style={styles.tabContainer}>
//                         <TouchableOpacity
//                             style={[
//                                 styles.tab,
//                                 activeTab === 'posted' && styles.activeTab
//                             ]}
//                             onPress={() => setActiveTab('posted')}
//                         >
//                             <Text style={[
//                                 styles.tabText,
//                                 activeTab === 'posted' && styles.activeTabText
//                             ]}>
//                                 Posted Leads ({postedLeads.length})
//                             </Text>
//                         </TouchableOpacity>
                        
//                         <TouchableOpacity
//                             style={[
//                                 styles.tab,
//                                 activeTab === 'consumed' && styles.activeTab
//                             ]}
//                             onPress={() => setActiveTab('consumed')}
//                         >
//                             <Text style={[
//                                 styles.tabText,
//                                 activeTab === 'consumed' && styles.activeTabText
//                             ]}>
//                                 Consumed Leads ({consumedLeads.length})
//                             </Text>
//                         </TouchableOpacity>
//                     </View>

//                     {/* Tab Content */}
//                     <View style={styles.leadsContent}>
//                         {activeTab === 'posted' ? (
//                             postedLeads.length > 0 ? (
//                                 <ScrollView
//                                     horizontal
//                                     showsHorizontalScrollIndicator={false}
//                                     contentContainerStyle={styles.leadsScroll}
//                                 >
//                                     {postedLeads.map((lead) => (
//                                         <LeadCard key={lead.id} lead={lead} />
//                                     ))}
//                                 </ScrollView>
//                             ) : (
//                                 <Text style={styles.emptyText}>
//                                     You have not posted any leads yet.
//                                 </Text>
//                             )
//                         ) : (
//                             consumedLeads.length > 0 ? (
//                                 <ScrollView
//                                     horizontal
//                                     showsHorizontalScrollIndicator={false}
//                                     contentContainerStyle={styles.leadsScroll}
//                                 >
//                                     {consumedLeads.map((item) => (
//                                         <LeadCard 
//                                             key={item.id} 
//                                             lead={item.lead}
//                                             showCompanyInfo={true}
//                                         />
//                                     ))}
//                                 </ScrollView>
//                             ) : (
//                                 <Text style={styles.emptyText}>
//                                     You have not consumed any leads yet.
//                                 </Text>
//                             )
//                         )}
//                     </View>
//                 </View>

//                 {/* Bottom Padding for Fixed Tab Bar */}
//                 <View style={styles.bottomPadding} />
//             </ScrollView>
//         </View>
//     );
// }

// // --- Stylesheet ---
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#000',
//     },
//     loadingContainer: {
//         flex: 1,
//         backgroundColor: '#000',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     loadingText: {
//         marginTop: sizeScale(16),
//         fontSize: sizeScale(16),
//         color: '#666',
//     },
//     errorText: {
//         fontSize: sizeScale(16),
//         color: '#ff4444',
//     },
//     header: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: sizeScale(16),
//         paddingVertical: sizeScale(12),
//         paddingTop: sizeScale(50),
//         backgroundColor: '#000',
//         borderBottomWidth: 1,
//         borderBottomColor: '#1a1a1a',
//     },
//     backButton: {
//         padding: sizeScale(8),
//     },
//     headerTitle: {
//         fontSize: sizeScale(18),
//         fontWeight: '600',
//         color: '#fff',
//     },
//     headerButton: {
//         padding: sizeScale(8),
//     },
//     scrollView: {
//         flex: 1,
//     },
//     scrollContent: {
//         paddingBottom: sizeScale(120), 
//     },
    
//     // Modal Styles
//     modalOverlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0, 0, 0, 0.85)',
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: sizeScale(20),
//     },
//     modalContent: {
//         backgroundColor: '#1a1a1a',
//         borderRadius: sizeScale(16),
//         padding: sizeScale(24),
//         width: '100%',
//         maxWidth: sizeScale(340),
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#333',
//     },
//     modalHeader: {
//         width: sizeScale(64),
//         height: sizeScale(64),
//         borderRadius: sizeScale(32),
//         backgroundColor: '#2a1a1a',
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginBottom: sizeScale(16),
//     },
//     modalTitle: {
//         fontSize: sizeScale(20),
//         fontWeight: 'bold',
//         color: '#fff',
//         marginBottom: sizeScale(12),
//         textAlign: 'center',
//     },
//     modalMessage: {
//         fontSize: sizeScale(15),
//         color: '#999',
//         textAlign: 'center',
//         lineHeight: sizeScale(22),
//         marginBottom: sizeScale(24),
//     },
//     modalCompanyName: {
//         color: '#fff',
//         fontWeight: '600',
//     },
//     modalButtons: {
//         flexDirection: 'row',
//         gap: sizeScale(12),
//         width: '100%',
//     },
//     modalButton: {
//         flex: 1,
//         paddingVertical: sizeScale(12),
//         borderRadius: sizeScale(8),
//         alignItems: 'center',
//         justifyContent: 'center',
//         minHeight: sizeScale(44),
//     },
//     modalCancelButton: {
//         backgroundColor: '#2a2a2a',
//         borderWidth: 1,
//         borderColor: '#444',
//     },
//     modalCancelText: {
//         fontSize: sizeScale(15),
//         fontWeight: '600',
//         color: '#999',
//     },
//     modalConfirmButton: {
//         backgroundColor: '#ff4444',
//     },
//     modalConfirmText: {
//         fontSize: sizeScale(15),
//         fontWeight: '600',
//         color: '#fff',
//     },
    
//     // Profile Header Styles
//     profileHeader: {
//         backgroundColor: '#000',
//         marginBottom: sizeScale(16),
//     },
//     coverImageContainer: {
//         height: sizeScale(150),
//         backgroundColor: '#1a1a1a',
//     },
//     coverImage: {
//         width: '100%',
//         height: '100%',
//     },
//     coverImagePlaceholder: {
//         width: '100%',
//         height: '100%',
//         backgroundColor: '#1a1a1a',
//     },
//     profileInfoContainer: {
//         paddingHorizontal: sizeScale(16),
//     },
//     avatarContainer: {
//         width: sizeScale(100),
//         height: sizeScale(100),
//         marginTop: sizeScale(-50),
//         borderRadius: sizeScale(50),
//         borderWidth: 4,
//         borderColor: '#000',
//         overflow: 'hidden',
//         backgroundColor: '#1a1a1a',
//     },
//     avatar: {
//         width: '100%',
//         height: '100%',
//     },
//     userDetails: {
//         marginTop: sizeScale(12),
//     },
//     userName: {
//         fontSize: sizeScale(24),
//         fontWeight: 'bold',
//         color: '#fff',
//     },
//     companyName: {
//         fontSize: sizeScale(18),
//         color: '#666',
//         fontWeight: '500',
//         marginTop: sizeScale(4),
//     },
//     description: {
//         fontSize: sizeScale(14),
//         color: '#999',
//         marginTop: sizeScale(8),
//         lineHeight: sizeScale(20),
//     },
//     statsRow: {
//         flexDirection: 'row',
//         marginTop: sizeScale(16),
//         gap: sizeScale(24),
//     },
//     statItem: {
//         alignItems: 'center',
//     },
//     statNumber: {
//         fontSize: sizeScale(20),
//         fontWeight: 'bold',
//         color: '#fff',
//     },
//     statLabel: {
//         fontSize: sizeScale(13),
//         color: '#666',
//         marginTop: sizeScale(2),
//     },
//     actionButtons: {
//         flexDirection: 'row',
//         gap: sizeScale(12),
//         marginTop: sizeScale(16),
//     },
//     actionButton: {
//         flex: 1,
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: sizeScale(10),
//         borderRadius: sizeScale(8),
//         gap: sizeScale(6),
//     },
//     primaryButton: {
//         backgroundColor: '#0095f6',
//     },
//     primaryButtonText: {
//         fontSize: sizeScale(14),
//         fontWeight: '600',
//         color: '#fff',
//     },
//     secondaryButton: {
//         backgroundColor: 'transparent',
//         borderWidth: 1,
//         borderColor: '#0095f6',
//     },
//     secondaryButtonText: {
//         fontSize: sizeScale(14),
//         fontWeight: '600',
//         color: '#0095f6',
//     },
    
//     // Section Styles
//     section: {
//         backgroundColor: '#000',
//         paddingHorizontal: sizeScale(16),
//         paddingVertical: sizeScale(20),
//         marginBottom: sizeScale(8),
//     },
//     sectionHeaderRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: sizeScale(12),
//     },
//     sectionTitle: {
//         fontSize: sizeScale(18),
//         fontWeight: 'bold',
//         color: '#fff',
//     },
//     sectionCount: {
//         fontSize: sizeScale(16),
//         fontWeight: '600',
//         color: '#666',
//         marginLeft: sizeScale(8),
//     },
//     aboutText: {
//         fontSize: sizeScale(14),
//         color: '#999',
//         lineHeight: sizeScale(20),
//         marginBottom: sizeScale(12),
//     },
//     infoRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginTop: sizeScale(8),
//         gap: sizeScale(8),
//     },
//     infoLabel: {
//         fontSize: sizeScale(14),
//         fontWeight: '600',
//         color: '#fff',
//     },
//     infoValue: {
//         fontSize: sizeScale(14),
//         color: '#999',
//         flex: 1,
//     },
//     emptyText: {
//         fontSize: sizeScale(14),
//         color: '#666',
//         textAlign: 'center',
//         paddingVertical: sizeScale(20),
//     },
    
//     // Connection Card Styles
//     connectionsScroll: {
//         gap: sizeScale(12),
//         paddingRight: sizeScale(16),
//     },
//     connectionCard: {
//         width: sizeScale(140),
//         backgroundColor: '#1a1a1a',
//         borderRadius: sizeScale(12),
//         padding: sizeScale(12),
//         alignItems: 'center',
//     },
//     connectionCardContent: {
//         alignItems: 'center',
//         width: '100%',
//     },
//     connectionAvatar: {
//         width: sizeScale(60),
//         height: sizeScale(60),
//         borderRadius: sizeScale(30),
//         marginBottom: sizeScale(8),
//     },
//     connectionName: {
//         fontSize: sizeScale(14),
//         fontWeight: '600',
//         color: '#fff',
//         textAlign: 'center',
//     },
//     connectionUsername: {
//         fontSize: sizeScale(12),
//         color: '#666',
//         marginTop: sizeScale(2),
//         textAlign: 'center',
//     },
//     connectionCategory: {
//         fontSize: sizeScale(11),
//         color: '#0095f6',
//         marginTop: sizeScale(2),
//         textAlign: 'center',
//     },
//     unfollowButton: {
//         marginTop: sizeScale(8),
//         paddingHorizontal: sizeScale(12),
//         paddingVertical: sizeScale(8),
//         backgroundColor: '#ff4444',
//         borderRadius: sizeScale(6),
//         width: '100%',
//         alignItems: 'center',
//         minHeight: sizeScale(32),
//         justifyContent: 'center',
//     },
//     unfollowButtonDisabled: {
//         opacity: 0.5,
//         backgroundColor: '#ff6666',
//     },
//     unfollowButtonText: {
//         fontSize: sizeScale(13),
//         color: '#fff',
//         fontWeight: '600',
//     },
    
//     // Tab Styles
//     tabContainer: {
//         flexDirection: 'row',
//         borderBottomWidth: 1,
//         borderBottomColor: '#1a1a1a',
//         marginBottom: sizeScale(16),
//     },
//     tab: {
//         flex: 1,
//         paddingVertical: sizeScale(12),
//         alignItems: 'center',
//         borderBottomWidth: 2,
//         borderBottomColor: 'transparent',
//     },
//     activeTab: {
//         borderBottomColor: '#0095f6',
//     },
//     tabText: {
//         fontSize: sizeScale(14),
//         color: '#666',
//         fontWeight: '500',
//     },
//     activeTabText: {
//         color: '#0095f6',
//         fontWeight: '600',
//     },
    
//     // Lead Card Styles
//     leadsContent: {
//         minHeight: sizeScale(200),
//     },
//     leadsScroll: {
//         gap: sizeScale(12),
//         paddingRight: sizeScale(16),
//     },
//     leadCard: {
//         width: sizeScale(280),
//         backgroundColor: '#1a1a1a',
//         borderRadius: sizeScale(12),
//         padding: sizeScale(16),
//     },
//     leadTitle: {
//         fontSize: sizeScale(16),
//         fontWeight: '600',
//         color: '#fff',
//         marginBottom: sizeScale(8),
//     },
//     leadDescription: {
//         fontSize: sizeScale(14),
//         color: '#999',
//         lineHeight: sizeScale(20),
//         marginBottom: sizeScale(12),
//     },
//     leadInfo: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: sizeScale(6),
//         marginBottom: sizeScale(6),
//     },
//     leadInfoText: {
//         fontSize: sizeScale(13),
//         color: '#999',
//     },
//     leadDate: {
//         fontSize: sizeScale(12),
//         color: '#666',
//         marginTop: sizeScale(8),
//     },
    
//     bottomPadding: {
//         height: sizeScale(20),
//     },
// });


// // app/(app)/profile/accounts-center.tsx

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
    Share,
    Modal,
    Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { companyAPI, followersAPI, Company, Lead, ConsumedLead } from '../../../services/user';
import { useFocusEffect } from '@react-navigation/native';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Placeholder Image ---
const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/f3f4f6/6b7280?text=No+Image';

// --- Unfollow Confirmation Modal Component ---
interface UnfollowModalProps {
    visible: boolean;
    companyName: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

function UnfollowModal({ visible, companyName, onConfirm, onCancel, loading = false }: UnfollowModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Feather name="user-x" size={sizeScale(32)} color="#ff4444" />
                    </View>
                    
                    <Text style={styles.modalTitle}>Unfollow Company?</Text>
                    
                    <Text style={styles.modalMessage}>
                        Are you sure you want to unfollow{'\n'}
                        <Text style={styles.modalCompanyName}>{companyName}</Text>?
                    </Text>
                    
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalCancelButton]}
                            onPress={onCancel}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalConfirmButton]}
                            onPress={onConfirm}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.modalConfirmText}>Unfollow</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// --- Connection Card Component ---
interface ConnectionCardProps {
    company: Company;
    showUnfollow?: boolean;
    onUnfollow?: (companyId: string) => void;
    unfollowLoading?: boolean;
}

function ConnectionCard({ company, showUnfollow = false, onUnfollow, unfollowLoading = false }: ConnectionCardProps) {
    const router = useRouter();
    
    if (!company || !company.id) return null;

    const handleUnfollowPress = () => {
        if (onUnfollow) {
            onUnfollow(company.id);
        }
    };

    const handleCardPress = () => {
        router.push(`/companies/${company.id}`);
    };

    return (
        <View style={styles.connectionCard}>
            <TouchableOpacity 
                onPress={handleCardPress}
                style={styles.connectionCardContent}
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: company.logo || PLACEHOLDER_IMG }}
                    style={styles.connectionAvatar}
                    defaultSource={{ uri: PLACEHOLDER_IMG }}
                />
                <Text style={styles.connectionName} numberOfLines={1}>
                    {company.companyName}
                </Text>
                {company.userName && (
                    <Text style={styles.connectionUsername} numberOfLines={1}>
                        @{company.userName}
                    </Text>
                )}
                {company.category && (
                    <Text style={styles.connectionCategory} numberOfLines={1}>
                        {company.category}
                    </Text>
                )}
            </TouchableOpacity>
            {showUnfollow && onUnfollow && (
                <TouchableOpacity
                    onPress={handleUnfollowPress}
                    style={[styles.unfollowButton, unfollowLoading && styles.unfollowButtonDisabled]}
                    disabled={unfollowLoading}
                    activeOpacity={0.7}
                >
                    {unfollowLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.unfollowButtonText}>Unfollow</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

// --- Lead Card Component ---
interface LeadCardProps {
    lead: Lead;
    showCompanyInfo?: boolean;
}

function LeadCard({ lead, showCompanyInfo = false }: LeadCardProps) {
    const router = useRouter();
    
    return (
        <TouchableOpacity 
            style={styles.leadCard}
            onPress={() => router.push(`/leads/${lead.id}`)}
            activeOpacity={0.7}
        >
            <Text style={styles.leadTitle} numberOfLines={2}>{lead.title}</Text>
            <Text style={styles.leadDescription} numberOfLines={3}>
                {lead.description}
            </Text>
            {lead.budget && (
                <View style={styles.leadInfo}>
                    <Feather name="dollar-sign" size={sizeScale(14)} color="#0095f6" />
                    <Text style={styles.leadInfoText}>{lead.budget}</Text>
                </View>
            )}
            {lead.location && (
                <View style={styles.leadInfo}>
                    <Feather name="map-pin" size={sizeScale(14)} color="#0095f6" />
                    <Text style={styles.leadInfoText}>{lead.location}</Text>
                </View>
            )}
            <Text style={styles.leadDate}>
                {new Date(lead.createdAt).toLocaleDateString()}
            </Text>
        </TouchableOpacity>
    );
}

// --- Main Profile Component ---
export default function AccountsCenterScreen() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unfollowingId, setUnfollowingId] = useState<string | null>(null);
    const [showUnfollowModal, setShowUnfollowModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    
    // Store fresh profile data from API
    const [profileData, setProfileData] = useState<any>(null);
    
    const [followers, setFollowers] = useState<Company[]>([]);
    const [following, setFollowing] = useState<Company[]>([]);
    const [postedLeads, setPostedLeads] = useState<Lead[]>([]);
    const [consumedLeads, setConsumedLeads] = useState<ConsumedLead[]>([]);
    const [activeTab, setActiveTab] = useState<'posted' | 'consumed'>('posted');

    // Load data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            console.log('🔄 Screen focused, loading fresh data...');
            loadProfileData();
        }, [])
    );

    const loadProfileData = async () => {
        try {
            setLoading(true);
            const [profileRes, consumedRes, followersRes, followingRes] = await Promise.all([
                companyAPI.getProfile(),
                companyAPI.getConsumedLeads(),
                followersAPI.getFollowers(),
                followersAPI.getFollowing(),
            ]);

            console.log('🔥 Fresh profile data loaded:', {
                userName: profileRes.userName,
                companyName: profileRes.companyName,
                userPhoto: profileRes.userPhoto?.substring(0, 60) + '...',
                logo: profileRes.logo?.substring(0, 60) + '...',
                coverImage: profileRes.coverImage?.substring(0, 60) + '...',
                referralCode: profileRes.referralCode,
                hasVerifiedBadge: profileRes.hasVerifiedBadge,
            });

            // Store fresh profile data
            setProfileData(profileRes);

            // Try to refresh auth context
            if (typeof refreshUser === 'function') {
                try {
                    await refreshUser();
                } catch (err) {
                    console.log('⚠️ Could not update auth context, using local data');
                }
            }

            setPostedLeads(profileRes.leads || []);
            setConsumedLeads(consumedRes || []);
            setFollowers(followersRes || []);
            setFollowing(followingRes || []);
        } catch (error: any) {
            console.error('Failed to load profile data:', error);
            Alert.alert('Error', error.message || 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfileData();
        setRefreshing(false);
    };

    const handleUnfollowRequest = (companyId: string) => {
        const company = following.find(c => c.id === companyId);
        if (company) {
            setSelectedCompany(company);
            setShowUnfollowModal(true);
        }
    };

    const handleUnfollowConfirm = async () => {
        if (!selectedCompany) return;

        try {
            setUnfollowingId(selectedCompany.id);
            
            await followersAPI.unfollowCompany(selectedCompany.id);
            
            setFollowing(prev => prev.filter(company => company.id !== selectedCompany.id));
            
            setShowUnfollowModal(false);
            Alert.alert('Success', `You have unfollowed ${selectedCompany.companyName}`);
        } catch (error: any) {
            console.error('Failed to unfollow:', error);
            Alert.alert('Error', error.message || 'Failed to unfollow company');
        } finally {
            setUnfollowingId(null);
            setSelectedCompany(null);
        }
    };

    const handleUnfollowCancel = () => {
        setShowUnfollowModal(false);
        setSelectedCompany(null);
    };

    const handleShareProfile = async () => {
        try {
            const displayName = profileData?.companyName || user?.companyName;
            const message = `Check out ${displayName}'s profile on Bizzap!`;
            await Share.share({
                message: message,
                title: `${displayName} Profile`,
            });
        } catch (error) {
            console.error('Share failed:', error);
        }
    };

    const handleCopyReferralCode = () => {
        const referralCode = profileData?.referralCode || user?.referralCode;
        if (referralCode) {
            Clipboard.setString(referralCode);
            Alert.alert('Copied!', 'Referral code copied to clipboard');
        }
    };

    const handleEditProfile = () => {
        router.push('/profile/edit-profile');
    };

    const handleManageCatalog = () => {
        router.push('/products');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0095f6" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (!user && !profileData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>User not found</Text>
            </View>
        );
    }

    // Use profileData if available, fallback to user
    const displayData = profileData || user;

    return (
        <View style={styles.container}>
            {/* Unfollow Confirmation Modal */}
            <UnfollowModal
                visible={showUnfollowModal}
                companyName={selectedCompany?.companyName || ''}
                onConfirm={handleUnfollowConfirm}
                onCancel={handleUnfollowCancel}
                loading={unfollowingId === selectedCompany?.id}
            />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.push('/(app)/profile')}
                >
                    <Feather name="arrow-left" size={sizeScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{displayData?.userName || displayData?.companyName}</Text>
                <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={handleShareProfile}
                >
                    <Feather name="share-2" size={sizeScale(20)} color="#fff" />
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
                {/* Profile Header Section */}
                <View style={styles.profileHeader}>
                    {/* Cover Image - Use fresh data */}
                    <View style={styles.coverImageContainer}>
                        {displayData?.coverImage ? (
                            <Image
                                source={{ uri: displayData.coverImage }}
                                style={styles.coverImage}
                                defaultSource={{ uri: PLACEHOLDER_IMG }}
                                key={displayData.coverImage} // Force re-render on URL change
                            />
                        ) : (
                            <View style={styles.coverImagePlaceholder} />
                        )}
                    </View>

                    {/* Profile Info */}
                    <View style={styles.profileInfoContainer}>
                        {/* User Photo - Use fresh data */}
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: displayData?.userPhoto || displayData?.logo || PLACEHOLDER_IMG }}
                                style={styles.avatar}
                                defaultSource={{ uri: PLACEHOLDER_IMG }}
                                key={displayData?.userPhoto || displayData?.logo} // Force re-render on URL change
                            />
                            {/* Verified Badge */}
                            {displayData?.hasVerifiedBadge && (
                                <View style={styles.verifiedBadge}>
                                    <Feather name="check-circle" size={sizeScale(20)} color="#0095f6" />
                                </View>
                            )}
                        </View>

                        {/* User Details */}
                        <View style={styles.userDetails}>
                            <View style={styles.userNameRow}>
                                <Text style={styles.userName}>{displayData?.userName || 'User'}</Text>
                                {displayData?.hasVerifiedBadge && (
                                    <Feather name="check-circle" size={sizeScale(20)} color="#0095f6" style={styles.verifiedIcon} />
                                )}
                            </View>
                            <Text style={styles.companyName}>{displayData?.companyName}</Text>
                            {displayData?.description && (
                                <Text style={styles.description}>{displayData.description}</Text>
                            )}
                        </View>

                        {/* Referral Code Card */}
                        {displayData?.referralCode && (
                            <View style={styles.referralCard}>
                                <View style={styles.referralHeader}>
                                    <Feather name="gift" size={sizeScale(16)} color="#0095f6" />
                                    <Text style={styles.referralLabel}>Your Referral Code</Text>
                                </View>
                                <View style={styles.referralCodeContainer}>
                                    <Text style={styles.referralCode}>{displayData.referralCode}</Text>
                                    <TouchableOpacity
                                        style={styles.copyButton}
                                        onPress={handleCopyReferralCode}
                                        activeOpacity={0.7}
                                    >
                                        <Feather name="copy" size={sizeScale(16)} color="#0095f6" />
                                        <Text style={styles.copyButtonText}>Copy</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.referralHint}>Share this code to earn rewards!</Text>
                            </View>
                        )}

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{postedLeads.length}</Text>
                                <Text style={styles.statLabel}>Leads</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{followers.length}</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{following.length}</Text>
                                <Text style={styles.statLabel}>Following</Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.primaryButton]}
                                onPress={handleEditProfile}
                            >
                                <Feather name="edit-2" size={sizeScale(16)} color="#fff" />
                                <Text style={styles.primaryButtonText}>Edit Profile</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.actionButton, styles.secondaryButton]}
                                onPress={handleManageCatalog}
                            >
                                <Feather name="package" size={sizeScale(16)} color="#0095f6" />
                                <Text style={styles.secondaryButtonText}>Catalog</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.aboutText}>
                        {displayData?.about || 'No information provided.'}
                    </Text>
                    {displayData?.category && (
                        <View style={styles.infoRow}>
                            <Feather name="tag" size={sizeScale(14)} color="#0095f6" />
                            <Text style={styles.infoLabel}>Category:</Text>
                            <Text style={styles.infoValue}>{displayData.category}</Text>
                        </View>
                    )}
                    {displayData?.address && (
                        <View style={styles.infoRow}>
                            <Feather name="map-pin" size={sizeScale(14)} color="#0095f6" />
                            <Text style={styles.infoLabel}>Address:</Text>
                            <Text style={styles.infoValue}>{displayData.address}</Text>
                        </View>
                    )}
                </View>

                {/* Followers Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>
                            Followers
                        </Text>
                        <Text style={styles.sectionCount}>{followers.length}</Text>
                    </View>
                    {followers.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.connectionsScroll}
                        >
                            {followers.map((company) => (
                                <ConnectionCard
                                    key={company.id}
                                    company={company}
                                    showUnfollow={false}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={styles.emptyText}>No followers yet.</Text>
                    )}
                </View>

                {/* Following Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>
                            Following
                        </Text>
                        <Text style={styles.sectionCount}>{following.length}</Text>
                    </View>
                    {following.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.connectionsScroll}
                        >
                            {following.map((company) => (
                                <ConnectionCard
                                    key={company.id}
                                    company={company}
                                    showUnfollow={true}
                                    onUnfollow={handleUnfollowRequest}
                                    unfollowLoading={unfollowingId === company.id}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={styles.emptyText}>Not following any companies yet.</Text>
                    )}
                </View>

                {/* Leads Section */}
                <View style={styles.section}>
                    {/* Tab Navigation */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === 'posted' && styles.activeTab
                            ]}
                            onPress={() => setActiveTab('posted')}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === 'posted' && styles.activeTabText
                            ]}>
                                Posted Leads ({postedLeads.length})
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === 'consumed' && styles.activeTab
                            ]}
                            onPress={() => setActiveTab('consumed')}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === 'consumed' && styles.activeTabText
                            ]}>
                                Consumed Leads ({consumedLeads.length})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tab Content */}
                    <View style={styles.leadsContent}>
                        {activeTab === 'posted' ? (
                            postedLeads.length > 0 ? (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.leadsScroll}
                                >
                                    {postedLeads.map((lead) => (
                                        <LeadCard key={lead.id} lead={lead} />
                                    ))}
                                </ScrollView>
                            ) : (
                                <Text style={styles.emptyText}>
                                    You have not posted any leads yet.
                                </Text>
                            )
                        ) : (
                            consumedLeads.length > 0 ? (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.leadsScroll}
                                >
                                    {consumedLeads.map((item) => (
                                        <LeadCard 
                                            key={item.id} 
                                            lead={item.lead}
                                            showCompanyInfo={true}
                                        />
                                    ))}
                                </ScrollView>
                            ) : (
                                <Text style={styles.emptyText}>
                                    You have not consumed any leads yet.
                                </Text>
                            )
                        )}
                    </View>
                </View>

                {/* Bottom Padding for Fixed Tab Bar */}
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
    errorText: {
        fontSize: sizeScale(16),
        color: '#ff4444',
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
        padding: sizeScale(8),
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: sizeScale(120), 
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: sizeScale(20),
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: sizeScale(16),
        padding: sizeScale(24),
        width: '100%',
        maxWidth: sizeScale(340),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    modalHeader: {
        width: sizeScale(64),
        height: sizeScale(64),
        borderRadius: sizeScale(32),
        backgroundColor: '#2a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: sizeScale(16),
    },
    modalTitle: {
        fontSize: sizeScale(20),
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: sizeScale(12),
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: sizeScale(15),
        color: '#999',
        textAlign: 'center',
        lineHeight: sizeScale(22),
        marginBottom: sizeScale(24),
    },
    modalCompanyName: {
        color: '#fff',
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: sizeScale(12),
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: sizeScale(12),
        borderRadius: sizeScale(8),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: sizeScale(44),
    },
    modalCancelButton: {
        backgroundColor: '#2a2a2a',
        borderWidth: 1,
        borderColor: '#444',
    },
    modalCancelText: {
        fontSize: sizeScale(15),
        fontWeight: '600',
        color: '#999',
    },
    modalConfirmButton: {
        backgroundColor: '#ff4444',
    },
    modalConfirmText: {
        fontSize: sizeScale(15),
        fontWeight: '600',
        color: '#fff',
    },
    
    // Profile Header Styles
    profileHeader: {
        backgroundColor: '#000',
        marginBottom: sizeScale(16),
    },
    coverImageContainer: {
        height: sizeScale(150),
        backgroundColor: '#1a1a1a',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
    },
    profileInfoContainer: {
        paddingHorizontal: sizeScale(16),
    },
    avatarContainer: {
        width: sizeScale(100),
        height: sizeScale(100),
        marginTop: sizeScale(-50),
        borderRadius: sizeScale(50),
        borderWidth: 4,
        borderColor: '#000',
        overflow: 'visible',
        backgroundColor: '#1a1a1a',
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: sizeScale(50),
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: sizeScale(2),
        right: sizeScale(2),
        backgroundColor: '#000',
        borderRadius: sizeScale(12),
        padding: sizeScale(2),
    },
    userDetails: {
        marginTop: sizeScale(12),
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(6),
    },
    userName: {
        fontSize: sizeScale(24),
        fontWeight: 'bold',
        color: '#fff',
    },
    verifiedIcon: {
        marginLeft: sizeScale(4),
    },
    companyName: {
        fontSize: sizeScale(18),
        color: '#666',
        fontWeight: '500',
        marginTop: sizeScale(4),
    },
    description: {
        fontSize: sizeScale(14),
        color: '#999',
        marginTop: sizeScale(8),
        lineHeight: sizeScale(20),
    },
    
    // Referral Card Styles
    referralCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: sizeScale(12),
        padding: sizeScale(16),
        marginTop: sizeScale(16),
        borderWidth: 1,
        borderColor: '#0095f6',
    },
    referralHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(8),
        marginBottom: sizeScale(12),
    },
    referralLabel: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
    },
    referralCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0a0a0a',
        padding: sizeScale(12),
        borderRadius: sizeScale(8),
        marginBottom: sizeScale(8),
    },
    referralCode: {
        fontSize: sizeScale(18),
        fontWeight: 'bold',
        color: '#0095f6',
        letterSpacing: sizeScale(2),
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(6),
        backgroundColor: '#1a1a1a',
        paddingHorizontal: sizeScale(12),
        paddingVertical: sizeScale(6),
        borderRadius: sizeScale(6),
        borderWidth: 1,
        borderColor: '#0095f6',
    },
    copyButtonText: {
        fontSize: sizeScale(13),
        fontWeight: '600',
        color: '#0095f6',
    },
    referralHint: {
        fontSize: sizeScale(12),
        color: '#666',
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: sizeScale(16),
        gap: sizeScale(24),
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: sizeScale(20),
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: sizeScale(13),
        color: '#666',
        marginTop: sizeScale(2),
    },
    actionButtons: {
        flexDirection: 'row',
        gap: sizeScale(12),
        marginTop: sizeScale(16),
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
    primaryButton: {
        backgroundColor: '#0095f6',
    },
    primaryButtonText: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0095f6',
    },
    secondaryButtonText: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#0095f6',
    },
    
    // Section Styles
    section: {
        backgroundColor: '#000',
        paddingHorizontal: sizeScale(16),
        paddingVertical: sizeScale(20),
        marginBottom: sizeScale(8),
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: sizeScale(12),
    },
    sectionTitle: {
        fontSize: sizeScale(18),
        fontWeight: 'bold',
        color: '#fff',
    },
    sectionCount: {
        fontSize: sizeScale(16),
        fontWeight: '600',
        color: '#666',
        marginLeft: sizeScale(8),
    },
    aboutText: {
        fontSize: sizeScale(14),
        color: '#999',
        lineHeight: sizeScale(20),
        marginBottom: sizeScale(12),
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: sizeScale(8),
        gap: sizeScale(8),
    },
    infoLabel: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
    },
    infoValue: {
        fontSize: sizeScale(14),
        color: '#999',
        flex: 1,
    },
    emptyText: {
        fontSize: sizeScale(14),
        color: '#666',
        textAlign: 'center',
        paddingVertical: sizeScale(20),
    },
    
    // Connection Card Styles
    connectionsScroll: {
        gap: sizeScale(12),
        paddingRight: sizeScale(16),
    },
    connectionCard: {
        width: sizeScale(140),
        backgroundColor: '#1a1a1a',
        borderRadius: sizeScale(12),
        padding: sizeScale(12),
        alignItems: 'center',
    },
    connectionCardContent: {
        alignItems: 'center',
        width: '100%',
    },
    connectionAvatar: {
        width: sizeScale(60),
        height: sizeScale(60),
        borderRadius: sizeScale(30),
        marginBottom: sizeScale(8),
    },
    connectionName: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    connectionUsername: {
        fontSize: sizeScale(12),
        color: '#666',
        marginTop: sizeScale(2),
        textAlign: 'center',
    },
    connectionCategory: {
        fontSize: sizeScale(11),
        color: '#0095f6',
        marginTop: sizeScale(2),
        textAlign: 'center',
    },
    unfollowButton: {
        marginTop: sizeScale(8),
        paddingHorizontal: sizeScale(12),
        paddingVertical: sizeScale(8),
        backgroundColor: '#ff4444',
        borderRadius: sizeScale(6),
        width: '100%',
        alignItems: 'center',
        minHeight: sizeScale(32),
        justifyContent: 'center',
    },
    unfollowButtonDisabled: {
        opacity: 0.5,
        backgroundColor: '#ff6666',
    },
    unfollowButtonText: {
        fontSize: sizeScale(13),
        color: '#fff',
        fontWeight: '600',
    },
    
    // Tab Styles
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        marginBottom: sizeScale(16),
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
    
    // Lead Card Styles
    leadsContent: {
        minHeight: sizeScale(200),
    },
    leadsScroll: {
        gap: sizeScale(12),
        paddingRight: sizeScale(16),
    },
    leadCard: {
        width: sizeScale(280),
        backgroundColor: '#1a1a1a',
        borderRadius: sizeScale(12),
        padding: sizeScale(16),
    },
    leadTitle: {
        fontSize: sizeScale(16),
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
    leadInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(6),
        marginBottom: sizeScale(6),
    },
    leadInfoText: {
        fontSize: sizeScale(13),
        color: '#999',
    },
    leadDate: {
        fontSize: sizeScale(12),
        color: '#666',
        marginTop: sizeScale(8),
    },
    
    bottomPadding: {
        height: sizeScale(20),
    },
});