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
import { ConfiguracionSeguridadService, ConfiguracionSeguridad } from '../../../servicios/configuracionSeguridadService';

@Component({
  selector: 'app-usuarios',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {

  // ── Pestaña activa (como en metas) ────────────────────────
  activeTab: 'usuarios' | 'perfiles' | 'areas' | 'cargos' | 'empresas' = 'usuarios';

  // ── Formularios ──────────────────────────────────────────
  usuarioForm: FormGroup;
  perfilForm: FormGroup;
  areaForm: FormGroup;
  cargoForm: FormGroup;
  empresaForm: FormGroup;

  // ── Listas principales ───────────────────────────────────
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  perfiles: Perfil[] = [];
  perfilesFiltrados: Perfil[] = [];
  empresas: Empresa[] = [];
  empresasFiltradas: Empresa[] = [];
  cargos: Cargo[] = [];
  cargosFiltrados: Cargo[] = [];
  areas: Area[] = [];
  areasFiltradas: Area[] = [];
  tiposIdentificacion: TiposIdentificacion[] = [];

  // ── Búsqueda ─────────────────────────────────────────────
  searchUsuario = '';
  searchPerfil = '';
  searchArea = '';
  searchCargo = '';
  searchEmpresa = '';

  // ── Módulos y permisos ───────────────────────────────────
  modulos: ModuloDTO[] = [];
  permisosXperfil: any = [];

  // ── Estado de modales ────────────────────────────────────
  showModalUsuario = false;
  showModalPerfil = false;
  showModalCambiarClave = false;
  showModalArea = false;
  showModalCargo = false;
  showModalEmpresa = false;

  // ── Modos de modales ─────────────────────────────────────
  isEditModeUsuario = false;
  isViewModeUsuario = false; 
  isEditModePerfil = false;
  isEditModeArea = false;
  isEditModeCargo = false;
  isEditModeEmpresa = false;

  // ── IDs en edición ───────────────────────────────────────
  usuarioIdEditar: number | null = null;
  idDetalleUsuarioEditar: number | null = null;
  perfilIdEditar: number | null = null;
  areaIdEditar: number | null = null;
  cargoIdEditar: number | null = null;
  empresaIdEditar: number | null = null;

  // ── Selección para permisos ──────────────────────────────
  perfilSeleccionado: number | null = null;
  perfilIdSeleccionado: number | null = null;
  usuarioSeleccionadoPermisos: number | null = null;
  usuarioSeleccionado: Usuario | null = null;
  nombre_perfil = '';

  // ── Restablecer Clave (Admin) ───────────────────────────
  nuevaClaveAdmin = '';
  confirmarClaveAdmin = '';
  mostrarNuevaClave = false;
  mostrarConfirmarClave = false;

  // ── Acordeón (reemplaza pestañas) ────────────────────────
  acordeonActivo: 'sistemas' | 'modulos' | null = 'sistemas';
  configSeguridad: ConfiguracionSeguridad | null = null;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private listasServices: ListasService,
    private perfilservices: Perfilservices,
    private cdr: ChangeDetectorRef,
    private moduleConfigService: ModuleConfigService,
    private configSeguridadService: ConfiguracionSeguridadService
  ) {
    this.usuarioForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(4)]],
      contrasena: ['', [Validators.required]],
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

    this.areaForm = this.fb.group({
      descripcionArea: ['', [Validators.required, Validators.minLength(3)]],
      estado: [1]
    });

    this.cargoForm = this.fb.group({
      descripcionCargo: ['', [Validators.required, Validators.minLength(3)]],
      estado: [1]
    });

    this.empresaForm = this.fb.group({
      descripcionEmpresa: ['', [Validators.required, Validators.minLength(3)]],
      estado: [1]
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
    this.loadConfigSeguridad();
  }

  loadConfigSeguridad(): void {
    this.configSeguridadService.getConfiguracion().subscribe({
      next: (config) => {
        this.configSeguridad = config;
        // Actualizar validator de contraseña en el form
        const minLen = config.minCaracteres || 4;
        this.usuarioForm.get('contrasena')?.setValidators([Validators.required, Validators.minLength(minLen)]);
        this.usuarioForm.get('contrasena')?.updateValueAndValidity();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar config seguridad:', err)
    });
  }

  // ======================================================
  //  PESTAÑAS (Navegación estilo metas)
  // ======================================================

  switchTab(tab: 'usuarios' | 'perfiles' | 'areas' | 'cargos' | 'empresas'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  /**
   * Determina si un registro (Usuario, Perfil, Área, Cargo, Empresa o valor directo) está activo.
   * Regla del sistema: 1 / true = Activo, 0 / false = Inactivo.
   */
  isActivo(val: any): boolean {
    if (val === null || val === undefined) return false;
    let v = val;
    if (typeof val === 'object') {
      v = val.activo !== undefined && val.activo !== null ? val.activo : val.estado;
    }
    if (typeof v === 'boolean') {
      return v;
    }
    if (typeof v === 'number' || typeof v === 'string') {
      return Number(v) === 1;
    }
    return false;
  }

  // ── Helpers de validación ────────────────────────────────
  get f() { return this.usuarioForm.controls; }
  get pf() { return this.perfilForm.controls; }
  get af() { return this.areaForm.controls; }
  get cf() { return this.cargoForm.controls; }
  get ef() { return this.empresaForm.controls; }

  // ── Validaciones Clave Admin ───────────────────────────
  get tieneMayusculaAdmin(): boolean { return /[A-Z]/.test(this.nuevaClaveAdmin); }
  get tieneNumeroAdmin(): boolean    { return /[0-9]/.test(this.nuevaClaveAdmin); }
  get tieneCaracterEspecialAdmin(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.nuevaClaveAdmin); }
  get tieneLongitudAdmin(): boolean  { 
    const min = this.configSeguridad?.minCaracteres || 8;
    return this.nuevaClaveAdmin.length >= min; 
  }
  get tieneLetrasAdmin(): boolean { return /[a-zA-Z]/.test(this.nuevaClaveAdmin); }
  get passwordAdminValido(): boolean {
    if (!this.configSeguridad) return false;
    let valido = true;
    if (this.configSeguridad.minCaracteres > 0 && !this.tieneLongitudAdmin) valido = false;
    if (this.configSeguridad.requiereLetras && !this.tieneLetrasAdmin) valido = false;
    if (this.configSeguridad.requiereNumeros && !this.tieneNumeroAdmin) valido = false;
    if (this.configSeguridad.requiereEspeciales && !this.tieneCaracterEspecialAdmin) valido = false;
    return valido;
  }

  // ======================================================
  //  BÚSQUEDA & FILTROS
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

  filtrarAreas(): void {
    const term = this.searchArea.toLowerCase().trim();
    if (!term) { this.areasFiltradas = [...this.areas]; return; }

    this.areasFiltradas = this.areas.filter(a =>
      a.descripcionArea.toLowerCase().includes(term) ||
      String(a.idArea).includes(term)
    );
  }

  filtrarCargos(): void {
    const term = this.searchCargo.toLowerCase().trim();
    if (!term) { this.cargosFiltrados = [...this.cargos]; return; }

    this.cargosFiltrados = this.cargos.filter(c =>
      c.descripcionCargo.toLowerCase().includes(term) ||
      String(c.idCargo).includes(term)
    );
  }

  filtrarEmpresas(): void {
    const term = this.searchEmpresa.toLowerCase().trim();
    if (!term) { this.empresasFiltradas = [...this.empresas]; return; }

    this.empresasFiltradas = this.empresas.filter(e =>
      e.descripcionEmpresa.toLowerCase().includes(term) ||
      String(e.idEmpresa).includes(term)
    );
  }

  limpiarBusquedaUsuario(): void { this.searchUsuario = ''; this.filtrarUsuarios(); }
  limpiarBusquedaPerfil(): void { this.searchPerfil = ''; this.filtrarPerfiles(); }
  limpiarBusquedaArea(): void { this.searchArea = ''; this.filtrarAreas(); }
  limpiarBusquedaCargo(): void { this.searchCargo = ''; this.filtrarCargos(); }
  limpiarBusquedaEmpresa(): void { this.searchEmpresa = ''; this.filtrarEmpresas(); }

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
      next: (data) => {
        this.empresas = data;
        this.empresasFiltradas = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar empresas', err)
    });
  }

  cargarCargo(): void {
    this.listasServices.obtenerCargos().subscribe({
      next: (data) => {
        this.cargos = data;
        this.cargosFiltrados = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar cargos', err)
    });
  }

  cargarArea(): void {
    this.listasServices.obtenerAreas().subscribe({
      next: (data) => {
        this.areas = data;
        this.areasFiltradas = [...data];
        this.cdr.detectChanges();
      },
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
      ctrl.setValidators([Validators.required, Validators.minLength(this.configSeguridad?.minCaracteres || 4)]);
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
  //  MODALES Y ACCIONES PARA ÁREAS, CARGOS Y EMPRESAS
  // ======================================================

  // ── ÁREAS ──────────────────────────────────────────
  openCrearAreaModal(): void {
    this.isEditModeArea = false;
    this.areaIdEditar = null;
    this.areaForm.reset({ estado: 1 });
    this.showModalArea = true;
  }

  abrirEditarAreaModal(area: Area): void {
    this.isEditModeArea = true;
    this.areaIdEditar = area.idArea;
    this.areaForm.patchValue({
      descripcionArea: area.descripcionArea,
      estado: area.estado
    });
    this.showModalArea = true;
  }

  cerrarModalArea(): void {
    this.showModalArea = false;
    this.isEditModeArea = false;
    this.areaIdEditar = null;
    this.areaForm.reset();
  }

  onSubmitArea(): void {
    if (this.areaForm.invalid) { this.areaForm.markAllAsTouched(); return; }
    const payload: any = {
      descripcionArea: this.areaForm.value.descripcionArea,
      estado: Number(this.areaForm.value.estado)
    };

    if (this.isEditModeArea && this.areaIdEditar) {
      this.listasServices.actualizarArea(this.areaIdEditar, payload).subscribe({
        next: () => { alert('Área actualizada exitosamente'); this.cargarArea(); this.cerrarModalArea(); },
        error: (err) => {
          console.error('Error al actualizar área:', err);
          alert('Error al actualizar área: ' + (err.error?.message || err.message || 'Intente nuevamente.'));
        }
      });
    } else {
      this.listasServices.crearArea(payload).subscribe({
        next: () => { alert('Área creada exitosamente'); this.cargarArea(); this.cerrarModalArea(); },
        error: (err) => {
          console.error('Error al crear área:', err);
          alert('Error al crear área: ' + (err.error?.message || err.message || 'Intente nuevamente.'));
        }
      });
    }
  }

  // ── CARGOS ─────────────────────────────────────────
  openCrearCargoModal(): void {
    this.isEditModeCargo = false;
    this.cargoIdEditar = null;
    this.cargoForm.reset({ estado: 1 });
    this.showModalCargo = true;
  }

  abrirEditarCargoModal(cargo: Cargo): void {
    this.isEditModeCargo = true;
    this.cargoIdEditar = cargo.idCargo!;
    this.cargoForm.patchValue({
      descripcionCargo: cargo.descripcionCargo,
      estado: cargo.estado
    });
    this.showModalCargo = true;
  }

  cerrarModalCargo(): void {
    this.showModalCargo = false;
    this.isEditModeCargo = false;
    this.cargoIdEditar = null;
    this.cargoForm.reset();
  }

  onSubmitCargo(): void {
    if (this.cargoForm.invalid) { this.cargoForm.markAllAsTouched(); return; }
    const payload: any = {
      descripcionCargo: this.cargoForm.value.descripcionCargo,
      estado: Number(this.cargoForm.value.estado)
    };

    if (this.isEditModeCargo && this.cargoIdEditar) {
      this.listasServices.actualizarCargo(this.cargoIdEditar, payload).subscribe({
        next: () => { alert('Cargo actualizado exitosamente'); this.cargarCargo(); this.cerrarModalCargo(); },
        error: (err) => {
          console.error('Error al actualizar cargo:', err);
          alert('Error al actualizar cargo: ' + (err.error?.message || err.message || 'Intente nuevamente.'));
        }
      });
    } else {
      this.listasServices.crearCargo(payload).subscribe({
        next: () => { alert('Cargo creado exitosamente'); this.cargarCargo(); this.cerrarModalCargo(); },
        error: (err) => {
          console.error('Error al crear cargo:', err);
          alert('Error al crear cargo: ' + (err.error?.message || err.message || 'Intente nuevamente.'));
        }
      });
    }
  }

  // ── EMPRESAS ───────────────────────────────────────
  openCrearEmpresaModal(): void {
    this.isEditModeEmpresa = false;
    this.empresaIdEditar = null;
    this.empresaForm.reset({ estado: 1 });
    this.showModalEmpresa = true;
  }

  abrirEditarEmpresaModal(empresa: Empresa): void {
    this.isEditModeEmpresa = true;
    this.empresaIdEditar = empresa.idEmpresa;
    this.empresaForm.patchValue({
      descripcionEmpresa: empresa.descripcionEmpresa,
      estado: empresa.estado
    });
    this.showModalEmpresa = true;
  }

  cerrarModalEmpresa(): void {
    this.showModalEmpresa = false;
    this.isEditModeEmpresa = false;
    this.empresaIdEditar = null;
    this.empresaForm.reset();
  }

  onSubmitEmpresa(): void {
    if (this.empresaForm.invalid) { this.empresaForm.markAllAsTouched(); return; }
    const payload: any = {
      descripcionEmpresa: this.empresaForm.value.descripcionEmpresa,
      estado: Number(this.empresaForm.value.estado)
    };

    if (this.isEditModeEmpresa && this.empresaIdEditar) {
      this.listasServices.actualizarEmpresa(this.empresaIdEditar, payload).subscribe({
        next: () => { alert('Empresa actualizada exitosamente'); this.cargarEmpresa(); this.cerrarModalEmpresa(); },
        error: (err) => {
          console.error('Error al actualizar empresa:', err);
          alert('Error al actualizar empresa: ' + (err.error?.message || err.message || 'Intente nuevamente.'));
        }
      });
    } else {
      this.listasServices.crearEmpresa(payload).subscribe({
        next: () => { alert('Empresa creada exitosamente'); this.cargarEmpresa(); this.cerrarModalEmpresa(); },
        error: (err) => {
          console.error('Error al crear empresa:', err);
          alert('Error al crear empresa: ' + (err.error?.message || err.message || 'Intente nuevamente.'));
        }
      });
    }
  }

  // ======================================================
  //  PERMISOS — Selección por Usuario y Perfil
  // ======================================================

  seleccionarUsuarioPermisos(u: Usuario): void {
    if (this.usuarioSeleccionadoPermisos === u.idUsuario) {
      this.usuarioSeleccionadoPermisos = null;
      this.perfilSeleccionado = null;
      this.perfilIdSeleccionado = null;
      this.nombre_perfil = '';
      this.permisosXperfil = [];
    } else {
      this.usuarioSeleccionadoPermisos = u.idUsuario;
      this.perfilSeleccionado = u.id_perfil_fk;
      this.perfilIdSeleccionado = u.id_perfil_fk;
      const perfilObj = this.perfiles.find(p => p.idPerfil === u.id_perfil_fk);
      const nombrePerfil = perfilObj?.descripcionPerfil || u.descripcionPerfil || 'Perfil';
      this.nombre_perfil = `${u.usuario} — ${nombrePerfil}`;
      this._cargarTodosLosPermisos(u.id_perfil_fk);
    }
  }

  seleccionarPerfil(p: Perfil): void {
    if (this.perfilSeleccionado === p.idPerfil && this.usuarioSeleccionadoPermisos === null) {
      this.perfilSeleccionado = null;
      this.perfilIdSeleccionado = null;
      this.nombre_perfil = '';
      this.permisosXperfil = [];
    } else {
      this.usuarioSeleccionadoPermisos = null;
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