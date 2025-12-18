import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
    Dashboard: undefined;
    BrowseProducts: { category?: string } | undefined;
    ProductDetail: { productId: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function BrowseProductsScreen() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, product_images(*)')
                .eq('product_status', 'published')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }

    const renderProduct = ({ item }: { item: any }) => {
        const imageUrl = item.product_images?.[0]?.storage_path
            ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${item.product_images[0].storage_path}`
            : 'https://via.placeholder.com/150';

        return (
            <TouchableOpacity
                className="flex-1 m-2 bg-white rounded-xl shadow-sm overflow-hidden"
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            >
                <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-40 bg-gray-200"
                    resizeMode="cover"
                />
                <View className="p-3">
                    <Text className="font-semibold text-gray-900 mb-1" numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text className="text-blue-600 font-bold">
                        {item.currency} {item.price}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
            />

        </View>
    );
}
