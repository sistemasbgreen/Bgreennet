import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../authservices';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFor, NgIf, NgForOf } from '@angular/common';
import { timeout } from 'rxjs';
import Swal from 'sweetalert2';
import { ListasService } from '../../servicios/listasServices';
import { ConfiguracionSeguridadService } from '../../servicios/configuracionSeguridadService';

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
    private listasService: ListasService,
    private configSeguridadService: ConfiguracionSeguridadService,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      contrasena: ['', [Validators.required]]
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

        if (response.contrasenaExpirada) {
          Swal.fire({
            icon: 'warning',
            title: 'Contraseña Vencida',
            text: 'Su contraseña ha vencido. Por favor, cámbiela lo antes posible.',
            confirmButtonColor: '#006c2c',
            confirmButtonText: 'Entendido'
          }).then(() => {
            this.router.navigate([this.returnUrl]);
          });
        } else {
          this.router.navigate([this.returnUrl]);
        }
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error FATAL al llamar a la API de imágenes:', err);
        this.imagenAleatoria = 'https://bgreennet.bgreen.com.co/imagenes/Fondo_Pantalla.jpg';
        this.cdr.detectChanges();
      }
    });

    // Cargar configuración de seguridad para aplicar validación dinámica
    this.configSeguridadService.getConfiguracion().subscribe({
      next: (config) => {
        const minLen = config.minCaracteres || 4;
        this.loginForm.get('contrasena')?.setValidators([
          Validators.required,
          Validators.minLength(minLen)
        ]);
        this.loginForm.get('contrasena')?.updateValueAndValidity();
      },
      error: () => {
        // Fallback: sin restricción de longitud mínima en login
      }
    });
  }

  obtenerImagenAleatoria(): string {
    const indice = Math.floor(Math.random() * this.imagenes.length);
    return this.imagenes[indice];
  }

  // --- Recuperación Dinámica de Contraseña ---
  showRecoverModal = false;
  recoverStep: 1 | 2 | 3 = 1;
  recoverLoading = false;
  recoverError = '';

  usuarioRecuperacion = '';
  codigoOtp = '';
  nuevaContrasena = '';
  confirmarContrasena = '';

  showNewPassword = false;
  showConfirmPassword = false;

  abrirModalRecuperacion(): void {
    this.usuarioRecuperacion = this.loginForm.get('usuario')?.value || '';
    this.codigoOtp = '';
    this.nuevaContrasena = '';
    this.confirmarContrasena = '';
    this.recoverError = '';
    this.recoverStep = 1;
    this.showRecoverModal = true;
  }

  cerrarModalRecuperacion(): void {
    this.showRecoverModal = false;
  }

  solicitarCodigoRecuperacion(): void {
    if (!this.usuarioRecuperacion || this.usuarioRecuperacion.trim().length < 3) {
      this.recoverError = 'Por favor ingrese su usuario o correo electrónico';
      return;
    }

    this.recoverLoading = true;
    this.recoverError = '';

    this.authService.solicitarRecuperacion(this.usuarioRecuperacion.trim()).subscribe({
      next: (res) => {
        this.recoverLoading = false;
        this.recoverStep = 2;
        Swal.fire({
          icon: 'info',
          title: 'Código Enviado',
          text: res.mensaje || 'Se ha enviado un código de 6 dígitos a su correo.',
          confirmButtonColor: '#006c2c'
        });
      },
      error: (err) => {
        this.recoverLoading = false;
        this.recoverError = err.error?.error || 'No se pudo enviar el código. Verifique la información.';
      }
    });
  }

  validarCodigoRecuperacion(): void {
    if (!this.codigoOtp || this.codigoOtp.trim().length !== 6) {
      this.recoverError = 'Ingrese el código completo de 6 dígitos enviado a su correo';
      return;
    }

    this.recoverLoading = true;
    this.recoverError = '';

    this.authService.validarCodigo(this.usuarioRecuperacion.trim(), this.codigoOtp.trim()).subscribe({
      next: () => {
        this.recoverLoading = false;
        this.recoverStep = 3;
      },
      error: (err) => {
        this.recoverLoading = false;
        this.recoverError = err.error?.error || 'Código incorrecto o expirado.';
      }
    });
  }

  restablecerContrasenaFinal(): void {
    if (!this.nuevaContrasena || !this.confirmarContrasena) {
      this.recoverError = 'Diligencie todos los campos';
      return;
    }

    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.recoverError = 'Las contraseñas no coinciden';
      return;
    }

    this.recoverLoading = true;
    this.recoverError = '';

    this.authService.restablecerClave(
      this.usuarioRecuperacion.trim(),
      this.codigoOtp.trim(),
      this.nuevaContrasena
    ).subscribe({
      next: () => {
        this.recoverLoading = false;
        this.showRecoverModal = false;

        Swal.fire({
          icon: 'success',
          title: '¡Contraseña Restablecida!',
          text: 'Su contraseña ha sido actualizada exitosamente. Iniciando sesión...',
          confirmButtonColor: '#006c2c',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate([this.returnUrl]);
        });
      },
      error: (err) => {
        this.recoverLoading = false;
        this.recoverError = err.error?.error || 'Error al restablecer la contraseña.';
      }
    });
  }
}
