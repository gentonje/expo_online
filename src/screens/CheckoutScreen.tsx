import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useShopping } from '../hooks/useShopping';
import { MapPin, Phone, User as UserIcon, CreditCard, ChevronLeft } from 'lucide-react-native';

export default function CheckoutScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { total } = route.params as { total: number };
    const { placeOrder } = useShopping();

    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [formData, setFormData] = useState({
        full_name: '',
        address: '',
        phone: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, address, phone_number')
                .eq('id', user.id)
                .single();

            if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    address: data.address || '',
                    phone: data.phone_number || '',
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!formData.full_name || !formData.address || !formData.phone) {
            Alert.alert('Missing Information', 'Please fill in all shipping details.');
            return;
        }

        setLoading(true);
        try {
            const order = await placeOrder({
                ...formData,
                total_amount: total
            });

            if (order) {
                navigation.navigate('OrderSuccess', { orderId: order.id });
            }
        } catch (error) {
            console.error('Order placement failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-gray-50"
        >
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 40 }}
            >

                <View className="p-4 bg-white border-b border-gray-100 flex-row items-center pt-12">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                        <ChevronLeft color="#1e293b" size={28} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">Checkout</Text>
                </View>

                <View className="p-6">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Shipping Information</Text>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Full Name</Text>
                            <View className="flex-row items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <UserIcon size={20} color="#94a3b8" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-gray-900"
                                    value={formData.full_name}
                                    onChangeText={(t) => setFormData(p => ({ ...p, full_name: t }))}
                                    placeholder="John Doe"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Phone Number</Text>
                            <View className="flex-row items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <Phone size={20} color="#94a3b8" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-gray-900"
                                    value={formData.phone}
                                    onChangeText={(t) => setFormData(p => ({ ...p, phone: t }))}
                                    placeholder="+12345678"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Shipping Address</Text>
                            <View className="flex-row items-start bg-white p-4 rounded-2xl border border-gray-100 shadow-sm min-h-[100px]">
                                <MapPin size={20} color="#94a3b8" style={{ marginTop: 4 }} />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-gray-900"
                                    value={formData.address}
                                    onChangeText={(t) => setFormData(p => ({ ...p, address: t }))}
                                    placeholder="123 Shopping Lane, Mall City"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>

                    <View className="mt-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Order Summary</Text>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-500">Subtotal</Text>
                            <Text className="text-gray-900 font-bold">${total.toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-500">Shipping</Text>
                            <Text className="text-green-600 font-bold">FREE</Text>
                        </View>
                        <View className="h-[1px] bg-gray-100 my-4" />
                        <View className="flex-row justify-between items-center">
                            <Text className="text-xl font-bold text-gray-900">Total</Text>
                            <Text className="text-2xl font-black text-orange-600">${total.toFixed(2)}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handlePlaceOrder}
                        disabled={loading}
                        className="bg-blue-600 p-5 rounded-2xl flex-row items-center justify-center mt-8 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <CreditCard color="white" size={24} />
                                <Text className="text-white font-bold text-xl ml-2">Place Order</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
