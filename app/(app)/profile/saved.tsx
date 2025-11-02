// app/(app)/profile/saved.tsx

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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { postsAPI, Post } from '../../../services/posts';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Placeholder Image ---
const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/f3f4f6/6b7280?text=No+Image';

// --- Post Card Component ---
interface PostCardProps {
    post: Post;
    onRemove: (postId: string) => void;
}

function PostCard({ post, onRemove }: PostCardProps) {
    const router = useRouter();
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = () => {
        Alert.alert(
            'Remove from Saved',
            'Are you sure you want to remove this post from saved?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setIsRemoving(true);
                        try {
                            await postsAPI.removeSavedPost(post.id);
                            onRemove(post.id);
                            Alert.alert('Success', 'Post removed from saved');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to remove post');
                        } finally {
                            setIsRemoving(false);
                        }
                    }
                }
            ]
        );
    };

    const postImage = post.images && post.images.length > 0 
        ? post.images[0] 
        : post.video 
        ? 'https://via.placeholder.com/400x300/1a1a1a/666?text=Video+Post'
        : null;

    return (
        <View style={styles.postCard}>
            {/* Company Header */}
            <View style={styles.postHeader}>
                <TouchableOpacity 
                    style={styles.companyInfo}
                    onPress={() => router.push(`/companies/${post.companyId}`)}
                >
                    <Image
                        source={{ uri: post.company.logo || PLACEHOLDER_IMG }}
                        style={styles.companyLogo}
                        defaultSource={{ uri: PLACEHOLDER_IMG }}
                    />
                    <View>
                        <Text style={styles.companyName} numberOfLines={1}>
                            {post.company.companyName}
                        </Text>
                        <Text style={styles.postDate}>
                            {new Date(post.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                    onPress={handleRemove}
                    disabled={isRemoving}
                    style={styles.removeButton}
                >
                    <Feather 
                        name="bookmark" 
                        size={sizeScale(20)} 
                        color="#0095f6" 
                    />
                </TouchableOpacity>
            </View>

            {/* Post Image/Video */}
            {postImage && (
                <Image
                    source={{ uri: postImage }}
                    style={styles.postImage}
                    resizeMode="cover"
                />
            )}

            {/* Post Content */}
            <View style={styles.postContent}>
                <Text style={styles.postText} numberOfLines={3}>
                    {post.content}
                </Text>
            </View>

            {/* Post Stats */}
            <View style={styles.postStats}>
                <View style={styles.statItem}>
                    <Feather name="heart" size={sizeScale(14)} color="#666" />
                    <Text style={styles.statText}>{post.likesCount}</Text>
                </View>
                <View style={styles.statItem}>
                    <Feather name="message-circle" size={sizeScale(14)} color="#666" />
                    <Text style={styles.statText}>{post.commentsCount}</Text>
                </View>
                <View style={styles.statItem}>
                    <Feather name="share-2" size={sizeScale(14)} color="#666" />
                    <Text style={styles.statText}>{post.sharesCount}</Text>
                </View>
            </View>
        </View>
    );
}

// --- Main Saved Posts Screen ---
export default function SavedPostsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadSavedPosts();
    }, []);

    const loadSavedPosts = async () => {
        try {
            setLoading(true);
            const response = await postsAPI.getMySavedPosts(1, 20);
            setSavedPosts(response.data);
        } catch (error: any) {
            console.error('Failed to load saved posts:', error);
            Alert.alert('Error', error.message || 'Failed to load saved posts');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSavedPosts();
        setRefreshing(false);
    };

    const handleRemovePost = (postId: string) => {
        setSavedPosts(prev => prev.filter(post => post.id !== postId));
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0095f6" />
                <Text style={styles.loadingText}>Loading saved posts...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.push('/(app)/profile')}
                >
                    <Feather name="arrow-left" size={sizeScale(24)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Posts</Text>
                <View style={styles.headerButton} />
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
                {savedPosts.length > 0 ? (
                    savedPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onRemove={handleRemovePost}
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Feather name="bookmark" size={sizeScale(64)} color="#333" />
                        <Text style={styles.emptyTitle}>No saved posts</Text>
                        <Text style={styles.emptyText}>
                            Posts you save will appear here
                        </Text>
                    </View>
                )}

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: sizeScale(16),
        paddingVertical: sizeScale(12),
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
        width: sizeScale(40),
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: sizeScale(120),
    },
    
    // Post Card Styles
    postCard: {
        backgroundColor: '#000',
        marginBottom: sizeScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: sizeScale(12),
    },
    companyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    companyLogo: {
        width: sizeScale(40),
        height: sizeScale(40),
        borderRadius: sizeScale(20),
        marginRight: sizeScale(12),
    },
    companyName: {
        fontSize: sizeScale(15),
        fontWeight: '600',
        color: '#fff',
    },
    postDate: {
        fontSize: sizeScale(12),
        color: '#666',
        marginTop: sizeScale(2),
    },
    removeButton: {
        padding: sizeScale(8),
    },
    postImage: {
        width: '100%',
        height: sizeScale(400),
        backgroundColor: '#1a1a1a',
    },
    postContent: {
        padding: sizeScale(12),
    },
    postText: {
        fontSize: sizeScale(14),
        color: '#fff',
        lineHeight: sizeScale(20),
    },
    postStats: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: sizeScale(12),
        paddingBottom: sizeScale(12),
        gap: sizeScale(16),
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(4),
    },
    statText: {
        fontSize: sizeScale(13),
        color: '#666',
    },
    
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: sizeScale(100),
    },
    emptyTitle: {
        fontSize: sizeScale(20),
        fontWeight: 'bold',
        color: '#fff',
        marginTop: sizeScale(16),
    },
    emptyText: {
        fontSize: sizeScale(14),
        color: '#666',
        marginTop: sizeScale(8),
        textAlign: 'center',
    },
    
    bottomPadding: {
        height: sizeScale(20),
    },
});