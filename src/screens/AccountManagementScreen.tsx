import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { Shield, ShieldCheck, User } from 'lucide-react-native';

interface Profile {
    id: string;
    username: string | null;
    user_type: string;
}

export default function AccountManagementScreen() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, user_type')
                .order('username');

            if (error) throw error;
            setProfiles(data || []);
        } catch (error: any) {
            console.error('Error fetching profiles:', error);
            Alert.alert('Error', 'Failed to load profiles');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateType = async (userId: string, newType: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ user_type: newType })
                .eq('id', userId);

            if (error) throw error;
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, user_type: newType } : p));
            Alert.alert('Success', `Account type updated to ${newType}`);
        } catch (error: any) {
            console.error('Error updating type:', error);
            Alert.alert('Error', 'Failed to update account type');
        }
    };

    const filteredProfiles = profiles.filter(p =>
        (p.username?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <View className="mb-4">
                <Text className="text-xl font-bold text-gray-900">Account Type Management</Text>
                <Text className="text-gray-500">Manage user account types and permissions</Text>
            </View>

            <TextInput
                placeholder="Search usernames..."
                value={search}
                onChangeText={setSearch}
                className="bg-white p-3 rounded-xl border border-gray-200 mb-4"
            />

            {loading ? (
                <ActivityIndicator size="large" color="#2563eb" />
            ) : (
                <ScrollView className="flex-1">
                    {filteredProfiles.map((profile) => (
                        <View key={profile.id} className="bg-white p-4 rounded-xl border border-gray-100 mb-3 shadow-sm">
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-lg font-bold text-gray-900">{profile.username || 'Anonymous'}</Text>
                                    <Text className="text-gray-500">Current: {profile.user_type}</Text>
                                </View>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => handleUpdateType(profile.id, 'user')}
                                        className={`p-2 rounded-full ${profile.user_type === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}
                                    >
                                        <User size={20} color={profile.user_type === 'user' ? '#2563eb' : '#94a3b8'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleUpdateType(profile.id, 'admin')}
                                        className={`p-2 rounded-full ${profile.user_type === 'admin' ? 'bg-purple-100' : 'bg-gray-100'}`}
                                    >
                                        <Shield size={20} color={profile.user_type === 'admin' ? '#9333ea' : '#94a3b8'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleUpdateType(profile.id, 'super_admin')}
                                        className={`p-2 rounded-full ${profile.user_type === 'super_admin' ? 'bg-orange-100' : 'bg-gray-100'}`}
                                    >
                                        <ShieldCheck size={20} color={profile.user_type === 'super_admin' ? '#ea580c' : '#94a3b8'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}
