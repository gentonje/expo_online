import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    style?: 'default' | 'destructive' | 'cancel';
}

/** Alert.alert is a no-op on react-native-web, so fall back to window.alert there. */
export const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};

export const confirmAction = ({
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    style = 'default'
}: ConfirmOptions) => {
    if (Platform.OS === 'web') {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
            onConfirm();
        }
    } else {
        Alert.alert(
            title,
            message,
            [
                { text: cancelText, style: 'cancel' },
                {
                    text: confirmText,
                    onPress: onConfirm,
                    style: style
                }
            ]
        );
    }
};
