import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '@contexts/AuthContext';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';
import { AuthLoadingScreen } from '@features/auth/screens/AuthLoadingScreen';
import { navigationTheme } from './navigationTheme';

export default function RootNavigator() {
  const { isHydrating, isAuthenticated } = useAuth();

  return (
    <NavigationContainer theme={navigationTheme}>
      {isHydrating ? <AuthLoadingScreen /> : isAuthenticated ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
