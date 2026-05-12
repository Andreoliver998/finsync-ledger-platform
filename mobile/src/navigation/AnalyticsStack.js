import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FinancialSearchScreen } from '@features/search/screens/FinancialSearchScreen';
import { FinancialProfileScreen } from '@features/financialProfile/screens/FinancialProfileScreen';
import { IntelligentReadingScreen } from '@features/intelligentReading/screens/IntelligentReadingScreen';
import { RelationshipGraphScreen } from '@features/relationshipGraph/screens/RelationshipGraphScreen';
import { TransactionDetailsScreen } from '@features/transactions/screens/TransactionDetailsScreen';
import { EntityDetailsScreen } from '@features/analytics/screens/EntityDetailsScreen';
import { RelatedTransactionsScreen } from '@features/analytics/screens/RelatedTransactionsScreen';
import { TimelineAnalysisScreen } from '@features/analytics/screens/TimelineAnalysisScreen';
import { InsightDetailsScreen } from '@features/analytics/screens/InsightDetailsScreen';
import { ExportScreen } from '@features/analytics/screens/ExportScreen';
import { defaultStackScreenOptions } from './screenOptions';

const Stack = createNativeStackNavigator();

export function AnalyticsStack({ initialRouteName = 'FinancialSearch' }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={defaultStackScreenOptions}>
      <Stack.Screen name="FinancialSearch" component={FinancialSearchScreen} options={{ title: 'Busca Inteligente' }} />
      <Stack.Screen name="FinancialProfile" component={FinancialProfileScreen} options={{ title: 'Dossiê Financeiro' }} />
      <Stack.Screen
        name="IntelligentReading"
        component={IntelligentReadingScreen}
        options={{ title: 'Leitura Inteligente' }}
      />
      <Stack.Screen
        name="RelationshipGraph"
        component={RelationshipGraphScreen}
        options={{ title: 'Mapa Relacional' }}
      />
      <Stack.Screen
        name="TransactionDetails"
        component={TransactionDetailsScreen}
        options={{ title: 'Detalhe da Transação' }}
      />
      <Stack.Screen name="EntityDetails" component={EntityDetailsScreen} options={{ title: 'Entidade' }} />
      <Stack.Screen
        name="RelatedTransactions"
        component={RelatedTransactionsScreen}
        options={{ title: 'Relacionadas' }}
      />
      <Stack.Screen
        name="TimelineAnalysis"
        component={TimelineAnalysisScreen}
        options={{ title: 'Timeline Analítica' }}
      />
      <Stack.Screen name="InsightDetails" component={InsightDetailsScreen} options={{ title: 'Insight' }} />
      <Stack.Screen name="ExportScreen" component={ExportScreen} options={{ title: 'Exportar' }} />
    </Stack.Navigator>
  );
}
