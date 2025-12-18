import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        else Alert.alert('Success', 'Please check your inbox for email verification!');
        setLoading(false);
    }

    return (
        <View className="flex-1 justify-center items-center bg-gray-50 p-4">
            <View className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm">
                <Text className="text-2xl font-bold text-center mb-6 text-gray-900">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </Text>

                <View className="space-y-4">
                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                        <TextInput
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white"
                            placeholder="name@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                        <TextInput
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        className={`w-full py-3 rounded-lg ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                        onPress={isLogin ? signInWithEmail : signUpWithEmail}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-center font-semibold text-lg">
                                {isLogin ? 'Sign In' : 'Sign Up'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="mt-4"
                        onPress={() => setIsLogin(!isLogin)}
                    >
                        <Text className="text-center text-blue-600">
                            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
