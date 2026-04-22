<<<<<<< Updated upstream
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

import { AppUser, SignInPayload, UserRole } from '../../domain/auth';
import { getDefaultModuleIdsForRole } from '../mock/session';
import { fetchUserProfile } from './firestoreService';
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
=======
import { User, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

import { AppUser, SignInPayload, UserRole } from '../../domain/auth';
import { getFirebaseAuth, hasFirebaseConfig } from './config';
import { fetchUserProfile, saveUserProfile } from './firestoreService';

const DEFAULT_ROLE: UserRole = 'member';
>>>>>>> Stashed changes

const mapFirebaseUser = (user: User): AppUser => ({
  id: user.uid,
  email: user.email ?? 'unknown@glassboard.app',
  name: user.displayName ?? 'GlassBoard User',
<<<<<<< Updated upstream
  role: inferRoleFromEmail(user.email ?? ''),
  moduleIds: [],
});

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
=======
  role: DEFAULT_ROLE,
  moduleIds: [],
});

export const signInWithFirebase = async ({ email, password }: SignInPayload): Promise<AppUser> => {
>>>>>>> Stashed changes
  if (!hasFirebaseConfig()) {
    throw new Error('Firebase environment variables are missing.');
  }

<<<<<<< Updated upstream
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return hydrateAppUser(credential.user, preferredRole);
=======
  // 1. Authenticate with Firebase
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  const firebaseUser = credential.user;

  // 2. Fetch real role + moduleIds from Firestore
  const userDoc = await fetchUserProfile(firebaseUser.uid);

  if (userDoc) {
    // User exists in Firestore — use stored role and modules
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email ?? userDoc.email,
      name: firebaseUser.displayName ?? userDoc.name,
      role: userDoc.role as UserRole,
      moduleIds: userDoc.moduleIds ?? [],
    };
  }

  // 3. First-time user — create their profile in Firestore with default role
  const newUser = mapFirebaseUser(firebaseUser);
  await saveUserProfile(newUser);
  return newUser;
>>>>>>> Stashed changes
};

export const signOutFromFirebase = async () => {
  if (!hasFirebaseConfig()) {
    return;
  }

  await firebaseSignOut(getFirebaseAuth());
<<<<<<< Updated upstream
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
=======
};
>>>>>>> Stashed changes
