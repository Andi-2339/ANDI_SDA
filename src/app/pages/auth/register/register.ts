import { Component, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-register',
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    DividerModule,
    MessageModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  // Simbolos especiales permitidos
  private readonly SPECIAL_CHARS = '!@#$%^&*';
  
  // Campos del formulario
  username = signal('');
  fullName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  phone = signal('');
  address = signal('');
  isAdult = signal(false);
  acceptTerms = signal(false);

  // Validaciones computadas
  usernameError = computed(() => {
    const val = this.username();
    if (val.length > 0 && /\s/.test(val)) {
      return 'El usuario no puede contener espacios en blanco';
    }
    return '';
  });

  fullNameError = computed(() => {
    const val = this.fullName();
    if (val.length > 0 && /\s{2,}/.test(val)) {
      return 'El nombre no puede contener dos espacios seguidos';
    }
    return '';
  });

  emailError = computed(() => {
    const val = this.email();
    if (val.length > 0 && /\s/.test(val)) {
      return 'El correo no puede contener espacios en blanco';
    }
    return '';
  });

  passwordErrors = computed(() => {
    const errors: string[] = [];
    const pwd = this.password();

    if (pwd.length > 0 && /\s/.test(pwd)) {
      errors.push('La contrasena no puede contener espacios en blanco');
    }

    if (pwd.length > 0 && pwd.length < 10) {
      errors.push('La contrasena debe tener al menos 10 caracteres');
    }

    if (pwd.length > 0 && !this.hasSpecialChar(pwd)) {
      errors.push(`Debe incluir al menos un simbolo especial (${this.SPECIAL_CHARS})`);
    }

    return errors;
  });

  passwordsMatch = computed(() => {
    const pwd = this.password();
    const confirm = this.confirmPassword();
    return pwd.length > 0 && confirm.length > 0 && pwd === confirm;
  });

  passwordsDontMatch = computed(() => {
    const confirm = this.confirmPassword();
    return confirm.length > 0 && !this.passwordsMatch();
  });

  phoneError = computed(() => {
    const phone = this.phone();
    if (phone.length > 0 && !/^\d+$/.test(phone)) {
      return 'El telefono solo debe contener numeros';
    }
    if (phone.length > 0 && phone.length !== 10) {
      return 'El telefono debe tener exactamente 10 digitos';
    }
    return '';
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
    private http: HttpClient,
    private router: Router
  ) {}

  private hasSpecialChar(str: string): boolean {
    return this.SPECIAL_CHARS.split('').some(char => str.includes(char));
  }

  onRegister(): void {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Formulario invalido',
        detail: 'Por favor completa todos los campos correctamente',
        life: 3000
      });
      return;
    }

    // Usamos el endpoint público /auth/register para nuevos usuarios
    this.http.post('http://localhost:3000/auth/register', {
      username: this.username(),
      fullName: this.fullName(),
      email: this.email(),
      password: this.password(),
      phone: this.phone(),
      address: this.address()
    }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Tu cuenta ha sido creada correctamente',
          life: 3000
        });
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo completar el registro: ' + (err.error?.error || 'Error desconocido'),
          life: 3000
        });
      }
    });
  }
}
