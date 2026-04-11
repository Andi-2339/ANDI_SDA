export type TicketStatus = 'pendiente' | 'en progreso' | 'en revision' | 'finalizado';
export type TicketPriority = 'alta' | 'media' | 'baja';

export interface TicketComment {
  id: number;
  autor: string;
  fecha: string;
  texto: string;
}

export interface TicketChange {
  id: number;
  fecha: string;
  usuario: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
}

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: TicketStatus;
  asignadoA: string;
  prioridad: TicketPriority;
  fechaCreacion: string;
  fechaLimite: string;
  groupId: number;
  comentarios: TicketComment[];
  historialCambios: TicketChange[];
}
