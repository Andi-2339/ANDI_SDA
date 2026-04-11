export type PermissionAction = 'view' | 'add' | 'edit' | 'delete' | 'manage';
export type PermissionModule = 'groups' | 'users' | 'tickets';

export interface ModulePermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  manage?: boolean;
}

export interface RolePermissions {
  groups: ModulePermissions;
  users: ModulePermissions;
  tickets: ModulePermissions;
}

export interface AuthUser {
  id: number;
  email: string;
  password: string;
  fullName: string;
  permissions: RolePermissions;
  groupId?: number;
}
