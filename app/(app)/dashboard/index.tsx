// // app/(app)/dashboard/index.tsx

// import * as Clipboard from 'expo-clipboard';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { AlertTriangle, Gift, X } from 'lucide-react-native';
// import React, { useEffect, useRef, useState } from 'react';
// import {
//     ActivityIndicator,
//     Alert,
//     Dimensions,
//     FlatList,
//     Image,
//     Linking,
//     Modal,
//     RefreshControl,
//     Share,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View,
//     StatusBar,
//     Animated
// } from 'react-native';
// import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import { LeadCard } from '../../../components/cards/lead-card';
// import { Lead, leadsAPI } from '../../../services/leads';
// import { companyAPI, LeadQuotaData } from '../../../services/user';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const STANDARD_WIDTH = 390;
// const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// export default function DashboardScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const insets = useSafeAreaInsets();
  
//   const [leads, setLeads] = useState<Lead[]>([]);
//   const [quotaData, setQuotaData] = useState<LeadQuotaData | null>(null);
//   const [userProfile, setUserProfile] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [showReferralModal, setShowReferralModal] = useState(false);
//   const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
  
//   const flatListRef = useRef<FlatList>(null);
//   const hasInitialFetchRef = useRef(false);
//   const hasHandledDeepLinkRef = useRef(false);
//   const highlightAnimation = useRef(new Animated.Value(0)).current;

//   const fetchData = async (isRefresh = false) => {
//     try {
//       if (!isRefresh) setIsLoading(true);
//       const [quotaResponse, availableLeadsResponse, profileResponse] = await Promise.all([
//         companyAPI.getLeadQuota(),
//         leadsAPI.getAvailableLeads(),
//         companyAPI.getProfile(),
//       ]);
      
//       if (quotaResponse.status === 'success') {
//         setQuotaData(quotaResponse.data);
//       }
      
//       if (availableLeadsResponse.status === 'success') {
//         setLeads(availableLeadsResponse.data.leads);
//       }

//       setUserProfile(profileResponse);

//     } catch (err) { 
//       console.error(err); 
//     } finally { 
//       setIsLoading(false); 
//       setIsRefreshing(false); 
//     }
//   };

//   useEffect(() => {
//     if (!hasInitialFetchRef.current) {
//       hasInitialFetchRef.current = true;
//       fetchData();
//     }
//   }, []);

//   // Enhanced scroll to lead function
//   const scrollToLead = (leadId: string) => {
//     if (!leads || leads.length === 0) {
//       console.log('No leads available to scroll to');
//       return;
//     }

//     const leadIndex = leads.findIndex(l => l.id === leadId);
    
//     if (leadIndex === -1) {
//       console.log('Lead not found in current list');
//       Alert.alert(
//         'Lead Not Available',
//         'This lead might have been consumed by other users or is no longer active.',
//         [{ text: 'OK' }]
//       );
//       return;
//     }

//     console.log(`Found lead at index ${leadIndex}, scrolling...`);

//     // Highlight the lead
//     setHighlightedLeadId(leadId);

