import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { UserCheck, UserX, Search, Shield } from 'lucide-react-native';

interface User {
    id: string;
    username: string | null;
    user_type: string;
}

export default function AdminPanelScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, user_type')
                .order('username', { ascending: true });

            if (error) throw error;
            setUsers(data as User[]);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ user_type: newRole })
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_type: newRole } : u));
            Alert.alert('Success', `User role updated to ${newRole}`);
        } catch (error: any) {
            console.error('Error updating role:', error);
            Alert.alert('Error', 'Failed to update user role');
        }
    };

    const filteredUsers = users.filter(user =>
        (user.username?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <View className="flex-row items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-4">
                <Search color="#64748b" size={20} />
                <TextInput
                    placeholder="Search users..."
                    value={search}
                    onChangeText={setSearch}
                    className="flex-1 ml-2 text-base text-gray-900"
                />
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <ScrollView className="flex-1">
                    <Text className="text-xl font-bold text-gray-900 mb-4">Admin Management</Text>
                    {filteredUsers.length === 0 ? (
                        <Text className="text-center text-gray-500 mt-10">No users found</Text>
                    ) : (
                        filteredUsers.map((user) => (
                            <View key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-gray-900">
                                            {user.username || 'No username'}
                                        </Text>
                                        <View className="flex-row items-center mt-1">
                                            <View className={`px-2 py-0.5 rounded-full ${user.user_type === 'super_admin' ? 'bg-purple-100' :
                                                user.user_type === 'admin' ? 'bg-blue-100' : 'bg-gray-100'
                                                }`}>
                                                <Text className={`text-xs font-bold ${user.user_type === 'super_admin' ? 'text-purple-700' :
                                                    user.user_type === 'admin' ? 'text-blue-700' : 'text-gray-700'
                                                    }`}>
                                                    {user.user_type.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View>
                                        {user.user_type === 'user' && (
                                            <TouchableOpacity
                                                onPress={() => handleUpdateUserRole(user.id, 'admin')}
                                                className="bg-blue-600 px-3 py-2 rounded-lg flex-row items-center"
                                            >
                                                <UserCheck color="white" size={16} />
                                                <Text className="text-white font-bold ml-1">Make Admin</Text>
                                            </TouchableOpacity>
                                        )}
                                        {user.user_type === 'admin' && (
                                            <TouchableOpacity
                                                onPress={() => handleUpdateUserRole(user.id, 'user')}
                                                className="bg-red-600 px-3 py-2 rounded-lg flex-row items-center"
                                            >
                                                <UserX color="white" size={16} />
                                                <Text className="text-white font-bold ml-1">Remove Admin</Text>
                                            </TouchableOpacity>
                                        )}
                                        {user.user_type === 'super_admin' && (
                                            <Shield color="#6b21a8" size={24} />
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}
