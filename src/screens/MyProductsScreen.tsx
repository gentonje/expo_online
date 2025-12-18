import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';
import { Package, Trash2, Edit2, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function MyProductsScreen() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<any>();

    useEffect(() => {
        fetchMyProducts();
    }, []);

    const fetchMyProducts = async () => {
        try {
            setLoading(true);
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
            Alert.alert('Error', 'Failed to load your products');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyProducts();
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Delete Product",
            "Are you sure you want to delete this product?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('products').delete().eq('id', id);
                            if (error) throw error;
                            setProducts(prev => prev.filter(p => p.id !== id));
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to delete product');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-2xl font-bold text-gray-900">My Store</Text>
                    <Text className="text-gray-500">Manage your listings</Text>
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
                <ActivityIndicator size="large" color="#2563eb" />
            ) : (
                <ScrollView
                    className="flex-1"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                        products.map((product) => (
                            <View key={product.id} className="bg-white rounded-2xl border border-gray-100 mb-4 shadow-sm overflow-hidden">
                                <View className="flex-row p-3">
                                    <View className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden">
                                        {product.product_images?.[0]?.storage_path ? (
                                            <Image
                                                source={{ uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${product.product_images[0].storage_path}` }}
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            <Package size={32} color="#94a3b8" />
                                        )}
                                    </View>
                                    <View className="flex-1 ml-3 justify-between py-1">
                                        <View>
                                            <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>{product.title}</Text>
                                            <Text className="text-gray-500 text-sm" numberOfLines={2}>{product.description}</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-orange-600 font-bold text-lg">${product.price}</Text>
                                            <View className="flex-row gap-2">
                                                <TouchableOpacity
                                                    onPress={() => handleDelete(product.id)}
                                                    className="p-2 bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={18} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}