//     // Start pulse animation
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(highlightAnimation, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//         Animated.timing(highlightAnimation, {
//           toValue: 0,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//       ]),
//       { iterations: 3 } // Pulse 3 times
//     ).start(() => {
//       // Remove highlight after animation
//       setTimeout(() => setHighlightedLeadId(null), 500);
//     });

//     // Scroll to the lead
//     setTimeout(() => {
//       flatListRef.current?.scrollToIndex({
//         index: leadIndex,
//         animated: true,
//         viewPosition: 0.5, // Center the item in view
//       });
//     }, 300);

//     // Show a toast-like notification
//     Alert.alert(
//       'Lead Found!',
//       `Showing: ${leads[leadIndex].title}`,
//       [{ text: 'Got it' }],
//       { cancelable: true }
//     );
//   };

//   // Handle deep links from params (direct navigation)
//   useEffect(() => {
//     const leadIdFromParams = params.leadId as string | undefined;
    
//     if (leadIdFromParams && !hasHandledDeepLinkRef.current && leads.length > 0) {
//       hasHandledDeepLinkRef.current = true;
//       console.log('Deep link lead ID from params:', leadIdFromParams);
      
//       // Wait a bit for the list to render
//       setTimeout(() => {
//         scrollToLead(leadIdFromParams);
//       }, 500);
//     }
//   }, [params.leadId, leads]);

//   // Handle deep links from URL (shared links)
//   useEffect(() => {
//     const handleDeepLink = async (event: { url: string }) => {
//       const url = event.url;
//       console.log('Deep link URL received:', url);
      
//       const leadIdMatch = url.match(/[?&]leadId=([a-zA-Z0-9-]+)/);
      
//       if (leadIdMatch && leadIdMatch[1]) {
//         const leadId = leadIdMatch[1];
//         console.log('Extracted lead ID from URL:', leadId);
        
//         try {
//           // First, verify the lead exists on the server
//           const response = await leadsAPI.getLeadById(leadId);
          
//           if (response.status === 'success') {
//             // Check if lead is in our current list
//             const isInList = leads.some(l => l.id === leadId);
            
//             if (isInList) {
//               // Lead is already in the list, scroll to it
//               scrollToLead(leadId);
//             } else {
//               // Lead exists but not in current available leads
//               Alert.alert(
//                 'Lead Not Available',
//                 'This lead has already been consumed by other users or is not available to you.',
//                 [
//                   { 
//                     text: 'View Other Leads', 
//                     style: 'cancel',
//                     onPress: () => {
//                       // Just stay on the current screen
//                     }
//                   }
//                 ]
//               );
//             }
//           }
//         } catch (error: any) {
//           console.error('Error fetching shared lead:', error);
          
//           // Check if it's a 404 or lead not found error
//           if (error.message?.includes('404') || error.message?.includes('not found')) {
//             Alert.alert(
//               'Lead Not Found',
//               'This lead may have been deleted or is no longer available.',
//               [{ text: 'OK' }]
//             );
//           } else {
//             Alert.alert(
//               'Error',
//               'Failed to load the shared lead. Please try again.',
//               [{ text: 'OK' }]
//             );
//           }
//         }
//       }
//     };

//     // Handle initial URL
//     Linking.getInitialURL().then((url) => { 
//       if (url && leads.length > 0) {
//         handleDeepLink({ url }); 
//       }
//     });

//     // Handle URLs when app is already open
//     const subscription = Linking.addEventListener('url', handleDeepLink);
    
//     return () => subscription.remove();
//   }, [leads]); // Re-run when leads change

//   // Handle scroll to index failure (if index is out of view)
//   const onScrollToIndexFailed = (info: { index: number; averageItemLength: number }) => {
//     console.log('Scroll to index failed:', info);
    
//     // Wait a bit and try again with offset
//     setTimeout(() => {
//       flatListRef.current?.scrollToOffset({
//         offset: info.averageItemLength * info.index,
//         animated: true,
//       });
//     }, 100);
//   };

//   // Handlers
//   const handleReferClick = async () => {
//     setShowReferralModal(true);
//   };

//   const handleCopyLink = async () => {
//     if (quotaData?.referralCode) {
//       const link = `https://bizzap.app/signup?ref=${quotaData.referralCode}`;
//       await Clipboard.setStringAsync(link);
//       Alert.alert('Success', 'Referral link copied to clipboard!');
//     }
//   };

//   const handleShareLink = async () => {
//     if (quotaData?.referralCode) {
//       const link = `https://bizzap.app/signup?ref=${quotaData.referralCode}`;
//       await Share.share({ message: `Join Bizzap and get bonus leads! Code: ${quotaData.referralCode}\n${link}` });
//     }
//   };

//   // Helper function to get quota status
//   const getQuotaStatus = (remaining: number, total: number) => {
//     const used = total - remaining;
//     const percentage = (remaining / total) * 100;
    
//     if (remaining === 0) {
//       return {
//         statusText: 'No leads to consume',
//         statusColor: '#DC2626',
//         progressColor: '#DC2626',
//         showWarning: true,
//         warningMessage: "You've used all your leads"
//       };
//     } else if (percentage <= 20) {
//       return {
//         statusText: `${used}/${total} leads used`,
//         statusColor: '#EA580C',
//         progressColor: '#EA580C',
//         showWarning: true,
//         warningMessage: "You're almost running out of leads"
//       };
//     } else if (percentage <= 50) {
//       return {
//         statusText: `${used}/${total} leads used`,
//         statusColor: '#F59E0B',
//         progressColor: '#F59E0B',
//         showWarning: false,
//         warningMessage: ''
//       };
//     } else {
//       return {
//         statusText: `${used}/${total} leads used`,
//         statusColor: '#10B981',
//         progressColor: '#00D1B2',
//         showWarning: false,
//         warningMessage: ''
//       };
//     }
//   };

//   // Render header
//   const renderHeader = () => {
//     const displayImage = userProfile?.userPhoto || userProfile?.logo;
//     const displayInitial = (userProfile?.userName || userProfile?.companyName || 'B').charAt(0).toUpperCase();

//     if (!quotaData) return <View style={{ height: sizeScale(20) }} />; 

//     const { remainingLeads, totalLeadQuota, daysUntilReset } = quotaData;
//     const usedLeads = totalLeadQuota - remainingLeads;
//     const quotaStatus = getQuotaStatus(remainingLeads, totalLeadQuota);

//     return (
//       <View>
//         {/* Scrollable Nav Bar */}
//         <View style={[
//             styles.navRow, 
//             { paddingTop: Math.max(insets.top, 20) + sizeScale(12) }
//         ]}>
//             <Text style={styles.navTitle}>Leads</Text>
//             <TouchableOpacity 
//                 style={styles.profileContainer}
//                 onPress={() => router.push('/(app)/profile')}
//             >
//                 {displayImage ? (
//                     <Image source={{ uri: displayImage }} style={styles.profileThumb} />
//                 ) : (
//                     <View style={[styles.profileThumb, styles.profilePlaceholder]}>
//                         <Text style={styles.profileInitial}>{displayInitial}</Text>
//                     </View>
//                 )}
//             </TouchableOpacity>
//         </View>

//         {/* Quota Card */}
//         <View style={styles.headerArea}>
//           <View style={styles.quotaCard}>
//             <View style={styles.quotaRow}>
//               <Text style={styles.quotaText}>
//                 <Text style={[styles.statusText, { color: quotaStatus.statusColor }]}>
//                   {quotaStatus.statusText}
//                 </Text>
//               </Text>
//               <Text style={styles.expiryText}>
//                 Expire in: <Text style={styles.boldWhite}>{daysUntilReset} Days</Text>
//               </Text>
//             </View>

//             <View style={styles.progressTrack}>
//               <View 
//                 style={[
//                   styles.progressFill, 
//                   { 
//                     width: `${(usedLeads / totalLeadQuota) * 100}%`,
//                     backgroundColor: quotaStatus.progressColor
//                   }
//                 ]} 
//               />
//             </View>

//             {quotaStatus.showWarning && (
//               <View style={styles.warningBox}>
//                 <View style={styles.warningRow}>
//                   <AlertTriangle size={sizeScale(16)} color={quotaStatus.statusColor} /> 
//                   <Text style={[styles.warningTitle, { color: quotaStatus.statusColor }]}>
//                     {quotaStatus.warningMessage}
//                   </Text>
//                 </View>
//                 <Text style={styles.warningSubtext}>Refer to get more leads.</Text>
//               </View>
//             )}

//             <TouchableOpacity 
//               style={styles.getMoreBtn}
//               onPress={handleReferClick}
//             >
//               <Text style={styles.getMoreText}>Get More Leads</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator color="#0057D9" size="large" />
//       </View>
//     );
//   }

//   // Get item layout for better scroll performance
//   const getItemLayout = (data: any, index: number) => ({
//     length: 280, // Approximate height of a LeadCard
//     offset: 280 * index,
//     index,
//   });

//   return (
//     <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
//       <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
//       <FlatList
//         ref={flatListRef}
//         data={leads}
//         keyExtractor={(item) => item.id}
//         ListHeaderComponent={renderHeader}
//         renderItem={({ item }) => {
//           const isHighlighted = highlightedLeadId === item.id;
          
//           return (
//             <Animated.View
//               style={[
//                 isHighlighted && {
//                   opacity: highlightAnimation.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [1, 0.7],
//                   }),
//                   transform: [
//                     {
//                       scale: highlightAnimation.interpolate({
//                         inputRange: [0, 1],
//                         outputRange: [1, 1.02],
//                       }),
//                     },
//                   ],
//                 },
//               ]}
//             >
//               <View style={[isHighlighted && styles.highlightedCard]}>
//                 <LeadCard 
//                   lead={item} 
//                   onConsumeSuccess={() => fetchData(true)}
//                   remainingLeads={quotaData?.remainingLeads}
//                 />
//               </View>
//             </Animated.View>
//           );
//         }}
//         contentContainerStyle={styles.listContent}
//         refreshControl={
//           <RefreshControl 
//             refreshing={isRefreshing} 
//             onRefresh={() => { setIsRefreshing(true); fetchData(true); }}
//             tintColor="#0057D9"
//             colors={['#0057D9']}
//           />
//         }
//         getItemLayout={getItemLayout}
//         onScrollToIndexFailed={onScrollToIndexFailed}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={10}
//         removeClippedSubviews={true}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <View style={styles.emptyIconCircle}><Gift size={48} color="#00D1B2" /></View>
//             <Text style={styles.emptyTitle}>No Leads Available Right Now</Text>
//             <Text style={styles.emptyText}>Share Bizzap with friends to help them post leads!</Text>
//             <TouchableOpacity style={styles.emptyReferBtn} onPress={handleReferClick}>
//               <Gift size={18} color="#FFF" style={{ marginRight: 8 }} />
//               <Text style={styles.emptyReferText}>Invite Friends Now</Text>
//             </TouchableOpacity>
//           </View>
//         }
//       />

//       {/* Referral Modal */}
//       <Modal visible={showReferralModal} transparent animationType="slide" onRequestClose={() => setShowReferralModal(false)}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.referralCard}>
//             <TouchableOpacity style={styles.closeButton} onPress={() => setShowReferralModal(false)}>
//               <X size={24} color="#94A3B8" />
//             </TouchableOpacity>
//             <View style={styles.giftIconCircle}><Gift size={40} color="#0057D9" /></View>
//             <Text style={styles.modalTitle}>Share & Earn Leads</Text>
//             <Text style={styles.modalDesc}>Invite friends to join Bizzap. You get <Text style={styles.highlightText}>2 bonus leads</Text> when they sign up!</Text>
//             <View style={styles.codeContainer}>
//               <Text style={styles.codeLabel}>Your Referral Code</Text>
//               <Text style={styles.codeValue}>{quotaData?.referralCode}</Text>
//             </View>
//             <View style={styles.modalActions}>
//               <TouchableOpacity style={styles.btnCopy} onPress={handleCopyLink}><Text style={styles.btnCopyText}>Copy Link</Text></TouchableOpacity>
//               <TouchableOpacity style={styles.btnShare} onPress={handleShareLink}><Text style={styles.btnShareText}>Share</Text></TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#000000',
//   },
//   navRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: sizeScale(16),
//     paddingBottom: sizeScale(24), 
//     marginBottom: sizeScale(16),
//     backgroundColor: '#121924',
//   },
//   navTitle: {
//     color: '#FFFFFF',
//     fontSize: sizeScale(24),
//     fontWeight: '700',
//     fontFamily: 'Outfit',
//   },
//   profileContainer: {
//     borderRadius: sizeScale(16),
//     overflow: 'hidden',
//   },
//   profileThumb: {
//     width: sizeScale(32),
//     height: sizeScale(32),
//     borderRadius: sizeScale(16),
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   profilePlaceholder: {
//     backgroundColor: '#8b5cf6',
//   },
//   profileInitial: {
//     fontSize: sizeScale(14),
//     fontWeight: '700',
//     color: '#fff',
//   },
//   headerArea: { 
//     paddingHorizontal: sizeScale(16), 
//     paddingBottom: sizeScale(16),
//   },
//   quotaCard: { 
//     width: '100%', 
//     borderRadius: sizeScale(12), 
//     padding: sizeScale(16), 
//     backgroundColor: '#111827',
//     borderWidth: 1,
//     borderColor: '#1F2937',
//   },
//   quotaRow: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center', 
//     marginBottom: sizeScale(12),
//   },
//   quotaText: { 
//     fontSize: sizeScale(16),
//     fontWeight: '500',
//   },
//   statusText: {
//     fontWeight: '700',
//   },
//   expiryText: { 
//     color: '#9CA3AF', 
//     fontSize: sizeScale(14), 
//   },
//   boldWhite: {
//     color: '#FFFFFF',
//     fontWeight: '700',
//   },
//   progressTrack: { 
//     height: sizeScale(6), 
//     backgroundColor: '#374151', 
//     borderRadius: sizeScale(3), 
//     marginBottom: sizeScale(16),
//     overflow: 'hidden',
//   },
//   progressFill: { 
//     height: '100%', 
//     borderRadius: sizeScale(3),
//   },
//   warningBox: {
//     backgroundColor: 'rgba(69, 26, 3, 0.6)',
//     borderWidth: 1,
//     borderColor: '#7C2D12',
//     borderRadius: sizeScale(8),
//     padding: sizeScale(12),
//     marginBottom: sizeScale(16),
//   },
//   warningRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: sizeScale(4),
//     gap: sizeScale(8),
//   },
//   warningTitle: {
//     fontSize: sizeScale(14),
//     fontWeight: '600',
//   },
//   warningSubtext: {
//     color: '#9CA3AF',
//     fontSize: sizeScale(13),
//     marginLeft: sizeScale(24), 
//   },
//   getMoreBtn: { 
//     width: '100%',
//     height: sizeScale(44), 
//     backgroundColor: '#EA580C',
//     borderRadius: sizeScale(8), 
//     justifyContent: 'center', 
//     alignItems: 'center',
//   },
//   getMoreText: { 
//     color: '#FFFFFF', 
//     fontSize: sizeScale(15), 
//     fontWeight: '600',
//   },
//   listContent: { 
//     paddingBottom: sizeScale(120),
//   },
//   highlightedCard: {
//     backgroundColor: 'rgba(0, 87, 217, 0.15)',
//     borderRadius: 14,
//     borderWidth: 2,
//     borderColor: '#0057D9',
//     marginHorizontal: -2,
//     padding: 2,
//     shadowColor: '#0057D9',
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.5,
//     shadowRadius: 10,
//     elevation: 8,
//   },
//   centered: { 
//     flex: 1, 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     backgroundColor: '#000000',
//   },
//   emptyContainer: {
//     paddingVertical: sizeScale(60),
//     paddingHorizontal: sizeScale(24),
//     alignItems: 'center',
//   },
//   emptyIconCircle: {
//     width: sizeScale(96),
//     height: sizeScale(96),
//     borderRadius: sizeScale(48),
//     backgroundColor: 'rgba(0, 209, 178, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: sizeScale(20),
//   },
//   emptyTitle: {
//     fontSize: sizeScale(20),
//     fontWeight: '700',
//     color: '#FFF',
//     marginBottom: sizeScale(12),
//     fontFamily: 'Outfit',
//     textAlign: 'center',
//   },
//   emptyText: {
//     color: '#94A3B8',
//     fontSize: sizeScale(14),
//     textAlign: 'center',
//     lineHeight: sizeScale(22),
//     marginBottom: sizeScale(24),
//   },
//   emptyReferBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#0057D9',
//     paddingHorizontal: sizeScale(24),
//     paddingVertical: sizeScale(12),
//     borderRadius: sizeScale(8),
//   },
//   emptyReferText: {
//     color: '#FFF',
//     fontSize: sizeScale(14),
//     fontWeight: '600',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   referralCard: {
//     width: '100%',
//     maxWidth: 340,
//     backgroundColor: '#1E293B',
//     borderRadius: 16,
//     padding: 24,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#30363D',
//   },
//   closeButton: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     padding: 8,
//   },
//   giftIconCircle: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: 'rgba(0, 87, 217, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   modalTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#FFF',
//     marginBottom: 12,
//     fontFamily: 'Outfit',
//   },
//   modalDesc: {
//     fontSize: 14,
//     color: '#94A3B8',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },
//   highlightText: {
//     color: '#00D1B2',
//     fontWeight: '700',
//   },
//   codeContainer: {
//     width: '100%',
//     backgroundColor: '#0F1417',
//     borderRadius: 8,
//     padding: 16,
//     alignItems: 'center',
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: '#495565',
//   },
//   codeLabel: {
//     fontSize: 12,
//     color: '#8B949E',
//     marginBottom: 8,
//   },
//   codeValue: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#00D1B2',
//     letterSpacing: 2,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     width: '100%',
//     gap: 12,
//   },
//   btnCopy: {
//     flex: 1,
//     height: 44,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#0057D9',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   btnCopyText: {
//     color: '#0057D9',
//     fontWeight: '600',
//   },
//   btnShare: {
//     flex: 1,
//     height: 44,
//     borderRadius: 8,
//     backgroundColor: '#0057D9',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   btnShareText: {
//     color: '#FFF',
//     fontWeight: '600',
//   },
// });

// app/(app)/dashboard/index.tsx

import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, Gift, X, Copy, Heart, Share2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    RefreshControl,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    StatusBar,
    Animated,
    TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient'; // Added for Glassmorphism
import { LeadCard } from '../../../components/cards/lead-card';
import { Lead, leadsAPI } from '../../../services/leads';
import { companyAPI, LeadQuotaData } from '../../../services/user';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotaData, setQuotaData] = useState<LeadQuotaData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const hasInitialFetchRef = useRef(false);
  const hasHandledDeepLinkRef = useRef(false);
  const highlightAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current; // For Drawer

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
    if (!hasInitialFetchRef.current) {
      hasInitialFetchRef.current = true;
      fetchData();
    }
  }, []);

  // Modal Animation Logic
  useEffect(() => {
    if (showReferralModal) {
      Animated.spring(slideAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showReferralModal]);

  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const scrollToLead = (leadId: string) => {
    if (!leads || leads.length === 0) return;
    const leadIndex = leads.findIndex(l => l.id === leadId);
    if (leadIndex === -1) {
      Alert.alert('Lead Not Available', 'This lead might have been consumed or is inactive.', [{ text: 'OK' }]);
      return;
    }
    setHighlightedLeadId(leadId);
    Animated.loop(
      Animated.sequence([
        Animated.timing(highlightAnimation, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(highlightAnimation, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      { iterations: 3 }
    ).start(() => {
      setTimeout(() => setHighlightedLeadId(null), 500);
    });
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: leadIndex, animated: true, viewPosition: 0.5 });
    }, 300);
  };

  useEffect(() => {
    const leadIdFromParams = params.leadId as string | undefined;
    if (leadIdFromParams && !hasHandledDeepLinkRef.current && leads.length > 0) {
      hasHandledDeepLinkRef.current = true;
      setTimeout(() => scrollToLead(leadIdFromParams), 500);
    }
  }, [params.leadId, leads]);

  const onScrollToIndexFailed = (info: { index: number; averageItemLength: number }) => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
    }, 100);
  };

  const handleReferClick = async () => {
    setShowReferralModal(true);
  };

  const handleCopyLink = async () => {
    if (quotaData?.referralCode) {
      const link = `${quotaData.referralCode}`;
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

  const getQuotaStatus = (remaining: number, total: number) => {
    const used = total - remaining;
    const percentage = (remaining / total) * 100;
    
    if (remaining === 0) {
      return { statusText: 'No leads to consume', statusColor: '#DC2626', progressColor: '#DC2626', showWarning: true, warningMessage: "You've used all your leads" };
    } else if (percentage <= 20) {
      return { statusText: `${used}/${total} leads used`, statusColor: '#EA580C', progressColor: '#EA580C', showWarning: true, warningMessage: "You're almost running out of leads" };
    } else {
      return { statusText: `${used}/${total} leads used`, statusColor: '#10B981', progressColor: '#00D1B2', showWarning: false, warningMessage: '' };
    }
  };

  const renderHeader = () => {
    const displayImage = userProfile?.userPhoto || userProfile?.logo;
    const displayInitial = (userProfile?.userName || userProfile?.companyName || 'B').charAt(0).toUpperCase();

    if (!quotaData) return <View style={{ height: sizeScale(20) }} />; 

    const { remainingLeads, totalLeadQuota, daysUntilReset } = quotaData;
    const usedLeads = totalLeadQuota - remainingLeads;
    const quotaStatus = getQuotaStatus(remainingLeads, totalLeadQuota);

    return (
      <View>
        <View style={[styles.navRow, { paddingTop: Math.max(insets.top, 20) + sizeScale(12) }]}>
            <Text style={styles.navTitle}>Leads</Text>
            <TouchableOpacity style={styles.profileContainer} onPress={() => router.push('/(app)/profile')}>
                {displayImage ? (
                    <Image source={{ uri: displayImage }} style={styles.profileThumb} />
                ) : (
                    <View style={[styles.profileThumb, styles.profilePlaceholder]}><Text style={styles.profileInitial}>{displayInitial}</Text></View>
                )}
            </TouchableOpacity>
        </View>

        <View style={styles.headerArea}>
          <View style={styles.quotaCard}>
            <View style={styles.quotaRow}>
              <Text style={styles.quotaText}>
                <Text style={[styles.statusText, { color: quotaStatus.statusColor }]}>{quotaStatus.statusText}</Text>
              </Text>
              <Text style={styles.expiryText}>Expire in: <Text style={styles.boldWhite}>{daysUntilReset} Days</Text></Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(usedLeads / totalLeadQuota) * 100}%`, backgroundColor: quotaStatus.progressColor }]} />
            </View>

            {quotaStatus.showWarning && (
              <View style={styles.warningBox}>
                <View style={styles.warningRow}>
                  <AlertTriangle size={sizeScale(16)} color={quotaStatus.statusColor} /> 
                  <Text style={[styles.warningTitle, { color: quotaStatus.statusColor }]}>{quotaStatus.warningMessage}</Text>
                </View>
                <Text style={styles.warningSubtext}>Refer to get more leads.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.getMoreBtn} onPress={handleReferClick}>
              <Text style={styles.getMoreText}>Get More Leads</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}><ActivityIndicator color="#0057D9" size="large" /></View>
    );
  }

  const getItemLayout = (data: any, index: number) => ({ length: 280, offset: 280 * index, index });

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <FlatList
        ref={flatListRef}
        data={leads}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => {
          const isHighlighted = highlightedLeadId === item.id;
          return (
            <Animated.View style={[isHighlighted && { opacity: highlightAnimation.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }), transform: [{ scale: highlightAnimation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }] }]}>
              <View style={[isHighlighted && styles.highlightedCard]}>
                <LeadCard lead={item} onConsumeSuccess={() => fetchData(true)} remainingLeads={quotaData?.remainingLeads} />
              </View>
            </Animated.View>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchData(true); }} tintColor="#0057D9" colors={['#0057D9']} />}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={onScrollToIndexFailed}
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

      {/* Referral Bottom Drawer Modal */}
      <Modal visible={showReferralModal} transparent animationType="fade" onRequestClose={() => setShowReferralModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReferralModal(false)}>
          <Animated.View 
            style={[
              styles.drawerContent, 
              { transform: [{ translateY }], paddingBottom: Math.max(insets.bottom, 24) + 20 }
            ]}
          >
            <TouchableWithoutFeedback>
              <View style={{ width: '100%', alignItems: 'center' }}>
                {/* Drag Handle */}
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>

                {/* Illustration Card with Gradient */}
                <LinearGradient
                  colors={['#0F1F30', '#070C12']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.illustrationCard}
                >
                  <Image 
                    source={{ uri: "https://image2url.com/r2/default/images/1769168212199-7bbc9f46-ccbd-472f-837b-388d48ef4f10.webp" }}
                    style={styles.drawerImage}
                    resizeMode="contain"
                  />
                </LinearGradient>

                {/* Referral Code Input */}
                <View style={styles.refInputContainer}>
                  <Text style={styles.refCodeText}>{quotaData?.referralCode || '------'}</Text>
                  <TouchableOpacity onPress={handleCopyLink} style={styles.copyIconBtn}>
                     <Copy size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Title & Description */}
                <View style={styles.textGroup}>
                  <View style={styles.titleRow}>
                      <Text style={styles.titleWhite}>You </Text>
                      <Heart size={20} color="#EF4444" fill="#EF4444" />
                      <Text style={styles.titleWhite}> Bizzap</Text>
                  </View>
                  <Text style={styles.descText}>
                      Your friends are going to love us too! Refer & Win up to 5 Leads.
                  </Text>
                </View>

                {/* Share Button */}
                <TouchableOpacity style={styles.shareBtnFull} onPress={handleShareLink} activeOpacity={0.8}>
                  <Share2 size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.shareBtnText}>Share to your friends</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  // ... (Existing styles)
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: sizeScale(16), paddingBottom: sizeScale(24), marginBottom: sizeScale(16), backgroundColor: '#121924' },
  navTitle: { color: '#FFFFFF', fontSize: sizeScale(24), fontWeight: '700', fontFamily: 'Outfit' },
  profileContainer: { borderRadius: sizeScale(16), overflow: 'hidden' },
  profileThumb: { width: sizeScale(32), height: sizeScale(32), borderRadius: sizeScale(16), justifyContent: 'center', alignItems: 'center' },
  profilePlaceholder: { backgroundColor: '#8b5cf6' },
  profileInitial: { fontSize: sizeScale(14), fontWeight: '700', color: '#fff' },
  headerArea: { paddingHorizontal: sizeScale(16), paddingBottom: sizeScale(16) },
  quotaCard: { width: '100%', borderRadius: sizeScale(12), padding: sizeScale(16), backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2937' },
  quotaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sizeScale(12) },
  quotaText: { fontSize: sizeScale(16), fontWeight: '500' },
  statusText: { fontWeight: '700' },
  expiryText: { color: '#9CA3AF', fontSize: sizeScale(14) },
  boldWhite: { color: '#FFFFFF', fontWeight: '700' },
  progressTrack: { height: sizeScale(6), backgroundColor: '#374151', borderRadius: sizeScale(3), marginBottom: sizeScale(16), overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: sizeScale(3) },
  warningBox: { backgroundColor: 'rgba(69, 26, 3, 0.6)', borderWidth: 1, borderColor: '#7C2D12', borderRadius: sizeScale(8), padding: sizeScale(12), marginBottom: sizeScale(16) },
  warningRow: { flexDirection: 'row', alignItems: 'center', marginBottom: sizeScale(4), gap: sizeScale(8) },
  warningTitle: { fontSize: sizeScale(14), fontWeight: '600' },
  warningSubtext: { color: '#9CA3AF', fontSize: sizeScale(13), marginLeft: sizeScale(24) },
  getMoreBtn: { width: '100%', height: sizeScale(44), backgroundColor: '#EA580C', borderRadius: sizeScale(8), justifyContent: 'center', alignItems: 'center' },
  getMoreText: { color: '#FFFFFF', fontSize: sizeScale(15), fontWeight: '600' },
  listContent: { paddingBottom: sizeScale(120) },
  highlightedCard: { backgroundColor: 'rgba(0, 87, 217, 0.15)', borderRadius: 14, borderWidth: 2, borderColor: '#0057D9', marginHorizontal: -2, padding: 2, elevation: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  emptyContainer: { paddingVertical: sizeScale(60), paddingHorizontal: sizeScale(24), alignItems: 'center' },
  emptyIconCircle: { width: sizeScale(96), height: sizeScale(96), borderRadius: sizeScale(48), backgroundColor: 'rgba(0, 209, 178, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: sizeScale(20) },
  emptyTitle: { fontSize: sizeScale(20), fontWeight: '700', color: '#FFF', marginBottom: sizeScale(12), fontFamily: 'Outfit', textAlign: 'center' },
  emptyText: { color: '#94A3B8', fontSize: sizeScale(14), textAlign: 'center', lineHeight: sizeScale(22), marginBottom: sizeScale(24) },
  emptyReferBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0057D9', paddingHorizontal: sizeScale(24), paddingVertical: sizeScale(12), borderRadius: sizeScale(8) },
  emptyReferText: { color: '#FFF', fontSize: sizeScale(14), fontWeight: '600' },

  // --- Referral Drawer Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end', // Align to bottom
  },
  drawerContent: {
    backgroundColor: '#0B1015',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    borderBottomWidth: 0,
    alignItems: 'center',
    width: '100%',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  illustrationCard: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  drawerImage: {
    width: '80%',
    height: '80%',
  },
  refInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161C24',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 12,
    width: '100%',
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  refCodeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  copyIconBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  textGroup: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWhite: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  descText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  shareBtnFull: {
    width: '100%',
    height: 52,
    backgroundColor: '#0057D9',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});