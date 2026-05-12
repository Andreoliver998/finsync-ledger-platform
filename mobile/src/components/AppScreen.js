import React from 'react';
import { StyleSheet, View, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@theme/index';

/**
 * Top-level screen container. Pass `scroll` to wrap content in a ScrollView.
 * Apply `padded` to add horizontal padding consistent with the design system.
 */
export function AppScreen({
  children,
  scroll = false,
  padded = true,
  refreshing,
  onRefresh,
  contentContainerStyle,
  edges = ['top', 'left', 'right'],
  style
}) {
  const padding = padded ? styles.padded : null;

  if (scroll) {
    return (
      <SafeAreaView edges={edges} style={[styles.root, style]}>
        <ScrollView
          contentContainerStyle={[padding, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
                progressBackgroundColor={theme.colors.surface}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      <View style={[styles.flex, padding, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  flex: {
    flex: 1
  },
  padded: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl
  }
});
