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
