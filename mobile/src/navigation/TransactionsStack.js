import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TransactionsScreen } from '@features/transactions/screens/TransactionsScreen';
import { TransactionDetailsScreen } from '@features/transactions/screens/TransactionDetailsScreen';
import { defaultStackScreenOptions } from './screenOptions';

const Stack = createNativeStackNavigator();

export function TransactionsStack() {
  return (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
      <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Transações' }} />
      <Stack.Screen
        name="TransactionDetails"
        component={TransactionDetailsScreen}
        options={{ title: 'Detalhe' }}
      />
    </Stack.Navigator>
  );
}
