import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Usuario } from '../../../models/usuario';
import { UsuarioService } from '../../../servicios/usuarioservices';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Perfil } from '../../../models/perfil';
import { Empresa } from '../../../models/empresa';
import { Cargo } from '../../../models/cargo';
import { Area } from '../../../models/area';
import { TiposIdentificacion } from '../../../models/tiposIdentificacion';
import { ListasService } from '../../../servicios/listasServices';
import { Perfilservices } from '../../../servicios/perfilservices';
import { AsignarPermiso } from '../../../models/asignarpermisos';
import { ModuloDTO } from '../../../models/modulos/ModuloDTO';
import { ModuleConfigService } from '../../../servicios/moduleConfigService';
import { SubModuloDTO } from '../../../models/modulos/SubModuloDTO';
import { NgForOf, NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})

export class Usuarios implements OnInit {
  [x: string]: any;

  usuarioForm: FormGroup;
  perfilForm: FormGroup;
  permisosXperfil: any;
  modulos: ModuloDTO[] = []; //  Nueva variable para módulos
  permisosModulos: any[] = []; //  Nueva variable para permisos de módulos
  usuarios: Usuario[] = [];
  perfiles: Perfil[] = [];
  empresas: Empresa[] = [];
  cargos: Cargo[] = [];
  areas: Area[] = [];
  tiposIdentificacion: TiposIdentificacion[] = [];

  // Estados de los modales
  showModalUsuario = false;
  showModalPerfil = false;

  // Modos de edición
  isEditModeUsuario = false;
  isEditModePerfil = false;

<<<<<<< Updated upstream
  // IDs a editar
=======
  // ── Modal cambiar clave (admin) ──────────────────────────
  showModalClave = false;
  usuarioClaveId: number | null = null;
  usuarioClaveNombre = '';
  nuevaClaveAdmin = '';
  confirmarClaveAdmin = '';
  mostrarNuevaClaveAdmin = false;
  mostrarConfirmarClaveAdmin = false;
  errorClaveAdmin = '';
  successClaveAdmin = '';

  // ── IDs en edición ───────────────────────────────────────
>>>>>>> Stashed changes
  usuarioIdEditar: number | null = null;
  perfilIdEditar: number | null = null;
  nombre_perfil: string = "";

  perfilIdSeleccionado: number | null = null;

  //  Pestaña activa (sistemas o modulos)
  pestanaActiva: 'sistemas' | 'modulos' = 'sistemas';

