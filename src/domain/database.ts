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
