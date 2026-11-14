import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { showMessage } from '../lib/alerts';
import { validateProductForm } from '../lib/product-validation';
import { Camera, Package, MapPin, Globe, Tag, ArrowLeft, DollarSign, Hash, Check, X, Image as ImageIcon, Edit } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getImageUrl, uploadProductImage, removeStorageFiles } from '../lib/image-utils';

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Toys', 'Other'];

interface ImageItem {
    uri: string;
    isMain: boolean;
    isExisting?: boolean;
    existingId?: number;
    existingPath?: string;
}

export default function EditProductScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { productId } = route.params as { productId: string };
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
    const [images, setImages] = useState<ImageItem[]>([]);
    const [originalStoragePath, setOriginalStoragePath] = useState<string | null>(null);
    const [countries, setCountries] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            
            // Fetch countries
            const { data: countriesData } = await supabase.from('countries').select('*').order('name');
            setCountries(countriesData || []);

            // Fetch product data
            const { data: product, error: productError } = await supabase
                .from('products')
                .select(`
                    *,
                    product_images(*)
                `)
                .eq('id', productId)
                .single();

            if (productError) throw productError;

            setOriginalStoragePath(product.storage_path ?? null);

            // Set form data
            setFormData({
                title: product.title || '',
                description: product.description || '',
                price: product.price?.toString() || '',
                category: product.category || 'Electronics',
                available_quantity: product.available_quantity?.toString() || '1',
                county: product.county || '',
                country_id: product.country_id?.toString() || '',
                validity_period: product.validity_period || 'day'
            });

            // Load districts for the product's country
            if (product.country_id) {
                fetchDistricts(product.country_id);
            }

            // Load existing images
            if (product.product_images && product.product_images.length > 0) {
                const sortedImages = product.product_images.sort((a: any, b: any) => 
                    (a.display_order || 0) - (b.display_order || 0)
                );
                
                const imageItems: ImageItem[] = sortedImages.map((img: any) => ({
                    uri: getImageUrl(img.storage_path),
                    isMain: img.is_main || false,
                    isExisting: true,
                    existingId: img.id,
                    existingPath: img.storage_path
                }));
                
                setImages(imageItems);
            } else if (product.storage_path) {
                // Fallback to storage_path
                setImages([{
                    uri: getImageUrl(product.storage_path),
                    isMain: true,
                    isExisting: true,
                    existingPath: product.storage_path
                }]);
            }
        } catch (error: any) {
            console.error('Error fetching product:', error);
            showMessage('Error', 'Failed to load product data');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const fetchDistricts = async (countryId: number) => {
        try {
            const { data } = await supabase.from('districts').select('*').eq('country_id', countryId).order('name');
            setDistricts(data || []);
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    };

    const pickImage = async (isMain: boolean = false) => {
        if (images.length >= 5) {
            showMessage('Limit Reached', 'You can add up to 5 images (1 main + 4 additional)');
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
            const newImage: ImageItem = { uri: result.assets[0].uri, isMain, isExisting: false };
            
            if (isMain) {
                setImages(prev => {
                    const updated = prev.map(img => ({ ...img, isMain: false }));
                    updated.unshift(newImage);
                    return updated;
                });
            } else {
                setImages(prev => [...prev, newImage]);
            }
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const setAsMain = (index: number) => {
        setImages(prev => {
            const selected = { ...prev[index], isMain: true };
            const others = prev.filter((_, i) => i !== index).map(img => ({ ...img, isMain: false }));
            return [selected, ...others];
        });
    };

    const handleSubmit = async () => {
        if (saving) return;

        const validation = validateProductForm(formData, images);
        if (!validation.ok) {
            showMessage('Validation Error', validation.message);
            return;
        }

        const uploadedPaths: string[] = [];

        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Your session has expired. Please sign in again.');

            const { data: currentImages, error: currentImagesError } = await supabase
                .from('product_images')
                .select('id, storage_path')
                .eq('product_id', productId);

            if (currentImagesError) throw currentImagesError;

            // 1. Upload every newly picked image, whatever its URI scheme
            const finalImages: Array<{ path: string; isMain: boolean; order: number; existingId?: number }> = [];
            for (let index = 0; index < images.length; index++) {
                const img = images[index];
                if (img.isExisting && img.existingPath) {
                    finalImages.push({ path: img.existingPath, isMain: img.isMain, order: index, existingId: img.existingId });
                } else {
                    const path = await uploadProductImage(user.id, img.uri, index);
                    uploadedPaths.push(path);
                    finalImages.push({ path, isMain: img.isMain, order: index });
                }
            }

            const mainImagePath = (finalImages.find(img => img.isMain) ?? finalImages[0]).path;

            // 2. Update product; RLS silently matches 0 rows when the user isn't allowed
            const { data: updatedRows, error: productError } = await supabase
                .from('products')
                .update({
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    price: validation.price,
                    category: formData.category,
                    available_quantity: validation.quantity,
                    county: formData.county,
                    country_id: validation.countryId,
                    storage_path: mainImagePath,
                    validity_period: formData.validity_period
                })
                .eq('id', productId)
                .select('id');

            if (productError) throw productError;
            if (!updatedRows || updatedRows.length === 0) {
                throw new Error('This product could not be updated. It may have been removed, or you may not have permission to edit it.');
            }

            // 3. Remove image records the user deleted
            const keptIds = new Set(finalImages.map(img => img.existingId).filter(Boolean));
            const removedRecords = (currentImages || []).filter(img => !keptIds.has(img.id));
            if (removedRecords.length > 0) {
                const { error: deleteError } = await supabase
                    .from('product_images')
                    .delete()
                    .in('id', removedRecords.map(img => img.id));
                if (deleteError) throw deleteError;
            }

            // 4. Update order and main flag on kept images
            const updateResults = await Promise.all(
                finalImages
                    .filter(img => img.existingId)
                    .map(img =>
                        supabase
                            .from('product_images')
                            .update({ is_main: img.isMain, display_order: img.order })
                            .eq('id', img.existingId!)
                    )
            );
            const updateError = updateResults.find(result => result.error)?.error;
            if (updateError) throw updateError;

            // 5. Insert records for new images (and legacy products that only had storage_path)
            const newImageRecords = finalImages
                .filter(img => !img.existingId)
                .map(img => ({
                    product_id: productId,
                    storage_path: img.path,
                    is_main: img.isMain,
                    display_order: img.order
                }));

            if (newImageRecords.length > 0) {
                const { error: imageError } = await supabase
                    .from('product_images')
                    .insert(newImageRecords);
                if (imageError) throw imageError;
            }

            // 6. Delete files no longer referenced by this product
            const keptPaths = new Set(finalImages.map(img => img.path));
            await removeStorageFiles(
                [...removedRecords.map(img => img.storage_path), originalStoragePath]
                    .filter(path => path && !keptPaths.has(path))
            );

            showMessage('Success', 'Product updated successfully!');
            navigation.goBack();
        } catch (error: any) {
            console.error('Error updating product:', error);
            await removeStorageFiles(uploadedPaths);
            showMessage('Error', error.message || 'Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                <ActivityIndicator size="large" color="#f97316" />
                <Text className="text-gray-600 mt-4">Loading product...</Text>
            </View>
        );
    }

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
                    <Text className="text-xl font-bold text-gray-900">Edit Product</Text>
                    <Text className="text-xs text-gray-500">Update product details</Text>
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
                                className="flex-1 min-w-0 py-4 text-base text-gray-900"
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
                                    className="flex-1 min-w-0 py-4 text-base text-gray-900 ml-2"
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
                                    className="flex-1 min-w-0 py-4 text-base text-gray-900 ml-2"
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
                        disabled={saving}
                        className={`bg-orange-500 p-5 rounded-2xl items-center flex-row justify-center shadow-lg ${
                            saving ? 'opacity-70' : ''
                        }`}
                        activeOpacity={0.8}
                    >
                        {saving ? (
                            <>
                                <ActivityIndicator color="white" size="small" />
                                <Text className="text-white font-bold text-lg ml-3">Updating Product...</Text>
                            </>
                        ) : (
                            <>
                                <Edit color="white" size={22} />
                                <Text className="text-white font-bold text-lg ml-2">Update Product</Text>
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
