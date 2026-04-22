import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  arrayUnion,
  increment 
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { collections } from '../../domain/database';
import { SharedFile, FileEditRecord } from '../../domain/files';

// Initialize the database instance
const db = getFirebaseDb();

export const fileService = {
  uploadFileMetadata: async (fileData: Omit<SharedFile, 'id'>) => {
    const docRef = await addDoc(collection(db, collections.sharedFiles), fileData);
    return docRef.id;
  },

  subscribeToModuleFiles: (moduleIds: string[], callback: (files: SharedFile[]) => void) => {
    if (!moduleIds || moduleIds.length === 0) {
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, collections.sharedFiles),
      where('moduleFrom', 'in', moduleIds)
    );

    return onSnapshot(q, (snapshot) => {
      const files = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as SharedFile));
      callback(files);
    });
  },

  updateFileVersion: async (fileId: string, edit: FileEditRecord, newUri: string) => {
    const fileRef = doc(db, collections.sharedFiles, fileId);
    await updateDoc(fileRef, {
      uri: newUri,
      version: increment(1),
      editHistory: arrayUnion(edit)
    });
  }
};