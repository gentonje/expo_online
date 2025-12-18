import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Heart, Package, ShoppingBag, ChevronLeft } from 'lucide-react-native';

import { useShopping } from '../hooks/useShopping';
import { useFeedback } from '../contexts/FeedbackContext';

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);

export default function WishlistScreen() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<any>();
    const { addToCart, removeFromWishlist } = useShopping();
    const { showToast } = useFeedback();

    useFocusEffect(
        useCallback(() => {
            fetchWishlist();
        }, [])
    );


    const fetchWishlist = async () => {
        try {
            if (items.length === 0) setLoading(true);
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
                        description
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
                    className="flex-1 p-4"
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
                        <View className="flex-row flex-wrap justify-between">
                            {items.map((item) => (
                                <View key={item.id} className="bg-white rounded-2xl border border-gray-100 mb-4 shadow-sm overflow-hidden w-[48%]">
                                    <View className="aspect-square bg-gray-100">
                                        {item.products?.storage_path ? (
                                            <Image
                                                source={{ uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${item.products.storage_path}` }}
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            <Package size={40} color="#94a3b8" />
                                        )}
                                        <TouchableOpacity
                                            onPress={() => handleRemoveFromWishlist(item.id)}
                                            className="absolute top-2 right-2 bg-white/80 p-2 rounded-full"
                                        >
                                            <Heart size={18} color="#ef4444" fill="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <View className="p-3">
                                        <Text className="text-base font-bold text-gray-900" numberOfLines={1}>{item.products?.title}</Text>
                                        <Text className="text-orange-600 font-bold mt-1">${item.products?.price}</Text>
                                        <AnimatedPressable
                                            onPress={() => handleAddToCart(item.products.id)}
                                            className="mt-3 bg-blue-600 py-2 rounded-lg items-center flex-row justify-center active:scale-95 transition-all"
                                        >
                                            <ShoppingBag color="white" size={14} />
                                            <Text className="text-white text-xs font-bold ml-1">Add to Cart</Text>
                                        </AnimatedPressable>


                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}
