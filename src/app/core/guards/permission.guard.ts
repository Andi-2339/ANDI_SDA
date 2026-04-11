import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionModule, PermissionAction } from '../models/permission';

export function permissionGuard(module: PermissionModule, action: PermissionAction): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasPermission(module, action)) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
}
