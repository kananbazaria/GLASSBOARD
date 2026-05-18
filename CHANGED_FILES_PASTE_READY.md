# GlassBoard Changed Files - Paste Ready

Copy each code block into the matching file path shown above it.

## App.tsx

```tsx
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
```

## src/app/navigation/AppRouter.tsx

```tsx
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
```

## src/data/firebase/config.ts

```tsx
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const isRealValue = (value: unknown) =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  !/(replace-me|placeholder|paste_|your_|xxxx|xxx)/i.test(value.trim()) &&
  value.trim() !== '123456789' &&
  value.trim() !== '1:123:web:abc';

export const missingFirebaseConfigKeys = () =>
  Object.entries(firebaseConfig)
    .filter(([, value]) => !isRealValue(value))
    .map(([key]) => key);

export const hasFirebaseConfig = () => missingFirebaseConfigKeys().length === 0;

export const initializeFirebase = (): FirebaseApp => {
  if (!hasFirebaseConfig()) {
    throw new Error(`Firebase config is incomplete: ${missingFirebaseConfigKeys().join(', ')}`);
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
};

export const getFirebaseAuth = (): Auth => getAuth(initializeFirebase());

export const getFirebaseDb = (): Firestore => getFirestore(initializeFirebase());

export const getFirebaseStorage = (): FirebaseStorage => getStorage(initializeFirebase());
```

## src/data/firebase/authService.ts

```tsx
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
```

## src/data/firebase/firestoreService.ts

```tsx
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { AppUser } from '../../domain/auth';
import { DashboardSnapshot } from '../../domain/models';
import {
  AuditEventDocument,
  HandoffDocument,
  ModuleDocument,
  TaskDocument,
  UserDocument,
  collections,
} from '../../domain/database';
import { getFirebaseDb, hasFirebaseConfig } from './config';

const withDocumentId = <T extends { id: string }>(id: string, data: T): T => ({
  ...data,
  id: data.id ?? id,
});

export const saveUserProfile = async (user: AppUser) => {
  if (!hasFirebaseConfig()) {
    return;
  }

  const userRef = doc(getFirebaseDb(), collections.users, user.id);
  const payload: UserDocument & { updatedAt: unknown } = {
    name: user.name,
    email: user.email,
    role: user.role,
    moduleIds: user.moduleIds,
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, payload, { merge: true });
};

export const fetchModules = async (): Promise<ModuleDocument[]> => {
  if (!hasFirebaseConfig()) {
    return [];
  }

  const snapshot = await getDocs(query(collection(getFirebaseDb(), collections.modules), orderBy('name')));
  return snapshot.docs.map((entry) => withDocumentId(entry.id, entry.data() as ModuleDocument));
};

export const fetchHandoffs = async (): Promise<HandoffDocument[]> => {
  if (!hasFirebaseConfig()) {
    return [];
  }

  const snapshot = await getDocs(query(collection(getFirebaseDb(), collections.handoffs), orderBy('requestedAt', 'desc')));
  return snapshot.docs.map((entry) => withDocumentId(entry.id, entry.data() as HandoffDocument));
};

export const fetchTasks = async (): Promise<TaskDocument[]> => {
  if (!hasFirebaseConfig()) {
    return [];
  }

  const snapshot = await getDocs(query(collection(getFirebaseDb(), collections.tasks), orderBy('priority')));
  return snapshot.docs.map((entry) => withDocumentId(entry.id, entry.data() as TaskDocument));
};

export const fetchAuditEvents = async (): Promise<AuditEventDocument[]> => {
  if (!hasFirebaseConfig()) {
    return [];
  }

  const snapshot = await getDocs(query(collection(getFirebaseDb(), collections.auditEvents), orderBy('timestamp', 'desc')));
  return snapshot.docs.map((entry) => withDocumentId(entry.id, entry.data() as AuditEventDocument));
};

export const fetchUserProfile = async (userId: string): Promise<UserDocument | null> => {
  if (!hasFirebaseConfig()) {
    return null;
  }

  const snapshot = await getDoc(doc(getFirebaseDb(), collections.users, userId));
  return snapshot.exists() ? (snapshot.data() as UserDocument) : null;
};

export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  if (!hasFirebaseConfig()) {
    return {
      modules: [],
      handoffs: [],
      checklist: [],
      auditTrail: [],
    };
  }

  const [modules, tasks, handoffs, auditEvents] = await Promise.all([
    fetchModules(),
    fetchTasks(),
    fetchHandoffs(),
    fetchAuditEvents(),
  ]);

  return {
    modules,
    checklist: tasks,
    handoffs,
    auditTrail: auditEvents,
  };
};

export const saveProofUrl = async (handoffId: string, proofUrl: string): Promise<void> => {
  if (!hasFirebaseConfig()) return;

  await updateDoc(doc(getFirebaseDb(), collections.handoffs, handoffId), { proofUrl });
};

export const updateHandoffStatus = async (handoffId: string, status: 'accepted' | 'rejected'): Promise<void> => {
  if (!hasFirebaseConfig()) return;

  await updateDoc(doc(getFirebaseDb(), collections.handoffs, handoffId), { status });
};

export const writeAuditEvent = async (event: {
  actor: string;
  action: string;
  target: string;
}): Promise<void> => {
  if (!hasFirebaseConfig()) return;

  await addDoc(collection(getFirebaseDb(), collections.auditEvents), {
    ...event,
    timestamp: serverTimestamp(),
  });
};
```

