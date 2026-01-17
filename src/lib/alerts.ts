import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    style?: 'default' | 'destructive' | 'cancel';
}

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
