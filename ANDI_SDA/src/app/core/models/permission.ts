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
  id?: number;
  group_id: number;
  permissions: RolePermissions;
  active: boolean;
  groups?: {
    nombre: string;
  };
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

export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}
