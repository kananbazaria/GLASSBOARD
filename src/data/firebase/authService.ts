import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

import { AppUser, SignInPayload, UserRole } from '../../domain/auth';
import { getDefaultModuleIdsForRole } from '../mock/session';
import { getFirebaseAuth, hasFirebaseConfig, missingFirebaseConfigKeys } from './config';
import { fetchUserProfile, saveUserProfile } from './firestoreService';

const inferRoleFromEmail = (email: string): UserRole => {
  if (email.includes('leader') || email.includes('admin')) {
    return 'org_head';
  }

  if (email.includes('head') || email.includes('manager')) {
    return 'module_head';
  }

  return 'member';
};

const mapFirebaseUser = (user: User): AppUser => {
  const role = inferRoleFromEmail(user.email ?? '');

  return {
    id: user.uid,
    email: user.email ?? 'unknown@glassboard.app',
    name: user.displayName ?? 'GlassBoard User',
    role,
    moduleIds: getDefaultModuleIdsForRole(role),
  };
};

const hydrateAppUser = async (user: User, preferredRole?: UserRole): Promise<AppUser> => {
  const baseUser = mapFirebaseUser(user);
  const savedProfile = await fetchUserProfile(user.uid);
  const resolvedRole = savedProfile?.role ?? preferredRole ?? baseUser.role;

  return {
    ...baseUser,
    name: savedProfile?.name ?? baseUser.name,
    role: resolvedRole,
    moduleIds: savedProfile?.moduleIds?.length ? savedProfile.moduleIds : getDefaultModuleIdsForRole(resolvedRole),
  };
};

export const signInWithFirebase = async ({ email, password, preferredRole }: SignInPayload): Promise<AppUser> => {
  if (!hasFirebaseConfig()) {
    throw new Error(`Firebase config is missing: ${missingFirebaseConfigKeys().join(', ')}`);
  }

  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  const appUser = await hydrateAppUser(credential.user, preferredRole);
  await saveUserProfile(appUser);

  return appUser;
};

export const signOutFromFirebase = async () => {
  if (!hasFirebaseConfig()) {
    return;
  }

  await firebaseSignOut(getFirebaseAuth());
};

export const subscribeToAuthenticatedUser = (onChange: (user: AppUser | null) => void) => {
  if (!hasFirebaseConfig()) {
    onChange(null);
    return () => undefined;
  }

  return onAuthStateChanged(getFirebaseAuth(), async (user) => {
    if (!user) {
      onChange(null);
      return;
    }

    try {
      onChange(await hydrateAppUser(user));
    } catch {
      onChange(mapFirebaseUser(user));
    }
  });
};
