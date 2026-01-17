import * as React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getProductMainImage } from '../lib/image-utils';

interface ProductCardProps {
    product: any;
    showPrice?: boolean;
    actions?: React.ReactNode;
    onPress?: () => void;
}

export default function ProductCard({ product, showPrice = true, actions, onPress }: ProductCardProps) {
    const navigation = useNavigation<any>();
    const imageUrl = getProductMainImage(product);

    const handlePress = onPress || (() => navigation.navigate('ProductDetail', { productId: product.id }));

    return (
        <View className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
                className="flex-1"
            >
                <View className="aspect-square bg-gray-100">
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </View>
                <View className="p-3">
                    <Text className="font-semibold text-gray-900 mb-1" numberOfLines={1}>
                        {product.title}
                    </Text>
                    {showPrice && (
                        <Text className="text-blue-600 font-bold">
                            {product.currency || '$'} {product.price}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
            {actions && <View className="p-3 pt-0">{actions}</View>}
        </View>
    );
}
