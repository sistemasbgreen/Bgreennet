import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../authservices';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFor, NgIf, NgForOf } from '@angular/common';
import { timeout } from 'rxjs';

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
  returnUrl: string = '/home';
  error = 1;

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
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
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
 
  onLogin(): void {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }
  this.isLoading = true;
  this.showError = false;
  this.errorMessage = '';
  
  this.authService.login(this.loginForm.value).subscribe({
    next: (response) => {
      console.log('✅ Login exitoso, redirigiendo...');
      this.isLoading = false;
      this.router.navigate([this.returnUrl]);
    },
    error: (err) => {
      this.isLoading = false;
      
      // Establecer el mensaje de error según el tipo
      if (err.status === 401) {
        this.errorMessage = err.error?.error || 'Usuario o contraseña incorrectos';
      } else if (err.status === 500) {
        this.errorMessage = 'Error en el servidor. Por favor, intenta más tarde';
      } else if (err.status === 0) {
        this.errorMessage = 'No se pudo conectar con el servidor';
      } else {
        this.errorMessage = err.error?.error || 'Error al iniciar sesión';
      }
      
      // Mostrar el error
      this.showError = true;
      
      // Ocultar automáticamente después de 3 segundos
      setTimeout(() => {
        this.showError = false;
        this.errorMessage = '';
      }, 3000);
    }
  });
}

}
