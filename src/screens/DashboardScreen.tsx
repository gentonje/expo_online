import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ShoppingBag, Star, TrendingUp, Heart, Zap } from 'lucide-react-native';

export default function DashboardScreen() {
    const navigation = useNavigation<any>();

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            contentContainerStyle={{ paddingBottom: 100 }}
        >

            <View className="p-6">
                <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome back! 👋</Text>
                <Text className="text-gray-600 mb-8">Discover amazing products curated just for you</Text>

                {/* Quick Actions */}
                <View className="flex-row flex-wrap justify-between gap-4 mb-8">
                    <TouchableOpacity
                        className="bg-blue-600 p-4 rounded-2xl flex-1 items-center justify-center min-w-[45%]"
                        onPress={() => navigation.navigate('BrowseProducts')}
                    >
                        <Zap color="white" size={32} />
                        <Text className="text-white font-bold mt-2">Flash Deals</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-pink-600 p-4 rounded-2xl flex-1 items-center justify-center min-w-[45%]"
                        onPress={() => navigation.navigate('Wishlist')}
                    >
                        <Heart color="white" size={32} />
                        <Text className="text-white font-bold mt-2">Your Wishlist</Text>
                    </TouchableOpacity>
                </View>

                {/* Summary Stats / Sections */}
                <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <Text className="text-xl font-bold text-gray-900 mb-4">Shop by Category</Text>
                    <View className="flex-row flex-wrap gap-3">
                        {['Electronics', 'Fashion', 'Home', 'Beauty'].map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                className="bg-gray-100 px-4 py-2 rounded-full"
                                onPress={() => navigation.navigate('BrowseProducts', { category: cat })}
                            >
                                <Text className="text-gray-700 font-medium">{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    className="mt-6 bg-orange-500 p-4 rounded-2xl items-center"
                    onPress={() => navigation.navigate('BrowseProducts')}
                >
                    <Text className="text-white font-bold text-lg">Browse All Products</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
