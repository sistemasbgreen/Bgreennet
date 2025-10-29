import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../authservices';
import { Router } from '@angular/router';
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
  errorMessage = '';
  showPassword = false;

  //credentials: LoginRequest = { usuario: '', contrasena: '' };
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]]
    });
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
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        alert("Bienvenido a BgreenNet")
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;

        this.errorMessage = err.error?.message || 'Credenciales incorrectas. Por favor, intenta de nuevo.';
        console.error('Error en login:', err);
        alert('Credenciales incorrectas. Por favor, intenta de nuevo.')
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }



  /*
    onLogin(): void {
      this.authService.login(this.credentials).subscribe({
        next: () => {
          alert('Acceso Correcto');
        },
        error: (err) => {
          alert('Credenciales incorrectas');
          console.error(err);
        }
      });
    }
      */


}
