import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TicketService } from '../../core/services/ticket.service';
import { UserService } from '../../core/services/user.service';
import { GroupService } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth.service';
import { Ticket, TicketStatus, TicketPriority } from '../../core/models/ticket';
import { Group } from '../../core/models/group';
@Component({
  selector: 'app-ticket-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    SelectModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TooltipModule,
    CardModule,
    ChartModule,
  ],
  templateUrl: './ticket-dashboard.html',
  styleUrl: './ticket-dashboard.css',
})
export class TicketDashboard implements OnInit {
  private ticketService = inject(TicketService);
  private userService = inject(UserService);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Group context
  groupId = signal<number | null>(null);
  groupName = signal('');

  // Filters
  filterUser = signal<string | null>(null);
  filterGroup = signal<number | null>(null);
  filterStatus = signal<TicketStatus | null>(null);
  filterPriority = signal<TicketPriority | null>(null);
  filterFechaCreacionDesde = signal<Date | null>(null);
  filterFechaCreacionHasta = signal<Date | null>(null);
  filterFechaLimiteDesde = signal<Date | null>(null);
  filterFechaLimiteHasta = signal<Date | null>(null);
  searchValue = signal('');

  // Options
  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'pendiente' as TicketStatus },
    { label: 'En progreso', value: 'en progreso' as TicketStatus },
    { label: 'En revision', value: 'en revision' as TicketStatus },
    { label: 'Finalizado', value: 'finalizado' as TicketStatus },
  ];

  priorityOptions = [
    { label: 'Todas', value: null },
    { label: 'Alta', value: 'alta' as TicketPriority },
    { label: 'Media', value: 'media' as TicketPriority },
    { label: 'Baja', value: 'baja' as TicketPriority },
  ];

  userOptions = computed(() => {
    const names = this.userService.getAllUserNames();
    return [{ label: 'Todos', value: null }, ...names.map((n) => ({ label: n, value: n }))];
  });

  groupOptions = computed(() => {
    return this.groupService.groups().map((g: Group) => ({
      label: g.nombre,
      value: g.id,
    }));
  });

  myWorkspaces = computed(() => {
    const user = this.authService.currentUser();
    return user?.memberships || [];
  });

  activeGlobalGroup = computed(() => this.authService.currentUser()?.activeGroupId);


  // All tickets
  private allTickets = this.ticketService.tickets;

  // Filtered tickets
  filteredTickets = computed(() => {
    let list = this.allTickets();

    // Filter by user
    const user = this.filterUser();
    if (user) {
      list = list.filter((t) => t.asignadoA === user);
    }

    // Filter by group logic
    const activeGlobalGroup = this.authService.currentUser()?.activeGroupId;
    const groupFilter = this.filterGroup();
    const urlGroup = this.groupId();

    if (urlGroup !== null) {
      list = list.filter((t) => t.groupId === urlGroup);
    } else if (groupFilter !== null) {
      list = list.filter((t) => t.groupId === groupFilter);
    } else if (activeGlobalGroup) {
      list = list.filter((t) => t.groupId === activeGlobalGroup);
    }

    // Filter by status
    const status = this.filterStatus();
    if (status) {
      list = list.filter((t) => t.estado === status);
    }

    // Filter by priority
    const priority = this.filterPriority();
    if (priority) {
      list = list.filter((t) => t.prioridad === priority);
    }

    // Filter by creation date range
    const fcDesde = this.filterFechaCreacionDesde();
    if (fcDesde) {
      const desde = this.formatDateStr(fcDesde);
      list = list.filter((t) => t.fechaCreacion >= desde);
    }
    const fcHasta = this.filterFechaCreacionHasta();
    if (fcHasta) {
      const hasta = this.formatDateStr(fcHasta);
      list = list.filter((t) => t.fechaCreacion <= hasta);
    }

    // Filter by deadline date range
    const flDesde = this.filterFechaLimiteDesde();
    if (flDesde) {
      const desde = this.formatDateStr(flDesde);
      list = list.filter((t) => t.fechaLimite >= desde);
    }
    const flHasta = this.filterFechaLimiteHasta();
    if (flHasta) {
      const hasta = this.formatDateStr(flHasta);
      list = list.filter((t) => t.fechaLimite <= hasta);
    }

    // Search text
    const term = this.searchValue().toLowerCase().trim();
    if (term) {
      list = list.filter(
        (t) =>
          t.titulo.toLowerCase().includes(term) ||
          t.descripcion.toLowerCase().includes(term) ||
          t.asignadoA.toLowerCase().includes(term)
      );
    }

    return list;
  });

  // Summary stats
  totalTickets = computed(() => this.filteredTickets().length);
  pendientes = computed(() => this.filteredTickets().filter((t) => t.estado === 'pendiente').length);
  enProgreso = computed(() => this.filteredTickets().filter((t) => t.estado === 'en progreso').length);
  enRevision = computed(() => this.filteredTickets().filter((t) => t.estado === 'en revision').length);
  finalizados = computed(() => this.filteredTickets().filter((t) => t.estado === 'finalizado').length);
  prioridadAlta = computed(() => this.filteredTickets().filter((t) => t.prioridad === 'alta').length);

  // Chart Data
  statusChartData: any;
  statusChartOptions: any;
  priorityChartData: any;
  priorityChartOptions: any;
  groupDistributionData: any;
  groupDistributionOptions: any;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['groupId'] ? +params['groupId'] : null;
      if (id) {
        this.groupId.set(id);
        this.ticketService.getTicketsByGroup(id).subscribe(() => this.initCharts());
      } else {
        this.ticketService.loadTickets().subscribe(() => this.initCharts());
      }
    });
    this.route.queryParams.subscribe((qp) => {
      if (qp['groupName']) {
        this.groupName.set(qp['groupName']);
      }
    });
  }

  initCharts(): void {
    // Colores para el tema claro del Dashboard
    const textColor = '#334155';
    const textColorSecondary = '#64748b';
    const surfaceBorder = '#e2e8f0';

    // Status Chart (Bar)
    this.statusChartData = {
      labels: ['Pendiente', 'En progreso', 'En revisión', 'Finalizado'],
      datasets: [
        {
          label: 'Tickets por Estado',
          data: [this.pendientes(), this.enProgreso(), this.enRevision(), this.finalizados()],
          backgroundColor: ['#f59e0b', '#3b82f6', '#94a3b8', '#22c55e'],
          borderRadius: 8
        }
      ]
    };

    this.statusChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: { labels: { color: textColor, font: { weight: '600' } } }
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary, font: { weight: '500' } },
          grid: { color: surfaceBorder, drawBorder: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false }
        }
      }
    };

    // Priority Chart (Pie)
    this.priorityChartData = {
      labels: ['Alta', 'Media', 'Baja'],
      datasets: [
        {
          data: [
            this.filteredTickets().filter(t => t.prioridad === 'alta').length,
            this.filteredTickets().filter(t => t.prioridad === 'media').length,
            this.filteredTickets().filter(t => t.prioridad === 'baja').length
          ],
          backgroundColor: ['#ef4444', '#f59e0b', '#22c55e']
        }
      ]
    };

    this.priorityChartOptions = {
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, font: { weight: '600' } } }
      }
    };

    // Group Distribution Chart (Doughnut)
    const memberships = this.myWorkspaces();
    const allTickets = this.ticketService.tickets();

    const groupLabels = memberships.map(m => m.groups?.nombre || `Grupo ${m.group_id}`);
    const groupData = memberships.map(m => allTickets.filter(t => t.groupId === m.group_id).length);

    this.groupDistributionData = {
      labels: groupLabels,
      datasets: [
        {
          data: groupData,
          backgroundColor: [
            '#6366f1', '#8b5cf6', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444'
          ],
          hoverBackgroundColor: [
            '#4f46e5', '#7c3aed', '#2563eb', '#d97706', '#16a34a', '#dc2626'
          ]
        }
      ]
    };

    this.groupDistributionOptions = {
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, font: { weight: '600' } } }
      }
    };
  }

  clearFilters(): void {
    this.filterUser.set(null);
    this.filterGroup.set(null);
    this.filterStatus.set(null);
    this.filterPriority.set(null);
    this.filterFechaCreacionDesde.set(null);
    this.filterFechaCreacionHasta.set(null);
    this.filterFechaLimiteDesde.set(null);
    this.filterFechaLimiteHasta.set(null);
    this.searchValue.set('');
  }

  goBack(): void {
    this.router.navigate(['/groups']);
  }

  selectWorkspace(groupId: number): void {
    this.authService.setActiveGroup(groupId);
    // Charts will update automatically due to computed signals
  }

  goToTickets(groupId?: number): void {
    if (groupId) {
      this.router.navigate(['/tickets', groupId]);
    } else {
      this.router.navigate(['/tickets']);
    }
  }

  // Helpers
  private formatDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
