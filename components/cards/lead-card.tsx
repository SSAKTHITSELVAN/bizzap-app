// // components/cards/lead-card.tsx
// import React, { useState } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   Image, 
//   TouchableOpacity, 
//   Share, 
//   Modal, 
//   Dimensions, 
//   useWindowDimensions, 
//   ActivityIndicator,
//   Alert
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { MapPin, Clock, Bookmark, Share2, X, MessageCircle, AlertCircle } from 'lucide-react-native';
// import { Lead, leadsAPI } from '../../services/leads';
// import { chatAPI } from '../../services/chat-websocket';

// const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// interface LeadCardProps {
//   lead: Lead;
//   onConsumeSuccess?: () => void;
// }

// export const LeadCard = ({ lead, onConsumeSuccess }: LeadCardProps) => {
//   const router = useRouter();
//   const [expanded, setExpanded] = useState(false);
//   const [imageZoomed, setImageZoomed] = useState(false);
//   const [showConsumeModal, setShowConsumeModal] = useState(false);
//   const [isConsuming, setIsConsuming] = useState(false);
  
//   const { width: screenWidth } = useWindowDimensions();
  
//   // Calculate responsive dimensions
//   const cardWidth = Math.min(screenWidth - 32, 400);

//   // --- Generate Deep Link ---
//   const generateLeadLink = () => {
//     // Format: bizzap://dashboard?leadId={leadId}
//     // For web fallback: https://bizzap.app/dashboard?leadId={leadId}
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
//         url: leadLink, // iOS will use this
//       });
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   // --- Chat/Consume Logic ---
//   const handleChatPress = () => {
//     setShowConsumeModal(true);
//   };

//   const confirmConsumption = async () => {
//     try {
//       setIsConsuming(true);

//       // 1. Consume the lead
//       const consumeResponse = await leadsAPI.consumeLead(lead.id);

//       if (consumeResponse.status === 'success') {
        
//         // 2. Refresh dashboard quota
//         if (onConsumeSuccess) {
//           onConsumeSuccess();
//         }

//         // 3. Auto-post first message
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

//         // 4. Close Modal
//         setShowConsumeModal(false);
//         setIsConsuming(false);

//         // 5. Navigate to Chat
//         router.push({
//             pathname: '/(app)/chat/[companyId]',
//             params: { companyId: lead.companyId }
//         });
//       }
//     } catch (error: any) {
//       setIsConsuming(false);
//       setShowConsumeModal(false);
//       const msg = error.message || 'Failed to consume lead. Please check your quota.';
//       Alert.alert('Error', msg);
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
//               <MapPin size={16} color="#8FA8CC" />
//               <Text style={styles.metaLabel} numberOfLines={1}>{lead.location}</Text>
//             </View>
//             <View style={styles.metaGroup}>
//               <Clock size={16} color="#8FA8CC" />
//               <Text style={styles.metaLabel} numberOfLines={1}>10:30 AM Today</Text>
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

