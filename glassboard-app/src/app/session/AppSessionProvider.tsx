import { createContext, ReactNode, useEffect, useState } from 'react';

import { signOutFromFirebase, subscribeToAuthenticatedUser } from '../../data/firebase/authService';
import { createDemoUser } from '../../data/mock/session';
import { AppUser, UserRole } from '../../domain/auth';

type BootStatus = 'loading' | 'ready';

type AppSessionContextValue = {
  bootStatus: BootStatus;
  currentUser: AppUser | null;
  signInDemoUser: (email: string, role: UserRole) => void;
  completeAuthenticatedSignIn: (user: AppUser) => void;
  signOutCurrentUser: () => Promise<void>;
};

export const AppSessionContext = createContext<AppSessionContextValue | null>(null);

type AppSessionProviderProps = {
  children: ReactNode;
};

export const AppSessionProvider = ({ children }: AppSessionProviderProps) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [bootStatus, setBootStatus] = useState<BootStatus>('loading');

  useEffect(() => {
    const unsubscribe = subscribeToAuthenticatedUser((nextUser) => {
      setCurrentUser((existingUser) => (existingUser?.id?.startsWith('demo-') ? existingUser : nextUser));
      setBootStatus('ready');
    });

    return unsubscribe;
  }, []);

  const signInDemoUser = (email: string, role: UserRole) => {
    setCurrentUser(createDemoUser(email, role));
    setBootStatus('ready');
  };

  const completeAuthenticatedSignIn = (user: AppUser) => {
    setCurrentUser(user);
    setBootStatus('ready');
  };

  const signOutCurrentUser = async () => {
    await signOutFromFirebase();
    setCurrentUser(null);
  };

  return (
    <AppSessionContext.Provider
      value={{
        bootStatus,
        currentUser,
        signInDemoUser,
        completeAuthenticatedSignIn,
        signOutCurrentUser,
      }}
    >
      {children}
    </AppSessionContext.Provider>
  );
};
