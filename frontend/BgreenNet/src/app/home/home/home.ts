import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Injectable, OnInit } from '@angular/core';
import { NavigationEnd, Router } from "@angular/router";
import { ElementRef, HostListener, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { SistemaInformacion } from '../../models/sistemasinformacion';
import { homeservices } from '../../servicios/homeservices';
import { NgIf, NgForOf } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListasService } from '../../servicios/listasServices';
import { ChartConfiguration, ChartType } from 'chart.js';



@Component({
  selector: 'app-home',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  fullName: string = '';
  sistemaInformacionData: SistemaInformacion[] = [];
  sistemacontactosData: any[] = [];
  subscription: any;
  isMenuOpen = false;
  perfil_Fk: any;
  nameempresa = '';
  initials = '';
  isModalOpen = false;
  modalTitle = '';
  modalType: any;
  modalData: any = [];
  trmHistory: any[] = [];
  currentTrmValue: string = '';
  isTrmModalOpen = false;
  selectedTrmDate: string = '';
  trmResult: any = null;
  allTrmData: any[] = []; // Guardaremos todos los datos para búsqueda local

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
  showModal = false;
  formatosData: any = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private homeservice: homeservices,
    private listass: ListasService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // this.sistemasinformacion();

    this.cargarContactosIniciales();

    this.loadTrmData();

    if (isPlatformBrowser(this.platformId)) {
      this.loadUserDataAndPermisos();
    }

    //  this.subscription = this.router.events.pipe(
    //    filter(event => event instanceof NavigationEnd)
    //  ).subscribe(() => {
    //     this.sistemasinformacion();
    //   }
    //  });

  }

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
        fechaCorta: new Date(item.vigenciadesde).toISOString().split('T')[0] // 'YYYY-MM-DD'
      }));

      // Valor actual: el más reciente
      const latest = data[0];
      this.currentTrmValue = parseFloat(latest.valor).toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      // Últimos 7 días para referencia
      const last7 = data.slice(0, 7);
      this.trmHistory = last7.map(item => ({
        fecha: new Date(item.vigenciadesde).toLocaleDateString('es-CO'),
        valor: parseFloat(item.valor)
      }));
    });
  }

  private loadUserDataAndPermisos(): void {
    const userString = localStorage.getItem('usuario');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        this.fullName = `${user.nombre} ${user.apellido}`.toUpperCase();
        this.nameempresa = user.empresa_descripcion || 'N/A';
        this.initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
        this.perfil_Fk = user.id_perfil_fk;

        if (this.perfil_Fk) {
          this.verpermisos(this.perfil_Fk);
        }
      } catch (e) {
        console.error('Error al parsear usuario de localStorage', e);
        this.logout();
      }
    } else {
      // Si no hay usuario, redirigir (opcional)
      this.router.navigate(['/login']);
    }
  }

  // Elimina `guardarname()` y `loadUserData()` por separado

  verpermisos(id: any): void {
    this.homeservice.obtenerpermisos(id).subscribe({
      next: (data) => {
        // Asegúrate de que siempre sea un array
        this.sistemaInformacionData = Array.isArray(data) ? data : [data];
        console.log('Permisos obtenidos:', data);
        this.cdr.detectChanges(); // 👈 Asegura la detección de cambios
      },
      error: (err) => {
        console.error('Error al cargar permisos:', err);
        this.sistemaInformacionData = [];
      }
    });
  }



  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // ========================================
  // GESTIÓN DE MODALES
  // ========================================
  openModalformatos(type: string) {
    this.modalType = type;

    if (type === 'contactos') {
      this.modalTitle = 'Directorio de Contactos';
      // Si no hay datos cargados, cargarlos
      if (this.sistemacontactosData.length === 0) {
        this.contactos();
      }
    } else if (type === 'formatos') {
      this.modalTitle = 'Lista de Formatos';
      this.cargarFormatos();
    }

    // Abrir el modal
    this.isModalOpen = true;
  }

  closeModalformatos() {
    this.isModalOpen = false;
  }

  // ========================================
  // CARGA DE DATOS
  // ========================================
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

  cargarFormatos() {
    // Si tienes un servicio real, descomenta esto:
    // this.homeservice.formatos().subscribe({
    //   next: (data) => {
    //     this.formatosData = Array.isArray(data) ? data : [data];
    //     this.cdr.detectChanges();
    //   },
    //   error: (err) => {
    //     console.error('Error al cargar formatos', err);
    //     this.formatosData = [];
    //   }
    // });

    // Datos de ejemplo mientras tanto:
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
        nombre: 'Permiso Laboral',
        descripcion: 'Formato para solicitar permisos temporales',
        url: '/assets/formatos/permisos.pdf'
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
        descripcion: 'asistencia',
        url: 'http://172.30.72.200/Imagenes/Documentos/GGH_F_07%20Lista_asistencia_%20V10%20(1).xlsx'
      },
      {
        nombre: 'Ausentismo Laboral',
        descripcion: 'Ausentismo Laboral',
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

  /*
   sistemasinformacion(): void {
     this.homeservice.getAll().subscribe({
       next: (data) => {
         this.sistemaInformacionData = data;
         this.cdr.detectChanges();
       },
       error: (err) => console.error('Error al cargar sistemas de información', err)
     });
   }
     */




  // ========================================
  // GESTIÓN DE USUARIO
  // ========================================


  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  }

  irAUsuarios() {
    console.log('Activo')
    this.router.navigate(['app/configuracion/usuarios']);
  }



  // ========================================
  // MODAL DE IMÁGENES
  // ========================================
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
  // GESTIÓN DE MODALES
  // ========================================




}