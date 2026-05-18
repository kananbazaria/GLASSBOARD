import { StatusBar } from 'expo-status-bar';

import { AppRouter } from './src/app/navigation/AppRouter';
import { AppSessionProvider } from './src/app/session/AppSessionProvider';

export default function App() {
  return (
    <AppSessionProvider>
      <StatusBar style="light" />
      <AppRouter />
    </AppSessionProvider>
  );
}
