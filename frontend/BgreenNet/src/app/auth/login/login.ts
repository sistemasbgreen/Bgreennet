import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../authservices';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFor, NgIf, NgForOf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule, NgIf, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string = '';
  showPassword = false;
  showError = false;
  errorType: 'error' | 'warning' | 'info' = 'error';
  returnUrl: string = '/home';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]]
    });

    const rawReturnUrl = this.route.snapshot.queryParams['returnUrl'];
    this.returnUrl = rawReturnUrl ? decodeURIComponent(rawReturnUrl) : '/home';
  }

  get usuario() {
    return this.loginForm.get('usuario');
  }

  get contrasena() {
    return this.loginForm.get('contrasena');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private showAlert(message: string, type: 'error' | 'warning' | 'info' = 'error', duration: number = 4000): void {
    this.errorMessage = message;
    this.errorType = type;
    this.showError = true;

    setTimeout(() => {
      this.showError = false;
    }, duration);
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.showAlert('Por favor, completa todos los campos correctamente', 'warning');
      return;
    }

    this.isLoading = true;
    this.showError = false;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login exitoso, redirigiendo...');
        this.isLoading = false;
        this.showAlert('¡Inicio de sesión exitoso!', 'info', 1500);
        
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 1000);
      },
      error: (err) => {
        this.isLoading = false;
        let message = '';
        let type: 'error' | 'warning' = 'error';

        // Manejo específico de errores
        switch (err.status) {
          case 401:
            message = '❌ Usuario o contraseña incorrectos';
            type = 'warning';
            // Limpiar solo el campo de contraseña
            this.loginForm.patchValue({ contrasena: '' });
            break;
          
          case 404:
            message = '⚠️ Usuario no encontrado';
            type = 'warning';
            // Marcar el campo de usuario como con error
            this.loginForm.get('usuario')?.setErrors({ 'notFound': true });
            break;
          
          case 500:
            message = '🔧 Error en el servidor. Por favor, intenta más tarde';
            type = 'error';
            break;
          
          case 503:
            message = '🔌 Servicio no disponible. Intenta más tarde';
            type = 'error';
            break;
          
          case 0:
            message = '🌐 No se pudo conectar con el servidor. Verifica tu conexión';
            type = 'error';
            break;
          
          case 429:
            message = '⏰ Demasiados intentos. Por favor, espera un momento';
            type = 'warning';
            break;
          
          default:
            message = err.error?.error || err.error?.message || '❗ Error al iniciar sesión';
            type = 'error';
        }

        this.showAlert(message, type, 5000);
      }
    });
  }
}