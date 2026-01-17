import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Trash2, Plus, Minus, Package, ChevronLeft } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useFeedback } from '../contexts/FeedbackContext';

export default function CartScreen() {
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { showToast } = useFeedback();
    const navigation = useNavigation<any>();

    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [])
    );

    const fetchCart = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setCartItems([]);
                setTotal(0);
                return;
            }

            // First get or create cart
            let { data: cart, error: cartFetchError } = await supabase
                .from('cart')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (cartFetchError) throw cartFetchError;

            if (!cart) {
                const { data: newCart, error: cartCreateError } = await supabase
                    .from('cart')
                    .insert({ user_id: user.id })
                    .select('id')
                    .single();
                
                if (cartCreateError) throw cartCreateError;
                cart = newCart;
            }

            if (cart) {
                const { data: items, error: itemsError } = await supabase
                    .from('cart_items')
                    .select(`
                        id,
                        quantity,
                        products (
                            id,
                            title,
                            price,
                            storage_path
                        )
                    `)
                    .eq('cart_id', cart.id)
                    .order('created_at', { ascending: false });

                if (itemsError) throw itemsError;
                setCartItems(items || []);
                calculateTotal(items || []);
            }
        } catch (error: any) {
            console.error('Error fetching cart:', error);
            showToast(error.message || 'Failed to load cart', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = (items: any[]) => {
        const sum = items.reduce((acc, item) => acc + (item.products?.price || 0) * item.quantity, 0);
        setTotal(sum);
    };

    const handleUpdateQuantity = async (itemId: string, newQty: number) => {
        if (newQty < 1) return;
        try {
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: newQty })
                .eq('id', itemId);

            if (error) throw error;
            setCartItems(prev => {
                const updated = prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item);
                calculateTotal(updated);
                return updated;
            });
        } catch (error) {
            showToast('Failed to update quantity', 'error');
        }
    };


    const handleRemove = async (itemId: string) => {
        try {
            const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
            if (error) throw error;
            setCartItems(prev => {
                const updated = prev.filter(item => item.id !== itemId);
                calculateTotal(updated);
                return updated;
            });
        } catch (error) {
            showToast('Failed to remove item', 'error');
        }
    };


    return (
        <View className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-100 flex-row items-center pt-12">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                    <ChevronLeft color="#1e293b" size={28} />
                </TouchableOpacity>
                <View className="flex-1 flex-row justify-between items-center">
                    <Text className="text-2xl font-bold text-gray-900">Your Cart</Text>
                    <View className="bg-blue-100 px-3 py-1 rounded-full">
                        <Text className="text-blue-700 font-bold">{cartItems.length} Items</Text>
                    </View>
                </View>
            </View>


            {loading ? (
                <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
            ) : (
                <ScrollView
                    className="flex-1 p-4"
                    contentContainerStyle={{ paddingBottom: 100 }}
                >


                    {cartItems.length === 0 ? (
                        <View className="items-center justify-center mt-20">
                            <ShoppingCart size={80} color="#cbd5e1" />
                            <Text className="text-gray-500 mt-4 text-lg">Your cart is empty</Text>
                        </View>
                    ) : (
                        cartItems.map((item) => (
                            <View key={item.id} className="bg-white rounded-2xl border border-gray-100 mb-4 shadow-sm p-3 flex-row">
                                <View className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden">
                                    {item.products?.storage_path ? (
                                        <Image
                                            source={{ uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${item.products.storage_path}` }}
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <Package size={24} color="#94a3b8" />
                                    )}
                                </View>
                                <View className="flex-1 ml-3 justify-between">
                                    <View className="flex-row justify-between">
                                        <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={1}>{item.products?.title}</Text>
                                        <TouchableOpacity onPress={() => handleRemove(item.id)}>
                                            <Trash2 size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <View className="flex-row justify-between items-end">
                                        <Text className="text-blue-600 font-bold text-lg">${item.products?.price}</Text>
                                        <View className="flex-row items-center bg-gray-100 rounded-lg">
                                            <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="p-2">
                                                <Minus size={16} color="#64748b" />
                                            </TouchableOpacity>
                                            <Text className="px-2 font-bold text-gray-900">{item.quantity}</Text>
                                            <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-2">
                                                <Plus size={16} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {cartItems.length > 0 && (
                <View className="p-6 bg-white border-t border-gray-100 shadow-lg">
                    <View className="flex-row justify-between mb-4">
                        <Text className="text-gray-500 text-lg">Total Amount</Text>
                        <Text className="text-orange-600 font-black text-2xl">${total.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Checkout', { total })}
                        className="bg-blue-600 p-4 rounded-2xl items-center shadow-md shadow-blue-100 active:scale-95 transition-all"
                    >
                        <Text className="text-white font-bold text-lg">Go to Checkout</Text>
                    </TouchableOpacity>

                </View>
            )}
        </View>
    );
}
