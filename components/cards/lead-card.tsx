// // components/cards/lead-card.tsx
// import { useRouter } from 'expo-router';
// import { MessageCircle, Share2, X, Gift } from 'lucide-react-native';
// import React, { useState, useEffect } from 'react';
// import {
//     ActivityIndicator,
//     Alert,
//     Dimensions,
//     Image,
//     Modal,
//     Share,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     useWindowDimensions,
//     View
// } from 'react-native';
// import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
// import { chatAPI } from '../../services/chat-websocket';
// import { Lead, leadsAPI } from '../../services/leads';
// import { companyAPI } from '../../services/user';

// const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// interface LeadCardProps {
//   lead: Lead;
//   onConsumeSuccess?: () => void;
//   remainingLeads?: number; // Pass from parent to avoid refetching
// }

// // Gradient Icon Components
// const GradientMapPin = ({ size = 16 }: { size?: number }) => (
//   <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
//     <Defs>
//       <LinearGradient id="mapPinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
//         <Stop offset="50%" stopColor="#003E9C" stopOpacity="1" />
//         <Stop offset="50%" stopColor="#01BE8B" stopOpacity="1" />
//       </LinearGradient>
//     </Defs>
//     <Path
//       d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
//       stroke="url(#mapPinGradient)"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />
//     <Circle
//       cx="12"
//       cy="10"
//       r="3"
//       stroke="url(#mapPinGradient)"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />
//   </Svg>
// );

// const GradientClock = ({ size = 16 }: { size?: number }) => (
//   <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
//     <Defs>
//       <LinearGradient id="clockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
//         <Stop offset="50%" stopColor="#003E9C" stopOpacity="1" />
//         <Stop offset="50%" stopColor="#01BE8B" stopOpacity="1" />
//       </LinearGradient>
//     </Defs>
//     <Circle
//       cx="12"
//       cy="12"
//       r="10"
//       stroke="url(#clockGradient)"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />
//     <Path
//       d="M12 6v6l4 2"
//       stroke="url(#clockGradient)"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />
//   </Svg>
// );

// // Time formatting helper
// const formatTimeAgo = (dateString: string): string => {
//   const now = new Date();
//   const past = new Date(dateString);
//   const diffMs = now.getTime() - past.getTime();
//   const diffMins = Math.floor(diffMs / 60000);
//   const diffHours = Math.floor(diffMins / 60);
//   const diffDays = Math.floor(diffHours / 24);

//   if (diffMins < 1) return 'Just now';
//   if (diffMins < 60) return `${diffMins}m ago`;
//   if (diffHours < 24) return `${diffHours}h ago`;
//   if (diffDays === 1) return 'Yesterday';
//   if (diffDays < 7) return `${diffDays}d ago`;
  
//   const options: Intl.DateTimeFormatOptions = { 
//     month: 'short', 
//     day: 'numeric',
//     year: past.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
//   };
//   return past.toLocaleDateString('en-US', options);
// };

// export const LeadCard = ({ lead, onConsumeSuccess, remainingLeads: propRemainingLeads }: LeadCardProps) => {
//   const router = useRouter();
//   const [expanded, setExpanded] = useState(false);
//   const [imageZoomed, setImageZoomed] = useState(false);
//   const [showConsumeModal, setShowConsumeModal] = useState(false);
//   const [showReferralModal, setShowReferralModal] = useState(false);
//   const [isConsuming, setIsConsuming] = useState(false);
//   const [remainingLeads, setRemainingLeads] = useState<number | null>(propRemainingLeads ?? null);
//   const [referralCode, setReferralCode] = useState<string>('');
  
//   const { width: screenWidth } = useWindowDimensions();
//   const cardWidth = Math.min(screenWidth - 32, 400);

//   // Fetch remaining leads if not provided
//   useEffect(() => {
//     if (propRemainingLeads === undefined) {
//       fetchQuota();
//     }
//   }, [propRemainingLeads]);

//   const fetchQuota = async () => {
//     try {
//       const quotaResponse = await companyAPI.getLeadQuota();
//       if (quotaResponse.status === 'success') {
//         setRemainingLeads(quotaResponse.data.remainingLeads);
//         setReferralCode(quotaResponse.data.referralCode);
//       }
//     } catch (error) {
//       console.error('Error fetching quota:', error);
//     }
//   };

//   // --- Generate Deep Link ---
//   const generateLeadLink = () => {
//     return `https://bizzap.app/dashboard?leadId=${lead.id}`;
//   };

