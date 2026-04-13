export type PermissionAction = 'view' | 'add' | 'edit' | 'delete' | 'manage' | 'move';
export type PermissionModule = 'groups' | 'users' | 'tickets';

export interface ModulePermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  manage?: boolean;
  move?: boolean;
}

export interface RolePermissions {
  groups: ModulePermissions;
  users: ModulePermissions;
  tickets: ModulePermissions;
}

export interface UserMembership {
  group_id: number;
  permissions: RolePermissions;
  active: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  username: string;
  permissions: RolePermissions; // Global permissions
  memberships: UserMembership[];
  activeGroupId?: number;
}
