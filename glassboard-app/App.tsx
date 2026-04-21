import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { signOutFromFirebase, subscribeToAuthenticatedUser } from './src/data/firebase/authService';
import { AppUser, UserRole } from './src/domain/auth';
import { createDemoUser } from './src/data/mock/session';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { SignInScreen } from './src/presentation/screens/SignInScreen';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [bootStatus, setBootStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const unsubscribe = subscribeToAuthenticatedUser((nextUser) => {
      setUser((currentUser) => (currentUser?.id?.startsWith('demo-') ? currentUser : nextUser));
      setBootStatus('ready');
    });

    return unsubscribe;
  }, []);

  const handleDemoSignIn = (email: string, role: UserRole) => {
    setUser(createDemoUser(email, role));
    setBootStatus('ready');
  };

  const handleAuthenticated = (nextUser: AppUser) => {
    setUser(nextUser);
    setBootStatus('ready');
  };

  const handleSignOut = async () => {
    await signOutFromFirebase();
    setUser(null);
  };

  if (bootStatus === 'loading') {
    return <StatusBar style="light" />;
  }

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
