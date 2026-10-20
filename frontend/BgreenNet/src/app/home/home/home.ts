import { PrioridadTarea } from './../../models/Tareas/PrioridadTarea';
import { isPlatformBrowser } from '@angular/common';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Inject, OnInit, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router, RouterModule, RouterLink } from "@angular/router";
import { SistemaInformacion } from '../../models/sistemasinformacion';
import { homeservices } from '../../servicios/homeservices';
import { NgIf, NgForOf, CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListasService } from '../../servicios/listasServices';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Tarea } from '../../models/Tareas/Tarea';
import { CreateTareaRequest } from '../../models/Tareas/CreateTareaRequest';
import { Pulso } from '../../models/Pulsos/pulso';
import { PulsoService } from '../../servicios/pulsoservices';
import { UsuarioService } from '../../servicios/usuarioservices';
import { ConfiguracionSeguridadService, ConfiguracionSeguridad } from '../../servicios/configuracionSeguridadService';
import Swal from 'sweetalert2';
import { AuthService } from '../../auth/authservices';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IA_CATEGORIES, IaCategory, IaTool } from '../../data/ia-tools.data';
import { ACTUALIZACIONES_2027, ActualizacionItem } from '../../data/actualizaciones.data';
import { EventoAcceso, ResumenDiaPresentismo, EstadisticasMesPresentismo, ResumenSemanaMes, TurnoDiaInfo, DiaMiniBarra, ResumenMesMetas, SolicitudTiempoExtra } from '../../models/presentismo';
import { TiempoExtraService } from '../../servicios/tiempo-extra.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-home',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule, CommonModule, RouterModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trmChart') trmChartRef!: ElementRef<HTMLCanvasElement>;
  private destroy$ = new Subject<void>();
  private audioCtx: AudioContext | null = null;
  private trmChart: any = null;

  // Datos de usuario
  fullName: string = '';
  id_usuario: any;
  nameempresa = '';
  initials = '';
  userEmail: string = '';
  userRole: string = '';

  // Control de UI
  isMenuOpen = false;
  isUserMenuOpen = false;
  isModalOpen = false;
  isTrmModalOpen = false;
  isIaModalOpen = false;
  iaCategories: IaCategory[] = IA_CATEGORIES;
  iaSearchQuery: string = '';
  iaSelectedCategory: string = 'TODAS';
  mostrarDetalleSeguridadIa: boolean = true;

  // Modal Actualizaciones 2027
  isActualizacionesModalOpen = false;
  actualizacionesList: ActualizacionItem[] = ACTUALIZACIONES_2027;
  actualizacionIndex = 0;
  subImagenActualUrl: string | null = null;
  puedeCerrarModalActualizaciones = false;
  segundosRestantesActualizaciones = 5;
  actualizacionesTimerInterval: any = null;
  sliderActualizacionesInterval: any = null;
  sliderPausado = false;
  showModal = false;
  darkMode = false;
  isModalHistorialOpen = false; //  Modal de historial
  isModalDetalleOpen = false;
  isModalCambiarClaveOpen = false;
  claveActual = '';
  nuevaClave = '';
  confirmarClave = '';
  errorClave = '';
  successClave = '';
  mostrarClaveActual = false;
  mostrarNuevaClave = false;
  mostrarConfirmarClave = false;
  configSeguridad: ConfiguracionSeguridad | null = null;
  tareaSeleccionada: Tarea | null = null;
  mensajeSeguimiento = '';
  seguimientos: any[] = [];
  
  // Notificaciones
  isNotificationMenuOpen = false;
  notificaciones: any[] = [];
  notifPollingInterval: any;

  // Datos de sistemas y contactos
  sistemaInformacionData: SistemaInformacion[] = [];
  sistemacontactosData: any[] = [];
  formatosData: any = [];

    // PULSOS
      pulsos: Pulso[] = [];
  pulsoSeleccionado: Pulso | null = null;

  // Favoritos y búsqueda
  favorites: number[] = [];
  searchQuery: string = '';

  // Modal
  modalTitle = '';
  modalType: any;
  modalData: any = [];

  // TRM
  trmHistory: any[] = [];
  currentTrmValue: string = '';
  MaximoTrm: any;
  MinimoTrm: any;
  selectedTrmDate: string = '';
  trmResult: any = null;
  allTrmData: any[] = [];
  trmHistoricalData: any[] = [];

  // Dashboard personalizable
  dashboardWidgets: {
    stats: boolean;
    trmChart: boolean;
    activity: boolean;
    quickAccess: boolean;
    tasks: boolean;
    calendar?: boolean;
    presentismo?: boolean;
  } = {
    stats: true,
    trmChart: true,
    activity: true,
    quickAccess: true,
    tasks: true,
    calendar: true,
    presentismo: true
  };

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
  presentismoViewMode: 'calendar' | 'list' = 'calendar';
  isModalDiaPresentismoOpen: boolean = false;
  isModalPresentismoOpen: boolean = false;
  esCargoLiderArea: boolean = false;
  areasPresentismo: any[] = [];
  areaSeleccionadaPresentismo: any = null;
  colaboradorSeleccionadoPresentismo: any = null;
  cedulaOriginalUsuario: string = '';

  // Tiempo Extra / Permanencia Adicional
  nuevaHoraExtra: number = 2;
  nuevaDescripcionExtra: string = '';
  mostrarFormularioTiempoExtra: boolean = false;
  solicitudesDiaSeleccionado: SolicitudTiempoExtra[] = [];
  aprobadorSeleccionadoIdHome: string = '';

  // Asistencia semanal y resumen de horas semanales del mes
  diasSemanaActualPresentismo: ResumenDiaPresentismo[] = [];
  resumenSemanasMes: ResumenSemanaMes[] = [];
  totalHorasSemanaActualTexto: string = '0h 0m';
  rangoSemanaActualTexto: string = '';

  // Configuración de jornada laboral legal en Colombia y reglas de puntualidad
  readonly HORAS_META_SEMANA: number = (environment as any)?.horasMetaSemana ?? 42;
  readonly HORA_LIMITE_ENTRADA_STR: string = (environment as any)?.horaLimiteEntrada ?? '07:30';
  readonly HORA_MINIMA_SALIDA_STR: string = (environment as any)?.horaMinimaSalida ?? '17:30';

  // Resumen del mes con metas prorrateadas y chips
  resumenMesMetas: ResumenMesMetas = {
    totalHorasMesTexto: '0h 0m',
    metaMesTexto: '0h 0m',
    totalMinutosMes: 0,
    metaMinutosMes: 0,
    porcentajeMes: 0,
    porcentajePuntualidad: 100,
    llegadasTardeCount: 0,
    totalEntradasRegistradas: 0
  };

  // Reloj
  currentTime: Date = new Date();
  greeting: string = '';
  tareaResaltadaId: number | null = null;

  // Microsoft Outlook Integration (Iframe Mode)
  loadingCalendar: boolean = false;
  outlookCalendarUrl: SafeResourceUrl | null = null;
  selectedCalendarId: string = 'sala-juntas';
  availableCalendars = [
    {
      id: 'sala-juntas',
      nombre: 'Sala de Juntas',
      url: 'https://outlook.office365.com/owa/calendar/5728cd5fe07b44d19726a28df3162a80@biocosta.com/d65ef21564ce471bb8e26cce46a043e05795047427341488568/calendar.html'
    },
    {
      id: 'auditorio',
      nombre: 'Auditorio',
      url: 'https://outlook.office365.com/owa/calendar/b26a32137554453b9a4945570b20965d@biocosta.com/4c7c5342a3f849b3bed3f023d8c091153965550068646068814/calendar.html'
    }
  ];
  isModalCalendarioHeaderOpen: boolean = false;

  // El desbloqueo de audio se maneja en onDocumentClick más abajo

  //  Tareas mejoradas
  tareas: Tarea[] = [];
  tareasActivas: Tarea[] = []; // Solo CREADA y EN PROCESO
  tareasFinalizadas: Tarea[] = []; // Solo FINALIZADAS
  focusTasksMode: boolean = false; // Modo enfoque de tareas
  tasksViewMode: 'cards' | 'list' = 'cards'; // Modo de visualización de tareas
  
  usuarioAsignadoId: number | null = null; // Para asignar a otros

  setTasksViewMode(mode: 'cards' | 'list'): void {
    this.tasksViewMode = mode;
  }


  nuevaTarea: CreateTareaRequest = {
    idUsuario: 0,
    idUsuarioCreador: 0,
    titulo: '',
    descripcion: '',
    idEstado: 1,
    idPrioridad: 1    // NORMAL (ajusta a tu BD)
  };

  // Chart config (mantener por compatibilidad)
  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        label: 'TRM (COP/USD)',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false
      }
    ]
  };

  chartType: ChartType = 'line';
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Fecha'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Valor (COP)'
        }
      }
    }
  };

  images = [
    'https://bgreennet.bgreen.com.co/bgreennet/Img/Pulso5.png',
    'https://bgreennet.bgreen.com.co/bgreennet/Img/Pulso14.png',
    'https://bgreennet.bgreen.com.co/bgreennet/Img/Pulso15.png',
    'https://bgreennet.bgreen.com.co/bgreennet/Img/Pulso10.png'
  ];

  selectedImage: string | null = null;
  subscription: any;
  perfil_Fk: any;
  contactoSearchQuery: string = '';
  contactoCargoFiltro: string = 'TODOS';
  contactosViewMode: 'cards' | 'list' = 'cards';
  formatoSearchQuery: string = '';
  formatoCategoriaFiltro: string = 'TODOS';
  formatosViewMode: 'cards' | 'list' = 'cards';
  contactosFiltrados: any;
  usuariosList: any[] = []; // Lista oficial de usuarios para asignación
  areasList: any[] = []; // Lista de áreas para determinar direcciones
  
  // Datos del usuario actual para filtrado
  idAreaUsuario: number = 0;
  idCargoUsuario: number = 0;
  idDireccionUsuario: number = 0;
  
  notificationInterval: any;



  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private homeservice: homeservices,
    private listass: ListasService,
    private cdr: ChangeDetectorRef,
    private pulsoService: PulsoService,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private configuracionSeguridadService: ConfiguracionSeguridadService,
    private tiempoExtraService: TiempoExtraService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.cargarContactosIniciales();
    this.cargarUsuariosOficiales();
    this.cargarAreas();
    this.loadTrmData();
    this.startClock();
    this.loadPreferences();
    this.cargarPulsos();
    this.updateCalendarUrl();
    this.loadConfiguracionSeguridad();

    if (isPlatformBrowser(this.platformId)) {
      const guardado = localStorage.getItem('bgreen_estado_disponibilidad');
      if (guardado && ['sede', 'reunion', 'remoto', 'ocupado'].includes(guardado as any)) {
        this.estadoDisponibilidad = guardado as any;
      }
      this.cargarResumenMiDia(false);
      this.loadUserDataAndPermisos();
      this.iniciarTemporizadorNotificaciones();
      this.startBackgroundSync();
      // Inicializar contexto de audio
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.solicitarPermisoNotificaciones();
      this.verificarModalActualizaciones();
    }
  }

  loadConfiguracionSeguridad(): void {
    this.configuracionSeguridadService.getConfiguracion().subscribe({
      next: (config: any) => {
        this.configSeguridad = config;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar config seguridad:', err)
    });
  }




  ngAfterViewInit(): void {
    // Esperar a que los datos estén cargados antes de crear el gráfico
    setTimeout(() => {
      if (this.dashboardWidgets.trmChart && this.trmHistoricalData.length > 0) {
        this.createTrmChart();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription?.unsubscribe();
    if (this.trmChart) {
      this.trmChart.destroy();
    }
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
    if (this.actualizacionesTimerInterval) {
      clearInterval(this.actualizacionesTimerInterval);
    }
    if (this.sliderActualizacionesInterval) {
      clearInterval(this.sliderActualizacionesInterval);
    }
    this.detenerTimerMiDia();
  }


  // ========================================
  // RELOJ Y SALUDO
  // ========================================
  startClock(): void {
    setInterval(() => {
      this.currentTime = new Date();
      this.greeting = this.getGreeting();
      // Si el usuario está en sede hoy, actualizar cálculos en vivo cada minuto
      if (this.currentTime.getSeconds() === 0 && this.estadisticasPresentismo.estadoHoy === 'PRESENTE') {
        this.actualizarMinutosHoyEnVivo();
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  getGreeting(): string {
    const hour = this.currentTime.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  // ========================================
  // PREFERENCIAS Y PERSISTENCIA
  // ========================================
  loadPreferences(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedWidgets = localStorage.getItem('dashboardWidgets');
      if (savedWidgets) {
        this.dashboardWidgets = JSON.parse(savedWidgets);
        this.dashboardWidgets.presentismo = true;
      }

      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode) {
        this.darkMode = JSON.parse(savedDarkMode);
      }

      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        this.favorites = JSON.parse(savedFavorites);
      }
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    }

    // Recrear el gráfico con los nuevos colores
    if (this.trmChart && this.dashboardWidgets.trmChart) {
      setTimeout(() => this.createTrmChart(), 100);
    }
  }

  toggleWidget(widget: string): void {
    this.dashboardWidgets = {
      ...this.dashboardWidgets,
      [widget]: !this.dashboardWidgets[widget as keyof typeof this.dashboardWidgets]
    };
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('dashboardWidgets', JSON.stringify(this.dashboardWidgets));
    }
  }

  toggleAllWidgets(): void {
    const allOn = Object.values(this.dashboardWidgets).every(v => v);
    const newState = !allOn;
    this.dashboardWidgets = {
      stats: newState,
      trmChart: newState,
      activity: newState,
      quickAccess: newState,
      tasks: newState,
      calendar: newState,
      presentismo: newState
    };
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('dashboardWidgets', JSON.stringify(this.dashboardWidgets));
    }
  }

  refrescarCalendario(): void {
    this.loadingCalendar = true;
    // Clear the URL to force the iframe to unload
    this.outlookCalendarUrl = null;
    
    setTimeout(() => {
      this.updateCalendarUrl(); // Restore the URL to trigger a reload
      this.loadingCalendar = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  abrirModalEventoOutlook(): void {
    window.open('https://outlook.office.com/calendar/0/deeplink/compose', '_blank');
  }

  cambiarCalendario(id: string): void {
    this.selectedCalendarId = id;
    this.updateCalendarUrl();
    this.refrescarCalendario();
  }

  private updateCalendarUrl(): void {
    const calendar = this.availableCalendars.find(c => c.id === this.selectedCalendarId);
    if (calendar) {
      this.outlookCalendarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(calendar.url);
    }
  }


  // ========================================
  //  FAVORITOS MEJORADOS - Ordenados primero
  // ========================================
  toggleFavorite(id: number): void {
    if (this.favorites.includes(id)) {
      this.favorites = this.favorites.filter(f => f !== id);
    } else {
      this.favorites = [...this.favorites, id];
    }

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }

    //  Reordenar los sistemas para mostrar favoritos primero
    this.reordenarSistemas();
  }

  isFavorite(id: number): boolean {
    return this.favorites.includes(id);
  }

  //  Reordenar sistemas poniendo favoritos primero
  private reordenarSistemas(): void {
    const favoritos = this.sistemaInformacionData.filter(s => this.favorites.includes(s.id));
    const noFavoritos = this.sistemaInformacionData.filter(s => !this.favorites.includes(s.id));
    this.sistemaInformacionData = [...favoritos, ...noFavoritos];
  }

  // ========================================
  // BÚSQUEDA
  // ========================================
  get filteredSistemas(): SistemaInformacion[] {
    let sistemas = this.sistemaInformacionData;
    
    if (this.searchQuery) {
      sistemas = sistemas.filter(s =>
        s.nombre.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    
    return sistemas;
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  get tienePermisoConfiguracion(): boolean {
    return this.sistemaInformacionData.some(s =>
      s.nombre.toUpperCase().includes('CONFIGURACION')
    );
  }

  // ========================================
  // MENÚ DE USUARIO & BLOQUE "MI DÍA"
  // ========================================
  estadoDisponibilidad: 'sede' | 'reunion' | 'remoto' | 'ocupado' = 'sede';
  miDiaData: {
    estado?: 'sede' | 'reunion' | 'remoto' | 'ocupado';
    ingreso_hoy?: { hora: string; puntual: boolean };
    pendientes?: { tickets: number; aprobaciones: number; formatos: number; notificaciones: number };
  } | null = null;
  cargandoMiDia: boolean = false;
  miDiaVisible: boolean = true;
  miDiaTimer: any = null;

  get totalPendientes(): number {
    if (!this.miDiaData?.pendientes) {
      return this.notificaciones.length;
    }
    const p = this.miDiaData.pendientes;
    return (p.tickets || 0) + (p.aprobaciones || 0) + (p.formatos || 0) + (p.notificaciones || 0);
  }

  get pendientesResumen() {
    return {
      tickets: this.miDiaData?.pendientes?.tickets ?? 0,
      aprobaciones: this.miDiaData?.pendientes?.aprobaciones ?? 0,
      formatos: this.miDiaData?.pendientes?.formatos ?? 0,
      notificaciones: this.miDiaData?.pendientes?.notificaciones ?? this.notificaciones.length
    };
  }

  get ingresoHoyResumen(): { hora: string; puntual: boolean } | null {
    if (this.miDiaData?.ingreso_hoy?.hora && this.miDiaData.ingreso_hoy.hora !== '--:--') {
      return this.miDiaData.ingreso_hoy;
    }
    const diaHoy = this.diasMesPresentismo.find(d => d.esHoy);
    if (diaHoy?.primeraEntrada) {
      return {
        hora: diaHoy.primeraEntrada,
        puntual: this.estadoEntrada(diaHoy) === 'ok'
      };
    }
    return null;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.cargarResumenMiDia();
      this.iniciarTimerMiDia();
    } else {
      this.detenerTimerMiDia();
    }
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
    this.detenerTimerMiDia();
  }

  iniciarTimerMiDia(): void {
    this.detenerTimerMiDia();
    this.miDiaTimer = setInterval(() => {
      if (this.isUserMenuOpen) {
        this.cargarResumenMiDia(false);
      }
    }, 60000);
  }

  detenerTimerMiDia(): void {
    if (this.miDiaTimer) {
      clearInterval(this.miDiaTimer);
      this.miDiaTimer = null;
    }
  }

  cargarResumenMiDia(mostrarSkeleton: boolean = true): void {
    if (mostrarSkeleton && !this.miDiaData) {
      this.cargandoMiDia = true;
    }
    this.http.get<any>('/api/perfil/resumen.php').subscribe({
      next: (res) => {
        this.cargandoMiDia = false;
        this.miDiaVisible = true;
        if (res) {
          this.miDiaData = res;
          if (res.estado && ['sede', 'reunion', 'remoto', 'ocupado'].includes(res.estado)) {
            this.estadoDisponibilidad = res.estado;
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('bgreen_estado_disponibilidad', res.estado);
            }
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoMiDia = false;
        // Fallback robusto si el endpoint responde 404 o no está disponible
        const guardado = isPlatformBrowser(this.platformId) ? localStorage.getItem('bgreen_estado_disponibilidad') : null;
        if (guardado && ['sede', 'reunion', 'remoto', 'ocupado'].includes(guardado as any)) {
          this.estadoDisponibilidad = guardado as any;
        }
        if (!this.miDiaData) {
          this.miDiaData = {
            estado: this.estadoDisponibilidad,
            ingreso_hoy: this.ingresoHoyResumen || { hora: '07:28 AM', puntual: true },
            pendientes: {
              tickets: 0,
              aprobaciones: 0,
              formatos: 0,
              notificaciones: this.notificaciones.length
            }
          };
        }
        this.miDiaVisible = true;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarEstadoDisponibilidad(nuevoEstado: 'sede' | 'reunion' | 'remoto' | 'ocupado'): void {
    this.estadoDisponibilidad = nuevoEstado;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('bgreen_estado_disponibilidad', nuevoEstado);
    }
    if (this.miDiaData) {
      this.miDiaData.estado = nuevoEstado;
    }
    this.http.post('/api/perfil/estado.php', { estado: nuevoEstado }).subscribe({
      next: () => {},
      error: () => {}
    });
    this.cdr.detectChanges();
  }

  navegarPendiente(event: Event, ruta: string): void {
    event.preventDefault();
    this.closeUserMenu();
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
      window.open(ruta, '_blank');
    } else {
      this.router.navigateByUrl(ruta).catch(() => {
        window.location.href = ruta;
      });
    }
  }

  abrirPanelNotificacionesDesdeMiDia(): void {
    this.closeUserMenu();
    this.isNotificationMenuOpen = true;
  }

  logout(): void {
    this.authService.logout();
  }

  // Detectar click fuera del menú
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Desbloquear el contexto de audio en la primera interacción del usuario
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const target = event.target as HTMLElement;
    const userMenu = document.querySelector('.user-menu-container');
    if (userMenu && !userMenu.contains(target)) {
      if (this.isUserMenuOpen) {
        this.detenerTimerMiDia();
      }
      this.isUserMenuOpen = false;
    }
  }

  // ========================================
  // MODAL HERRAMIENTAS IA
  // ========================================
  openIaModal(): void {
    this.isIaModalOpen = true;
  }

  closeIaModal(): void {
    this.isIaModalOpen = false;
  }

  toggleDetalleSeguridadIa(): void {
    this.mostrarDetalleSeguridadIa = !this.mostrarDetalleSeguridadIa;
  }

  @HostListener('window:keydown.escape')
  onKeydownEscape(): void {
    if (this.isActualizacionesModalOpen) {
      if (this.puedeCerrarModalActualizaciones) {
        this.cerrarModalActualizaciones();
      }
      return;
    }
    if (this.isIaModalOpen) {
      this.closeIaModal();
    }
  }

  // ========================================
  // MODAL ACTUALIZACIONES 2027
  // ========================================
  iniciarTemporizadorCierreActualizaciones(): void {
    if (this.actualizacionesTimerInterval) {
      clearInterval(this.actualizacionesTimerInterval);
      this.actualizacionesTimerInterval = null;
    }
    this.puedeCerrarModalActualizaciones = false;
    this.segundosRestantesActualizaciones = 5;

    if (isPlatformBrowser(this.platformId)) {
      this.actualizacionesTimerInterval = setInterval(() => {
        if (this.segundosRestantesActualizaciones > 1) {
          this.segundosRestantesActualizaciones--;
          this.cdr.detectChanges();
        } else {
          this.segundosRestantesActualizaciones = 0;
          this.puedeCerrarModalActualizaciones = true;
          clearInterval(this.actualizacionesTimerInterval);
          this.actualizacionesTimerInterval = null;
          this.cdr.detectChanges();
        }
      }, 1000);
    }
  }

  iniciarSliderActualizaciones(): void {
    this.detenerSliderActualizaciones();
    if (isPlatformBrowser(this.platformId)) {
      this.sliderActualizacionesInterval = setInterval(() => {
        if (!this.sliderPausado && this.isActualizacionesModalOpen) {
          this.siguienteSlideAutomatico();
        }
      }, 5000);
    }
  }

  detenerSliderActualizaciones(): void {
    if (this.sliderActualizacionesInterval) {
      clearInterval(this.sliderActualizacionesInterval);
      this.sliderActualizacionesInterval = null;
    }
  }

  siguienteSlideAutomatico(): void {
    if (this.actualizacionesList && this.actualizacionesList.length > 0) {
      this.actualizacionIndex = (this.actualizacionIndex + 1) % this.actualizacionesList.length;
      this.subImagenActualUrl = null;
      this.cdr.detectChanges();
    }
  }

  verificarModalActualizaciones(): void {
    if (isPlatformBrowser(this.platformId)) {
      const hoy = new Date();
      const anio = hoy.getFullYear();
      // Válido únicamente entre el 8 y el 16 de octubre inclusive. Después del 16 de octubre ya no debe salir más.
      const fechaInicio = new Date(anio, 9, 8, 0, 0, 0);
      const fechaFin = new Date(anio, 9, 16, 23, 59, 59);
      const dentroDeRangoFechas = hoy >= fechaInicio && hoy <= fechaFin;

      if (dentroDeRangoFechas) {
        setTimeout(() => {
          this.isActualizacionesModalOpen = true;
          this.actualizacionIndex = 0;
          this.subImagenActualUrl = null;
          this.iniciarTemporizadorCierreActualizaciones();
          this.iniciarSliderActualizaciones();
          this.cdr.detectChanges();
        }, 700);
      }
    }
  }

  abrirModalActualizaciones(): void {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const fechaInicio = new Date(anio, 9, 8, 0, 0, 0);
    const fechaFin = new Date(anio, 9, 16, 23, 59, 59);
    if (hoy < fechaInicio || hoy > fechaFin) {
      return;
    }
    this.isActualizacionesModalOpen = true;
    this.actualizacionIndex = 0;
    this.subImagenActualUrl = null;
    this.iniciarTemporizadorCierreActualizaciones();
    this.iniciarSliderActualizaciones();
  }

  cerrarModalActualizaciones(): void {
    if (!this.puedeCerrarModalActualizaciones) {
      return;
    }
    this.isActualizacionesModalOpen = false;
    this.detenerSliderActualizaciones();
    if (this.actualizacionesTimerInterval) {
      clearInterval(this.actualizacionesTimerInterval);
      this.actualizacionesTimerInterval = null;
    }
  }

  setActualizacionIndex(idx: number): void {
    if (idx >= 0 && idx < this.actualizacionesList.length) {
      this.actualizacionIndex = idx;
      this.subImagenActualUrl = null;
      this.iniciarSliderActualizaciones();
    }
  }

  getSubImagenUrl(): string {
    const item = this.actualizacionesList[this.actualizacionIndex];
    if (this.subImagenActualUrl && item?.imagenes?.some(i => i.url === this.subImagenActualUrl)) {
      return this.subImagenActualUrl;
    }
    return item?.imagen || '';
  }

  setSubImagenUrl(url: string): void {
    this.subImagenActualUrl = url;
  }

  siguienteActualizacion(): void {
    if (this.actualizacionesList && this.actualizacionesList.length > 0) {
      this.actualizacionIndex = (this.actualizacionIndex + 1) % this.actualizacionesList.length;
      this.subImagenActualUrl = null;
      this.iniciarSliderActualizaciones();
    }
  }

  anteriorActualizacion(): void {
    if (this.actualizacionesList && this.actualizacionesList.length > 0) {
      this.actualizacionIndex = (this.actualizacionIndex - 1 + this.actualizacionesList.length) % this.actualizacionesList.length;
      this.subImagenActualUrl = null;
      this.iniciarSliderActualizaciones();
    }
  }

  onActualizacionImgError(event: Event, item: ActualizacionItem): void {
    const img = event.target as HTMLImageElement;
    if (img && item.imagenFallback && !img.src.includes(item.imagenFallback)) {
      img.src = item.imagenFallback;
    }
  }

  get filteredIaCategories(): IaCategory[] {
    let categories = this.iaCategories;

    if (this.iaSelectedCategory !== 'TODAS') {
      categories = categories.filter(c => c.categoria === this.iaSelectedCategory);
    }

    if (this.iaSearchQuery.trim()) {
      const q = this.iaSearchQuery.toLowerCase().trim();
      categories = categories.filter(c => 
        c.herramientas.some(h => 
          h.nombre.toLowerCase().includes(q) || 
          h.descripcion.toLowerCase().includes(q)
        )
      );
    }

    return categories;
  }

  getHerramientasFiltradas(categoria: IaCategory): IaTool[] {
    if (!this.iaSearchQuery.trim()) {
      return categoria.herramientas;
    }
    const q = this.iaSearchQuery.toLowerCase().trim();
    return categoria.herramientas.filter(h => 
      h.nombre.toLowerCase().includes(q) || 
      h.descripcion.toLowerCase().includes(q)
    );
  }

  onLogoError(event: Event, name: string): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=16a34a&color=fff&rounded=true&bold=true`;
    }
  }

  // ========================================
  // GRÁFICO TRM
  // ========================================
  private createTrmChart(): void {
    if (!this.trmChartRef) return;

    const ctx = this.trmChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (this.trmChart) {
      this.trmChart.destroy();
    }

    // Preparar datos
    const labels = this.trmHistoricalData.map(item => item.fecha);
    const data = this.trmHistoricalData.map(item => item.valor);

    // Crear gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    // Crear el gráfico
    this.trmChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'TRM (COP/USD)',
          data: data,
          borderColor: '#10b981',
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#059669',
          pointHoverBorderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: this.darkMode ? '#1e293b' : '#ffffff',
            titleColor: this.darkMode ? '#f1f5f9' : '#1e293b',
            bodyColor: this.darkMode ? '#f1f5f9' : '#1e293b',
            borderColor: this.darkMode ? '#475569' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                const index = context.dataIndex;
                const variacion = this.trmHistoricalData[index]?.variacion || 0;
                const safeValue = value ?? 0;

                return [
                  `Valor: $ ${safeValue.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  variacion !== 0 ? `Variación: ${variacion > 0 ? '+' : ''}${variacion}%` : ''
                ].filter(Boolean);
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: this.darkMode ? '#374151' : '#e5e7eb'
            },
            ticks: {
              color: this.darkMode ? '#9ca3af' : '#6b7280',
              font: {
                size: 12
              }
            }
          },
          y: {
            grid: {
              color: this.darkMode ? '#374151' : '#e5e7eb'
            },
            ticks: {
              color: this.darkMode ? '#9ca3af' : '#6b7280',
              font: {
                size: 12
              },
              callback: function (value) {
                return '$ ' + Number(value).toLocaleString('es-CO');
              }
            },
            beginAtZero: false
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      }
    });
  }

  // ========================================
  // TRM
  // ========================================
  openTrmModal(): void {
    this.isTrmModalOpen = true;
  }

  closeTrmModal(): void {
    this.isTrmModalOpen = false;
  }

  searchTrmByDate(): void {
    if (!this.selectedTrmDate) {
      this.trmResult = null;
      return;
    }

    const found = this.allTrmData.find(item => item.fechaCorta === this.selectedTrmDate);
    this.trmResult = found || null;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CO');
  }

  loadTrmData(): void {
    this.listass.getTrmData().subscribe(data => {
      if (!data || data.length === 0) return;

      this.allTrmData = data.map(item => ({
        ...item,
        fechaCorta: new Date(item.vigenciadesde).toISOString().split('T')[0]
      }));

      // Valor actual
      const latest = data[0];
      this.currentTrmValue = parseFloat(latest.valor).toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      // Últimos 7 días
      const last7 = data.slice(0, 7);
      this.trmHistory = last7.map(item => ({
        fecha: new Date(item.vigenciadesde).toLocaleDateString('es-CO'),
        valor: parseFloat(item.valor)
      }));

      const valores = last7.map(item => parseFloat(item.valor));
      this.MaximoTrm = Math.max(...valores);
      this.MinimoTrm = Math.min(...valores);

      // Para el gráfico
      this.trmHistoricalData = last7.reverse().map((item, idx, arr) => {
        const valor = parseFloat(item.valor);
        const variacion = idx > 0 ?
          ((valor - parseFloat(arr[idx - 1].valor)) / parseFloat(arr[idx - 1].valor) * 100).toFixed(2)
          : '0';

        return {
          fecha: new Date(item.vigenciadesde).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
          valor: valor,
          variacion: parseFloat(variacion)
        };
      });

      this.cdr.detectChanges();

      // Crear el gráfico después de cargar los datos
      if (this.dashboardWidgets.trmChart) {
        setTimeout(() => this.createTrmChart(), 100);
      }
    });
  }

  // ========================================
  // CARGA DE DATOS
  // ========================================
  private loadUserDataAndPermisos(): void {
    const userString = localStorage.getItem('usuario');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        this.fullName = `${user.nombre} ${user.apellido}`.toUpperCase();
        this.nameempresa = user.empresa_descripcion || user.descripcionEmpresa || 'N/A';
        this.id_usuario = user.idUsuario || user.id_usuario;
        this.initials = `${user.nombre?.charAt(0) || ''}${user.apellido?.charAt(0) || ''}`.toUpperCase();
        this.userEmail = user.email || user.correo || 'No disponible';
        this.userRole = user.rol || user.perfil || user.descripcionPerfil || 'Usuario';
        this.perfil_Fk = user.idPerfilFk || user.Id_perfil_fk || user.id_perfil_fk;
        
        // Datos para filtrado de asignación
        this.idAreaUsuario = user.id_area_fk || user.idArea || 0;
        this.idCargoUsuario = user.id_cargo_fk || user.id_cargo || user.idCargo || 0;
        this.esCargoLiderArea = [1, 2, 3].includes(Number(this.idCargoUsuario));
        this.generarAreasPresentismoHome();

        console.log('🏠 [Home] Verificando estado de clave:', {
          usuario: user.usuario,
          contrasenaExpirada: user.contrasenaExpirada
        });

        // Verificar si la contraseña está vencida
        if (user.contrasenaExpirada === true || user.contrasenaExpirada === 'true') {
          setTimeout(() => this.abrirModalCambiarClave(), 1000);
        }
        this.idDireccionUsuario = user.id_direccion_fk || user.idDireccion || 0;

        // Extraer cédula / documento para presentismo desde localStorage
        this.cedulaUsuario = (user.identificacion || user.cedula || user.documento || localStorage.getItem('cedula') || '').toString().trim();

        this.obtenerTareas();
        this.cargarEventosPresentismo();

        if (this.perfil_Fk) {
          this.verpermisos(this.perfil_Fk);
        }
      } catch (e) {
        console.error('Error al parsear usuario de localStorage', e);
        this.logout();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  verpermisos(id: any): void {
    this.homeservice.obtenerpermisos(id).subscribe({
      next: (data) => {
        const raw = (Array.isArray(data) ? [...data] : [data]).filter(s => s && s.id !== 9999);
        this.sistemaInformacionData = raw;
        //  Reordenar sistemas al cargar para mostrar favoritos primero
        this.reordenarSistemas();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar permisos:', err);
        this.sistemaInformacionData = [];
      }
    });
  }

  cargarUsuariosOficiales(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        // Ordenar alfabéticamente por nombre
        this.usuariosList = data.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        this.generarAreasPresentismoHome();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar usuarios oficiales', err);
      }
    });
  }

  cargarAreas(): void {
    this.listass.obtenerAreas().subscribe({
      next: (data) => {
        this.areasList = data;
        // Reforzar la obtención de la dirección del usuario logueado desde la lista de áreas
        if (this.idAreaUsuario) {
          const area = this.areasList.find(a => Number(a.idArea || a.id_area) === Number(this.idAreaUsuario));
          if (area) {
            this.idDireccionUsuario = Number(area.idDireccionFk || area.id_direccion_fk || (area.direccion ? area.direccion.idDireccion : 0));
          }
        }
        this.generarAreasPresentismoHome();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar áreas', err);
      }
    });
  }

  get filteredUsuariosList(): any[] {
    if (!this.usuariosList || this.usuariosList.length === 0) return [];

    const myCargo = Number(this.idCargoUsuario);
    // Aquellos que el cargo sea = 1, puedan ver todas las áreas
    if (myCargo === 1) {
      return this.usuariosList;
    }

    const myArea = Number(this.idAreaUsuario);
    const myDireccion = Number(this.idDireccionUsuario);

    return this.usuariosList.filter(u => {
      // Normalizar IDs para comparación (soportando variaciones de nombres de campos del backend)
      const uArea = Number(u.id_area_fk || u.Id_area_fk || u.idArea || 0);
      
      // Intentar obtener dirección directamente o por búsqueda en la lista de áreas
      let uDireccion = Number(u.id_direccion_fk || u.Id_direccion_fk || u.idDireccion || 0);
      
      if (!uDireccion && uArea && this.areasList.length > 0) {
        const areaInfo = this.areasList.find(a => Number(a.idArea || a.id_area) === uArea);
        if (areaInfo) {
          uDireccion = Number(areaInfo.idDireccionFk || areaInfo.id_direccion_fk || (areaInfo.direccion ? areaInfo.direccion.idDireccion : 0));
        }
      }

      const mismaDireccion = uDireccion !== 0 && uDireccion === myDireccion;
      const mismaArea = uArea !== 0 && uArea === myArea;

      // Aplicar reglas según el cargo
      if (myCargo === 1) {
        // Cargo 1 ve todas las áreas de su propia dirección
        // Si por alguna razón la dirección es 0, al menos mostramos su área
        return mismaDireccion || mismaArea || Number(u.idUsuario || u.id_usuario) === Number(this.id_usuario);
      } else {
        // Otros cargos solo ven su propia área y dirección
        return (mismaArea && mismaDireccion) || Number(u.idUsuario || u.id_usuario) === Number(this.id_usuario);
      }
    });
  }

  cargarContactosIniciales(): void {
    this.homeservice.contactos().subscribe({
      next: (response) => {
        this.sistemacontactosData = Array.isArray(response) ? response : [response];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar contactos iniciales', err);
        this.sistemacontactosData = [];
      }
    });
  }

  contactos(): void {
    this.homeservice.contactos().subscribe({
      next: (data) => {
        this.sistemacontactosData = Array.isArray(data) ? data : [data];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar los contactos', err);
        this.sistemacontactosData = [];
        this.cdr.detectChanges();
      }
    });
  }

  cargarFormatos(): void {
    this.formatosData = [
      {
        id: 1,
        nombre: 'Solicitud de Vacaciones',
        descripcion: 'Formato oficial para solicitar días de vacaciones y permisos laborales.',
        categoria: 'Gestión Humana',
        extension: 'XLSX',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/GGH-F-17%20FORMATO%20SOLICITUD%20DE%20VACACIONES%20(1).xlsx'
      },
      {
        id: 2,
        nombre: 'Formato de comidas y taxis',
        descripcion: 'Formato para legalización y reporte de gastos de viaje, taxis y alimentación.',
        categoria: 'Finanzas y Gastos',
        extension: 'XLSX',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/FORMATO%20DE%20SOLICITUDES%20DE%20ALIMENTACION%20Y%20TAXIS.xlsx'
      },
      {
        id: 3,
        nombre: 'Ingreso y salida de herramientas',
        descripcion: 'Registro y control de solicitud para el ingreso y salida de herramientas de la planta.',
        categoria: 'Operaciones',
        extension: 'XLSX',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/Formato%20Ingreso%20y%20salida%20de%20herramientas.xlsx'
      },
      {
        id: 4,
        nombre: 'Solicitud Ingreso a TBS',
        descripcion: 'Reporte y solicitud de autorización para el ingreso a instalaciones TBS.',
        categoria: 'Operaciones',
        extension: 'XLSX',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/Solicitud%20de%20ingreso%20TBS.xlsx'
      },
      {
        id: 5,
        nombre: 'Lista Asistencia',
        descripcion: 'Control formal de asistencia a capacitaciones, reuniones y comités corporativos.',
        categoria: 'Gestión Humana',
        extension: 'XLSX',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/GGH_F_07%20Lista_asistencia_%20V10%20(1).xlsx'
      },
      {
        id: 6,
        nombre: 'Solicitud de compra o servicio',
        descripcion: 'Formato para requerimiento formal de adquisiciones de bienes o contratación de servicios.',
        categoria: 'Finanzas y Gastos',
        extension: 'XLSX',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/GABT-PR-01-F-01%20Formato%20solicitud%20de%20Compra%20o%20Servicio%20(2).xlsx'
      }
    ];
    this.cdr.detectChanges();
  }

  // ========================================
  // MODALES
  // ========================================
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  openModalformatos(type: string): void {
    this.modalType = type;

    if (type === 'contactos') {
      this.modalTitle = 'Directorio de Contactos';
      if (this.sistemacontactosData.length === 0) {
        this.contactos();
      }
    } else if (type === 'formatos') {
      this.modalTitle = 'Centro de Formatos y Documentos';
      this.cargarFormatos();
    }

    this.isModalOpen = true;
  }

  closeModalformatos(): void {
    this.isModalOpen = false;
  }

  openModal(imageSrc: string): void {
    this.selectedImage = imageSrc;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedImage = null;
  }

  onModalClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal')) {
      this.closeModal();
    }
  }

  // ========================================
  //  TAREAS MEJORADAS
  // ========================================
  obtenerTareas(): void {
    this.homeservice.getTareasPorUsuario(this.id_usuario)
      .subscribe({
        next: (data) => {

          const prioridadOrden: Record<string, number> = { 'ALTA': 0, 'MEDIA': 1, 'BAJA': 2 };
          const sortedData = data.sort((a, b) => {
            // 1. Priorizar vencidas
            const isVencidaA = this.esTareaVencida(a) ? 1 : 0;
            const isVencidaB = this.esTareaVencida(b) ? 1 : 0;
            if (isVencidaA !== isVencidaB) return isVencidaB - isVencidaA;

            // 2. Prioridad normal
            const pA = prioridadOrden[a.prioridad?.nombre?.toUpperCase()] ?? 1;
            const pB = prioridadOrden[b.prioridad?.nombre?.toUpperCase()] ?? 1;
            if (pA !== pB) return pA - pB;
            
            // 3. Fecha de creación
            return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
          });
          
          this.tareas = sortedData;

          // DEBUG: Mostrar datos de tareas en consola
        
          
          this.tareasActivas = sortedData.filter(t => {
            const estado = t.estado?.nombre?.toUpperCase() || '';
            return ['CREADA', 'INICIADA', 'EN PROCESO', 'PENDIENTE'].includes(estado);
          });
          
          this.tareasFinalizadas = data.filter(t => {
            const estado = t.estado?.nombre?.toUpperCase() || '';
            return ['FINALIZADA', 'COMPLETADA', 'CANCELADA'].includes(estado);
          }).sort((a, b) => {
            const dateA = new Date(a.fechaCompletado || a.fechaCreacion).getTime();
            const dateB = new Date(b.fechaCompletado || b.fechaCreacion).getTime();
            return dateB - dateA;
          }).slice(0, 30);

          this.cdr.detectChanges();
        },
        error: (error) => {
          if (error?.status !== 0) {
            console.error('Error al traer tareas', error);
          }
        }
      });
  }

  // Getter para saber si hay tareas nuevas
  get tieneTareasNuevas(): boolean {
    return this.tareasActivas.some(t => t.estado.nombre === 'CREADA');
  }

  //  Getter para contar tareas de hoy
  get tareasHoy(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return this.tareasActivas.filter(t => {
      const fechaTarea = new Date(t.fechaCreacion);
      fechaTarea.setHours(0, 0, 0, 0);
      return fechaTarea.getTime() === hoy.getTime();
    }).length;
  }


  // Modal de tareas
  isModalTareaOpen: boolean = false;

  abrirModalTarea(): void {
    this.isModalTareaOpen = true;
  }

  cerrarModalTarea(): void {
    this.isModalTareaOpen = false;
    this.resetFormulario();
  }

  toggleTasksFocus(): void {
    this.focusTasksMode = !this.focusTasksMode;
  }

  abrirModalCalendarioHeader(): void {
    this.isModalCalendarioHeaderOpen = true;
    this.updateCalendarUrl();
  }

  cerrarModalCalendarioHeader(): void {
    this.isModalCalendarioHeaderOpen = false;
  }
  crearTarea(): void {
    if (!this.nuevaTarea.titulo.trim()) return;

    this.nuevaTarea.idUsuario = this.usuarioAsignadoId || this.id_usuario;
    this.nuevaTarea.idUsuarioCreador = this.id_usuario;

    this.nuevaTarea.idEstado = 1; // CREADA

    const payload: CreateTareaRequest = {
      ...this.nuevaTarea,
      fechaLimite: this.nuevaTarea.fechaLimite ? 
        (this.nuevaTarea.fechaLimite.length === 16 ? this.nuevaTarea.fechaLimite + ':00' : this.nuevaTarea.fechaLimite) 
        : undefined
    };

    this.homeservice.crearTarea(payload)
      .subscribe({
        next: () => {
          this.obtenerTareas();
          this.cerrarModalTarea();
          this.usuarioAsignadoId = null;
        },
        error: err => console.error(err)
      });

  }

  resetFormulario(): void {
    this.nuevaTarea.titulo = '';
    this.nuevaTarea.descripcion = '';
    this.nuevaTarea.idPrioridad = 1;
    this.nuevaTarea.fechaLimite = '';
  }

  // Modal Editar Tarea
  isModalEditarOpen: boolean = false;
  tareaEdit: any = {};

  abrirModalEditar(tarea: Tarea): void {
    if (tarea.idUsuarioCreador !== this.id_usuario) return;
    
    // Clonar para no editar directamente en la lista
    this.tareaEdit = { ...tarea };
    this.tareaEdit.idPrioridad = tarea.prioridad?.id || 2;
    
    // Formatear fecha para input datetime-local
    if (tarea.fechaLimite) {
      this.tareaEdit.fechaLimite = new Date(tarea.fechaLimite).toISOString().slice(0, 16);
    } else {
      this.tareaEdit.fechaLimite = '';
    }
    
    this.isModalEditarOpen = true;
  }

  cerrarModalEditar(): void {
    this.isModalEditarOpen = false;
    this.tareaEdit = {};
  }

  guardarCambiosTarea(): void {
    if (!this.tareaEdit.titulo?.trim()) return;

    const payload = {
      titulo: this.tareaEdit.titulo,
      descripcion: this.tareaEdit.descripcion,
      idPrioridad: this.tareaEdit.idPrioridad,
      fechaLimite: this.tareaEdit.fechaLimite ? this.tareaEdit.fechaLimite + ':00' : null,
      clearFechaLimite: !this.tareaEdit.fechaLimite
    };

    this.homeservice.actualizarTarea(this.tareaEdit.id, payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Tarea actualizada',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
        this.obtenerTareas();
        this.cerrarModalEditar();
        if (this.tareaSeleccionada?.id === this.tareaEdit.id) {
          this.homeservice.getTareaPorId(this.tareaEdit.id).subscribe(t => this.tareaSeleccionada = t);
        }
      },
      error: err => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'No se pudieron guardar los cambios.'
        });
      }
    });
  }

  cambiarEstado(tarea: Tarea, idEstado: number): void {
    if (idEstado === 3 || idEstado === 4) {
      // Finalizar o Cancelar -> Pedir nota
      const isFinalizar = idEstado === 3;
      Swal.fire({
        title: isFinalizar ? 'Finalizar Tarea' : 'Cancelar Tarea',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; gap:16px;">
            <div style="
              width: 60px; height: 60px; border-radius: 50%; 
              background: ${isFinalizar ? '#d1fae5' : '#fee2e2'}; 
              display: flex; align-items: center; justify-content: center;
              color: ${isFinalizar ? '#10b981' : '#ef4444'}; font-size: 30px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              <i class="bi ${isFinalizar ? 'bi-check2-circle' : 'bi-x-circle'}"></i>
            </div>
            <div style="text-align:center;">
              <p style="margin:0; font-size:14px; color:#6b7280;">Por favor, ingresa una nota u observación de cierre antes de continuar.</p>
            </div>
            <textarea id="swal-nota-cierre" class="swal2-textarea" 
              style="width:100%; margin:0; border-radius:12px; font-size:14px; border:1px solid #e5e7eb; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); height:100px;" 
              placeholder="Escribe aquí tu observación..."></textarea>
          </div>`,
        showCancelButton: true,
        confirmButtonText: isFinalizar ? '💾 Finalizar' : '💾 Cancelar',
        cancelButtonText: 'Volver',
        confirmButtonColor: isFinalizar ? '#10b981' : '#ef4444',
        cancelButtonColor: '#9ca3af',
        width: '450px',
        padding: '2rem',
        preConfirm: () => {
          const nota = (document.getElementById('swal-nota-cierre') as HTMLTextAreaElement)?.value?.trim();
          return nota || '';
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.ejecutarCambioEstado(tarea.id, idEstado, result.value);
        }
      });
    } else {
      this.ejecutarCambioEstado(tarea.id, idEstado);
    }
  }

  private ejecutarCambioEstado(idTarea: number, idEstado: number, notaCierre?: string): void {
    this.homeservice.actualizarTarea(idTarea, { idEstado, notaCierre })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Tarea actualizada',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
          });
          this.obtenerTareas();
          if (this.tareaSeleccionada && this.tareaSeleccionada.id === idTarea) {
            this.homeservice.getTareaPorId(idTarea).subscribe(t => this.tareaSeleccionada = t);
          }
        },
        error: err => {
          console.error(err);
          const msg = err.error?.message || 'Hubo un error al actualizar la tarea.';
          Swal.fire({
            icon: 'error',
            title: 'No se pudo actualizar',
            text: msg
          });
        }
      });
  }

  editarFechaLimite(tarea: Tarea): void {
    if (tarea.idUsuarioCreador !== this.id_usuario) return;

    // Formatear fecha actual para el input (formato ISO local YYYY-MM-DDTHH:mm)
    const fechaActual = tarea.fechaLimite
      ? new Date(tarea.fechaLimite).toISOString().slice(0, 16)
      : '';

    Swal.fire({
      title: 'Fecha de Vencimiento',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:20px; padding:10px 0;">
          <div style="
            width: 50px; height: 50px; border-radius: 12px; 
            background: #ecfdf5; display: flex; align-items: center; justify-content: center;
            color: #10b981; font-size: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <i class="bi bi-calendar-check"></i>
          </div>
          
          <div style="width:100%; text-align:left;">
            <label style="display:block; font-size:12px; font-weight:700; color:#4b5563; text-transform:uppercase; margin-bottom:8px; letter-spacing:0.5px;">
              Seleccione el nuevo límite
            </label>
            <input id="swal-fecha-limite" type="datetime-local" class="swal2-input"
              value="${fechaActual}"
              style="width:100%; margin:0; font-size:15px; border-radius:10px; border:1px solid #d1d5db; height:45px;" />
          </div>

          <div style="width:100%; text-align:center; padding-top:5px;">
            <button id="swal-quitar-fecha" style="
              background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px;
              padding: 8px 16px; font-size: 13px; color: #6b7280; cursor: pointer;
              transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;">
              <i class="bi bi-calendar-x"></i> Quitar fecha límite
            </button>
          </div>
        </div>`,
      showCancelButton: true,
      confirmButtonText: '💾 Actualizar',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#9ca3af',
      width: '400px',
      padding: '2rem',
      didOpen: () => {
        const btnQuitar = document.getElementById('swal-quitar-fecha');
        btnQuitar?.addEventListener('click', () => {
          (document.getElementById('swal-fecha-limite') as HTMLInputElement).value = '';
          Swal.clickConfirm();
        });
      },
      preConfirm: () => {
        const val = (document.getElementById('swal-fecha-limite') as HTMLInputElement)?.value;
        return val || null; // null = quitar fecha
      }
    }).then(result => {
      if (result.isConfirmed) {
        const val = result.value; // string 'YYYY-MM-DDTHH:mm' o vacío
        // Enviar sin zona horaria para que Spring LocalDateTime lo acepte
        const nuevaFecha = val ? val + ':00' : null;
        const payload = nuevaFecha
          ? { fechaLimite: nuevaFecha }
          : { clearFechaLimite: true };

        this.homeservice.actualizarTarea(tarea.id, payload).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: nuevaFecha ? 'Fecha límite actualizada' : 'Fecha límite eliminada',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2500
            });
            this.obtenerTareas();
            if (this.tareaSeleccionada?.id === tarea.id) {
              this.homeservice.getTareaPorId(tarea.id).subscribe(t => this.tareaSeleccionada = t);
            }
          },
          error: err => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'No se pudo actualizar la fecha.'
            });
          }
        });
      }
    });
  }

  editarTarea(tarea: Tarea): void {
    this.abrirModalEditar(tarea);
  }

  // Modal de historial
  abrirHistorial(): void {
    this.isModalHistorialOpen = true;
  }

  cerrarHistorial(): void {
    this.isModalHistorialOpen = false;
  }

  // Verificar si la tarea está vencida (fecha limite pasada y no terminada)
  esTareaVencida(tarea: Tarea): boolean {
    if (!tarea.fechaLimite) return false;
    
    const idEstado = tarea.estado?.id;
    // No marcar como vencida si ya está FINALIZADA (3) o CANCELADA (4)
    if (idEstado === 3 || idEstado === 4) return false;

    const ahora = new Date();
    const vencimiento = new Date(tarea.fechaLimite);
    return vencimiento < ahora;
  }

  // Verificar si se entregó a tiempo
  entregadaATiempo(tarea: Tarea): boolean {
    if (!tarea.fechaLimite || !tarea.fechaCompletado) return true;
    const vencimiento = new Date(tarea.fechaLimite);
    const fin = new Date(tarea.fechaCompletado);
    return fin <= vencimiento;
  }

  // Formatear tiempo relativo
  getTiempoRelativo(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    const ahora = new Date();
    const fechaTarea = new Date(fecha);
    const diff = ahora.getTime() - fechaTarea.getTime();
    
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  }

  getDuracion(tarea: Tarea): string {
    const inicio = tarea.fechaInicio ? new Date(tarea.fechaInicio) : new Date(tarea.fechaCreacion);
    const fin = tarea.fechaCompletado ? new Date(tarea.fechaCompletado) : new Date();
    const diff = fin.getTime() - inicio.getTime();

    const dias = Math.floor(diff / 86400000);
    const horas = Math.floor((diff % 86400000) / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);

    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas === 0) return `${minutos}m`;
    return `${horas}h ${minutos}m`;
  }

  // Métodos de Seguimiento (Chat)
  abrirDetalle(tarea: Tarea, resaltar: boolean = false): void {

    this.tareaSeleccionada = tarea;
    this.isModalDetalleOpen = true;
    this.cargarSeguimientos(tarea.id, true);
    
    if (resaltar) {
      // Scroll a la tarjeta en la lista antes de abrir el detalle
      setTimeout(() => {
        const el = document.querySelector(`[data-tarea-id="${tarea.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          document.getElementById('tareas-section')?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 80);

      this.tareaResaltadaId = tarea.id;
      setTimeout(() => {
        this.tareaResaltadaId = null;
      }, 3500);
    }

    // Marcar automáticamente como leídas las notificaciones de chat de esta tarea (uso == por si acaso)
    const notifs = this.notificaciones.filter(n => n.referenciaId == tarea.id && n.tipo === 'NUEVO_MENSAJE');
    if (notifs.length > 0) {
      notifs.forEach(n => this.leida(n));
      this.notificaciones = this.notificaciones.filter(n => !(n.referenciaId == tarea.id && n.tipo === 'NUEVO_MENSAJE'));
    }
  }

  tieneMensajesSinLeer(idTarea: number): boolean {
    return this.notificaciones.some(n => n.referenciaId === idTarea && n.tipo === 'NUEVO_MENSAJE');
  }

  getMensajesSinLeerCount(idTarea: number): number {
    return this.notificaciones.filter(n => n.referenciaId === idTarea && n.tipo === 'NUEVO_MENSAJE').length;
  }

  cerrarDetalle(): void {
    this.isModalDetalleOpen = false;
    this.tareaSeleccionada = null;
    this.seguimientos = [];
    this.mensajeSeguimiento = '';
  }

  getUserById(id?: number | null): any {
    if (id === undefined || id === null) return null;
    return this.usuariosList.find(u => Number(u.idUsuario || u.id_usuario) === Number(id));
  }

  getUserInitials(id?: number | null): string {
    if (id === undefined || id === null) return 'U';
    const user = this.getUserById(id);
    if (!user) return 'U';
    
    // Si tiene nombre y apellido
    if (user.nombre && user.apellido) {
      return (user.nombre.charAt(0) + user.apellido.charAt(0)).toUpperCase();
    }
    
    // Si solo tiene nombre o usuario
    const name = user.nombre || user.usuario || 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getUserDisplayName(id?: number | null): string {
    if (id === undefined || id === null) return 'Usuario';
    const user = this.getUserById(id);
    if (!user) return 'Usuario';
    if (user.nombre && user.apellido) {
      return `${user.nombre} ${user.apellido}`;
    }
    return user.nombre || user.usuario || 'Usuario';
  }

  getInitial(nombre?: string): string {
    if (!nombre) return 'U';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }
  cargarSeguimientos(idTarea: number, forceScroll: boolean = false): void {
    this.homeservice.getSeguimientos(idTarea).subscribe({
      next: (data) => {
        // Solo hacer scroll si hay mensajes nuevos o se fuerza
        const hadNewMessages = this.seguimientos.length < data.length;
        this.seguimientos = data;
        this.cdr.detectChanges();
        
        if (forceScroll || hadNewMessages) {
          this.scrollToBottom();
        }
      },
      error: (err) => console.error(err)
    });
  }

  private startBackgroundSync(): void {
    // Sincronización cada 6 segundos en segundo plano
    timer(0, 6000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.fetchNotificaciones();
        
        // Solo refrescar tareas si no estamos enfocados en crear una o algo similar
        // Pero para simplificar, refrescamos siempre ya que Angular es eficiente
        if (this.id_usuario) {
          this.obtenerTareas();
        }

        // Si el chat está abierto, refrescar mensajes
        if (this.isModalDetalleOpen && this.tareaSeleccionada) {
          this.cargarSeguimientos(this.tareaSeleccionada.id);
        }
      });
  }

  enviarMensaje(): void {
    if (!this.mensajeSeguimiento.trim() || !this.tareaSeleccionada) return;

    this.homeservice.enviarSeguimiento(this.tareaSeleccionada.id, this.id_usuario, this.mensajeSeguimiento)
      .subscribe({
        next: () => {
          this.mensajeSeguimiento = '';
          this.cargarSeguimientos(this.tareaSeleccionada!.id, true);
        },
        error: (err) => console.error(err)
      });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      // Intentar encontrar el contenedor del chat con los dos selectores posibles
      const chatContainer = document.querySelector('.detalle-chat-messages') || document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  irAUsuarios(): void {
    this.router.navigate(['app/configuracion/usuarios']);
  }

  irAConfiguracion(): void {
    this.closeUserMenu();
    this.router.navigate(['app/configuracion']);
  }

  irAPerfil(): void {
    this.closeUserMenu();
    this.router.navigate(['/perfil']);
  }

  irAPerfilAsistencia(): void {
    this.closeUserMenu();
    this.router.navigate(['/perfil'], { queryParams: { tab: 'asistencia' } });
  }

  irAOrganigrama(): void {
    this.closeUserMenu();
    this.router.navigate(['/organigrama']);
  }

cargarPulsos(): void {
    this.pulsoService.getActivePulsos().subscribe({
      next: (pulsos) => {
        this.pulsos = pulsos;
      },
      error: (error) => {
        console.error('Error al cargar pulsos:', error);
      }
    });
  }

  abrirPulso(pulso: Pulso): void {
    this.pulsoSeleccionado = pulso;
  }

  cerrarPulso(): void {
    this.pulsoSeleccionado = null;
  }







  get cargosContactos(): string[] {
    if (!this.sistemacontactosData) return [];
    const cargos = this.sistemacontactosData
      .map(c => c.cargo?.trim())
      .filter((cargo): cargo is string => !!cargo);
    return Array.from(new Set(cargos)).sort();
  }

  get filteredContactos(): any[] {
    let contactos = [...this.sistemacontactosData];
    const q = this.contactoSearchQuery?.toLowerCase().trim();

    if (q) {
      contactos = contactos.filter(c =>
        c.nombre?.toLowerCase().includes(q) ||
        c.cargo?.toLowerCase().includes(q) ||
        c.correo?.toLowerCase().includes(q) ||
        c.ext?.toString().includes(q)
      );
    }

    if (this.contactoCargoFiltro && this.contactoCargoFiltro !== 'TODOS') {
      contactos = contactos.filter(c => c.cargo?.trim() === this.contactoCargoFiltro);
    }

    // Ordenar por extensión de menor a mayor (los sin ext al final)
    return contactos.sort((a, b) => {
      const extA = parseInt(a.ext) || 999999;
      const extB = parseInt(b.ext) || 999999;
      if (extA !== extB) return extA - extB;
      return (a.nombre || '').localeCompare(b.nombre || '');
    });
  }

  get categoriasFormatos(): string[] {
    if (!this.formatosData || !Array.isArray(this.formatosData)) return [];
    const cats = this.formatosData
      .map((f: any) => f.categoria?.trim())
      .filter((cat: any): cat is string => !!cat);
    return Array.from(new Set(cats)).sort();
  }

  get filteredFormatos(): any[] {
    if (!this.formatosData || !Array.isArray(this.formatosData)) return [];
    let formatos = [...this.formatosData];
    const q = this.formatoSearchQuery?.toLowerCase().trim();

    if (q) {
      formatos = formatos.filter(f =>
        f.nombre?.toLowerCase().includes(q) ||
        f.descripcion?.toLowerCase().includes(q) ||
        f.categoria?.toLowerCase().includes(q)
      );
    }

    if (this.formatoCategoriaFiltro && this.formatoCategoriaFiltro !== 'TODOS') {
      formatos = formatos.filter(f => f.categoria?.trim() === this.formatoCategoriaFiltro);
    }

    return formatos;
  }

  copiarTexto(texto: string, mensaje: string): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      Swal.fire({
        icon: 'success',
        title: mensaje,
        text: texto,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
    }).catch(err => {
      console.error('Error al copiar texto: ', err);
    });
  }

  get tieneMayuscula(): boolean { return /[A-Z]/.test(this.nuevaClave); }
  get tieneMinuscula(): boolean { return /[a-z]/.test(this.nuevaClave); }
  get tieneNumero(): boolean    { return /[0-9]/.test(this.nuevaClave); }
  get tieneCaracterEspecial(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.nuevaClave); }
  get tieneLongitud(): boolean  { 
    const min = this.configSeguridad?.minCaracteres || 8;
    return this.nuevaClave.length >= min; 
  }
  
  get tieneLetras(): boolean { return /[a-zA-Z]/.test(this.nuevaClave); }

  get passwordValido(): boolean {
    if (!this.configSeguridad) return false;
    
    let valido = true;
    if (this.configSeguridad.minCaracteres > 0 && !this.tieneLongitud) valido = false;
    if (this.configSeguridad.requiereLetras && !this.tieneLetras) valido = false;
    if (this.configSeguridad.requiereNumeros && !this.tieneNumero) valido = false;
    if (this.configSeguridad.requiereEspeciales && !this.tieneCaracterEspecial) valido = false;
    
    return valido;
  }

  get claveConfirmadaValida(): boolean {
    return this.nuevaClave === this.confirmarClave && this.nuevaClave.length > 0;
  }

  get esDiferenteDeActual(): boolean {
    return this.nuevaClave !== this.claveActual && this.nuevaClave.length > 0;
  }

  abrirModalCambiarClave(): void {
    this.isModalCambiarClaveOpen = true;
    this.claveActual = '';
    this.nuevaClave = '';
    this.confirmarClave = '';
    this.errorClave = '';
    this.successClave = '';
    this.closeUserMenu();
  }

  cerrarModalCambiarClave(): void {
    // Si la clave está vencida, no dejar cerrar
    const userString = localStorage.getItem('usuario');
    if (userString) {
      const user = JSON.parse(userString);
      if (user.contrasenaExpirada === true || user.contrasenaExpirada === 'true') {
        Swal.fire({
          title: 'Acción requerida',
          text: 'Debe cambiar su clave antes de continuar.',
          icon: 'warning',
          confirmButtonColor: '#0a5c2e'
        });
        return;
      }
    }
    this.isModalCambiarClaveOpen = false;
    this.resetModal();
  }

  resetModal(): void {
    this.claveActual = '';
    this.nuevaClave = '';
    this.confirmarClave = '';
    this.errorClave = '';
    this.successClave = '';
  }

  guardarClave(): void {
    this.errorClave = '';
    this.successClave = '';

    if (!this.passwordValido) {
      this.errorClave = 'La nueva clave no cumple los requisitos.';
      return;
    }

    if (!this.claveConfirmadaValida) {
      this.errorClave = 'Las claves nuevas no coinciden.';
      return;
    }

    if (!this.esDiferenteDeActual) {
      this.errorClave = 'La nueva clave debe ser diferente a la actual.';
      return;
    }

    const dto = {
      idUsuario: this.id_usuario,
      claveActual: this.claveActual,
      nuevaClave: this.nuevaClave
    };

    this.usuarioService.cambiarClave(dto).subscribe({
      next: () => {
        this.successClave = 'Clave actualizada exitosamente.';
        
        // Actualizar localStorage para permitir navegación
        const userString = localStorage.getItem('usuario');
        if (userString) {
          const user = JSON.parse(userString);
          user.contrasenaExpirada = false;
          localStorage.setItem('usuario', JSON.stringify(user));
        }

        setTimeout(() => {
          this.isModalCambiarClaveOpen = false;
          this.resetModal();
        }, 2000);
      },
      error: (err) => {
        console.error('Error al cambiar clave:', err);
        this.errorClave = err.error?.error || 'Error al intentar cambiar la clave. Verifica tu clave actual.';
      }
    });
  }

  // ========================================
  // NOTIFICACIONES PERIODICAS
  // ========================================

  solicitarPermisoNotificaciones(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private mostrarNotificacionNativa(titulo: string, cuerpo: string, onClick?: () => void): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(titulo, {
        body: cuerpo,
        icon: 'assets/icons/icon-72x72.png'
      });
      if (onClick) {
        notif.onclick = () => {
          window.focus();
          notif.close();
          onClick();
        };
      }
    }
  }

  iniciarTemporizadorNotificaciones(): void {
    // Ejecutar inmediatamente al entrar
    this.verificarNotificacionesPendientes();

    // Luego, revisar cada 10 minutos (600000 ms) como recordatorio
    this.notificationInterval = setInterval(() => {
      this.verificarNotificacionesPendientes();
    }, 600000);
  }

  verificarNotificacionesPendientes(): void {
    if (!this.id_usuario) return;

    // Log para verificar el chequeo de recordatorios (cada 10 min)
    console.log(`[${new Date().toLocaleTimeString()}] 🔔 Ejecutando recordatorio de tareas pendientes (Ciclo de 10 min)...`);

    this.homeservice.getNotificacionesPendientes(this.id_usuario).subscribe({
      next: (tareasNotificar: any[]) => {
        if (tareasNotificar && tareasNotificar.length > 0) {
    
          this.playNotificationSound();

          // Notificación nativa del navegador (funciona aunque la consola no esté abierta)
          const titulosTexto = tareasNotificar.map(t => t.titulo).join(', ');
          this.mostrarNotificacionNativa(
            '¡Tienes tareas pendientes!',
            tareasNotificar.length === 1
              ? tareasNotificar[0].titulo
              : `${tareasNotificar.length} tareas: ${titulosTexto}`,
            () => {
              if (tareasNotificar.length === 1) {
                this.abrirDetalle(tareasNotificar[0]);
              } else {
                document.getElementById('tareas-section')?.scrollIntoView({ behavior: 'smooth' });
              }
            }
          );

          let alertHtml = '<div style="text-align: left;">';
          tareasNotificar.forEach(t => {
            alertHtml += `<p>• <strong>${t.titulo}</strong> (Prioridad: ${t.prioridad?.nombre || 'Media'})</p>`;
          });
          alertHtml += '</div>';

          Swal.fire({
            title: '¡Tienes tareas pendientes por revisar!',
            html: alertHtml,
            icon: 'info',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 10000,
            timerProgressBar: true,
            showCloseButton: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
              toast.style.cursor = 'pointer';
              toast.onclick = () => {
                if (tareasNotificar.length === 1) {
                  this.abrirDetalle(tareasNotificar[0]);
                } else {
                  document.getElementById('tareas-section')?.scrollIntoView({ behavior: 'smooth' });
                }
                Swal.close();
              };
            }
          });
        }
      },
      error: (err) => {
        console.error('Error verificando notificaciones', err);
      }
    });
  }

  playNotificationSound(): void {
    try {
      if (!this.audioCtx) {
        console.warn('⚠️ No se puede sonar: AudioContext no inicializado');
        return;
      }

      const emitirSonido = () => {
        const oscillator = this.audioCtx!.createOscillator();
        const gainNode = this.audioCtx!.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx!.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, this.audioCtx!.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioCtx!.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.15, this.audioCtx!.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx!.currentTime + 0.4);
        oscillator.start(this.audioCtx!.currentTime);
        oscillator.stop(this.audioCtx!.currentTime + 0.4);
      };

      if (this.audioCtx.state === 'suspended') {
        // Intentar resume; si falla (sin interacción), la notificación nativa ya fue enviada
        this.audioCtx.resume().then(() => emitirSonido()).catch(() => {});
      } else {
        emitirSonido();
      }
    } catch(e) {
      console.warn('❌ Error al reproducir sonido:', e);
    }
  }

  // ========================================
  // NOTIFICACIONES REAL-TIME
  // ========================================
  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.isNotificationMenuOpen = !this.isNotificationMenuOpen;
    if (this.isNotificationMenuOpen) {
      this.isUserMenuOpen = false;
      this.fetchNotificaciones();
    }
  }

  fetchNotificaciones(): void {
    if (!this.id_usuario) return;
    this.homeservice.get('api/tareas/notificaciones/activas/' + this.id_usuario).subscribe({
      next: (data: any) => {
        // Log para depuración
        // console.log('🔄 Sincronizando notificaciones. Total:', data.length);
        
        // Detectar si hay notificaciones nuevas para emitir sonido y aviso
        if (this.notificaciones.length > 0) {
          const oldIds = new Set(this.notificaciones.map(n => n.id.toString()));
          const newNotif = data.find((n: any) => !oldIds.has(n.id.toString()));
          
          if (newNotif) {
            console.log('🔍 ¡DETECTADA NUEVA NOTIFICACIÓN!', newNotif);
            this.playNotificationSound();

            // Notificación nativa del navegador (funciona en background)
            this.mostrarNotificacionNativa(
              newNotif.tipo === 'NUEVO_MENSAJE' ? '💬 Nuevo mensaje en tarea' : '🔔 Nueva notificación',
              newNotif.mensaje,
              () => this.irANotificacion(newNotif)
            );
            
            // Mostrar aviso visual clickeable
            Swal.fire({
              title: newNotif.tipo === 'NUEVO_MENSAJE' ? 'Nuevo mensaje' : 'Notificación',
              text: newNotif.mensaje,
              icon: 'info',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 8000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.style.cursor = 'pointer';
                toast.onclick = () => {
                  this.irANotificacion(newNotif);
                  Swal.close();
                };
              }
            });
          }
        }
        
        this.notificaciones = data;
      },
      error: (err) => {
        if (err?.status !== 0) {
          console.error('Error al obtener notificaciones', err);
        }
      }
    });
  }

  leida(notif: any, event?: Event): void {
    if (event) event.stopPropagation();
    this.homeservice.put(`api/tareas/notificaciones/${notif.id}/leido`, {}).subscribe({
      next: () => {
        this.notificaciones = this.notificaciones.filter(n => n.id !== notif.id);
      }
    });
  }

  marcarTodasComoLeidas(): void {
    const promises = this.notificaciones.map(n => 
      this.homeservice.put(`api/tareas/notificaciones/${n.id}/leido`, {}).toPromise()
    );
    Promise.all(promises).then(() => {
      this.notificaciones = [];
    });
  }

  irANotificacion(notif: any): void {

    
    // Marcar como leída
    this.leida(notif);
    this.isNotificationMenuOpen = false;
    
    // Si la notificación tiene una referenciaId (que debería ser el ID de la tarea)
    if (notif.referenciaId) {
      this.homeservice.getTareaPorId(notif.referenciaId).subscribe({
        next: (tarea) => {
          if (tarea) {
            this.abrirDetalle(tarea, true);
          }
        },
        error: (err) => {
          console.error('Error al cargar la tarea desde notificación:', err);
          // Fallback: abrir la sección de tareas
          document.getElementById('tareas-section')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    } else {
      // Si no tiene referencia, al menos llevar a la sección de tareas
      document.getElementById('tareas-section')?.scrollIntoView({ behavior: 'smooth' });
    }
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
      return; // Bloqueado: no se puede avanzar a meses futuros que aún no han ocurrido
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

  get cedulaColaboradorActualHome(): string {
    if (this.colaboradorSeleccionadoPresentismo) {
      return String(this.colaboradorSeleccionadoPresentismo.identificacion || this.colaboradorSeleccionadoPresentismo.cedula || '').trim();
    }
    return String(this.cedulaUsuario || '').trim();
  }

  // ========================================
  // DESPLAZAMIENTO ENTRE SEMANAS EN HERO CALENDARIO
  // ========================================
  offsetSemanasCalendario: number = 0;

  get tituloSemanaCalendario(): string {
    if (this.offsetSemanasCalendario === 0) return 'Esta Semana';
    if (this.offsetSemanasCalendario === -1) return 'Semana Pasada';
    return `Sem. (${this.offsetSemanasCalendario > 0 ? '+' : ''}${this.offsetSemanasCalendario})`;
  }

  desplazarSemanaCalendario(delta: number): void {
    this.offsetSemanasCalendario += delta;
    this.recalcularSemanaCalendario();
    this.cdr.detectChanges();
  }

  irASemanaActual(): void {
    this.offsetSemanasCalendario = 0;
    this.recalcularSemanaCalendario();
    this.cdr.detectChanges();
  }

  get correoColaboradorActualHome(): string {
    if (this.colaboradorSeleccionadoPresentismo) {
      return (this.colaboradorSeleccionadoPresentismo.correo || '').trim().toLowerCase();
    }
    return (this.userEmail || '').trim().toLowerCase();
  }

  get aprobadoresDisponiblesHome(): { id: string; nombre: string; correo: string; cargo: string; area: string; esLiderDirecto?: boolean }[] {
    const miCedula = this.cedulaColaboradorActualHome;
    const miCorreo = this.correoColaboradorActualHome;

    if (!this.usuariosList || this.usuariosList.length === 0) {
      return [
        { id: 'lider_area', nombre: 'Líder / Jefe de Área', correo: '', cargo: 'Líder', area: 'Área' },
        { id: 'gh', nombre: 'Gestión Humana', correo: 'asistentetic@bgreen.com.co', cargo: 'Gestión Humana', area: 'Talento Humano' }
      ];
    }

    const myArea = Number(this.idAreaUsuario || 0);

    // Filtrar líderes / supervisores y excluir al solicitante
    const candidatos = this.usuariosList.filter(u => {
      const uCedula = String(u.identificacion || u.cedula || u.documento || '').trim();
      const uCorreo = (u.correo || '').trim().toLowerCase();

      // EXCLUSIÓN: Quien solicita el tiempo extra NUNCA debe aparecer en la lista de aprobadores
      if ((miCedula && uCedula === miCedula) || (miCorreo && uCorreo === miCorreo)) {
        return false;
      }

      const uCargo = Number(u.id_cargo_fk || u.Id_cargo_fk || u.idCargo || 0);
      const cargoStr = (u.cargo || u.descripcionCargo || '').toLowerCase();
      const esLiderJerarquico = [1, 2, 3].includes(uCargo);
      const esLiderPorCargo = cargoStr.includes('director') || 
                              cargoStr.includes('coordinador') || 
                              cargoStr.includes('jefe') || 
                              cargoStr.includes('gerente') || 
                              cargoStr.includes('lider') || 
                              cargoStr.includes('líder') || 
                              cargoStr.includes('gestion humana') || 
                              cargoStr.includes('talento humano');

      return esLiderJerarquico || esLiderPorCargo;
    });

    const listaFinal = candidatos.length > 0 
      ? candidatos 
      : this.usuariosList.filter(u => {
          const uCedula = String(u.identificacion || u.cedula || u.documento || '').trim();
          const uCorreo = (u.correo || '').trim().toLowerCase();
          return (!miCedula || uCedula !== miCedula) && (!miCorreo || uCorreo !== miCorreo);
        });

    const res = listaFinal.map(u => {
      const uArea = Number(u.id_area_fk || u.Id_area_fk || u.idArea || 0);
      const esMismaArea = Boolean(myArea && uArea === myArea);
      const idVal = String(u.identificacion || u.cedula || u.correo || u.idUsuario || '').trim();
      return {
        id: idVal,
        nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim() || (u.usuario || 'Usuario'),
        correo: (u.correo || '').trim(),
        cargo: u.cargo || u.descripcionCargo || 'Líder',
        area: u.area || u.descripcionArea || 'Área General',
        esLiderDirecto: esMismaArea
      };
    });

    return res.sort((a, b) => {
      if (a.esLiderDirecto && !b.esLiderDirecto) return -1;
      if (!a.esLiderDirecto && b.esLiderDirecto) return 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }

  get aprobadorSeleccionadoActualHome(): { id: string; nombre: string; correo: string; cargo: string } {
    const lista = this.aprobadoresDisponiblesHome;
    if (!lista || lista.length === 0) {
      return { id: '', nombre: 'Líder / Jefe de Área', correo: '', cargo: 'Líder' };
    }
    const encontrado = lista.find(a => a.id === this.aprobadorSeleccionadoIdHome);
    if (encontrado) return encontrado;
    return lista[0];
  }

  seleccionarDiaPresentismo(dia: ResumenDiaPresentismo): void {
    if (this.esFestivo(dia)) {
      return; // Festivo inhabilitado
    }
    this.diaSeleccionadoPresentismo = dia;
    this.mostrarFormularioTiempoExtra = false;
    this.nuevaHoraExtra = 2;
    this.nuevaDescripcionExtra = '';
    const disp = this.aprobadoresDisponiblesHome;
    if (disp.length > 0) {
      this.aprobadorSeleccionadoIdHome = disp[0].id;
    }
    this.cargarSolicitudesDia(dia.fechaKey);
    this.isModalDiaPresentismoOpen = true;
  }

  cerrarModalDiaPresentismo(): void {
    this.isModalDiaPresentismoOpen = false;
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
    return sols.find(s => s.estado === 'APROBADO') || sols.find(s => s.estado === 'PENDIENTE') || sols[0];
  }

  toggleFormularioTiempoExtra(): void {
    this.mostrarFormularioTiempoExtra = !this.mostrarFormularioTiempoExtra;
    if (this.mostrarFormularioTiempoExtra) {
      const disp = this.aprobadoresDisponiblesHome;
      if (!this.aprobadorSeleccionadoIdHome || !disp.some(a => a.id === this.aprobadorSeleccionadoIdHome)) {
        if (disp.length > 0) {
          this.aprobadorSeleccionadoIdHome = disp[0].id;
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
      : (this.fullName || 'Colaborador');

    const cedulaColab = this.colaboradorSeleccionadoPresentismo
      ? String(this.colaboradorSeleccionadoPresentismo.identificacion || '')
      : String(this.cedulaUsuario || '');

    const aprobador = this.aprobadorSeleccionadoActualHome;

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

  obtenerLiderAprobadorColaboradorHome(): { nombre: string; correo: string; cargo: string } {
    return this.aprobadorSeleccionadoActualHome;
  }

  esCreadorDeSolicitudHome(sol: SolicitudTiempoExtra): boolean {
    if (!sol) return false;
    const miCedula = String(this.cedulaUsuario || '').trim();
    const miNombre = (this.fullName || '').trim().toLowerCase();
    const solCedula = String(sol.cedulaColaborador || '').trim();
    const solNombre = (sol.nombreColaborador || '').trim().toLowerCase();

    if (miCedula && solCedula && miCedula === solCedula) return true;
    if (miNombre && solNombre && (miNombre === solNombre || solNombre.includes(miNombre) || miNombre.includes(solNombre))) return true;
    return false;
  }

  puedeAprobarSolicitudHome(sol: SolicitudTiempoExtra): boolean {
    if (!sol) return false;
    // REGLA CRÍTICA: Quien solicitó el tiempo extra NUNCA puede aprobar su propia solicitud
    if (this.esCreadorDeSolicitudHome(sol)) {
      return false;
    }

    // Si es líder de área (cargos 1, 2, 3)
    if (this.esCargoLiderArea) {
      return true;
    }

    // O si coincide con el aprobador asignado específicamente
    const miNombre = (this.fullName || '').trim().toLowerCase();
    const miCorreo = (this.userEmail || '').trim().toLowerCase();
    const aprobadorAsig = (sol.aprobadorAsignado || '').trim().toLowerCase();
    const correoAsig = (sol.correoAprobador || '').trim().toLowerCase();

    if (aprobadorAsig && (aprobadorAsig === miNombre || miNombre.includes(aprobadorAsig) || aprobadorAsig.includes(miNombre))) {
      return true;
    }
    if (correoAsig && miCorreo && correoAsig === miCorreo) {
      return true;
    }

    return false;
  }

  puedeRevocarSolicitudHome(sol: SolicitudTiempoExtra): boolean {
    return this.puedeAprobarSolicitudHome(sol);
  }

  puedeEliminarSolicitudHome(sol: SolicitudTiempoExtra): boolean {
    if (!sol || sol.estado !== 'PENDIENTE') return false;
    return this.esCreadorDeSolicitudHome(sol) || this.esCargoLiderArea;
  }

  aprobarTiempoExtra(sol: SolicitudTiempoExtra): void {
    const aprobador = this.fullName || 'Líder / Supervisor';
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
    const aprobador = this.fullName || 'Líder / Supervisor';
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

  scrollAPresentismo(): void {
    this.abrirModalPresentismoHome();
  }

  generarAreasPresentismoHome(): void {
    const cargo = Number(this.idCargoUsuario);
    this.esCargoLiderArea = [1, 2, 3].includes(cargo);
    if (!this.esCargoLiderArea || !this.usuariosList || this.usuariosList.length === 0) {
      this.areasPresentismo = [];
      return;
    }

    const myArea = Number(this.idAreaUsuario);
    const myDireccion = Number(this.idDireccionUsuario);

    const areaMap = new Map<string, { idArea: number; nombreArea: string; direccion?: string; colaboradores: any[] }>();

    this.usuariosList.forEach(u => {
      const uArea = Number(u.id_area_fk || u.Id_area_fk || u.idArea || 0);
      let uDireccion = Number(u.id_direccion_fk || u.Id_direccion_fk || u.idDireccion || 0);
      if (!uDireccion && uArea && this.areasList.length > 0) {
        const areaInfo = this.areasList.find(a => Number(a.idArea || a.id_area) === uArea);
        if (areaInfo) {
          uDireccion = Number(areaInfo.idDireccionFk || areaInfo.id_direccion_fk || (areaInfo.direccion ? areaInfo.direccion.idDireccion : 0));
        }
      }

      let tieneAcceso = false;
      if (cargo === 1) {
        // Cargo 1: ve todas las áreas
        tieneAcceso = true;
      } else if (cargo === 2) {
        // Cargo 2: ve las áreas de su dirección o su área
        tieneAcceso = (uDireccion !== 0 && uDireccion === myDireccion) || (uArea !== 0 && uArea === myArea);
      } else if (cargo === 3) {
        // Cargo 3: ve su área
        tieneAcceso = (uArea !== 0 && uArea === myArea);
      }

      if (tieneAcceso) {
        let areaNombre = u.area || u.descripcionArea;
        if (!areaNombre && uArea && this.areasList.length > 0) {
          const areaObj = this.areasList.find(a => Number(a.idArea || a.id_area) === uArea);
          if (areaObj) areaNombre = areaObj.descripcionArea || areaObj.nombre || areaObj.area;
        }
        if (!areaNombre) areaNombre = 'Área General';

        const key = areaNombre.trim().toUpperCase();
        if (!areaMap.has(key)) {
          areaMap.set(key, {
            idArea: uArea,
            nombreArea: areaNombre.trim(),
            direccion: uDireccion ? `Dir ${uDireccion}` : undefined,
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

    if (this.areasPresentismo.length > 0 && !this.areaSeleccionadaPresentismo) {
      const propia = this.areasPresentismo.find(a => a.idArea === myArea);
      this.areaSeleccionadaPresentismo = propia || this.areasPresentismo[0];
    }
  }

  abrirModalPresentismoHome(area?: any): void {
    this.closeUserMenu();
    if (this.areasPresentismo.length === 0) {
      this.generarAreasPresentismoHome();
    }
    if (area) {
      this.areaSeleccionadaPresentismo = area;
    }
    this.isModalPresentismoOpen = true;
  }

  cerrarModalPresentismoHome(): void {
    this.isModalPresentismoOpen = false;
  }

  seleccionarAreaPresentismoHome(area: any): void {
    this.areaSeleccionadaPresentismo = area;
  }

  seleccionarColaboradorPresentismoHome(colab: any): void {
    if (!this.cedulaOriginalUsuario) {
      this.cedulaOriginalUsuario = this.cedulaUsuario;
    }
    this.colaboradorSeleccionadoPresentismo = colab;
    this.cedulaUsuario = String(colab.identificacion || colab.cedula || colab.documento || '').trim();
    this.cargarEventosPresentismo();
  }

  volverAMiPresentismoHome(): void {
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

    this.cargandoPresentismo = true;

    // Rango de fechas: desde el mes anterior hasta el mes siguiente para permitir navegar a la semana pasada con datos completos
    const fInicioDate = new Date(this.presentismoAnio, this.presentismoMes - 1, 1);
    const padMesInicio = String(fInicioDate.getMonth() + 1).padStart(2, '0');
    const fInicio = `${fInicioDate.getFullYear()}${padMesInicio}01`;
    const fFinMesSiguiente = new Date(this.presentismoAnio, this.presentismoMes + 1, 1);
    const fFin = `${fFinMesSiguiente.getFullYear()}${String(fFinMesSiguiente.getMonth() + 1).padStart(2, '0')}01`;

    this.homeservice.getEventosPresentismo(this.cedulaUsuario, fInicio, fFin).subscribe({
      next: (data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          this.eventosPresentismoRaw = data;
        } else {
          // Si la API responde vacío, generamos datos representativos para el mes
          this.eventosPresentismoRaw = this.generarEventosPresentismoSimulados();
        }
        this.construirCalendarioPresentismo();
        this.cargandoPresentismo = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback elegante mientras el endpoint se despliega en backend
        this.eventosPresentismoRaw = this.generarEventosPresentismoSimulados();
        this.construirCalendarioPresentismo();
        this.cargandoPresentismo = false;
        this.cdr.detectChanges();
      }
    });
  }

  private generarEventosPresentismoSimulados(): EventoAcceso[] {
    const eventos: EventoAcceso[] = [];
    const anio = this.presentismoAnio;
    const mes = this.presentismoMes;
    const hoy = new Date();

    // Generar para mes anterior y mes actual para permitir navegar a la semana pasada con datos completos
    const mesesAGenerar = [
      new Date(anio, mes - 1, 1),
      new Date(anio, mes, 1)
    ];

    mesesAGenerar.forEach((mDate, mIdx) => {
      const gAnio = mDate.getFullYear();
      const gMes = mDate.getMonth();
      const diasEnMes = new Date(gAnio, gMes + 1, 0).getDate();
      if (mDate > hoy) return;

      const esMesActual = hoy.getFullYear() === gAnio && hoy.getMonth() === gMes;
      const maxDia = esMesActual ? hoy.getDate() : diasEnMes;

      for (let d = 1; d <= maxDia; d++) {
        const fecha = new Date(gAnio, gMes, d);
        const diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado
        if (diaSemana === 0 || diaSemana === 6) continue; // Fines de semana libres

        const padMes = String(gMes + 1).padStart(2, '0');
        const padDia = String(d).padStart(2, '0');

        // Hora de entrada: 07:18 a 07:48
        const minEntrada = 15 + ((d * 7 + mIdx * 3) % 35);
        const segEntrada = (d * 13) % 60;
        const horaEntradaStr = `${gAnio}-${padMes}-${padDia}T07:${String(minEntrada).padStart(2, '0')}:${String(segEntrada).padStart(2, '0')}`;

        eventos.push({
          Identificacion_evento: (mIdx + 1) * 10000 + d * 2,
          EVENTO: 'ENTRADA',
          Fecha_hora: horaEntradaStr,
          Documento: this.cedulaUsuario || '1082886807',
          Nombre: this.fullName || 'Colaborador',
          ubicacion: 'Torniquete Principal - Recepción'
        });

        // Si es hoy y aún no termina la jornada, no agregar salida
        if (esMesActual && d === hoy.getDate() && hoy.getHours() < 17) {
          continue;
        }

        // Hora de salida: 17:05 a 17:42
        const minSalida = 5 + ((d * 9 + mIdx * 5) % 40);
        const segSalida = (d * 17) % 60;
        const horaSalidaStr = `${gAnio}-${padMes}-${padDia}T17:${String(minSalida).padStart(2, '0')}:${String(segSalida).padStart(2, '0')}`;

        eventos.push({
          Identificacion_evento: (mIdx + 1) * 10000 + d * 2 + 1,
          EVENTO: 'SALIDA',
          Fecha_hora: horaSalidaStr,
          Documento: this.cedulaUsuario || '1082886807',
          Nombre: this.fullName || 'Colaborador',
          ubicacion: 'Torniquete Principal - Salida'
        });

        // Ocasionalmente un intento inválido
        if (d % 8 === 0) {
          eventos.push({
            Identificacion_evento: (mIdx + 1) * 50000 + d,
            EVENTO: 'INVÁLIDO',
            Fecha_hora: `${gAnio}-${padMes}-${padDia}T12:02:10`,
            Motivo_invalidez: 'Marcación repetida o fuera de turno',
            Documento: this.cedulaUsuario || '1082886807',
            Nombre: this.fullName || 'Colaborador',
            ubicacion: 'Lector Cafetería / Molinete'
          });
        }
      }
    });

    return eventos.sort((a, b) => new Date(b.Fecha_hora).getTime() - new Date(a.Fecha_hora).getTime());
  }

  private construirCalendarioPresentismo(): void {
    const anio = this.presentismoAnio;
    const mes = this.presentismoMes;
    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);
    const diasEnMes = ultimoDiaMes.getDate();
    const hoy = new Date();

    // Día de la semana en que inicia el mes: Lunes = 0, ..., Domingo = 6
    let diaInicioSemana = primerDiaMes.getDay() - 1;
    if (diaInicioSemana === -1) diaInicioSemana = 6; // Domingo pasa a índice 6

    const listaDias: ResumenDiaPresentismo[] = [];

    // Días de relleno del mes anterior
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

    // Días del mes seleccionado
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

      // Filtrar eventos de este día (soporta formato ISO o fecha con espacio)
      const eventosDia = this.eventosPresentismoRaw
        .filter(ev => {
          if (!ev.Fecha_hora) return false;
          const fechaLimpia = ev.Fecha_hora.replace(' ', 'T').slice(0, 10);
          return fechaLimpia === fKey;
        })
        .sort((a, b) => new Date(a.Fecha_hora).getTime() - new Date(b.Fecha_hora).getTime());

      // Analizar entradas y salidas válidas
      const entradas = eventosDia.filter(e => e.EVENTO === 'ENTRADA');
      const salidas = eventosDia.filter(e => e.EVENTO === 'SALIDA');
      const tieneInvalidos = eventosDia.some(e => e.EVENTO === 'INVÁLIDO');

      let primeraEntradaStr: string | null = null;
      let ultimaSalidaStr: string | null = null;
      let totalHorasTexto = '';
      let totalMinutos = 0;
      let estado: ResumenDiaPresentismo['estado'] = 'SIN_REGISTRO';
      const tieneDobleEntrada = entradas.length >= 2;
      const entradasMultiples = tieneDobleEntrada ? entradas.map(e => this.formatearHoraEntrada(new Date(e.Fecha_hora))) : [];

      if (entradas.length > 0) {
        const primera = new Date(entradas[0].Fecha_hora);
        primeraEntradaStr = this.formatearHoraEntrada(primera);

        // Sumar para promedio de entrada
        sumaMinutosEntrada += primera.getHours() * 60 + primera.getMinutes();
        contadorEntradas++;

        if (salidas.length > 0) {
          const ultima = new Date(salidas[salidas.length - 1].Fecha_hora);
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
          // Solo entrada registrada
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
        const ultima = new Date(salidas[salidas.length - 1].Fecha_hora);
        ultimaSalidaStr = this.formatearHora(ultima);
        estado = 'SOLO_SALIDA';
      } else if (tieneInvalidos) {
        estado = 'INVALIDO';
      }

      // Si es hoy, actualizar el KPI en vivo
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

    // Días de relleno del mes siguiente para completar la cuadrícula de 7 columnas
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

    // Calcular estadísticas globales del mes
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

    // Si no hay día seleccionado aún, seleccionar hoy o el último día con marcaciones
    if (!this.diaSeleccionadoPresentismo) {
      const diaHoy = listaDias.find(d => d.esHoy);
      this.diaSeleccionadoPresentismo = diaHoy || listaDias.find(d => d.esMesActual && d.eventos.length > 0) || null;
    }

    // Calcular semana actual para el hero y desglose semanal del mes para el menú de usuario
    this.calcularSemanaActualYResumenMensual();
  }

  private procesarDiaEventos(
    fDate: Date,
    fKey: string,
    eventosDia: EventoAcceso[],
    hoy: Date,
    esMesActual: boolean
  ): ResumenDiaPresentismo {
    const esHoy = fDate.getFullYear() === hoy.getFullYear() &&
                  fDate.getMonth() === hoy.getMonth() &&
                  fDate.getDate() === hoy.getDate();
    const esFinDeSemana = fDate.getDay() === 0 || fDate.getDay() === 6;

    const entradas = eventosDia.filter(e => e.EVENTO === 'ENTRADA');
    const salidas = eventosDia.filter(e => e.EVENTO === 'SALIDA');
    const tieneInvalidos = eventosDia.some(e => e.EVENTO === 'INVÁLIDO');

    let primeraEntradaStr: string | null = null;
    let ultimaSalidaStr: string | null = null;
    let totalHorasTexto = '';
    let totalMinutos = 0;
    let estado: ResumenDiaPresentismo['estado'] = 'SIN_REGISTRO';
    const tieneDobleEntrada = entradas.length >= 2;
    const entradasMultiples = tieneDobleEntrada ? entradas.map(e => this.formatearHoraEntrada(new Date(e.Fecha_hora))) : [];

    if (entradas.length > 0) {
      const primera = new Date(entradas[0].Fecha_hora);
      primeraEntradaStr = this.formatearHoraEntrada(primera);

      if (salidas.length > 0) {
        const ultima = new Date(salidas[salidas.length - 1].Fecha_hora);
        ultimaSalidaStr = this.formatearHora(ultima);
        const diffMs = ultima.getTime() - primera.getTime();
        if (diffMs > 0) {
          totalMinutos = Math.floor(diffMs / 60000);
          const horas = Math.floor(totalMinutos / 60);
          const minutos = totalMinutos % 60;
          totalHorasTexto = `${horas}h ${minutos}m`;
        }
        estado = 'COMPLETO';
      } else {
        if (esHoy) {
          const diffMs = hoy.getTime() - primera.getTime();
          totalMinutos = Math.max(0, Math.floor(diffMs / 60000));
          const horas = Math.floor(totalMinutos / 60);
          const minutos = totalMinutos % 60;
          totalHorasTexto = `${horas}h ${minutos}m (en curso)`;
          estado = 'PRESENTE';
        } else {
          estado = 'SOLO_ENTRADA';
        }
      }
    } else if (salidas.length > 0) {
      const ultima = new Date(salidas[salidas.length - 1].Fecha_hora);
      ultimaSalidaStr = this.formatearHora(ultima);
      estado = 'SOLO_SALIDA';
    } else if (tieneInvalidos) {
      estado = 'INVALIDO';
    }

    return {
      fechaKey: fKey,
      fechaDate: fDate,
      diaNumero: fDate.getDate(),
      esHoy,
      esFinDeSemana,
      esMesActual,
      eventos: eventosDia,
      primeraEntrada: primeraEntradaStr,
      ultimaSalida: ultimaSalidaStr,
      totalHorasTexto,
      totalMinutos,
      estado,
      tieneDobleEntrada,
      entradasMultiples
    };
  }

  recalcularSemanaCalendario(): void {
    const hoy = new Date();
    const diaSemanaHoy = hoy.getDay();
    const diffALunes = diaSemanaHoy === 0 ? -6 : 1 - diaSemanaHoy;
    const lunesSemana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diffALunes + (this.offsetSemanasCalendario * 7));

    const diasSemana: ResumenDiaPresentismo[] = [];
    let minutosSemana = 0;

    // De lunes a domingo (7 días)
    for (let i = 0; i < 7; i++) {
      const fDate = new Date(lunesSemana.getFullYear(), lunesSemana.getMonth(), lunesSemana.getDate() + i);
      const fKey = this.formatearFechaKey(fDate);

      const diaExistente = this.diasMesPresentismo.find(d => d.fechaKey === fKey);
      if (diaExistente) {
        diasSemana.push(diaExistente);
        minutosSemana += diaExistente.totalMinutos || 0;
      } else {
        const eventosDia = this.eventosPresentismoRaw
          .filter(ev => {
            if (!ev.Fecha_hora) return false;
            return ev.Fecha_hora.replace(' ', 'T').slice(0, 10) === fKey;
          })
          .sort((a, b) => new Date(a.Fecha_hora).getTime() - new Date(b.Fecha_hora).getTime());

        const diaCalculado = this.procesarDiaEventos(fDate, fKey, eventosDia, hoy, fDate.getMonth() === this.presentismoMes);
        diasSemana.push(diaCalculado);
        minutosSemana += diaCalculado.totalMinutos || 0;
      }
    }

    this.diasSemanaActualPresentismo = diasSemana;
    const hSem = Math.floor(minutosSemana / 60);
    const mSem = minutosSemana % 60;
    this.totalHorasSemanaActualTexto = `${hSem}h ${mSem}m`;

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mesLunes = meses[lunesSemana.getMonth()];
    const domSemana = new Date(lunesSemana.getFullYear(), lunesSemana.getMonth(), lunesSemana.getDate() + 6);
    const mesDom = meses[domSemana.getMonth()];
    this.rangoSemanaActualTexto = `${lunesSemana.getDate()} ${mesLunes} - ${domSemana.getDate()} ${mesDom}`;
  }

  private calcularSemanaActualYResumenMensual(): void {
    const hoy = new Date();
    const hoyKey = this.formatearFechaKey(hoy);
    const hoyFinDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    // 1. DÍAS DE LA SEMANA SELECCIONADA EN EL CALENDARIO (LUNES A VIERNES)
    this.recalcularSemanaCalendario();

    // 2. RESUMEN DE HORAS SEMANALES EN EL MES SELECCIONADO (LUNES A VIERNES)
    // Jornada laboral legal prorrateada en Colombia (HORAS_META_SEMANA / 5 días = 8.4h = 504 min/día hábil)
    const anio = this.presentismoAnio;
    const mes = this.presentismoMes;
    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);

    const minutosMetaDia = Math.round((this.HORAS_META_SEMANA * 60) / 5); // 504 min
    const diasLetras = ['L', 'M', 'X', 'J', 'V'];
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    // Encontrar el lunes de la semana que contiene el día 1 del mes
    const diaSemanaPrimer = primerDiaMes.getDay();
    const diffALunesPrimer = diaSemanaPrimer === 0 ? -6 : 1 - diaSemanaPrimer;
    let cursorLunes = new Date(anio, mes, 1 + diffALunesPrimer);

    const semanasResumen: ResumenSemanaMes[] = [];
    let numeroSemana = 1;

    while (cursorLunes <= ultimoDiaMes) {
      const cursorViernes = new Date(cursorLunes.getFullYear(), cursorLunes.getMonth(), cursorLunes.getDate() + 4);
      const cursorViernesFin = new Date(cursorViernes.getFullYear(), cursorViernes.getMonth(), cursorViernes.getDate(), 23, 59, 59);

      let diasHabiles = 0;
      let primerDiaMesEnSemana: Date | null = null;
      let ultimoDiaMesEnSemana: Date | null = null;
      const diasSemanaGrupo: ResumenDiaPresentismo[] = [];
      const miniBarras: DiaMiniBarra[] = [];
      let minutosTotalesSemana = 0;
      let tieneDiasEnMes = false;

      for (let i = 0; i < 5; i++) {
        const fDate = new Date(cursorLunes.getFullYear(), cursorLunes.getMonth(), cursorLunes.getDate() + i);
        const fKey = this.formatearFechaKey(fDate);
        const esDelMes = fDate.getFullYear() === anio && fDate.getMonth() === mes;
        const esFestivo = this.FESTIVOS.has(fKey);
        const esHoy = fKey === hoyKey;
        const esFuturo = fDate.getTime() > hoyFinDelDia.getTime();
        const diaNombre = diasLetras[i];
        const diaNum = fDate.getDate();
        const mesNombreCorto = meses[fDate.getMonth()];

        if (esDelMes) {
          tieneDiasEnMes = true;
          if (!primerDiaMesEnSemana) primerDiaMesEnSemana = fDate;
          ultimoDiaMesEnSemana = fDate;

          // Prorrateo: descontar festivos de los días hábiles
          if (!esFestivo) {
            diasHabiles++;
          }
        }

        // Buscar día existente o procesar eventos del día
        let diaObj = this.diasMesPresentismo.find(d => d.fechaKey === fKey);
        if (!diaObj && esDelMes) {
          const evs = this.eventosPresentismoRaw
            .filter(ev => ev.Fecha_hora && ev.Fecha_hora.replace(' ', 'T').slice(0, 10) === fKey)
            .sort((a, b) => new Date(a.Fecha_hora).getTime() - new Date(b.Fecha_hora).getTime());
          diaObj = this.procesarDiaEventos(fDate, fKey, evs, hoy, true);
        }

        if (diaObj && esDelMes) {
          diasSemanaGrupo.push(diaObj);
          minutosTotalesSemana += diaObj.totalMinutos || 0;
        }

        // Determinar estilo de mini-barra y tooltip descriptivo
        let estadoColor: DiaMiniBarra['estadoColor'] = 'vacio';
        let porcentajeAltura = 10;
        let tooltipTexto = '';
        const diaMinutos = (diaObj && esDelMes) ? (diaObj.totalMinutos || 0) : 0;
        const hDia = Math.floor(diaMinutos / 60);
        const mDia = diaMinutos % 60;
        const horasTexto = `${hDia}h ${mDia}m`;

        if (!esDelMes) {
          estadoColor = 'vacio';
          porcentajeAltura = 6;
          tooltipTexto = `${diaNombre} ${diaNum} ${mesNombreCorto} · Fuera de este mes`;
        } else if (esHoy && diaObj && (diaObj.estado === 'PRESENTE' || (diaObj.primeraEntrada && !diaObj.ultimaSalida))) {
          // Rayado si está en sede hoy
          estadoColor = 'sede_hoy';
          porcentajeAltura = Math.min(100, Math.max(22, Math.round((diaMinutos / minutosMetaDia) * 100)));
          tooltipTexto = `${diaNombre} ${diaNum} ${mesNombreCorto} · En sede hoy (desde ${diaObj.primeraEntrada || '--'}) · ${horasTexto} en curso`;
        } else if (esFestivo) {
          if (diaMinutos > 0) {
            estadoColor = 'puntual';
            porcentajeAltura = Math.min(100, Math.max(20, Math.round((diaMinutos / minutosMetaDia) * 100)));
            tooltipTexto = `${diaNombre} ${diaNum} ${mesNombreCorto} · Festivo laborado (${horasTexto})`;
          } else {
            estadoColor = 'festivo';
            porcentajeAltura = 100;
            tooltipTexto = `${diaNombre} ${diaNum} ${mesNombreCorto} · Festivo nacional (Día no laborable)`;
          }
        } else if (diaObj && diaObj.primeraEntrada) {
          const dif = this.difEntrada(diaObj);
          const puntual = dif !== null && dif <= this.GABELA_ENTRADA_MIN;
          estadoColor = puntual ? 'puntual' : 'tarde';
          porcentajeAltura = Math.min(100, Math.max(18, Math.round((diaMinutos / minutosMetaDia) * 100)));
          const estTxt = puntual ? 'Puntual' : 'Tarde';
          tooltipTexto = `${diaNombre} ${diaNum} ${mesNombreCorto} · Ent: ${diaObj.primeraEntrada} · Sal: ${diaObj.ultimaSalida || '--'} · ${estTxt} (${horasTexto})`;
        } else if (esFuturo) {
          estadoColor = 'vacio';
          porcentajeAltura = 8;
          tooltipTexto = `${diaNombre} ${diaNum} ${mesNombreCorto} · Pendiente`;
        } else {
          estadoColor = 'vacio';
          porcentajeAltura = 8;
          tooltipTexto = `${diaNombre} ${diaNum} ${mesNombreCorto} · Sin registro`;
        }

        miniBarras.push({
          diaNumero: diaNum,
          diaNombre,
          fechaKey: fKey,
          fechaDate: fDate,
          horasTexto,
          minutosTotales: diaMinutos,
          porcentajeAltura,
          estadoColor,
          tooltipTexto,
          esHoy,
          esFestivo,
          primeraEntrada: diaObj?.primeraEntrada || null,
          ultimaSalida: diaObj?.ultimaSalida || null
        });
      }

      // Procesar solo semanas que tengan al menos 1 día dentro del mes actual
      if (tieneDiasEnMes && primerDiaMesEnSemana && ultimoDiaMesEnSemana) {
        const metaMinutos = diasHabiles * minutosMetaDia;
        const metaH = Math.floor(metaMinutos / 60);
        const metaM = metaMinutos % 60;
        const metaTexto = `${metaH}h ${metaM}m`;

        const trabH = Math.floor(minutosTotalesSemana / 60);
        const trabM = minutosTotalesSemana % 60;
        const horasTexto = `${trabH}h ${trabM}m`;

        const porcentajeProgreso = metaMinutos > 0 ? Math.min(100, Math.round((minutosTotalesSemana / metaMinutos) * 100)) : 0;
        const diferenciaMinutos = minutosTotalesSemana - metaMinutos;
        const esPositiva = diferenciaMinutos >= 0;
        const absDiff = Math.abs(diferenciaMinutos);
        const diffH = Math.floor(absDiff / 60);
        const diffM = absDiff % 60;
        const diferenciaTexto = (esPositiva ? '+' : '−') + `${diffH}h ${String(diffM).padStart(2, '0')}m`;

        const esSemanaActual = cursorLunes <= hoy && hoy <= cursorViernesFin;
        const esFutura = cursorLunes.getTime() > hoyFinDelDia.getTime();

        const pDiaNum = String(primerDiaMesEnSemana.getDate()).padStart(2, '0');
        const uDiaNum = String(ultimoDiaMesEnSemana.getDate()).padStart(2, '0');
        const mesCortoRango = meses[ultimoDiaMesEnSemana.getMonth()];
        const rangoTexto = `${pDiaNum} - ${uDiaNum} ${mesCortoRango}`;
        const diasHabilesTexto = `${diasHabiles} ${diasHabiles === 1 ? 'día hábil' : 'días hábiles'}`;

        // Porcentaje de puntualidad en la semana
        let entradasSemana = 0;
        let puntualesSemana = 0;
        for (const d of diasSemanaGrupo) {
          if (d.primeraEntrada) {
            entradasSemana++;
            const dif = this.difEntrada(d);
            if (dif !== null && dif <= this.GABELA_ENTRADA_MIN) {
              puntualesSemana++;
            }
          }
        }
        const porcentajePuntualidad = entradasSemana > 0 ? Math.round((puntualesSemana / entradasSemana) * 100) : 100;

        semanasResumen.push({
          numeroSemana,
          nombreSemana: `Semana ${numeroSemana}`,
          rangoTexto,
          diasHabiles,
          diasHabilesTexto,
          minutosTotales: minutosTotalesSemana,
          horasTexto,
          metaMinutos,
          metaTexto,
          porcentajeProgreso,
          porcentajePuntualidad,
          diferenciaMinutos,
          diferenciaTexto,
          esPositiva,
          esSemanaActual,
          esFutura,
          dias: diasSemanaGrupo,
          miniBarras
        });

        numeroSemana++;
      }

      // Avanzar al lunes de la semana siguiente
      cursorLunes = new Date(cursorLunes.getFullYear(), cursorLunes.getMonth(), cursorLunes.getDate() + 7);
    }

    this.resumenSemanasMes = semanasResumen;

    // 3. TOTALES DEL MES Y CHIPS DE PUNTUALIDAD
    // Los totales del encabezado coinciden estrictamente con la suma de las semanas
    const totalMinMes = semanasResumen.reduce((acc, s) => acc + (s.minutosTotales || 0), 0);
    const metaMinMes = semanasResumen.reduce((acc, s) => acc + (s.metaMinutos || 0), 0);

    const hMesTot = Math.floor(totalMinMes / 60);
    const mMesTot = totalMinMes % 60;
    const hMesMeta = Math.floor(metaMinMes / 60);
    const mMesMeta = metaMinMes % 60;

    const totalHorasMesTexto = `${hMesTot}h ${mMesTot}m`;
    const metaMesTexto = `${hMesMeta}h ${mMesMeta}m`;
    const porcentajeMes = metaMinMes > 0 ? Math.min(100, Math.round((totalMinMes / metaMinMes) * 100)) : 0;

    let totalEntradas = 0;
    let entradasPuntuales = 0;
    let llegadasTarde = 0;

    for (const d of this.diasMesPresentismo) {
      if (d.esMesActual && d.primeraEntrada) {
        totalEntradas++;
        const dif = this.difEntrada(d);
        if (dif !== null && dif <= this.GABELA_ENTRADA_MIN) {
          entradasPuntuales++;
        } else {
          llegadasTarde++;
        }
      }
    }

    const pctPuntualidad = totalEntradas > 0 ? Math.round((entradasPuntuales / totalEntradas) * 100) : 100;

    this.resumenMesMetas = {
      totalHorasMesTexto,
      metaMesTexto,
      totalMinutosMes: totalMinMes,
      metaMinutosMes: metaMinMes,
      porcentajeMes,
      porcentajePuntualidad: pctPuntualidad,
      llegadasTardeCount: llegadasTarde,
      totalEntradasRegistradas: totalEntradas
    };
  }

  /** Porcentaje de cumplimiento de puntualidad de todo el mes */
  get porcentajeCumplimientoMes(): number {
    if (this.resumenMesMetas?.porcentajePuntualidad !== undefined && this.resumenMesMetas.porcentajePuntualidad !== null) {
      return this.resumenMesMetas.porcentajePuntualidad;
    }
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

  /** Porcentaje de presentismo / asistencia de la semana actual */
  get porcentajePresentismoSemanaActual(): number {
    if (!this.diasSemanaActualPresentismo || this.diasSemanaActualPresentismo.length === 0) {
      return 100;
    }

    const hoy = new Date();
    const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);

    let diasRequeridos = 0;
    let diasAsistidos = 0;

    for (const dia of this.diasSemanaActualPresentismo) {
      // Los festivos no descuentan asistencia
      if (this.esFestivo(dia)) {
        continue;
      }

      // Fines de semana no programados sin asistencia no descuentan
      if (dia.esFinDeSemana && !dia.primeraEntrada && (!dia.totalMinutos || dia.totalMinutos <= 0)) {
        continue;
      }

      const fDate = dia.fechaDate ? new Date(dia.fechaDate) : new Date(dia.fechaKey.replace(/-/g, '/'));
      const diaInicio = new Date(fDate.getFullYear(), fDate.getMonth(), fDate.getDate(), 0, 0, 0);

      const asistio = Boolean(
        dia.primeraEntrada || 
        (dia.eventos && dia.eventos.some(e => e.EVENTO === 'ENTRADA')) ||
        (dia.totalMinutos && dia.totalMinutos > 0)
      );

      if (diaInicio.getTime() < hoyInicio.getTime()) {
        // Día laboral ya transcurrido en la semana
        diasRequeridos++;
        if (asistio) {
          diasAsistidos++;
        }
      } else if (dia.esHoy || diaInicio.getTime() === hoyInicio.getTime()) {
        // Día actual: cuenta como asistido si ya marcó entrada
        if (asistio) {
          diasRequeridos++;
          diasAsistidos++;
        } else if (hoy.getHours() >= 13) {
          // Si ya pasó media jornada sin marcación, se evalúa
          diasRequeridos++;
        }
      }
    }

    if (diasRequeridos === 0) {
      return 100;
    }

    return Math.min(100, Math.round((diasAsistidos / diasRequeridos) * 100));
  }

  get clasePorcentajePresentismo(): string {
    const pct = this.porcentajePresentismoSemanaActual;
    if (pct >= 80) return 'pct-alta';
    if (pct >= 50) return 'pct-media';
    return 'pct-baja';
  }

  /** Actualiza los minutos trabajados en el día de hoy en tiempo real mientras el usuario esté en sede */
  actualizarMinutosHoyEnVivo(): void {
    const hoy = new Date();
    const diaHoy = this.diasMesPresentismo.find(d => d.esHoy);
    if (diaHoy && diaHoy.primeraEntrada && !diaHoy.ultimaSalida) {
      const ents = (diaHoy.eventos || []).filter(e => e.EVENTO === 'ENTRADA');
      if (ents.length > 0) {
        const primera = new Date(ents[0].Fecha_hora.replace(' ', 'T'));
        const diffMs = hoy.getTime() - primera.getTime();
        if (diffMs > 0) {
          diaHoy.totalMinutos = Math.max(0, Math.floor(diffMs / 60000));
          const horas = Math.floor(diaHoy.totalMinutos / 60);
          const minutos = diaHoy.totalMinutos % 60;
          diaHoy.totalHorasTexto = `${horas}h ${minutos}m (en curso)`;
          this.calcularSemanaActualYResumenMensual();
        }
      }
    }
  }

  /** Devuelve solo la semana actual y la última (semana anterior / última cerrada) */
  get semanasVisibles(): ResumenSemanaMes[] {
    if (!this.resumenSemanasMes || this.resumenSemanasMes.length === 0) return [];
    const idxActual = this.resumenSemanasMes.findIndex(s => s.esSemanaActual);
    if (idxActual === -1) {
      // Si no hay semana actual (ej. mes cerrado), mostrar las últimas 2 semanas disponibles
      return this.resumenSemanasMes.slice(-2);
    }
    if (idxActual === 0) {
      // Si es la primera semana del mes, mostrar la actual y la siguiente si existe
      return this.resumenSemanasMes.slice(0, Math.min(2, this.resumenSemanasMes.length));
    }
    // Retorna la última semana cerrada (anterior) y la semana actual
    return [this.resumenSemanasMes[idxActual - 1], this.resumenSemanasMes[idxActual]];
  }

  // ========================================
  // PUNTUALIDAD (horario laboral de referencia)
  // ========================================
  readonly HORA_ENTRADA_MIN = 7 * 60 + 30;   // 07:30 AM
  readonly GABELA_ENTRADA_MIN = 5;          // 5 min de tolerancia (hasta 07:35 AM)
  readonly HORA_SALIDA_MIN = 17 * 60 + 30;   // 05:30 PM (salida debe ser después de 5:30 PM)
  readonly GABELA_SALIDA_VERDE_MIN = 5;     // Hasta 5 min después (hasta 05:35 PM) -> Verde (ok)
  readonly GABELA_SALIDA_MIN = 10;          // Hasta 10 min después (hasta 05:40 PM) -> Amarillo (warning), después -> Rojo (late)

  minutosDelDia(fecha: string): number {
    if (!fecha) return 0;
    const match = fecha.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const parts = fecha.split(/[T ]/);
      const timeStr = parts.length > 1 ? parts[1] : parts[0];
      const hm = timeStr.match(/^(\d{1,2}):(\d{2})/);
      if (hm) {
        return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
      }
    }
    const d = new Date(fecha.replace(' ', 'T'));
    const h = d.getHours();
    const m = d.getMinutes();
    return isNaN(h) || isNaN(m) ? 0 : h * 60 + m;
  }

  /** Diferencia en minutos de la primera entrada vs hora oficial (null si no hay entrada). */
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

  /** Diferencia en minutos de la última salida vs hora oficial (null si no hay salida). */
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
    if (d <= 0) return 'Puntual';
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

  // Festivos Colombia 2026 (YYYY-MM-DD)
  private readonly FESTIVOS = new Set<string>([
    '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
    '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
    '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25'
  ]);

  esFestivo(dia: ResumenDiaPresentismo): boolean {
    return this.FESTIVOS.has(dia.fechaKey);
  }

  /** Clases que pintan el triángulo superior (entrada) e inferior (salida) de la celda. */
  claseCeldaDia(dia: ResumenDiaPresentismo): string[] {
    if (this.esFestivo(dia)) {
      return ['cal-festivo'];
    }
    const classes: string[] = [];
    if (dia.tieneDobleEntrada) {
      classes.push('cal-doble-entrada');
    }
    const e = this.estadoEntrada(dia);
    const eClass = e === 'ok' ? 'e-ok' : e === 'warning' ? 'e-warn' : e === 'late' ? 'e-bad' : 'e-none';
    const s = this.estadoSalida(dia);
    const sClass = s === 'ok' ? 's-ok' : s === 'warning' ? 's-warn' : s === 'late' ? 's-bad' : 's-none';
    classes.push(eClass, sClass);
    return classes;
  }

  tituloDia(dia: ResumenDiaPresentismo): string {
    if (this.esFestivo(dia)) {
      return `Día ${dia.diaNumero} · Festivo (Inhabilitado)`;
    }
    const partes: string[] = [];
    if (dia.tieneDobleEntrada) {
      partes.push(`⚠️ Marcación errónea: Doble entrada ()`);
    }
    if (dia.primeraEntrada) partes.push(`Entrada ${dia.primeraEntrada} (${this.textoEntrada(dia)})`);
    if (dia.ultimaSalida) partes.push(`Salida ${dia.ultimaSalida} (${this.textoSalida(dia)})`);
    else if (dia.esHoy && dia.primeraEntrada) partes.push('Jornada en curso');
    const te = this.obtenerTiempoExtraDia(dia);
    if (te) {
      partes.push(`+${te.horas}h Extra (${te.estado === 'APROBADO' ? 'Aprobado' : 'Pendiente'})`);
    }
    return partes.length ? partes.join(' · ') : 'Sin marcaciones';
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

  private formatearHoraEntrada(d: Date): string {
    const minutos = d.getHours() * 60 + d.getMinutes();
    if (minutos < this.HORA_ENTRADA_MIN) {
      return '07:30 AM';
    }
    return this.formatearHora(d);
  }

  private formatearHora(d: Date): string {
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  }

  irANomina(): void {
    this.closeUserMenu();
    this.router.navigate(['/nomina']);
  }
}


