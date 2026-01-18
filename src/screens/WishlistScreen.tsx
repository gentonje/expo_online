import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Heart, ShoppingBag, ChevronLeft } from 'lucide-react-native';

import { useShopping } from '../hooks/useShopping';
import { useFeedback } from '../contexts/FeedbackContext';

import Animated from 'react-native-reanimated';
import ProductGrid from '../components/ProductGrid';
import ProductCard from '../components/ProductCard';

const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);

export default function WishlistScreen() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<any>();
    const { addToCart, removeFromWishlist } = useShopping();
    const { showToast } = useFeedback();

    useFocusEffect(
        useCallback(() => {
            const fetchWishlist = async () => {
                try {
                    // Only start loading indication if we don't have items yet to prevent flickering
                    // but we might want to check for stale data if needed.
                    // For now, let's just fetch silently if we have items, or maybe set loading?
                    // Original code: if (items.length === 0) setLoading(true);

                    // We need a way to know if we should show loading. 
                    // Since this runs on focus, we might not want full screen loading every time.
                    // But to be safe and match original intent:
                    // Actually, let's keep it simple.

                    const { data: { user } } = await supabase.auth.getUser();

                    if (!user) return;

                    const { data, error } = await supabase
                        .from('wishlist')
                        .select(`
                            id,
                            products (
                                id,
                                title,
                                price,
                                storage_path,
                                description,
                                currency
                            )
                        `)
                        .eq('user_id', user.id);

                    if (error) throw error;
                    setItems(data || []);
                } catch (error) {
                    console.error('Error fetching wishlist:', error);
                    showToast('Failed to load wishlist', 'error');
                } finally {
                    setLoading(false);
                }
            };

            fetchWishlist();
        }, [showToast])
    );


    const handleRemoveFromWishlist = async (itemId: string) => {
        const success = await removeFromWishlist(itemId);
        if (success) {
            setItems(prev => prev.filter(i => i.id !== itemId));
        }
    };

    const handleAddToCart = async (productId: string) => {
        await addToCart(productId);
    };


    return (
        <View className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-100 flex-row items-center pt-12">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                    <ChevronLeft color="#1e293b" size={28} />
                </TouchableOpacity>
                <View>
                    <Text className="text-2xl font-bold text-gray-900">Wishlist</Text>
                    <Text className="text-gray-500 text-xs">Items saved for later</Text>
                </View>
            </View>


            {loading ? (
                <ActivityIndicator size="large" color="#2563eb" />
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {items.length === 0 ? (
                        <View className="items-center justify-center mt-20">
                            <Heart size={80} color="#cbd5e1" fill="#f1f5f9" />
                            <Text className="text-gray-500 mt-4 text-lg">Your wishlist is empty</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('BrowseProducts')}
                                className="mt-4 bg-orange-500 px-8 py-3 rounded-full"
                            >
                                <Text className="text-white font-bold">Start Shopping</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ProductGrid
                            items={items}
                            renderItem={(item) => (
                                <ProductCard
                                    product={item.products}
                                    actions={
                                        <View className="space-y-2">
                                            <AnimatedPressable
                                                onPress={() => handleAddToCart(item.products.id)}
                                                className="bg-blue-600 py-2 rounded-lg items-center flex-row justify-center active:scale-95"
                                            >
                                                <ShoppingBag color="white" size={14} />
                                                <Text className="text-white text-xs font-bold ml-1">To Cart</Text>
                                            </AnimatedPressable>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveFromWishlist(item.id)}
                                                className="bg-gray-100 py-2 rounded-lg items-center flex-row justify-center"
                                            >
                                                <Heart size={14} color="#ef4444" fill="#ef4444" />
                                                <Text className="text-gray-600 text-xs font-bold ml-1">Remove</Text>
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
