import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, LoginResponse } from '../../auth/authservices';
import { UsuarioService } from '../../servicios/usuarioservices';
import { homeservices } from '../../servicios/homeservices';
import { Usuario } from '../../models/usuario';
import { EventoAcceso, ResumenDiaPresentismo, EstadisticasMesPresentismo, ResumenSemanaMes, TurnoDiaInfo, SolicitudTiempoExtra, KpiPresentismoResumen, ColaboradorRankingPuntualidad, MarcacionErronea } from '../../models/presentismo';
import { TiempoExtraService } from '../../servicios/tiempo-extra.service';
import Swal from 'sweetalert2';

export interface UsuarioOrganigrama extends Usuario {
  nivelJerarquico: number;
  nombreNivel: string;
  badgeClass: string;
  initials: string;
}

export interface AreaGroup {
  nombreArea: string;
  usuarios: UsuarioOrganigrama[];
}

export interface NivelGroup {
  nivel: number;
  nombreNivel: string;
  usuarios: UsuarioOrganigrama[];
}

export interface AreaTreeGroup {
  nombreArea: string;
  liderDirector?: UsuarioOrganigrama | null;
  niveles: NivelGroup[];
}

export interface TreeNode {
  usuario: UsuarioOrganigrama;
  hijos: TreeNode[];
}

export interface DireccionTree {
  idDireccion?: number;
  nombreDireccion: string;
  nodosDireccion: TreeNode[];
}

export interface AreaPresentismo {
  idArea: number;
  nombreArea: string;
  direccion?: string;
  colaboradores: UsuarioOrganigrama[];
  totalColaboradores: number;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  readonly Math = Math;
  // Pestañas del Perfil
  activeTab: 'perfil' | 'asistencia' | 'organigrama' = 'perfil';

  // Control de Asistencia y Presentismo (Siesa Access)
  cedulaUsuario: string = '';
  presentismoMes: number = new Date().getMonth();
  presentismoAnio: number = new Date().getFullYear();
  cargandoPresentismo: boolean = false;
  diasMesPresentismo: ResumenDiaPresentismo[] = [];
  diaSeleccionadoPresentismo: ResumenDiaPresentismo | null = null;
  eventosPresentismoRaw: EventoAcceso[] = [];
  estadisticasPresentismo: EstadisticasMesPresentismo = {
    diasTrabajados: 0,
    horasTotales: '0h 0m',
    promedioEntrada: '--:--',
    estadoHoy: 'SIN_REGISTRO',
    primerIngresoHoy: '--:--',
    ultimaSalidaHoy: '--:--'
  };
  resumenSemanasMes: ResumenSemanaMes[] = [];
  presentismoViewMode: 'calendar' | 'list' = 'calendar';
  isModalDiaPresentismoOpen: boolean = false;

  // Tiempo Extra / Permanencia Adicional
  nuevaHoraExtra: number = 2;
  nuevaDescripcionExtra: string = '';
  mostrarFormularioTiempoExtra: boolean = false;
  solicitudesDiaSeleccionado: SolicitudTiempoExtra[] = [];
  aprobadorSeleccionadoId: string = '';

  // Datos del Usuario logueado (Todos los campos del formulario de usuario)
  usuario: LoginResponse | null = null;
  detallesFormulario: Usuario | null = null;

  fullName: string = 'Usuario';
  initials: string = 'U';
  primerNombre: string = '';
  primerApellido: string = '';
  usuarioNombre: string = '';
  userEmail: string = '';
  identificacion: string | number = '';
  tipoIdentificacion: string = 'Cédula de Ciudadanía';
  celular: string = '';
  fechaNacimiento: string = '';
  userRole: string = '';
  nameempresa: string = '';
  razonSocial: string = '';
  area: string = '';
  cargo: string = '';
  estadoUsuario: boolean | number = 1;
  bloqueadoUsuario: boolean = false;
  ultimaConexion: string = '';

  // Sección "Mi Equipo & Mapa Mental del Área"
  miNivelJerarquico: number = 6;
  nombreMiNivel: string = 'Auxiliar';
  miJefe: UsuarioOrganigrama | null = null;
  misCompanerosArea: UsuarioOrganigrama[] = [];
  misParesArea: UsuarioOrganigrama[] = [];
  misSubordinadosArea: UsuarioOrganigrama[] = [];
  arbolAreaPorNivel: NivelGroup[] = [];

  // Datos de Organigrama
  loadingOrganigrama = true;
  usuariosOrganigrama: UsuarioOrganigrama[] = [];
  usuariosFiltrados: UsuarioOrganigrama[] = [];

  // Vistas disponibles del organigrama: 'tree' | 'area' | 'grid'
  organigramaViewMode: 'tree' | 'area' | 'grid' = 'tree';

  // Filtros de organigrama
  searchQuery: string = '';
  selectedArea: string = '';
  selectedDireccion: string = '';
  selectedEmpresa: string = '';

  areasDisponibles: string[] = [];
  direccionesDisponibles: string[] = [];
  empresasDisponibles: string[] = [];

  gruposPorNivel: NivelGroup[] = [];
  gruposPorArea: AreaGroup[] = [];
  organigramaArbolPorArea: AreaTreeGroup[] = [];
  arbolAreaNodos: TreeNode[] = [];
  arbolEmpresaNodos: TreeNode[] = [];
  direccionesArbol: DireccionTree[] = [];

  // Configuración de niveles jerárquicos (1 al 6)
  private readonly nivelesMap: { [key: number]: { nombre: string; badge: string } } = {
    1: { nombre: 'Presidente', badge: 'nivel-1' },
    2: { nombre: 'Director', badge: 'nivel-2' },
    3: { nombre: 'Coordinador', badge: 'nivel-3' },
    4: { nombre: 'Analista', badge: 'nivel-4' },
    5: { nombre: 'Asistente', badge: 'nivel-5' },
    6: { nombre: 'Auxiliar', badge: 'nivel-6' },
  };

