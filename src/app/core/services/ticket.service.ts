import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ticket } from '../models/ticket';
import { ApiResponse } from '../models/permission';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/tickets';

  tickets = signal<Ticket[]>([]);

  // Load all tickets
  loadTickets(): Observable<Ticket[]> {
    return this.http.get<ApiResponse<Ticket[]>>(this.apiUrl).pipe(
      map(res => res.data),
      tap(data => this.tickets.set(data))
    );
  }

  // Group tickets
  getTicketsByGroup(groupId: number): Observable<Ticket[]> {
    return this.http.get<ApiResponse<Ticket[]>>(`${this.apiUrl}/group/${groupId}`).pipe(
      map(res => res.data),
      tap(data => this.tickets.set(data))
    );
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<ApiResponse<Ticket>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  addTicket(ticket: Omit<Ticket, 'id' | 'createdAt'>): Observable<Ticket> {
    return this.http.post<ApiResponse<Ticket>>(this.apiUrl, ticket).pipe(
      map(res => res.data),
      tap(newTicket => {
        this.tickets.update((list) => [...list, newTicket]);
      })
    );
  }

  updateTicket(id: number, changes: Partial<Ticket>): Observable<Ticket> {
    return this.http.put<ApiResponse<Ticket>>(`${this.apiUrl}/${id}`, changes).pipe(
      map(res => res.data),
      tap(updatedTicket => {
        this.tickets.update((list) =>
          list.map((t) => (t.id === id ? { ...t, ...updatedTicket } : t))
        );
      })
    );
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.tickets.update((list) => list.filter((t) => t.id !== id));
      })
    );
  }

  updateTicketStatus(id: number, newStatus: Ticket['estado']): Observable<Ticket> {
    return this.http.patch<ApiResponse<Ticket>>(`${this.apiUrl}/${id}/status`, { estado: newStatus }).pipe(
      map(res => res.data),
      tap(updatedTicket => {
        this.tickets.update((list) =>
          list.map((t) => (t.id === id ? { ...t, ...updatedTicket } : t))
        );
      })
    );
  }
}
