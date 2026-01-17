import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Camera, Package, MapPin, Globe, Tag, ArrowLeft, DollarSign, Hash, Check, X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Toys', 'Other'];

export default function AddProductScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Electronics',
        available_quantity: '1',
        county: '',
        country_id: '',
        validity_period: 'day'
    });
    const [images, setImages] = useState<Array<{ uri: string; isMain: boolean }>>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const { data: countriesData } = await supabase.from('countries').select('*').order('name');
            setCountries(countriesData || []);
            if (countriesData?.length) {
                setFormData(prev => ({ ...prev, country_id: countriesData[0].id.toString() }));
                fetchDistricts(countriesData[0].id);
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
        }
    };

    const fetchDistricts = async (countryId: number) => {
        try {
            const { data } = await supabase.from('districts').select('*').eq('country_id', countryId).order('name');
            setDistricts(data || []);
            if (data?.length) {
                setFormData(prev => ({ ...prev, county: data[0].name }));
            }
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    };

    const pickImage = async (isMain: boolean = false) => {
        // Check if we can add more images
        if (images.length >= 5) {
            Alert.alert('Limit Reached', 'You can add up to 5 images (1 main + 4 additional)');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets[0]) {
            const newImage = { uri: result.assets[0].uri, isMain };
            
            if (isMain) {
                // If setting as main, mark all others as not main
                setImages(prev => {
                    const updated = prev.map(img => ({ ...img, isMain: false }));
                    updated.unshift(newImage); // Add main image at the beginning
                    return updated;
                });
            } else {
                // Add as additional image
                setImages(prev => [...prev, newImage]);
            }
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const setAsMain = (index: number) => {
        setImages(prev => {
            const updated = [...prev];
            // Mark all as not main
            updated.forEach(img => img.isMain = false);
            // Set selected as main and move to first position
            const selected = updated[index];
            selected.isMain = true;
            updated.splice(index, 1);
            updated.unshift(selected);
            return updated;
        });
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.price || images.length === 0 || !formData.country_id || !formData.county) {
            Alert.alert('Validation Error', 'Please fill in all required fields and add at least one image');
            return;
        }

        // Ensure at least one main image
        const hasMainImage = images.some(img => img.isMain);
        if (!hasMainImage) {
            Alert.alert('Validation Error', 'Please set at least one image as the main image');
            return;
        }

        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // 1. Upload all images to Storage
            const uploadedImages: Array<{ path: string; isMain: boolean; order: number }> = [];
            
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const response = await fetch(image.uri);
                const blob = await response.blob();
                const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.jpg`;
                const filePath = `${formData.country_id}/${formData.category}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, blob);

                if (uploadError) throw uploadError;

                uploadedImages.push({
                    path: filePath,
                    isMain: image.isMain,
                    order: i
                });
            }

            // Get main image path for product storage_path
            const mainImagePath = uploadedImages.find(img => img.isMain)?.path || uploadedImages[0].path;

            // 2. Insert Product
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert({
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    available_quantity: parseInt(formData.available_quantity),
                    user_id: user.id,
                    county: formData.county,
                    country_id: parseInt(formData.country_id),
                    storage_path: mainImagePath,
                    validity_period: formData.validity_period
                })
                .select()
                .single();

            if (productError) throw productError;

            // 3. Insert all Product Image Records
            const imageRecords = uploadedImages.map((img, index) => ({
                product_id: product.id,
                storage_path: img.path,
                is_main: img.isMain,
                display_order: index
            }));

            const { error: imageError } = await supabase
                .from('product_images')
                .insert(imageRecords);

            if (imageError) throw imageError;

            Alert.alert('Success', 'Product listed successfully!');
            navigation.goBack();
        } catch (error: any) {
            console.error('Error adding product:', error);
            Alert.alert('Error', error.message || 'Failed to list product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }} className="bg-gray-50">
            {/* Header */}
            <View 
                className="bg-white border-b border-gray-100 flex-row items-center px-4"
                style={{ paddingTop: insets.top }}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="p-2 -ml-2"
                >
                    <ArrowLeft size={24} color="#1f2937" />
                </TouchableOpacity>
                <View className="flex-1 ml-2">
                    <Text className="text-xl font-bold text-gray-900">List New Product</Text>
                    <Text className="text-xs text-gray-500">Fill in the details below</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                        padding: 20, 
                        paddingBottom: Math.max(insets.bottom, 20) + 200
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    bounces={true}
                >
                {/* Image Picker Section */}
                <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Product Photos ({images.length}/5)
                        </Text>
                        {images.length < 5 && (
                            <TouchableOpacity
                                onPress={() => pickImage(false)}
                                className="flex-row items-center bg-orange-100 px-3 py-1.5 rounded-full"
                            >
                                <ImageIcon size={14} color="#f97316" />
                                <Text className="text-orange-600 font-semibold text-xs ml-1">Add More</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Main Image */}
                    <View className="mb-4">
                        <Text className="text-xs text-gray-500 mb-2">Main Image *</Text>
                        <TouchableOpacity
                            onPress={() => pickImage(true)}
                            className="w-full aspect-[4/3] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 justify-center items-center overflow-hidden shadow-sm"
                            activeOpacity={0.8}
                            disabled={images.length >= 5}
                        >
                            {images.find(img => img.isMain) ? (
                                <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <Image 
                                        source={{ uri: images.find(img => img.isMain)!.uri }} 
                                        className="w-full h-full" 
                                        resizeMode="cover" 
                                    />
                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.1)' }} />
                                    <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(249, 115, 22, 0.9)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                                        <Text className="text-white font-bold text-xs">MAIN</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const mainIndex = images.findIndex(img => img.isMain);
                                            if (mainIndex !== -1) removeImage(mainIndex);
                                        }}
                                        style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(239, 68, 68, 0.9)', borderRadius: 999, padding: 8 }}
                                    >
                                        <X size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="items-center">
                                    <View className="bg-orange-100 rounded-full p-4 mb-3">
                                        <Camera size={32} color="#f97316" />
                                    </View>
                                    <Text className="text-gray-600 font-semibold text-base">Tap to Add Main Photo</Text>
                                    <Text className="text-gray-400 text-xs mt-1">Recommended: 4:3 ratio</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Additional Images Grid */}
                    {images.filter(img => !img.isMain).length > 0 && (
                        <View>
                            <Text className="text-xs text-gray-500 mb-2">Additional Images ({images.filter(img => !img.isMain).length}/4)</Text>
                            <View className="flex-row flex-wrap gap-3">
                                {images.filter(img => !img.isMain).map((image, index) => {
                                    const actualIndex = images.findIndex(img => img === image);
                                    return (
                                        <View key={index} className="w-[48%] aspect-square relative">
                                            <Image 
                                                source={{ uri: image.uri }} 
                                                className="w-full h-full rounded-xl" 
                                                resizeMode="cover" 
                                            />
                                            <TouchableOpacity
                                                onPress={() => setAsMain(actualIndex)}
                                                style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(249, 115, 22, 0.9)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}
                                            >
                                                <Text className="text-white font-bold text-xs">Set Main</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => removeImage(actualIndex)}
                                                style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(239, 68, 68, 0.9)', borderRadius: 999, padding: 6 }}
                                            >
                                                <X size={14} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                                {images.filter(img => !img.isMain).length < 4 && images.length < 5 && (
                                    <TouchableOpacity
                                        onPress={() => pickImage(false)}
                                        className="w-[48%] aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 justify-center items-center"
                                        activeOpacity={0.8}
                                    >
                                        <Camera size={24} color="#94a3b8" />
                                        <Text className="text-gray-400 text-xs mt-1">Add</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                {/* Basic Information Card */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <Package size={20} color="#f97316" />
                        <Text className="text-lg font-bold text-gray-900 ml-2">Basic Information</Text>
                    </View>

                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">Product Title *</Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                            <TextInput
                                className="flex-1 py-4 text-base text-gray-900"
                                placeholder="What are you selling?"
                                placeholderTextColor="#9ca3af"
                                value={formData.title}
                                onChangeText={(text) => setFormData(p => ({ ...p, title: text }))}
                            />
                        </View>
                    </View>

                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">Category *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setFormData(p => ({ ...p, category: cat }))}
                                    className={`px-4 py-2.5 rounded-full border mr-2 flex-row items-center ${
                                        formData.category === cat 
                                            ? 'bg-orange-500 border-orange-500' 
                                            : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    {formData.category === cat && (
                                        <Check size={16} color="white" style={{ marginRight: 4 }} />
                                    )}
                                    <Text className={`font-semibold text-sm ${
                                        formData.category === cat ? 'text-white' : 'text-gray-700'
                                    }`}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                        <View className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                            <TextInput
                                className="text-base text-gray-900 min-h-[100]"
                                style={{ textAlignVertical: 'top' }}
                                placeholder="Tell buyers more about your product..."
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={4}
                                value={formData.description}
                                onChangeText={(text) => setFormData(p => ({ ...p, description: text }))}
                            />
                        </View>
                    </View>
                </View>

                {/* Pricing & Quantity Card */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <DollarSign size={20} color="#f97316" />
                        <Text className="text-lg font-bold text-gray-900 ml-2">Pricing & Stock</Text>
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">Price ($) *</Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                <DollarSign size={18} color="#6b7280" />
                                <TextInput
                                    className="flex-1 py-4 text-base text-gray-900 ml-2"
                                    placeholder="0.00"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="decimal-pad"
                                    value={formData.price}
                                    onChangeText={(text) => setFormData(p => ({ ...p, price: text }))}
                                />
                            </View>
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">Quantity *</Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                <Hash size={18} color="#6b7280" />
                                <TextInput
                                    className="flex-1 py-4 text-base text-gray-900 ml-2"
                                    placeholder="1"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="number-pad"
                                    value={formData.available_quantity}
                                    onChangeText={(text) => setFormData(p => ({ ...p, available_quantity: text }))}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Location Card */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
                    <View className="flex-row items-center mb-4">
                        <MapPin size={20} color="#f97316" />
                        <Text className="text-lg font-bold text-gray-900 ml-2">Location</Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-3">Country *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {countries.map(c => (
                                <TouchableOpacity
                                    key={c.id}
                                    onPress={() => {
                                        setFormData(p => ({ ...p, country_id: c.id.toString() }));
                                        fetchDistricts(c.id);
                                    }}
                                    className={`px-4 py-2.5 rounded-full border mr-2 flex-row items-center ${
                                        formData.country_id === c.id.toString() 
                                            ? 'bg-orange-500 border-orange-500' 
                                            : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    {formData.country_id === c.id.toString() && (
                                        <Globe size={14} color="white" style={{ marginRight: 6 }} />
                                    )}
                                    <Text className={`font-semibold text-sm ${
                                        formData.country_id === c.id.toString() ? 'text-white' : 'text-gray-700'
                                    }`}>
                                        {c.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View>
                        <Text className="text-sm font-semibold text-gray-700 mb-3">District / Location *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {districts.length > 0 ? (
                                districts.map(d => (
                                    <TouchableOpacity
                                        key={d.id}
                                        onPress={() => setFormData(p => ({ ...p, county: d.name }))}
                                        className={`px-4 py-2.5 rounded-full border mr-2 flex-row items-center ${
                                            formData.county === d.name 
                                                ? 'bg-orange-500 border-orange-500' 
                                                : 'bg-gray-50 border-gray-200'
                                        }`}
                                    >
                                        {formData.county === d.name && (
                                            <MapPin size={14} color="white" style={{ marginRight: 6 }} />
                                        )}
                                        <Text className={`font-semibold text-sm ${
                                            formData.county === d.name ? 'text-white' : 'text-gray-700'
                                        }`}>
                                            {d.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text className="text-gray-400 text-sm italic">Select a country first</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>

                {/* Submit Button */}
                <View className="mt-6 mb-4">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        className={`bg-orange-500 p-5 rounded-2xl items-center flex-row justify-center shadow-lg ${
                            loading ? 'opacity-70' : ''
                        }`}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <>
                                <ActivityIndicator color="white" size="small" />
                                <Text className="text-white font-bold text-lg ml-3">Listing Product...</Text>
                            </>
                        ) : (
                            <>
                                <Tag color="white" size={22} />
                                <Text className="text-white font-bold text-lg ml-2">List Product</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text className="text-center text-xs text-gray-400 mt-4 mb-2">
                        * Required fields
                    </Text>
                </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
