import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router } from "@angular/router";
import { SistemaInformacion } from '../../models/sistemasinformacion';
import { homeservices } from '../../servicios/homeservices';
import { NgIf, NgForOf, CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListasService } from '../../servicios/listasServices';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Tarea } from '../../models/Tareas/Tarea';
import { CreateTareaRequest } from '../../models/Tareas/CreateTareaRequest';

// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-home',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit {
  @ViewChild('trmChart') trmChartRef!: ElementRef<HTMLCanvasElement>;
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

  // Datos de sistemas y contactos
  sistemaInformacionData: SistemaInformacion[] = [];
  sistemacontactosData: any[] = [];
  formatosData: any = [];

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
    quickAccess: true
  };

  // Reloj
  currentTime: Date = new Date();
  greeting: string = '';

  //  Tareas mejoradas
  tareas: Tarea[] = [];
  tareasActivas: Tarea[] = []; // Solo CREADA y EN PROCESO
  tareasFinalizadas: Tarea[] = []; // Solo FINALIZADAS

  nuevaTarea: CreateTareaRequest = {
    idUsuario: 0,
    titulo: '',
    descripcion: '',
    idEstado: 1,      // CREADA
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
    'https://bgreen.bgreen.com.co/bgreennet/Img/Pulso5.png',
    'https://bgreen.bgreen.com.co/bgreennet/Img/Pulso14.png',
    'https://bgreen.bgreen.com.co/bgreennet/Img/Pulso15.png',
    'https://bgreen.bgreen.com.co/bgreennet/Img/Pulso10.png'
  ];

  selectedImage: string | null = null;
  subscription: any;
  perfil_Fk: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private homeservice: homeservices,
    private listass: ListasService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarContactosIniciales();
    this.loadTrmData();
    this.startClock();
    this.loadPreferences();

    if (isPlatformBrowser(this.platformId)) {
      this.loadUserDataAndPermisos();
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
    this.subscription?.unsubscribe();
    if (this.trmChart) {
      this.trmChart.destroy();
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
      quickAccess: newState
    };
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('dashboardWidgets', JSON.stringify(this.dashboardWidgets));
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

  // ========================================
  // MENÚ DE USUARIO
  // ========================================
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  // Detectar click fuera del menú
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
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
        this.nameempresa = user.empresa_descripcion || 'N/A';
        this.id_usuario = user.id_usuario;
        this.initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
        this.userEmail = user.email || user.correo || 'No disponible';
        this.userRole = user.rol || user.perfil || 'Usuario';
        this.perfil_Fk = user.id_perfil_fk;

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
        console.log('Permisos obtenidos:', data);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar permisos:', err);
        this.sistemaInformacionData = [];
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
        url: 'http://172.30.72.200/Imagenes/Documentos/GGH-F-17%20FORMATO%20SOLICITUD%20DE%20VACACIONES%20(1).xlsx'
      },
      {
        nombre: 'Formato de comidas y taxis',
        descripcion: 'Formato para reportar gastos de viaje y comida',
        url: 'http://172.30.72.200/Imagenes/Documentos/FORMATO%20DE%20SOLICITUDES%20DE%20ALIMENTACION%20Y%20TAXIS.xlsx'
      },
      {
        nombre: 'Ingreso y salida de herramientas',
        descripcion: 'Solicitud Ingreso y salida de herramientas',
        url: 'http://172.30.72.200/Imagenes/Documentos/Formato%20Ingreso%20y%20salida%20de%20herramientas.xlsx'
      },
      {
        nombre: 'Solicitud Ingreso a TBS',
        descripcion: 'Reporte Solicitud Ingreso a TBS',
        url: 'http://172.30.72.200/Imagenes/Documentos/Solicitud%20de%20ingreso%20TBS.xlsx'
      },
      {
        nombre: 'Lista Asistencia',
        descripcion: 'Control de asistencia',
        url: 'http://172.30.72.200/Imagenes/Documentos/GGH_F_07%20Lista_asistencia_%20V10%20(1).xlsx'
      },
      {
        nombre: 'Solicitud de compra o servicio',
        descripcion: 'Solicitud de compra o servicio',
        url: 'http://172.30.72.200/Imagenes/Documentos/GABT-PR-01-F-01%20Formato%20solicitud%20de%20Compra%20o%20Servicio%20(2).xlsx'
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
  // NAVEGACIÓN Y LOGOUT
  // ========================================
  private getBasePath(): string {
    const pathParts = window.location.pathname.split('/').filter(part => part);
    return '/' + pathParts.slice(0, 2).join('/');
  }

  logout(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('dashboardWidgets');
      localStorage.removeItem('favorites');
      localStorage.removeItem('darkMode');

      window.location.href = this.getBasePath() + '/login';
    }
  }

  // ========================================
  //  TAREAS MEJORADAS
  // ========================================
  obtenerTareas(): void {
    console.log('idnombre ', this.id_usuario);
    this.homeservice.getTareasPorUsuario(this.id_usuario)
      .subscribe({
        next: (data) => {
          console.log('Tareas recibidas:', data);
          this.tareas = data;
          
          //  Filtrar tareas activas (CREADA y EN PROCESO) y finalizadas
          this.tareasActivas = data.filter(t => 
            t.estado.nombre === 'CREADA' || t.estado.nombre === 'INICIADA'
          );
          
          this.tareasFinalizadas = data.filter(t => 
            t.estado.nombre === 'FINALIZADA'
          );

          console.log(' Tareas activas:', this.tareasActivas.length);
          console.log(' Tareas finalizadas:', this.tareasFinalizadas.length);

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al traer tareas', error);
        }
      });
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

  verTarea(tarea: Tarea): void {
    console.log('Tarea seleccionada:', tarea);
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

  crearTarea(): void {
    if (!this.nuevaTarea.titulo.trim()) return;

    this.nuevaTarea.idUsuario = this.id_usuario;

    this.homeservice.crearTarea(this.nuevaTarea)
      .subscribe({
        next: () => {
          console.log('Tarea creada');
          this.obtenerTareas();
          this.cerrarModalTarea();
        },
        error: err => console.error(err)
      });
    console.log(this.nuevaTarea);
  }

  resetFormulario(): void {
    this.nuevaTarea.titulo = '';
    this.nuevaTarea.descripcion = '';
    this.nuevaTarea.idPrioridad = 1;
  }

  cambiarEstado(tarea: Tarea, idEstado: number): void {
    this.homeservice.actualizarTarea(tarea.id, { idEstado })
      .subscribe({
        next: () => {
          console.log('Estado actualizado');
          this.obtenerTareas();
        },
        error: err => console.error(err)
      });
  }

  // Modal de historial
  abrirHistorial(): void {
    this.isModalHistorialOpen = true;
  }

  cerrarHistorial(): void {
    this.isModalHistorialOpen = false;
  }

  // Formatear tiempo relativo
  getTiempoRelativo(fecha: string): string {
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

  irAUsuarios(): void {
    this.router.navigate(['app/configuracion/usuarios']);
  }

  irAConfiguracion(): void {
    this.router.navigate(['app/configuracion']);
  }

  irAPerfil(): void {
    this.router.navigate(['app/perfil']);
  }
}