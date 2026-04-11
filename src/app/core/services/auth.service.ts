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
          password: password, // not ideal to store password in client but keeping structure
          fullName: response.fullName, 
          permissions: response.permissions,
          groupId: response.groupId
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

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  hasPermission(module: PermissionModule, action: PermissionAction): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.permissions[module]?.[action] || false;
  }

  getCredentialsHint(): string {
    return 'Usa el usuario en Supabase (ej: admin) y tu contraseña. (Ref: supabase_setup.sql)';
  }
}
