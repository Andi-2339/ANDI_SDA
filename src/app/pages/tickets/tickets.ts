import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TicketService } from '../../core/services/ticket.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Ticket, TicketStatus, TicketPriority } from '../../core/models/ticket';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-tickets',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule,
    SelectModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TabsModule,
    ToggleButtonModule,
    HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit {
  private ticketService = inject(TicketService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Group context
  groupId = signal<number | null>(null);
  groupName = signal('');

  // View mode
  kanbanView = signal(false);

  // Kanban columns
  kanbanStatuses: TicketStatus[] = ['pendiente', 'en progreso', 'en revision', 'finalizado'];

  kanbanColumns = computed(() => {
    const tickets = this.filteredTickets();
    return this.kanbanStatuses.map((status) => ({
      status,
      label: this.getStatusLabel(status),
      tickets: tickets.filter((t) => t.estado === status),
    }));
  });

  // Filters
  filterEstado = signal<TicketStatus | null>(null);
  filterPrioridad = signal<TicketPriority | null>(null);
  filterAsignadoA = signal<string | null>(null);

  estadoFilterOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'pendiente' as TicketStatus },
    { label: 'En progreso', value: 'en progreso' as TicketStatus },
    { label: 'En revision', value: 'en revision' as TicketStatus },
    { label: 'Finalizado', value: 'finalizado' as TicketStatus },
  ];

  prioridadFilterOptions = [
    { label: 'Todas', value: null },
    { label: 'Alta', value: 'alta' as TicketPriority },
    { label: 'Media', value: 'media' as TicketPriority },
    { label: 'Baja', value: 'baja' as TicketPriority },
  ];

  userFilterOptions = computed(() => {
    const names = this.userService.getAllUserNames();
    return [{ label: 'Todos', value: null as string | null }, ...names.map((n) => ({ label: n, value: n as string | null }))];
  });

  // Data
  tickets = this.ticketService.tickets;

  // Dialog state
  dialogVisible = signal(false);
  isEditMode = signal(false);
  submitted = signal(false);
  detailDialogVisible = signal(false);
  selectedTicket = signal<Ticket | null>(null);

  // Form fields
  editId = signal<number | null>(null);
  editTitulo = signal('');
  editDescripcion = signal('');
  editEstado = signal<TicketStatus>('pendiente');
  editAsignadoA = signal('');
  editPrioridad = signal<TicketPriority>('media');
  editFechaCreacion = signal<Date>(new Date());
  editFechaLimite = signal<Date | null>(null);
  editComentarioNuevo = signal('');

  // Options for selects
  estadoOptions = [
    { label: 'Pendiente', value: 'pendiente' as TicketStatus },
    { label: 'En progreso', value: 'en progreso' as TicketStatus },
    { label: 'En revision', value: 'en revision' as TicketStatus },
    { label: 'Finalizado', value: 'finalizado' as TicketStatus },
  ];

  prioridadOptions = [
    { label: 'Alta', value: 'alta' as TicketPriority },
    { label: 'Media', value: 'media' as TicketPriority },
    { label: 'Baja', value: 'baja' as TicketPriority },
  ];

  userOptions = computed(() =>
    this.userService.getAllUserNames().map((name) => ({ label: name, value: name }))
  );

  // Search
  searchValue = signal('');

  filteredTickets = computed(() => {
    const term = this.searchValue().toLowerCase().trim();
    let list = this.tickets();

    // Apply filters
    const estado = this.filterEstado();
    if (estado) {
      list = list.filter((t) => t.estado === estado);
    }

    const prioridad = this.filterPrioridad();
    if (prioridad) {
      list = list.filter((t) => t.prioridad === prioridad);
    }

    const asignado = this.filterAsignadoA();
    if (asignado) {
      list = list.filter((t) => t.asignadoA === asignado);
    }

    if (term) {
      list = list.filter(
        (t) =>
          t.titulo.toLowerCase().includes(term) ||
          t.descripcion.toLowerCase().includes(term) ||
          t.asignadoA.toLowerCase().includes(term) ||
          t.estado.toLowerCase().includes(term) ||
          t.prioridad.toLowerCase().includes(term)
      );
    }

    return list;
  });

  // Validation
  isFormValid = computed(() => {
    return (
      this.editTitulo().trim().length > 0 &&
      this.editDescripcion().trim().length > 0 &&
      this.editAsignadoA().trim().length > 0 &&
      this.editFechaLimite() !== null
    );
  });

  // Dialog title
  dialogTitle = computed(() =>
    this.isEditMode() ? 'Editar Ticket' : 'Nuevo Ticket'
  );

  // Permissions
  canAdd = computed(() => this.authService.hasPermission('tickets', 'add'));
  canEdit = computed(() => this.authService.hasPermission('tickets', 'edit'));
  canDelete = computed(() => this.authService.hasPermission('tickets', 'delete'));

  // Drag & Drop state
  draggedTicket = signal<Ticket | null>(null);
  dragOverColumn = signal<TicketStatus | null>(null);

  // Change history text for detail view
  changeHistoryText = computed(() => {
    const ticket = this.selectedTicket();
    if (!ticket || ticket.historialCambios.length === 0) return '';
    return ticket.historialCambios
      .map((c) => `[${c.fecha}] ${c.usuario} cambio ${c.campo}: "${c.valorAnterior}" -> "${c.valorNuevo}"`)
      .join('\n');
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['groupId']) {
        this.groupId.set(+params['groupId']);
        this.ticketService.getTicketsByGroup(+params['groupId']).subscribe();
      } else {
        this.ticketService.loadTickets().subscribe();
      }
    });
    this.route.queryParams.subscribe((qp) => {
      if (qp['groupName']) {
        this.groupName.set(qp['groupName']);
      }
    });
  }

  openNew(): void {
    this.resetForm();
    this.isEditMode.set(false);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  editTicket(ticket: Ticket): void {
    this.isEditMode.set(true);
    this.submitted.set(false);
    this.editId.set(ticket.id);
    this.editTitulo.set(ticket.titulo);
    this.editDescripcion.set(ticket.descripcion);
    this.editEstado.set(ticket.estado);
    this.editAsignadoA.set(ticket.asignadoA);
    this.editPrioridad.set(ticket.prioridad);
    this.editFechaCreacion.set(new Date(ticket.fechaCreacion));
    this.editFechaLimite.set(new Date(ticket.fechaLimite));
    this.dialogVisible.set(true);
  }

  viewTicketDetail(ticket: Ticket): void {
    this.selectedTicket.set(ticket);
    this.detailDialogVisible.set(true);
  }

  confirmDelete(ticket: Ticket): void {
    this.confirmationService.confirm({
      message: `¿Estas seguro de que deseas eliminar el ticket "${ticket.titulo}"?`,
      header: 'Confirmar Eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.ticketService.deleteTicket(ticket.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: `El ticket "${ticket.titulo}" ha sido eliminado`,
              life: 3000,
            });
          }
        });
      },
    });
  }

  saveTicket(): void {
    this.submitted.set(true);
    if (!this.isFormValid()) return;

    const fechaCreacion = this.formatDate(this.editFechaCreacion());
    const fechaLimite = this.formatDate(this.editFechaLimite()!);
    const currentUser = this.authService.currentUser()?.fullName || 'Sistema';

    if (this.isEditMode()) {
      this.ticketService.updateTicket(
        this.editId()!,
        {
          titulo: this.editTitulo().trim(),
          descripcion: this.editDescripcion().trim(),
          estado: this.editEstado(),
          asignadoA: this.editAsignadoA(),
          prioridad: this.editPrioridad(),
          fechaCreacion,
          fechaLimite,
        }
      ).subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: `El ticket "${this.editTitulo().trim()}" ha sido actualizado`,
          life: 3000,
        });
        this.dialogVisible.set(false);
        this.resetForm();
      });
    } else {
      const groupId = this.groupId() ?? 1;
      this.ticketService.addTicket({
        titulo: this.editTitulo().trim(),
        descripcion: this.editDescripcion().trim(),
        estado: this.editEstado(),
        asignadoA: this.editAsignadoA(),
        prioridad: this.editPrioridad(),
        fechaCreacion,
        fechaLimite,
        groupId,
        comentarios: [],
        historialCambios: [],
      }).subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Creado',
          detail: `El ticket "${this.editTitulo().trim()}" ha sido creado`,
          life: 3000,
        });
        this.dialogVisible.set(false);
        this.resetForm();
      });
    }
  }

  addComment(): void {
    const ticket = this.selectedTicket();
    const text = this.editComentarioNuevo().trim();
    if (!ticket || !text) return;

    const currentUser = this.authService.currentUser()?.fullName || 'Sistema';
    // this.ticketService.addComment(ticket.id, currentUser, text);
    this.editComentarioNuevo.set('');

    // Refresh selected ticket
    const updated = this.ticketService.tickets().find((t) => t.id === ticket.id);
    if (updated) this.selectedTicket.set({ ...updated });

    this.messageService.add({
      severity: 'success',
      summary: 'Comentario agregado',
      detail: 'El comentario ha sido agregado al ticket',
      life: 3000,
    });
  }

  clearFilters(): void {
    this.filterEstado.set(null);
    this.filterPrioridad.set(null);
    this.filterAsignadoA.set(null);
    this.searchValue.set('');
  }

  hideDialog(): void {
    this.dialogVisible.set(false);
    this.submitted.set(false);
  }

  goBack(): void {
    this.router.navigate(['/groups']);
  }

  // Drag & Drop methods
  onDragStart(event: DragEvent, ticket: Ticket): void {
    this.draggedTicket.set(ticket);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(ticket.id));
    }
  }

  onDragEnd(): void {
    this.draggedTicket.set(null);
    this.dragOverColumn.set(null);
  }

  onDragOver(event: DragEvent, status: TicketStatus): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const dragged = this.draggedTicket();
    if (dragged && dragged.estado !== status) {
      this.dragOverColumn.set(status);
    }
  }

  onDragLeave(event: DragEvent, status: TicketStatus): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      if (this.dragOverColumn() === status) {
        this.dragOverColumn.set(null);
      }
    }
  }

  onDrop(event: DragEvent, newStatus: TicketStatus): void {
    event.preventDefault();
    this.dragOverColumn.set(null);

    const ticket = this.draggedTicket();
    if (!ticket || ticket.estado === newStatus) {
      this.draggedTicket.set(null);
      return;
    }

    if (!this.canEdit()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Sin permiso',
        detail: 'No tienes permiso para cambiar el estado de los tickets',
        life: 3000,
      });
      this.draggedTicket.set(null);
      return;
    }

    const currentUser = this.authService.currentUser()?.fullName || 'Sistema';
    this.ticketService.updateTicket(
      ticket.id,
      { estado: newStatus }
    ).subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Estado actualizado',
        detail: `"${ticket.titulo}" movido a ${this.getStatusLabel(newStatus)}`,
        life: 3000,
      });
      this.draggedTicket.set(null);
    });
  }

  // Helpers
  private resetForm(): void {
    this.editId.set(null);
    this.editTitulo.set('');
    this.editDescripcion.set('');
    this.editEstado.set('pendiente');
    this.editAsignadoA.set('');
    this.editPrioridad.set('media');
    this.editFechaCreacion.set(new Date());
    this.editFechaLimite.set(null);
    this.editComentarioNuevo.set('');
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getStatusLabel(status: TicketStatus): string {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'en progreso': return 'En progreso';
      case 'en revision': return 'En revision';
      case 'finalizado': return 'Finalizado';
    }
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (estado) {
      case 'pendiente': return 'warn';
      case 'en progreso': return 'info';
      case 'en revision': return 'secondary';
      case 'finalizado': return 'success';
      default: return 'info';
    }
  }

  getPrioridadSeverity(prioridad: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (prioridad) {
      case 'alta': return 'danger';
      case 'media': return 'warn';
      case 'baja': return 'success';
      default: return 'info';
    }
  }
}