//         {/* Expanded Description */}
//         {expanded && lead.description && (
//           <View style={styles.descriptionContainer}>
//             <Text style={styles.descriptionText}>{lead.description}</Text>
//           </View>
//         )}

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
//             <Text style={styles.chatText}>Talk to Buyer</Text>
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
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   cardOuter: {
//     backgroundColor: '#0F1417',
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//     alignSelf: 'center',
//   },
//   titleSection: {
//     width: '100%',
//     borderRadius: 4,
//     padding: 8,
//     backgroundColor: 'rgba(0, 87, 217, 0.04)',
//     marginBottom: 20,
//     shadowColor: '#FFF',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 0,
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
//   descriptionContainer: {
//     marginBottom: 20,
//     paddingHorizontal: 4,
//   },
//   descriptionText: {
//     color: '#D1D5DB',
//     fontSize: 13,
//     lineHeight: 20,
//     fontFamily: 'Outfit',
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
// });


// components/cards/lead-card.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Share, 
  Modal, 
  Dimensions, 
  useWindowDimensions, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient'; // Required for the Rainbow Border
import { MapPin, Clock, Share2, X, MessageCircle } from 'lucide-react-native';
import { Lead, leadsAPI } from '../../services/leads';
import { chatAPI } from '../../services/chat-websocket';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LeadCardProps {
  lead: Lead;
  onConsumeSuccess?: () => void;
}

export const LeadCard = ({ lead, onConsumeSuccess }: LeadCardProps) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  
  const { width: screenWidth } = useWindowDimensions();
  
  // Calculate responsive dimensions
  const cardWidth = Math.min(screenWidth - 32, 400);

  // --- Generate Deep Link ---
  const generateLeadLink = () => {
    return `https://bizzap.app/dashboard?leadId=${lead.id}`;
  };

  // --- Share Handler ---
  const handleShare = async () => {
    try {
      const leadLink = generateLeadLink();
      
      const message = `👋 Check out this lead on Bizzap!\n\n` +
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

  // --- Chat/Consume Logic ---
  const handleChatPress = () => {
    setShowConsumeModal(true);
  };

  const confirmConsumption = async () => {
    try {
      setIsConsuming(true);

      // 1. Consume the lead
      const consumeResponse = await leadsAPI.consumeLead(lead.id);

      if (consumeResponse.status === 'success') {
        
        // 2. Refresh dashboard quota
        if (onConsumeSuccess) {
          onConsumeSuccess();
        }

        // 3. Auto-post first message
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

        // 4. Close Modal
        setShowConsumeModal(false);
        setIsConsuming(false);

        // 5. Navigate to Chat
        router.push({
            pathname: '/(app)/chat/[companyId]',
            params: { companyId: lead.companyId }
        });
      }
    } catch (error: any) {
      setIsConsuming(false);
      setShowConsumeModal(false);
      const msg = error.message || 'Failed to consume lead. Please check your quota.';
      Alert.alert('Error', msg);
    }
  };

  return (
    <>
      {/* RAINBOW GLASS BORDER:
         The LinearGradient creates the colorful background.
         The padding creates the "border width".
      */}
      <LinearGradient
        // Vibrant Rainbow Colors (Red -> Orange -> Yellow -> Green -> Cyan -> Blue -> Purple)
        colors={[
            '#FF0000', 
            '#FF7F00', 
            '#FFFF00', 
            '#00FF00', 
            '#00FFFF', 
            '#0000FF', 
            '#8B00FF'
        ]} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.rainbowBorderContainer, { width: cardWidth }]}
      >
        {/* Inner Content with Original Background to mask the center of the rainbow */}
        <View style={styles.cardInnerContent}>
          
          {/* Title Section (Exact Original) */}
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
                <MapPin size={16} color="#8FA8CC" />
                <Text style={styles.metaLabel} numberOfLines={1}>{lead.location}</Text>
              </View>
              <View style={styles.metaGroup}>
                <Clock size={16} color="#8FA8CC" />
                <Text style={styles.metaLabel} numberOfLines={1}>10:30 AM Today</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Details Body (Exact Original) */}
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

          {/* Expanded Description (Exact Original) */}
          {expanded && lead.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>{lead.description}</Text>
            </View>
          )}

          {/* Footer Bar (Exact Original) */}
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
              <Text style={styles.chatText}>Talk to Buyer</Text>
            </TouchableOpacity>
          </View>

        </View>
      </LinearGradient>

      {/* Image Zoom Modal (Unchanged) */}
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

      {/* Consume Confirmation Modal (Unchanged) */}
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
    </>
  );
};

const styles = StyleSheet.create({
  // --- New Rainbow Border Styles ---
  rainbowBorderContainer: {
    padding: 1.5, // The thickness of the rainbow border
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  cardInnerContent: {
    backgroundColor: '#0F1417', // Exact Original Background
    borderRadius: 10.5, // Slightly less than container to fit perfectly (12 - 1.5)
    padding: 16, // Original Padding
    width: '100%',
  },

  // --- Original Styles Below (Unchanged) ---
  titleSection: {
    width: '100%',
    borderRadius: 4,
    padding: 8,
    backgroundColor: 'rgba(0, 87, 217, 0.04)',
    marginBottom: 20,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
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
  descriptionContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  descriptionText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Outfit',
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
});