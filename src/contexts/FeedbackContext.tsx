import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    FadeInUp,
    FadeOutUp,
    Layout

} from 'react-native-reanimated';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface FeedbackContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <FeedbackContext.Provider value={{ showToast }}>
            {children}
            <View style={[styles.container, { pointerEvents: 'none' }]}>
                {toasts.map((toast) => (
                    <Animated.View
                        key={toast.id}
                        entering={FadeInUp.springify()}
                        exiting={FadeOutUp}
                        layout={Layout.springify()}
                        style={[
                            styles.toast,
                            toast.type === 'success' ? styles.success :
                                toast.type === 'error' ? styles.error : styles.info
                        ]}
                    >
                        <View className="flex-row items-center space-x-3">
                            {toast.type === 'success' && <CheckCircle2 color="white" size={20} />}
                            {toast.type === 'error' && <AlertCircle color="white" size={20} />}
                            {toast.type === 'info' && <Info color="white" size={20} />}
                            <Text className="text-white font-semibold text-base flex-1">{toast.message}</Text>
                        </View>
                    </Animated.View>
                ))}
            </View>
        </FeedbackContext.Provider>
    );
}

export default FeedbackProvider;


export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    toast: {
        width: width * 0.9,
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    success: {
        backgroundColor: '#10b981', // green-500
    },
    error: {
        backgroundColor: '#ef4444', // red-500
    },
    info: {
        backgroundColor: '#3b82f6', // blue-500
    },
});
