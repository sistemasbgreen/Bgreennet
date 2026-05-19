import { PrioridadTarea } from './../../models/Tareas/PrioridadTarea';
import { isPlatformBrowser } from '@angular/common';
import { Subject, timer } from 'rxjs';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Inject, OnInit, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router } from "@angular/router";
import { SistemaInformacion } from '../../models/sistemasinformacion';
import { homeservices } from '../../servicios/homeservices';
import { NgIf, NgForOf, CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListasService } from '../../servicios/listasServices';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Tarea } from '../../models/Tareas/Tarea';
import { CreateTareaRequest } from '../../models/Tareas/CreateTareaRequest';
import { Pulso } from '../../models/Pulsos/pulso';
import { AuthService } from '../../auth/authservices';
import Swal from 'sweetalert2';
import { filter, takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PulsoService } from '../../servicios/pulsoservices';
import { UsuarioService } from '../../servicios/usuarioservices';


// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trmChart') trmChartRef!: ElementRef<HTMLCanvasElement>;
  private destroy$ = new Subject<void>();
  private audioCtx: AudioContext | null = null;
  private trmChart: Chart | null = null;

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
  showModal = false;
  darkMode = false;
  isModalHistorialOpen = false; //  Modal de historial
  isModalCambiarClaveOpen = false;
  claveActual = '';
  nuevaClave = '';
  confirmarClave = '';
  errorClave = '';
  successClave = '';
  mostrarClaveActual = false;
  mostrarNuevaClave = false;
  mostrarConfirmarClave = false;
  isModalDetalleOpen = false;
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
  dashboardWidgets = {
     stats: true,
    trmChart: true,
    activity: true,
    quickAccess: true,
    tasks: true,
    calendar: true
  };

  // Reloj
  currentTime: Date = new Date();
  greeting: string = '';
  tareaResaltadaId: number | null = null;

  // El desbloqueo de audio se maneja en onDocumentClick más abajo

  //  Tareas mejoradas
  tareas: Tarea[] = [];
  tareasActivas: Tarea[] = []; // Solo CREADA y EN PROCESO
  tareasFinalizadas: Tarea[] = []; // Solo FINALIZADAS
  focusTasksMode: boolean = false; // Modo enfoque de tareas
  tasksViewMode: 'cards' | 'list' = 'cards'; // Modo de visualización de tareas
  
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
    private sanitizer: DomSanitizer
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

    if (isPlatformBrowser(this.platformId)) {
      this.loadUserDataAndPermisos();
      this.iniciarTemporizadorNotificaciones();
      this.startBackgroundSync();
      // Inicializar contexto de audio
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Solicitar permiso para notificaciones nativas del navegador
      this.solicitarPermisoNotificaciones();
    }
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
  }


  // ========================================
  // RELOJ Y SALUDO
  // ========================================
  startClock(): void {
    setInterval(() => {
      this.currentTime = new Date();
      this.greeting = this.getGreeting();
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
      calendar: newState
    };
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('dashboardWidgets', JSON.stringify(this.dashboardWidgets));
    }
  }

  refrescarCalendario(): void {
    this.loadingCalendar = true;
    setTimeout(() => {
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
  // MENÚ DE USUARIO
  // ========================================
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
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
      this.isUserMenuOpen = false;
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
        this.idDireccionUsuario = user.id_direccion_fk || user.idDireccion || 0;

        this.obtenerTareas();

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
        this.sistemaInformacionData = Array.isArray(data) ? data : [data];
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
        nombre: 'Solicitud de Vacaciones',
        descripcion: 'Formato para solicitar días de vacaciones',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/GGH-F-17%20FORMATO%20SOLICITUD%20DE%20VACACIONES%20(1).xlsx'
      },
      {
        nombre: 'Formato de comidas y taxis',
        descripcion: 'Formato para reportar gastos de viaje y comida',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/FORMATO%20DE%20SOLICITUDES%20DE%20ALIMENTACION%20Y%20TAXIS.xlsx'
      },
      {
        nombre: 'Ingreso y salida de herramientas',
        descripcion: 'Solicitud Ingreso y salida de herramientas',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/Formato%20Ingreso%20y%20salida%20de%20herramientas.xlsx'
      },
      {
        nombre: 'Solicitud Ingreso a TBS',
        descripcion: 'Reporte Solicitud Ingreso a TBS',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/Solicitud%20de%20ingreso%20TBS.xlsx'
      },
      {
        nombre: 'Lista Asistencia',
        descripcion: 'Control de asistencia',
        url: 'https://bgreennet.bgreen.com.co/Imagenes/Documentos/GGH_F_07%20Lista_asistencia_%20V10%20(1).xlsx'
      },
      {
        nombre: 'Solicitud de compra o servicio',
        descripcion: 'Solicitud de compra o servicio',
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
      this.modalTitle = 'Lista de Formatos';
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
          console.log('📋 Tareas cargadas:', sortedData.length);
          sortedData.forEach(t => {
            console.log(`  Tarea #${t.id} "${t.titulo}"`, {
              idUsuario: t.idUsuario,
              idUsuarioCreador: t.idUsuarioCreador,
              'DisplayName(asignado)': this.getUserDisplayName(t.idUsuario),
              'Initials(asignado)': this.getUserInitials(t.idUsuario),
              'DisplayName(creador)': this.getUserDisplayName(t.idUsuarioCreador),
              'Initials(creador)': this.getUserInitials(t.idUsuarioCreador),
            });
          });
          
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
          console.error('Error al traer tareas', error);
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

  isModalCalendarioHeaderOpen: boolean = false;

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
      error: (err: any) => {
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
        error: (err: any) => {
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
        `,
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
    }).then((result: any) => {
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
          error: (err: any) => {
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
    this.router.navigate(['app/configuracion']);
  }

  irAPerfil(): void {
    this.router.navigate(['app/perfil']);
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





  get claveConfirmadaValida(): boolean {
    return this.nuevaClave === this.confirmarClave && this.nuevaClave.length > 0;
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
    this.isModalCambiarClaveOpen = false;
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

    const dto = {
      idUsuario: this.id_usuario,
      claveActual: this.claveActual,
      nuevaClave: this.nuevaClave
    };

    this.usuarioService.cambiarClave(dto).subscribe({
      next: () => {
        this.successClave = 'Clave actualizada exitosamente.';
        setTimeout(() => {
          this.cerrarModalCambiarClave();
        }, 2000);
      },
      error: (err) => {
        console.error('Error al cambiar clave:', err);
        this.errorClave = err.error?.error || 'Error al intentar cambiar la clave. Verifica tu clave actual.';
      }
    });
  }

  
  get filteredContactos(): any[] {
    let contactos = [...this.sistemacontactosData];
    const q = this.contactoSearchQuery?.toLowerCase().trim();

    if (q) {
      contactos = contactos.filter(c =>
        c.nombre?.toLowerCase().includes(q) ||
        c.cargo?.toLowerCase().includes(q) ||
        c.correo?.toLowerCase().includes(q)
      );
    }

    // Ordenar por extensión de menor a mayor
    return contactos.sort((a, b) => {
      const extA = parseInt(a.ext) || 0;
      const extB = parseInt(b.ext) || 0;
      return extA - extB;
    });
  }

 
  get tieneMayuscula(): boolean { return /[A-Z]/.test(this.nuevaClave); }
  get tieneMinuscula(): boolean { return /[a-z]/.test(this.nuevaClave); }
  get tieneNumero(): boolean    { return /[0-9]/.test(this.nuevaClave); }
  get tieneCaracterEspecial(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.nuevaClave); }
  get tieneLongitud(): boolean  { return this.nuevaClave.length >= 8; }


  get passwordValido(): boolean {
    return this.tieneMayuscula && this.tieneMinuscula && this.tieneNumero && this.tieneLongitud && this.tieneCaracterEspecial;
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
          console.log('✨ Recordatorio: Tareas pendientes encontradas:', tareasNotificar);
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
              didOpen: (toast: any) => {
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
      error: (err: any) => console.error('Error al obtener notificaciones', err)
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
}


