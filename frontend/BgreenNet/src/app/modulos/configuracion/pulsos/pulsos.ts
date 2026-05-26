import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Pulso } from '../../../models/Pulsos/pulso';
import { PulsoService } from '../../../servicios/pulsoservices';
import { PulsoCreateDTO } from '../../../models/Pulsos/PulsoCreateDTO';
import { PulsoUpdateDTO } from '../../../models/Pulsos/PulsoUpdateDTO';

@Component({
  selector: 'app-pulsos',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './pulsos.html',
  styleUrl: './pulsos.css',
})
export class Pulsos implements OnInit {

  vistaActual: 'lista' | 'formulario' = 'lista';

  // Lista
  pulsos: Pulso[] = [];
  pulsosFiltrados: Pulso[] = [];
  loading = false;
  searchTerm = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  // Formulario
  pulsoForm!: FormGroup;
  isEditMode = false;
  pulsoEditando?: Pulso;
  uploadingImage = false;
  imagePreview?: string;
  selectedFile?: File;
  minDate: string;
  userEmail: any;
  fullName: any;

  constructor(
    private fb: FormBuilder,
    private pulsoService: PulsoService,
    private cdr: ChangeDetectorRef
  ) {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    this.minDate = `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarPulsos();

    this.loadUserDataAndPermisos();

    // Lógica dinámica para habilitar/inhabilitar según fechaActivacion
    this.pulsoForm.get('fechaActivacion')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        const fechaAct = new Date(fecha + 'T01:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaAct.setHours(0, 0, 0, 0);

        if (fechaAct.getTime() > hoy.getTime()) {
          this.pulsoForm.patchValue({ activo: false }, { emitEvent: false });
        } else {
          this.pulsoForm.patchValue({ activo: true }, { emitEvent: false });
        }
      } else {
        this.pulsoForm.patchValue({ activo: true }, { emitEvent: false });
      }
    });
  }

  // ============ INICIALIZACIÓN ============

  inicializarFormulario(): void {
    this.pulsoForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(255)]], //  255 caracteres
      descripcion: ['', Validators.maxLength(1000)],
      fechaFinal: [this.minDate, Validators.required],
      activo: [true],
      imagenUrl: [''],
      imagenNombreOriginal: [''],
      imagenTipoMime: [''],
      imagenTamanoBytes: [0],
      fechaActivacion: ['']
    });
  }

  // ============ VISTA LISTA ============

  cargarPulsos(): void {
    this.loading = true;
    this.pulsoService.getAllPulsos().subscribe({
      next: (pulsos) => {
        this.pulsos = pulsos;
        this.aplicarFiltros();
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Pulsos cargados:', this.pulsos); //  Debug
      },
      error: (error) => {
        console.error('Error al cargar pulsos:', error);
        Swal.fire('Error', error.message || 'No se pudieron cargar los pulsos', 'error');
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.pulsos];


    if (this.searchTerm) {
      const termino = this.searchTerm.toLowerCase();
      resultado = resultado.filter(p =>
        p.titulo.toLowerCase().includes(termino) ||
        p.descripcion?.toLowerCase().includes(termino)
      );
    }

    if (this.filtroEstado === 'activos') {
      resultado = resultado.filter(p => p.activo);
      console.log('Jose', resultado)
    } else if (this.filtroEstado === 'inactivos') {
      resultado = resultado.filter(p => !p.activo);
    }

    this.pulsosFiltrados = resultado;
  }


  onSearchChange(): void {
    this.aplicarFiltros();
  }

  onFiltroEstadoChange(estado: 'todos' | 'activos' | 'inactivos'): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  cambiarEstado(pulso: Pulso): void {
    const nuevoEstado = !pulso.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} pulso?`,
      text: `¿Estás seguro de ${accion} "${pulso.titulo}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pulsoService.updateEstado(pulso.idPulso!, nuevoEstado).subscribe({
          next: (response) => { //  Ahora recibe el objeto con mensaje
            pulso.activo = nuevoEstado;
            Swal.fire(
              '¡Actualizado!',
              response.mensaje || `El pulso ha sido ${accion}do correctamente`,
              'success'
            );
          },
          error: (error) => {
            console.error('Error al cambiar estado:', error);
            Swal.fire('Error', error.message || 'No se pudo cambiar el estado', 'error');
          }
        });
      }
    });
  }

  eliminarPulso(pulso: Pulso): void {
    //  Validar que existe el ID antes de proceder
    if (!pulso.idPulso) {
      Swal.fire('Error', 'No se puede eliminar: ID de pulso no válido', 'error');
      console.error('Pulso sin ID:', pulso);
      return;
    }

    console.log('Eliminando pulso con ID:', pulso.idPulso); //  Debug

    Swal.fire({
      title: '¿Eliminar pulso?',
      text: `¿Estás seguro de eliminar "${pulso.titulo}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pulsoService.deletePulso(pulso.idPulso!).subscribe({
          next: (response) => {
            this.pulsos = this.pulsos.filter(p => p.id !== pulso.idPulso);
            this.aplicarFiltros();
            Swal.fire(
              '¡Eliminado!',
              response.mensaje || 'El pulso ha sido eliminado correctamente',
              'success'
            );
          },
          error: (error) => {
            console.error('Error al eliminar pulso:', error);
            Swal.fire('Error', error.message || 'No se pudo eliminar el pulso', 'error');
          }
        });
      }
    });

    this.cargarPulsos();
  }

  // ============ NAVEGACIÓN ============

  mostrarFormularioCrear(): void {
    this.isEditMode = false;
    this.pulsoEditando = undefined;
    this.pulsoForm.reset({
      activo: true,
      fechaFinal: this.minDate,
      imagenTamanoBytes: 0
    });
    this.imagePreview = undefined;
    this.selectedFile = undefined;
    this.vistaActual = 'formulario';
  }

  mostrarFormularioEditar(pulso: Pulso): void {
    this.isEditMode = true;
    this.pulsoEditando = pulso;
    console.log(pulso)

    //  Formatear fecha correctamente para el input
    const fechaISO = pulso.fechaFinal.split('T')[0];

    this.pulsoForm.patchValue({
      titulo: pulso.titulo,
      descripcion: pulso.descripcion || '',
      fechaFinal: fechaISO,
      activo: pulso.activo,
      imagenUrl: pulso.imagenUrl || '',
      imagenNombreOriginal: pulso.imagenNombreOriginal || '',
      imagenTipoMime: pulso.imagenTipoMime || '',
      imagenTamanoBytes: pulso.imagenTamanoBytes || 0,
      fechaActivacion: pulso.fechaActivacion ? pulso.fechaActivacion.split('T')[0] : ''
    });

    this.imagePreview = pulso.imagenUrl;
    this.selectedFile = undefined;
    this.vistaActual = 'formulario';
  }

  volverALista(): void {
    if (this.pulsoForm.dirty) {
      Swal.fire({
        title: '¿Cancelar cambios?',
        text: 'Los cambios no guardados se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar editando',
        confirmButtonColor: '#6c757d',
        cancelButtonColor: '#007bff'
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetearFormulario();
        }
      });
    } else {
      this.resetearFormulario();
    }
  }

  private resetearFormulario(): void {
    this.vistaActual = 'lista';
    this.pulsoForm.reset();
    this.imagePreview = undefined;
    this.selectedFile = undefined;
    this.isEditMode = false;
    this.pulsoEditando = undefined;
  }

  // ============ FORMULARIO ============

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      //  Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'Por favor selecciona una imagen válida (PNG, JPG, WEBP)', 'error');
        input.value = ''; // Limpiar input
        return;
      }

      //  Validar tamaño (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        Swal.fire('Error', 'La imagen no puede superar los 5MB', 'error');
        input.value = ''; // Limpiar input
        return;
      }

      this.selectedFile = file;
      this.mostrarVistaPrevia(file);
    }
  }

  mostrarVistaPrevia(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  eliminarImagen(): void {
    Swal.fire({
      title: '¿Eliminar imagen?',
      text: 'Se eliminará la imagen del pulso',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.imagePreview = undefined;
        this.selectedFile = undefined;
        this.pulsoForm.patchValue({
          imagenUrl: '',
          imagenNombreOriginal: '',
          imagenTipoMime: '',
          imagenTamanoBytes: 0
        });
      }
    });
  }

  async onSubmit(): Promise<void> {
    console.log('=== SUBMIT FORMULARIO PULSOS ===');
    console.log('Valores del formulario:', this.pulsoForm.value);
    console.log('¿Formulario Válido?:', this.pulsoForm.valid);
    console.log('Archivo de imagen seleccionado:', this.selectedFile ? {
      nombre: this.selectedFile.name,
      tipo: this.selectedFile.type,
      tamano: this.selectedFile.size
    } : 'Ninguno');

    if (this.pulsoForm.invalid) {
      this.pulsoForm.markAllAsTouched();
      Swal.fire('Error', 'Por favor completa todos los campos requeridos', 'error');
      return;
    }

    this.loading = true;

    try {
      //  Subir imagen si hay una nueva
      if (this.selectedFile) {
        await this.subirImagen();
      }

      //  Crear o actualizar
      if (this.isEditMode) {
        await this.actualizarPulso();
      } else {
        await this.crearPulso();
      }
    } catch (error) {
      console.error('Error en submit:', error);
      this.loading = false;
    }
  }

  private subirImagen(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        resolve();
        return;
      }

      this.uploadingImage = true;
      this.pulsoService.uploadImage(this.selectedFile).subscribe({
        next: (imageUrl) => {
          this.pulsoForm.patchValue({
            imagenUrl: imageUrl,
            imagenNombreOriginal: this.selectedFile!.name,
            imagenTipoMime: this.selectedFile!.type,
            imagenTamanoBytes: this.selectedFile!.size
          });
          this.uploadingImage = false;
          resolve();
        },
        error: (error) => {
          console.error('Error al subir imagen:', error);
          this.uploadingImage = false;
          Swal.fire('Error', error.message || 'No se pudo subir la imagen', 'error');
          reject(error);
        }
      });
    });
  }

  private crearPulso(): Promise<void> {
    return new Promise((resolve, reject) => {
      const formValues = this.pulsoForm.value;

      let isActivo = true;
      if (formValues.fechaActivacion) {
        const fechaAct = new Date(formValues.fechaActivacion + 'T01:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaAct.setHours(0, 0, 0, 0);
        isActivo = fechaAct.getTime() <= hoy.getTime();
      }

      // Formatear fecha sin conversión de zona horaria (evita que cambie de día)
      const pulsoData: PulsoCreateDTO = {
        titulo: formValues.titulo.trim(),
        descripcion: formValues.descripcion?.trim() || null,
        imagenUrl: formValues.imagenUrl || null,
        imagenNombreOriginal: formValues.imagenNombreOriginal || null,
        imagenTipoMime: formValues.imagenTipoMime || null,
        imagenTamanoBytes: formValues.imagenTamanoBytes || null,
        fechaFinal: formValues.fechaFinal + 'T01:00:00',
        fechaActivacion: formValues.fechaActivacion ? formValues.fechaActivacion + 'T01:00:00' : undefined,
        creadoPor: this.userEmail,
        activo: isActivo // Aseguramos enviar el estado activo correcto desde el DTO si el backend lo soporta
      } as any;

      console.log('Creando pulso:', pulsoData); //  Debug

      this.pulsoService.createPulso(pulsoData).subscribe({
        next: (response) => { //  Ahora recibe { id, mensaje }
          console.log('Pulso creado:', response);
          this.loading = false;
          Swal.fire({
            title: '¡Éxito!',
            text: response.mensaje || 'Pulso creado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.resetearFormulario();
            this.cargarPulsos();
          });
          resolve();
        },
        error: (error) => {
          console.error('Error al crear pulso:', error);
          this.loading = false;
          Swal.fire('Error', error.message || 'No se pudo crear el pulso', 'error');
          reject(error);
        }
      });
    });
  }

  private actualizarPulso(): Promise<void> {
    return new Promise((resolve, reject) => {
      const formValues = this.pulsoForm.value;

      let isActivo = formValues.activo;
      if (formValues.fechaActivacion) {
        const fechaAct = new Date(formValues.fechaActivacion + 'T01:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaAct.setHours(0, 0, 0, 0);
        isActivo = fechaAct.getTime() <= hoy.getTime();
      } else {
        isActivo = true;
      }

      // Formatear fecha sin conversión de zona horaria (evita que cambie de día)
      const pulsoData: PulsoUpdateDTO = {
        titulo: formValues.titulo.trim(),
        descripcion: formValues.descripcion?.trim() || null,
        imagenUrl: formValues.imagenUrl || null,
        imagenNombreOriginal: formValues.imagenNombreOriginal || null,
        imagenTipoMime: formValues.imagenTipoMime || null,
        imagenTamanoBytes: formValues.imagenTamanoBytes || null,
        fechaFinal: formValues.fechaFinal + 'T01:00:00',
        fechaActivacion: formValues.fechaActivacion ? formValues.fechaActivacion + 'T01:00:00' : undefined,
        activo: isActivo
      };

      console.log('Actualizando pulso:', this.pulsoEditando!.idPulso, pulsoData); //  Debugpr


      this.pulsoService.updatePulso(this.pulsoEditando!.idPulso!, pulsoData).subscribe({
        next: (response) => { //  Ahora recibe { mensaje }
          console.log('Pulso actualizado:', response);
          this.loading = false;
          Swal.fire({
            title: '¡Éxito!',
            text: response.mensaje || 'Pulso actualizado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.resetearFormulario();
            this.cargarPulsos();
          });
          resolve();
        },
        error: (error) => {
          console.error('Error al actualizar pulso:', error);
          this.loading = false;
          Swal.fire('Error', error.message || 'No se pudo actualizar el pulso', 'error');
          reject(error);
        }
      });
    });
  }

  // ============ HELPERS ============

  calcularDiasRestantes(fechaFinal: string): number {
    return this.pulsoService.calcularDiasRestantes(fechaFinal);
  }

  getEstadoBadgeClass(pulso: Pulso): string {
    if (!pulso.activo) return 'badge-inactive';
    const dias = this.calcularDiasRestantes(pulso.fechaFinal);
    if (dias < 0) return 'badge-expired';
    if (dias <= 3) return 'badge-warning';

    return 'badge-active';

  }

  getEstadoTexto(pulso: Pulso): string {

    if (!pulso.activo) return 'Inactivo';
    if (!pulso.fechaFinal) return 'Sin fecha';

    const hoy = new Date();
    const fechaFinal = new Date(pulso.fechaFinal);


    hoy.setHours(0, 0, 0, 0);
    fechaFinal.setHours(0, 0, 0, 0);

    const diferenciaMs = fechaFinal.getTime() - hoy.getTime();
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

    if (dias < 0) return 'Expirado';
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return '1 día restante';

    return `${dias} días restantes`;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.pulsoForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.pulsoForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    return '';
  }

  private loadUserDataAndPermisos(): void {
    const userString = localStorage.getItem('usuario');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        this.fullName = `${user.nombre} ${user.apellido}`.toUpperCase();
        this.userEmail = user.Usuario || user.correo;




      } catch (error) {
      }


    }
  }
}
