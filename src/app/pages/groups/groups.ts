import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Group } from '../../core/models/group';
import { AuthService } from '../../core/services/auth.service';
import { GroupService } from '../../core/services/group.service';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { OnInit } from '@angular/core';
@Component({
  selector: 'app-groups',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './groups.html',
  styleUrl: './groups.css',
})
export class Groups implements OnInit {
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);
  private groupService = inject(GroupService);
  private router = inject(Router);

  // --- Permissions ---
  canAdd = computed(() => this.authService.hasPermission('groups', 'add'));
  canEdit = computed(() => this.authService.hasPermission('groups', 'edit'));
  canDelete = computed(() => this.authService.hasPermission('groups', 'delete'));

  ngOnInit() {
    this.groupService.loadGroups().subscribe();
  }

  // --- Data (from service) ---
  groups = this.groupService.groups;

  // --- Dialog state ---
  dialogVisible = signal(false);
  deleteDialogVisible = signal(false);
  isEditMode = signal(false);
  submitted = signal(false);

  // --- Form fields (bound to dialog) ---
  editId = signal<number | null>(null);
  editNivel = signal('');
  editAutor = signal('');
  editNombre = signal('');
  editIntegrantes = signal<number | null>(null);
  editTickets = signal<number | null>(null);
  editDescripcion = signal('');

  // --- Group pending deletion ---
  groupToDelete = signal<Group | null>(null);

  // --- Search ---
  searchValue = signal('');

  // --- Filtered data ---
  filteredGroups = computed(() => {
    const term = this.searchValue().toLowerCase().trim();
    if (!term) return this.groups();
    return this.groups().filter(
      (g) =>
        g.nombre.toLowerCase().includes(term) ||
        g.autor.toLowerCase().includes(term) ||
        g.nivel.toLowerCase().includes(term) ||
        g.descripcion.toLowerCase().includes(term)
    );
  });

  // --- Validation ---
  isFormValid = computed(() => {
    return (
      this.editNivel().trim().length > 0 &&
      this.editAutor().trim().length > 0 &&
      this.editNombre().trim().length > 0 &&
      this.editIntegrantes() !== null &&
      this.editIntegrantes()! >= 0 &&
      this.editTickets() !== null &&
      this.editTickets()! >= 0 &&
      this.editDescripcion().trim().length > 0
    );
  });

  // --- Dialog title ---
  dialogTitle = computed(() =>
    this.isEditMode() ? 'Editar Grupo' : 'Nuevo Grupo'
  );

  // --- Actions ---
  openNew(): void {
    this.resetForm();
    this.isEditMode.set(false);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  editGroup(group: Group): void {
    this.isEditMode.set(true);
    this.submitted.set(false);
    this.editId.set(group.id);
    this.editNivel.set(group.nivel);
    this.editAutor.set(group.autor);
    this.editNombre.set(group.nombre);
    this.editIntegrantes.set(group.integrantes);
    this.editTickets.set(group.tickets);
    this.editDescripcion.set(group.descripcion);
    this.dialogVisible.set(true);
  }

  confirmDelete(group: Group): void {
    this.groupToDelete.set(group);
    this.confirmationService.confirm({
      message: `¿Estas seguro de que deseas eliminar el grupo "${group.nombre}"?`,
      header: 'Confirmar Eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteGroup(group);
      },
    });
  }

  deleteGroup(group: Group): void {
    this.groupService.deleteGroup(group.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: `El grupo "${group.nombre}" ha sido eliminado`,
          life: 3000,
        });
        this.groupToDelete.set(null);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
      }
    });
  }

  saveGroup(): void {
    this.submitted.set(true);

    if (!this.isFormValid()) return;

    if (this.isEditMode()) {
      // Update
      const id = this.editId()!;
      this.groupService.updateGroup(id, {
        nivel: this.editNivel().trim(),
        autor: this.editAutor().trim(),
        nombre: this.editNombre().trim(),
        integrantes: this.editIntegrantes()!,
        tickets: this.editTickets()!,
        descripcion: this.editDescripcion().trim(),
      }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: `El grupo "${this.editNombre().trim()}" ha sido actualizado`,
            life: 3000,
          });
          this.dialogVisible.set(false);
          this.resetForm();
        }
      });
    } else {
      // Create
      this.groupService.addGroup({
        nivel: this.editNivel().trim(),
        autor: this.editAutor().trim(),
        nombre: this.editNombre().trim(),
        integrantes: this.editIntegrantes()!,
        tickets: this.editTickets()!,
        descripcion: this.editDescripcion().trim(),
      }).subscribe({
        next: (newGroup) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Creado',
            detail: `El grupo "${newGroup.nombre}" ha sido creado`,
            life: 3000,
          });
          this.dialogVisible.set(false);
          this.resetForm();
        }
      });
    }
  }

  hideDialog(): void {
    this.dialogVisible.set(false);
    this.submitted.set(false);
  }

  // --- Navigation ---
  goToUsers(group: Group): void {
    this.router.navigate(['/groups', group.id, 'users'], {
      queryParams: { groupName: group.nombre },
    });
  }

  goToTicketDashboard(group: Group): void {
    this.router.navigate(['/ticket-dashboard', group.id], {
      queryParams: { groupName: group.nombre },
    });
  }

  // --- Helpers ---
  private resetForm(): void {
    this.editId.set(null);
    this.editNivel.set('');
    this.editAutor.set('');
    this.editNombre.set('');
    this.editIntegrantes.set(null);
    this.editTickets.set(null);
    this.editDescripcion.set('');
  }

  getNivelSeverity(nivel: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (nivel.toLowerCase()) {
      case 'alto':
        return 'danger';
      case 'medio':
        return 'warn';
      case 'bajo':
        return 'success';
      default:
        return 'info';
    }
  }
}