## src/data/firebase/fileService.ts

```tsx
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { collections } from '../../domain/database';
import { FileEditRecord, SharedFile } from '../../domain/files';
import { getFirebaseDb, getFirebaseStorage, hasFirebaseConfig } from './config';

type UploadInput = Omit<SharedFile, 'id'>;

export const uploadFileToFirebaseStorage = async (uri: string, fileName: string) => {
  if (!hasFirebaseConfig()) {
    return uri;
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  const safeName = fileName.replace(/[^a-z0-9._-]/gi, '_');
  const storageRef = ref(getFirebaseStorage(), `sharedFiles/${Date.now()}-${safeName}`);

  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

export const fileService = {
  uploadFileMetadata: async (fileData: UploadInput) => {
    if (!hasFirebaseConfig()) {
      throw new Error('Firebase config is missing. Add real .env values before uploading.');
    }

    const downloadUrl = await uploadFileToFirebaseStorage(fileData.uri, fileData.name);
    const docRef = await addDoc(collection(getFirebaseDb(), collections.sharedFiles), {
      ...fileData,
      uri: downloadUrl,
    });

    return docRef.id;
  },

  subscribeToModuleFiles: (moduleIds: string[], callback: (files: SharedFile[]) => void) => {
    if (!hasFirebaseConfig() || !moduleIds || moduleIds.length === 0) {
      callback([]);
      return () => undefined;
    }

    const q = query(collection(getFirebaseDb(), collections.sharedFiles), where('moduleFrom', 'in', moduleIds.slice(0, 10)));

    return onSnapshot(
      q,
      (snapshot) => {
        const files = snapshot.docs.map(
          (entry) =>
            ({
              id: entry.id,
              ...entry.data(),
            }) as SharedFile,
        );
        callback(files);
      },
      () => callback([]),
    );
  },

  updateFileVersion: async (fileId: string, edit: FileEditRecord, fileName: string, newUri: string) => {
    if (!hasFirebaseConfig()) {
      throw new Error('Firebase config is missing. Add real .env values before uploading.');
    }

    const downloadUrl = await uploadFileToFirebaseStorage(newUri, fileName);

    await updateDoc(doc(getFirebaseDb(), collections.sharedFiles, fileId), {
      uri: downloadUrl,
      version: increment(1),
      editHistory: arrayUnion(edit),
    });
  },
};
```

## src/data/mock/session.ts

```tsx
import { AppUser, UserRole } from '../../domain/auth';

const roleNames: Record<UserRole, string> = {
  member: 'Team Member',
  module_head: 'Module Head',
  org_head: 'Organization Head',
};

export const getDefaultModuleIdsForRole = (role: UserRole) => {
  if (role === 'org_head') {
    return ['mod-ops', 'mod-compliance', 'mod-engineering', 'mod-launch'];
  }

  if (role === 'module_head') {
    return ['mod-engineering'];
  }

  return ['mod-compliance'];
};

export const createDemoUser = (email: string, role: UserRole): AppUser => ({
  id: `demo-${role}`,
  email,
  name: roleNames[role],
  role,
  moduleIds: getDefaultModuleIdsForRole(role),
});
```

## src/domain/auth.ts