//   // --- Share Handler ---
//   const handleShare = async () => {
//     try {
//       const leadLink = generateLeadLink();
      
//       const message = `🔥 Check out this lead on Bizzap!\n\n` +
//         `${lead.title}\n` +
//         `📍 ${lead.location || 'Location not specified'}\n` +
//         `💰 ${lead.budget ? `Budget: ${lead.budget}` : 'Budget: Negotiable'}\n\n` +
//         `View full details: ${leadLink}`;

//       await Share.share({
//         message,
//         title: `Lead: ${lead.title}`,
//         url: leadLink,
//       });
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   // --- Chat/Consume Logic ---
//   const handleChatPress = () => {
//     // Check if user has remaining leads
//     if (remainingLeads !== null && remainingLeads <= 0) {
//       // Show referral modal instead of consume modal
//       setShowReferralModal(true);
//     } else {
//       // Show consume confirmation modal
//       setShowConsumeModal(true);
//     }
//   };

//   const confirmConsumption = async () => {
//     try {
//       setIsConsuming(true);

//       const consumeResponse = await leadsAPI.consumeLead(lead.id);

//       if (consumeResponse.status === 'success') {
        
//         // Check if consumption was actually successful
//         if (consumeResponse.data?.message === 'Insufficient leads to consume') {
//           // User ran out of leads
//           setIsConsuming(false);
//           setShowConsumeModal(false);
//           setShowReferralModal(true);
//           return;
//         }

//         if (onConsumeSuccess) {
//           onConsumeSuccess();
//         }

//         const starterMessage = `Hello, I saw your lead "${lead.title}" in ${lead.location || 'your area'} and would like to discuss the requirements.`;
        
//         try {
//             await chatAPI.sendMessage({
//                 receiverId: lead.companyId,
//                 message: starterMessage,
//                 messageType: 'text'
//             });
//         } catch (msgError) {
//             console.warn("Failed to send auto-message, navigating anyway", msgError);
//         }

//         setShowConsumeModal(false);
//         setIsConsuming(false);

//         router.push({
//             pathname: '/(app)/chat/[companyId]',
//             params: { companyId: lead.companyId }
//         });
//       }
//     } catch (error: any) {
//       setIsConsuming(false);
//       setShowConsumeModal(false);
      
//       const msg = error.message || 'Failed to consume lead. Please check your quota.';
      
//       // If error message indicates insufficient leads, show referral modal
//       if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('quota')) {
//         setShowReferralModal(true);
//       } else {
//         Alert.alert('Error', msg);
//       }
//     }
//   };

//   const handleCopyLink = async () => {
//     if (referralCode) {
//       const link = `https://bizzap.app/signup?ref=${referralCode}`;
//       await Clipboard.setStringAsync(link);
//       Alert.alert('Success', 'Referral link copied to clipboard!');
//     }
//   };

//   const handleShareLink = async () => {
//     if (referralCode) {
//       const link = `https://bizzap.app/signup?ref=${referralCode}`;
//       await Share.share({ 
//         message: `Join Bizzap and get bonus leads! Code: ${referralCode}\n${link}` 
//       });
//     }
//   };

//   return (
//     <>
//       <View style={[styles.cardOuter, { width: cardWidth }]}>
//         {/* Title Section */}
//         <TouchableOpacity 
//           style={styles.titleSection} 
//           onPress={() => setExpanded(!expanded)} 
//           activeOpacity={0.8}
//         >
//           <Text style={styles.mainTitle} numberOfLines={expanded ? undefined : 2}>
//             {lead.title}
//           </Text>
//           <View style={styles.metaRow}>
//             <View style={styles.metaGroup}>
//               <GradientMapPin size={16} />
//               <Text style={styles.metaLabel} numberOfLines={1}>
//                 {lead.location || 'Location not specified'}
//               </Text>
//             </View>
//             <View style={styles.metaGroup}>
//               <GradientClock size={16} />
//               <Text style={styles.metaLabel} numberOfLines={1}>
//                 {formatTimeAgo(lead.createdAt)}
//               </Text>
//             </View>
//           </View>
//         </TouchableOpacity>

//         {/* Details Body */}
//         <View style={styles.detailBody}>
//           <TouchableOpacity onPress={() => setImageZoomed(true)} activeOpacity={0.8}>
//             <Image 
//                 source={{ uri: lead.imageUrl || 'https://via.placeholder.com/72' }} 
//                 style={styles.leadThumb} 
//             />
//           </TouchableOpacity>
          
