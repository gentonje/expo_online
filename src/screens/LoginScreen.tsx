import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View className="flex-1 justify-center items-center bg-gray-50 p-6">
                <View style={{ width: '100%', maxWidth: 400 }} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </Text>
                    <Text className="text-gray-500 text-center mb-8">
                        {isLogin ? 'Sign in to your account to continue' : 'Join our community of buyers and sellers'}
                    </Text>

                    <View className="space-y-5">
                        <View>
                            <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">Email Address</Text>
                            <TextInput
                                className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:bg-white"
                                placeholder="name@example.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View>
                            <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">Password</Text>
                            <TextInput
                                className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:bg-white"
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            className={`w-full py-4 rounded-xl shadow-lg shadow-blue-100 mt-4 ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                            onPress={isLogin ? signInWithEmail : signUpWithEmail}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-center font-bold text-lg">
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-6"
                            onPress={() => setIsLogin(!isLogin)}
                        >
                            <Text className="text-center text-blue-600 font-medium">
                                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
