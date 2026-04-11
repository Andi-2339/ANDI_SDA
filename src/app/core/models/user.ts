import { RolePermissions } from './permission';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  groupId: number;
  active: boolean;
  permissions: RolePermissions;
  password?: string;
}
