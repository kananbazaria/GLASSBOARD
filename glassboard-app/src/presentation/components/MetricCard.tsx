import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

type MetricCardProps = {
  label: string;
  value: string;
  tone?: 'default' | 'danger' | 'warning' | 'success';
};

const toneColorMap = {
  default: colors.accent,
  danger: colors.danger,
  warning: colors.warning,
  success: colors.success,
};

export const MetricCard = ({ label, value, tone = 'default' }: MetricCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: toneColorMap[tone] }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: typography.body,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    fontFamily: typography.body,
  },
});