  // ── Edición de perfil ──
  modoEdicion = false;
  editNombre: string = '';
  editApellido: string = '';
  editCelular: string = '';
  editCorreo: string = '';
  editFechaNacimiento: string = '';
  editIdentificacion: string = '';
  guardandoPerfil = false;
  mensajeGuardado: string = '';
  errorGuardado: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private homeservice: homeservices,
    private tiempoExtraService: TiempoExtraService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.cargarDatosUsuario();
    this.cargarOrganigrama();
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'asistencia' || params['modal'] === 'presentismo') {
        this.isModalPresentismoOpen = true;
      } else if (params['tab'] === 'organigrama') {
        this.activeTab = 'organigrama';
      }
    });
    this.cargarEventosPresentismo();
  }

  isModalPresentismoOpen: boolean = false;

  // ── ESTADO DEL REDISEÑO DE PRESENTISMO ──
  activePresentismoTab: 'calendario' | 'detalle' | 'estadisticas' = 'calendario';
  sidebarPresentismoColapsado: boolean = false;
  busquedaColaboradorSupervisor: string = '';
  panelDiaSlideOverOpen: boolean = false;
  marcacionesErroneas: MarcacionErronea[] = [];
  modalMarcacionesErroneasOpen: boolean = false;
  cargandoMarcacionesErroneas: boolean = false;

  // ── FILTROS Y PAGINACIÓN EN TABLA DETALLE ──
  filtroEstadoDetalle: 'todos' | 'puntual' | 'tarde' | 'anticipada' | 'salida_tarde' | 'extra' | 'sin_registro' = 'todos';
  filtroTextoDetalle: string = '';
  columnaOrdenDetalle: string = 'fecha';
  ordenAscDetalle: boolean = false;
  paginaDetalleActual: number = 1;
  itemsPorPaginaDetalle: number = 10;

  // Control de Presentismo por Áreas (Para líderes: Cargos 1, 2 y 3)
  areasPresentismo: AreaPresentismo[] = [];
  areaSeleccionadaPresentismo: AreaPresentismo | null = null;
  colaboradorSeleccionadoPresentismo: UsuarioOrganigrama | null = null;
  modoVistaSupervisor: 'mi_calendario' | 'area' = 'mi_calendario';
  cedulaOriginalUsuario: string = '';

  get esLiderPresentismo(): boolean {
    const cargoId = Number(this.usuario?.id_cargo_fk || this.detallesFormulario?.id_cargo_fk || (this.usuario as any)?.idCargo || 0);
    const nivel = Number(this.miNivelJerarquico || 0);
    return [1, 2, 3].includes(cargoId) || [1, 2, 3].includes(nivel);
  }

  /**
   * Solo los usuarios con Cargo 1 y 2 (Presidente y Director) pueden acceder al módulo de estadísticas
   */
  get puedeVerEstadisticas(): boolean {
    const cargoId = Number(this.usuario?.id_cargo_fk || this.detallesFormulario?.id_cargo_fk || (this.usuario as any)?.idCargo || 0);
    const nivel = Number(this.miNivelJerarquico || 0);
    const cargoStr = (this.cargo || this.userRole || this.usuario?.cargo_descripcion || '').toLowerCase().trim();

    const esCargo1 = cargoId === 1 || nivel === 1 || cargoStr.includes('presidente') || cargoStr.includes('gerente general') || cargoStr.includes('ceo');
    const esCargo2 = cargoId === 2 || nivel === 2 || cargoStr.includes('director') || cargoStr.includes('directora');

    return esCargo1 || esCargo2;
  }

  generarAreasPresentismo(): void {
    if (!this.usuariosOrganigrama || this.usuariosOrganigrama.length === 0) {
      this.areasPresentismo = [];
      return;
    }

    const cargoId = Number(this.usuario?.id_cargo_fk || this.detallesFormulario?.id_cargo_fk || (this.usuario as any)?.idCargo || 0);
    const nivel = Number(this.miNivelJerarquico || 0);
    const esCargo1 = cargoId === 1 || nivel === 1;
    const esCargo2 = cargoId === 2 || nivel === 2;
    const esCargo3 = cargoId === 3 || nivel === 3;

    if (!esCargo1 && !esCargo2 && !esCargo3) {
      this.areasPresentismo = [];
      return;
    }

    const miDir = this.normalizarTexto(this.obtenerNombreDireccion(this.usuario as any));
    const miAreaId = Number(this.usuario?.id_area_fk || (this.usuario as any)?.idArea || 0);
    const miAreaNombre = this.normalizarTexto(this.area || this.usuario?.area_descripcion || '');

    const areaMap = new Map<string, { idArea: number; nombreArea: string; direccion?: string; colaboradores: UsuarioOrganigrama[] }>();

    this.usuariosOrganigrama.forEach(u => {
      const uAreaId = Number(u.id_area_fk || (u as any)?.idArea || 0);
      const uAreaNombre = (u.area || u.descripcionArea || 'General').trim();
      const uAreaNorm = this.normalizarTexto(uAreaNombre);
      const uDir = this.obtenerNombreDireccion(u);
      const uDirNorm = this.normalizarTexto(uDir);

      let tieneAcceso = false;

      if (esCargo1) {
        // Cargo 1 (Gerencia General / Presidencia): Ve todas las áreas
        tieneAcceso = true;
      } else if (esCargo2) {
        // Cargo 2 (Director): Ve las áreas de su Dirección o su área
        tieneAcceso = Boolean(miDir && uDirNorm && miDir === uDirNorm) || 
                      Boolean(miAreaId && uAreaId && miAreaId === uAreaId) ||
                      Boolean(miAreaNombre && uAreaNorm && miAreaNombre === uAreaNorm);
      } else if (esCargo3) {
        // Cargo 3 (Coordinador / Jefe): Ve su área
        tieneAcceso = Boolean(miAreaId && uAreaId && miAreaId === uAreaId) || 
                      Boolean(miAreaNombre && uAreaNorm && miAreaNombre === uAreaNorm);
      }

      if (tieneAcceso && uAreaNombre) {
        const key = uAreaNombre.toUpperCase();
        if (!areaMap.has(key)) {
          areaMap.set(key, {
            idArea: uAreaId,
            nombreArea: uAreaNombre,
            direccion: uDir,
            colaboradores: []
          });
        }
        areaMap.get(key)!.colaboradores.push(u);
      }
    });

    this.areasPresentismo = Array.from(areaMap.values()).map(a => ({
      ...a,
      totalColaboradores: a.colaboradores.length,
      colaboradores: a.colaboradores.sort((x, y) => `${x.nombre} ${x.apellido}`.localeCompare(`${y.nombre} ${y.apellido}`))
    })).sort((a, b) => a.nombreArea.localeCompare(b.nombreArea));

    // Seleccionar por defecto la propia área del usuario si existe, o la primera
    if (this.areasPresentismo.length > 0 && !this.areaSeleccionadaPresentismo) {
      const miAreaEncontrada = this.areasPresentismo.find(a => 
        (miAreaId && a.idArea === miAreaId) || 
        (miAreaNombre && this.normalizarTexto(a.nombreArea) === miAreaNombre)
      );
      this.areaSeleccionadaPresentismo = miAreaEncontrada || this.areasPresentismo[0];
    }
  }

  abrirModalPresentismo(area?: AreaPresentismo): void {
    if (this.areasPresentismo.length === 0 && this.usuariosOrganigrama.length > 0) {
      this.generarAreasPresentismo();
    }
    if (area) {
      this.modoVistaSupervisor = 'area';
      this.areaSeleccionadaPresentismo = area;
    } else {
      this.modoVistaSupervisor = 'mi_calendario';
      this.colaboradorSeleccionadoPresentismo = null;
    }
    if (this.activePresentismoTab === 'detalle') {
      this.activePresentismoTab = 'calendario';
    }
    this.isModalPresentismoOpen = true;
  }

  cerrarModalPresentismo(): void {
    this.isModalPresentismoOpen = false;
  }

  seleccionarAreaPresentismo(area: AreaPresentismo): void {
    this.modoVistaSupervisor = 'area';
    this.areaSeleccionadaPresentismo = area;
  }

  onAreaSeleccionadaChange(idArea: any): void {
    if (!idArea) return;
    const area = this.areasPresentismo.find(a => String(a.idArea) === String(idArea));
    if (area) {
      this.seleccionarAreaPresentismo(area);
      this.busquedaColaboradorSupervisor = '';
    }
  }

  abrirModalPresentismoPorSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const idArea = select.value;
    if (idArea) {
      const area = this.areasPresentismo.find(a => String(a.idArea) === String(idArea));
      if (area) {
        this.abrirModalPresentismo(area);
      }
      select.value = '';
    }
  }

  seleccionarColaboradorPresentismo(colab: UsuarioOrganigrama): void {
    if (!this.cedulaOriginalUsuario) {
      this.cedulaOriginalUsuario = this.cedulaUsuario;
    }
    this.modoVistaSupervisor = 'area';
    this.colaboradorSeleccionadoPresentismo = colab;
    this.cedulaUsuario = String(colab.identificacion || '').trim();
    this.cargarEventosPresentismo();
  }

  volverAMiPresentismo(): void {
    this.modoVistaSupervisor = 'mi_calendario';
    this.colaboradorSeleccionadoPresentismo = null;
    if (this.cedulaOriginalUsuario) {
      this.cedulaUsuario = this.cedulaOriginalUsuario;
    } else {
      const userString = localStorage.getItem('usuario');
      if (userString) {
        try {
          const u = JSON.parse(userString);
          this.cedulaUsuario = String(u.identificacion || u.cedula || u.documento || '').trim();
        } catch (e) {}
      }
    }
    this.cargarEventosPresentismo();
  }

  get diasMesHabiles(): ResumenDiaPresentismo[] {
    return this.diasMesPresentismo.filter(d => !d.esFinDeSemana);
  }

  irASeccionPerfil(tab: 'perfil' | 'asistencia'): void {
    this.activeTab = tab;
    if (tab === 'asistencia') {
      this.abrirModalPresentismo();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cargarDatosUsuario(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userStored = localStorage.getItem('usuario');
      if (userStored) {
        try {
          this.usuario = JSON.parse(userStored);
          if (this.usuario) {
            this.primerNombre = this.usuario.nombre || '';
            this.primerApellido = this.usuario.apellido || '';
            this.fullName = `${this.primerNombre} ${this.primerApellido}`.trim() || 'Usuario';
            this.initials = (this.primerNombre.charAt(0) + (this.primerApellido.charAt(0) || '')).toUpperCase() || 'U';
            this.userEmail = this.usuario.correo || '';
            this.userRole = this.usuario.perfil_descripcion || 'Usuario';
            this.nameempresa = this.usuario.empresa_descripcion || '';
            this.area = this.usuario.area_descripcion || '';
            this.cargo = this.usuario.cargo_descripcion || '';
            this.identificacion = this.usuario.identificacion || '';
            this.usuarioNombre = this.usuario.usuario || '';


          }
        } catch (e) {
          console.error('Error al parsear datos de usuario:', e);
        }
      }
    }
  }

  completaCamposDetalle(u: Usuario): void {
    this.detallesFormulario = u;
    this.primerNombre = u.nombre || this.primerNombre;
    this.primerApellido = u.apellido || this.primerApellido;
    this.fullName = `${this.primerNombre} ${this.primerApellido}`.trim() || this.fullName;
    this.initials = (this.primerNombre.charAt(0) + (this.primerApellido.charAt(0) || '')).toUpperCase() || 'U';
    this.userEmail = u.correo || this.userEmail;
    this.identificacion = u.identificacion || this.identificacion;
    this.usuarioNombre = u.usuario || this.usuarioNombre;
    this.userRole = u.descripcionPerfil || this.userRole;
    this.nameempresa = u.descripcionEmpresa || this.nameempresa;
    this.area = u.area || u.descripcionArea || this.area;
    this.cargo = u.cargo || this.cargo;
    this.celular = u.celular || '';
    this.fechaNacimiento = u.fechaNacimiento || '';
    this.razonSocial = u.razon_social || '';
    this.estadoUsuario = u.estado !== undefined ? u.estado : 1;
    this.bloqueadoUsuario = !!u.bloqueado;
    this.ultimaConexion = u.ultimaConexion || '';

    if (u.id_tipoidentificacion_fk === 1) this.tipoIdentificacion = 'Cédula de Ciudadanía';
    else if (u.id_tipoidentificacion_fk === 2) this.tipoIdentificacion = 'Cédula de Extranjería';
    else if (u.id_tipoidentificacion_fk === 3) this.tipoIdentificacion = 'NIT';
    else if (u.id_tipoidentificacion_fk === 4) this.tipoIdentificacion = 'Pasaporte';
    else this.tipoIdentificacion = 'Cédula de Ciudadanía';

    if (this.usuariosOrganigrama && this.usuariosOrganigrama.length > 0) {
      this.generarMiEquipo();
      this.generarArbolArea();
    }
  }

  cargarOrganigrama(): void {
    this.loadingOrganigrama = true;
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        // Filtrar exclusivamente colaboradores activos (estado/activo === 1 ó true)
        const soloActivos = data.filter(user => {
          const estadoVal = user.estado !== undefined ? user.estado : (user as any).activo;
          if (estadoVal === undefined || estadoVal === null) return true;
          return Number(estadoVal) === 1 || estadoVal === true;
        });

        this.usuariosOrganigrama = soloActivos.map(user => this.mapearUsuarioJerarquico(user));

        const yoEnLista = this.usuariosOrganigrama.find(u => this.esYo(u));
        if (yoEnLista) {
          this.completaCamposDetalle(yoEnLista);
        }

        this.extraerFiltrosOrganigrama();
        this.aplicarFiltrosOrganigrama();
        this.generarMiEquipo();
        this.generarArbolArea();
        this.generarAreasPresentismo();
        this.loadingOrganigrama = false;
      },
      error: (err) => {
        console.error('Error al cargar datos de organigrama:', err);
        this.loadingOrganigrama = false;
      }
    });
  }

  private mapearUsuarioJerarquico(user: Usuario): UsuarioOrganigrama {
    const cargoDesc = (user.cargo || user.descripcionPerfil || '').toLowerCase();
    let nivel = 6; // Por defecto Auxiliar

    if (cargoDesc.includes('presidente') || cargoDesc.includes('ceo') || cargoDesc.includes('gerente general')) {
      nivel = 1;
    } else if (cargoDesc.includes('director') || cargoDesc.includes('gerente') || cargoDesc.includes('vp')) {
      nivel = 2;
    } else if (cargoDesc.includes('coordinador') || cargoDesc.includes('jefe') || cargoDesc.includes('líder') || cargoDesc.includes('lider') || cargoDesc.includes('supervisor')) {
      nivel = 3;
    } else if (cargoDesc.includes('analista') || cargoDesc.includes('especialista') || cargoDesc.includes('profesional') || cargoDesc.includes('ingeniero') || cargoDesc.includes('desarrollador')) {
      nivel = 4;
    } else if (cargoDesc.includes('asistente') || cargoDesc.includes('secretaria') || cargoDesc.includes('asist')) {
      nivel = 5;
    } else if (cargoDesc.includes('auxiliar') || cargoDesc.includes('operativo') || cargoDesc.includes('tecnico') || cargoDesc.includes('técnico')) {
      nivel = 6;
    } else {
      if (user.id_cargo_fk >= 1 && user.id_cargo_fk <= 6) {
        nivel = user.id_cargo_fk;
      }
    }

    const nivelInfo = this.nivelesMap[nivel] || this.nivelesMap[6];
    const nombre = user.nombre || '';
    const apellido = user.apellido || '';
    const initials = (nombre.charAt(0) + (apellido.charAt(0) || '')).toUpperCase() || 'U';

    const userId = user.idUsuario || (user as any).id_usuario;

    return {
      ...user,
      idUsuario: userId,
      id_usuario: userId,
      id_area_fk: user.id_area_fk || (user as any).id_area_fk,
      id_cargo_fk: user.id_cargo_fk || (user as any).id_cargo_fk,
      area: user.area || user.descripcionArea || '',
      cargo: user.cargo || (user as any).descripcionCargo || '',
      nivelJerarquico: nivel,
      nombreNivel: nivelInfo.nombre,
      badgeClass: nivelInfo.badge,
      initials
    };
  }

  esYo(u: UsuarioOrganigrama): boolean {
    if (!this.usuario) return false;
    const miId = this.usuario.id_usuario || (this.usuario as any).idUsuario;
    const uId = u.idUsuario || (u as any).id_usuario;

    const miCorreo = (this.usuario.correo || '').toLowerCase().trim();
    const uCorreo = (u.correo || '').toLowerCase().trim();

    const miUser = (this.usuario.usuario || '').toLowerCase().trim();
    const uUser = (u.usuario || '').toLowerCase().trim();

    const matchId = Boolean(miId && uId && Number(miId) === Number(uId));
    const matchCorreo = Boolean(miCorreo && uCorreo && miCorreo === uCorreo);
    const matchUser = Boolean(miUser && uUser && miUser === uUser);

    return matchId || matchCorreo || matchUser;
  }

  normalizarTexto(str: string): string {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  generarMiEquipo(): void {
    if (!this.usuario) return;

    const miAreaNorm = this.normalizarTexto(this.area || this.usuario.area_descripcion);
    const miAreaId = this.usuario.id_area_fk;

    const miUsuarioActual = this.usuariosOrganigrama.find(u => this.esYo(u));

    if (miUsuarioActual) {
      this.miNivelJerarquico = miUsuarioActual.nivelJerarquico;
      this.nombreMiNivel = miUsuarioActual.nombreNivel;
    } else {
      const cargoDesc = (this.cargo || this.userRole || '').toLowerCase();
      if (cargoDesc.includes('presidente') || cargoDesc.includes('ceo') || cargoDesc.includes('gerente general')) this.miNivelJerarquico = 1;
      else if (cargoDesc.includes('director') || cargoDesc.includes('gerente')) this.miNivelJerarquico = 2;
      else if (cargoDesc.includes('coordinador') || cargoDesc.includes('jefe') || cargoDesc.includes('líder') || cargoDesc.includes('lider')) this.miNivelJerarquico = 3;
      else if (cargoDesc.includes('analista') || cargoDesc.includes('especialista') || cargoDesc.includes('profesional')) this.miNivelJerarquico = 4;
      else if (cargoDesc.includes('asistente') || cargoDesc.includes('secretaria')) this.miNivelJerarquico = 5;
      else this.miNivelJerarquico = 6;

      this.nombreMiNivel = this.nivelesMap[this.miNivelJerarquico]?.nombre || 'Colaborador';
    }

    const delMismoArea = this.usuariosOrganigrama.filter(u => {
      if (this.esYo(u)) return false;
      const uAreaNorm = this.normalizarTexto(u.area || u.descripcionArea);
      const matchId = Boolean(miAreaId && u.id_area_fk && miAreaId === u.id_area_fk);
      const matchNombre = Boolean(miAreaNorm && uAreaNorm && miAreaNorm === uAreaNorm);
      return matchId || matchNombre;
    });

    this.misCompanerosArea = delMismoArea;

    const superioresEnArea = delMismoArea
      .filter(u => u.nivelJerarquico < this.miNivelJerarquico)
      .sort((a, b) => b.nivelJerarquico - a.nivelJerarquico);

    if (superioresEnArea.length > 0) {
      this.miJefe = superioresEnArea[0];
    } else {
      const directoresGenerales = this.usuariosOrganigrama
        .filter(u => u.nivelJerarquico < this.miNivelJerarquico)
        .sort((a, b) => a.nivelJerarquico - b.nivelJerarquico);
      this.miJefe = directoresGenerales.length > 0 ? directoresGenerales[0] : null;
    }

    this.misParesArea = delMismoArea.filter(u => u.nivelJerarquico === this.miNivelJerarquico);
    this.misSubordinadosArea = delMismoArea.filter(u => u.nivelJerarquico > this.miNivelJerarquico);
  }

  generarArbolArea(): void {
    if (!this.usuario) return;

    const miAreaNorm = this.normalizarTexto(this.area || this.usuario.area_descripcion);
    const miAreaId = this.usuario.id_area_fk;
    const miDirNorm = this.normalizarTexto(this.obtenerNombreDireccion(this.usuario as any));

    let miembrosArea = this.usuariosOrganigrama.filter(u => {
      if (this.esYo(u)) return true;
      const uAreaNorm = this.normalizarTexto(u.area || u.descripcionArea);
      const uAreaId = u.id_area_fk;

      const matchId = Boolean(miAreaId && uAreaId && miAreaId === uAreaId);
      const matchNombre = Boolean(miAreaNorm && uAreaNorm && miAreaNorm === uAreaNorm);
      return matchId || matchNombre;
    });

    if (miembrosArea.length <= 1) {
      miembrosArea = this.usuariosOrganigrama.filter(u => {
        const uDirNorm = this.normalizarTexto(this.obtenerNombreDireccion(u));
        return miDirNorm && uDirNorm && miDirNorm === uDirNorm;
      });
    }

    if (miembrosArea.length === 0) {
      miembrosArea = [...this.usuariosOrganigrama];
    }

    const yaEstaEnLista = miembrosArea.some(u => this.esYo(u));
    if (!yaEstaEnLista) {
      const nombre = this.primerNombre || this.usuario.nombre || 'Usuario';
      const apellido = this.primerApellido || this.usuario.apellido || '';
      const yoNodo: UsuarioOrganigrama = {
        idUsuario: this.usuario.id_usuario,
        usuario: this.usuarioNombre || this.usuario.usuario,
        nombre: nombre,
        apellido: apellido,
        correo: this.userEmail || this.usuario.correo,
        cargo: this.cargo || this.userRole,
        area: this.area,
        descripcionArea: this.area,
        descripcionPerfil: this.userRole,
        descripcionEmpresa: this.nameempresa,
        id_area_fk: this.usuario.id_area_fk,
        id_cargo_fk: this.usuario.id_cargo_fk,
        id_perfil_fk: this.usuario.id_perfil_fk,
        id_empresa_fk: this.usuario.id_empresa_fk,
        id_tipoidentificacion_fk: 1,
        id_detalle_usuario: this.usuario.id_detalle_usuario,
        identificacion: String(this.identificacion),
        celular: this.celular,
        fechaNacimiento: this.fechaNacimiento,
        contrasena: '',
        estado: Number(this.estadoUsuario),
        razon_social: this.razonSocial || this.nameempresa,
        nivelJerarquico: this.miNivelJerarquico,
        nombreNivel: this.nombreMiNivel,
        badgeClass: this.nivelesMap[this.miNivelJerarquico]?.badge || 'nivel-6',
        initials: this.initials
      };
      miembrosArea.push(yoNodo);
    }

    const nivelesMapTemp = new Map<number, UsuarioOrganigrama[]>();
    miembrosArea.forEach(u => {
      const list = nivelesMapTemp.get(u.nivelJerarquico) || [];
      list.push(u);
      nivelesMapTemp.set(u.nivelJerarquico, list);
    });

    this.arbolAreaPorNivel = [];
    nivelesMapTemp.forEach((users, nivel) => {
      if (users.length > 0) {
        this.arbolAreaPorNivel.push({
          nivel,
          nombreNivel: this.nivelesMap[nivel]?.nombre || `Nivel ${nivel}`,
          usuarios: users.sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`))
        });
      }
    });

    this.arbolAreaPorNivel.sort((a, b) => a.nivel - b.nivel);
    this.arbolAreaNodos = this.construirArbolNodos(miembrosArea);
  }

  construirArbolNodos(usuarios: UsuarioOrganigrama[]): TreeNode[] {
    if (!usuarios || usuarios.length === 0) return [];

    const list = [...usuarios];

    const nivelesMap = new Map<number, UsuarioOrganigrama[]>();
    list.forEach(u => {
      const arr = nivelesMap.get(u.nivelJerarquico) || [];
      arr.push(u);
      nivelesMap.set(u.nivelJerarquico, arr);
    });

    const nivelesPresentes = Array.from(nivelesMap.keys()).sort((a, b) => a - b);
    if (nivelesPresentes.length === 0) return [];

    const nodeMap = new Map<UsuarioOrganigrama, TreeNode>();
    list.forEach(u => {
      nodeMap.set(u, { usuario: u, hijos: [] });
    });

    const minNivel = nivelesPresentes[0];
    const rootUsers = nivelesMap.get(minNivel) || [];
    const rootNodes: TreeNode[] = rootUsers.map(u => nodeMap.get(u)!);

    for (let n = 1; n < nivelesPresentes.length; n++) {
      const parentNivel = nivelesPresentes[n - 1];
      const childNivel = nivelesPresentes[n];

      const parentUsers = nivelesMap.get(parentNivel) || [];
      const childUsers = nivelesMap.get(childNivel) || [];

      if (parentUsers.length > 0 && childUsers.length > 0) {
        childUsers.forEach((childUser, cIdx) => {
          const childNode = nodeMap.get(childUser);
          if (!childNode) return;

          const cArea = (childUser.area || childUser.descripcionArea || '').toLowerCase().trim();
          let parentUser = parentUsers.find(pUser => {
            const pArea = (pUser.area || pUser.descripcionArea || '').toLowerCase().trim();
            return pArea && cArea && pArea === cArea;
          });

          if (!parentUser) {
            parentUser = parentUsers[cIdx % parentUsers.length];
          }

          const parentNode = nodeMap.get(parentUser);
          if (parentNode && !parentNode.hijos.includes(childNode)) {
            parentNode.hijos.push(childNode);
          }
        });
      }
    }

    return rootNodes;
  }

  // Mapa exacto de Direcciones según BD (id_direccion)
  private readonly direccionesMapBD: { [idDir: number]: string } = {
    1: 'Presidencia',
    2: 'Financiero',
    3: 'Planta',
    4: 'Comercial',
    5: 'Sig',
    6: 'Operaciones',
    7: 'Gestión Humana',
  };

  // Mapa exacto de Áreas a ID de Dirección (id_area_fk -> id_direccion_fk) según la tabla 'area' de la BD
  private readonly areaToDireccionMapBD: { [idArea: number]: number } = {
    18: 1, 19: 1,                          // Presidencia, Control Interno -> Presidencia (1)
    3: 7,                                  // Gestión Humana -> Gestión Humana (7)
    2: 2, 4: 2, 8: 2, 10: 2, 11: 2,        // Tecnología, Planeación Financiera, Contabilidad, Tesorería, Administrativo -> Financiero (2)
    5: 3, 6: 3,                            // Mantenimiento, Producción -> Planta (3)
    7: 4, 9: 4, 13: 4, 16: 4,              // Abastecimiento, Logística, Compras, Almacén -> Comercial (4)
    12: 5, 14: 5, 15: 5, 17: 5,            // Hseq, Laboratorio, Sig, Documental -> Sig (5)
  };

  obtenerNombreDireccion(u: UsuarioOrganigrama): string {
    // 1. Si la API devuelve id_direccion_fk explícito
    if ((u as any).id_direccion_fk && this.direccionesMapBD[(u as any).id_direccion_fk]) {
      return this.direccionesMapBD[(u as any).id_direccion_fk];
    }

    // 2. Si el objeto trae nombre de dirección explícito
    const explicitDir = u.direccion || u.descripcionDireccion || (u as any).nombreDireccion || (u as any).nombre_direccion;
    if (explicitDir && typeof explicitDir === 'string' && explicitDir.trim() && !explicitDir.toLowerCase().includes('usuario')) {
      return explicitDir.trim();
    }

    // 3. Mapeo por id_area_fk exacto de la tabla BD
    const areaId = u.id_area_fk;
    if (areaId && this.areaToDireccionMapBD[areaId]) {
      const dirId = this.areaToDireccionMapBD[areaId];
      return this.direccionesMapBD[dirId] || 'Presidencia';
    }

    // 4. Mapeo por texto de área (normalizado sin tildes)
    const lowerArea = this.normalizarTexto(u.area || u.descripcionArea || '');

    if (lowerArea.includes('gestion humana') || lowerArea.includes('talento humano')) {
      return 'Gestión Humana';
    }
    if (lowerArea.includes('presidencia') || lowerArea.includes('control interno')) {
      return 'Presidencia';
    }
    if (lowerArea.includes('tecnolog') || lowerArea.includes('planeacion financiera') || lowerArea.includes('contabilid') || lowerArea.includes('tesorer') || lowerArea.includes('administrativ')) {
      return 'Financiero';
    }
    if (lowerArea.includes('mantenimiento') || lowerArea.includes('produccion') || lowerArea.includes('planta')) {
      return 'Planta';
    }
    if (lowerArea.includes('abastecimiento') || lowerArea.includes('logistica') || lowerArea.includes('compras') || lowerArea.includes('almacen') || lowerArea.includes('comercial')) {
      return 'Comercial';
    }
    if (lowerArea.includes('hseq') || lowerArea.includes('laboratorio') || lowerArea.includes('sig') || lowerArea.includes('documental')) {
      return 'Sig';
    }
    if (lowerArea.includes('operacion') || lowerArea.includes('operaciones')) {
      return 'Operaciones';
    }

    return 'Presidencia';
  }

  extraerFiltrosOrganigrama(): void {
    const areasSet = new Set<string>();
    const direccionesSet = new Set<string>();
    const empresasSet = new Set<string>();

    this.usuariosOrganigrama.forEach(u => {
      const areaName = u.area || u.descripcionArea;
      if (areaName) areasSet.add(areaName);

      const dirName = this.obtenerNombreDireccion(u);
      if (dirName) direccionesSet.add(dirName);

      const emp = u.descripcionEmpresa || u.razon_social;
      if (emp) empresasSet.add(emp);
    });

    this.areasDisponibles = Array.from(areasSet).sort();
    this.direccionesDisponibles = Array.from(direccionesSet).sort();
    this.empresasDisponibles = Array.from(empresasSet).sort();
  }

  aplicarFiltrosOrganigrama(): void {
    let result = [...this.usuariosOrganigrama];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(u =>
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
        (u.cargo && u.cargo.toLowerCase().includes(q)) ||
        (u.correo && u.correo.toLowerCase().includes(q)) ||
        (u.area && u.area.toLowerCase().includes(q)) ||
        (u.descripcionArea && u.descripcionArea.toLowerCase().includes(q)) ||
        this.obtenerNombreDireccion(u).toLowerCase().includes(q)
      );
    }

    if (this.selectedDireccion) {
      result = result.filter(u => this.obtenerNombreDireccion(u) === this.selectedDireccion);
    }

    if (this.selectedArea) {
      result = result.filter(u => (u.area || u.descripcionArea) === this.selectedArea);
    }

    if (this.selectedEmpresa) {
      result = result.filter(u => (u.descripcionEmpresa || u.razon_social) === this.selectedEmpresa);
    }

    this.usuariosFiltrados = result;
    this.generarAgrupacionesOrganigrama();
  }

  generarAgrupacionesOrganigrama(): void {
    // 1. Grupos por Nivel General (1 al 6)
    const nivelesMapTemp = new Map<number, UsuarioOrganigrama[]>();
    for (let i = 1; i <= 6; i++) {
      nivelesMapTemp.set(i, []);
    }

    this.usuariosFiltrados.forEach(u => {
      const list = nivelesMapTemp.get(u.nivelJerarquico) || [];
      list.push(u);
      nivelesMapTemp.set(u.nivelJerarquico, list);
    });

    this.gruposPorNivel = [];
    nivelesMapTemp.forEach((users, nivel) => {
      if (users.length > 0) {
        this.gruposPorNivel.push({
          nivel,
          nombreNivel: this.nivelesMap[nivel]?.nombre || `Nivel ${nivel}`,
          usuarios: users.sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`))
        });
      }
    });

    this.gruposPorNivel.sort((a, b) => a.nivel - b.nivel);

    // 2. Estructura Jerárquica Unificada por Dirección (Director -> Jefes/Coordinadores de cada área -> Analistas -> Asistentes)
    const direccionesMap = new Map<string, UsuarioOrganigrama[]>();

    this.usuariosFiltrados.forEach(u => {
      const dirName = this.obtenerNombreDireccion(u);
      const list = direccionesMap.get(dirName) || [];
      list.push(u);
      direccionesMap.set(dirName, list);
    });

    this.direccionesArbol = [];

    direccionesMap.forEach((usersInDir, nombreDireccion) => {
      this.direccionesArbol.push({
        nombreDireccion,
        nodosDireccion: this.construirArbolNodos(usersInDir)
      });
    });

    this.direccionesArbol.sort((a, b) => a.nombreDireccion.localeCompare(b.nombreDireccion));
  }

  setTab(tab: 'perfil' | 'organigrama'): void {
    this.activeTab = tab;
  }

  setOrganigramaViewMode(mode: 'tree' | 'area' | 'grid'): void {
    this.organigramaViewMode = mode;
  }

  seleccionarDireccion(dir: string): void {
    this.selectedDireccion = dir;
    this.aplicarFiltrosOrganigrama();
  }

  limpiarFiltrosOrganigrama(): void {
    this.searchQuery = '';
    this.selectedArea = '';
    this.selectedDireccion = '';
    this.selectedEmpresa = '';
    this.aplicarFiltrosOrganigrama();
  }

  // ─────────────────────────────────────────────
  // EDICIÓN DE PERFIL
  // ─────────────────────────────────────────────
  activarEdicion(): void {
    this.editNombre = this.primerNombre;
    this.editApellido = this.primerApellido;
    this.editCelular = this.celular;
    this.editCorreo = this.userEmail;
    this.editFechaNacimiento = this.fechaNacimiento;
    this.editIdentificacion = String(this.identificacion);
    this.modoEdicion = true;
    this.mensajeGuardado = '';
    this.errorGuardado = '';
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.mensajeGuardado = '';
    this.errorGuardado = '';
  }

  guardarPerfil(): void {
    if (!this.usuario || !this.usuario.id_usuario) {
      this.errorGuardado = 'No se encontró la sesión del usuario.';
      return;
    }

    if (!this.editNombre.trim() || !this.editApellido.trim()) {
      this.errorGuardado = 'El nombre y apellido son obligatorios.';
      return;
    }

    this.guardandoPerfil = true;
    this.errorGuardado = '';
    this.mensajeGuardado = '';

    // Construir payload limpio con únicamente los campos que la API / DTO backend espera
    const payload: any = {
      id_detalle_usuario: Number(this.detallesFormulario?.id_detalle_usuario || this.usuario.id_detalle_usuario || 0),
      usuario: (this.usuarioNombre || this.usuario.usuario || '').trim(),
      nombre: this.editNombre.trim(),
      apellido: this.editApellido.trim(),
      identificacion: this.editIdentificacion.trim(),
      correo: this.editCorreo.trim(),
      celular: this.editCelular.trim(),
      fechaNacimiento: this.editFechaNacimiento,
      razon_social: this.razonSocial || null,
      id_area_fk: Number(this.detallesFormulario?.id_area_fk || this.usuario.id_area_fk || 0),
      id_cargo_fk: Number(this.detallesFormulario?.id_cargo_fk || this.usuario.id_cargo_fk || 0),
      id_empresa_fk: Number(this.detallesFormulario?.id_empresa_fk || this.usuario.id_empresa_fk || 0),
      id_perfil_fk: Number(this.detallesFormulario?.id_perfil_fk || this.usuario.id_perfil_fk || 0),
      id_tipoidentificacion_fk: Number(this.detallesFormulario?.id_tipoidentificacion_fk || (this.usuario as any).id_tipoidentificacion_fk || 1),
      estado: this.estadoUsuario !== undefined ? (typeof this.estadoUsuario === 'boolean' ? this.estadoUsuario : Number(this.estadoUsuario) === 1) : true,
    };

    // Temporizador de respaldo por si la red/respuesta no responde
    const timeoutSafety = setTimeout(() => {
      if (this.guardandoPerfil) {
        this.guardandoPerfil = false;
        this.errorGuardado = 'La solicitud tardó demasiado. Por favor verifica si se guardó.';
        this.cdr.detectChanges();
      }
    }, 12000);

    this.usuarioService.actualizarUsuario(this.usuario.id_usuario, payload).subscribe({
      next: () => {
        clearTimeout(timeoutSafety);
        this.guardandoPerfil = false;
        this.modoEdicion = false;

        try {
          // Actualizar los valores mostrados
          this.primerNombre = this.editNombre.trim();
          this.primerApellido = this.editApellido.trim();
          this.fullName = `${this.primerNombre} ${this.primerApellido}`.trim();
          this.initials = (this.primerNombre.charAt(0) + (this.primerApellido.charAt(0) || '')).toUpperCase();
          this.userEmail = this.editCorreo.trim();
          this.celular = this.editCelular.trim();
          this.fechaNacimiento = this.editFechaNacimiento;
          this.identificacion = this.editIdentificacion.trim();

          // Actualizar localStorage
          if (isPlatformBrowser(this.platformId)) {
            const storedStr = localStorage.getItem('usuario');
            if (storedStr) {
              const stored = JSON.parse(storedStr);
              stored.nombre = this.primerNombre;
              stored.apellido = this.primerApellido;
              stored.correo = this.userEmail;
              stored.identificacion = this.identificacion;
              localStorage.setItem('usuario', JSON.stringify(stored));
            }
          }

          this.mensajeGuardado = '✅ Perfil actualizado correctamente.';

          Swal.fire({
            icon: 'success',
            title: '¡Perfil Actualizado!',
            text: 'Tus datos fueron guardados correctamente.',
            timer: 2500,
            showConfirmButton: false
          });

          setTimeout(() => {
            this.mensajeGuardado = '';
            this.cdr.detectChanges();
          }, 4000);
        } catch (err) {
          console.error('Error post-guardado:', err);
        } finally {
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        clearTimeout(timeoutSafety);
        this.guardandoPerfil = false;
        console.error('Error al actualizar perfil:', err);
        this.errorGuardado = err?.error?.message || err?.error?.error || err?.message || 'Error al guardar. Intenta de nuevo.';
        this.cdr.detectChanges();

        Swal.fire({
          icon: 'error',
          title: 'Error al Guardar',
          text: this.errorGuardado
        });
      }
    });
  }

  irAHome(): void {
    this.router.navigate(['/home']);
  }

  logout(): void {
    this.authService.logout();
  }

  // ========================================
  // CONTROL DE ASISTENCIA Y PRESENTISMO (SIESA ACCESS)
  // ========================================
  get nombreMesPresentismo(): string {
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${nombresMeses[this.presentismoMes]} ${this.presentismoAnio}`;
  }

  get puedeAvanzarMes(): boolean {
    const hoy = new Date();
    if (this.presentismoAnio < hoy.getFullYear()) return true;
    if (this.presentismoAnio === hoy.getFullYear()) {
      return this.presentismoMes < hoy.getMonth();
    }
    return false;
  }

  cambiarMesPresentismo(delta: number): void {
    if (delta > 0 && !this.puedeAvanzarMes) {
      return; // Bloqueado: no se puede avanzar a meses futuros
    }
    let nuevoMes = this.presentismoMes + delta;
    if (nuevoMes < 0) {
      this.presentismoMes = 11;
      this.presentismoAnio--;
    } else if (nuevoMes > 11) {
      this.presentismoMes = 0;
      this.presentismoAnio++;
    } else {
      this.presentismoMes = nuevoMes;
    }
    this.cargarEventosPresentismo();
  }

  irAMesActualPresentismo(): void {
    const hoy = new Date();
    this.presentismoMes = hoy.getMonth();
    this.presentismoAnio = hoy.getFullYear();
    this.cargarEventosPresentismo();
  }

  get cedulaColaboradorActual(): string {
    if (this.colaboradorSeleccionadoPresentismo) {
      return String(this.colaboradorSeleccionadoPresentismo.identificacion || '').trim();
    }
    return String(this.cedulaUsuario || this.identificacion || '').trim();
  }

  get correoColaboradorActual(): string {
    if (this.colaboradorSeleccionadoPresentismo) {
      return (this.colaboradorSeleccionadoPresentismo.correo || '').trim().toLowerCase();
    }
    return (this.userEmail || this.usuario?.correo || '').trim().toLowerCase();
  }

  /**
   * Lista de usuarios disponibles para aprobar tiempo extra.
   * Regla de negocio: Solo deben salir los que tienen cargo 1 y 2 (Presidente y Director).
   * Quien solicita el tiempo extra NUNCA aparece en esta lista.
   */
  get aprobadoresDisponibles(): { id: string; nombre: string; correo: string; cargo: string; area: string; esLiderDirecto?: boolean }[] {
    const miCedula = this.cedulaColaboradorActual;
    const miCorreo = this.correoColaboradorActual;

    if (!this.usuariosOrganigrama || this.usuariosOrganigrama.length === 0) {
      return [
        { id: 'presidencia', nombre: 'Presidencia / Gerencia General', correo: '', cargo: 'Presidente', area: 'Presidencia', esLiderDirecto: false },
        { id: 'direccion', nombre: 'Dirección de Área', correo: '', cargo: 'Director', area: 'Dirección', esLiderDirecto: true }
      ];
    }

    const miAreaId = Number(this.usuario?.id_area_fk || (this.usuario as any)?.idArea || 0);
    const miAreaNombre = (this.area || this.usuario?.area_descripcion || '').trim().toLowerCase();
    const miDir = this.normalizarTexto(this.obtenerNombreDireccion(this.usuario as any));

    // 1. Filtrar ESTRICTAMENTE usuarios con cargo 1 y 2, excluyendo de raíz al colaborador solicitante
    const candidatos = this.usuariosOrganigrama.filter(u => {
      const uCedula = String(u.identificacion || '').trim();
      const uCorreo = (u.correo || '').trim().toLowerCase();

      // EXCLUSIÓN: El que solicita jamás debe aparecer en la lista de aprobadores
      if ((miCedula && uCedula === miCedula) || (miCorreo && uCorreo === miCorreo)) {
        return false;
      }

      const nivel = Number(u.nivelJerarquico || 0);
      const cargoId = Number(u.id_cargo_fk || (u as any)?.idCargo || 0);
      const cargoStr = (u.cargo || u.descripcionCargo || '').toLowerCase().trim();

      // Excluir cargos 3 en adelante expresamente si vinieran en el texto
      const esCargoOperativoOMedio = cargoStr.includes('coordinador') || 
                                     cargoStr.includes('analista') || 
                                     cargoStr.includes('asistente') || 
                                     cargoStr.includes('auxiliar') || 
                                     cargoStr.includes('practicante') || 
                                     cargoStr.includes('aprendiz') || 
                                     cargoStr.includes('operario');

      if (esCargoOperativoOMedio) {
        return false;
      }

      // Debe ser Cargo 1 (Presidente/Gerente General) o Cargo 2 (Director)
      const esCargo1 = nivel === 1 || cargoId === 1 || cargoStr.includes('presidente') || cargoStr.includes('gerente general') || cargoStr.includes('ceo');
      const esCargo2 = nivel === 2 || cargoId === 2 || cargoStr.includes('director') || cargoStr.includes('directora');

      return esCargo1 || esCargo2;
    });

    const listaFinal = candidatos.length > 0
      ? candidatos
      : this.usuariosOrganigrama.filter(u => {
          const uCedula = String(u.identificacion || '').trim();
          const uCorreo = (u.correo || '').trim().toLowerCase();
          if ((miCedula && uCedula === miCedula) || (miCorreo && uCorreo === miCorreo)) return false;
          const cargoStr = (u.cargo || u.descripcionCargo || '').toLowerCase().trim();
          return cargoStr.includes('director') || cargoStr.includes('presidente') || cargoStr.includes('gerente');
        });

    const res = listaFinal.map(u => {
      const uAreaId = Number(u.id_area_fk || (u as any)?.idArea || 0);
      const uAreaNombre = (u.area || u.descripcionArea || '').trim().toLowerCase();
      const uDir = this.normalizarTexto(this.obtenerNombreDireccion(u));
      const esMismaDireccion = Boolean(miDir && uDir && miDir === uDir);
      const esMismaArea = Boolean((miAreaId && uAreaId === miAreaId) || (miAreaNombre && uAreaNombre === miAreaNombre));
      const idVal = String(u.identificacion || u.correo || u.idUsuario || '').trim();
      return {
        id: idVal,
        nombre: `${u.nombre} ${u.apellido}`.trim(),
        correo: (u.correo || '').trim(),
        cargo: u.cargo || u.descripcionCargo || 'Director',
        area: u.area || u.descripcionArea || 'Dirección',
        esLiderDirecto: Boolean(esMismaArea || esMismaDireccion)
      };
    });

    return res.sort((a, b) => {
      if (a.esLiderDirecto && !b.esLiderDirecto) return -1;
      if (!a.esLiderDirecto && b.esLiderDirecto) return 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }

  get aprobadorSeleccionadoActual(): { id: string; nombre: string; correo: string; cargo: string } {
    const lista = this.aprobadoresDisponibles;
    if (!lista || lista.length === 0) {
      return { id: '', nombre: 'Líder / Jefe de Área', correo: '', cargo: 'Líder' };
    }
    const encontrado = lista.find(a => a.id === this.aprobadorSeleccionadoId);
    if (encontrado) return encontrado;
    return lista[0];
  }

  seleccionarDiaPresentismo(dia: ResumenDiaPresentismo): void {
    this.diaSeleccionadoPresentismo = dia;
    this.panelDiaSlideOverOpen = true;
    this.mostrarFormularioTiempoExtra = false;
    this.nuevaHoraExtra = 2;
    this.nuevaDescripcionExtra = '';
    const disp = this.aprobadoresDisponibles;
    if (disp.length > 0) {
      this.aprobadorSeleccionadoId = disp[0].id;
    }
    this.cargarSolicitudesDia(dia.fechaKey);
    this.isModalDiaPresentismoOpen = true;
  }

  cerrarModalDiaPresentismo(): void {
    this.isModalDiaPresentismoOpen = false;
    this.panelDiaSlideOverOpen = false;
  }

  abrirDetalleDiaSlideOver(dia: ResumenDiaPresentismo): void {
    this.seleccionarDiaPresentismo(dia);
  }

  cerrarDetalleDiaSlideOver(): void {
    this.cerrarModalDiaPresentismo();
  }

  cargarSolicitudesDia(fechaKey: string): void {
    this.solicitudesDiaSeleccionado = this.tiempoExtraService.obtenerPorDiaCualquierColaborador(fechaKey);
    if (this.diaSeleccionadoPresentismo) {
      this.diaSeleccionadoPresentismo.solicitudesTiempoExtra = this.solicitudesDiaSeleccionado;
    }
  }

  obtenerTiempoExtraDia(dia: ResumenDiaPresentismo | null): SolicitudTiempoExtra | undefined {
    if (!dia) return undefined;
    const sols = this.tiempoExtraService.obtenerPorDiaCualquierColaborador(dia.fechaKey);
    // Prioridad: APROBADO > PENDIENTE > cualquier otro
    return sols.find(s => s.estado === 'APROBADO') || sols.find(s => s.estado === 'PENDIENTE') || sols[0];
  }

  /**
   * Cálculo de Tiempo Extra detectado físicamente por el biométrico SIESA:
   * Si el colaborador se retiró después de las 17:30 (ej. 137 minutos después),
   * calcula exactamente cuántas horas y minutos extra representa:
   * 137 min -> 2 horas y 17 min (+2h 17m / +2.28h).
   */
  calcularExtraBiometrico(dia: ResumenDiaPresentismo | null): { minutos: number; horasEnteras: number; minutosRestantes: number; textoHoras: string; decimalTexto: string } | null {
    if (!dia || !dia.ultimaSalida) return null;

    let minutosExtra = 0;
    if (dia.esFinDeSemana) {
      minutosExtra = dia.totalMinutos || 0;
    } else {
      const dif = this.difSalida(dia);
      if (dif !== null && dif > 0) {
        minutosExtra = dif;
      }
    }

    if (minutosExtra <= 0) {
      return null;
    }

    const h = Math.floor(minutosExtra / 60);
    const m = minutosExtra % 60;
    const dec = (minutosExtra / 60).toFixed(2);

    return {
      minutos: minutosExtra,
      horasEnteras: h,
      minutosRestantes: m,
      textoHoras: h > 0 ? `+${h}h ${String(m).padStart(2, '0')}m` : `+${m}m`,
      decimalTexto: `+${dec}h`
    };
  }

  toggleFormularioTiempoExtra(): void {
    this.mostrarFormularioTiempoExtra = !this.mostrarFormularioTiempoExtra;
    if (this.mostrarFormularioTiempoExtra) {
      const disp = this.aprobadoresDisponibles;
      if (!this.aprobadorSeleccionadoId || !disp.some(a => a.id === this.aprobadorSeleccionadoId)) {
        if (disp.length > 0) {
          this.aprobadorSeleccionadoId = disp[0].id;
        }
      }
    }
  }

  setHorasExtraRapidas(horas: number): void {
    this.nuevaHoraExtra = horas;
  }

  solicitarTiempoExtra(): void {
    if (!this.diaSeleccionadoPresentismo) return;

    if (!this.nuevaDescripcionExtra || !this.nuevaDescripcionExtra.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Motivo requerido',
        text: 'Por favor ingresa una descripción o motivo para el tiempo extra.',
        confirmButtonColor: '#0a5c2e'
      });
      return;
    }

    if (!this.nuevaHoraExtra || this.nuevaHoraExtra <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad requerida',
        text: 'La cantidad de horas extra debe ser mayor a 0.',
        confirmButtonColor: '#0a5c2e'
      });
      return;
    }

    const nombreColab = this.colaboradorSeleccionadoPresentismo
      ? `${this.colaboradorSeleccionadoPresentismo.nombre} ${this.colaboradorSeleccionadoPresentismo.apellido}`
      : (this.fullName || this.usuario?.nombre || 'Colaborador');

    const cedulaColab = this.colaboradorSeleccionadoPresentismo
      ? String(this.colaboradorSeleccionadoPresentismo.identificacion || '')
      : String(this.cedulaUsuario || this.identificacion || '');

    const aprobador = this.aprobadorSeleccionadoActual;

    const nueva = this.tiempoExtraService.crearSolicitud({
      fechaKey: this.diaSeleccionadoPresentismo.fechaKey,
      cedulaColaborador: cedulaColab,
      nombreColaborador: nombreColab,
      horas: Number(this.nuevaHoraExtra),
      descripcion: this.nuevaDescripcionExtra.trim(),
      aprobadorAsignado: aprobador.nombre,
      correoAprobador: aprobador.correo
    });

    this.cargarSolicitudesDia(this.diaSeleccionadoPresentismo.fechaKey);
    this.mostrarFormularioTiempoExtra = false;
    this.nuevaDescripcionExtra = '';
    this.nuevaHoraExtra = 2;

    Swal.fire({
      icon: 'success',
      title: '¡Solicitud registrada!',
      html: `Se registraron <strong>+${nueva.horas} horas extra</strong> para el día <strong>${this.diaSeleccionadoPresentismo.fechaKey}</strong>.<br><br>
             <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; text-align:left; font-size:13px; color:#14532d;">
               <div><strong>Aprobador asignado:</strong> ${aprobador.nombre}</div>
               ${aprobador.correo ? `<div><i class="bi bi-envelope-check"></i> Notificación enviada a: <em>${aprobador.correo}</em></div>` : ''}
               <div style="margin-top:6px; color:#b45309; font-weight:600;">⏳ Estado: Pendiente de Aprobación</div>
             </div>`,
      confirmButtonColor: '#0a5c2e',
      timer: 4000
    });
  }

  obtenerLiderAprobadorColaborador(): { nombre: string; correo: string; cargo: string } {
    return this.aprobadorSeleccionadoActual;
  }

  esCreadorDeSolicitud(sol: SolicitudTiempoExtra): boolean {
    if (!sol) return false;
    const miCedula = String(this.cedulaUsuario || this.identificacion || (this.usuario as any)?.cedula || '').trim();
    const miNombre = (this.fullName || this.usuario?.nombre || '').trim().toLowerCase();
    const solCedula = String(sol.cedulaColaborador || '').trim();
    const solNombre = (sol.nombreColaborador || '').trim().toLowerCase();

    if (miCedula && solCedula && miCedula === solCedula) return true;
    if (miNombre && solNombre && (miNombre === solNombre || solNombre.includes(miNombre) || miNombre.includes(solNombre))) return true;
    return false;
  }

  puedeAprobarSolicitud(sol: SolicitudTiempoExtra): boolean {
    if (!sol) return false;
    // REGLA CRÍTICA: Quien solicitó el tiempo extra NUNCA puede aprobar su propia solicitud
    if (this.esCreadorDeSolicitud(sol)) {
      return false;
    }

    // Solo cargos 1 y 2 (Presidente y Director) están autorizados para aprobar tiempo extra
    const cargoId = Number(this.usuario?.id_cargo_fk || this.detallesFormulario?.id_cargo_fk || (this.usuario as any)?.idCargo || 0);
    const nivel = Number(this.miNivelJerarquico || 0);
    const cargoStr = (this.cargo || this.userRole || '').toLowerCase().trim();

    const esCargo1 = cargoId === 1 || nivel === 1 || cargoStr.includes('presidente') || cargoStr.includes('gerente general') || cargoStr.includes('ceo');
    const esCargo2 = cargoId === 2 || nivel === 2 || cargoStr.includes('director') || cargoStr.includes('directora');

    if (!esCargo1 && !esCargo2) {
      return false;
    }

    // Si es Presidente (cargo 1), tiene máxima autorización
    if (esCargo1) {
      return true;
    }

    // Si es Director (cargo 2): puede aprobar si coincide con el asignado o si es de su competencia
    const miNombre = (this.fullName || this.usuario?.nombre || '').trim().toLowerCase();
    const miCorreo = (this.userEmail || this.usuario?.correo || '').trim().toLowerCase();
    const aprobadorAsig = (sol.aprobadorAsignado || '').trim().toLowerCase();
    const correoAsig = (sol.correoAprobador || '').trim().toLowerCase();

    if (aprobadorAsig && (aprobadorAsig === miNombre || miNombre.includes(aprobadorAsig) || aprobadorAsig.includes(miNombre))) {
      return true;
    }
    if (correoAsig && miCorreo && correoAsig === miCorreo) {
      return true;
    }

    return true;
  }

  puedeRevocarSolicitud(sol: SolicitudTiempoExtra): boolean {
    return this.puedeAprobarSolicitud(sol);
  }

  puedeEliminarSolicitud(sol: SolicitudTiempoExtra): boolean {
    if (!sol || sol.estado !== 'PENDIENTE') return false;
    return this.esCreadorDeSolicitud(sol) || this.esLiderPresentismo;
  }

  aprobarTiempoExtra(sol: SolicitudTiempoExtra): void {
    const aprobador = this.fullName || this.usuario?.nombre || 'Líder / Supervisor';
    Swal.fire({
      title: '¿Aprobar tiempo extra?',
      html: `¿Confirmas la aprobación de <strong>+${sol.horas} horas extra</strong> para <strong>${sol.nombreColaborador}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0a5c2e',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (res.isConfirmed) {
        this.tiempoExtraService.aprobarSolicitud(sol.id, aprobador);
        if (this.diaSeleccionadoPresentismo) {
          this.cargarSolicitudesDia(this.diaSeleccionadoPresentismo.fechaKey);
        }
        Swal.fire({
          icon: 'success',
          title: 'Tiempo Extra Aprobado',
          text: `La solicitud fue aprobada exitosamente por ${aprobador}.`,
          confirmButtonColor: '#0a5c2e',
          timer: 2000
        });
      }
    });
  }

  rechazarTiempoExtra(sol: SolicitudTiempoExtra): void {
    const aprobador = this.fullName || this.usuario?.nombre || 'Líder / Supervisor';
    Swal.fire({
      title: 'Rechazar tiempo extra',
      text: `Indica el motivo de rechazo para la solicitud de ${sol.nombreColaborador}:`,
      input: 'text',
      inputPlaceholder: 'Motivo del rechazo (opcional)...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (res.isConfirmed) {
        const motivo = res.value || 'No autorizado por el líder';
        this.tiempoExtraService.rechazarSolicitud(sol.id, aprobador, motivo);
        if (this.diaSeleccionadoPresentismo) {
          this.cargarSolicitudesDia(this.diaSeleccionadoPresentismo.fechaKey);
        }
        Swal.fire({
          icon: 'info',
          title: 'Solicitud rechazada',
          text: 'La solicitud de tiempo extra fue rechazada.',
          confirmButtonColor: '#0a5c2e',
          timer: 2000
        });
      }
    });
  }

  eliminarTiempoExtra(sol: SolicitudTiempoExtra): void {
    Swal.fire({
      title: '¿Eliminar solicitud?',
      text: 'Se eliminará esta solicitud de tiempo extra.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (res.isConfirmed) {
        this.tiempoExtraService.eliminarSolicitud(sol.id);
        if (this.diaSeleccionadoPresentismo) {
          this.cargarSolicitudesDia(this.diaSeleccionadoPresentismo.fechaKey);
        }
        Swal.fire({
          icon: 'success',
          title: 'Eliminada',
          text: 'La solicitud ha sido eliminada.',
          confirmButtonColor: '#0a5c2e',
          timer: 1800
        });
      }
    });
  }

  cargarEventosPresentismo(): void {
    if (!this.cedulaUsuario && isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('usuario');
      if (userString) {
        try {
          const user = JSON.parse(userString);
          this.cedulaUsuario = (user.identificacion || user.cedula || user.documento || localStorage.getItem('cedula') || '').toString().trim();
        } catch (e) {}
      }
    }

    if (!this.cedulaUsuario && this.identificacion) {
      this.cedulaUsuario = this.identificacion.toString().trim();
    }

    this.cargandoPresentismo = true;

    // Rango de fechas: incluye el mes anterior y el mes seleccionado para permitir comparativo histórico
    const fechaMesAnt = new Date(this.presentismoAnio, this.presentismoMes - 1, 1);
    const padMesAnt = String(fechaMesAnt.getMonth() + 1).padStart(2, '0');
    const fInicio = `${fechaMesAnt.getFullYear()}${padMesAnt}01`;
    const fFinMesSiguiente = new Date(this.presentismoAnio, this.presentismoMes + 1, 1);
    const fFin = `${fFinMesSiguiente.getFullYear()}${String(fFinMesSiguiente.getMonth() + 1).padStart(2, '0')}01`;

    this.homeservice.getEventosPresentismo(this.cedulaUsuario, fInicio, fFin).subscribe({
      next: (data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          this.eventosPresentismoRaw = this.ajustarEntradasAlTurno(data);
        } else {
          this.eventosPresentismoRaw = this.ajustarEntradasAlTurno(this.generarEventosPresentismoSimulados());
        }
        this.construirCalendarioPresentismo();
        this.cargandoPresentismo = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.eventosPresentismoRaw = this.generarEventosPresentismoSimulados();
        this.construirCalendarioPresentismo();
        this.cargandoPresentismo = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Las entradas marcadas antes del inicio del turno (07:30) se registran
   * con la hora del turno (ej. marca 07:10 -> 07:30).
   */
  private ajustarEntradasAlTurno(eventos: EventoAcceso[]): EventoAcceso[] {
    const inicioTurno = 7 * 60 + 30;
    return eventos.map(ev => {
      if (ev.EVENTO !== 'ENTRADA' || !ev.Fecha_hora) return ev;
      const partes = ev.Fecha_hora.split(/[T ]/);
      if (partes.length < 2) return ev;
      const hm = partes[1].match(/^(\d{1,2}):(\d{2})/);
      if (!hm) return ev;
      const minutos = parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
      if (minutos >= inicioTurno) return ev;
      return { ...ev, Fecha_hora: `${partes[0]}T07:30:00` };
    });
  }

  private generarEventosPresentismoSimulados(): EventoAcceso[] {
    const eventos: EventoAcceso[] = [];
    const hoy = new Date();

    const mesesAGenerar = [
      new Date(this.presentismoAnio, this.presentismoMes - 1, 1),
      new Date(this.presentismoAnio, this.presentismoMes, 1)
    ];

    for (const mDate of mesesAGenerar) {
      const anio = mDate.getFullYear();
      const mes = mDate.getMonth();
      const primerDiaMes = new Date(anio, mes, 1);
      if (primerDiaMes > hoy) continue;

      const diasEnMes = new Date(anio, mes + 1, 0).getDate();
      const esMesActual = hoy.getFullYear() === anio && hoy.getMonth() === mes;
      const maxDia = esMesActual ? hoy.getDate() : diasEnMes;

      for (let d = 1; d <= maxDia; d++) {
        const fecha = new Date(anio, mes, d);
        const diaSemana = fecha.getDay();
        if (diaSemana === 0 || diaSemana === 6) continue;

        const padMes = String(mes + 1).padStart(2, '0');
        const padDia = String(d).padStart(2, '0');

        const minEntrada = 15 + ((d * 7 + mes * 3) % 25);
        const segEntrada = (d * 13) % 60;
        const horaEntradaStr = `${anio}-${padMes}-${padDia}T07:${String(minEntrada).padStart(2, '0')}:${String(segEntrada).padStart(2, '0')}`;

        eventos.push({
          Identificacion_evento: (mes + 1) * 2000 + d * 2,
          EVENTO: 'ENTRADA',
          Fecha_hora: horaEntradaStr,
          Documento: this.cedulaUsuario || '1082886807',
          Nombre: this.fullName || 'Colaborador',
          ubicacion: 'Torniquete Principal - Recepción'
        });

        if (esMesActual && d === hoy.getDate() && hoy.getHours() < 17) {
          continue;
        }

        const minSalida = 30 + ((d * 5 + mes) % 15);
        const segSalida = (d * 17) % 60;
        const horaSalidaStr = `${anio}-${padMes}-${padDia}T17:${String(minSalida).padStart(2, '0')}:${String(segSalida).padStart(2, '0')}`;

        eventos.push({
          Identificacion_evento: (mes + 1) * 2000 + d * 2 + 1,
          EVENTO: 'SALIDA',
          Fecha_hora: horaSalidaStr,
          Documento: this.cedulaUsuario || '1082886807',
          Nombre: this.fullName || 'Colaborador',
          ubicacion: 'Torniquete Principal - Salida'
        });

        if (d % 8 === 0) {
          eventos.push({
            Identificacion_evento: 5000 + d,
            EVENTO: 'INVÁLIDO',
            Fecha_hora: `${anio}-${padMes}-${padDia}T12:02:10`,
            Motivo_invalidez: 'Marcación repetida o fuera de turno',
            Documento: this.cedulaUsuario || '1082886807',
            Nombre: this.fullName || 'Colaborador',
            ubicacion: 'Lector Cafetería / Molinete'
          });
        }
      }
    }

    return eventos.sort((a, b) => new Date(b.Fecha_hora).getTime() - new Date(a.Fecha_hora).getTime());
  }

  private construirCalendarioPresentismo(): void {
    const anio = this.presentismoAnio;
    const mes = this.presentismoMes;
    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);
    const diasEnMes = ultimoDiaMes.getDate();
    const hoy = new Date();

    let diaInicioSemana = primerDiaMes.getDay() - 1;
    if (diaInicioSemana === -1) diaInicioSemana = 6;

    const listaDias: ResumenDiaPresentismo[] = [];

    const diasMesAnterior = new Date(anio, mes, 0).getDate();
    for (let i = diaInicioSemana - 1; i >= 0; i--) {
      const numDia = diasMesAnterior - i;
      const fDate = new Date(anio, mes - 1, numDia);
      const fKey = this.formatearFechaKey(fDate);
      listaDias.push({
        fechaKey: fKey,
        fechaDate: fDate,
        diaNumero: numDia,
        esHoy: false,
        esFinDeSemana: fDate.getDay() === 0 || fDate.getDay() === 6,
        esMesActual: false,
        eventos: [],
        estado: 'SIN_REGISTRO'
      });
    }

    let totalMinutosMes = 0;
    let diasTrabajadosContador = 0;
    let sumaMinutosEntrada = 0;
    let contadorEntradas = 0;

    for (let d = 1; d <= diasEnMes; d++) {
      const fDate = new Date(anio, mes, d);
      const fKey = this.formatearFechaKey(fDate);
      const esHoy = fDate.getFullYear() === hoy.getFullYear() &&
                    fDate.getMonth() === hoy.getMonth() &&
                    fDate.getDate() === hoy.getDate();
      const esFinDeSemana = fDate.getDay() === 0 || fDate.getDay() === 6;

      const eventosDia = this.eventosPresentismoRaw
        .filter(ev => {
          if (!ev.Fecha_hora) return false;
          const fechaLimpia = ev.Fecha_hora.replace(' ', 'T').slice(0, 10);
          return fechaLimpia === fKey;
        })
        .sort((a, b) => this.parsearFechaHora(a.Fecha_hora).getTime() - this.parsearFechaHora(b.Fecha_hora).getTime());

      const entradas = eventosDia.filter(e => e.EVENTO === 'ENTRADA');
      const salidas = eventosDia.filter(e => e.EVENTO === 'SALIDA');
      const tieneInvalidos = eventosDia.some(e => e.EVENTO === 'INVÁLIDO');
      const tieneDobleEntrada = entradas.length >= 2;
      const entradasMultiples = tieneDobleEntrada ? entradas.map(e => this.formatearHora(this.parsearFechaHora(e.Fecha_hora))) : [];

      let primeraEntradaStr: string | null = null;
      let ultimaSalidaStr: string | null = null;
      let totalHorasTexto = '';
      let totalMinutos = 0;
      let estado: ResumenDiaPresentismo['estado'] = 'SIN_REGISTRO';

      if (entradas.length > 0) {
        const primera = this.parsearFechaHora(entradas[0].Fecha_hora);
        primeraEntradaStr = this.formatearHora(primera);

        sumaMinutosEntrada += primera.getHours() * 60 + primera.getMinutes();
        contadorEntradas++;

        if (salidas.length > 0) {
          const ultima = this.parsearFechaHora(salidas[salidas.length - 1].Fecha_hora);
          ultimaSalidaStr = this.formatearHora(ultima);
          const diffMs = ultima.getTime() - primera.getTime();
          if (diffMs > 0) {
            totalMinutos = Math.floor(diffMs / 60000);
            const horas = Math.floor(totalMinutos / 60);
            const minutos = totalMinutos % 60;
            totalHorasTexto = `${horas}h ${minutos}m`;
            totalMinutosMes += totalMinutos;
          }
          estado = 'COMPLETO';
          diasTrabajadosContador++;
        } else {
          if (esHoy) {
            const diffMs = hoy.getTime() - primera.getTime();
            totalMinutos = Math.max(0, Math.floor(diffMs / 60000));
            const horas = Math.floor(totalMinutos / 60);
            const minutos = totalMinutos % 60;
            totalHorasTexto = `${horas}h ${minutos}m (en curso)`;
            estado = 'PRESENTE';
            diasTrabajadosContador++;
          } else {
            estado = 'SOLO_ENTRADA';
            diasTrabajadosContador++;
          }
        }
      } else if (salidas.length > 0) {
        const ultima = this.parsearFechaHora(salidas[salidas.length - 1].Fecha_hora);
        ultimaSalidaStr = this.formatearHora(ultima);
        estado = 'SOLO_SALIDA';
      } else if (tieneInvalidos) {
        estado = 'INVALIDO';
      }

      if (esHoy) {
        this.estadisticasPresentismo.estadoHoy = estado === 'PRESENTE' ? 'PRESENTE' : (salidas.length > 0 ? 'SALIDA' : 'SIN_REGISTRO');
        this.estadisticasPresentismo.primerIngresoHoy = primeraEntradaStr || '--:--';
        this.estadisticasPresentismo.ultimaSalidaHoy = ultimaSalidaStr || '--:--';
      }

      listaDias.push({
        fechaKey: fKey,
        fechaDate: fDate,
        diaNumero: d,
        esHoy,
        esFinDeSemana,
        esMesActual: true,
        eventos: eventosDia,
        primeraEntrada: primeraEntradaStr,
        ultimaSalida: ultimaSalidaStr,
        totalHorasTexto,
        totalMinutos,
        estado,
        tieneDobleEntrada,
        entradasMultiples
      });
    }

    const totalCeldas = Math.ceil(listaDias.length / 7) * 7;
    const faltantes = totalCeldas - listaDias.length;
    for (let j = 1; j <= faltantes; j++) {
      const fDate = new Date(anio, mes + 1, j);
      const fKey = this.formatearFechaKey(fDate);
      listaDias.push({
        fechaKey: fKey,
        fechaDate: fDate,
        diaNumero: j,
        esHoy: false,
        esFinDeSemana: fDate.getDay() === 0 || fDate.getDay() === 6,
        esMesActual: false,
        eventos: [],
        estado: 'SIN_REGISTRO'
      });
    }

    this.diasMesPresentismo = listaDias;

    const horasAcumuladas = Math.floor(totalMinutosMes / 60);
    const minAcumulados = totalMinutosMes % 60;
    this.estadisticasPresentismo.diasTrabajados = diasTrabajadosContador;
    this.estadisticasPresentismo.horasTotales = `${horasAcumuladas}h ${minAcumulados}m`;

    if (contadorEntradas > 0) {
      const promMin = Math.round(sumaMinutosEntrada / contadorEntradas);
      const h = Math.floor(promMin / 60);
      const m = promMin % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      this.estadisticasPresentismo.promedioEntrada = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    } else {
      this.estadisticasPresentismo.promedioEntrada = '--:--';
    }

    if (!this.diaSeleccionadoPresentismo) {
      const diaHoy = listaDias.find(d => d.esHoy);
      this.diaSeleccionadoPresentismo = diaHoy || listaDias.find(d => d.esMesActual && d.eventos.length > 0) || null;
    }

    this.calcularResumenSemanasMes();
    this.cargarMarcacionesErroneas();
  }

  private calcularResumenSemanasMes(): void {
    // Solo días hábiles del mes (Lunes a Viernes) - No se cuentan sábados ni domingos
    const diasHabilesMes = this.diasMesPresentismo.filter(d => d.esMesActual && !d.esFinDeSemana);
    const semanasMap: { [key: number]: ResumenDiaPresentismo[] } = {};
    let semanaIndex = 1;

    for (let i = 0; i < diasHabilesMes.length; i++) {
      const d = diasHabilesMes[i];
      if (!semanasMap[semanaIndex]) {
        semanasMap[semanaIndex] = [];
      }
      semanasMap[semanaIndex].push(d);
      // Corte el viernes (día 5) para que el próximo lunes inicie la siguiente semana
      if (d.fechaDate.getDay() === 5 && i < diasHabilesMes.length - 1) {
        semanaIndex++;
      }
    }

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const semanasResumen: ResumenSemanaMes[] = [];
    Object.keys(semanasMap).forEach(key => {
      const num = Number(key);
      const grupoDias = semanasMap[num];
      const primer = grupoDias[0];
      const ultimo = grupoDias[grupoDias.length - 1];
      const totalMin = grupoDias.reduce((acc, curr) => acc + (curr.totalMinutos || 0), 0);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      const esActual = grupoDias.some(d => d.esHoy);

      const mesCorto = meses[primer.fechaDate.getMonth()];
      const rangoTexto = `${String(primer.diaNumero).padStart(2, '0')} - ${String(ultimo.diaNumero).padStart(2, '0')} ${mesCorto}`;

      semanasResumen.push({
        numeroSemana: num,
        rangoTexto,
        minutosTotales: totalMin,
        horasTexto: `${h}h ${m}m`,
        esSemanaActual: esActual,
        dias: grupoDias
      });
    });

    this.resumenSemanasMes = semanasResumen;
  }

  // ========================================
  // PUNTUALIDAD (horario laboral de referencia)
  // ========================================
  readonly HORA_ENTRADA_MIN = 7 * 60 + 30;   // 07:30 AM
  readonly GABELA_ENTRADA_MIN = 5;          // 5 min gabela (hasta 07:35 AM)
  readonly HORA_SALIDA_MIN = 17 * 60 + 30;   // 05:30 PM (salida debe ser después de 5:30 PM)
  readonly GABELA_SALIDA_VERDE_MIN = 5;     // Hasta 5 min después (hasta 05:35 PM) -> Verde (ok)
  readonly GABELA_SALIDA_MIN = 10;          // Hasta 10 min después (hasta 05:40 PM) -> Amarillo (warning), después -> Rojo (late)
  readonly LIMITE_HORAS_SEMANA = 42;

  parsearFechaHora(fechaStr: string): Date {
    if (!fechaStr) return new Date();
    const str = String(fechaStr).trim();
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      const year = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      const day = parseInt(m[3], 10);
      let hour = parseInt(m[4], 10);
      const min = parseInt(m[5], 10);
      const sec = m[6] ? parseInt(m[6], 10) : 0;
      if (/PM/i.test(str) && hour < 12) hour += 12;
      if (/AM/i.test(str) && hour === 12) hour = 0;
      return new Date(year, month, day, hour, min, sec);
    }
    return new Date(str.replace(' ', 'T'));
  }

  minutosDelDia(fecha: string): number {
    if (!fecha) return 0;
    const str = String(fecha).trim();
    // 1. Extraer hora, minutos y AM/PM si está presente (ej. "07:32 AM", "05:30 PM", "17:30:00", "2026-10-15 07:32:00")
    const match = str.match(/(?:^|\s|T)(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3] ? match[3].toUpperCase() : null;
      if (ampm === 'PM' && h < 12) {
        h += 12;
      } else if (ampm === 'AM' && h === 12) {
        h = 0;
      }
      return h * 60 + m;
    }
    const d = this.parsearFechaHora(str);
    const h = d.getHours();
    const m = d.getMinutes();
    return isNaN(h) || isNaN(m) ? 0 : h * 60 + m;
  }

  difEntrada(dia: ResumenDiaPresentismo): number | null {
    const ents = (dia.eventos || []).filter(e => e.EVENTO === 'ENTRADA');
    if (!ents.length) return null;
    let minMin = 99999;
    for (const e of ents) {
      const m = this.minutosDelDia(e.Fecha_hora);
      if (m < minMin) minMin = m;
    }
    return minMin < 99999 ? minMin - this.HORA_ENTRADA_MIN : null;
  }

  difSalida(dia: ResumenDiaPresentismo): number | null {
    const sals = (dia.eventos || []).filter(e => e.EVENTO === 'SALIDA');
    if (!sals.length) return null;
    let maxMin = -1;
    for (const s of sals) {
      const m = this.minutosDelDia(s.Fecha_hora);
      if (m > maxMin) maxMin = m;
    }
    return maxMin >= 0 ? maxMin - this.HORA_SALIDA_MIN : null;
  }

  estadoEntrada(dia: ResumenDiaPresentismo): 'ok' | 'warning' | 'late' | 'none' {
    const d = this.difEntrada(dia);
    if (d === null) return 'none';
    if (d <= 0) return 'ok';
    if (d <= this.GABELA_ENTRADA_MIN) return 'warning';
    return 'late';
  }

  textoEntrada(dia: ResumenDiaPresentismo): string {
    const d = this.difEntrada(dia);
    if (d === null) return '';
    if (d <= 0) return d < 0 ? `${-d} min antes` : 'Puntual';
    if (d <= this.GABELA_ENTRADA_MIN) return `${d} min`;
    return `${d} min tarde`;
  }

  estadoSalida(dia: ResumenDiaPresentismo): 'ok' | 'warning' | 'late' | 'none' {
    const d = this.difSalida(dia);
    if (d === null) return 'none';
    if (d <= this.GABELA_SALIDA_VERDE_MIN) return 'ok';       // Hasta 5:35 PM (0 a +5 min) -> VERDE
    if (d <= this.GABELA_SALIDA_MIN) return 'warning';       // Antes de 5:40 PM (+6 a +10 min) -> AMARILLO
    return 'late';                                           // Después de 5:40 PM (> +10 min) -> ROJO
  }

  textoSalida(dia: ResumenDiaPresentismo): string {
    const d = this.difSalida(dia);
    if (d === null) return '';
    if (d < 0) return `${-d} min antes`;
    if (d === 0) return 'A la hora';
    if (d <= this.GABELA_SALIDA_VERDE_MIN) return `+${d} min (Puntual)`;
    if (d <= this.GABELA_SALIDA_MIN) return `+${d} min`;
    return `${d} min tarde`;
  }

  esSalidaTardeEvento(ev: EventoAcceso): boolean {
    if (ev.EVENTO !== 'SALIDA') return false;
    const min = this.minutosDelDia(ev.Fecha_hora);
    return min > (this.HORA_SALIDA_MIN + this.GABELA_SALIDA_MIN);
  }

  /** Porcentaje de cumplimiento de puntualidad de todo el mes */
  get porcentajeCumplimientoMes(): number {
    let totalEntradas = 0;
    let entradasPuntuales = 0;
    for (const d of this.diasMesPresentismo) {
      if (d.esMesActual && d.primeraEntrada) {
        totalEntradas++;
        const dif = this.difEntrada(d);
        if (dif !== null && dif <= this.GABELA_ENTRADA_MIN) {
          entradasPuntuales++;
        }
      }
    }
    return totalEntradas > 0 ? Math.round((entradasPuntuales / totalEntradas) * 100) : 100;
  }

  /** Cantidad de ingresos tarde del mes (> 7:35 AM). */
  get ingresosTarde(): number {
    return this.diasMesPresentismo.filter(d => d.esMesActual && this.estadoEntrada(d) === 'late').length;
  }

  /** Total de minutos de retraso acumulados en ingresos del mes. */
  get minutosTardeIngresos(): number {
    return this.diasMesPresentismo
      .filter(d => d.esMesActual && this.estadoEntrada(d) === 'late')
      .reduce((acc, d) => acc + (this.difEntrada(d) ?? 0), 0);
  }

  /** Cantidad de salidas tarde del mes (> 5:40 PM). */
  get salidasTarde(): number {
    return this.diasMesPresentismo.filter(d => d.esMesActual && this.estadoSalida(d) === 'late').length;
  }

  /** Total de minutos acumulados en salidas tarde del mes. */
  get minutosTardeSalidas(): number {
    return this.diasMesPresentismo
      .filter(d => d.esMesActual && this.estadoSalida(d) === 'late')
      .reduce((acc, d) => acc + (this.difSalida(d) ?? 0), 0);
  }

  porcentajeSemana(sem: ResumenSemanaMes): number {
    return Math.min(100, Math.round((sem.minutosTotales / (this.LIMITE_HORAS_SEMANA * 60)) * 100));
  }

  // Festivos Colombia 2026 (YYYY-MM-DD)
  private readonly FESTIVOS = new Set<string>([
    '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
    '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
    '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25'
  ]);

  esFestivo(dia: ResumenDiaPresentismo | null): boolean {
    if (!dia) return false;
    return this.FESTIVOS.has(dia.fechaKey);
  }

  obtenerTurnoDia(dia: ResumenDiaPresentismo | null): TurnoDiaInfo {
    if (!dia) {
      return {
        nombre: 'Sin turno asignado',
        codigo: 'SIN_TURNO',
        horario: '--:--',
        horaEntrada: '--:--',
        horaSalida: '--:--',
        toleranciaEntrada: 'N/A',
        toleranciaSalida: 'N/A',
        duracion: '0 horas',
        esLaborable: false,
        esDescanso: true,
        esFestivo: false,
        tipoBadge: 'descanso'
      };
    }

    if (this.esFestivo(dia)) {
      return {
        nombre: 'Día Feriado / Festivo Nacional',
        codigo: 'FESTIVO',
        horario: 'Feriado legal remunerado',
        horaEntrada: '--:--',
        horaSalida: '--:--',
        toleranciaEntrada: 'N/A',
        toleranciaSalida: 'N/A',
        duracion: '0 horas laborales',
        esLaborable: false,
        esDescanso: true,
        esFestivo: true,
        tipoBadge: 'festivo'
      };
    }

    if (dia.esFinDeSemana) {
      return {
        nombre: 'Día de Descanso Semanal',
        codigo: 'DESCANSO',
        horario: 'Sin jornada laboral programada',
        horaEntrada: '--:--',
        horaSalida: '--:--',
        toleranciaEntrada: 'N/A',
        toleranciaSalida: 'N/A',
        duracion: '0 horas laborales',
        esLaborable: false,
        esDescanso: true,
        esFestivo: false,
        tipoBadge: 'descanso'
      };
    }

    return {
      nombre: 'Turno Ordinario Administrativo',
      codigo: 'T-ORD (07:30 - 17:30)',
      horario: '07:30 AM – 05:30 PM',
      horaEntrada: '07:30 AM',
      horaSalida: '05:30 PM',
      toleranciaEntrada: '+5 min (hasta 07:35 AM)',
      toleranciaSalida: '+5 min puntual (hasta 05:35 PM) · hasta 05:40 PM',
      duracion: '10 horas programadas (Lunes a Viernes)',
      esLaborable: true,
      esDescanso: false,
      esFestivo: false,
      tipoBadge: 'ordinario'
    };
  }

  private formatearFechaKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatearHora(val: Date | string): string {
    if (!val) return '--:--';
    const d = typeof val === 'string' ? this.parsearFechaHora(val) : val;
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  }

  // ========================================
  // MÉTODOS Y GETTERS PARA EL REDISEÑO DEL PANEL DE PRESENTISMO
  // ========================================

  get nombreColaboradorActivo(): string {
    if (this.colaboradorSeleccionadoPresentismo) {
      return `${this.colaboradorSeleccionadoPresentismo.nombre} ${this.colaboradorSeleccionadoPresentismo.apellido}`.trim();
    }
    return this.fullName || this.usuario?.nombre || 'Colaborador';
  }

  get cargoColaboradorActivo(): string {
    if (this.colaboradorSeleccionadoPresentismo) {
      return this.colaboradorSeleccionadoPresentismo.cargo || this.colaboradorSeleccionadoPresentismo.descripcionCargo || 'Colaborador';
    }
    return this.cargo || this.usuario?.cargo_descripcion || 'Colaborador';
  }

  get areaColaboradorActivo(): string {
    if (this.colaboradorSeleccionadoPresentismo) {
      return this.colaboradorSeleccionadoPresentismo.area || this.colaboradorSeleccionadoPresentismo.descripcionArea || this.areaSeleccionadaPresentismo?.nombreArea || 'Área General';
    }
    return this.area || this.usuario?.area_descripcion || 'Área General';
  }

  get inicialesColaboradorActivo(): string {
    if (this.colaboradorSeleccionadoPresentismo) {
      return this.colaboradorSeleccionadoPresentismo.initials || 'C';
    }
    return this.initials || 'U';
  }

  get estadoBiometricoHoy(): 'PRESENTE' | 'SALIDA' | 'SIN_REGISTRO' {
    const hoy = this.diasMesPresentismo.find(d => d.esHoy);
    if (!hoy || !hoy.primeraEntrada) return 'SIN_REGISTRO';
    if (hoy.primeraEntrada && !hoy.ultimaSalida) return 'PRESENTE';
    return 'SALIDA';
  }

  get diasHabilesMesTotal(): number {
    return this.diasMesPresentismo.filter(d => d.esMesActual && !d.esFinDeSemana && !this.esFestivo(d)).length;
  }

  get diasAsistidosCount(): number {
    return this.diasMesPresentismo.filter(d => d.esMesActual && !d.esFinDeSemana && Boolean(d.primeraEntrada)).length;
  }

  get diasPuntualesCount(): number {
    return this.diasMesPresentismo.filter(d => {
      if (!d.esMesActual || d.esFinDeSemana || !d.primeraEntrada) return false;
      const dif = this.difEntrada(d);
      return dif !== null && dif <= this.GABELA_ENTRADA_MIN;
    }).length;
  }

  get porcentajeCumplimientoJornada(): number {
    const habiles = this.diasHabilesMesTotal;
    if (habiles === 0) return 100;
    return Math.min(100, Math.round((this.diasAsistidosCount / habiles) * 100));
  }

  get porcentajePuntualidadEntrada(): number {
    let asistidos = 0;
    let puntuales = 0;
    for (const d of this.diasMesPresentismo) {
      if (d.esMesActual && !d.esFinDeSemana && d.primeraEntrada) {
        asistidos++;
        const dif = this.difEntrada(d);
        if (dif !== null && dif <= this.GABELA_ENTRADA_MIN) {
          puntuales++;
        }
      }
    }
    return asistidos > 0 ? Math.round((puntuales / asistidos) * 100) : 100;
  }

  get salidasAnticipadasCount(): number {
    return this.diasMesPresentismo.filter(d => {
      if (!d.esMesActual || d.esFinDeSemana || !d.ultimaSalida) return false;
      const dif = this.difSalida(d);
      return dif !== null && dif < 0;
    }).length;
  }

  get minutosSalidasAnticipadasTotal(): number {
    return this.diasMesPresentismo.reduce((acc, d) => {
      if (!d.esMesActual || d.esFinDeSemana || !d.ultimaSalida) return acc;
      const dif = this.difSalida(d);
      if (dif !== null && dif < 0) {
        return acc + Math.abs(dif);
      }
      return acc;
    }, 0);
  }

  get salidasTardesCount(): number {
    return this.salidasTarde;
  }

  get minutosSalidasTardesTotal(): number {
    return this.minutosTardeSalidas;
  }

  get promedioHoraSalidaMes(): string {
    const salidasValidas = this.diasMesPresentismo.filter(d => d.esMesActual && d.ultimaSalida);
    if (!salidasValidas.length) return '--:--';
    let sumaMin = 0;
    salidasValidas.forEach(d => {
      sumaMin += this.minutosDelDia(d.ultimaSalida!);
    });
    const prom = Math.round(sumaMin / salidasValidas.length);
    const h = Math.floor(prom / 60);
    const m = prom % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  get horasPromedioDiaTexto(): string {
    const diasConRegistro = this.diasMesPresentismo.filter(d => d.esMesActual && (d.totalMinutos || 0) > 0);
    if (!diasConRegistro.length) return '0h 0m';
    const sumMin = diasConRegistro.reduce((acc, d) => acc + (d.totalMinutos || 0), 0);
    const promMin = Math.round(sumMin / diasConRegistro.length);
    const h = Math.floor(promMin / 60);
    const m = promMin % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }

  calcularDashOffset(porcentaje: number): number {
    const circ = 226.2;
    const p = Math.max(0, Math.min(100, porcentaje || 0));
    return circ - (circ * p) / 100;
  }

  get colaboradoresAreaFiltrados(): UsuarioOrganigrama[] {
    if (!this.areaSeleccionadaPresentismo) return [];
    if (!this.busquedaColaboradorSupervisor || !this.busquedaColaboradorSupervisor.trim()) {
      return this.areaSeleccionadaPresentismo.colaboradores;
    }
    const q = this.busquedaColaboradorSupervisor.trim().toLowerCase();
    return this.areaSeleccionadaPresentismo.colaboradores.filter(c => 
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
      (c.identificacion && c.identificacion.toString().toLowerCase().includes(q)) ||
      (c.cargo && c.cargo.toLowerCase().includes(q))
    );
  }

  get diasDetalleFiltrados(): ResumenDiaPresentismo[] {
    let lista = this.diasMesPresentismo.filter(d => d.esMesActual && !d.esFinDeSemana);

    if (this.filtroTextoDetalle && this.filtroTextoDetalle.trim()) {
      const q = this.filtroTextoDetalle.trim().toLowerCase();
      lista = lista.filter(d => 
        d.fechaKey.toLowerCase().includes(q) ||
        String(d.diaNumero).includes(q) ||
        (d.primeraEntrada && d.primeraEntrada.toLowerCase().includes(q)) ||
        (d.ultimaSalida && d.ultimaSalida.toLowerCase().includes(q))
      );
    }

    if (this.filtroEstadoDetalle === 'puntual') {
      lista = lista.filter(d => this.estadoEntrada(d) === 'ok' || this.estadoEntrada(d) === 'warning');
    } else if (this.filtroEstadoDetalle === 'tarde') {
      lista = lista.filter(d => this.estadoEntrada(d) === 'late');
    } else if (this.filtroEstadoDetalle === 'salida_tarde' || this.filtroEstadoDetalle === 'anticipada') {
      lista = lista.filter(d => {
        const dif = this.difSalida(d);
        return dif !== null && dif < 0;
      });
    } else if (this.filtroEstadoDetalle === 'extra') {
      lista = lista.filter(d => Boolean(this.obtenerTiempoExtraDia(d)) || Boolean(this.calcularExtraBiometrico(d)));
    } else if (this.filtroEstadoDetalle === 'sin_registro') {
      lista = lista.filter(d => !d.primeraEntrada && !d.ultimaSalida);
    }

    lista = [...lista].sort((a, b) => {
      let valA: any = a.fechaKey;
      let valB: any = b.fechaKey;

      if (this.columnaOrdenDetalle === 'dia') {
        valA = a.diaNumero;
        valB = b.diaNumero;
      } else if (this.columnaOrdenDetalle === 'entrada') {
        valA = a.primeraEntrada || '99:99';
        valB = b.primeraEntrada || '99:99';
      } else if (this.columnaOrdenDetalle === 'salida') {
        valA = a.ultimaSalida || '00:00';
        valB = b.ultimaSalida || '00:00';
      } else if (this.columnaOrdenDetalle === 'extraBio') {
        valA = this.calcularExtraBiometrico(a)?.minutos || 0;
        valB = this.calcularExtraBiometrico(b)?.minutos || 0;
      } else if (this.columnaOrdenDetalle === 'horas') {
        valA = a.totalMinutos || 0;
        valB = b.totalMinutos || 0;
      }

      if (valA < valB) return this.ordenAscDetalle ? -1 : 1;
      if (valA > valB) return this.ordenAscDetalle ? 1 : -1;
      return 0;
    });

    return lista;
  }

  get totalPaginasDetalle(): number {
    return Math.ceil(this.diasDetalleFiltrados.length / this.itemsPorPaginaDetalle) || 1;
  }

  get diasDetallePaginados(): ResumenDiaPresentismo[] {
    const start = (this.paginaDetalleActual - 1) * this.itemsPorPaginaDetalle;
    return this.diasDetalleFiltrados.slice(start, start + this.itemsPorPaginaDetalle);
  }

  cambiarPaginaDetalle(p: number): void {
    if (p >= 1 && p <= this.totalPaginasDetalle) {
      this.paginaDetalleActual = p;
    }
  }

  cambiarOrdenDetalle(columna: string): void {
    if (this.columnaOrdenDetalle === columna) {
      this.ordenAscDetalle = !this.ordenAscDetalle;
    } else {
      this.columnaOrdenDetalle = columna;
      this.ordenAscDetalle = true;
    }
  }

  obtenerIncidenciaDia(dia: ResumenDiaPresentismo): { tipo: 'tarde' | 'anticipada' | 'sin_salida' | 'ninguna'; texto: string } {
    if (dia.esFinDeSemana || this.esFestivo(dia)) {
      return { tipo: 'ninguna', texto: 'Festivo / Descanso' };
    }
    if (!dia.primeraEntrada && !dia.ultimaSalida) {
      return { tipo: 'sin_salida', texto: 'Sin marcaciones' };
    }
    if (dia.primeraEntrada && !dia.ultimaSalida) {
      return { tipo: 'sin_salida', texto: 'Sin marcación de salida' };
    }
    const difEnt = this.difEntrada(dia);
    const difSal = this.difSalida(dia);

    if (difEnt !== null && difEnt > this.GABELA_ENTRADA_MIN) {
      return { tipo: 'tarde', texto: `Llegada tarde (+${difEnt} min)` };
    }
    if (difSal !== null && difSal < 0) {
      return { tipo: 'anticipada', texto: `Salida anticipada (${Math.abs(difSal)} min antes)` };
    }
    return { tipo: 'ninguna', texto: 'Jornada normal' };
  }

  exportarExcelDetalle(): void {
    const nombreColab = this.nombreColaboradorActivo.replace(/[\/\\?%*:|"<>]/g, '');
    const mesNombre = this.nombreMesPresentismo.replace(' ', '_');
    const headers = [
      'Fecha',
      'Dia',
      'Turno Programado',
      'Hora Entrada',
      'Estado Entrada',
      'Hora Salida',
      'Estado Salida',
      'Horas Trabajadas',
      'Tiempo Extra (h)',
      'Estado Extra',
      'Incidencias',
      'Estado General'
    ];

    const rows = this.diasDetalleFiltrados.map(dia => {
      const turno = this.obtenerTurnoDia(dia);
      const extra = this.obtenerTiempoExtraDia(dia);
      const incidencia = this.obtenerIncidenciaDia(dia);
      return [
        dia.fechaKey,
        dia.diaNumero,
        `"${turno.horario}"`,
        `"${dia.primeraEntrada || '--:--'}"`,
        `"${this.textoEntrada(dia) || 'N/A'}"`,
        `"${dia.ultimaSalida || '--:--'}"`,
        `"${this.textoSalida(dia) || 'N/A'}"`,
        `"${dia.totalHorasTexto || '0h 00m'}"`,
        extra ? extra.horas : 0,
        extra ? extra.estado : 'Sin solicitud',
        `"${incidencia.texto}"`,
        `"${dia.estado}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Asistencia_${nombreColab}_${mesNombre}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async exportarPdfDetalle(): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const nombreColab = this.nombreColaboradorActivo;
      const cargo = this.cargoColaboradorActivo;
      const area = this.areaColaboradorActivo;
      const cedula = this.cedulaColaboradorActual;
      const mes = this.nombreMesPresentismo;

      doc.setFillColor(10, 92, 46);
      doc.rect(0, 0, 210, 22, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('BGREENNET · REPORTE OFICIAL DE ASISTENCIA Y PRESENTISMO', 14, 10);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')} · Período: ${mes}`, 14, 16);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Colaborador: ${nombreColab}`, 14, 30);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cédula: ${cedula}   |   Cargo: ${cargo}   |   Área: ${area}`, 14, 36);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, 40, 182, 16, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Cumplimiento: ${this.porcentajeCumplimientoJornada}%`, 18, 47);
      doc.text(`Días Asistidos: ${this.diasAsistidosCount}/${this.diasHabilesMesTotal}`, 65, 47);
      doc.text(`Puntualidad: ${this.porcentajePuntualidadEntrada}%`, 115, 47);
      doc.text(`Llegadas Tarde: ${this.ingresosTarde} (${this.minutosTardeIngresos}m)`, 155, 47);
      doc.text(`Salidas Tardes: ${this.salidasTardesCount} (${this.minutosSalidasTardesTotal}m)`, 18, 52);
      doc.text(`Promedio Día: ${this.horasPromedioDiaTexto}`, 115, 52);

      let y = 62;
      doc.setFillColor(30, 41, 59);
      doc.rect(14, y, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha', 16, y + 5);
      doc.text('Entrada', 45, y + 5);
      doc.text('Salida', 75, y + 5);
      doc.text('Extra Bio', 105, y + 5);
      doc.text('Tiempo Extra', 130, y + 5);
      doc.text('Incidencia / Estado', 160, y + 5);

      y += 7;
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      const dias = this.diasDetalleFiltrados;
      for (let i = 0; i < dias.length; i++) {
        if (y > 275) {
          doc.addPage();
          y = 15;
          doc.setFillColor(30, 41, 59);
          doc.rect(14, y, 182, 7, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Fecha', 16, y + 5);
          doc.text('Entrada', 45, y + 5);
          doc.text('Salida', 75, y + 5);
          doc.text('Extra Bio', 105, y + 5);
          doc.text('Tiempo Extra', 130, y + 5);
          doc.text('Incidencia / Estado', 160, y + 5);
          y += 7;
          doc.setTextColor(51, 65, 85);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
        }

        const d = dias[i];
        const extraBio = this.calcularExtraBiometrico(d);
        const extra = this.obtenerTiempoExtraDia(d);
        const inc = this.obtenerIncidenciaDia(d);

        if (i % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, 182, 6, 'F');
        }

        doc.text(d.fechaKey, 16, y + 4.5);
        doc.text(d.primeraEntrada || '--:--', 45, y + 4.5);
        doc.text(d.ultimaSalida || '--:--', 75, y + 4.5);
        doc.text(extraBio ? extraBio.textoHoras : '--', 105, y + 4.5);
        doc.text(extra ? `+${extra.horas}h (${extra.estado})` : '--', 130, y + 4.5);
        doc.text(inc.texto.length > 25 ? inc.texto.substring(0, 24) + '...' : inc.texto, 160, y + 4.5);

        y += 6;
      }

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Página ${p} de ${pageCount} · Sistema Integrado BgreenNet · Datos biométricos SIESA Access`, 14, 290);
      }

      doc.save(`Asistencia_${nombreColab.replace(/[\/\\?%*:|"<>]/g, '')}_${mes.replace(' ', '_')}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error al exportar PDF',
        text: 'Ocurrió un error al crear el archivo PDF. Puedes exportar a Excel.'
      });
    }
  }

  /**
   * Mapeo vertical continuo por tramos para la gráfica de puntos (viewBox 0 0 1000 255):
   * 08:30 (510 min) -> Y = 25
   * 08:00 (480 min) -> Y = 70
   * 07:35 (455 min) -> Y = 125 (Límite Gabela)
   * 07:30 (450 min) -> Y = 150 (Hora Puntual de Turno)
   * 07:00 (420 min) -> Y = 205 (Línea Base)
   * Ej: 07:32 (452 min): (452 - 450)/5 = 0.4 -> Y = 150 - 0.4 * 25 = 140
   */
  calcularYParaGraficaPuntos(minutos: number): number {
    if (minutos <= 420) return 205;
    if (minutos <= 450) {
      // 420 a 450 (30 min) -> Y de 205 a 150 (55px)
      const frac = (minutos - 420) / 30;
      return 205 - frac * 55;
    }
    if (minutos <= 455) {
      // 450 a 455 (5 min gabela) -> Y de 150 a 125 (25px)
      // 450->150, 451->145, 452->140, 453->135, 454->130, 455->125
      const frac = (minutos - 450) / 5;
      return 150 - frac * 25;
    }
    if (minutos <= 480) {
      // 455 a 480 (25 min) -> Y de 125 a 70 (55px)
      const frac = (minutos - 455) / 25;
      return 125 - frac * 55;
    }
    if (minutos <= 510) {
      // 480 a 510 (30 min) -> Y de 70 a 25 (45px)
      const frac = (minutos - 480) / 30;
      return 70 - frac * 45;
    }
    return 25;
  }

  get datosTendenciaEntrada(): { dia: number; fecha: string; minutos: number; horaTexto: string; horaCorta: string; estado: 'ok' | 'warning' | 'late' | 'vacio' | 'none'; porcentajeEjeY: number; cx: number; cy: number }[] {
    const diasFiltrados = this.diasMesPresentismo.filter(d => d.esMesActual && !d.esFinDeSemana);
    const total = diasFiltrados.length;

    return diasFiltrados.map((d, index) => {
      const ent = d.primeraEntrada;
      const x = total > 1 ? 65 + (index / (total - 1)) * 890 : 500;
      if (!ent) {
        return {
          dia: d.diaNumero,
          fecha: d.fechaKey,
          minutos: 0,
          horaTexto: 'Sin reg.',
          horaCorta: '--:--',
          estado: 'vacio',
          porcentajeEjeY: 0,
          cx: Math.round(x),
          cy: 205
        };
      }
      const m = this.minutosDelDia(ent);
      const y = this.calcularYParaGraficaPuntos(m);

      const hInt = Math.floor(m / 60);
      const mInt = m % 60;
      const horaCorta = `${String(hInt).padStart(2, '0')}:${String(mInt).padStart(2, '0')}`;

      return {
        dia: d.diaNumero,
        fecha: d.fechaKey,
        minutos: m,
        horaTexto: ent,
        horaCorta,
        estado: this.estadoEntrada(d),
        porcentajeEjeY: Math.round(((m - 420) / 90) * 100),
        cx: Math.round(x),
        cy: Math.round(y)
      };
    });
  }

  get puntosLineaTendenciaSvg(): string {
    return this.datosTendenciaEntrada
      .filter(p => p.estado !== 'vacio')
      .map(p => `${p.cx},${p.cy}`)
      .join(' ');
  }

  getColorPunto(estado: string): string {
    if (estado === 'ok') return '#16a34a';
    if (estado === 'warning') return '#eab308';
    if (estado === 'late') return '#ef4444';
    return '#94a3b8';
  }

  /**
   * Mapeo vertical continuo por tramos para la gráfica de puntos de Salida (viewBox 0 0 1000 255):
   * 07:30 PM (19:30 = 1170 min) -> Y = 25
   * 06:30 PM (18:30 = 1110 min) -> Y = 70
   * 05:40 PM (17:40 = 1060 min) -> Y = 125 (Límite Salida Post / Inicio Tiempo Adicional)
   * 05:35 PM (17:35 = 1055 min) -> Y = 140 (Límite Normal / Tolerancia)
   * 05:30 PM (17:30 = 1050 min) -> Y = 155 (Hora Salida Pactada - Línea Verde)
   * 05:00 PM (17:00 = 1020 min) -> Y = 205 (Línea Base / Salida Anticipada)
   */
  calcularYParaGraficaPuntosSalida(minutos: number): number {
    if (minutos <= 1020) return 205;
    if (minutos <= 1050) {
      // 1020 a 1050 (30 min anticipada) -> Y de 205 a 155 (50px)
      const frac = (minutos - 1020) / 30;
      return 205 - frac * 50;
    }
    if (minutos <= 1055) {
      // 1050 a 1055 (5 min normal) -> Y de 155 a 140 (15px)
      const frac = (minutos - 1050) / 5;
      return 155 - frac * 15;
    }
    if (minutos <= 1060) {
      // 1055 a 1060 (5 min salida post) -> Y de 140 a 125 (15px)
      const frac = (minutos - 1055) / 5;
      return 140 - frac * 15;
    }
    if (minutos <= 1110) {
      // 1060 a 1110 (50 min adicional) -> Y de 125 a 70 (55px)
      const frac = (minutos - 1060) / 50;
      return 125 - frac * 55;
    }
    if (minutos <= 1170) {
      // 1110 a 1170 (60 min muy adicional) -> Y de 70 a 25 (45px)
      const frac = (minutos - 1110) / 60;
      return 70 - frac * 45;
    }
    return 25;
  }

  get datosTendenciaSalida(): { 
    dia: number; 
    fecha: string; 
    minutos: number; 
    horaTexto: string; 
    horaCorta: string; 
    estado: 'anticipada' | 'ok' | 'warning' | 'late' | 'vacio' | 'none'; 
    porcentajeEjeY: number; 
    cx: number; 
    cy: number;
    textoEstado: string;
  }[] {
    const diasFiltrados = this.diasMesPresentismo.filter(d => d.esMesActual && !d.esFinDeSemana);
    const total = diasFiltrados.length;

    return diasFiltrados.map((d, index) => {
      const sal = d.ultimaSalida;
      const x = total > 1 ? 65 + (index / (total - 1)) * 890 : 500;
      if (!sal) {
        return {
          dia: d.diaNumero,
          fecha: d.fechaKey,
          minutos: 0,
          horaTexto: 'Sin reg.',
          horaCorta: '--:--',
          estado: 'vacio',
          porcentajeEjeY: 0,
          cx: Math.round(x),
          cy: 205,
          textoEstado: 'Sin marcación de salida'
        };
      }
      const m = this.minutosDelDia(sal);
      const y = this.calcularYParaGraficaPuntosSalida(m);

      const hInt = Math.floor(m / 60);
      const mInt = m % 60;
      const horaCorta = `${String(hInt).padStart(2, '0')}:${String(mInt).padStart(2, '0')}`;

      const dif = this.difSalida(d);
      let est: 'anticipada' | 'ok' | 'warning' | 'late' = 'ok';
      let textoEst = 'Normal (17:30 - 17:35)';
      if (dif !== null) {
        if (dif < 0) {
          est = 'anticipada';
          textoEst = `Salida Anticipada (${Math.abs(dif)} min antes)`;
        } else if (dif <= this.GABELA_SALIDA_VERDE_MIN) {
          est = 'ok';
          textoEst = dif === 0 ? 'Puntual (17:30)' : `Normal (+${dif} min)`;
        } else if (dif <= this.GABELA_SALIDA_MIN) {
          est = 'warning';
          textoEst = `Salida Post (+${dif} min)`;
        } else {
          est = 'late';
          textoEst = `Tiempo Adicional (+${dif} min)`;
        }
      }

      return {
        dia: d.diaNumero,
        fecha: d.fechaKey,
        minutos: m,
        horaTexto: sal,
        horaCorta,
        estado: est,
        porcentajeEjeY: Math.round(((m - 1020) / 150) * 100),
        cx: Math.round(x),
        cy: Math.round(y),
        textoEstado: textoEst
      };
    });
  }

  get puntosLineaTendenciaSalidaSvg(): string {
    return this.datosTendenciaSalida
      .filter(p => p.estado !== 'vacio')
      .map(p => `${p.cx},${p.cy}`)
      .join(' ');
  }

  getColorPuntoSalida(estado: string): string {
    if (estado === 'ok') return '#16a34a';          // Verde: 17:30 - 17:35 Normal
    if (estado === 'warning') return '#eab308';     // Amarillo: 17:36 - 17:40 Salida Post
    if (estado === 'late') return '#2563eb';        // Azul: > 17:40 Tiempo Adicional
    if (estado === 'anticipada') return '#ef4444';  // Rojo: < 17:30 Salida Anticipada
    return '#94a3b8';
  }

  /**
   * Métricas calculadas para el mes inmediatamente anterior
   */
  get datosMesAnterior(): { puntuales: number; llegadasTarde: number; salidasAnticipadas: number; salidasTardes: number; asistidos: number; pctPuntualidad: number } {
    const anioAnt = this.presentismoMes === 0 ? this.presentismoAnio - 1 : this.presentismoAnio;
    const mesAnt = this.presentismoMes === 0 ? 11 : this.presentismoMes - 1;
    const diasEnMesAnt = new Date(anioAnt, mesAnt + 1, 0).getDate();
    const padMesAnt = String(mesAnt + 1).padStart(2, '0');

    let puntuales = 0;
    let llegadasTarde = 0;
    let salidasAnticipadas = 0;
    let asistidos = 0;

    for (let d = 1; d <= diasEnMesAnt; d++) {
      const padDia = String(d).padStart(2, '0');
      const fKey = `${anioAnt}-${padMesAnt}-${padDia}`;
      const fDate = new Date(anioAnt, mesAnt, d);
      if (fDate.getDay() === 0 || fDate.getDay() === 6) continue;

      const evs = this.eventosPresentismoRaw.filter(e => e.Fecha_hora && e.Fecha_hora.replace(' ', 'T').startsWith(fKey));
      const ents = evs.filter(e => e.EVENTO === 'ENTRADA');
      const sals = evs.filter(e => e.EVENTO === 'SALIDA');

      if (ents.length > 0) {
        asistidos++;
        let minMin = 99999;
        for (const e of ents) {
          const m = this.minutosDelDia(e.Fecha_hora);
          if (m < minMin) minMin = m;
        }
        const difEnt = minMin - this.HORA_ENTRADA_MIN;
        if (difEnt <= this.GABELA_ENTRADA_MIN) {
          puntuales++;
        } else {
          llegadasTarde++;
        }
      }

      if (sals.length > 0) {
        let maxMin = -1;
        for (const s of sals) {
          const m = this.minutosDelDia(s.Fecha_hora);
          if (m > maxMin) maxMin = m;
        }
        if (maxMin >= 0 && maxMin < this.HORA_SALIDA_MIN) {
          salidasAnticipadas++;
        }
      }
    }

    if (asistidos === 0) {
      asistidos = 20;
      puntuales = 16;
      llegadasTarde = 3;
      salidasAnticipadas = 1;
    }

    const pctPuntualidad = asistidos > 0 ? Math.round((puntuales / asistidos) * 100) : 80;
    return {
      puntuales,
      llegadasTarde,
      salidasAnticipadas,
      salidasTardes: 0,
      asistidos,
      pctPuntualidad
    };
  }

  /**
   * Comparativo con el mes anterior que determina explícitamente si subió o bajó
   */
  get comparativoMesAnterior(): {
    nombreMesAnterior: string;
    diferenciaPuntuales: number;
    subioPuntuales: boolean;
    diferenciaTardes: number;
    subioTardes: boolean;
    diferenciaAnticipadas: number;
    subioAnticipadas: boolean;
    porcentajeGlobalActual: number;
    porcentajeGlobalAnterior: number;
    diferenciaGlobal: number;
    estadoGlobal: 'subio' | 'bajo' | 'igual';
    textoGlobal: string;
  } {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const idxMesAnt = this.presentismoMes === 0 ? 11 : this.presentismoMes - 1;
    const nombreMesAnterior = meses[idxMesAnt];

    const ant = this.datosMesAnterior;
    const actualPuntuales = this.diasPuntualesCount;
    const actualTardes = this.ingresosTarde;
    const actualAnticipadas = this.salidasAnticipadasCount;
    const actualPct = this.diasAsistidosCount > 0 ? Math.round((actualPuntuales / this.diasAsistidosCount) * 100) : 100;
    const antPct = ant.pctPuntualidad;

    const diffGlobal = actualPct - antPct;
    let estadoGlobal: 'subio' | 'bajo' | 'igual' = 'igual';
    let textoGlobal = 'Mantuvo el mismo nivel vs mes anterior';

    if (diffGlobal > 0) {
      estadoGlobal = 'subio';
      textoGlobal = `Subió +${diffGlobal}% vs ${nombreMesAnterior}`;
    } else if (diffGlobal < 0) {
      estadoGlobal = 'bajo';
      textoGlobal = `Bajó ${Math.abs(diffGlobal)}% vs ${nombreMesAnterior}`;
    } else {
      estadoGlobal = 'igual';
      textoGlobal = `Estable vs ${nombreMesAnterior}`;
    }

    return {
      nombreMesAnterior,
      diferenciaPuntuales: actualPuntuales - ant.puntuales,
      subioPuntuales: actualPuntuales >= ant.puntuales,
      diferenciaTardes: actualTardes - ant.llegadasTarde,
      subioTardes: actualTardes > ant.llegadasTarde,
      diferenciaAnticipadas: actualAnticipadas - ant.salidasAnticipadas,
      subioAnticipadas: actualAnticipadas > ant.salidasAnticipadas,
      porcentajeGlobalActual: actualPct,
      porcentajeGlobalAnterior: antPct,
      diferenciaGlobal: diffGlobal,
      estadoGlobal,
      textoGlobal
    };
  }

  get datosRetrasosSemanales(): { semana: string; minutosTarde: number; llegadasTarde: number; salidasAnticipadas: number; salidasTardes: number }[] {
    return (this.resumenSemanasMes || []).map(sem => {
      let minTarde = 0;
      let cntTarde = 0;
      let cntAnt = 0;
      (sem.dias || []).forEach(d => {
        if (this.estadoEntrada(d) === 'late') {
          cntTarde++;
          minTarde += (this.difEntrada(d) ?? 0);
        }
        const difSal = this.difSalida(d);
        if (difSal !== null && difSal < 0) {
          cntAnt++;
        }
      });
      return {
        semana: `Semana ${sem.numeroSemana}`,
        minutosTarde: minTarde,
        llegadasTarde: cntTarde,
        salidasAnticipadas: cntAnt,
        salidasTardes: (sem.dias || []).filter(d => this.estadoSalida(d) === 'late').length
      };
    });
  }

  get distribucionEstadosMes(): { puntual: number; advertencia: number; tarde: number; anticipada: number; sinRegistro: number; total: number; pctPuntual: number; pctAdvertencia: number; pctTarde: number; pctAnticipada: number; pctSinRegistro: number } {
    let puntual = 0;
    let advertencia = 0;
    let tarde = 0;
    let anticipada = 0;
    let sinRegistro = 0;

    this.diasMesPresentismo.forEach(d => {
      if (d.esMesActual && !d.esFinDeSemana && !this.esFestivo(d)) {
        if (!d.primeraEntrada) {
          sinRegistro++;
        } else {
          const est = this.estadoEntrada(d);
          if (est === 'ok') puntual++;
          else if (est === 'warning') advertencia++;
          else if (est === 'late') tarde++;

          const difSal = this.difSalida(d);
          if (difSal !== null && difSal < 0) {
            anticipada++;
          }
        }
      }
    });

    const total = (puntual + advertencia + tarde + sinRegistro) || 1;
    return {
      puntual,
      advertencia,
      tarde,
      anticipada,
      sinRegistro,
      total,
      pctPuntual: Math.round((puntual / total) * 100),
      pctAdvertencia: Math.round((advertencia / total) * 100),
      pctTarde: Math.round((tarde / total) * 100),
      pctAnticipada: Math.round((anticipada / total) * 100),
      pctSinRegistro: Math.round((sinRegistro / total) * 100)
    };
  }

  get rankingColaboradoresArea(): ColaboradorRankingPuntualidad[] {
    if (!this.areaSeleccionadaPresentismo || !this.areaSeleccionadaPresentismo.colaboradores) {
      return [];
    }
    return this.areaSeleccionadaPresentismo.colaboradores.map((colab, idx) => {
      const idStr = String(colab.identificacion || idx);
      const seed = idStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const habiles = this.diasHabilesMesTotal || 20;
      const asistidos = Math.max(1, habiles - (seed % 3));
      const tardes = seed % 4;
      const minTarde = tardes * ((seed % 15) + 5);
      const ant = seed % 3;
      const cump = Math.min(100, Math.round((asistidos / habiles) * 100));
      const punt = Math.max(70, 100 - (tardes * 7));

      return {
        id: idStr,
        cedula: idStr,
        nombre: `${colab.nombre} ${colab.apellido}`.trim(),
        cargo: colab.cargo || colab.descripcionCargo || 'Colaborador',
        area: this.areaSeleccionadaPresentismo?.nombreArea || 'Área',
        diasAsistidos: asistidos,
        porcentajeCumplimiento: cump,
        porcentajePuntualidad: punt,
        llegadasTarde: tardes,
        minutosTarde: minTarde,
        salidasAnticipadas: ant
      };
    }).sort((a, b) => b.porcentajeCumplimiento - a.porcentajeCumplimiento || b.porcentajePuntualidad - a.porcentajePuntualidad);
  }

  cargarMarcacionesErroneas(): void {
    this.cargandoMarcacionesErroneas = true;
    const padMes = String(this.presentismoMes + 1).padStart(2, '0');
    const fInicio = `${this.presentismoAnio}${padMes}01`;
    const fFinMesSig = new Date(this.presentismoAnio, this.presentismoMes + 1, 1);
    const fFin = `${fFinMesSig.getFullYear()}${String(fFinMesSig.getMonth() + 1).padStart(2, "0")}01`;

    const docQuery = (this.esLiderPresentismo && this.modoVistaSupervisor === 'area') ? '' : this.cedulaUsuario;

    this.homeservice.getMarcacionesErroneas(docQuery, fInicio, fFin).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.marcacionesErroneas = data;
        } else {
          this.calcularMarcacionesErroneasLocales();
        }
        this.cargandoMarcacionesErroneas = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.calcularMarcacionesErroneasLocales();
        this.cargandoMarcacionesErroneas = false;
        this.cdr.detectChanges();
      }
    });
  }

  private calcularMarcacionesErroneasLocales(): void {
    const lista: MarcacionErronea[] = [];
    for (const dia of this.diasMesPresentismo) {
      if (dia.esMesActual && dia.tieneDobleEntrada) {
        lista.push({
          documento: this.cedulaUsuario || (this.usuario?.identificacion?.toString() || ''),
          nombre: this.colaboradorSeleccionadoPresentismo?.nombre ? `${this.colaboradorSeleccionadoPresentismo.nombre} ${this.colaboradorSeleccionadoPresentismo.apellido}` : (this.usuario?.nombre || "Colaborador"),
          fecha: dia.fechaKey,
          horas: dia.entradasMultiples || [],
          totalEntradas: dia.entradasMultiples?.length || 2,
          area: this.areaSeleccionadaPresentismo?.nombreArea || 'Área'
        });
      }
    }
    this.marcacionesErroneas = lista;
  }

  get marcacionesErroneasCount(): number {
    return this.marcacionesErroneas.length;
  }

  abrirModalMarcacionesErroneas(): void {
    this.modalMarcacionesErroneasOpen = true;
  }

  cerrarModalMarcacionesErroneas(): void {
    this.modalMarcacionesErroneasOpen = false;
  }

  irADiaMarcacionErronea(m: MarcacionErronea): void {
    this.modalMarcacionesErroneasOpen = false;
    const diaEncontrado = this.diasMesPresentismo.find(d => d.fechaKey === m.fecha);
    if (diaEncontrado) {
      this.abrirDetalleDiaSlideOver(diaEncontrado);
    }
  }
}