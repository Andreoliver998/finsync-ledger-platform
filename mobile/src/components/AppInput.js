import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@theme/index';

export const AppInput = forwardRef(function AppInput(
  {
    label,
    error,
    hint,
    secureTextEntry,
    leftIcon,
    rightAccessory,
    containerStyle,
    inputStyle,
    onFocus,
    onBlur,
    editable = true,
    ...rest
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  const isPassword = !!secureTextEntry;
  const showError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          showError && styles.inputRowError,
          !editable && styles.inputRowDisabled
        ]}
      >
        {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.colors.mutedStrong}
          selectionColor={theme.colors.primary}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={hidden}
          editable={editable}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={10}
            style={styles.iconSlot}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
          >
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.muted}
            />
          </Pressable>
        ) : null}
        {!isPassword && rightAccessory ? <View style={styles.iconSlot}>{rightAccessory}</View> : null}
      </View>

      {showError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    marginBottom: 6,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 50
  },
  inputRowFocused: { borderColor: theme.colors.primary },
  inputRowError: { borderColor: theme.colors.danger },
  inputRowDisabled: { opacity: 0.6 },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    paddingVertical: 12
  },
  iconSlot: { marginHorizontal: 6 },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.size.sm,
    marginTop: 6
  },
  hintText: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    marginTop: 6
  }
});
