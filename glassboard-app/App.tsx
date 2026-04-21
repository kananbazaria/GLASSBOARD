import { StatusBar } from 'expo-status-bar';
import { AppRouter } from './src/app/navigation/AppRouter';
import { AppSessionProvider } from './src/app/session/AppSessionProvider';
import { useAppSession } from './src/app/session/useAppSession';

const AppContent = () => {
  const { bootStatus } = useAppSession();

  if (bootStatus === 'loading') {
    return <StatusBar style="light" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <AppRouter />
    </>
  );
};

export default function App() {
  return (
    <AppSessionProvider>
      <AppContent />
    </AppSessionProvider>
  );
}
