import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ConfiguracionSeguridadService, ConfiguracionSeguridad } from '../../../servicios/configuracionSeguridadService';
import { ListasService } from '../../../servicios/listasServices';
import { ImagenLogin } from '../../../models/imagen-login';
import { AuthService } from '../../../auth/authservices';
import { UsuarioService } from '../../../servicios/usuarioservices';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-maestro-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './maestro-configuracion.html',
  styleUrl: './maestro-configuracion.css',
})
export class MaestroConfiguracion implements OnInit {
  configForm: FormGroup;
  loading = false;
  imagenes: ImagenLogin[] = [];
  loadingImagenes = false;
  nuevaImagenUrl: string = '';
  nuevaImagenNombre: string = '';
  filtroBusqueda: string = '';

  constructor(
    private fb: FormBuilder,
    private configService: ConfiguracionSeguridadService,
    private listasService: ListasService,
    private authService: AuthService,
    private usuarioService: UsuarioService
  ) {
    this.configForm = this.fb.group({
      expiracionDias: [90, [Validators.required]],
      intentosInvalidos: [5, [Validators.required]],
      minCaracteres: [8, [Validators.required, Validators.min(4), Validators.max(20)]],
      requiereLetras: [true],
      requiereNumeros: [true],
      requiereEspeciales: [true]
    });
  }

  ngOnInit(): void {
    this.loadConfig();
    this.loadImagenes();
  }

