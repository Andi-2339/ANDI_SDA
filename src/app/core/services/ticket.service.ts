import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ticket } from '../models/ticket';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/tickets';

  tickets = signal<Ticket[]>([]);

  // Load all tickets
  loadTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl).pipe(
      tap(data => this.tickets.set(data))
    );
  }

  // Group tickets
  getTicketsByGroup(groupId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/group/${groupId}`).pipe(
      tap(data => this.tickets.set(data))
    );
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  addTicket(ticket: Omit<Ticket, 'id' | 'createdAt'>): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, ticket).pipe(
      tap(newTicket => {
        this.tickets.update((list) => [...list, newTicket]);
      })
    );
  }

  updateTicket(id: number, changes: Partial<Ticket>): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}`, changes).pipe(
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
    return this.updateTicket(id, { estado: newStatus });
  }
}
