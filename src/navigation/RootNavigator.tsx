import * as React from 'react';
// React Native imports removed as they were unused

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import SplashScreen from '../components/SplashScreen';
import {
    Home,
    ShoppingCart,
    Heart,
    User,
    Settings,
    Package,
    Shield,
    Users,
    ShieldCheck,
    MapPin,
    ShoppingBag
} from 'lucide-react-native';

import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BrowseProductsScreen from '../screens/BrowseProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import MyProductsScreen from '../screens/MyProductsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import AccountManagementScreen from '../screens/AccountManagementScreen';
import DistrictsManagementScreen from '../screens/DistrictsManagementScreen';
import SettingsScreen from '../screens/SettingsScreen';

import CartScreen from '../screens/CartScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';


const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// AppTabs removed as using AppDrawer instead


function AppDrawer() {
    const { isAdmin, isSuperAdmin } = useAuth();

    return (
        <Drawer.Navigator
            initialRouteName="BrowseProducts"
            screenOptions={{
                headerShown: true,
                headerTintColor: '#2563eb',
                drawerActiveTintColor: '#2563eb',
                drawerInactiveTintColor: '#64748b',
            }}
        >
            <Drawer.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: 'Dashboard',
                    drawerIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />

            <Drawer.Screen
                name="BrowseProducts"
                component={BrowseProductsScreen}
                options={{
                    title: 'Browse Products',
                    drawerIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />
                }}
            />


            <Drawer.Screen
                name="MyProducts"
                component={MyProductsScreen}
                options={{
                    title: 'My Products',
                    drawerIcon: ({ color, size }) => <Package color={color} size={size} />
                }}
            />


            <Drawer.Screen
                name="Cart"
                component={CartScreen}
                options={{
                    title: 'Cart',
                    drawerIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />
                }}
            />


            <Drawer.Screen
                name="Wishlist"
                component={WishlistScreen}
                options={{
                    title: 'Wishlist',
                    drawerIcon: ({ color, size }) => <Heart color={color} size={size} />
                }}
            />


            <Drawer.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: 'Settings',
                    drawerIcon: ({ color, size }) => <Settings color={color} size={size} />
                }}
            />

            {(isAdmin || isSuperAdmin) && (
                <>
                    <Drawer.Screen
                        name="AdminPanel"
                        component={AdminPanelScreen}
                        options={{
                            title: 'Admin Panel',
                            drawerIcon: ({ color, size }) => <Shield color={color} size={size} />
                        }}
                    />
                    <Drawer.Screen
                        name="UserManagement"
                        component={UserManagementScreen}
                        options={{
                            title: 'User Management',
                            drawerIcon: ({ color, size }) => <Users color={color} size={size} />
                        }}
                    />
                </>
            )}

            {isSuperAdmin && (
                <>
                    <Drawer.Screen
                        name="AccountManagement"
                        component={AccountManagementScreen}
                        options={{
                            title: 'Account Management',
                            drawerIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />
                        }}
                    />
                    <Drawer.Screen
                        name="DistrictsManagement"
                        component={DistrictsManagementScreen}
                        options={{
                            title: 'Districts Management',
                            drawerIcon: ({ color, size }) => <MapPin color={color} size={size} />
                        }}
                    />
                </>
            )}

            {/* Account Tab can be reached via Profile screen or Bottom Tab */}
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'My Account',
                    drawerIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />

        </Drawer.Navigator>
    );
}

export default function RootNavigator() {
    const { session, isLoading } = useAuth();

    if (isLoading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {session ? (
                    <>
                        <Stack.Screen
                            name="App"
                            component={AppDrawer}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ProductDetail"
                            component={ProductDetailScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="AddProduct"
                            component={AddProductScreen}
                            options={{ title: 'List New Product' }}
                        />
                        <Stack.Screen
                            name="EditProduct"
                            component={EditProductScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Cart"
                            component={CartScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Wishlist"
                            component={WishlistScreen}
                            options={{ headerShown: false }}
                        />

                        <Stack.Screen
                            name="BrowseProducts"
                            component={BrowseProductsScreen}
                            options={{ title: 'Browse Products' }}
                        />
                        <Stack.Screen
                            name="Checkout"
                            component={CheckoutScreen}
                            options={{ title: 'Checkout', headerShown: false }}
                        />
                        <Stack.Screen
                            name="OrderSuccess"
                            component={OrderSuccessScreen}
                            options={{ title: 'Success', headerShown: false }}
                        />

                    </>
                ) : (
                    <Stack.Screen
                        name="Auth"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                )}

            </Stack.Navigator>
        </NavigationContainer>
    );
}

