import React from 'react';
import './global.css';
import { AuthProvider } from './src/contexts/AuthContext';
import { FeedbackProvider } from './src/contexts/FeedbackContext';
import RootNavigator from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <FeedbackProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}
