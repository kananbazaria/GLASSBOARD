import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { FilesScreen } from '../../presentation/screens/FilesScreen';
import { HomeScreen } from '../../presentation/screens/HomeScreen';
import { SignInScreen } from '../../presentation/screens/SignInScreen';
import { colors, spacing } from '../../presentation/theme/tokens';
import { useAppSession } from '../session/useAppSession';

export const AppRouter = () => {
  const { bootStatus, currentUser } = useAppSession();
  const [route, setRoute] = useState<'home' | 'files'>('home');

  if (bootStatus === 'loading') {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Loading GlassBoard...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return <SignInScreen />;
  }

  if (route === 'files') {
    return <FilesScreen user={currentUser} onBack={() => setRoute('home')} />;
  }

  return <HomeScreen currentUser={currentUser} onNavigateFiles={() => setRoute('files')} />;
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
