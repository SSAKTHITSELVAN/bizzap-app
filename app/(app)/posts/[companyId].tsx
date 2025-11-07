// app/(app)/posts//[companyId].tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { companyAPI, followersAPI } from '../../../services/user';
import type { CompanyProfile, Product } from '../../../services/user';
import { getCompanyLogoUrl, getUserPhotoUrl } from '../../../utils/s3Utils';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Product Card Component ---
const ProductCard = ({ 
  product, 
  onPress 
}: { 
  product: Product; 
  onPress: () => void;
}) => {
  const primaryImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://via.placeholder.com/300x300/0D0D0D/ffffff?text=Product';

  return (
    <TouchableOpacity 
      style={styles.productCard} 
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Image
        source={{ uri: primaryImage }}
        style={styles.productImage}
        resizeMode="cover"
      />
      {product.images && product.images.length > 1 && (
        <View style={styles.multipleImagesIndicator}>
          <Ionicons name="layers" size={sizeScale(12)} color="#fff" />
          <Text style={styles.imageCount}>{product.images.length}</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>₹{product.price}</Text>
          <Text style={styles.productMinQty}>
            Min: {product.minimumQuantity}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- Main Company Profile Component ---
export default function CompanyProfileScreen() {
  const router = useRouter();
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [checkingFollowStatus, setCheckingFollowStatus] = useState(true);

  useEffect(() => {
    if (companyId) {
      loadCompanyProfile();
      checkFollowStatus();
    }
  }, [companyId]);

  const loadCompanyProfile = async () => {
    try {
      setLoading(true);
      const profile = await companyAPI.getCompanyById(companyId);
      setCompany(profile);
    } catch (error: any) {
      console.error('Failed to load company profile:', error);
      Alert.alert('Error', error.message || 'Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      setCheckingFollowStatus(true);
      const status = await followersAPI.checkFollowStatus(companyId);
      setIsFollowing(status.isFollowing);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    } finally {
      setCheckingFollowStatus(false);
    }
  };

  const handleFollowToggle = async () => {
    if (followLoading || checkingFollowStatus) return;

    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        await followersAPI.unfollowCompany(companyId);
        setIsFollowing(false);
        if (company) {
          setCompany({
            ...company,
            followersCount: Math.max((company.followersCount || 0) - 1, 0)
          });
        }
      } else {
        await followersAPI.followCompany(companyId);
        setIsFollowing(true);
        if (company) {
          setCompany({
            ...company,
            followersCount: (company.followersCount || 0) + 1
          });
        }
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', error.message || 'Failed to update follow status');
      // Revert the optimistic update if it failed
      await checkFollowStatus();
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCall = () => {
    if (company?.phoneNumber) {
      const phoneUrl = `tel:${company.phoneNumber}`;
      Linking.canOpenURL(phoneUrl)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(phoneUrl);
          } else {
            Alert.alert('Error', 'Unable to make phone calls on this device');
          }
        })
        .catch((err) => {
          console.error('Error opening phone dialer:', err);
          Alert.alert('Error', 'Failed to open phone dialer');
        });
    } else {
      Alert.alert('Info', 'Phone number not available');
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={sizeScale(24)} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4C1D95" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={sizeScale(24)} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={sizeScale(64)} color="#666" />
          <Text style={styles.errorText}>Company not found</Text>
        </View>
      </View>
    );
  }

  const userPhotoResult = getUserPhotoUrl(
    company.userPhoto,
    company.userName || company.companyName
  );
  
  const companyLogoResult = getCompanyLogoUrl(
    company.logo,
    company.companyName
  );
  
  const profileImage = userPhotoResult || companyLogoResult;

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={sizeScale(24)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {company.userName || company.companyName}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        {company.coverImage && (
          <Image
            source={{ uri: company.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        {/* Company Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
            />
            <View style={styles.profileActions}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                  (followLoading || checkingFollowStatus) && styles.followButtonDisabled
                ]}
                onPress={handleFollowToggle}
                disabled={followLoading || checkingFollowStatus}
              >
                {followLoading || checkingFollowStatus ? (
                  <ActivityIndicator 
                    size="small" 
                    color={isFollowing ? "#4C1D95" : "#fff"} 
                  />
                ) : (
                  <>
                    <Ionicons 
                      name={isFollowing ? "checkmark" : "add"} 
                      size={sizeScale(18)} 
                      color={isFollowing ? "#4C1D95" : "#fff"}
                    />
                    <Text style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText
                    ]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.callButton}
                onPress={handleCall}
              >
                <Ionicons name="call" size={sizeScale(20)} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Company Details */}
          <View style={styles.companyDetails}>
            {company.userName && (
              <Text style={styles.userName}>{company.userName}</Text>
            )}
            <Text style={styles.companyName}>{company.companyName}</Text>
            {company.category && (
              <Text style={styles.companyCategory}>{company.category}</Text>
            )}
            {company.about && (
              <Text style={styles.companyAbout}>{company.about}</Text>
            )}
            {company.description && !company.about && (
              <Text style={styles.companyAbout}>{company.description}</Text>
            )}
            
            {/* Location */}
            {(company.address || company.operationalAddress) && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={sizeScale(16)} color="#666" />
                <Text style={styles.locationText}>
                  {company.operationalAddress || company.address}
                </Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{company.followersCount || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {company.following?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {company.leads?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Leads</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {company.products?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Products Catalog */}
        <View style={styles.catalogSection}>
          <View style={styles.catalogHeader}>
            <Text style={styles.catalogTitle}>Product Catalog</Text>
            <Text style={styles.catalogCount}>
              {company.products?.length || 0} Products
            </Text>
          </View>

          {company.products && company.products.length > 0 ? (
            <View style={styles.productsGrid}>
              {company.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => handleProductPress(product.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyProducts}>
              <Ionicons name="cube-outline" size={sizeScale(48)} color="#333" />
              <Text style={styles.emptyProductsText}>
                No products available
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizeScale(16),
    paddingTop: sizeScale(60),
    paddingBottom: sizeScale(12),
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: sizeScale(4),
  },
  headerTitle: {
    flex: 1,
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: sizeScale(16),
  },
  headerRight: {
    width: sizeScale(32),
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: sizeScale(12),
    fontSize: sizeScale(14),
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: sizeScale(16),
    fontSize: sizeScale(16),
    color: '#666',
  },

  // Content
  content: {
    flex: 1,
  },

  // Cover Image
  coverImage: {
    width: '100%',
    height: sizeScale(200),
    backgroundColor: '#1a1a1a',
  },

  // Profile Section
  profileSection: {
    paddingHorizontal: sizeScale(16),
    paddingTop: sizeScale(16),
    paddingBottom: sizeScale(24),
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: sizeScale(16),
  },
  profileImage: {
    width: sizeScale(80),
    height: sizeScale(80),
    borderRadius: sizeScale(40),
    backgroundColor: '#1a1a1a',
    borderWidth: 3,
    borderColor: '#000',
  },
  profileActions: {
    flexDirection: 'row',
    gap: sizeScale(8),
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(6),
    paddingHorizontal: sizeScale(20),
    paddingVertical: sizeScale(8),
    backgroundColor: '#4C1D95',
    borderRadius: sizeScale(8),
  },
  followingButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#4C1D95',
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    fontSize: sizeScale(14),
    fontWeight: '600',
    color: '#fff',
  },
  followingButtonText: {
    color: '#4C1D95',
  },
  callButton: {
    padding: sizeScale(10),
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(8),
    borderWidth: 1,
    borderColor: '#333',
  },

  // Company Details
  companyDetails: {
    gap: sizeScale(8),
  },
  userName: {
    fontSize: sizeScale(18),
    fontWeight: '700',
    color: '#fff',
  },
  companyName: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#ccc',
  },
  companyCategory: {
    fontSize: sizeScale(14),
    color: '#4C1D95',
    fontWeight: '600',
  },
  companyAbout: {
    fontSize: sizeScale(14),
    color: '#ccc',
    lineHeight: sizeScale(20),
    marginTop: sizeScale(4),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(6),
    marginTop: sizeScale(4),
  },
  locationText: {
    fontSize: sizeScale(14),
    color: '#666',
    flex: 1,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: sizeScale(16),
    paddingTop: sizeScale(16),
    borderTopWidth: 0.5,
    borderTopColor: '#333',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: sizeScale(18),
    fontWeight: '700',
    color: '#fff',
    marginBottom: sizeScale(4),
  },
  statLabel: {
    fontSize: sizeScale(12),
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: sizeScale(30),
    backgroundColor: '#333',
  },

  // Catalog Section
  catalogSection: {
    paddingTop: sizeScale(24),
  },
  catalogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    marginBottom: sizeScale(16),
  },
  catalogTitle: {
    fontSize: sizeScale(18),
    fontWeight: '700',
    color: '#fff',
  },
  catalogCount: {
    fontSize: sizeScale(14),
    color: '#666',
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: sizeScale(8),
  },
  productCard: {
    width: (SCREEN_WIDTH - sizeScale(24)) / 2,
    marginHorizontal: sizeScale(4),
    marginBottom: sizeScale(16),
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(12),
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: sizeScale(180),
    backgroundColor: '#0d0d0d',
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: sizeScale(8),
    right: sizeScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(4),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: sizeScale(8),
    paddingVertical: sizeScale(4),
    borderRadius: sizeScale(12),
  },
  imageCount: {
    fontSize: sizeScale(12),
    fontWeight: '600',
    color: '#fff',
  },
  productInfo: {
    padding: sizeScale(12),
  },
  productName: {
    fontSize: sizeScale(14),
    fontWeight: '600',
    color: '#fff',
    marginBottom: sizeScale(4),
    lineHeight: sizeScale(18),
  },
  productDescription: {
    fontSize: sizeScale(12),
    color: '#666',
    lineHeight: sizeScale(16),
    marginBottom: sizeScale(8),
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: sizeScale(16),
    fontWeight: '700',
    color: '#4C1D95',
  },
  productMinQty: {
    fontSize: sizeScale(11),
    color: '#666',
  },

  // Empty Products
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: sizeScale(60),
  },
  emptyProductsText: {
    fontSize: sizeScale(14),
    color: '#666',
    marginTop: sizeScale(12),
  },

  // Bottom Spacing
  bottomSpacing: {
    height: sizeScale(40),
  },
});