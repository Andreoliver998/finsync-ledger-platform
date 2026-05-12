import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@components/AppButton';
import { AppInput } from '@components/AppInput';
import { AppScreen } from '@components/AppScreen';
import { useAuth } from '@contexts/AuthContext';
import { theme } from '@theme/index';
import { loginSchema } from '../schemas';
import { getErrorMessage } from '@utils/errors';

export function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit'
  });

  const onSubmit = async (values) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await login(values);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Não foi possível entrar.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen padded={false} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <View style={styles.logoCircle}>
              <Ionicons name="analytics" size={28} color={theme.colors.accent} />
            </View>
            <Text style={styles.brand}>FinSync</Text>
            <Text style={styles.tagline}>Inteligência financeira no seu bolso.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Entrar</Text>
            <Text style={styles.subtitle}>Acesse sua conta para continuar.</Text>

            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <AppInput
                  label="E-mail"
                  placeholder="voce@empresa.com"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  error={errors.email?.message}
                  containerStyle={styles.field}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <AppInput
                  label="Senha"
                  placeholder="••••••••"
                  secureTextEntry
                  textContentType="password"
                  autoComplete="password"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  error={errors.password?.message}
                  containerStyle={styles.field}
                />
              )}
            />

            {submitError ? <Text style={styles.serverError}>{submitError}</Text> : null}

            <AppButton
              label="Entrar"
              loading={submitting}
              onPress={handleSubmit(onSubmit)}
              style={styles.cta}
            />

            <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>
                Ainda não tem conta? <Text style={styles.footerLinkAccent}>Criar conta</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    justifyContent: 'center'
  },
  brandBlock: { alignItems: 'center', marginBottom: theme.spacing.xxxl },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  brand: {
    color: theme.colors.text,
    fontSize: theme.typography.size.hero,
    fontWeight: theme.typography.weight.black,
    letterSpacing: 0.4
  },
  tagline: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.md,
    marginTop: 4
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.bold
  },
  subtitle: {
    color: theme.colors.muted,
    marginTop: 4,
    marginBottom: theme.spacing.lg,
    fontSize: theme.typography.size.md
  },
  field: { marginBottom: theme.spacing.md },
  serverError: {
    color: theme.colors.danger,
    fontSize: theme.typography.size.sm,
    marginBottom: theme.spacing.sm
  },
  cta: { marginTop: theme.spacing.sm },
  footerLink: { marginTop: theme.spacing.lg, alignItems: 'center' },
  footerLinkText: { color: theme.colors.muted, fontSize: theme.typography.size.md },
  footerLinkAccent: { color: theme.colors.primary, fontWeight: theme.typography.weight.semibold }
});
