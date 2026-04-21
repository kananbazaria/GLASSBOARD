export type UserRole = 'member' | 'module_head' | 'org_head';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  moduleIds: string[];
};

export type SignInPayload = {
  email: string;
  password: string;
};