```tsx
export type UserRole = 'member' | 'module_head' | 'org_head';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  moduleIds: string[];
};

export type SignInPayload = {
  email: string;
  password: string;
  preferredRole?: UserRole;
};
```

## src/domain/database.ts

```tsx
import { AuditEvent, ChecklistItem, Handoff, TeamModule } from './models';
import { SharedFile } from './files';

export const collections = {
  users: 'users',
  modules: 'modules',
  handoffs: 'handoffs',
  tasks: 'tasks',
  auditEvents: 'auditEvents',
  sharedFiles: 'sharedFiles',
} as const;

export type UserDocument = {
  name: string;
  email: string;
  role: 'member' | 'module_head' | 'org_head';
  moduleIds: string[];
};

export type ModuleDocument = TeamModule;
export type HandoffDocument = Handoff;
export type TaskDocument = ChecklistItem;
export type AuditEventDocument = AuditEvent;
export type SharedFileDocument = SharedFile;
```

## src/presentation/components/HandoffCard.tsx

```tsx
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppUser } from '../../domain/auth';
import { uploadFileToFirebaseStorage } from '../../data/firebase/fileService';
import { saveProofUrl, updateHandoffStatus, writeAuditEvent } from '../../data/firebase/firestoreService';
import { Handoff } from '../../domain/models';
import { colors, radius, spacing } from '../theme/tokens';

const handoffLabel: Record<Handoff['status'], string> = {
  ready: 'Ready to send',
  'awaiting-response': 'Awaiting response',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const statusColor: Record<Handoff['status'], string> = {
  ready: colors.textMuted,
  'awaiting-response': colors.warning,
  accepted: colors.success,
  rejected: colors.danger,
};

type ProofFile = {
  uri: string;
  name: string;
};

type Props = {
  handoff: Handoff;
  currentUser: AppUser;
  receiverModuleNames: Set<string>;
  onStatusChange: (handoffId: string, status: 'accepted' | 'rejected') => void;
};

export const HandoffCard = ({ handoff, currentUser, receiverModuleNames, onStatusChange }: Props) => {
  const [busy, setBusy] = useState(false);
  const [proof, setProof] = useState<ProofFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDemoUser = currentUser.id.startsWith('demo-');

  const canAct =
    handoff.status === 'awaiting-response' &&
    currentUser.role === 'module_head' &&
    receiverModuleNames.has(handoff.toModule);

  const handlePickProof = async () => {
    setError(null);
    try {
      if (handoff.proofType === 'photo') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setProof({ uri: asset.uri, name: asset.fileName ?? 'photo.jpg' });
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setProof({ uri: asset.uri, name: asset.name });
        }
      }
    } catch {
      setError('Could not pick file. Please try again.');
    }
  };

  const handleAccept = async () => {
    if (!proof) {
      setError('Please attach proof before accepting.');
      return;
    }

    try {
      setBusy(true);
      setError(null);

      if (isDemoUser) {
        onStatusChange(handoff.id, 'accepted');
        return;
      }

      const proofUrl = await uploadFileToFirebaseStorage(proof.uri, proof.name);
      await saveProofUrl(handoff.id, proofUrl);
      await updateHandoffStatus(handoff.id, 'accepted');
      await writeAuditEvent({
        actor: currentUser.name,
        action: 'Accepted handoff with proof',
        target: `${handoff.fromModule} â†’ ${handoff.toModule}`,
      });

      onStatusChange(handoff.id, 'accepted');
    } catch {
      setError('Failed to update handoff. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    try {
      setBusy(true);
      setError(null);

      if (isDemoUser) {
        onStatusChange(handoff.id, 'rejected');
        return;
      }

      await updateHandoffStatus(handoff.id, 'rejected');
      await writeAuditEvent({
        actor: currentUser.name,
        action: 'Rejected handoff',
        target: `${handoff.fromModule} â†’ ${handoff.toModule}`,
      });

      onStatusChange(handoff.id, 'rejected');
    } catch {
      setError('Failed to reject handoff. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            {handoff.fromModule} â†’ {handoff.toModule}
          </Text>
          <Text style={styles.subtitle}>
            {handoff.artifact} â€¢ Proof: {handoff.proofType}
          </Text>
        </View>
        <Text style={[styles.status, { color: statusColor[handoff.status] }]}>
          {handoffLabel[handoff.status]}
        </Text>
      </View>

      <Text style={styles.meta}>
        Requested {handoff.requestedAt} â€¢ Due {handoff.dueAt}
      </Text>

      {canAct && (
        <View style={styles.actionArea}>
          <Pressable onPress={handlePickProof} style={styles.proofPicker} disabled={busy}>
            <Text style={styles.proofPickerText}>
              {proof ? `âœ“ ${proof.name}` : `Attach ${handoff.proofType === 'photo' ? 'photo' : 'document'} proof`}
            </Text>
          </Pressable>

          {busy ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <View style={styles.actions}>
              <Pressable
                onPress={handleAccept}
                style={[styles.actionButton, styles.acceptButton]}
                disabled={busy}
              >
                <Text style={styles.acceptText}>Accept</Text>
              </Pressable>
              <Pressable
                onPress={handleReject}
                style={[styles.actionButton, styles.rejectButton]}
                disabled={busy}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingTop: 4,
  },
  meta: {
    color: colors.textDim,
    fontSize: 12,
  },
  actionArea: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  proofPicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  proofPickerText: {
    color: colors.accent,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  acceptButton: {
    borderColor: colors.success,
    backgroundColor: 'rgba(125, 241, 167, 0.08)',
  },
  rejectButton: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(255, 124, 114, 0.08)',
  },
  acceptText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  rejectText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});
```

