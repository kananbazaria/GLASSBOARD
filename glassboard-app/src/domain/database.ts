import { AuditEvent, ChecklistItem, Handoff, TeamModule } from './models';

export const collections = {
  users: 'users',
  modules: 'modules',
  handoffs: 'handoffs',
  tasks: 'tasks',
  auditEvents: 'auditEvents',
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
