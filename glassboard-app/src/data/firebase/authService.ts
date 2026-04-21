import { User, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

import { AppUser, SignInPayload, UserRole } from '../../domain/auth';
import { getFirebaseAuth, hasFirebaseConfig } from './config';

const inferRoleFromEmail = (email: string): UserRole => {
  if (email.includes('leader') || email.includes('admin')) {
    return 'org_head';
  }

  if (email.includes('head') || email.includes('manager')) {
    return 'module_head';
  }

  return 'member';
};

const mapFirebaseUser = (user: User): AppUser => ({
  id: user.uid,
  email: user.email ?? 'unknown@glassboard.app',
  name: user.displayName ?? 'GlassBoard User',
  role: inferRoleFromEmail(user.email ?? ''),
  moduleIds: [],
});

export const signInWithFirebase = async ({ email, password }: SignInPayload): Promise<AppUser> => {
  if (!hasFirebaseConfig()) {
    throw new Error('Firebase environment variables are missing.');
  }

  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return mapFirebaseUser(credential.user);
};

export const signOutFromFirebase = async () => {
  if (!hasFirebaseConfig()) {
    return;
  }

  await firebaseSignOut(getFirebaseAuth());
};
