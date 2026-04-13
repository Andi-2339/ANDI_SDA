import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { PermissionModule, PermissionAction, RolePermissions } from '../models/permission';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private authService = inject(AuthService);

  // El grupo activo se maneja en el AuthService, pero aquí exponemos la lógica de chequeo
  activePermissions = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return null;

    // Si no hay grupo activo, usamos los permisos globales
    if (!user.activeGroupId) return user.permissions;

    // Buscar los permisos de la membresía activa
    const membership = user.memberships.find(m => m.group_id === user.activeGroupId);
    return membership ? membership.permissions : user.permissions;
  });

  /**
   * Verifica un permiso en formato string "modulo:accion"
   * Ejemplo: "tickets:add", "users:manage"
   */
  hasPermission(permission: string): boolean {
    const perms = this.activePermissions();
    if (!perms) return false;

    const [moduleStr, actionStr] = permission.split(':');
    
    // Casting seguro
    const module = moduleStr as PermissionModule;
    const action = actionStr as PermissionAction;

    if (perms[module] && perms[module][action] !== undefined) {
      return perms[module][action] === true;
    }

    return false;
  }

  /**
   * Cambia el contexto de grupo activo
   */
  refreshPermissionsForGroup(groupId: number): void {
    this.authService.setActiveGroup(groupId);
  }
}
