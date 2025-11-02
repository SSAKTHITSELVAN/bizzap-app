// components/cards/lead-card.tsx - UPDATED WITH AUTO MESSAGE

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  Modal,
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, Phone, MessageCircle, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Lead, leadsAPI } from '../../services/leads';
import { chatAPI } from '../../services/chat-websocket';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

interface LeadCardProps {
  lead: Lead;
  gradientIndex?: number;
  onConsumeSuccess?: (contact: string) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  gradientIndex = 0,
  onConsumeSuccess
}) => {
  const [isConsuming, setIsConsuming] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const formatNumber = (num: string | null) => {
    if (!num) return 'N/A';
    const n = parseInt(num);
    if (isNaN(n)) return num;
    if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return num;
  };

  const handleShare = async () => {
    try {
      const message = `Check out this lead: "${lead.title}"${
        lead.budget ? ` - Budget: ₹${lead.budget}` : ''
      }${lead.quantity ? ` | Quantity: ${formatNumber(lead.quantity)}` : ''}`;

      await Share.share({
        message,
        title: lead.title,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handlePhoneCall = async () => {
    setShowContactModal(false);
    
    if (isConsuming) return;

    setIsConsuming(true);
    try {
      const response = await leadsAPI.consumeLead(lead.id);
      if (response.data.success) {
        const phoneNumber = response.data.contact;
        
        // Make the phone call
        const phoneUrl = `tel:${phoneNumber}`;
        const canOpen = await Linking.canOpenURL(phoneUrl);
        
        if (canOpen) {
          await Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Unable to make phone call');
        }
        
        onConsumeSuccess?.(phoneNumber);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to get contact information. Please try again.'
      );
    } finally {
      setIsConsuming(false);
    }
  };

  const handleChatOption = async () => {
    setShowContactModal(false);
    
    if (isConsuming) return;

    setIsConsuming(true);
    
    try {
      console.log('🔄 Starting chat process...');
      
      // Step 1: Consume the lead to get contact info
      console.log('📞 Consuming lead:', lead.id);
      const consumeResponse = await leadsAPI.consumeLead(lead.id);
      
      if (!consumeResponse.data.success) {
        throw new Error('Failed to consume lead');
      }
      
      const phoneNumber = consumeResponse.data.contact;
      console.log('✅ Lead consumed, got contact:', phoneNumber);
      
      // Step 2: Prepare initial message
      const initialMessage = `Hello! I'm interested in your lead: "${lead.title}". Can we discuss further?`;
      
      console.log('💬 Sending initial message to:', lead.companyId);
      console.log('Message:', initialMessage);
      
      // Step 3: Send initial message via REST API
      try {
        const messageResponse = await chatAPI.sendMessage({
          receiverId: lead.companyId,
          message: initialMessage,
          messageType: 'text',
        });
        
        console.log('✅ Message sent successfully:', messageResponse.data);
        
        // Step 4: Navigate to the specific chat
        console.log('🚀 Navigating to chat with:', lead.companyId);
        router.push(`/(app)/chat/${lead.companyId}`);
        
        // Notify parent component
        onConsumeSuccess?.(phoneNumber);
        
      } catch (chatError: any) {
        console.error('❌ Failed to send initial message:', chatError);
        
        // Even if message fails, still allow navigation
        Alert.alert(
          'Message Send Failed',
          'Could not send the initial message, but you can still chat with the seller.',
          [
            {
              text: 'Go to Chat Anyway',
              onPress: () => {
                console.log('🚀 Navigating to chat (after error):', lead.companyId);
                router.push(`/(app)/chat/${lead.companyId}`);
                onConsumeSuccess?.(phoneNumber);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
      
    } catch (error: any) {
      console.error('❌ Failed to start chat:', error);
      
      Alert.alert(
        'Error',
        error.message || 'Failed to start chat. Please try again.'
      );
    } finally {
      setIsConsuming(false);
    }
  };

  const imageUrl = lead.image?.startsWith('data:image')
    ? lead.image
    : lead.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800';

  return (
    <View style={styles.card}>
      {/* Share Button - Top Right */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Share2 size={18} color="#a1a1aa" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Lead Title at Top */}
      <View style={styles.headerSection}>
        <Text style={styles.leadTitle} numberOfLines={2}>
          {lead.title}
        </Text>
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={14} color="#9ca3af" />
          <Text style={styles.postedDate}>
            {new Date(lead.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Lead Image */}
      {lead.image && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.leadImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Lead Content */}
      <View style={styles.content}>
        <Text style={styles.leadDescription} numberOfLines={3}>
          {lead.description}
        </Text>

        {/* Highlighted Tags for Budget and Quantity */}
        <View style={styles.tagsContainer}>
          {lead.budget && (
            <View style={[styles.tag, styles.tagBudgetHighlight]}>
              <Ionicons name="cash" size={16} color="#93c5fd" />
              <Text style={[styles.tagText, styles.tagTextBudgetHighlight]}>
                {lead.budget}
              </Text>
            </View>
          )}
          {lead.quantity && (
            <View style={[styles.tag, styles.tagQuantityHighlight]}>
              <Ionicons name="cube" size={16} color="#d8b4fe" />
              <Text style={[styles.tagText, styles.tagTextQuantityHighlight]}>
                {formatNumber(lead.quantity)}
              </Text>
            </View>
          )}
          {lead.location && (
            <View style={[styles.tag, styles.tagLocation]}>
              <Ionicons name="location" size={16} color="#d1d5db" />
              <Text style={[styles.tagText, styles.tagTextLocation]}>
                {lead.location}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats and Actions */}
      <View style={styles.footer}>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color="#9ca3af" />
            <Text style={styles.statsText}>{lead.viewCount || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#9ca3af" />
            <Text style={styles.statsText}>{lead.consumedCount || 0}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowContactModal(true)}
          disabled={isConsuming}
          style={[isConsuming && styles.actionButtonDisabled]}
        >
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.actionButton}
          >
            {isConsuming ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.actionButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.actionButtonText}>Talk to Seller</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Contact Options Modal */}
      <Modal
        visible={showContactModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isConsuming && setShowContactModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Seller</Text>
              <TouchableOpacity 
                onPress={() => setShowContactModal(false)}
                style={styles.closeButton}
                disabled={isConsuming}
              >
                <X size={24} color={isConsuming ? "#666666" : "#ffffff"} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {isConsuming ? 'Setting up your connection...' : 'Choose how to connect'}
            </Text>

            {/* Phone Option */}
            <TouchableOpacity
              style={[styles.contactOption, isConsuming && styles.optionDisabled]}
              onPress={handlePhoneCall}
              disabled={isConsuming}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconWrapper, styles.phoneIconWrapper]}>
                <Phone size={24} color="#ffffff" />
              </View>
              <View style={styles.optionTextWrapper}>
                <Text style={styles.optionTitle}>Phone Call</Text>
                <Text style={styles.optionSubtitle}>
                  Call seller directly
                </Text>
              </View>
            </TouchableOpacity>

            {/* Chat Option */}
            <TouchableOpacity
              style={[styles.contactOption, isConsuming && styles.optionDisabled]}
              onPress={handleChatOption}
              disabled={isConsuming}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconWrapper, styles.chatIconWrapper]}>
                <MessageCircle size={24} color="#ffffff" />
              </View>
              <View style={styles.optionTextWrapper}>
                <Text style={styles.optionTitle}>Start Chat</Text>
                <Text style={styles.optionSubtitle}>
                  Send a message and start chatting
                </Text>
              </View>
            </TouchableOpacity>

            {isConsuming && (
              <View style={styles.processingContainer}>
                <ActivityIndicator color="#8b5cf6" size="small" />
                <Text style={styles.processingText}>Processing your request...</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
    position: 'relative',
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    padding: 20,
    paddingRight: 60,
  },
  leadTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 10,
    lineHeight: 28,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postedDate: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#333333',
  },
  leadImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
  },
  leadDescription: {
    fontSize: 15,
    color: '#d1d5db',
    marginBottom: 16,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tagBudgetHighlight: {
    backgroundColor: '#1e40af',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  tagQuantityHighlight: {
    backgroundColor: '#6b21a8',
    borderWidth: 1.5,
    borderColor: '#8b5cf6',
  },
  tagLocation: {
    backgroundColor: '#374151',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagTextBudgetHighlight: {
    color: '#93c5fd',
  },
  tagTextQuantityHighlight: {
    color: '#d8b4fe',
  },
  tagTextLocation: {
    color: '#d1d5db',
  },
  footer: {
    padding: 16,
    paddingTop: 0,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#444',
  },
  statsText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  phoneIconWrapper: {
    backgroundColor: '#10b981',
  },
  chatIconWrapper: {
    backgroundColor: '#3b82f6',
  },
  optionTextWrapper: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  processingText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '500',
  },
});