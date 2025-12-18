import React from 'react';
import { View, Text } from 'react-native';

export default function AboutScreen() {
    return (
        <View className="flex-1 justify-center items-center bg-gray-50">
            <Text className="text-xl font-bold text-gray-900">About MarketPlace</Text>
            <Text className="text-gray-500 mt-2">Version 1.0.0</Text>
        </View>
    );
}
