import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Save, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        contact_email: '',
        phone_number: '',
        address: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, contact_email, phone_number, address')
                    .eq('id', user?.id)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        username: data.username || '',
                        full_name: data.full_name || '',
                        contact_email: data.contact_email || user?.email || '',
                        phone_number: data.phone_number || '',
                        address: data.address || '',
                    });
                }
            } catch (error: any) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    const handleSave = async () => {
        console.log('handleSave called');
        if (!formData.username || !formData.full_name) {
            console.warn('Validation failed:', formData);
            Alert.alert('Validation Error', 'Username and Full Name are required');
            return;
        }

        try {
            setSaving(true);
            console.log('Updating profile for user:', user?.id, 'with data:', formData);
            const { error, status } = await supabase
                .from('profiles')
                .update({
                    username: formData.username,
                    full_name: formData.full_name,
                    contact_email: formData.contact_email,
                    phone_number: formData.phone_number,
                    address: formData.address,
                })
                .eq('id', user?.id);

            console.log('Update result status:', status);
            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            if (Platform.OS === 'web') {
                window.alert('Profile updated successfully');
            } else {
                Alert.alert('Success', 'Profile updated successfully');
            }
            console.log('Profile update feedback shown');
            navigation.goBack();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const msg = error.message || 'Failed to update profile';
            if (Platform.OS === 'web') {
                window.alert('Error: ' + msg);
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
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
                className="flex-1 p-4"
                contentContainerStyle={{ paddingBottom: 100 }}
            >


                <View className="items-center mb-6 mt-4">
                    <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center">
                        <User size={48} color="#2563eb" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mt-4">{formData.full_name || 'Your Name'}</Text>
                    <Text className="text-gray-500">{user?.email}</Text>
                </View>

                <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Personal Information</Text>

                    <View className="mb-4">
                        <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Username*</Text>
                        <View className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <User size={18} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-2 text-base text-gray-900"
                                value={formData.username}
                                onChangeText={(t) => setFormData(p => ({ ...p, username: t }))}
                                placeholder="john_doe"
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Full Name*</Text>
                        <View className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <User size={18} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-2 text-base text-gray-900"
                                value={formData.full_name}
                                onChangeText={(t) => setFormData(p => ({ ...p, full_name: t }))}
                                placeholder="John Doe"
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Contact Email</Text>
                        <View className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Mail size={18} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-2 text-base text-gray-900"
                                value={formData.contact_email}
                                onChangeText={(t) => setFormData(p => ({ ...p, contact_email: t }))}
                                placeholder="email@example.com"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Phone Number</Text>
                        <View className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Phone size={18} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-2 text-base text-gray-900"
                                value={formData.phone_number}
                                onChangeText={(t) => setFormData(p => ({ ...p, phone_number: t }))}
                                placeholder="+1234567890"
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View className="mb-2">
                        <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Address</Text>
                        <View className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <MapPin size={18} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-2 text-base text-gray-900"
                                value={formData.address}
                                onChangeText={(t) => setFormData(p => ({ ...p, address: t }))}
                                placeholder="123 Street, City"
                            />
                        </View>
                    </View>
                </View>

                {/* Shop Details removed due to schema mismatch */}

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="bg-blue-600 p-4 rounded-2xl items-center flex-row justify-center mb-6"
                >
                    {saving ? <ActivityIndicator color="white" /> : (
                        <>
                            <Save color="white" size={20} />
                            <Text className="text-white font-bold text-lg ml-2">Update Profile</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={signOut}
                    className="bg-red-50 p-4 rounded-2xl items-center flex-row justify-center mb-10 border border-red-100"
                >
                    <LogOut color="#ef4444" size={20} />
                    <Text className="text-red-500 font-bold text-lg ml-2">Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
