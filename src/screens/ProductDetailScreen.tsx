import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ShoppingCart, Heart } from 'lucide-react-native';
import { useShopping } from '../hooks/useShopping';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);



const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation<any>();

    const { productId } = route.params as { productId: string };

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [similarProducts, setSimilarProducts] = useState<any[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);


    useEffect(() => {
        fetchProductDetails();
    }, [productId]);

    async function fetchProductDetails() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('products')
                .select('*, product_images(*), profiles(username)')
                .eq('id', productId)
                .single();

            if (error) throw error;
            setProduct(data);

            if (user) {
                checkWishlistStatus(user.id);
            }
            fetchSimilarProducts(data.category);
        } catch (error) {
            console.error('Error fetching product details:', error);
            Alert.alert('Error', 'Could not load product details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }

    async function checkWishlistStatus(userId: string) {
        try {
            const { data } = await supabase
                .from('wishlist')
                .select('id')
                .eq('user_id', userId)
                .eq('product_id', productId)
                .maybeSingle();

            setIsWishlisted(!!data);
        } catch (error) {
            console.error('Error checking wishlist status:', error);
        }
    }

    async function fetchSimilarProducts(category: string) {
        try {
            let query = supabase
                .from('products')
                .select('*, product_images(*)')
                .eq('product_status', 'published')
                .neq('id', productId)
                .limit(10);

            if (category) {
                query = query.eq('category', category);
            }

            const { data } = await query;
            setSimilarProducts(data || []);
        } catch (error) {
            console.error('Error fetching similar products:', error);
        }
    }


    const { addToCart, toggleWishlist } = useShopping();

    const cartScale = useSharedValue(1);
    const wishlistScale = useSharedValue(1);

    const cartAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cartScale.value }]
    }));

    const wishlistAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: wishlistScale.value }]
    }));

    const handleAddToCart = async () => {
        cartScale.value = withSpring(0.9, { damping: 10, stiffness: 100 }, () => {
            cartScale.value = withSpring(1);
        });
        await addToCart(productId);
    };

    const handleAddToWishlist = async () => {
        wishlistScale.value = withSpring(0.8, { damping: 5, stiffness: 200 }, () => {
            wishlistScale.value = withSpring(1.2, {}, () => {
                wishlistScale.value = withSpring(1);
            });
        });
        const result = await toggleWishlist(productId);
        if (result.success) {
            setIsWishlisted(result.action === 'added');
        }
    };





    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (!product) return null;

    const images = product.product_images?.map((img: any) =>
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${img.storage_path}`
    ) || ['https://via.placeholder.com/400'];

    return (
        <View className="flex-1 bg-white">


            {/* Header */}
            <View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center p-4 pt-12">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 bg-white/80 rounded-full justify-center items-center shadow-sm"
                >
                    <ArrowLeft color="#000" size={24} />
                </TouchableOpacity>
                <AnimatedPressable
                    onPress={handleAddToWishlist}
                    style={wishlistAnimatedStyle}
                    className="w-10 h-10 bg-white/80 rounded-full justify-center items-center shadow-sm"
                >
                    <Heart color={isWishlisted ? "#FFD700" : "#000"} fill={isWishlisted ? "#FFD700" : "none"} size={24} />
                </AnimatedPressable>


            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Gallery */}
                <View className="h-96 bg-gray-100">
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                            setActiveImageIndex(newIndex);
                        }}
                    >
                        {images.map((img: string, index: number) => (
                            <Image
                                key={index}
                                source={{ uri: img }}
                                style={{ width, height: 384 }}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View className="absolute bottom-4 left-0 right-0 flex-row justify-center space-x-2">
                        {images.map((_: any, index: number) => (
                            <View
                                key={index}
                                className={`w-2 h-2 rounded-full ${index === activeImageIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                            />
                        ))}
                    </View>
                </View>

                {/* Product Info */}
                <View className="p-5">
                    <View className="flex-row justify-between items-start mb-4">

                        <View className="flex-1 mr-4">
                            <Text className="text-sm text-blue-600 font-semibold mb-1 uppercase tracking-wider">
                                {product.category || 'General'}
                            </Text>
                            <Text className="text-2xl font-bold text-gray-900 leading-tight">
                                {product.title}
                            </Text>
                        </View>
                        <Text className="text-xl font-bold text-blue-600">
                            {product.currency} {product.price}
                        </Text>
                    </View>

                    {/* Seller Info */}
                    <View className="flex-row items-center p-3 border-y border-gray-100 mb-4 space-x-3">

                        <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center">
                            <Text className="text-lg font-bold text-gray-500">
                                {product.profiles?.username?.[0]?.toUpperCase() || 'S'}
                            </Text>
                        </View>
                        <View>
                            <Text className="font-semibold text-gray-900">
                                {product.profiles?.username || 'Seller'}
                            </Text>
                            <Text className="text-xs text-gray-500">Verified Seller</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View className="mb-6">
                        <Text className="text-lg font-semibold text-gray-900 mb-2">Description</Text>
                        <Text className="text-gray-600 leading-6">
                            {product.description || 'No description available.'}
                        </Text>
                    </View>

                    {/* Additional Details */}
                    <View className="flex-row flex-wrap gap-2 mt-2">
                        <View className="bg-gray-100 px-3 py-1 rounded-full">
                            <Text className="text-xs text-gray-600">Stock: {product.in_stock ? 'In Stock' : 'Out of Stock'}</Text>
                        </View>
                        <View className="bg-gray-100 px-3 py-1 rounded-full">
                            <Text className="text-xs text-gray-600">Views: {product.views || 0}</Text>
                        </View>
                    </View>

                    {/* Similar Products */}
                    {similarProducts.length > 0 && (
                        <View className="mt-8 mb-4">
                            <Text className="text-lg font-bold text-gray-900 mb-4 px-1">Similar Products</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="flex-row"
                            >
                                {similarProducts.map((p) => {
                                    const imageUrl = p.product_images?.[0]?.storage_path
                                        ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${p.product_images[0].storage_path}`
                                        : 'https://via.placeholder.com/150';

                                    return (
                                        <TouchableOpacity
                                            key={p.id}
                                            onPress={() => {
                                                navigation.push('ProductDetail', { productId: p.id });
                                            }}

                                            className="w-36 mr-4 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
                                        >
                                            <Image
                                                source={{ uri: imageUrl }}
                                                className="w-full h-32 bg-gray-100"
                                            />
                                            <View className="p-2 bg-white">
                                                <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                                                    {p.title || 'Untitled Product'}
                                                </Text>
                                                <Text className="text-xs text-blue-600 font-bold mt-1">
                                                    {p.currency || '$'} {p.price || '0.00'}
                                                </Text>
                                            </View>

                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ScrollView>


            {/* Bottom Action Bar */}
            <View className="p-4 bg-white border-t border-gray-100 absolute bottom-0 left-0 right-0">

                <AnimatedPressable
                    style={[{ width: '100%' }, cartAnimatedStyle]}
                    className="bg-blue-600 py-4 rounded-xl flex-row justify-center items-center space-x-2 shadow-lg shadow-blue-200"
                    onPress={handleAddToCart}
                >
                    <ShoppingCart color="white" size={20} />
                    <Text className="text-white font-bold text-lg">Add to Cart</Text>
                </AnimatedPressable>

            </View>
        </View>
    );
}