//           <View style={styles.statsContainer}>
//             <View style={styles.statCol}>
//               <Text style={styles.sLabel} numberOfLines={1}>Quantity</Text>
//               <Text style={styles.sValue} numberOfLines={1}>
//                 {lead.quantity || 'N/A'}
//               </Text>
//             </View>
//             <View style={styles.divider} />
//             <View style={styles.statCol}>
//               <Text style={styles.sLabel} numberOfLines={1}>Budget</Text>
//               <Text style={styles.sValue} numberOfLines={1}>
//                 {lead.budget ? `₹${lead.budget}` : 'Negotiable'}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Footer Bar */}
//         <View style={styles.footerBar}>
//           <View style={styles.utilIcons}>
//             <TouchableOpacity 
//               onPress={handleShare}
//               style={styles.iconButton}
//             >
//               <Share2 size={24} color="#FFF" strokeWidth={2} />
//             </TouchableOpacity>
//           </View>
          
//           <TouchableOpacity 
//             style={styles.chatAction}
//             onPress={handleChatPress}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.chatText}>
//               {remainingLeads !== null && remainingLeads <= 0 ? 'Get More Leads' : 'Chat with Buyer'}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Image Zoom Modal */}
//       <Modal
//         visible={imageZoomed}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setImageZoomed(false)}
//       >
//         <View style={styles.modalContainer}>
//           <TouchableOpacity 
//             style={styles.modalBackground} 
//             activeOpacity={1} 
//             onPress={() => setImageZoomed(false)}
//           >
//             <TouchableOpacity style={styles.closeButton} onPress={() => setImageZoomed(false)}>
//               <X size={32} color="#FFF" strokeWidth={3} />
//             </TouchableOpacity>
//             <Image 
//               source={{ uri: lead.imageUrl || '' }} 
//               style={styles.zoomedImage}
//               resizeMode="contain"
//             />
//           </TouchableOpacity>
//         </View>
//       </Modal>

//       {/* Consume Confirmation Modal */}
//       <Modal
//         visible={showConsumeModal}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={() => !isConsuming && setShowConsumeModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//             <View style={styles.consumeCard}>
//                 <View style={styles.consumeIconCircle}>
//                     <MessageCircle size={32} color="#0057D9" />
//                 </View>
                
//                 <Text style={styles.consumeTitle}>Contact Buyer?</Text>
                
//                 <Text style={styles.consumeDesc}>
//                     Starting a conversation will consume <Text style={styles.highlightText}>1 Lead Credit</Text> from your monthly quota.
//                 </Text>

//                 <View style={styles.consumeActions}>
//                     <TouchableOpacity 
//                         style={styles.btnCancel}
//                         onPress={() => setShowConsumeModal(false)}
//                         disabled={isConsuming}
//                     >
//                         <Text style={styles.btnCancelText}>Cancel</Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity 
//                         style={styles.btnConfirm}
//                         onPress={confirmConsumption}
//                         disabled={isConsuming}
//                     >
//                         {isConsuming ? (
//                             <ActivityIndicator size="small" color="#FFF" />
//                         ) : (
//                             <Text style={styles.btnConfirmText}>Confirm & Chat</Text>
//                         )}
//                     </TouchableOpacity>
//                 </View>
//             </View>
//         </View>
//       </Modal>

//       {/* Referral Modal (No Leads Left) */}
//       <Modal
//         visible={showReferralModal}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={() => setShowReferralModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.referralCard}>
//             <TouchableOpacity 
//               style={styles.closeButton2} 
//               onPress={() => setShowReferralModal(false)}
//             >
//               <X size={24} color="#94A3B8" />
//             </TouchableOpacity>
            
//             <View style={styles.giftIconCircle}>
//               <Gift size={40} color="#0057D9" />
//             </View>
            
//             <Text style={styles.modalTitle}>Out of Lead Credits!</Text>
            
//             <Text style={styles.modalDesc}>
//               You've used all your leads for this month. Invite friends to join Bizzap and earn <Text style={styles.highlightText}>3 bonus leads</Text> per successful referral!
//             </Text>
            
//             {referralCode && (
//               <View style={styles.codeContainer}>
//                 <Text style={styles.codeLabel}>Your Referral Code</Text>
//                 <Text style={styles.codeValue}>{referralCode}</Text>
//               </View>
//             )}
            
