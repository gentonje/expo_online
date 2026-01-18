import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { confirmAction } from '../lib/alerts';
import { Search, Trash2, Package, Edit } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface UserStat {
    id: string;
    username: string | null;
    product_count: number;
    is_active: boolean;
    user_type: string;
}

export default function UserManagementScreen() {
    const navigation = useNavigation<any>();
    const [userStats, setUserStats] = useState<UserStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'products'>('users');
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUserStats();
        } else {
            fetchProducts();
        }
    }, [activeTab]);

    const fetchUserStats = async () => {
        try {
            setLoading(true);
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, user_type, is_active')
                .order('username');

            if (profilesError) throw profilesError;

            const stats = await Promise.all(profiles.map(async (profile: any) => {
                const { count } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', profile.id);

                return {
                    ...profile,
                    product_count: count || 0
                };
            }));

            setUserStats(stats as UserStat[]);
        } catch (error: any) {
            console.error('Error fetching user stats:', error);
            Alert.alert('Error', 'Failed to load user statistics');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_images(*),
                    profiles:user_id (username)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error: any) {
            console.error('Error fetching products:', error);
            Alert.alert('Error', 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        console.log('Admin delete button clicked for product ID:', productId);
        confirmAction({
            title: "Delete Product",
            message: "Are you sure you want to delete this product?",
            confirmText: "Delete",
            style: "destructive",
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('products')
                        .delete()
                        .eq('id', productId);

                    if (error) throw error;
                    setProducts(prev => prev.filter(p => p.id !== productId));
                    Alert.alert('Success', 'Product deleted');
                } catch (error: any) {
                    console.error('Error deleting product:', error);
                    Alert.alert('Error', error.message || 'Failed to delete product');
                }
            }
        });
    };

    const filteredUsers = userStats.filter(user =>
        (user.username?.toLowerCase() || '').includes(search.toLowerCase())
    );

    const filteredProducts = products.filter(product =>
        (product.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (product.profiles?.username?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <View className="flex-row items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-4">
                <Search color="#64748b" size={20} />
                <TextInput
                    placeholder="Search users or products..."
                    value={search}
                    onChangeText={setSearch}
                    className="flex-1 ml-2 text-base text-gray-900"
                />
            </View>

            <View className="flex-row bg-gray-200 rounded-lg p-1 mb-4">
                <TouchableOpacity
                    onPress={() => setActiveTab('users')}
                    className={`flex-1 py-2 rounded-md items-center ${activeTab === 'users' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-bold ${activeTab === 'users' ? 'text-blue-600' : 'text-gray-600'}`}>Users</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('products')}
                    className={`flex-1 py-2 rounded-md items-center ${activeTab === 'products' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-bold ${activeTab === 'products' ? 'text-blue-600' : 'text-gray-600'}`}>Products</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <ScrollView className="flex-1">
                    {activeTab === 'users' ? (
                        filteredUsers.map((user) => (
                            <View key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-lg font-bold text-gray-900">{user.username || 'Anonymous'}</Text>
                                        <Text className="text-gray-500">{user.product_count} Products</Text>
                                    </View>
                                    <View className={`px-2 py-1 rounded-md ${user.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
                                        <Text className={`text-xs font-bold ${user.is_active ? 'text-green-700' : 'text-red-700'}`}>
                                            {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        filteredProducts.map((product) => (
                            <View key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
                                <View className="flex-row items-center">
                                    <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                        {product.product_images?.[0]?.storage_path ? (
                                            <Image
                                                source={{ uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${product.product_images[0].storage_path}` }}
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            <Package size={24} color="#94a3b8" />
                                        )}
                                    </View>
                                    <View className="flex-1 ml-3">
                                        <Text className="text-base font-bold text-gray-900" numberOfLines={1}>{product.title}</Text>
                                        <Text className="text-gray-500 text-sm">By {product.profiles?.username || 'Unknown'}</Text>
                                        <Text className="text-blue-600 font-bold">${product.price}</Text>
                                    </View>
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
                                            className="p-2"
                                        >
                                            <Edit color="#3b82f6" size={20} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteProduct(product.id)}
                                            className="p-2"
                                        >
                                            <Trash2 color="#ef4444" size={20} />
                                        </TouchableOpacity>
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
