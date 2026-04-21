import { AppUser, UserRole } from '../../domain/auth';

const roleNames: Record<UserRole, string> = {
  member: 'Team Member',
  module_head: 'Module Head',
  org_head: 'Organization Head',
};

export const createDemoUser = (email: string, role: UserRole): AppUser => ({
  id: `demo-${role}`,
  email,
  name: roleNames[role],
  role,
  moduleIds: role === 'org_head' ? ['mod-ops', 'mod-compliance', 'mod-engineering', 'mod-launch'] : ['mod-compliance'],
});