//             <View style={styles.modalActions}>
//               <TouchableOpacity style={styles.btnCopy} onPress={handleCopyLink}>
//                 <Text style={styles.btnCopyText}>Copy Link</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.btnShare} onPress={handleShareLink}>
//                 <Text style={styles.btnShareText}>Share</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   cardOuter: {
//     backgroundColor: '#121924',
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//     alignSelf: 'center',
//   },
//   titleSection: {
//     width: '100%',
//     borderRadius: 8,
//     padding: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.03)',
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.15)',
//   },
//   mainTitle: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '700',
//     marginBottom: 8,
//     fontFamily: 'Outfit',
//     lineHeight: 22,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     gap: 8,
//     flexWrap: 'wrap',
//   },
//   metaGroup: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     flexShrink: 1,
//   },
//   metaLabel: {
//     color: '#8FA8CC',
//     fontSize: 12,
//     fontWeight: '700',
//     flexShrink: 1,
//   },
//   detailBody: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   leadThumb: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//     borderWidth: 2,
//     borderColor: '#595959',
//     backgroundColor: '#1E293B',
//   },
//   statsContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     marginLeft: 12,
//     justifyContent: 'space-around',
//     alignItems: 'center',
//   },
//   statCol: {
//     flex: 1,
//     alignItems: 'center',
//     gap: 3,
//     paddingHorizontal: 4,
//   },
//   divider: {
//     width: 1,
//     height: 38,
//     backgroundColor: '#595959',
//   },
//   sLabel: {
//     color: '#8FA8CC',
//     fontSize: 12,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   sValue: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   footerBar: {
//     height: 40,
//     backgroundColor: 'rgba(0, 87, 217, 0.17)',
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   utilIcons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   iconButton: {
//     width: 24,
//     height: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   chatAction: {
//     minWidth: 157,
//     backgroundColor: '#0057D9',
//     borderRadius: 4,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//   },
//   chatText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '700',
//     lineHeight: 20,
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.95)',
//   },
//   modalBackground: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   closeButton: {
//     position: 'absolute',
//     top: 60,
//     right: 20,
//     zIndex: 10,
//     width: 48,
//     height: 48,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     borderRadius: 24,
//   },
//   closeButton2: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     padding: 8,
//   },
//   zoomedImage: {
//     width: '100%',
//     height: SCREEN_HEIGHT * 0.8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   consumeCard: {
//     width: '100%',
//     maxWidth: 340,
//     backgroundColor: '#1E293B',
//     borderRadius: 16,
//     padding: 24,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#30363D',
//   },
//   consumeIconCircle: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: 'rgba(0, 87, 217, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   consumeTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#FFF',
//     marginBottom: 12,
//     fontFamily: 'Outfit',
//   },
//   consumeDesc: {
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
//   consumeActions: {
//     flexDirection: 'row',
//     width: '100%',
//     gap: 12,
//   },
//   btnCancel: {
//     flex: 1,
//     height: 44,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#475569',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   btnCancelText: {
//     color: '#FFF',
//     fontWeight: '600',
//   },
//   btnConfirm: {
//     flex: 1,
//     height: 44,
//     borderRadius: 8,
//     backgroundColor: '#0057D9',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   btnConfirmText: {
//     color: '#FFF',
//     fontWeight: '600',
//   },
//   // Referral Modal Styles
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



// components/cards/lead-card.tsx
import { useRouter } from 'expo-router';
import { MessageCircle, Share2, X, Gift } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard'; // Ensure Clipboard is imported if used
import { chatAPI } from '../../services/chat-websocket';
import { Lead, leadsAPI } from '../../services/leads';
import { companyAPI } from '../../services/user';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LeadCardProps {
  lead: Lead;
  onConsumeSuccess?: () => void;
  remainingLeads?: number; // Pass from parent to avoid refetching
}

// Gradient Icon Components
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

// Time formatting helper
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

