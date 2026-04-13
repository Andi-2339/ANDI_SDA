import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-group-users',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './group-users.html',
  styleUrl: './group-users.css',
})
export class GroupUsers implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Group context
  groupId = signal<number>(0);
  groupName = signal('');

  // Data
  users = computed(() => this.userService.getUsersByGroup(this.groupId()));

  // Dialog state
  dialogVisible = signal(false);
  isEditMode = signal(false);
  submitted = signal(false);

  // Form fields
  editId = signal<number | null>(null);
  editUsername = signal('');
  editFullName = signal('');
  editEmail = signal('');
  editPhone = signal('');
  editAddress = signal('');

  // Search
  searchValue = signal('');

  filteredUsers = computed(() => {
    const term = this.searchValue().toLowerCase().trim();
    const list = this.users();
    if (!term) return list;
    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  });

  // Validation
  isFormValid = computed(() => {
    return (
      this.editUsername().trim().length > 0 &&
      !this.editUsername().includes(' ') &&
      this.editFullName().trim().length > 0 &&
      this.editEmail().trim().length > 0 &&
      !this.editEmail().includes(' ') &&
      this.editPhone().trim().length >= 10 &&
      /^\d+$/.test(this.editPhone()) &&
      this.editAddress().trim().length > 0
    );
  });

  // Dialog title
  dialogTitle = computed(() =>
    this.isEditMode() ? 'Editar Usuario' : 'Nuevo Usuario'
  );

  // Permissions
  canAdd = computed(() => this.authService.hasPermission('users', 'add'));
  canEdit = computed(() => this.authService.hasPermission('users', 'edit'));
  canDelete = computed(() => this.authService.hasPermission('users', 'delete'));

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['groupId']) {
        this.groupId.set(+params['groupId']);
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

  editUser(user: User): void {
    this.isEditMode.set(true);
    this.submitted.set(false);
    this.editId.set(user.id);
    this.editUsername.set(user.username);
    this.editFullName.set(user.fullName);
    this.editEmail.set(user.email);
    this.editPhone.set(user.phone);
    this.editAddress.set(user.address);
    this.dialogVisible.set(true);
  }

  confirmDelete(user: User): void {
    this.confirmationService.confirm({
      message: `¿Estas seguro de que deseas eliminar al usuario "${user.fullName}"?`,
      header: 'Confirmar Eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.deleteUser(user.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: `El usuario "${user.fullName}" ha sido eliminado`,
          life: 3000,
        });
      },
    });
  }

  saveUser(): void {
    this.submitted.set(true);
    if (!this.isFormValid()) return;

    if (this.isEditMode()) {
      this.userService.updateUser(this.editId()!, {
        username: this.editUsername().trim(),
        fullName: this.editFullName().trim(),
        email: this.editEmail().trim(),
        phone: this.editPhone().trim(),
        address: this.editAddress().trim(),
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: `El usuario "${this.editFullName().trim()}" ha sido actualizado`,
        life: 3000,
      });
    } else {
      this.userService.addUser({
        username: this.editUsername().trim(),
        fullName: this.editFullName().trim(),
        email: this.editEmail().trim(),
        phone: this.editPhone().trim(),
        address: this.editAddress().trim(),
        groupId: this.groupId(),
        active: true,
        permissions: this.userService.getEmptyPermissions(),
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Creado',
        detail: `El usuario "${this.editFullName().trim()}" ha sido creado`,
        life: 3000,
      });
    }

    this.dialogVisible.set(false);
    this.resetForm();
  }

  hideDialog(): void {
    this.dialogVisible.set(false);
    this.submitted.set(false);
  }

  goBack(): void {
    this.router.navigate(['/groups']);
  }

  // Helpers
  private resetForm(): void {
    this.editId.set(null);
    this.editUsername.set('');
    this.editFullName.set('');
    this.editEmail.set('');
    this.editPhone.set('');
    this.editAddress.set('');
  }

  filterPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
    this.editPhone.set(input.value);
  }
}
