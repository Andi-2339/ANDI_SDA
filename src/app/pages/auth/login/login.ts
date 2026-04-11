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
        if (err.status === 401) {
          this.errorMessage.set('Credenciales invalidas. Verifica tu contraseña.');
          this.messageService.add({
            severity: 'error',
            summary: 'Acceso denegado',
            detail: 'Correo o contraseña incorrectos',
            life: 3000
          });
        } else {
          this.errorMessage.set('Error en el servidor al intentar iniciar sesion.');
          this.messageService.add({
            severity: 'error',
            summary: 'Error de servidor',
            detail: 'No se pudo conectar al API',
            life: 3000
          });
        }
        console.error(err);
      }
    });
  }
}
