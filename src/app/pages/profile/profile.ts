import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { Ticket } from '../../core/models/ticket';

@Component({
  selector: 'app-profile',
  imports: [
    FormsModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    ButtonModule,
    ToastModule,
    MessageModule,
    ConfirmDialogModule,
    TagModule,
    TableModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly SPECIAL_CHARS = '!@#$%^&*';
  private authService = inject(AuthService);
  private ticketService = inject(TicketService);

  // --- Tickets assigned to current user ---
  assignedTickets = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.ticketService.tickets().filter(
      (t) => t.asignadoA === user.fullName
    );
  });

  // --- Datos de perfil (simulados) ---
  username = signal('admin');
  fullName = signal('Administrador ERP');
  email = signal('admin@erp.com');
  phone = signal('1234567890');
  address = signal('Calle Principal 123, Ciudad');
  password = signal('Admin@2025!');
  confirmPassword = signal('Admin@2025!');
  isAdult = signal(true);
  acceptTerms = signal(true);

  // --- Backup para cancelar edicion ---
  private backup = {
    username: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    isAdult: false,
    acceptTerms: false,
  };

  // --- Estado de UI ---
  editing = signal(false);
  deleted = signal(false);

  // --- Validaciones (identicas al registro) ---
  usernameError = computed(() => {
    if (!this.editing()) return '';
    const val = this.username();
    if (val.trim().length === 0) return 'El usuario es requerido';
    if (/\s/.test(val)) return 'El usuario no puede contener espacios en blanco';
    return '';
  });

  fullNameError = computed(() => {
    if (!this.editing()) return '';
    const val = this.fullName();
    if (val.trim().length === 0) return 'El nombre completo es requerido';
    if (/\s{2,}/.test(val)) return 'El nombre no puede contener dos espacios seguidos';
    return '';
  });

  emailError = computed(() => {
    if (!this.editing()) return '';
    const val = this.email();
    if (val.trim().length === 0) return 'El correo es requerido';
    if (/\s/.test(val)) return 'El correo no puede contener espacios en blanco';
    return '';
  });

  phoneError = computed(() => {
    if (!this.editing()) return '';
    const phone = this.phone();
    if (phone.trim().length === 0) return 'El telefono es requerido';
    if (!/^\d+$/.test(phone)) return 'El telefono solo debe contener numeros';
    if (phone.length !== 10) return 'El telefono debe tener exactamente 10 digitos';
    return '';
  });

  addressError = computed(() => {
    if (!this.editing()) return '';
    const val = this.address();
    if (val.trim().length === 0) return 'La direccion es requerida';
    return '';
  });

  passwordErrors = computed(() => {
    if (!this.editing()) return [];
    const errors: string[] = [];
    const pwd = this.password();
    if (pwd.length === 0) {
      errors.push('La contrasena es requerida');
      return errors;
    }
    if (/\s/.test(pwd)) errors.push('La contrasena no puede contener espacios en blanco');
    if (pwd.length < 10) errors.push('La contrasena debe tener al menos 10 caracteres');
    if (!this.hasSpecialChar(pwd))
      errors.push(`Debe incluir al menos un simbolo especial (${this.SPECIAL_CHARS})`);
    return errors;
  });

  passwordsMatch = computed(() => {
    const pwd = this.password();
    const confirm = this.confirmPassword();
    return pwd.length > 0 && confirm.length > 0 && pwd === confirm;
  });

  passwordsDontMatch = computed(() => {
    if (!this.editing()) return false;
    const confirm = this.confirmPassword();
    return confirm.length > 0 && !this.passwordsMatch();
  });

  isFormValid = computed(() => {
    const user = this.username();
    const name = this.fullName();
    const mail = this.email();
    const pwd = this.password();
    const phone = this.phone();

    return (
      user.trim().length > 0 &&
      !/\s/.test(user) &&
      name.trim().length > 0 &&
      !/\s{2,}/.test(name) &&
      mail.trim().length > 0 &&
      !/\s/.test(mail) &&
      pwd.length >= 10 &&
      !/\s/.test(pwd) &&
      this.hasSpecialChar(pwd) &&
      this.passwordsMatch() &&
      /^\d{10}$/.test(phone) &&
      this.address().trim().length > 0 &&
      this.isAdult() &&
      this.acceptTerms()
    );
  });

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  private hasSpecialChar(str: string): boolean {
    return this.SPECIAL_CHARS.split('').some((char) => str.includes(char));
  }

  // --- Acciones ---
  startEdit(): void {
    this.backup = {
      username: this.username(),
      fullName: this.fullName(),
      email: this.email(),
      phone: this.phone(),
      address: this.address(),
      password: this.password(),
      confirmPassword: this.confirmPassword(),
      isAdult: this.isAdult(),
      acceptTerms: this.acceptTerms(),
    };
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.username.set(this.backup.username);
    this.fullName.set(this.backup.fullName);
    this.email.set(this.backup.email);
    this.phone.set(this.backup.phone);
    this.address.set(this.backup.address);
    this.password.set(this.backup.password);
    this.confirmPassword.set(this.backup.confirmPassword);
    this.isAdult.set(this.backup.isAdult);
    this.acceptTerms.set(this.backup.acceptTerms);
    this.editing.set(false);
  }

  saveProfile(): void {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Formulario invalido',
        detail: 'Corrige los errores antes de guardar',
        life: 3000,
      });
      return;
    }

    this.editing.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Perfil actualizado',
      detail: 'Los cambios han sido guardados correctamente',
      life: 3000,
    });
  }

  confirmDelete(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas desactivar tu cuenta? Esta acción marcará tu perfil como eliminado.',
      header: 'Confirmar Desactivacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleted.set(true);
        this.editing.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Cuenta desactivada',
          detail: 'Tu cuenta ha sido marcada como eliminada',
          life: 3000,
        });
      },
    });
  }

  restoreAccount(): void {
    this.deleted.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Cuenta restaurada',
      detail: 'Tu cuenta ha sido reactivada correctamente',
      life: 3000,
    });
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
