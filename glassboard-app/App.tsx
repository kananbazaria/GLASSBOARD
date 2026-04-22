import { StatusBar } from 'expo-status-bar';
<<<<<<< Updated upstream
import { AppRouter } from './src/app/navigation/AppRouter';
import { AppSessionProvider } from './src/app/session/AppSessionProvider';
import { useAppSession } from './src/app/session/useAppSession';

const AppContent = () => {
  const { bootStatus } = useAppSession();

  if (bootStatus === 'loading') {
    return <StatusBar style="light" />;
  }
=======
import { useState } from 'react';

import { AppUser, UserRole } from './src/domain/auth';
import { createDemoUser } from './src/data/mock/session';
import { SignInScreen } from './src/presentation/screens/SignInScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { FilesScreen } from './src/presentation/screens/FilesScreen';

// ─── Role-based screen resolver ───────────────────────────────────────────────
const resolveScreenForRole = (role: UserRole) => {
  switch (role) {
    case 'org_head':
      return 'org_dashboard';   // future: OrgDashboardScreen
    case 'module_head':
      return 'module_dashboard'; // future: ModuleDashboardScreen
    case 'member':
    default:
      return 'home';
  }
};

// ─── Route guard ──────────────────────────────────────────────────────────────
const ProtectedApp = ({
  user,
  onSignOut,
}: {
  user: AppUser;
  onSignOut: () => void;
}) => {
  // Add state to handle sub-navigation without breaking the role routing
  const [currentView, setCurrentView] = useState<'main' | 'files'>('main');
  const screen = resolveScreenForRole(user.role);

  // Intercept the render if the user navigates to the shared files
  if (currentView === 'files') {
    return <FilesScreen user={user} onBack={() => setCurrentView('main')} />;
  }

  // Swap these out for dedicated screens as you build them
  switch (screen) {
    case 'org_dashboard':
    case 'module_dashboard':
    case 'home':
    default:
      return (
        <HomeScreen 
          currentUser={user} 
          onSignOut={onSignOut} 
          onNavigateFiles={() => setCurrentView('files')}
        />
      );
  }
};

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);

  const handleDemoSignIn = (email: string, role: UserRole) => {
    setUser(createDemoUser(email, role));
  };

  const handleAuthenticated = (nextUser: AppUser) => {
    setUser(nextUser);
  };

  const handleSignOut = () => {
    setUser(null);
  };
>>>>>>> Stashed changes

  return (
    <>
      <StatusBar style="light" />
<<<<<<< Updated upstream
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
=======
      {user ? (
        <ProtectedApp user={user} onSignOut={handleSignOut} />
      ) : (
        <SignInScreen onAuthenticated={handleAuthenticated} onDemoSignIn={handleDemoSignIn} />
      )}
    </>
  );
}
>>>>>>> Stashed changes
