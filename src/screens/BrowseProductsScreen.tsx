import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ProductGrid from '../components/ProductGrid';
import ProductCard from '../components/ProductCard';

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

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }} className="bg-gray-50">
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                showsVerticalScrollIndicator={true}
            >
                <ProductGrid
                    items={products}
                    renderItem={(product) => <ProductCard product={product} />}
                />
            </ScrollView>
        </View>
    );
}
