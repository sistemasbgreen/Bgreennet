import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../auth/authservices';
import { UsuarioService } from '../../servicios/usuarioservices';
import { Usuario } from '../../models/usuario';
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

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  // Pestañas del Perfil
  activeTab: 'perfil' | 'organigrama' = 'perfil';

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
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.cargarDatosUsuario();
    this.cargarOrganigrama();
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
  };

  // Mapa exacto de Áreas a ID de Dirección (id_area_fk -> id_direccion_fk) según la tabla 'area' de la BD
  private readonly areaToDireccionMapBD: { [idArea: number]: number } = {
    18: 1, 19: 1,                          // Presidencia, Control Interno -> Presidencia (1)
    2: 2, 3: 2, 4: 2, 8: 2, 10: 2, 11: 2, // Tecnología, Gestión Humana, Planeación Financiera, Contabilidad, Tesorería, Administrativo -> Financiero (2)
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

    if (lowerArea.includes('presidencia') || lowerArea.includes('control interno')) {
      return 'Presidencia';
    }
    if (lowerArea.includes('tecnolog') || lowerArea.includes('gestion humana') || lowerArea.includes('planeacion financiera') || lowerArea.includes('contabilid') || lowerArea.includes('tesorer') || lowerArea.includes('administrativ')) {
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
}
