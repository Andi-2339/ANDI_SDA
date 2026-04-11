import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';
import { PermissionModule, PermissionAction, RolePermissions } from '../../core/models/permission';
import { GroupService } from '../../core/services/group.service';

@Component({
  selector: 'app-admin-users',
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
    CheckboxModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private groupService = inject(GroupService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Search
  searchValue = signal('');

  // Dialog state
  dialogVisible = signal(false);
  isEditMode = signal(false);
  submitted = signal(false);

  // Permissions dialog state
  permissionsDialogVisible = signal(false);
  permissionsUserId = signal<number | null>(null);
  permissionsUserName = signal('');
  editPermissions = signal<RolePermissions>({
    groups: { view: false, add: false, edit: false, delete: false },
    users: { view: false, add: false, edit: false, delete: false },
    tickets: { view: false, add: false, edit: false, delete: false },
  });

  // Permission config for template iteration
  permissionModules: { key: PermissionModule; label: string; icon: string }[] = [
    { key: 'groups', label: 'Grupos', icon: 'pi pi-sitemap' },
    { key: 'users', label: 'Usuarios', icon: 'pi pi-users' },
    { key: 'tickets', label: 'Tickets', icon: 'pi pi-ticket' },
  ];

  permissionActions: { key: PermissionAction; label: string }[] = [
    { key: 'view', label: 'Ver' },
    { key: 'add', label: 'Agregar' },
    { key: 'edit', label: 'Editar' },
    { key: 'delete', label: 'Eliminar' },
    { key: 'manage', label: 'Gestionar' },
  ];

  // Identificar si el usuario actual es Super Admin (puede gestionar permisos)
  canManageRoles = computed(() => {
    const currentUser = this.authService.currentUser();
    return currentUser?.permissions?.users?.manage === true;
  });

  ngOnInit(): void {
    this.userService.loadUsers().subscribe();
    this.groupService.loadGroups().subscribe();
  }

  // Form fields
  editId = signal<number | null>(null);
  editUsername = signal('');
  editFullName = signal('');
  editEmail = signal('');
  editPhone = signal('');
  editAddress = signal('');
  editGroupId = signal<number>(1);
  editActive = signal(true);

  // Options
  activeOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  groupOptions = computed(() => {
    return this.groupService.groups().map((g) => ({
      label: g.nombre,
      value: g.id,
    }));
  });

  // Data
  users = this.userService.users;

  filteredUsers = computed(() => {
    const term = this.searchValue().toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  });

  // Validation
  isFormValid = computed(() => {
    return (
      this.editUsername().trim().length > 0 &&
      this.editFullName().trim().length > 0 &&
      this.editEmail().trim().length > 0 &&
      this.editPhone().trim().length > 0 &&
      this.editAddress().trim().length > 0
    );
  });

  dialogTitle = computed(() =>
    this.isEditMode() ? 'Editar Usuario' : 'Nuevo Usuario'
  );

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
    this.editGroupId.set(user.groupId);
    this.editActive.set(user.active);
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
        groupId: this.editGroupId(),
        active: this.editActive(),
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
        groupId: this.editGroupId(),
        active: this.editActive(),
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

  // Permissions dialog
  openPermissions(user: User): void {
    this.permissionsUserId.set(user.id);
    this.permissionsUserName.set(user.fullName);
    this.editPermissions.set({
      groups: { ...user.permissions.groups },
      users: { ...user.permissions.users },
      tickets: { ...user.permissions.tickets },
    });
    this.permissionsDialogVisible.set(true);
  }

  getPermission(module: PermissionModule, action: PermissionAction): boolean {
    const value = this.editPermissions()[module][action];
    return value === true; // Asegura que siempre devuelva un booleano puro
  }

  setPermission(module: PermissionModule, action: PermissionAction, value: boolean): void {
    this.editPermissions.update((perms) => ({
      ...perms,
      [module]: {
        ...perms[module],
        [action]: value,
      },
    }));
  }

  savePermissions(): void {
    const userId = this.permissionsUserId();
    if (!userId) return;
    this.userService.updateUser(userId, {
      permissions: {
        groups: { ...this.editPermissions().groups },
        users: { ...this.editPermissions().users },
        tickets: { ...this.editPermissions().tickets },
      },
    });
    this.permissionsDialogVisible.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Permisos actualizados',
      detail: `Los permisos de "${this.permissionsUserName()}" han sido actualizados`,
      life: 3000,
    });
  }

  hidePermissionsDialog(): void {
    this.permissionsDialogVisible.set(false);
  }

  private resetForm(): void {
    this.editId.set(null);
    this.editUsername.set('');
    this.editFullName.set('');
    this.editEmail.set('');
    this.editPhone.set('');
    this.editAddress.set('');
    this.editGroupId.set(1);
    this.editActive.set(true);
  }
}
