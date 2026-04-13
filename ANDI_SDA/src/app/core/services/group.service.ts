import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Group } from '../models/group';
import { ApiResponse } from '../models/permission';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/groups';

  groups = signal<Group[]>([]);

  // Load all groups from backend
  loadGroups(): Observable<Group[]> {
    return this.http.get<ApiResponse<Group[]>>(this.apiUrl).pipe(
      map(res => res.data),
      tap(data => this.groups.set(data))
    );
  }

  getGroupById(id: number): Observable<Group> {
    return this.http.get<ApiResponse<Group>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  getGroupName(id: number | null): string {
    if (!id) return 'Sin Grupo';
    const group = this.groups().find((g) => g.id === id);
    return group ? group.nombre : 'Grupo Desconocido';
  }

  addGroup(group: Omit<Group, 'id' | 'createdAt'>): Observable<Group> {
    return this.http.post<ApiResponse<Group>>(this.apiUrl, group).pipe(
      map(res => res.data),
      tap(newGroup => {
        this.groups.update((list) => [...list, newGroup]);
      })
    );
  }

  updateGroup(id: number, changes: Partial<Group>): Observable<Group> {
    return this.http.put<ApiResponse<Group>>(`${this.apiUrl}/${id}`, changes).pipe(
      map(res => res.data),
      tap(updatedGroup => {
        this.groups.update((list) =>
          list.map((g) => (g.id === id ? { ...g, ...updatedGroup } : g))
        );
      })
    );
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.groups.update((list) => list.filter((g) => g.id !== id));
      })
    );
  }
}
