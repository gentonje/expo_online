import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, MapPin, Globe } from 'lucide-react-native';

interface District {
    id: number;
    name: string;
    country_id: number;
    country_name?: string;
}

interface Country {
    id: number;
    name: string;
}

export default function DistrictsManagementScreen() {
    const [districts, setDistricts] = useState<District[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
    const [newName, setNewName] = useState('');
    const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [districtsRes, countriesRes] = await Promise.all([
                supabase.from('districts').select('*, countries(name)').order('name'),
                supabase.from('countries').select('*').order('name')
            ]);

            if (districtsRes.error) throw districtsRes.error;
            if (countriesRes.error) throw countriesRes.error;

            setDistricts(districtsRes.data.map((d: any) => ({
                ...d,
                country_name: d.countries?.name
            })) || []);
            setCountries(countriesRes.data || []);
        } catch (error: any) {
            console.error('Error fetching districts:', error);
            Alert.alert('Error', 'Failed to load districts data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrEdit = async () => {
        if (!newName.trim() || !selectedCountryId) {
            Alert.alert('Validation', 'Please provide a name and select a country');
            return;
        }

        try {
            if (editingDistrict) {
                const { error } = await supabase
                    .from('districts')
                    .update({ name: newName, country_id: selectedCountryId })
                    .eq('id', editingDistrict.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('districts')
                    .insert({ name: newName, country_id: selectedCountryId });
                if (error) throw error;
            }

            setModalVisible(false);
            setEditingDistrict(null);
            setNewName('');
            setSelectedCountryId(null);
            fetchData();
            Alert.alert('Success', `District ${editingDistrict ? 'updated' : 'added'} successfully`);
        } catch (error: any) {
            console.error('Error saving district:', error);
            Alert.alert('Error', 'Failed to save district');
        }
    };

    const handleDelete = async (id: number) => {
        Alert.alert(
            "Delete District",
            "Are you sure you want to delete this district?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('districts').delete().eq('id', id);
                            if (error) throw error;
                            fetchData();
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to delete district');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-xl font-bold text-gray-900">Districts Management</Text>
                    <Text className="text-gray-500">Manage locations and boundaries</Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        setEditingDistrict(null);
                        setNewName('');
                        setSelectedCountryId(countries[0]?.id || null);
                        setModalVisible(true);
                    }}
                    className="bg-blue-600 p-2 rounded-full"
                >
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2563eb" />
            ) : (
                <ScrollView className="flex-1">
                    {districts.map((district) => (
                        <View key={district.id} className="bg-white p-4 rounded-xl border border-gray-100 mb-3 shadow-sm flex-row justify-between items-center">
                            <View>
                                <Text className="text-lg font-bold text-gray-900">{district.name}</Text>
                                <View className="flex-row items-center">
                                    <Globe size={14} color="#64748b" />
                                    <Text className="text-gray-500 ml-1">{district.country_name}</Text>
                                </View>
                            </View>
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingDistrict(district);
                                        setNewName(district.name);
                                        setSelectedCountryId(district.country_id);
                                        setModalVisible(true);
                                    }}
                                    className="p-2 bg-gray-100 rounded-lg"
                                >
                                    <Edit2 size={18} color="#2563eb" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleDelete(district.id)}
                                    className="p-2 bg-red-100 rounded-lg"
                                >
                                    <Trash2 size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white p-6 rounded-t-3xl h-[60%]">
                        <Text className="text-xl font-bold mb-4">{editingDistrict ? 'Edit District' : 'Add District'}</Text>

                        <Text className="text-gray-700 mb-2">District Name</Text>
                        <TextInput
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Enter name"
                            className="bg-gray-100 p-3 rounded-xl mb-4 text-base"
                        />

                        <Text className="text-gray-700 mb-2">Country</Text>
                        <ScrollView className="mb-4">
                            {countries.map(c => (
                                <TouchableOpacity
                                    key={c.id}
                                    onPress={() => setSelectedCountryId(c.id)}
                                    className={`p-3 rounded-lg mb-2 border ${selectedCountryId === c.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'}`}
                                >
                                    <Text className={selectedCountryId === c.id ? 'text-blue-600 font-bold' : 'text-gray-700'}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="flex-1 bg-gray-200 py-3 rounded-xl items-center"
                            >
                                <Text className="font-bold text-gray-700">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddOrEdit}
                                className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
                            >
                                <Text className="font-bold text-white">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
