import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Camera, Package, MapPin, Globe, Loader2, Tag } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

export default function AddProductScreen() {
    const navigation = useNavigation();
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
    const [mainImage, setMainImage] = useState<string | null>(null);
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

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setMainImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.price || !mainImage || !formData.country_id || !formData.county) {
            Alert.alert('Validation Error', 'Please fill in all required fields and add an image');
            return;
        }

        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // 1. Upload Image to Storage
            const response = await fetch(mainImage);
            const blob = await response.blob();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const filePath = `${formData.country_id}/${formData.category}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, blob);

            if (uploadError) throw uploadError;

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
                    storage_path: filePath,
                    validity_period: formData.validity_period
                })
                .select()
                .single();

            if (productError) throw productError;

            // 3. Insert Product Image Record
            const { error: imageError } = await supabase
                .from('product_images')
                .insert({
                    product_id: product.id,
                    storage_path: filePath,
                    is_main: true,
                    display_order: 0
                });

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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            className="bg-gray-50"
        >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
            >


                <Text className="text-2xl font-bold text-gray-900 mb-6">List Item for Sale</Text>

                {/* Image Picker */}
                <TouchableOpacity
                    onPress={pickImage}
                    className="w-full aspect-square bg-white rounded-2xl border-2 border-dashed border-gray-200 justify-center items-center mb-6 overflow-hidden"
                >
                    {mainImage ? (
                        <Image source={{ uri: mainImage }} className="w-full h-full" />
                    ) : (
                        <View className="items-center">
                            <Camera size={40} color="#94a3b8" />
                            <Text className="text-gray-400 mt-2 font-medium">Add Product Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View className="space-y-4 mb-10">
                    <View>
                        <Text className="text-gray-700 font-bold mb-2 ml-1">Title</Text>
                        <TextInput
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-base"
                            placeholder="What are you selling?"
                            value={formData.title}
                            onChangeText={(text) => setFormData(p => ({ ...p, title: text }))}
                        />
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-gray-700 font-bold mb-2 ml-1">Price ($)</Text>
                            <TextInput
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-base"
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={formData.price}
                                onChangeText={(text) => setFormData(p => ({ ...p, price: text }))}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-700 font-bold mb-2 ml-1">Quantity</Text>
                            <TextInput
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-base"
                                placeholder="1"
                                keyboardType="numeric"
                                value={formData.available_quantity}
                                onChangeText={(text) => setFormData(p => ({ ...p, available_quantity: text }))}
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-gray-700 font-bold mb-2 ml-1">Description</Text>
                        <TextInput
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-base h-24 text-top"
                            placeholder="Tell buyers more about it..."
                            multiline
                            value={formData.description}
                            onChangeText={(text) => setFormData(p => ({ ...p, description: text }))}
                        />
                    </View>

                    {/* Simplified Location Selectors */}
                    <View>
                        <Text className="text-gray-700 font-bold mb-2 ml-1">Country</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {countries.map(c => (
                                <TouchableOpacity
                                    key={c.id}
                                    onPress={() => {
                                        setFormData(p => ({ ...p, country_id: c.id.toString() }));
                                        fetchDistricts(c.id);
                                    }}
                                    className={`px-4 py-2 rounded-full border ${formData.country_id === c.id.toString() ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-200'}`}
                                >
                                    <Text className={`font-bold ${formData.country_id === c.id.toString() ? 'text-white' : 'text-gray-600'}`}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View>
                        <Text className="text-gray-700 font-bold mb-2 ml-1">Location / District</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {districts.map(d => (
                                <TouchableOpacity
                                    key={d.id}
                                    onPress={() => setFormData(p => ({ ...p, county: d.name }))}
                                    className={`px-4 py-2 rounded-full border mr-2 ${formData.county === d.name ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-200'}`}
                                >
                                    <Text className={`font-bold ${formData.county === d.name ? 'text-white' : 'text-gray-600'}`}>{d.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        className="bg-orange-500 p-4 rounded-2xl items-center mt-6 flex-row justify-center"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Tag color="white" size={20} />
                                <Text className="text-white font-bold text-lg ml-2">List Product</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
