import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DashboardScreen } from '@features/dashboard/screens/DashboardScreen';
import { TransactionDetailsScreen } from '@features/transactions/screens/TransactionDetailsScreen';
import { IntelligentReadingScreen } from '@features/intelligentReading/screens/IntelligentReadingScreen';
import { defaultStackScreenOptions } from './screenOptions';

const Stack = createNativeStackNavigator();

export function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'FinSync' }} />
      <Stack.Screen
        name="TransactionDetails"
        component={TransactionDetailsScreen}
        options={{ title: 'Detalhe' }}
      />
      <Stack.Screen
        name="IntelligentReading"
        component={IntelligentReadingScreen}
        options={{ title: 'Leitura Inteligente' }}
      />
    </Stack.Navigator>
  );
}
