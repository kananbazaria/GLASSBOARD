// src/domain/files.ts

export type FileEditRecord = {
  editedBy: string;
  editedAt: number;
  note: string;
};

export type SharedFile = {
  id: string;
  name: string;
  uri: string;
  moduleFrom: string;
  moduleTo: string;
  uploadedBy: string;
  uploadedAt: number;
  version: number;
  editHistory: FileEditRecord[];
};