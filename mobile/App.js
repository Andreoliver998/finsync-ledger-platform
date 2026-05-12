import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@contexts/AuthContext';
import { InvestigationProvider } from '@contexts/InvestigationContext';
import { queryClient } from '@services/queryClient';
import RootNavigator from '@navigation/RootNavigator';
import { theme } from '@theme/index';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <InvestigationProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </InvestigationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
