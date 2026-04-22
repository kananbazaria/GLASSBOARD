import { AppUser, UserRole } from '../../domain/auth';

const roleNames: Record<UserRole, string> = {
  member: 'Team Member',
  module_head: 'Module Head',
  org_head: 'Organization Head',
};

<<<<<<< Updated upstream
export const getDefaultModuleIdsForRole = (role: UserRole) =>
  role === 'org_head' ? ['mod-ops', 'mod-compliance', 'mod-engineering', 'mod-launch'] : ['mod-compliance'];

=======
>>>>>>> Stashed changes
export const createDemoUser = (email: string, role: UserRole): AppUser => ({
  id: `demo-${role}`,
  email,
  name: roleNames[role],
  role,
<<<<<<< Updated upstream
  moduleIds: getDefaultModuleIdsForRole(role),
=======
  moduleIds: role === 'org_head' ? ['mod-ops', 'mod-compliance', 'mod-engineering', 'mod-launch'] : ['mod-compliance'],
>>>>>>> Stashed changes
});