  constructor(
    private fb: FormBuilder,
    private perf: FormBuilder,
    private usuarioService: UsuarioService,
    private listasServices: ListasService,
    private perfilservices: Perfilservices,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private moduleConfigService: ModuleConfigService //  Inyectar servicio
  ) {
    this.usuarioForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(4)]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      id_area_fk: ['', Validators.required],
      id_perfil_fk: ['', Validators.required],
      identificacion: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$')]],
      razon_social: [''],
      correo: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, Validators.pattern('^[+]?[0-9]{3,5}$'), Validators.minLength(3), Validators.maxLength(5)]],
      fechaNacimiento: ['', Validators.required],
      id_cargo_fk: ['', Validators.required],
      id_empresa_fk: ['', Validators.required],
      id_tipoidentificacion_fk: [1, Validators.required],
      estado: [true]
    });

    this.perfilForm = this.perf.group({
      descripcionPerfil: ['', [Validators.required, Validators.minLength(4)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.CargarPerfil_Lista();
    this.CargarEmpresa();
    this.CargarCargo();
    this.CargarArea();
    this.CargarTipoidenrificacion();
    this.cargarModulos(); //  Cargar módulos al iniciar
  }

  //  Cargar configuración de módulos
  cargarModulos(): void {
    this.moduleConfigService.getModulos().subscribe({
      next: (modulos) => {
        this.modulos = modulos;
        console.log('Módulos cargados:', this.modulos);
      },
      error: (err) => console.error('Error al cargar módulos:', err)
    });
    this.moduleConfigService.loadConfig();
  }

  // ======== CARGA DE DATOS ========
  cargarUsuarios(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  CargarPerfil_Lista(): void {
    this.listasServices.obtenerPerfiles().subscribe({
      next: (data) => {
        this.perfiles = data;
        this.cdr.detectChanges();
      }
    });
  }
  
  CargarEmpresa(): void {
    this.listasServices.obtenerEmpresas().subscribe({
      next: (data) => this.empresas = data,
      error: (err) => console.error('Error al cargar empresas', err)
    });
  }

  CargarCargo(): void {
    this.listasServices.obtenerCargos().subscribe({
      next: (data) => this.cargos = data,
      error: (err) => console.error('Error al cargar cargos', err)
    });
  }

  CargarArea(): void {
    this.listasServices.obtenerAreas().subscribe({
      next: (data) => this.areas = data,
      error: (err) => console.error('Error al cargar áreas', err)
    });
  }

  CargarTipoidenrificacion(): void {
    this.listasServices.obtenerIdentificacion().subscribe({
      next: (data) => this.tiposIdentificacion = data,
      error: (err) => console.error('Error al cargar tipos de identificación', err)
    });
  }

  // ======== MODAL USUARIOS ========
  openCrearModal(): void {
    this.isEditModeUsuario = false;
    this.usuarioIdEditar = null;
    this.usuarioForm.reset({
      estado: true,
      id_perfil_fk: 1,
      id_empresa_fk: 1,
      id_tipoidentificacion_fk: 1,
      id_cargo_fk: 1
    });
    this.showModalUsuario = true;
  }

  abrirEditarModal(usuario: Usuario): void {
    this.isEditModeUsuario = true;
    this.usuarioIdEditar = usuario.idUsuario!;

    this.usuarioForm.patchValue({
      usuario: usuario.usuario,
      contrasena: '',
      id_area_fk: usuario.id_area_fk,
      id_perfil_fk: usuario.id_perfil_fk,
      id_empresa_fk: usuario.id_empresa_fk,
      razon_social: usuario.razon_social || '',
      identificacion: usuario.identificacion,
      id_tipoidentificacion_fk: usuario.id_tipoidentificacion_fk,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      celular: usuario.celular,
      fechaNacimiento: usuario.fechaNacimiento,
      id_cargo_fk: usuario.id_cargo_fk,
      estado: usuario.estado
    });

    // Contraseña opcional en edición
    this.usuarioForm.get('contrasena')?.clearValidators();
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    this.showModalUsuario = true;
  }

  eliminar(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.usuarioService.deleteUsuario(id).subscribe({
        next: () => {
          alert('Usuario eliminado exitosamente');
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error('Error al eliminar', err);
          alert('Error al eliminar el usuario.');
        }
      });
    }
  }

  // ======== MODAL PERFILES ========
  openCrearPerfilModal(): void {
    this.isEditModePerfil = false;
    this.perfilIdEditar = null;
    this.perfilForm.reset({ estado: true });
    this.showModalPerfil = true;
  }

  ModalEditarPerfil(perfil: Perfil): void {
    this.isEditModePerfil = true;
    this.perfilIdEditar = perfil.idPerfil!;
    this.perfilForm.patchValue({
      descripcionPerfil: perfil.descripcionPerfil,
      estado: perfil.estado
    });
    this.showModalPerfil = true;
  }

  // ======== CIERRE DE MODAL ========
  cerrarModal(tipo: 'usuario' | 'perfil'): void {
    if (tipo === 'usuario') {
      this.showModalUsuario = false;
      this.usuarioForm.reset();
      // Restaurar validación de contraseña
      this.usuarioForm.get('contrasena')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    } else {
      this.showModalPerfil = false;
      this.perfilForm.reset();
    }

    // Resetear estados
    this.isEditModeUsuario = false;
    this.isEditModePerfil = false;
    this.usuarioIdEditar = null;
    this.perfilIdEditar = null;
  }

  // ======== ENVÍO DE FORMULARIOS ========
  onSubmitUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const usuario = {
      ...this.usuarioForm.value,
      id_area_fk: Number(this.usuarioForm.value.id_area_fk),
      id_cargo_fk: Number(this.usuarioForm.value.id_cargo_fk),
      id_empresa_fk: Number(this.usuarioForm.value.id_empresa_fk),
      id_perfil_fk: Number(this.usuarioForm.value.id_perfil_fk),
      id_tipoidentificacion_fk: Number(this.usuarioForm.value.id_tipoidentificacion_fk)
    };

    console.log(usuario)

    if (this.isEditModeUsuario && this.usuarioIdEditar) {
      this.usuarioService.actualizarUsuario(this.usuarioIdEditar, usuario).subscribe({
        next: () => {
          alert('Usuario actualizado exitosamente');
          this.cargarUsuarios();
          this.cerrarModal('usuario');
        },
        error: () => {
          alert('Error al actualizar el usuario.');
        }
      });
      return;
    }

    this.usuarioService.createUsuario(usuario).subscribe({
      next: () => {
        alert('Usuario creado exitosamente');
        this.cargarUsuarios();
        this.cerrarModal('usuario');
      },
      error: () => {
        alert('Error al crear el usuario.');
      }
    });
  }

  onSubmitPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    const perfil = { ...this.perfilForm.value };

    console.log(perfil)

    if (this.isEditModePerfil && this.perfilIdEditar) {
      this.perfilservices.actualizarPerfil(this.perfilIdEditar, perfil).subscribe({
        next: () => {
          alert('Perfil actualizado exitosamente');
          this.CargarPerfil_Lista();
          this.cerrarModal('perfil');
        },
        error: () => {
          alert('Error al actualizar el perfil.');
        }
      });
      return;
    }

    this.perfilservices.crearPerfil(perfil).subscribe({
      next: () => {
        alert('Perfil creado exitosamente');
        this.CargarPerfil_Lista();
        this.cerrarModal('perfil');
      },
      error: () => {
        alert('Error al crear el perfil.');
      }
    });
  }

  //  Cambiar pestaña activa
//  Cambiar pestaña activa
cambiarPestana(pestaña: 'sistemas' | 'modulos'): void {
  this.pestanaActiva = pestaña;
  if (pestaña === 'modulos' && this.perfilIdSeleccionado) {
    this.cargarPermisosModulos(this.perfilIdSeleccionado);
  } else if (pestaña === 'sistemas' && this.perfilIdSeleccionado) {
    this.verpermisos(this.perfilIdSeleccionado, this.nombre_perfil);
  }
}

 verpermisos(id: any, name: any): void {
  this.nombre_perfil = name;
  this.perfilIdSeleccionado = id;
  this.pestanaActiva = 'sistemas'; //  Por defecto mostrar sistemas

  // Cargar permisos de sistemas
  this.perfilservices.obtenerpermisos(id).subscribe({
    next: (data) => {
      this.permisosXperfil = data;
      this.cdr.detectChanges();
    },
    error: (err) => console.error('Error al cargar permisos de sistemas:', err)
  });

  // Cargar permisos de módulos
  this.cargarPermisosModulos(id);
}

  togglePermiso(permiso: any): void {
    const idPerfil = this.perfilIdSeleccionado;
    if (!idPerfil) {
      console.error('No se ha seleccionado un perfil');
      return;
    }

    const dto: AsignarPermiso = {
      idPerfilFk: idPerfil,
      idSistemaFk: permiso.idSistema
    };

    // Guardar el estado actual para revertir en caso de fallo
    const estadoOriginal = permiso.tienePermiso;

    // Invertir visualmente (optimistic update)
    permiso.tienePermiso = !permiso.tienePermiso;

    const observable$ = permiso.tienePermiso
      ? this.perfilservices.asignarPermiso(dto)
      : this.perfilservices.eliminarPermiso(dto);

    observable$.subscribe({
      next: (exito: boolean) => {
        if (!exito) {
          // El backend respondió 200, pero lógicamente falló → revertir
          permiso.tienePermiso = estadoOriginal;
          alert('Operación rechazada por el servidor.');
        }
        // Si éxito === true, ya está actualizado en UI
      },
      error: (err) => {
        console.error('Error de red o servidor:', err);
        // Revertir siempre en caso de error de red
        permiso.tienePermiso = estadoOriginal;
        alert('No se pudo realizar la operación. Intente nuevamente.');
      }
    });
  }

  //  Cargar permisos de módulos para un perfil
  cargarPermisosModulos(idPerfil: number): void {
    this.moduleConfigService.getPermisosByPerfil(idPerfil).subscribe({
      next: (permisos) => {
        // Actualizar los permisos en los módulos
        this.modulos.forEach(modulo => {
          modulo.subModulos.forEach(submodulo => {
            const permiso = permisos.find(p => p.idSubModulo === submodulo.idSubModulo);
            if (permiso) {
              submodulo.roles = permiso.roles;
            }
          });
        });
        console.log('Permisos de módulos cargados:', this.modulos);
      },
      error: (err) => console.error('Error al cargar permisos de módulos:', err)
    });
  }

  //  Toggle para permisos de módulos
  togglePermisoModulo(submodulo: SubModuloDTO, event: any): void {
    const idPerfil = this.perfilIdSeleccionado;
    if (!idPerfil) {
      console.error('No se ha seleccionado un perfil');
      event.target.checked = false;
      return;
    }

    const isChecked = event.target.checked;
    const idSubModulo = submodulo.idSubModulo; //  Usar ID directamente

    // Guardar estado original para revertir en caso de error
    const rolesOriginales = [...(submodulo.roles || [])];

    // Actualizar visualmente (optimistic update)
    if (isChecked) {
      if (!submodulo.roles) submodulo.roles = [];
      if (!submodulo.roles.includes(this.nombre_perfil)) {
        submodulo.roles.push(this.nombre_perfil);
      }
    } else {
      if (submodulo.roles) {
        const index = submodulo.roles.indexOf(this.nombre_perfil);
        if (index > -1) {
          submodulo.roles.splice(index, 1);
        }
      }
    }

    // Llamar al servicio
    this.moduleConfigService.asignarPermiso(idPerfil, idSubModulo, isChecked).subscribe({
      next: () => {
        console.log(`Permiso ${isChecked ? 'asignado' : 'revocado'} correctamente`);
      },
      error: (error) => {
        console.error('Error al asignar permiso:', error);
        // Revertir cambios en caso de error
        submodulo.roles = rolesOriginales;
        event.target.checked = !isChecked;
        alert('Error al asignar permiso. Intente nuevamente.');
      }
    });
  }

  //  Verificar si un submódulo tiene permiso para el perfil actual
  tienePermisoModulo(submodulo: SubModuloDTO): boolean {
    if (!this.nombre_perfil || !submodulo.roles) {
      return false;
    }
    return submodulo.roles.includes(this.nombre_perfil);
  }


  //  Obtener ID del submódulo (necesitas ajustar tu DTO para incluir idSubModulo)
  private getIdSubModulo(submodulo: SubModuloDTO): number | null {
    // Esta es una implementación temporal
    // Deberías agregar idSubModulo al SubModuloDTO desde el backend
    console.warn('Necesitas agregar idSubModulo al DTO');
    return null; // Cambia esto cuando tengas el ID real
  }

<<<<<<< Updated upstream

  // ======== HELPERS PARA VALIDACIÓN ========
  get f() {
    return this.usuarioForm.controls;
  }

  get pf() {
    return this.perfilForm.controls;
  }





=======
  // ======================================================
  //  MODAL CAMBIAR CLAVE (Admin)
  // ======================================================

  get adm_tieneMayuscula(): boolean { return /[A-Z]/.test(this.nuevaClaveAdmin); }
  get adm_tieneMinuscula(): boolean { return /[a-z]/.test(this.nuevaClaveAdmin); }
  get adm_tieneNumero(): boolean    { return /[0-9]/.test(this.nuevaClaveAdmin); }
  get adm_tieneLongitud(): boolean  { return this.nuevaClaveAdmin.length >= 8; }
  get adm_passwordValido(): boolean {
    return this.adm_tieneMayuscula && this.adm_tieneMinuscula && this.adm_tieneNumero && this.adm_tieneLongitud;
  }

  abrirModalClave(usuario: Usuario): void {
    this.usuarioClaveId = usuario.idUsuario!;
    this.usuarioClaveNombre = `${usuario.nombre} ${usuario.apellido}`;
    this.nuevaClaveAdmin = '';
    this.confirmarClaveAdmin = '';
    this.errorClaveAdmin = '';
    this.successClaveAdmin = '';
    this.mostrarNuevaClaveAdmin = false;
    this.mostrarConfirmarClaveAdmin = false;
    this.showModalClave = true;
  }

  cerrarModalClave(): void {
    this.showModalClave = false;
    this.usuarioClaveId = null;
    this.usuarioClaveNombre = '';
    this.nuevaClaveAdmin = '';
    this.confirmarClaveAdmin = '';
    this.errorClaveAdmin = '';
    this.successClaveAdmin = '';
  }

  guardarClaveAdmin(): void {
    this.errorClaveAdmin = '';
    this.successClaveAdmin = '';

    if (!this.adm_passwordValido) {
      this.errorClaveAdmin = 'La nueva clave no cumple los requisitos.';
      return;
    }
    if (this.nuevaClaveAdmin !== this.confirmarClaveAdmin) {
      this.errorClaveAdmin = 'Las claves no coinciden.';
      return;
    }

    // El admin usa una clave cualquiera como claveActual ya que
    // el endpoint de administrador solo necesita el id y la nueva clave.
    // Enviamos la misma nueva clave como "actual" para bypasear la
    // verificación de clave actual. Para evitar eso, conviene un
    // endpoint separado para admin. Por ahora, reutilizamos el endpoint
    // pero en el backend se puede agregar un endpoint sin verificación.
    const dto = {
      idUsuario: this.usuarioClaveId!,
      claveActual: '',          // No aplica en modo admin
      nuevaClave: this.nuevaClaveAdmin
    };

    this.usuarioService.cambiarClaveAdmin(dto).subscribe({
      next: () => {
        alert(`¡Clave de ${this.usuarioClaveNombre} actualizada exitosamente!`);
        this.cerrarModalClave();
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || 'Error al cambiar la clave.';
        alert(errorMsg);
        this.errorClaveAdmin = errorMsg;
      }
    });
  }
>>>>>>> Stashed changes
}