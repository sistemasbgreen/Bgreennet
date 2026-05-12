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

@Component({
  selector: 'app-usuarios',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {

  // ── Formularios ──────────────────────────────────────────
  usuarioForm: FormGroup;
  perfilForm: FormGroup;

  // ── Listas principales ───────────────────────────────────
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  perfiles: Perfil[] = [];
  perfilesFiltrados: Perfil[] = [];
  empresas: Empresa[] = [];
  cargos: Cargo[] = [];
  areas: Area[] = [];
  tiposIdentificacion: TiposIdentificacion[] = [];

  // ── Búsqueda ─────────────────────────────────────────────
  searchUsuario = '';
  searchPerfil = '';

  // ── Módulos y permisos ───────────────────────────────────
  modulos: ModuloDTO[] = [];
  permisosXperfil: any = [];

  // ── Estado de modales ────────────────────────────────────
  showModalUsuario = false;
  showModalPerfil = false;
  showModalCambiarClave = false;

  // ── Modos del modal de usuario ───────────────────────────
  isEditModeUsuario = false;
  isViewModeUsuario = false; 
  isEditModePerfil = false;

  // ── IDs en edición ───────────────────────────────────────
  usuarioIdEditar: number | null = null;
  idDetalleUsuarioEditar: number | null = null;
  perfilIdEditar: number | null = null;

  // ── Perfil seleccionado para permisos ────────────────────
  perfilSeleccionado: number | null = null;
  perfilIdSeleccionado: number | null = null;
  usuarioSeleccionado: Usuario | null = null;
  nombre_perfil = '';

  // ── Restablecer Clave (Admin) ───────────────────────────
  nuevaClaveAdmin = '';
  confirmarClaveAdmin = '';
  mostrarNuevaClave = false;
  mostrarConfirmarClave = false;

  // ── Acordeón (reemplaza pestañas) ────────────────────────
  acordeonActivo: 'sistemas' | 'modulos' | null = 'sistemas';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private listasServices: ListasService,
    private perfilservices: Perfilservices,
    private cdr: ChangeDetectorRef,
    private moduleConfigService: ModuleConfigService
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
      celular: ['', [Validators.required, Validators.pattern('^[+]?[0-9]{3,5}$')]],
      fechaNacimiento: ['', Validators.required],
      id_cargo_fk: ['', Validators.required],
      id_empresa_fk: ['', Validators.required],
      id_tipoidentificacion_fk: [1, Validators.required],
      estado: [true]
    });

    this.perfilForm = this.fb.group({
      descripcionPerfil: ['', [Validators.required, Validators.minLength(4)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarPerfilLista();
    this.cargarEmpresa();
    this.cargarCargo();
    this.cargarArea();
    this.cargarTipoIdentificacion();
    this.cargarModulos();
  }

  // ── Helpers de validación ────────────────────────────────
  get f() { return this.usuarioForm.controls; }
  get pf() { return this.perfilForm.controls; }

  // ── Validaciones Clave Admin ───────────────────────────
  get tieneMayusculaAdmin(): boolean { return /[A-Z]/.test(this.nuevaClaveAdmin); }
  get tieneNumeroAdmin(): boolean    { return /[0-9]/.test(this.nuevaClaveAdmin); }
  get tieneCaracterEspecialAdmin(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.nuevaClaveAdmin); }
  get tieneLongitudAdmin(): boolean  { return this.nuevaClaveAdmin.length >= 8; }
  get passwordAdminValido(): boolean {
    return this.tieneMayusculaAdmin && this.tieneNumeroAdmin && this.tieneLongitudAdmin && this.tieneCaracterEspecialAdmin;
  }

  // ======================================================
  //  BÚSQUEDA
  // ======================================================

  filtrarUsuarios(): void {
    const term = this.searchUsuario.toLowerCase().trim();
    if (!term) { this.usuariosFiltrados = [...this.usuarios]; return; }

    this.usuariosFiltrados = this.usuarios.filter(u =>
      u.usuario.toLowerCase().includes(term) ||
      `${u.nombre} ${u.apellido}`.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term) ||
      (u.descripcionPerfil?.toLowerCase() ?? '').includes(term)
    );
  }

  filtrarPerfiles(): void {
    const term = this.searchPerfil.toLowerCase().trim();
    if (!term) { this.perfilesFiltrados = [...this.perfiles]; return; }

    this.perfilesFiltrados = this.perfiles.filter(p =>
      p.descripcionPerfil.toLowerCase().includes(term)
    );
  }

  limpiarBusquedaUsuario(): void { this.searchUsuario = ''; this.filtrarUsuarios(); }
  limpiarBusquedaPerfil(): void { this.searchPerfil = ''; this.filtrarPerfiles(); }

  // ======================================================
  //  CARGA DE DATOS
  // ======================================================

  cargarUsuarios(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.usuariosFiltrados = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  cargarPerfilLista(): void {
    this.listasServices.obtenerPerfiles().subscribe({
      next: (data) => {
        this.perfiles = data;
        this.perfilesFiltrados = [...data];
        this.cdr.detectChanges();
      }
    });
  }

  cargarEmpresa(): void {
    this.listasServices.obtenerEmpresas().subscribe({
      next: (data) => this.empresas = data,
      error: (err) => console.error('Error al cargar empresas', err)
    });
  }

  cargarCargo(): void {
    this.listasServices.obtenerCargos().subscribe({
      next: (data) => this.cargos = data,
      error: (err) => console.error('Error al cargar cargos', err)
    });
  }

  cargarArea(): void {
    this.listasServices.obtenerAreas().subscribe({
      next: (data) => this.areas = data,
      error: (err) => console.error('Error al cargar áreas', err)
    });
  }

  cargarTipoIdentificacion(): void {
    this.listasServices.obtenerIdentificacion().subscribe({
      next: (data) => this.tiposIdentificacion = data,
      error: (err) => console.error('Error al cargar tipos de identificación', err)
    });
  }

  cargarModulos(): void {
    this.moduleConfigService.getModulos().subscribe({
      next: (data) => this.modulos = data,
      error: (err) => console.error('Error al cargar módulos:', err)
    });
    this.moduleConfigService.loadConfig();
  }

  // ======================================================
  //  MODAL DE USUARIO — Crear / Editar / Ver
  // ======================================================

  openCrearModal(): void {
    this.isEditModeUsuario = false;
    this.isViewModeUsuario = false;
    this.usuarioIdEditar = null;
    this.usuarioForm.enable();
    this.usuarioForm.reset({
      estado: true,
      id_perfil_fk: 1,
      id_empresa_fk: 1,
      id_tipoidentificacion_fk: 1,
      id_cargo_fk: 1
    });
    this._setPasswordRequired(true);
    this.showModalUsuario = true;
  }

  abrirEditarModal(usuario: Usuario): void {
    this.isEditModeUsuario = true;
    this.isViewModeUsuario = false;
    this.usuarioIdEditar = usuario.idUsuario!;
    this.idDetalleUsuarioEditar = usuario.id_detalle_usuario;
    this.usuarioForm.enable();
    this._patchUsuario(usuario);
    this._setPasswordRequired(false);   // contraseña opcional al editar
    this.showModalUsuario = true;
  }

  /** 👁 Nuevo: abre el modal en modo solo lectura */
  abrirVerModal(usuario: Usuario): void {
    this.isViewModeUsuario = true;
    this.isEditModeUsuario = false;
    this.usuarioIdEditar = null;
    this._patchUsuario(usuario);
    this.usuarioForm.disable();         // bloquea todos los controles
    this.showModalUsuario = true;
  }

  cerrarModal(tipo: 'usuario' | 'perfil' | 'clave'): void {
    if (tipo === 'usuario') {
      this.showModalUsuario = false;
      this.isEditModeUsuario = false;
      this.isViewModeUsuario = false;
      this.usuarioIdEditar = null;
      this.idDetalleUsuarioEditar = null;
      this.usuarioForm.enable();
      this.usuarioForm.reset();
      this._setPasswordRequired(true);
    } else if (tipo === 'perfil') {
      this.showModalPerfil = false;
      this.isEditModePerfil = false;
      this.perfilIdEditar = null;
      this.perfilForm.reset();
    } else if (tipo === 'clave') {
      this.showModalCambiarClave = false;
      this.usuarioSeleccionado = null;
      this.nuevaClaveAdmin = '';
      this.confirmarClaveAdmin = '';
    }
  }

  // ── Restablecer Clave Admin ─────────────────────────────

  abrirCambiarClaveModal(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.nuevaClaveAdmin = '';
    this.confirmarClaveAdmin = '';
    this.showModalCambiarClave = true;
  }

  guardarClaveAdmin(): void {
    if (!this.passwordAdminValido || this.nuevaClaveAdmin !== this.confirmarClaveAdmin) return;
    if (!this.usuarioSeleccionado) return;

    const dto = {
      idUsuario: this.usuarioSeleccionado.idUsuario!,
      claveActual: '', // No requerida para admin en backend
      nuevaClave: this.nuevaClaveAdmin
    };

    this.usuarioService.cambiarClaveAdmin(dto).subscribe({
      next: () => {
        alert('Contraseña restablecida exitosamente');
        this.cerrarModal('clave');
      },
      error: (err) => {
        console.error('Error al restablecer clave', err);
        alert('Error al restablecer la contraseña');
      }
    });
  }

  // ── Helpers privados del modal ───────────────────────────

  private _patchUsuario(u: Usuario): void {
    this.usuarioForm.patchValue({
      usuario: u.usuario,
      contrasena: '',
      id_area_fk: u.id_area_fk,
      id_perfil_fk: u.id_perfil_fk,
      id_empresa_fk: u.id_empresa_fk,
      razon_social: u.razon_social ?? '',
      identificacion: u.identificacion,
      id_tipoidentificacion_fk: u.id_tipoidentificacion_fk,
      nombre: u.nombre,
      apellido: u.apellido,
      correo: u.correo,
      celular: u.celular,
      fechaNacimiento: u.fechaNacimiento,
      id_cargo_fk: u.id_cargo_fk,
      estado: u.estado
    });
  }

  private _setPasswordRequired(required: boolean): void {
    const ctrl = this.usuarioForm.get('contrasena')!;
    if (required) {
      ctrl.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }

  // ======================================================
  //  MODAL DE PERFIL — Crear / Editar
  // ======================================================

  openCrearPerfilModal(): void {
    this.isEditModePerfil = false;
    this.perfilIdEditar = null;
    this.perfilForm.reset({ activo: true });
    this.showModalPerfil = true;
  }

  ModalEditarPerfil(perfil: Perfil): void {
    this.isEditModePerfil = true;
    this.perfilIdEditar = perfil.idPerfil!;
    this.perfilForm.patchValue({
      descripcionPerfil: perfil.descripcionPerfil,
      activo: !!perfil.activo
    });
    this.showModalPerfil = true;
  }

  // ======================================================
  //  ENVÍO DE FORMULARIOS
  // ======================================================

  onSubmitUsuario(): void {
    if (this.usuarioForm.invalid) { this.usuarioForm.markAllAsTouched(); return; }

    const payload = {
      ...this.usuarioForm.value,
      id_area_fk: Number(this.usuarioForm.value.id_area_fk),
      id_cargo_fk: Number(this.usuarioForm.value.id_cargo_fk),
      id_empresa_fk: Number(this.usuarioForm.value.id_empresa_fk),
      id_perfil_fk: Number(this.usuarioForm.value.id_perfil_fk),
      id_tipoidentificacion_fk: Number(this.usuarioForm.value.id_tipoidentificacion_fk),
      id_detalle_usuario: this.idDetalleUsuarioEditar
    };

    if (this.isEditModeUsuario && this.usuarioIdEditar) {
      this.usuarioService.actualizarUsuario(this.usuarioIdEditar, payload).subscribe({
        next: () => { alert('Usuario actualizado exitosamente'); this.cargarUsuarios(); this.cerrarModal('usuario'); },
        error: () => alert('Error al actualizar el usuario.')
      });
    } else {
      this.usuarioService.createUsuario(payload).subscribe({
        next: () => { alert('Usuario creado exitosamente'); this.cargarUsuarios(); this.cerrarModal('usuario'); },
        error: () => alert('Error al crear el usuario.')
      });
    }
  }

  onSubmitPerfil(): void {
    if (this.perfilForm.invalid) { this.perfilForm.markAllAsTouched(); return; }

    const payload = { ...this.perfilForm.value };

    if (this.isEditModePerfil && this.perfilIdEditar) {
      this.perfilservices.actualizarPerfil(this.perfilIdEditar, payload).subscribe({
        next: () => { alert('Perfil actualizado exitosamente'); this.cargarPerfilLista(); this.cerrarModal('perfil'); },
        error: () => alert('Error al actualizar el perfil.')
      });
    } else {
      this.perfilservices.crearPerfil(payload).subscribe({
        next: () => { alert('Perfil creado exitosamente'); this.cargarPerfilLista(); this.cerrarModal('perfil'); },
        error: () => alert('Error al crear el perfil.')
      });
    }
  }

  // ======================================================
  //  PERMISOS — Sistemas externos
  // ======================================================

  seleccionarPerfil(p: Perfil): void {
    if (this.perfilSeleccionado === p.idPerfil) {
      this.perfilSeleccionado = null;
    } else {
      this.perfilSeleccionado = p.idPerfil!;
      this.perfilIdSeleccionado = p.idPerfil!;
      this.nombre_perfil = p.descripcionPerfil;
      this._cargarTodosLosPermisos(p.idPerfil!);
    }
  }

  togglePermiso(permiso: any): void {
    if (!this.perfilIdSeleccionado) return;

    const dto: AsignarPermiso = {
      idPerfilFk: this.perfilIdSeleccionado,
      idSistemaFk: permiso.idSistema
    };

    const estadoOriginal = permiso.tienePermiso;
    permiso.tienePermiso = !permiso.tienePermiso;
    const accion$ = permiso.tienePermiso
      ? this.perfilservices.asignarPermiso(dto)
      : this.perfilservices.eliminarPermiso(dto);

    accion$.subscribe({
      next: (ok: boolean) => { if (!ok) { permiso.tienePermiso = estadoOriginal; alert('Operación rechazada por el servidor.'); } },
      error: (err: any) => { console.error(err); permiso.tienePermiso = estadoOriginal; alert('No se pudo realizar la operación.'); }
    });
  }

  // ======================================================
  //  PERMISOS — Módulos internos
  // ======================================================

  cargarPermisosModulos(idPerfil: number): void {
    this.moduleConfigService.getPermisosByPerfil(idPerfil).subscribe({
      next: (permisos) => {
        this.modulos.forEach(mod =>
          mod.subModulos.forEach(sub => {
            const p = permisos.find(x => x.idSubModulo === sub.idSubModulo);
            if (p) sub.roles = p.roles;
          })
        );
      },
      error: (err) => console.error('Error al cargar permisos de módulos:', err)
    });
  }

  togglePermisoModulo(submodulo: SubModuloDTO, event: any): void {
    if (!this.perfilIdSeleccionado) { event.target.checked = false; return; }

    const isChecked = event.target.checked;
    const rolesOriginales = [...(submodulo.roles ?? [])];

    if (isChecked) {
      submodulo.roles ??= [];
      if (!submodulo.roles.includes(this.nombre_perfil)) submodulo.roles.push(this.nombre_perfil);
    } else {
      const idx = submodulo.roles?.indexOf(this.nombre_perfil) ?? -1;
      if (idx > -1) submodulo.roles!.splice(idx, 1);
    }

    this.moduleConfigService.asignarPermiso(this.perfilIdSeleccionado, submodulo.idSubModulo, isChecked).subscribe({
      next: () => { },
      error: (err) => {
        console.error('Error al asignar permiso:', err);
        submodulo.roles = rolesOriginales;
        event.target.checked = !isChecked;
        alert('Error al asignar permiso. Intente nuevamente.');
      }
    });
  }

  tienePermisoModulo(submodulo: SubModuloDTO): boolean {
    return !!this.nombre_perfil && (submodulo.roles?.includes(this.nombre_perfil) ?? false);
  }

  // ======================================================
  //  BLOQUEAR / DESBLOQUEAR USUARIO
  // ======================================================

  toggleBloqueo(usuario: Usuario): void {
    const nuevoEstado = !usuario.bloqueado;
    const accion = nuevoEstado ? 'bloquear' : 'desbloquear';
    const confirmar = confirm(`¿Desea ${accion} la cuenta de "${usuario.usuario}"?`);
    if (!confirmar) return;

    this.usuarioService.toggleBloqueo(usuario.idUsuario!, nuevoEstado).subscribe({
      next: () => {
        usuario.bloqueado = nuevoEstado;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar bloqueo:', err);
        alert('No se pudo cambiar el estado de bloqueo.');
      }
    });
  }

  // ======================================================
  //  ACORDEÓN
  // ======================================================

  toggleAcordeon(panel: 'sistemas' | 'modulos'): void {
    this.acordeonActivo = this.acordeonActivo === panel ? null : panel;

    // Carga lazy al abrir cada panel
    if (panel === 'modulos' && this.perfilIdSeleccionado) {
      this.cargarPermisosModulos(this.perfilIdSeleccionado);
    }
  }

  // ── Privado: carga ambos permisos al seleccionar perfil ──
  private _cargarTodosLosPermisos(idPerfil: number): void {
    this.perfilservices.obtenerpermisos(idPerfil).subscribe({
      next: (data) => { this.permisosXperfil = data; this.cdr.detectChanges(); },
      error: (err) => console.error('Error al cargar permisos de sistemas:', err)
    });
    this.cargarPermisosModulos(idPerfil);
  }
}