import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { AppUser, UserRole } from './src/domain/auth';
import { createDemoUser } from './src/data/mock/session';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { SignInScreen } from './src/presentation/screens/SignInScreen';

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

  return (
    <>
      <StatusBar style="light" />
      {user ? (
        <HomeScreen currentUser={user} onSignOut={handleSignOut} />
      ) : (
        <SignInScreen onAuthenticated={handleAuthenticated} onDemoSignIn={handleDemoSignIn} />
      )}
    </>
  );
}
