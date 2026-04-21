export type ProgressState = 'on-track' | 'at-risk' | 'blocked' | 'pending-review';

export type HandoffStatus = 'ready' | 'awaiting-response' | 'accepted' | 'rejected';

export type Priority = 'low' | 'medium' | 'high';

export type TeamModule = {
  id: string;
  name: string;
  owner: string;
  progress: number;
  state: ProgressState;
  openTasks: number;
  blockers: number;
  nextDependency?: string;
};

export type Handoff = {
  id: string;
  fromModule: string;
  toModule: string;
  artifact: string;
  status: HandoffStatus;
  requestedAt: string;
  dueAt: string;
  proofType: 'document' | 'photo' | 'build';
};

export type ChecklistItem = {
  id: string;
  title: string;
  moduleId: string;
  complete: boolean;
  priority: Priority;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
};

export type DashboardSnapshot = {
  modules: TeamModule[];
  handoffs: Handoff[];
  checklist: ChecklistItem[];
  auditTrail: AuditEvent[];
};
