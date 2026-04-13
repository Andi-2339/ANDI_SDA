import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user';
import { RolePermissions, ApiResponse } from '../models/permission';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/users';

  users = signal<User[]>([]);

  // Load all users from backend
  loadUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl).pipe(
      map(res => res.data),
      tap(data => this.users.set(data))
    );
  }

  getEmptyPermissions(): RolePermissions {
    return {
      groups: { view: false, add: false, edit: false, delete: false },
      users: { view: false, add: false, edit: false, delete: false },
      tickets: { view: false, add: false, edit: false, delete: false },
    };
  }

  getUsersByGroup(groupId: number): User[] {
    return this.users().filter((u) => u.groupId === groupId);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  addUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, user).pipe(
      map(res => res.data),
      tap(newUser => {
        this.users.update((list) => [...list, newUser]);
      })
    );
  }

  updateUser(id: number, changes: Partial<User>): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, changes).pipe(
      map(res => res.data),
      tap(updatedUser => {
        this.users.update((list) =>
          list.map((u) => (u.id === id ? { ...u, ...updatedUser } : u))
        );
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.users.update((list) => list.filter((u) => u.id !== id));
      })
    );
  }

  getAllUserNames(): string[] {
    return this.users().map((u) => u.fullName);
  }

  // --- MEMBERSHIPS ---
  getUserMemberships(userId: number): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/memberships/${userId}`).pipe(
      map(res => res.data)
    );
  }

  addMembership(userId: number, groupId: number, permissions: RolePermissions): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/memberships`, {
      user_id: userId,
      group_id: groupId,
      permissions
    }).pipe(map(res => res.data));
  }

  updateMembership(id: number, permissions: RolePermissions): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/memberships/${id}`, {
      permissions
    }).pipe(map(res => res.data));
  }

  deleteMembership(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/memberships/${id}`);
  }
}
