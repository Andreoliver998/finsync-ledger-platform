import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { DashboardStack } from './DashboardStack';
import { TransactionsStack } from './TransactionsStack';
import { SearchStack } from './SearchStack';
import { ProfileStack } from './ProfileStack';
import { SettingsScreen } from '@features/settings/screens/SettingsScreen';
import { theme } from '@theme/index';

const Tab = createBottomTabNavigator();

const ICONS = {
  DashboardTab: { focused: 'pie-chart', regular: 'pie-chart-outline' },
  TransactionsTab: { focused: 'list', regular: 'list-outline' },
  SearchTab: { focused: 'search', regular: 'search-outline' },
  ProfileTab: { focused: 'person', regular: 'person-outline' },
  SettingsTab: { focused: 'settings', regular: 'settings-outline' }
};

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedStrong,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600'
        },
        tabBarIcon: ({ focused, color, size }) => {
          const pair = ICONS[route.name] ?? ICONS.DashboardTab;
          return <Ionicons name={focused ? pair.focused : pair.regular} size={size ?? 22} color={color} />;
        }
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="TransactionsTab" component={TransactionsStack} options={{ title: 'Transações' }} />
      <Tab.Screen name="SearchTab" component={SearchStack} options={{ title: 'Busca' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Perfil' }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: 'Ajustes' }} />
    </Tab.Navigator>
  );
}
