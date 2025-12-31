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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { searchAPI, Company, Lead, PaginatedResult } from '../../../services/search';
import { followersAPI } from '../../../services/user';
import { useRouter } from 'expo-router';
import { LeadCard } from '../../../components/cards/lead-card';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Company Result Card ---
interface CompanyResultCardProps {
  company: Company;
  onFollowChange: (companyId: string, isFollowing: boolean) => void;
}

const CompanyResultCard = ({ company, onFollowChange }: CompanyResultCardProps) => {
  const router = useRouter();

  const handleCardPress = () => {
    router.push(`/search/${company.id}`);
  };

  // Get the best available address
  const displayAddress = company.address || company.operationalAddress || company.registeredAddress;

  return (
    <TouchableOpacity 
      style={styles.companyResultCard} 
      activeOpacity={0.7}
      onPress={handleCardPress}
    >
      <Image
        source={{ uri: company.logo || 'https://via.placeholder.com/40/0D0D0D/ffffff?text=C' }}
        style={styles.companyResultLogo}
      />
      <View style={styles.companyResultInfo}>
        <Text style={styles.companyResultName} numberOfLines={1}>
          {company.companyName}
        </Text>
        {displayAddress ? (
          <Text style={styles.companyResultAddress} numberOfLines={1}>
            {displayAddress}
          </Text>
        ) : (
          <Text style={styles.companyResultCategory} numberOfLines={1}>
            {company.category || 'Business'}
          </Text>
        )}
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
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'accounts' | 'leads'>('accounts');
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
        productLimit: 0, // Don't fetch products
      });

      setSearchResults({
        companies: response.data.companies,
        leads: response.data.leads,
      });
    } catch (error: any) {
      console.error('Search failed:', error);
      Alert.alert('Error', error.message || 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setIsSearching(false);
  };

  const handleFollowChange = (companyId: string, isFollowing: boolean) => {
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

    const { companies, leads } = searchResults;

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
          data={leads.data.map(lead => ({
            ...lead,
            imageUrl: lead.image,
            companyId: lead.company.id,
          }))}
          renderItem={({ item }) => <LeadCard lead={item as any} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.leadsResultsContainer}
          showsVerticalScrollIndicator={false}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <LinearGradient
          colors={['#003E9C', '#01BE8B']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradientBorder}
        >
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={sizeScale(22)} color="#01BE8B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search accounts, leads.."
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
        </LinearGradient>
        {isSearching && (
          <TouchableOpacity onPress={handleCancelSearch}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#01BE8B" />
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
          </View>

          {/* Results */}
          {renderSearchResults()}
        </>
      ) : (
        <View style={styles.defaultContent}>
          <View style={styles.emptySearchState}>
            <Ionicons name="search-outline" size={sizeScale(80)} color="#333" />
            <Text style={styles.emptySearchTitle}>Search Bizzap</Text>
            <Text style={styles.emptySearchText}>
              Find accounts and leads that match your business needs
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Changed to black like dashboard
  },
  
  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    paddingTop: sizeScale(60),
    paddingBottom: sizeScale(12),
    gap: sizeScale(12),
    backgroundColor: '#121924', // Keep header with original color
  },
  gradientBorder: {
    flex: 1,
    borderRadius: sizeScale(26),
    padding: 1.5,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0E27',
    borderRadius: sizeScale(25),
    paddingHorizontal: sizeScale(16),
    height: sizeScale(48),
    gap: sizeScale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: sizeScale(15),
    color: '#fff',
    padding: 0,
    fontWeight: '500',
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
    backgroundColor: '#000000', // Black background
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
    backgroundColor: '#000000', // Black background
  },
  tab: {
    flex: 1,
    paddingVertical: sizeScale(12),
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#01BE8B',
  },
  tabText: {
    fontSize: sizeScale(15),
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#01BE8B',
  },

  // Default Content
  defaultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // Black background
  },
  emptySearchState: {
    alignItems: 'center',
    paddingHorizontal: sizeScale(40),
  },
  emptySearchTitle: {
    fontSize: sizeScale(24),
    fontWeight: '700',
    color: '#fff',
    marginTop: sizeScale(20),
    marginBottom: sizeScale(12),
  },
  emptySearchText: {
    fontSize: sizeScale(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: sizeScale(20),
  },

  // Results Container
  resultsContainer: {
    paddingBottom: sizeScale(100),
    backgroundColor: '#121924', // Keep accounts tab with original color
  },
  leadsResultsContainer: {
    paddingHorizontal: sizeScale(16),
    paddingTop: sizeScale(12),
    paddingBottom: sizeScale(100),
    backgroundColor: '#000000', // Black background for leads
  },

  // Company Result Card
  companyResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(10),
    gap: sizeScale(10),
    backgroundColor: '#121924', // Keep company cards with original color
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a2a',
  },
  companyResultLogo: {
    width: sizeScale(40),
    height: sizeScale(40),
    borderRadius: sizeScale(20),
    backgroundColor: '#1a1a1a',
  },
  companyResultInfo: {
    flex: 1,
  },
  companyResultName: {
    fontSize: sizeScale(14),
    fontWeight: '600',
    color: '#fff',
    marginBottom: sizeScale(3),
  },
  companyResultCategory: {
    fontSize: sizeScale(12),
    color: '#666',
  },
  companyResultAddress: {
    fontSize: sizeScale(12),
    color: '#8FA8CC',
  },
  followButton: {
    paddingHorizontal: sizeScale(24),
    paddingVertical: sizeScale(6),
    backgroundColor: '#01BE8B',
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

  // Empty Results
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: sizeScale(80),
    backgroundColor: '#000000', // Black background
  },
  emptyText: {
    fontSize: sizeScale(16),
    color: '#666',
    marginTop: sizeScale(16),
  },
});