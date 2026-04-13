import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthUser, RolePermissions, PermissionModule, PermissionAction } from '../models/permission';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  // API Gateway URL for auth
  private apiUrl = 'http://localhost:3000/auth/login';

  currentUser = signal<AuthUser | null>(null);
  isLoggedIn = computed(() => this.currentUser() !== null);

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        this.currentUser.set(JSON.parse(userJson));
      } catch (e) {
        console.error('Error parsing user from local storage', e);
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  login(username: string, password: string): Observable<AuthUser | null> {
    return this.http.post<any>(this.apiUrl, { username, password }).pipe(
      map(response => {
        if (!response || !response.token) return null;
        
        // Save token
        localStorage.setItem('token', response.token);

        const authUser: AuthUser = {
          id: response.id,
          email: response.email,
          fullName: response.fullName, 
          username: response.username,
          permissions: response.permissions,
          memberships: response.memberships || [],
          activeGroupId: response.memberships?.length > 0 ? response.memberships[0].group_id : undefined
        };
        
        return authUser;
      }),
      tap(user => {
        if (user) {
          this.currentUser.set(user);
          localStorage.setItem('user', JSON.stringify(user));
        }
      })
    );
  }

  setActiveGroup(groupId: number): void {
    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, activeGroupId: groupId };
      this.currentUser.set(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  hasPermission(module: PermissionModule, action: PermissionAction): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Priorizar permisos del grupo activo si existe
    if (user.activeGroupId) {
      const membership = user.memberships.find(m => m.group_id === user.activeGroupId);
      if (membership) {
        return membership.permissions[module]?.[action] === true;
      }
    }

    return user.permissions[module]?.[action] === true;
  }

  getCredentialsHint(): string {
    return 'Usa el usuario en Supabase (ej: admin) y tu contraseña. (Ref: supabase_setup.sql)';
  }
}
