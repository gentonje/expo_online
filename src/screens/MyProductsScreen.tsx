import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { confirmAction, showMessage } from '../lib/alerts';
import { removeStorageFiles } from '../lib/image-utils';
import { Package, Trash2, Plus, Edit } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ProductGrid from '../components/ProductGrid';
import ProductCard from '../components/ProductCard';

export default function MyProductsScreen() {
    const { user } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<any>();

    // Refetch on focus so adds and edits show up after navigating back
    useFocusEffect(
        useCallback(() => {
            fetchMyProducts();
        }, [])
    );

    const fetchMyProducts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_images (
                        id,
                        storage_path,
                        is_main
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error: any) {
            console.error('Error fetching my products:', error);
            showMessage('Error', 'Failed to load your products');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyProducts();
    };

    const handleDelete = (product: any) => {
        confirmAction({
            title: "Delete Product",
            message: "Are you sure you want to delete this product?",
            confirmText: "Delete",
            style: "destructive",
            onConfirm: async () => {
                try {
                    const { data: deletedRows, error } = await supabase
                        .from('products')
                        .delete()
                        .eq('id', product.id)
                        .select('id');

                    if (error) throw error;
                    // RLS returns no error when nothing matched, so confirm a row was removed
                    if (!deletedRows || deletedRows.length === 0) {
                        throw new Error('This product could not be deleted. It may already be removed, or you may not have permission.');
                    }

                    await removeStorageFiles([
                        product.storage_path,
                        ...(product.product_images || []).map((img: any) => img.storage_path)
                    ]);

                    setProducts(prev => prev.filter(p => p.id !== product.id));
                    showMessage('Success', 'Product deleted successfully');
                } catch (error: any) {
                    console.error('Error deleting product:', error);
                    showMessage('Error', error.message || 'Failed to delete product');
                }
            }
        });
    };

    return (
        <View style={{ flex: 1 }} className="bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-100 flex-row justify-between items-center pt-12">
                <View>
                    <Text className="text-2xl font-bold text-gray-900">My Store</Text>
                    <Text className="text-gray-500 text-xs">Manage your listings</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddProduct')}
                    className="bg-orange-500 flex-row items-center px-4 py-2 rounded-xl"
                >
                    <Plus color="white" size={20} />
                    <Text className="text-white font-bold ml-1">Add New</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={true}
                >
                    {products.length === 0 ? (
                        <View className="items-center justify-center mt-20">
                            <Package size={64} color="#cbd5e1" />
                            <Text className="text-gray-500 mt-4 text-lg">No products listed yet</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('AddProduct')}
                                className="mt-4 border border-orange-500 px-6 py-2 rounded-full"
                            >
                                <Text className="text-orange-500 font-bold">List your first item</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ProductGrid
                            items={products}
                            renderItem={(product) => (
                                <ProductCard
                                    product={product}
                                    actions={
                                        <View className="flex-row gap-2">
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (product.user_id === user?.id) {
                                                        navigation.navigate('EditProduct', { productId: product.id });
                                                    } else {
                                                        showMessage('Permission Denied', 'You can only edit your own products');
                                                    }
                                                }}
                                                className={`flex-1 py-2 rounded-lg items-center flex-row justify-center ${product.user_id === user?.id ? 'bg-blue-50' : 'bg-gray-50 opacity-50'}`}
                                            >
                                                <Edit size={16} color={product.user_id === user?.id ? "#3b82f6" : "#94a3b8"} />
                                                <Text className={`${product.user_id === user?.id ? 'text-blue-600' : 'text-gray-400'} text-xs font-bold ml-1`}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (product.user_id === user?.id) {
                                                        handleDelete(product);
                                                    } else {
                                                        showMessage('Permission Denied', 'You can only delete your own products');
                                                    }
                                                }}
                                                className={`flex-1 py-2 rounded-lg items-center flex-row justify-center ${product.user_id === user?.id ? 'bg-red-50' : 'bg-gray-50 opacity-50'}`}
                                            >
                                                <Trash2 size={16} color={product.user_id === user?.id ? "#ef4444" : "#94a3b8"} />
                                                <Text className={`${product.user_id === user?.id ? 'text-red-600' : 'text-gray-400'} text-xs font-bold ml-1`}>Delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    }
                                />
                            )}
                        />
                    )}
                </ScrollView>
            )}
        </View>
    );
}
