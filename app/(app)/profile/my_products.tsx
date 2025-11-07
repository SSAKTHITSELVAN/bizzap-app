// app/(app)/profile/my_products.tsx

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
    TextInput,
    Modal,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { productsAPI } from '../../../services/products';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../../../constants/config';

// --- Responsive Sizing Utility ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number): number => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// --- Placeholder Image ---
const PLACEHOLDER_IMG = 'https://via.placeholder.com/150/f3f4f6/6b7280?text=No+Image';

// --- Constants ---
const MAX_PRODUCTS = 5;
const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// --- Interfaces ---
interface MediaFile {
    uri: string;
    type: string;
    name: string;
    file?: File;
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
    companyId: string;
}

// --- Product Card Component ---
interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
}

function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
    const formatPrice = (price: string) => {
        const num = parseFloat(price);
        return isNaN(num) ? price : `₹${num.toLocaleString('en-IN')}`;
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(product.id)
                }
            ]
        );
    };

    const productImage = product.images && product.images.length > 0 
        ? product.images[0] 
        : PLACEHOLDER_IMG;

    return (
        <View style={styles.productCard}>
            <Image
                source={{ uri: productImage }}
                style={styles.productImage}
                resizeMode="cover"
                defaultSource={{ uri: PLACEHOLDER_IMG }}
            />
            
            <View style={styles.productContent}>
                <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                </Text>
                <Text style={styles.productDescription} numberOfLines={2}>
                    {product.description}
                </Text>
                
                <View style={styles.productInfo}>
                    <View style={styles.priceContainer}>
                        <Feather name="tag" size={sizeScale(14)} color="#10b981" />
                        <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                    </View>
                    {product.images.length > 1 && (
                        <View style={styles.imageCount}>
                            <Feather name="image" size={sizeScale(12)} color="#666" />
                            <Text style={styles.imageCountText}>+{product.images.length - 1}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.productActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => onEdit(product)}
                    >
                        <Feather name="edit-2" size={sizeScale(14)} color="#0095f6" />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDelete}
                    >
                        <Feather name="trash-2" size={sizeScale(14)} color="#ef4444" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// --- Add/Edit Product Modal ---
interface ProductModalProps {
    visible: boolean;
    product: Product | null;
    onClose: () => void;
    onSave: () => void;
}

function ProductModal({ visible, product, onClose, onSave }: ProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [minimumQuantity, setMinimumQuantity] = useState('');
    const [selectedImages, setSelectedImages] = useState<MediaFile[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);

    useEffect(() => {
        if (product) {
            setName(product.name);
            setDescription(product.description);
            setPrice(product.price);
            setMinimumQuantity(product.minimumQuantity || '');
            setExistingImages(product.images || []);
            setSelectedImages([]);
        } else {
            resetForm();
        }
    }, [product, visible]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setMinimumQuantity('');
        setSelectedImages([]);
        setExistingImages([]);
    };

    const uriToFile = async (uri: string, fileName: string, mimeType: string): Promise<File | null> => {
        try {
            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                return new File([blob], fileName, { type: mimeType });
            }
            return null;
        } catch (error) {
            console.error('Error converting URI to File:', error);
            return null;
        }
    };

    const handlePickImages = async () => {
        const totalImages = existingImages.length + selectedImages.length;
        if (totalImages >= MAX_IMAGES) {
            Alert.alert('Image Limit', `You can only add up to ${MAX_IMAGES} images.`);
            return;
        }

        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: MAX_IMAGES - totalImages,
            });

            if (!result.canceled) {
                const newImages: MediaFile[] = await Promise.all(
                    result.assets.map(async (asset, index) => {
                        const fileName = asset.fileName || `product_${Date.now()}_${index}.jpg`;
                        const mimeType = asset.mimeType || 'image/jpeg';
                        const file = Platform.OS === 'web' 
                            ? await uriToFile(asset.uri, fileName, mimeType)
                            : undefined;

                        return {
                            uri: asset.uri,
                            type: mimeType,
                            name: fileName,
                            file: file || undefined,
                        };
                    })
                );
                setSelectedImages([...selectedImages, ...newImages]);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick images. Please try again.');
        }
    };

    const handleRemoveNewImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingImage = (imageUrl: string) => {
        setExistingImages(prev => prev.filter(url => url !== imageUrl));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Required Field', 'Please enter product name.');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Required Field', 'Please enter product description.');
            return;
        }
        if (!price.trim() || isNaN(parseFloat(price))) {
            Alert.alert('Invalid Price', 'Please enter a valid price.');
            return;
        }

        const totalImages = existingImages.length + selectedImages.length;
        if (totalImages === 0) {
            Alert.alert('Image Required', 'Please add at least one product image.');
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('authToken');
            const formData = new FormData();

            formData.append('name', name.trim());
            formData.append('description', description.trim());
            formData.append('price', price.trim());
            formData.append('minimumQuantity', minimumQuantity.trim());

            if (product) {
                // For updates, send existing images to keep
                existingImages.forEach((imageUrl) => {
                    // Extract S3 key from URL
                    const key = imageUrl.split('?')[0].split('.com/')[1];
                    formData.append('existingImages', key);
                });
            }

            // Add new images
            selectedImages.forEach((image) => {
                if (Platform.OS === 'web' && image.file) {
                    formData.append('images', image.file);
                } else {
                    formData.append('images', {
                        uri: image.uri,
                        type: image.type,
                        name: image.name,
                    } as any);
                }
            });

            const url = product 
                ? `${Config.API_BASE_URL}/products/${product.id}`
                : `${Config.API_BASE_URL}/products`;
            
            const method = product ? 'PATCH' : 'POST';

            const response = await axios({
                method,
                url,
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
                timeout: 120000,
            });

            if (response.data.statusCode === 200 || response.data.statusCode === 201) {
                console.log('✅ Product saved successfully');
                
                // Reset form
                resetForm();
                
                // Close modal first
                onClose();
                
                // Trigger refresh
                onSave();
                
                // Show success message after a short delay
                setTimeout(() => {
                    Alert.alert(
                        'Success',
                        product ? 'Product updated successfully!' : 'Product created successfully!'
                    );
                }, 300);
            }
        } catch (error: any) {
            console.error('Product save error:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to save product. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                        <Feather name="x" size={sizeScale(24)} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                        {product ? 'Edit Product' : 'Add Product'}
                    </Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        style={[styles.modalSaveButton, loading && styles.modalSaveButtonDisabled]}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.modalSaveText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    {/* Images Section */}
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>
                            Product Images * ({existingImages.length + selectedImages.length}/{MAX_IMAGES})
                        </Text>
                        
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.imagesList}
                        >
                            {/* Existing Images */}
                            {existingImages.map((imageUrl, index) => (
                                <View key={`existing-${index}`} style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => handleRemoveExistingImage(imageUrl)}
                                    >
                                        <Feather name="x" size={sizeScale(16)} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {/* New Images */}
                            {selectedImages.map((image, index) => (
                                <View key={`new-${index}`} style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => handleRemoveNewImage(index)}
                                    >
                                        <Feather name="x" size={sizeScale(16)} color="#fff" />
                                    </TouchableOpacity>
                                    <View style={styles.newImageBadge}>
                                        <Text style={styles.newImageBadgeText}>New</Text>
                                    </View>
                                </View>
                            ))}

                            {/* Add Image Button */}
                            {(existingImages.length + selectedImages.length) < MAX_IMAGES && (
                                <TouchableOpacity
                                    style={styles.addImageButton}
                                    onPress={handlePickImages}
                                >
                                    <Feather name="plus" size={sizeScale(32)} color="#666" />
                                    <Text style={styles.addImageText}>Add Image</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>

                    {/* Product Details */}
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Product Details</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Product Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Professional Website Development"
                                placeholderTextColor="#666"
                                value={name}
                                onChangeText={setName}
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Description *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe your product or service..."
                                placeholderTextColor="#666"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Price (₹) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 25000"
                                placeholderTextColor="#666"
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Payment Terms / Minimum Quantity</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Payment terms: 50% advance, 50% on completion"
                                placeholderTextColor="#666"
                                value={minimumQuantity}
                                onChangeText={setMinimumQuantity}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    <View style={styles.bottomPadding} />
                </ScrollView>
            </View>
        </Modal>
    );
}

// --- Main My Products Screen ---
export default function MyProductsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getMyProducts();
            console.log('📦 Products API response:', response);
            
            // Handle both direct array and wrapped response
            const productsData = Array.isArray(response) ? response : (response?.data || []);
            console.log('📦 Products data:', productsData);
            
            setProducts(productsData);
        } catch (error: any) {
            console.error('Failed to load products:', error);
            Alert.alert('Error', error.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    };

    const handleAddProduct = () => {
        if (products.length >= MAX_PRODUCTS) {
            Alert.alert(
                'Product Limit Reached',
                `You can only add up to ${MAX_PRODUCTS} products. Please delete an existing product to add a new one.`
            );
            return;
        }
        setSelectedProduct(null);
        setShowModal(true);
    };

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    const handleDeleteProduct = async (productId: string) => {
        try {
            console.log('🗑️ Deleting product:', productId);
            await productsAPI.deleteProduct(productId);
            console.log('✅ Product deleted, reloading...');
            await loadProducts();
            Alert.alert('Success', 'Product deleted successfully');
        } catch (error: any) {
            console.error('❌ Delete error:', error);
            Alert.alert('Error', error.message || 'Failed to delete product');
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedProduct(null);
    };

    const handleProductSaved = async () => {
        console.log('🔄 Product saved, reloading products...');
        await loadProducts();
        console.log('✅ Products reloaded');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0095f6" />
                <Text style={styles.loadingText}>Loading products...</Text>
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
                <Text style={styles.headerTitle}>My Products</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddProduct}
                    disabled={products.length >= MAX_PRODUCTS}
                >
                    <Feather 
                        name="plus" 
                        size={sizeScale(24)} 
                        color={products.length >= MAX_PRODUCTS ? '#333' : '#fff'} 
                    />
                </TouchableOpacity>
            </View>

            {/* Products Count */}
            <View style={styles.countContainer}>
                <Text style={styles.countText}>
                    {products.length} / {MAX_PRODUCTS} Products
                </Text>
                {products.length >= MAX_PRODUCTS && (
                    <Text style={styles.limitText}>Maximum limit reached</Text>
                )}
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
                {products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={handleEditProduct}
                            onDelete={handleDeleteProduct}
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons 
                            name="package-variant" 
                            size={sizeScale(64)} 
                            color="#333" 
                        />
                        <Text style={styles.emptyTitle}>No Products Yet</Text>
                        <Text style={styles.emptyText}>
                            Add your first product to showcase your catalog
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyAddButton}
                            onPress={handleAddProduct}
                        >
                            <Feather name="plus" size={sizeScale(20)} color="#fff" />
                            <Text style={styles.emptyAddButtonText}>Add Product</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Add/Edit Product Modal */}
            <ProductModal
                visible={showModal}
                product={selectedProduct}
                onClose={handleModalClose}
                onSave={handleProductSaved}
            />
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
    addButton: {
        padding: sizeScale(8),
    },
    countContainer: {
        paddingHorizontal: sizeScale(16),
        paddingVertical: sizeScale(12),
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    countText: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
    },
    limitText: {
        fontSize: sizeScale(12),
        color: '#f59e0b',
        marginTop: sizeScale(4),
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: sizeScale(16),
        paddingBottom: sizeScale(120),
    },
    
    // Product Card Styles
    productCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: sizeScale(12),
        marginBottom: sizeScale(16),
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: sizeScale(200),
        backgroundColor: '#0a0a0a',
    },
    productContent: {
        padding: sizeScale(16),
    },
    productName: {
        fontSize: sizeScale(16),
        fontWeight: '600',
        color: '#fff',
        marginBottom: sizeScale(8),
    },
    productDescription: {
        fontSize: sizeScale(14),
        color: '#999',
        lineHeight: sizeScale(20),
        marginBottom: sizeScale(12),
    },
    productInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: sizeScale(12),
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(6),
    },
    productPrice: {
        fontSize: sizeScale(18),
        fontWeight: 'bold',
        color: '#10b981',
    },
    imageCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(4),
        backgroundColor: '#2a2a2a',
        paddingHorizontal: sizeScale(8),
        paddingVertical: sizeScale(4),
        borderRadius: sizeScale(12),
    },
    imageCountText: {
        fontSize: sizeScale(12),
        color: '#666',
    },
    productActions: {
        flexDirection: 'row',
        gap: sizeScale(12),
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
    editButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0095f6',
    },
    editButtonText: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#0095f6',
    },
    deleteButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    deleteButtonText: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#ef4444',
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
        paddingHorizontal: sizeScale(40),
    },
    emptyAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizeScale(8),
        backgroundColor: '#0095f6',
        paddingHorizontal: sizeScale(24),
        paddingVertical: sizeScale(12),
        borderRadius: sizeScale(8),
        marginTop: sizeScale(24),
    },
    emptyAddButtonText: {
        fontSize: sizeScale(16),
        fontWeight: '600',
        color: '#fff',
    },
    
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalHeader: {
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
    modalCloseButton: {
        padding: sizeScale(8),
    },
    modalTitle: {
        fontSize: sizeScale(18),
        fontWeight: '600',
        color: '#fff',
    },
    modalSaveButton: {
        backgroundColor: '#0095f6',
        paddingHorizontal: sizeScale(20),
        paddingVertical: sizeScale(8),
        borderRadius: sizeScale(8),
        minWidth: sizeScale(60),
        alignItems: 'center',
    },
    modalSaveButtonDisabled: {
        opacity: 0.5,
    },
    modalSaveText: {
        fontSize: sizeScale(14),
        fontWeight: '600',
        color: '#fff',
    },
    modalContent: {
        flex: 1,
    },
    modalSection: {
        padding: sizeScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    modalSectionTitle: {
        fontSize: sizeScale(16),
        fontWeight: '600',
        color: '#fff',
        marginBottom: sizeScale(16),
    },
    imagesList: {
        gap: sizeScale(12),
        paddingRight: sizeScale(16),
    },
    imagePreviewContainer: {
        width: sizeScale(120),
        height: sizeScale(120),
        borderRadius: sizeScale(8),
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
    },
    removeImageButton: {
        position: 'absolute',
        top: sizeScale(4),
        right: sizeScale(4),
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        width: sizeScale(24),
        height: sizeScale(24),
        borderRadius: sizeScale(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    newImageBadge: {
        position: 'absolute',
        bottom: sizeScale(4),
        left: sizeScale(4),
        backgroundColor: '#10b981',
        paddingHorizontal: sizeScale(6),
        paddingVertical: sizeScale(2),
        borderRadius: sizeScale(4),
    },
    newImageBadgeText: {
        fontSize: sizeScale(10),
        fontWeight: '600',
        color: '#fff',
    },
    addImageButton: {
        width: sizeScale(120),
        height: sizeScale(120),
        borderRadius: sizeScale(8),
        backgroundColor: '#1a1a1a',
        borderWidth: 2,
        borderColor: '#2a2a2a',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImageText: {
        fontSize: sizeScale(12),
        color: '#666',
        marginTop: sizeScale(4),
    },
    inputGroup: {
        marginBottom: sizeScale(16),
    },
    inputLabel: {
        fontSize: sizeScale(14),
        color: '#fff',
        marginBottom: sizeScale(8),
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: sizeScale(8),
        padding: sizeScale(12),
        fontSize: sizeScale(15),
        color: '#fff',
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    textArea: {
        minHeight: sizeScale(100),
        paddingTop: sizeScale(12),
        textAlignVertical: 'top',
    },
    bottomPadding: {
        height: sizeScale(40),
    },
});