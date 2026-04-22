import { AuditEvent, ChecklistItem, Handoff, TeamModule } from './models';
<<<<<<< Updated upstream
=======
import { SharedFile } from './files';// Importing the new type
>>>>>>> Stashed changes

export const collections = {
  users: 'users',
  modules: 'modules',
  handoffs: 'handoffs',
  tasks: 'tasks',
  auditEvents: 'auditEvents',
<<<<<<< Updated upstream
=======
  sharedFiles: 'sharedFiles', // Add this line
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======

/**
 * New Document Type for Inter-module file sharing
 */
export type SharedFileDocument = SharedFile;
>>>>>>> Stashed changes
