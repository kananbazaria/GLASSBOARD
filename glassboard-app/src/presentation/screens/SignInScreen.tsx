import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppSession } from '../../app/session/useAppSession';
import { signInWithFirebase } from '../../data/firebase/authService';
import { saveUserProfile } from '../../data/firebase/firestoreService';
import { UserRole } from '../../domain/auth';
import { colors, radius, spacing, typography } from '../theme/tokens';

const roles: { value: UserRole; label: string }[] = [
  { value: 'member', label: 'Team Member' },
  { value: 'module_head', label: 'Module Head' },
  { value: 'org_head', label: 'Organization Head' },
];

export const SignInScreen = () => {
  const { completeAuthenticatedSignIn, signInDemoUser } = useAppSession();
  const [email, setEmail] = useState('head@glassboard.app');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('module_head');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');

  const helperText = useMemo(
    () => 'Use demo mode immediately, or add Firebase env vars later to turn email/password sign-in on.',
    [],
  );

  const handleFirebaseSignIn = async () => {
    try {
      setStatus('submitting');
      setError(null);
      const user = await signInWithFirebase({ email, password, preferredRole: role });
      await saveUserProfile(user);
      completeAuthenticatedSignIn(user);
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : 'Sign-in failed.';
      setError(message);
    } finally {
      setStatus('idle');
    }
  };

  const handleDemoSignIn = () => {
    setError(null);
    signInDemoUser(email, role);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.brand}>GLASSBOARD</Text>
        <Text style={styles.title}>Access Control</Text>
        <Text style={styles.copy}>
          Sign in as a team member, module head, or org head and start tracking the exact point where delays and
          handoffs happen.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Work email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@company.com"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="Required only for live Firebase auth"
            placeholderTextColor={colors.textDim}
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            {roles.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setRole(item.value)}
                style={[styles.roleChip, role === item.value ? styles.roleChipActive : undefined]}
              >
                <Text style={[styles.roleChipText, role === item.value ? styles.roleChipTextActive : undefined]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.helper}>{helperText}</Text>}

        <View style={styles.actions}>
          <Pressable onPress={handleDemoSignIn} style={[styles.button, styles.secondaryButton]}>
            <Text style={styles.secondaryButtonText}>Continue in Demo Mode</Text>
          </Pressable>
          <Pressable
            disabled={status === 'submitting'}
            onPress={handleFirebaseSignIn}
            style={[styles.button, styles.primaryButton, status === 'submitting' ? styles.buttonDisabled : undefined]}
          >
            <Text style={styles.primaryButtonText}>
              {status === 'submitting' ? 'Signing in...' : 'Use Firebase Sign-In'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 1.5,
    fontFamily: typography.display,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: typography.display,
  },
  copy: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceStrong,
  },
  roleRow: {
    gap: spacing.sm,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceStrong,
  },
  roleChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(159, 247, 215, 0.12)',
  },
  roleChipText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  roleChipTextActive: {
    color: colors.textPrimary,
  },
  helper: {
    color: colors.textDim,
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  button: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  primaryButtonText: {
    color: '#021414',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
