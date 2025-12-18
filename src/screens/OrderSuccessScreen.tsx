import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

export default function OrderSuccessScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { orderId } = route.params as { orderId: string };

    return (
        <View className="flex-1 bg-white items-center justify-center p-8">
            <Animated.View
                entering={ZoomIn.duration(600)}
                className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-8"
            >
                <CheckCircle2 size={64} color="#10b981" />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(300).duration(600)}>
                <Text className="text-3xl font-black text-gray-900 text-center mb-2">Order Success!</Text>
                <Text className="text-gray-500 text-center text-lg mb-10">
                    Your order #{orderId ? orderId.slice(0, 8).toUpperCase() : 'UNKNOWN'} has been placed successfully and will be processed soon.
                </Text>
            </Animated.View>

            <Animated.View
                entering={FadeInUp.delay(600).duration(600)}
                className="w-full"
            >
                <TouchableOpacity
                    onPress={() => navigation.navigate('BrowseProducts')}
                    className="bg-blue-600 p-5 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-all mb-4"
                >
                    <ShoppingBag color="white" size={24} />
                    <Text className="text-white font-bold text-xl ml-3">Continue Shopping</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('Dashboard')}
                    className="bg-gray-50 p-5 rounded-2xl flex-row items-center justify-center active:scale-95 transition-all"
                >
                    <Text className="text-gray-700 font-bold text-lg mr-2">Back to Dashboard</Text>
                    <ArrowRight color="#374151" size={20} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}