  loadConfig(): void {
    this.loading = true;
    this.configService.getConfiguracion().subscribe({
      next: (config) => {
        this.configForm.patchValue(config);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar configuración', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar la configuración de seguridad', 'error');
      }
    });
  }

  saveConfig(): void {
    if (this.configForm.invalid) return;
    
    if (!this.atLeastOneRequirement) {
      Swal.fire('Atención', 'Debes seleccionar al menos un requisito para la contraseña (Letras, Números o Especiales).', 'warning');
      return;
    }

    this.loading = true;
    const config: ConfiguracionSeguridad = this.configForm.value;

    this.configService.updateConfiguracion(config).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire('¡Guardado!', 'Configuración de seguridad actualizada correctamente.', 'success');
      },
      error: (err) => {
        console.error('Error al actualizar configuración', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudo actualizar la configuración.', 'error');
      }
    });
  }

  incrementMin(): void {
    const current = this.configForm.get('minCaracteres')?.value ?? 8;
    if (current < 20) {
      this.configForm.get('minCaracteres')?.setValue(current + 1);
    }
  }

  decrementMin(): void {
    const current = this.configForm.get('minCaracteres')?.value ?? 8;
    if (current > 4) {
      this.configForm.get('minCaracteres')?.setValue(current - 1);
    }
  }

  // --- GESTIÓN DE IMÁGENES ---

  loadImagenes(): void {
    this.loadingImagenes = true;
    this.listasService.getAllImagenesLogin().subscribe({
      next: (imgs) => {
        this.imagenes = imgs;
        this.loadingImagenes = false;
      },
      error: (err) => {
        console.error('Error al cargar imágenes', err);
        this.loadingImagenes = false;
      }
    });
  }

  agregarImagen(): void {
    if (!this.nuevaImagenUrl || !this.nuevaImagenUrl.trim()) return;

    const currentUser = this.authService.getCurrentUser();
    const nombreCompleto = currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Sistema';
    
    const nuevaImg: ImagenLogin = {
      url: this.nuevaImagenUrl.trim(),
      nombre: this.nuevaImagenNombre.trim(),
      activo: 1,
      usuarioCreacion: nombreCompleto
    };

    this.loadingImagenes = true;
    this.listasService.saveImagenLogin(nuevaImg).subscribe({
      next: () => {
        this.nuevaImagenUrl = '';
        this.nuevaImagenNombre = '';
        this.loadImagenes();
        Swal.fire('¡Añadida!', 'La imagen ha sido agregada correctamente.', 'success');
      },
      error: (err) => {
        console.error('Error al agregar imagen', err);
        this.loadingImagenes = false;
        Swal.fire('Error', 'No se pudo agregar la imagen.', 'error');
      }
    });
  }

  onToggleImagen(event: Event, imagen: ImagenLogin): void {
    event.preventDefault(); // Evitar que el navegador cambie el checkbox visualmente

    const imagenesActivas = this.imagenes.filter(img => img.activo === 1);
    
    // Si la imagen está activa y es la única activa, no permitir desactivarla
    if (imagen.activo === 1 && imagenesActivas.length <= 1) {
      Swal.fire('Atención', 'Debe haber al menos una imagen activa para el fondo del login.', 'warning');
      return;
    }

    imagen.activo = imagen.activo === 1 ? 0 : 1;
    this.listasService.saveImagenLogin(imagen).subscribe({
      next: () => {
        this.loadImagenes();
      },
      error: (err) => {
        console.error('Error al actualizar imagen', err);
        imagen.activo = imagen.activo === 1 ? 0 : 1; // Revertir
        this.loadImagenes();
        Swal.fire('Error', 'No se pudo actualizar el estado de la imagen.', 'error');
      }
    });
  }


  eliminarImagen(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#006c2c',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const imagenAEliminar = this.imagenes.find(img => img.id === id);
        const imagenesActivas = this.imagenes.filter(img => img.activo === 1);

        if (imagenAEliminar && imagenAEliminar.activo === 1 && imagenesActivas.length <= 1) {
          Swal.fire('Atención', 'No puedes eliminar la única imagen activa. Activa otra imagen primero.', 'warning');
          return;
        }

        this.loadingImagenes = true;
        this.listasService.deleteImagenLogin(id).subscribe({
          next: () => {
            this.loadImagenes();
            Swal.fire('¡Eliminada!', 'La imagen ha sido eliminada.', 'success');
          },
          error: (err) => {
            console.error('Error al eliminar imagen', err);
            this.loadingImagenes = false;
            Swal.fire('Error', 'No se pudo eliminar la imagen.', 'error');
          }
        });
      }
    });
  }

  actualizarUrl(imagen: ImagenLogin, event: any): void {
    const nuevaUrl = event.target.value;
    if (nuevaUrl && nuevaUrl !== imagen.url) {
      imagen.url = nuevaUrl;
      this.listasService.saveImagenLogin(imagen).subscribe({
        next: () => {
          Swal.fire({
            title: 'URL Actualizada',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error al actualizar URL', err);
          this.loadImagenes(); // Recargar para revertir
          Swal.fire('Error', 'No se pudo actualizar la URL.', 'error');
        }
      });
    }
  }

  actualizarNombre(imagen: ImagenLogin, event: any): void {
    const nuevoNombre = event.target.value;
    if (nuevoNombre !== imagen.nombre) {
      imagen.nombre = nuevoNombre;
      this.listasService.saveImagenLogin(imagen).subscribe({
        next: () => {
          Swal.fire({
            title: 'Nombre Actualizado',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error al actualizar nombre', err);
          this.loadImagenes(); // Recargar para revertir
          Swal.fire('Error', 'No se pudo actualizar el nombre.', 'error');
        }
      });
    }
  }

  get filteredImagenes(): ImagenLogin[] {
    if (!this.filtroBusqueda || !this.filtroBusqueda.trim()) {
      return this.imagenes;
    }
    const search = this.filtroBusqueda.toLowerCase().trim();
    return this.imagenes.filter(img => 
      (img.nombre && img.nombre.toLowerCase().includes(search)) || 
      (img.url && img.url.toLowerCase().includes(search))
    );
  }

  get atLeastOneRequirement(): boolean {
    return this.configForm.get('requiereLetras')?.value || 
           this.configForm.get('requiereNumeros')?.value || 
           this.configForm.get('requiereEspeciales')?.value;
  }

  forzarVencimiento(): void {
    Swal.fire({
      title: '¿Forzar vencimiento de claves?',
      html: '<p>Esta acción hará que <b>todos los usuarios activos</b> deban cambiar su contraseña en el próximo inicio de sesión.</p><p class="text-muted">Esta acción no se puede deshacer.</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, forzar vencimiento',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.usuarioService.forzarVencimientoTodos().subscribe({
          next: () => {
            this.loading = false;
            Swal.fire({
              title: '¡Hecho!',
              text: 'Todas las contraseñas han sido marcadas como vencidas. Los usuarios deberán cambiarla al iniciar sesión.',
              icon: 'success',
              confirmButtonColor: '#006c2c'
            });
          },
          error: (err) => {
            this.loading = false;
            console.error('Error al forzar vencimiento:', err);
            Swal.fire('Error', 'No se pudo forzar el vencimiento de claves.', 'error');
          }
        });
      }
    });
  }
}
