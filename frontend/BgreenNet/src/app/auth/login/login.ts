import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../authservices';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFor, NgIf, NgForOf } from '@angular/common';
import { timeout } from 'rxjs';
import Swal from 'sweetalert2';
import { ListasService } from '../../servicios/listasServices';

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

  imagenes: string[] = [];

  imagenAleatoria: string = ''; // Empezamos vacío para detectar si la API carga algo

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private listasService: ListasService
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
        console.log(' Login exitoso, redirigiendo...');
        this.isLoading = false;
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        this.isLoading = false;
        
        // Limpiar el campo de contraseña
        this.loginForm.get('contrasena')?.setValue('');
        this.loginForm.get('contrasena')?.markAsPristine();
        this.loginForm.get('contrasena')?.markAsUntouched();

        if (err.status === 401) {
          this.errorMessage = err.error?.error || 'Usuario o contraseña incorrectos';
        } else if (err.status === 500) {
          this.errorMessage = 'Error en el servidor. Por favor, intenta más tarde';
        } else if (err.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor';
        } else {
          this.errorMessage = err.error?.error || 'Error al iniciar sesión';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error de Autenticación',
          text: this.errorMessage,
          confirmButtonColor: '#006c2c',
          timer: 3000
        });
      }
    });
  }

  ngOnInit(): void {
    console.log('--- Iniciando carga de imágenes de login ---');
    this.listasService.getImagenesLogin().subscribe({
      next: (images) => {
        console.log('API Response (Imágenes activas):', images);
        this.imagenes = images.map(img => img.url);
        
        if (this.imagenes.length > 0) {
          this.imagenAleatoria = this.obtenerImagenAleatoria();
          console.log('Imagen seleccionada con éxito:', this.imagenAleatoria);
        } else {
          console.warn('La API no devolvió ninguna imagen ACTIVA. Usando imagen por defecto.');
          this.imagenAleatoria = 'https://bgreennet.bgreen.com.co/imagenes/Fondo_Pantalla.jpg';
        }
      },
      error: (err) => {
        console.error('Error FATAL al llamar a la API de imágenes:', err);
        this.imagenAleatoria = 'https://bgreennet.bgreen.com.co/imagenes/Fondo_Pantalla.jpg';
      }
    });
  }

obtenerImagenAleatoria(): string {
  const indice = Math.floor(Math.random() * this.imagenes.length);
  return this.imagenes[indice];
}


}
