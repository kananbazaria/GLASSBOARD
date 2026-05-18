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
