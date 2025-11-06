// app/(app)/search/index.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { searchAPI, Company, Lead, Product, PaginatedResult } from '../../../services/search';
import { followersAPI } from '../../../services/user';
import { useRouter } from 'expo-router';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Recent Search Item ---
const RecentSearchItem = ({ 
  query, 
  onPress, 
  onRemove 
}: { 
  query: string; 
  onPress: () => void;
  onRemove: () => void;
}) => (
  <TouchableOpacity style={styles.recentItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.recentLeft}>
      <Ionicons name="time-outline" size={sizeScale(20)} color="#666" />
      <Text style={styles.recentText}>{query}</Text>
    </View>
    <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
      <Ionicons name="close" size={sizeScale(18)} color="#666" />
    </TouchableOpacity>
  </TouchableOpacity>
);

// --- Company Result Card ---
interface CompanyResultCardProps {
  company: Company;
  onFollowChange: (companyId: string, isFollowing: boolean) => void;
}

const CompanyResultCard = ({ company, onFollowChange }: CompanyResultCardProps) => {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [company.id]);

  const checkFollowStatus = async () => {
    try {
      setCheckingStatus(true);
      const status = await followersAPI.checkFollowStatus(company.id);
      setIsFollowing(status.isFollowing);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFollowToggle = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      if (isFollowing) {
        await followersAPI.unfollowCompany(company.id);
        setIsFollowing(false);
        onFollowChange(company.id, false);
      } else {
        await followersAPI.followCompany(company.id);
        setIsFollowing(true);
        onFollowChange(company.id, true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardPress = () => {
    router.push(`/search/${company.id}`);
  };

  return (
    <TouchableOpacity 
      style={styles.companyResultCard} 
      activeOpacity={0.7}
      onPress={handleCardPress}
    >
      <Image
        source={{ uri: company.logo || 'https://via.placeholder.com/48/0D0D0D/ffffff?text=C' }}
        style={styles.companyResultLogo}
      />
      <View style={styles.companyResultInfo}>
        <Text style={styles.companyResultName} numberOfLines={1}>
          {company.companyName}
        </Text>
        <Text style={styles.companyResultCategory} numberOfLines={1}>
          {company.category || 'Business'}
        </Text>
        <Text style={styles.companyResultFollowers}>
          {company.followersCount || 0} followers
        </Text>
      </View>
      <TouchableOpacity 
        style={[
          styles.followButton,
          isFollowing && styles.followingButton,
          (isLoading || checkingStatus) && styles.followButtonDisabled
        ]}
        onPress={handleFollowToggle}
        disabled={isLoading || checkingStatus}
      >
        {isLoading || checkingStatus ? (
          <ActivityIndicator size="small" color={isFollowing ? "#0095f6" : "#fff"} />
        ) : (
          <Text style={[
            styles.followButtonText,
            isFollowing && styles.followingButtonText
          ]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// --- Lead Result Card ---
const LeadResultCard = ({ lead }: { lead: Lead }) => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.leadResultCard} 
      activeOpacity={0.7}
      onPress={() => router.push(`/leads/${lead.id}`)}
    >
      {lead.image ? (
        <Image source={{ uri: lead.image }} style={styles.leadResultImage} resizeMode="cover" />
      ) : (
        <View style={[styles.leadResultImage, styles.leadResultImagePlaceholder]}>
          <Ionicons name="briefcase-outline" size={sizeScale(32)} color="#666" />
        </View>
      )}
      <View style={styles.leadResultContent}>
        <View style={styles.leadResultHeader}>
          <Image
            source={{ uri: lead.company.logo || 'https://via.placeholder.com/24/0D0D0D/ffffff?text=C' }}
            style={styles.leadResultCompanyLogo}
          />
          <Text style={styles.leadResultCompanyName} numberOfLines={1}>
            {lead.company.companyName}
          </Text>
        </View>
        <Text style={styles.leadResultTitle} numberOfLines={2}>{lead.title}</Text>
        {lead.budget && (
          <View style={styles.leadResultBudget}>
            <Ionicons name="cash-outline" size={sizeScale(14)} color="#0095f6" />
            <Text style={styles.leadResultBudgetText}>{lead.budget}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// --- Product Grid Item ---
const ProductGridItem = ({ product }: { product: Product }) => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.productGridItem} 
      activeOpacity={0.7}
      onPress={() => router.push(`/products/${product.id}`)}
    >
      <Image
        source={{
          uri: product.images && product.images.length > 0
            ? product.images[0]
            : 'https://via.placeholder.com/300x300/0D0D0D/ffffff?text=P',
        }}
        style={styles.productGridImage}
        resizeMode="cover"
      />
      {product.images && product.images.length > 1 && (
        <View style={styles.multipleImagesIndicator}>
          <Ionicons name="layers" size={sizeScale(12)} color="#fff" />
        </View>
      )}
      <View style={styles.productGridOverlay}>
        <Text style={styles.productGridPrice}>₹{product.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

// --- Main Search Screen Component ---
export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    companies: PaginatedResult<Company>;
    leads: PaginatedResult<Lead>;
    products: PaginatedResult<Product>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'accounts' | 'leads' | 'products'>('accounts');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Tech startups',
    'Manufacturing leads',
    'Electronics',
  ]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults(null);
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setIsSearching(true);

      const response = await searchAPI.search({
        query: searchQuery,
        companyPage: 1,
        companyLimit: 20,
        leadPage: 1,
        leadLimit: 20,
        productPage: 1,
        productLimit: 30,
      });

      setSearchResults(response.data);
      
      // Add to recent searches
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
    } catch (error: any) {
      console.error('Search failed:', error);
      Alert.alert('Error', error.message || 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRemoveRecent = (query: string) => {
    setRecentSearches(prev => prev.filter(q => q !== query));
  };

  const handleClearAll = () => {
    setRecentSearches([]);
  };

  const handleCancelSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setIsSearching(false);
  };

  const handleFollowChange = (companyId: string, isFollowing: boolean) => {
    // Update the followers count in the search results
    if (searchResults) {
      const updatedCompanies = searchResults.companies.data.map(company => {
        if (company.id === companyId) {
          return {
            ...company,
            followersCount: isFollowing 
              ? (company.followersCount || 0) + 1 
              : Math.max((company.followersCount || 0) - 1, 0)
          };
        }
        return company;
      });

      setSearchResults({
        ...searchResults,
        companies: {
          ...searchResults.companies,
          data: updatedCompanies
        }
      });
    }
  };

  const renderSearchResults = () => {
    if (!searchResults) return null;

    const { companies, leads, products } = searchResults;

    if (activeTab === 'accounts') {
      if (companies.data.length === 0) {
        return (
          <View style={styles.emptyResults}>
            <Ionicons name="business-outline" size={sizeScale(64)} color="#333" />
            <Text style={styles.emptyText}>No accounts found</Text>
          </View>
        );
      }

      return (
        <FlatList
          data={companies.data}
          renderItem={({ item }) => (
            <CompanyResultCard 
              company={item} 
              onFollowChange={handleFollowChange}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeTab === 'leads') {
      if (leads.data.length === 0) {
        return (
          <View style={styles.emptyResults}>
            <Ionicons name="briefcase-outline" size={sizeScale(64)} color="#333" />
            <Text style={styles.emptyText}>No leads found</Text>
          </View>
        );
      }

      return (
        <FlatList
          data={leads.data}
          renderItem={({ item }) => <LeadResultCard lead={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeTab === 'products') {
      if (products.data.length === 0) {
        return (
          <View style={styles.emptyResults}>
            <Ionicons name="cube-outline" size={sizeScale(64)} color="#333" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        );
      }

      return (
        <FlatList
          data={products.data}
          renderItem={({ item }) => <ProductGridItem product={item} />}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={sizeScale(20)} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search accounts, leads, products..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={sizeScale(20)} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        {isSearching && (
          <TouchableOpacity onPress={handleCancelSearch}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095f6" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : isSearching && searchResults ? (
        <>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'accounts' && styles.activeTab]}
              onPress={() => setActiveTab('accounts')}
            >
              <Text style={[styles.tabText, activeTab === 'accounts' && styles.activeTabText]}>
                Accounts ({searchResults.companies.total})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'leads' && styles.activeTab]}
              onPress={() => setActiveTab('leads')}
            >
              <Text style={[styles.tabText, activeTab === 'leads' && styles.activeTabText]}>
                Leads ({searchResults.leads.total})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'products' && styles.activeTab]}
              onPress={() => setActiveTab('products')}
            >
              <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
                Products ({searchResults.products.total})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          {renderSearchResults()}
        </>
      ) : (
        <ScrollView style={styles.defaultContent} showsVerticalScrollIndicator={false}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent</Text>
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((query, index) => (
                <RecentSearchItem
                  key={index}
                  query={query}
                  onPress={() => handleRecentSearch(query)}
                  onRemove={() => handleRemoveRecent(query)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    paddingTop: sizeScale(60),
    paddingBottom: sizeScale(12),
    gap: sizeScale(12),
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(10),
    paddingHorizontal: sizeScale(12),
    height: sizeScale(40),
    gap: sizeScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: sizeScale(16),
    color: '#fff',
    padding: 0,
  },
  clearButton: {
    padding: sizeScale(2),
  },
  cancelText: {
    fontSize: sizeScale(16),
    color: '#fff',
    fontWeight: '500',
  },

  // Loading
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

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    paddingVertical: sizeScale(12),
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  tabText: {
    fontSize: sizeScale(15),
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },

  // Default Content
  defaultContent: {
    flex: 1,
  },
  section: {
    paddingTop: sizeScale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    marginBottom: sizeScale(12),
  },
  sectionTitle: {
    fontSize: sizeScale(16),
    fontWeight: '700',
    color: '#fff',
  },
  clearAllText: {
    fontSize: sizeScale(14),
    color: '#0095f6',
    fontWeight: '600',
  },

  // Recent Search Item
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(12),
    flex: 1,
  },
  recentText: {
    fontSize: sizeScale(15),
    color: '#fff',
  },
  removeButton: {
    padding: sizeScale(4),
  },

  // Results Container
  resultsContainer: {
    paddingBottom: sizeScale(100),
  },

  // Company Result Card
  companyResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
    gap: sizeScale(12),
  },
  companyResultLogo: {
    width: sizeScale(48),
    height: sizeScale(48),
    borderRadius: sizeScale(24),
    backgroundColor: '#1a1a1a',
  },
  companyResultInfo: {
    flex: 1,
  },
  companyResultName: {
    fontSize: sizeScale(15),
    fontWeight: '600',
    color: '#fff',
    marginBottom: sizeScale(2),
  },
  companyResultCategory: {
    fontSize: sizeScale(13),
    color: '#666',
    marginBottom: sizeScale(2),
  },
  companyResultFollowers: {
    fontSize: sizeScale(13),
    color: '#666',
  },
  followButton: {
    paddingHorizontal: sizeScale(24),
    paddingVertical: sizeScale(6),
    backgroundColor: '#0095f6',
    borderRadius: sizeScale(6),
    minWidth: sizeScale(90),
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
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
    color: '#999',
  },

  // Lead Result Card
  leadResultCard: {
    flexDirection: 'row',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(12),
    gap: sizeScale(12),
  },
  leadResultImage: {
    width: sizeScale(100),
    height: sizeScale(100),
    borderRadius: sizeScale(8),
    backgroundColor: '#1a1a1a',
  },
  leadResultImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadResultContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  leadResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(6),
    marginBottom: sizeScale(4),
  },
  leadResultCompanyLogo: {
    width: sizeScale(20),
    height: sizeScale(20),
    borderRadius: sizeScale(10),
    backgroundColor: '#1a1a1a',
  },
  leadResultCompanyName: {
    fontSize: sizeScale(13),
    color: '#666',
    flex: 1,
  },
  leadResultTitle: {
    fontSize: sizeScale(15),
    fontWeight: '600',
    color: '#fff',
    lineHeight: sizeScale(20),
    marginBottom: sizeScale(8),
  },
  leadResultBudget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(4),
  },
  leadResultBudgetText: {
    fontSize: sizeScale(14),
    fontWeight: '600',
    color: '#0095f6',
  },

  // Products Grid
  productsGrid: {
    paddingHorizontal: sizeScale(1),
    paddingBottom: sizeScale(100),
  },
  productGridItem: {
    width: SCREEN_WIDTH / 3 - sizeScale(2),
    height: SCREEN_WIDTH / 3 - sizeScale(2),
    margin: sizeScale(1),
    position: 'relative',
  },
  productGridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: sizeScale(8),
    right: sizeScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: sizeScale(4),
    borderRadius: sizeScale(4),
  },
  productGridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: sizeScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  productGridPrice: {
    fontSize: sizeScale(12),
    fontWeight: '700',
    color: '#fff',
  },

  // Empty Results
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: sizeScale(80),
  },
  emptyText: {
    fontSize: sizeScale(16),
    color: '#666',
    marginTop: sizeScale(16),
  },
});