export const LeadCard = ({ lead, onConsumeSuccess, remainingLeads: propRemainingLeads }: LeadCardProps) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const [remainingLeads, setRemainingLeads] = useState<number | null>(propRemainingLeads ?? null);
  const [referralCode, setReferralCode] = useState<string>('');
  
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(screenWidth - 32, 400);

  // Fetch remaining leads if not provided
  useEffect(() => {
    if (propRemainingLeads === undefined) {
      fetchQuota();
    } else {
      setRemainingLeads(propRemainingLeads);
    }
  }, [propRemainingLeads]);

  const fetchQuota = async () => {
    try {
      const quotaResponse = await companyAPI.getLeadQuota();
      if (quotaResponse.status === 'success') {
        setRemainingLeads(quotaResponse.data.remainingLeads);
        setReferralCode(quotaResponse.data.referralCode);
      }
    } catch (error) {
      console.error('Error fetching quota:', error);
    }
  };

  const generateLeadLink = () => {
    return `https://bizzap.app/dashboard?leadId=${lead.id}`;
  };

  const handleShare = async () => {
    try {
      const leadLink = generateLeadLink();
      const message = `🔥 Check out this lead on Bizzap!\n\n` +
        `${lead.title}\n` +
        `📍 ${lead.location || 'Location not specified'}\n` +
        `💰 ${lead.budget ? `Budget: ${lead.budget}` : 'Budget: Negotiable'}\n\n` +
        `View full details: ${leadLink}`;

      await Share.share({
        message,
        title: `Lead: ${lead.title}`,
        url: leadLink,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // --- Logic Update: Handling Interactions based on Quota ---
  const handleChatPress = () => {
    // If we definitely know user has 0 leads, open referral immediately
    if (remainingLeads !== null && remainingLeads <= 0) {
      setShowReferralModal(true);
    } else {
      // Otherwise ask for confirmation (API will double check)
      setShowConsumeModal(true);
    }
  };

  const confirmConsumption = async () => {
    try {
      setIsConsuming(true);

      const consumeResponse = await leadsAPI.consumeLead(lead.id);

      // Check if API says successful but message indicates insufficient leads
      if (
          consumeResponse.message === 'Insufficient leads to consume' || 
          consumeResponse.data?.message === 'Insufficient leads to consume'
      ) {
          // STOP PROCESS: Do not chat, do not navigate.
          setIsConsuming(false);
          setShowConsumeModal(false);
          // Show the referral modal to get more leads
          setShowReferralModal(true);
          return; 
      }

      // If genuine success
      if (consumeResponse.status === 'success') {
        
        if (onConsumeSuccess) {
          onConsumeSuccess();
        }

        // Only send message if consumption was truly successful
        const starterMessage = `Hello, I saw your lead "${lead.title}" in ${lead.location || 'your area'} and would like to discuss the requirements.`;
        
        try {
            await chatAPI.sendMessage({
                receiverId: lead.companyId,
                message: starterMessage,
                messageType: 'text'
            });
        } catch (msgError) {
            console.warn("Failed to send auto-message, navigating anyway", msgError);
        }

        setShowConsumeModal(false);
        setIsConsuming(false);

        router.push({
            pathname: '/(app)/chat/[companyId]',
            params: { companyId: lead.companyId }
        });
      }
    } catch (error: any) {
      setIsConsuming(false);
      setShowConsumeModal(false);
      
      const msg = error.message || 'Failed to consume lead.';
      
      // Fallback check if error text suggests quota limits
      if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('quota')) {
        setShowReferralModal(true);
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  const handleCopyLink = async () => {
    if (referralCode) {
      const link = `https://bizzap.app/signup?ref=${referralCode}`;
      await Clipboard.setStringAsync(link);
      Alert.alert('Success', 'Referral link copied to clipboard!');
    }
  };

  const handleShareLink = async () => {
    if (referralCode) {
      const link = `https://bizzap.app/signup?ref=${referralCode}`;
      await Share.share({ 
        message: `Join Bizzap and get bonus leads! Code: ${referralCode}\n${link}` 
      });
    }
  };

  return (
    <>
      <View style={[styles.cardOuter, { width: cardWidth }]}>
        {/* Title Section */}
        <TouchableOpacity 
          style={styles.titleSection} 
          onPress={() => setExpanded(!expanded)} 
          activeOpacity={0.8}
        >
          <Text style={styles.mainTitle} numberOfLines={expanded ? undefined : 2}>
            {lead.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaGroup}>
              <GradientMapPin size={16} />
              <Text style={styles.metaLabel} numberOfLines={1}>
                {lead.location || 'Location not specified'}
              </Text>
            </View>
            <View style={styles.metaGroup}>
              <GradientClock size={16} />
              <Text style={styles.metaLabel} numberOfLines={1}>
                {formatTimeAgo(lead.createdAt)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Details Body */}
        <View style={styles.detailBody}>
          <TouchableOpacity onPress={() => setImageZoomed(true)} activeOpacity={0.8}>
            <Image 
                source={{ uri: lead.imageUrl || 'https://via.placeholder.com/72' }} 
                style={styles.leadThumb} 
            />
          </TouchableOpacity>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCol}>
              <Text style={styles.sLabel} numberOfLines={1}>Quantity</Text>
              <Text style={styles.sValue} numberOfLines={1}>
                {lead.quantity || 'N/A'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statCol}>
              <Text style={styles.sLabel} numberOfLines={1}>Budget</Text>
              <Text style={styles.sValue} numberOfLines={1}>
                {lead.budget ? `₹${lead.budget}` : 'Negotiable'}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Bar */}
        <View style={styles.footerBar}>
          <View style={styles.utilIcons}>
            <TouchableOpacity 
              onPress={handleShare}
              style={styles.iconButton}
            >
              <Share2 size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.chatAction}
            onPress={handleChatPress}
            activeOpacity={0.8}
          >
            {/* UI Fix: Always show "Chat with Buyer" even if out of leads */}
            <Text style={styles.chatText}>Chat with Buyer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Zoom Modal */}
      <Modal
        visible={imageZoomed}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageZoomed(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={() => setImageZoomed(false)}
          >
            <TouchableOpacity style={styles.closeButton} onPress={() => setImageZoomed(false)}>
              <X size={32} color="#FFF" strokeWidth={3} />
            </TouchableOpacity>
            <Image 
              source={{ uri: lead.imageUrl || '' }} 
              style={styles.zoomedImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Consume Confirmation Modal */}
      <Modal
        visible={showConsumeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isConsuming && setShowConsumeModal(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.consumeCard}>
                <View style={styles.consumeIconCircle}>
                    <MessageCircle size={32} color="#0057D9" />
                </View>
                
                <Text style={styles.consumeTitle}>Contact Buyer?</Text>
                
                <Text style={styles.consumeDesc}>
                    Starting a conversation will consume <Text style={styles.highlightText}>1 Lead Credit</Text> from your monthly quota.
                </Text>

                <View style={styles.consumeActions}>
                    <TouchableOpacity 
                        style={styles.btnCancel}
                        onPress={() => setShowConsumeModal(false)}
                        disabled={isConsuming}
                    >
                        <Text style={styles.btnCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.btnConfirm}
                        onPress={confirmConsumption}
                        disabled={isConsuming}
                    >
                        {isConsuming ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.btnConfirmText}>Confirm & Chat</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Referral Modal (No Leads Left) */}
      <Modal
        visible={showReferralModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.referralCard}>
            <TouchableOpacity 
              style={styles.closeButton2} 
              onPress={() => setShowReferralModal(false)}
            >
              <X size={24} color="#94A3B8" />
            </TouchableOpacity>
            
            <View style={styles.giftIconCircle}>
              <Gift size={40} color="#0057D9" />
            </View>
            
            <Text style={styles.modalTitle}>Out of Lead Credits!</Text>
            
            <Text style={styles.modalDesc}>
              You've used all your leads for this month. Invite friends to join Bizzap and earn <Text style={styles.highlightText}>3 bonus leads</Text> per successful referral!
            </Text>
            
            {referralCode ? (
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Your Referral Code</Text>
                <Text style={styles.codeValue}>{referralCode}</Text>
              </View>
            ) : null}
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCopy} onPress={handleCopyLink}>
                <Text style={styles.btnCopyText}>Copy Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnShare} onPress={handleShareLink}>
                <Text style={styles.btnShareText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    backgroundColor: '#121924',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'center',
  },
  titleSection: {
    width: '100%',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Outfit',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  metaLabel: {
    color: '#8FA8CC',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  detailBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  leadThumb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#595959',
    backgroundColor: '#1E293B',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  divider: {
    width: 1,
    height: 38,
    backgroundColor: '#595959',
  },
  sLabel: {
    color: '#8FA8CC',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  sValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  footerBar: {
    height: 40,
    backgroundColor: 'rgba(0, 87, 217, 0.17)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  utilIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAction: {
    minWidth: 157,
    backgroundColor: '#0057D9',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
  },
  closeButton2: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  zoomedImage: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  consumeCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  consumeIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 87, 217, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  consumeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
    fontFamily: 'Outfit',
  },
  consumeDesc: {
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
  consumeActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#FFF',
    fontWeight: '600',
  },
  btnConfirm: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0057D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnConfirmText: {
    color: '#FFF',
    fontWeight: '600',
  },
  // Referral Modal Styles
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