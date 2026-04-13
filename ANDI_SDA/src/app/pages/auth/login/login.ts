import { Component, signal, inject } from '@angular/core';
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
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  errorMessage = signal('');
  loading = signal(false);

  credentialsHint = this.authService.getCredentialsHint();
  logoClickCount = 0;

  onLogoClick(): void {
    this.logoClickCount++;
    console.log('Logo clicks:', this.logoClickCount);
    if (this.logoClickCount >= 5) {
      alert('catch u');
      this.logoClickCount = 0; // Reset
    }
  }

  onLogin(): void {
    this.errorMessage.set('');

    // Validar campos vacios
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Por favor completa todos los campos');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor completa todos los campos',
        life: 3000
      });
      return;
    }

    // Validar credenciales via AuthService
    this.loading.set(true);
    this.authService.login(this.email(), this.password()).subscribe({
      next: (user) => {
        this.loading.set(false);
        if (user) {
          this.messageService.add({
            severity: 'success',
            summary: 'Exito',
            detail: 'Inicio de sesion exitoso',
            life: 3000
          });

          console.log('Login exitoso:', {
            email: this.email(),
            rememberMe: this.rememberMe(),
          });

          // Redirigir al dashboard de grupos despues de login exitoso
          setTimeout(() => {
            this.router.navigate(['/groups']);
          }, 1500);
        } else {
          this.errorMessage.set('Credenciales invalidas. Usa las credenciales de prueba.');
          this.messageService.add({
            severity: 'error',
            summary: 'Error de autenticacion',
            detail: 'Credenciales invalidas',
            life: 3000
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Login error detail:', err);
        
        const errorData = err.error?.data;
        const errorMessage = errorData?.message || err.error?.message || err.error?.error || 'Error de conexión o servidor';

        if (err.status === 401) {
          this.errorMessage.set(errorMessage);
          this.messageService.add({
            severity: 'error',
            summary: 'Acceso denegado',
            detail: errorMessage,
            life: 3000
          });
        } else {
          this.errorMessage.set(errorMessage);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 3000
          });
        }
      }
    });
  }
}
