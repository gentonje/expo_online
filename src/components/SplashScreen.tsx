import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { ShoppingBag, ShoppingCart, Package, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SplashScreen() {
    const insets = useSafeAreaInsets();

    // Animation values
    const bagScale = useSharedValue(0);
    const bagRotation = useSharedValue(0);
    const cartTranslateX = useSharedValue(-100);
    const cartOpacity = useSharedValue(0);
    const packageScale = useSharedValue(0);
    const packageRotation = useSharedValue(0);
    const sparkleOpacity = useSharedValue(0);
    const sparkleScale = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const progressBar = useSharedValue(0);

    useEffect(() => {
        // Start animations
        // Shopping bag entrance
        bagScale.value = withDelay(200, withTiming(1, {
            duration: 600,
            easing: Easing.out(Easing.back(1.5)),
        }));

        bagRotation.value = withDelay(200, withSequence(
            withTiming(-15, { duration: 300 }),
            withTiming(15, { duration: 300 }),
            withTiming(0, { duration: 300 }),
        ));

        // Shopping cart entrance
        cartTranslateX.value = withDelay(600, withTiming(0, {
            duration: 500,
            easing: Easing.out(Easing.cubic),
        }));
        cartOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));

        // Package entrance
        packageScale.value = withDelay(1000, withTiming(1, {
            duration: 500,
            easing: Easing.out(Easing.back(1.2)),
        }));
        packageRotation.value = withDelay(1000, withSequence(
            withTiming(-10, { duration: 250 }),
            withTiming(10, { duration: 250 }),
            withTiming(0, { duration: 250 }),
        ));

        // Sparkles animation
        sparkleOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
        sparkleScale.value = withDelay(1200, withSequence(
            withTiming(1.2, { duration: 300 }),
            withTiming(1, { duration: 300 }),
        ));
        sparkleOpacity.value = withDelay(1200, withRepeat(
            withSequence(
                withTiming(1, { duration: 800 }),
                withTiming(0.3, { duration: 800 }),
            ),
            -1,
            false
        ));

        // Text animation
        textOpacity.value = withDelay(1500, withTiming(1, { duration: 500 }));
        textTranslateY.value = withDelay(1500, withTiming(0, {
            duration: 500,
            easing: Easing.out(Easing.cubic),
        }));

        // Progress bar
        progressBar.value = withDelay(1800, withTiming(1, {
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
        }));

        // Continuous animations
        bagRotation.value = withDelay(2000, withRepeat(
            withSequence(
                withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            true
        ));

        cartTranslateX.value = withDelay(2000, withRepeat(
            withSequence(
                withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            true
        ));
    }, [bagScale, bagRotation, cartTranslateX, cartOpacity, packageScale, packageRotation, sparkleOpacity, sparkleScale, textOpacity, textTranslateY, progressBar]);

    // Animated styles
    const bagAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: bagScale.value },
            { rotate: `${bagRotation.value}deg` },
        ],
    }));

    const cartAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: cartTranslateX.value }],
        opacity: cartOpacity.value,
    }));

    const packageAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: packageScale.value },
            { rotate: `${packageRotation.value}deg` },
        ],
    }));

    const sparkleAnimatedStyle = useAnimatedStyle(() => ({
        opacity: sparkleOpacity.value,
        transform: [{ scale: sparkleScale.value }],
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    const progressBarStyle = useAnimatedStyle(() => ({
        width: `${interpolate(
            progressBar.value,
            [0, 1],
            [0, 100],
            Extrapolate.CLAMP
        )}%`,
    }));

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Background gradient effect */}
            <View style={styles.backgroundGradient} />

            {/* Main icon container */}
            <View style={styles.iconContainer}>
                {/* Shopping Bag - Main */}
                <Animated.View style={[styles.bagContainer, bagAnimatedStyle]}>
                    <ShoppingBag size={80} color="#f97316" strokeWidth={2.5} />
                </Animated.View>

                {/* Shopping Cart - Left */}
                <Animated.View style={[styles.cartContainer, cartAnimatedStyle]}>
                    <ShoppingCart size={50} color="#3b82f6" strokeWidth={2} />
                </Animated.View>

                {/* Package - Right */}
                <Animated.View style={[styles.packageContainer, packageAnimatedStyle]}>
                    <Package size={50} color="#10b981" strokeWidth={2} />
                </Animated.View>

                {/* Sparkles/Stars */}
                <Animated.View style={[styles.sparkle1, sparkleAnimatedStyle]}>
                    <Star size={20} color="#fbbf24" fill="#fbbf24" />
                </Animated.View>
                <Animated.View style={[styles.sparkle2, sparkleAnimatedStyle]}>
                    <Star size={16} color="#f97316" fill="#f97316" />
                </Animated.View>
                <Animated.View style={[styles.sparkle3, sparkleAnimatedStyle]}>
                    <Star size={18} color="#3b82f6" fill="#3b82f6" />
                </Animated.View>
            </View>

            {/* App Name */}
            <Animated.View style={textAnimatedStyle}>
                <Text style={styles.appName}>Online Store</Text>
                <Text style={styles.tagline}>Shop Smart, Live Better</Text>
            </Animated.View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                    <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f8fafc',
    },
    iconContainer: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        position: 'relative',
    },
    bagContainer: {
        position: 'absolute',
        zIndex: 3,
    },
    cartContainer: {
        position: 'absolute',
        left: 20,
        top: 120,
        zIndex: 2,
    },
    packageContainer: {
        position: 'absolute',
        right: 20,
        top: 120,
        zIndex: 2,
    },
    sparkle1: {
        position: 'absolute',
        top: 40,
        left: 60,
        zIndex: 4,
    },
    sparkle2: {
        position: 'absolute',
        top: 180,
        right: 50,
        zIndex: 4,
    },
    sparkle3: {
        position: 'absolute',
        bottom: 60,
        left: 80,
        zIndex: 4,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        fontWeight: '500',
    },
    progressContainer: {
        position: 'absolute',
        bottom: 60,
        left: 40,
        right: 40,
    },
    progressBarBackground: {
        height: 4,
        backgroundColor: '#e5e7eb',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#f97316',
        borderRadius: 2,
    },
});
