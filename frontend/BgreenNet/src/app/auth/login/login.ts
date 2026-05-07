import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../authservices';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFor, NgIf, NgForOf } from '@angular/common';
import { timeout } from 'rxjs';
import Swal from 'sweetalert2';

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

  imagenes: string[] = [
  'https://bgreennet.bgreen.com.co/imagenes/Fondo_Pantalla.jpg',
  'https://cdn.pixabay.com/photo/2025/07/17/10/48/nature-9719280_1280.png',
  'https://bgreen.com.co/Img/Inicio/Carousel4.jpg',
  'https://bgreen.com.co/Img/Inicio/Carousel3.jpg',
  'https://bgreen.com.co/Img/Galeria/bgreen10.jpg',
  'https://bgreen.com.co/Img/Galeria/bgreen13.jpg'
];

imagenAleatoria: string = '';

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

    //  NUEVO: Decodificar la returnUrl
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

        // Mostrar el error usando SweetAlert
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
  this.imagenAleatoria = this.obtenerImagenAleatoria();
}

obtenerImagenAleatoria(): string {
  const indice = Math.floor(Math.random() * this.imagenes.length);
  return this.imagenes[indice];
}


}
