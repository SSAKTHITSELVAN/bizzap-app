// app/(app)/lead/products.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MessageCircle, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiCall } from '../../../services/apiClient';
import { companyAPI } from '../../../services/user';
import { chatAPI } from '../../../services/chat-websocket';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

interface Company {
  id: string;
  phoneNumber: string;
  gstNumber: string;
  companyName: string;
  logo: string;
  address: string;
  description: string;
  category: string | null;
  hasVerifiedBadge: boolean;
  userName: string | null;
  userPhoto: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: string;
  minimumQuantity: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  company: Company;
  companyId: string;
}

interface ApiResponse {
  statusCode: number;
  status: string;
  message: string;
  data: Product[];
  errors: null | any[];
}

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);
      
      // Fetch current user profile and products in parallel
      const [profileResponse, productsResponse] = await Promise.all([
        companyAPI.getProfile(),
        apiCall('products/public', 'GET', null, false) as Promise<ApiResponse>,
      ]);
      
      // Set current user ID
      if (profileResponse) {
        setCurrentUserId(profileResponse.id);
        console.log('✅ Current user ID:', profileResponse.id);
      }
      
      if (productsResponse.status === 'success' && productsResponse.data) {
        // Filter out:
        // 1. Deleted products
        // 2. Current user's own products
        const filteredProducts = productsResponse.data.filter(
          product => !product.isDeleted && product.companyId !== profileResponse.id
        );
        
        console.log('📦 Total products:', productsResponse.data.length);
        console.log('📦 Filtered products (excluding own):', filteredProducts.length);
        
        setProducts(filteredProducts);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(true);
  };

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setShowChatModal(true);
  };

  const handleStartChat = async () => {
    if (!selectedProduct || isSendingMessage) return;

    setIsSendingMessage(true);
    
    try {
      console.log('💬 Starting chat for product:', selectedProduct.name);
      console.log('Company ID:', selectedProduct.companyId);
      
      // Send initial message about the product
      const initialMessage = `Hello! I'm interested in your product: "${selectedProduct.name}". Can we discuss further?`;
      
      console.log('📤 Sending initial message...');
      
      try {
        await chatAPI.sendMessage({
          receiverId: selectedProduct.companyId,
          message: initialMessage,
          messageType: 'text',
        });
        
        console.log('✅ Message sent successfully');
      } catch (chatError: any) {
        console.error('⚠️ Failed to send initial message (continuing anyway):', chatError);
      }
      
      // Small delay then navigate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('🚀 Navigating to chat...');
      setShowChatModal(false);
      router.push(`/(app)/chat/${selectedProduct.companyId}`);
      
    } catch (error: any) {
      console.error('❌ Chat flow failed:', error);
      
      Alert.alert(
        'Error',
        error.message || 'Failed to start chat. Please try again.'
      );
    } finally {
      setIsSendingMessage(false);
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.95}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image 
            source={{ uri: item.images[0] }} 
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productImage, styles.noImage]}>
            <Ionicons name="cube-outline" size={64} color="#444" />
          </View>
        )}
        {item.images && item.images.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images" size={14} color="#fff" />
            <Text style={styles.imageCountText}>{item.images.length}</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.priceSection}>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.minimumQuantity} numberOfLines={1}>{item.minimumQuantity}</Text>
        </View>
      </View>

      {/* Company Info */}
      <View style={styles.companySection}>
        <View style={styles.companyInfo}>
          {item.company.logo ? (
            <Image 
              source={{ uri: item.company.logo }} 
              style={styles.companyLogo}
            />
          ) : (
            <View style={[styles.companyLogo, styles.noLogo]}>
              <Ionicons name="business" size={20} color="#666" />
            </View>
          )}
          <View style={styles.companyDetails}>
            <View style={styles.companyNameRow}>
              <Text style={styles.companyName} numberOfLines={1}>
                {item.company.companyName}
              </Text>
              {item.company.hasVerifiedBadge && (
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              )}
            </View>
            <Text style={styles.companyCategory} numberOfLines={1}>
              {item.company.category || 'Business'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionSection}>
        <LinearGradient
          colors={['#3b82f6', '#8b5cf6']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.actionButton}
        >
          <MessageCircle size={20} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.actionButtonText}>Contact Seller</Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={[
            styles.listContent,
            products.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#8b5cf6"
              colors={['#8b5cf6']}
            />
          }
          ListHeaderComponent={
            products.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.productsCount}>
                  {products.length} {products.length === 1 ? 'Product' : 'Products'}
                </Text>
                <Text style={styles.listHeaderSubtitle}>
                  Browse products from verified businesses
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={80} color="#444" />
              <Text style={styles.emptyText}>No products available</Text>
              <Text style={styles.emptySubtext}>Check back later for new products</Text>
            </View>
          }
        />
      )}

      {/* Chat Confirmation Modal */}
      <Modal
        visible={showChatModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isSendingMessage && setShowChatModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isSendingMessage && setShowChatModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Seller</Text>
              <TouchableOpacity 
                onPress={() => setShowChatModal(false)}
                style={styles.closeButton}
                disabled={isSendingMessage}
              >
                <X size={24} color={isSendingMessage ? "#666666" : "#ffffff"} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {isSendingMessage 
                ? 'Starting conversation...' 
                : 'Start a chat with the seller about this product'}
            </Text>

            {/* Product Preview */}
            {selectedProduct && (
              <View style={styles.productPreview}>
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <Image 
                    source={{ uri: selectedProduct.images[0] }} 
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.previewImage, styles.noPreviewImage]}>
                    <Ionicons name="cube-outline" size={32} color="#444" />
                  </View>
                )}
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName} numberOfLines={2}>
                    {selectedProduct.name}
                  </Text>
                  <Text style={styles.previewPrice}>
                    {formatPrice(selectedProduct.price)}
                  </Text>
                </View>
              </View>
            )}

            {/* Start Chat Button */}
            <TouchableOpacity
              style={[styles.chatOption, isSendingMessage && styles.optionDisabled]}
              onPress={handleStartChat}
              disabled={isSendingMessage}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.chatButton}
              >
                {isSendingMessage ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.chatButtonText}>Starting...</Text>
                  </View>
                ) : (
                  <View style={styles.loadingContainer}>
                    <MessageCircle size={24} color="#ffffff" />
                    <Text style={styles.chatButtonText}>Start Chat</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {isSendingMessage && (
              <View style={styles.processingContainer}>
                <ActivityIndicator color="#8b5cf6" size="small" />
                <Text style={styles.processingText}>Setting up your conversation...</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizeScale(20),
    paddingVertical: sizeScale(16),
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: sizeScale(4),
  },
  headerTitle: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    marginLeft: sizeScale(12),
  },
  headerRight: {
    flexDirection: 'row',
    gap: sizeScale(12),
  },
  searchButton: {
    padding: sizeScale(4),
  },
  listContent: {
    paddingHorizontal: sizeScale(16),
    paddingBottom: sizeScale(100),
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listHeader: {
    paddingVertical: sizeScale(16),
  },
  productsCount: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: sizeScale(4),
  },
  listHeaderSubtitle: {
    fontSize: sizeScale(14),
    color: '#888',
  },
  productCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: sizeScale(16),
    marginBottom: sizeScale(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  imageContainer: {
    width: '100%',
    height: sizeScale(220),
    position: 'relative',
    backgroundColor: '#111',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCountBadge: {
    position: 'absolute',
    top: sizeScale(12),
    right: sizeScale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: sizeScale(10),
    paddingVertical: sizeScale(6),
    borderRadius: sizeScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(4),
  },
  imageCountText: {
    fontSize: sizeScale(12),
    fontWeight: '600',
    color: '#fff',
  },
  productInfo: {
    padding: sizeScale(20),
  },
  productName: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: sizeScale(10),
    lineHeight: sizeScale(26),
  },
  productDescription: {
    fontSize: sizeScale(15),
    color: '#d1d5db',
    marginBottom: sizeScale(14),
    lineHeight: sizeScale(22),
  },
  priceSection: {
    gap: sizeScale(6),
  },
  productPrice: {
    fontSize: sizeScale(24),
    fontWeight: '700',
    color: '#8b5cf6',
  },
  minimumQuantity: {
    fontSize: sizeScale(13),
    color: '#9ca3af',
    fontWeight: '500',
  },
  companySection: {
    paddingHorizontal: sizeScale(20),
    paddingBottom: sizeScale(16),
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyLogo: {
    width: sizeScale(44),
    height: sizeScale(44),
    borderRadius: sizeScale(22),
    backgroundColor: '#222',
  },
  noLogo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyDetails: {
    marginLeft: sizeScale(12),
    flex: 1,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(6),
    marginBottom: sizeScale(4),
  },
  companyName: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#ffffff',
  },
  companyCategory: {
    fontSize: sizeScale(14),
    color: '#9ca3af',
  },
  actionSection: {
    padding: sizeScale(16),
    paddingTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeScale(10),
    paddingVertical: sizeScale(16),
    borderRadius: sizeScale(12),
  },
  actionButtonText: {
    fontSize: sizeScale(16),
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
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
    paddingBottom: 16,
  },
  productPreview: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
    paddingBottom: 20,
    gap: 16,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  noPreviewImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  chatOption: {
    padding: 24,
    paddingTop: 0,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  processingText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
});