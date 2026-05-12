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
import { registerSchema } from '../schemas';
import { getErrorMessage } from '@utils/errors';

export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' }
  });

  const onSubmit = async (values) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await register(values);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Não foi possível criar a conta.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen padded={false} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.muted} />
            <Text style={styles.backLabel}>Voltar</Text>
          </Pressable>

          <View style={styles.headerBlock}>
            <Text style={styles.brand}>Criar conta</Text>
            <Text style={styles.tagline}>Comece a sincronizar e analisar suas finanças.</Text>
          </View>

          <View style={styles.card}>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <AppInput
                  label="Nome"
                  placeholder="Seu nome"
                  autoComplete="name"
                  textContentType="name"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.name?.message}
                  containerStyle={styles.field}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <AppInput
                  label="E-mail"
                  placeholder="voce@empresa.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
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
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.password?.message}
                  containerStyle={styles.field}
                />
              )}
            />

            {submitError ? <Text style={styles.serverError}>{submitError}</Text> : null}

            <AppButton
              label="Criar conta"
              loading={submitting}
              onPress={handleSubmit(onSubmit)}
              style={styles.cta}
            />
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
    paddingTop: theme.spacing.md
  },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  backLabel: { color: theme.colors.muted, fontSize: theme.typography.size.md, marginLeft: 2 },
  headerBlock: { marginBottom: theme.spacing.xl },
  brand: {
    color: theme.colors.text,
    fontSize: theme.typography.size.display,
    fontWeight: theme.typography.weight.bold,
    letterSpacing: 0.2
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
  field: { marginBottom: theme.spacing.md },
  serverError: {
    color: theme.colors.danger,
    fontSize: theme.typography.size.sm,
    marginBottom: theme.spacing.sm
  },
  cta: { marginTop: theme.spacing.sm }
});