## src/presentation/components/MetricCard.tsx

```tsx
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

type MetricCardProps = {
  label: string;
  value: string;
  tone?: 'default' | 'danger' | 'warning' | 'success';
};

const toneColorMap = {
  default: colors.accent,
  danger: colors.danger,
  warning: colors.warning,
  success: colors.success,
};

export const MetricCard = ({ label, value, tone = 'default' }: MetricCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: toneColorMap[tone] }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: typography.body,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: typography.body,
  },
});
```

## src/presentation/components/SectionCard.tsx

```tsx
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export const SectionCard = ({ title, subtitle, children }: SectionCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
    shadowColor: '#02101f',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: typography.display,
    letterSpacing: 1.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    gap: spacing.md,
  },
});
```

## src/presentation/screens/FilesScreen.tsx

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AppUser } from '../../domain/auth';
import { fileService } from '../../data/firebase/fileService';
import { hasFirebaseConfig } from '../../data/firebase/config';
import { SharedFile } from '../../domain/files';
import { FileCard } from '../components/FileCard';
import { colors, spacing, radius } from '../theme/tokens';

interface FilesScreenProps {
  user: AppUser;
  onBack: () => void;
}

export const FilesScreen = ({ user, onBack }: FilesScreenProps) => {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const isDemoUser = user.id.startsWith('demo-');

  useEffect(() => {
    if (isDemoUser || !hasFirebaseConfig()) {
      return () => undefined;
    }

    const unsub = fileService.subscribeToModuleFiles(user.moduleIds || [], setFiles);
    return () => unsub();
  }, [isDemoUser, user.moduleIds]);

  const handleUploadNewFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const fileAsset = res.assets[0];

        const nextFile: SharedFile = {
          id: `local-file-${Date.now()}`,
          name: fileAsset.name,
          uri: fileAsset.uri,
          moduleFrom: user.moduleIds[0] || 'Unassigned',
          moduleTo: 'Org',
          uploadedBy: user.name,
          uploadedAt: Date.now(),
          version: 1,
          editHistory: [],
        };

        if (isDemoUser || !hasFirebaseConfig()) {
          setFiles((existingFiles) => [nextFile, ...existingFiles]);
          return;
        }

        await fileService.uploadFileMetadata(nextFile);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick or upload file. Check Firebase config and Storage rules.');
    }
  };

  const handleNewVersion = async (file: SharedFile) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const fileAsset = res.assets[0];

        const editRecord = {
          editedBy: user.name,
          editedAt: Date.now(),
          note: 'Updated file version',
        };

        if (isDemoUser || !hasFirebaseConfig()) {
          setFiles((existingFiles) =>
            existingFiles.map((existingFile) =>
              existingFile.id === file.id
                ? {
                    ...existingFile,
                    name: fileAsset.name,
                    uri: fileAsset.uri,
                    version: existingFile.version + 1,
                    editHistory: [...existingFile.editHistory, editRecord],
                  }
                : existingFile,
            ),
          );
          return;
        }
        
        await fileService.updateFileVersion(
          file.id,
          editRecord,
          fileAsset.name,
          fileAsset.uri,
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update file. Check Firebase config and Storage rules.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>â† Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shared Files</Text>
      </View>
      
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FileCard 
            file={item} 
            // Only allow module heads or org heads to upload new versions
            canEdit={user.role === 'module_head' || user.role === 'org_head'} 
            onNewVersion={handleNewVersion} 
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No files shared with your modules yet.</Text>
        }
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={handleUploadNewFile}>
        <Text style={styles.fabText}>+ Share File</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: spacing.xl * 1.5, // Padding for safe area / status bar
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface
  },
  backButton: {
    marginRight: spacing.md,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xs,
  },
  backText: { 
    color: colors.accent, 
    fontWeight: '600',
    fontSize: 16
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold',
    color: colors.textPrimary 
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 4, // Extra space at bottom so FAB doesn't block the last item
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: spacing.xl, 
    color: colors.textDim 
  },
  fab: { 
    position: 'absolute', 
    bottom: spacing.xl, 
    right: spacing.md, 
    backgroundColor: colors.accent, 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.md, 
    borderRadius: radius.pill,
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { 
    color: colors.background, 
    fontWeight: 'bold',
    fontSize: 16
  }
});
```

## src/presentation/screens/HomeScreen.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { AppUser } from '../../domain/auth';
import { getFirebaseDb, hasFirebaseConfig } from '../../data/firebase/config';
import { dashboardSnapshot } from '../../data/mock/dashboard';
import { createDashboardSummary } from '../../domain/analytics';
import { AuditEvent, ChecklistItem, DashboardSnapshot, Handoff, TeamModule } from '../../domain/models';
import {
  AuditEventDocument,
  HandoffDocument,
  ModuleDocument,
  TaskDocument,
  collections,
} from '../../domain/database';
import { HandoffCard } from '../components/HandoffCard';
import { MetricCard } from '../components/MetricCard';
import { SectionCard } from '../components/SectionCard';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { useAppSession } from '../../app/session/useAppSession';

const stateLabel: Record<TeamModule['state'], string> = {
  'on-track': 'On track',
  'at-risk': 'At risk',
  blocked: 'Blocked',
  'pending-review': 'Pending review',
};

const checklistTone: Record<ChecklistItem['priority'], string> = {
  low: colors.textMuted,
  medium: colors.warning,
  high: colors.danger,
};

type HomeScreenProps = {
  currentUser: AppUser;
  onNavigateFiles: () => void;
};

const roleLabel: Record<AppUser['role'], string> = {
  member: 'Team Member',
  module_head: 'Module Head',
  org_head: 'Organization Head',
};

const filterModulesForUser = (modules: TeamModule[], currentUser: AppUser) => {
  if (currentUser.role === 'org_head') return modules;
  return modules.filter((m) => currentUser.moduleIds.includes(m.id));
};

const filterTasksForUser = (tasks: ChecklistItem[], currentUser: AppUser) => {
  if (currentUser.role === 'org_head') return tasks;
  return tasks.filter((t) => currentUser.moduleIds.includes(t.moduleId));
};

const filterHandoffsForUser = (handoffs: Handoff[], visibleModules: TeamModule[], currentUser: AppUser) => {
  if (currentUser.role === 'org_head') return handoffs;
  const visibleNames = new Set(visibleModules.map((m) => m.name));
  return handoffs.filter((h) => visibleNames.has(h.fromModule) || visibleNames.has(h.toModule));
};

const buildSnapshotForUser = (base: DashboardSnapshot, currentUser: AppUser): DashboardSnapshot => {
  const visibleModules = filterModulesForUser(base.modules, currentUser);
  return {
    modules: visibleModules,
    checklist: filterTasksForUser(base.checklist, currentUser),
    handoffs: filterHandoffsForUser(base.handoffs, visibleModules, currentUser),
    auditTrail: currentUser.role === 'org_head' ? base.auditTrail : [],
  };
};

const withDocumentId = <T extends { id: string }>(id: string, data: T): T => ({
  ...data,
  id: data.id ?? id,
});

export const HomeScreen = ({ currentUser, onNavigateFiles }: HomeScreenProps) => {
  const { signOutCurrentUser } = useAppSession();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(() =>
    buildSnapshotForUser(dashboardSnapshot, currentUser),
  );
  const [dataSource, setDataSource] = useState<'mock' | 'live'>('mock');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const liveData = useRef<{
    modules: TeamModule[];
    checklist: ChecklistItem[];
    handoffs: Handoff[];
    auditTrail: AuditEvent[];
  }>({
    modules: dashboardSnapshot.modules,
    checklist: dashboardSnapshot.checklist,
    handoffs: dashboardSnapshot.handoffs,
    auditTrail: dashboardSnapshot.auditTrail,
  });

  const rebuildSnapshot = () => {
    setSnapshot(buildSnapshotForUser(liveData.current, currentUser));
  };

  useEffect(() => {
    if (!hasFirebaseConfig()) return;

    setStatus('loading');
    const db = getFirebaseDb();
    let resolvedCount = 0;
    const totalListeners = 4;

    const onReady = () => {
      resolvedCount += 1;
      if (resolvedCount === totalListeners) {
        setStatus('idle');
        setDataSource('live');
      }
    };

    const unsubModules = onSnapshot(
      query(collection(db, collections.modules), orderBy('name')),
      (snap) => {
        const docs = snap.docs.map((d) => withDocumentId(d.id, d.data() as ModuleDocument));
        liveData.current.modules = docs.length > 0 ? docs : dashboardSnapshot.modules;
        rebuildSnapshot();
        onReady();
      },
      () => { setStatus('error'); onReady(); },
    );

    const unsubTasks = onSnapshot(
      query(collection(db, collections.tasks), orderBy('priority')),
      (snap) => {
        const docs = snap.docs.map((d) => withDocumentId(d.id, d.data() as TaskDocument));
        liveData.current.checklist = docs.length > 0 ? docs : dashboardSnapshot.checklist;
        rebuildSnapshot();
        onReady();
      },
      () => { setStatus('error'); onReady(); },
    );

    const unsubHandoffs = onSnapshot(
      query(collection(db, collections.handoffs), orderBy('requestedAt', 'desc')),
      (snap) => {
        const docs = snap.docs.map((d) => withDocumentId(d.id, d.data() as HandoffDocument));
        liveData.current.handoffs = docs.length > 0 ? docs : dashboardSnapshot.handoffs;
        rebuildSnapshot();
        onReady();
      },
      () => { setStatus('error'); onReady(); },
    );

    const unsubAudit = currentUser.role === 'org_head'
        ? onSnapshot(
          query(collection(db, collections.auditEvents), orderBy('timestamp', 'desc')),
          (snap) => {
            liveData.current.auditTrail = snap.docs.map((d) => withDocumentId(d.id, d.data() as AuditEvent));
            rebuildSnapshot();
            onReady();
          },
          () => { setStatus('error'); onReady(); },
        )
      : (() => { onReady(); return () => {}; })();

    return () => {
      unsubModules();
      unsubTasks();
      unsubHandoffs();
      unsubAudit();
    };
  }, [currentUser]);

  const receiverModuleNames = useMemo(
    () => new Set(snapshot.modules.map((m) => m.name)),
    [snapshot.modules],
  );

  const handleHandoffStatusChange = (handoffId: string, nextStatus: 'accepted' | 'rejected') => {
    liveData.current.handoffs = liveData.current.handoffs.map((handoff) =>
      handoff.id === handoffId ? { ...handoff, status: nextStatus } : handoff,
    );
    rebuildSnapshot();
  };

  const summary = createDashboardSummary(snapshot);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroShell}>
          <View style={styles.heroGlow} />
          <View style={styles.hero}>
            <Text style={styles.brand}>GLASSBOARD</Text>
            <View style={styles.sessionBar}>
              <View style={styles.sessionMeta}>
                <Text style={styles.sessionRole}>{roleLabel[currentUser.role]}</Text>
                <Text style={styles.sessionEmail}>{currentUser.email}</Text>
              </View>
              <Text onPress={signOutCurrentUser} style={styles.signOut}>
                Sign out
              </Text>
            </View>
            <Text style={styles.heroCopy}>
              Track every cross-team handoff with proof, timestamps, and visible accountability before small delays
              turn into organization-wide blind spots.
            </Text>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {dataSource === 'live'
                  ? 'â¬¤  Live â€” syncing in real time from Firestore'
                  : 'Mobile command view for module health, handoffs, and audit history'}
              </Text>
            </View>
            {status === 'loading' ? <Text style={styles.statusText}>Connecting to Firestore...</Text> : null}
            {status === 'error' ? <Text style={styles.statusError}>Firestore sync failed, showing local mock data.</Text> : null}
          </View>
        </View>

        {/* New Shared Files Navigation Button */}
        <TouchableOpacity style={styles.filesButton} onPress={onNavigateFiles} activeOpacity={0.7}>
          <Text style={styles.filesButtonText}>Browse Shared Files</Text>
          <Text style={styles.filesButtonArrow}>â†’</Text>
        </TouchableOpacity>

        <View style={styles.metricGrid}>
          <MetricCard label="Modules" value={String(summary.moduleCount)} />
          <MetricCard label="Blocked" value={String(summary.blockedModules)} tone="danger" />
          <MetricCard label="Pending handoffs" value={String(summary.pendingHandoffs)} tone="warning" />
          <MetricCard label="Checklist completion" value={`${summary.completionRate}%`} tone="success" />
        </View>

        <SectionCard
          title="Module Progress"
          subtitle="Each module owns its checklist, updates progress, and exposes only the context needed for the next handoff."
        >
          {snapshot.modules.map((module) => (
            <View key={module.id} style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <View style={styles.rowTitleBlock}>
                  <Text style={styles.rowTitle}>{module.name}</Text>
                  <Text style={styles.rowSubtitle}>
                    Owner: {module.owner}
                    {module.nextDependency ? `  â€¢  Next: ${module.nextDependency}` : ''}
                  </Text>
                </View>
                <Text style={styles.progressValue}>{module.progress}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${module.progress}%` }]} />
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataText}>{stateLabel[module.state]}</Text>
                <Text style={styles.metadataText}>
                  {module.openTasks} open tasks â€¢ {module.blockers} blockers
                </Text>
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard
          title="Digital Handshakes"
          subtitle="Every transition is explicit: sender, receiver, proof of delivery, deadline, and response state."
        >
          {snapshot.handoffs.map((handoff) => (
            <HandoffCard
              key={handoff.id}
              handoff={handoff}
              currentUser={currentUser}
              receiverModuleNames={receiverModuleNames}
              onStatusChange={handleHandoffStatusChange}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="Checklist Focus"
          subtitle="A lightweight checklist system keeps each team honest before they can initiate the next module handoff."
        >
          {snapshot.checklist.map((item) => (
            <View key={item.id} style={styles.checklistRow}>
              <View style={[styles.checkIcon, item.complete ? styles.checkIconDone : styles.checkIconPending]}>
                <Text style={styles.checkIconText}>{item.complete ? 'OK' : '!'}</Text>
              </View>
              <View style={styles.rowTitleBlock}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={[styles.rowSubtitle, { color: checklistTone[item.priority] }]}>
                  Priority: {item.priority.toUpperCase()} â€¢ Module: {item.moduleId}
                </Text>
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard
          title="Leadership Audit View"
          subtitle="Organization heads get the full trail without exposing unrelated sensitive detail across teams."
        >
          {snapshot.auditTrail.length === 0 ? (
            <Text style={styles.metadataText}>
              Audit events will appear here for organization heads once the collection is added.
            </Text>
          ) : null}
          {snapshot.auditTrail.map((event) => (
            <View key={event.id} style={styles.auditRow}>
              <Text style={styles.auditActor}>{event.actor}</Text>
              <Text style={styles.auditText}>
                {event.action} on {event.target}
              </Text>
              <Text style={styles.auditTime}>{event.timestamp}</Text>
            </View>
          ))}
        </SectionCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 12,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
  heroShell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -10,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124, 226, 255, 0.14)',
  },
  hero: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  filesButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  filesButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  filesButtonArrow: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  sessionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  sessionMeta: {
    gap: 2,
  },
  sessionRole: {
    color: colors.accent,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sessionEmail: {
    color: colors.textMuted,
    fontSize: 14,
  },
  signOut: {
    color: colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceStrong,
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: 1.5,
    fontFamily: typography.display,
  },
  heroCopy: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 25,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  heroBadgeText: {
    color: colors.accent,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  statusError: {
    color: colors.warning,
    fontSize: 13,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowTitleBlock: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  progressValue: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metadataText: {
    color: colors.textDim,
    fontSize: 12,
    flexShrink: 1,
  },
  checklistRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  checkIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  checkIconDone: {
    backgroundColor: 'rgba(125, 241, 167, 0.1)',
    borderColor: colors.success,
  },
  checkIconPending: {
    backgroundColor: 'rgba(255, 124, 114, 0.08)',
    borderColor: colors.danger,
  },
  checkIconText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  auditRow: {
    gap: 2,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  auditActor: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  auditText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  auditTime: {
    color: colors.textDim,
    fontSize: 12,
  },
});
```

## src/presentation/screens/SignInScreen.tsx

```tsx
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppSession } from '../../app/session/useAppSession';
import { signInWithFirebase } from '../../data/firebase/authService';
import { missingFirebaseConfigKeys } from '../../data/firebase/config';
import { UserRole } from '../../domain/auth';
import { colors, radius, spacing, typography } from '../theme/tokens';

const roles: { value: UserRole; label: string }[] = [
  { value: 'member', label: 'Team Member' },
  { value: 'module_head', label: 'Module Head' },
  { value: 'org_head', label: 'Organization Head' },
];

export const SignInScreen = () => {
  const { completeAuthenticatedSignIn, signInDemoUser } = useAppSession();
  const [email, setEmail] = useState('head@glassboard.app');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('module_head');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');

  const helperText = useMemo(() => {
    const missingKeys = missingFirebaseConfigKeys();
    return missingKeys.length > 0
      ? `Firebase is not fully configured. Missing: ${missingKeys.join(', ')}. Demo mode still works.`
      : 'Firebase is configured. Use a Firebase Authentication email/password user to sign in.';
  }, []);

  const handleFirebaseSignIn = async () => {
    try {
      setStatus('submitting');
      setError(null);

      const user = await signInWithFirebase({ email, password, preferredRole: role });
      completeAuthenticatedSignIn(user);
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : 'Sign-in failed.';
      setError(message);
    } finally {
      setStatus('idle');
    }
  };

  const handleDemoSignIn = () => {
    setError(null);
    signInDemoUser(email, role);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.brand}>GLASSBOARD</Text>
        <Text style={styles.title}>Access Control</Text>
        <Text style={styles.copy}>
          Sign in as a team member, module head, or org head and start tracking handoffs, files, and proof.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Work email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@company.com"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="Firebase password"
            placeholderTextColor={colors.textDim}
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            {roles.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setRole(item.value)}
                style={[styles.roleChip, role === item.value ? styles.roleChipActive : undefined]}
              >
                <Text style={[styles.roleChipText, role === item.value ? styles.roleChipTextActive : undefined]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.helper}>{helperText}</Text>}

        <View style={styles.actions}>
          <Pressable onPress={handleDemoSignIn} style={[styles.button, styles.secondaryButton]}>
            <Text style={styles.secondaryButtonText}>Continue in Demo Mode</Text>
          </Pressable>
          <Pressable
            disabled={status === 'submitting'}
            onPress={handleFirebaseSignIn}
            style={[styles.button, styles.primaryButton, status === 'submitting' ? styles.buttonDisabled : undefined]}
          >
            <Text style={styles.primaryButtonText}>
              {status === 'submitting' ? 'Signing in...' : 'Use Firebase Sign-In'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 1.5,
    fontFamily: typography.display,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: typography.display,
  },
  copy: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceStrong,
  },
  roleRow: {
    gap: spacing.sm,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceStrong,
  },
  roleChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(159, 247, 215, 0.12)',
  },
  roleChipText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  roleChipTextActive: {
    color: colors.textPrimary,
  },
  helper: {
    color: colors.textDim,
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  button: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  primaryButtonText: {
    color: '#021414',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
```

## src/presentation/theme/tokens.ts

```tsx
export const colors = {
  background: '#07111f',
  backgroundAccent: '#102645',
  surface: '#0f1d31',
  surfaceStrong: '#172840',
  surfaceElevated: '#1f3656',
  border: '#29466b',
  textPrimary: '#f6f7fb',
  textMuted: '#aebbcf',
  textDim: '#7b8da9',
  accent: '#7ce2ff',
  accentStrong: '#49c4ff',
  warning: '#ffca70',
  danger: '#ff8f7a',
  success: '#81f0c5',
  info: '#9bb1ff',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  md: 16,
  lg: 24,
  pill: 999,
};

export const typography = {
  display: 'Georgia',
  body: 'System',
};
```

