import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Injectable, OnInit } from '@angular/core';
import { NavigationEnd, Router } from "@angular/router";
import { ElementRef, HostListener, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { SistemaInformacion } from '../../models/sistemasinformacion';
import { homeservices } from '../../servicios/homeservices';
import { NgIf, NgForOf } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Usuarios } from '../../modulos/configuracion/usuarios/usuarios';
import { filter } from 'rxjs';
import { Usuario } from '../../models/usuario';
import { Console } from 'console';


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
  perfil_Fk : any;
  nameempresa = '';
  initials = '';
  isModalOpen = false;
  modalTitle = '';
  modalType: any;
  modalData: any = [];

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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
   // this.sistemasinformacion();

    this.cargarContactosIniciales();
    
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
        url: '/assets/formatos/vacaciones.pdf'
      },
      {
        nombre: 'Reporte de Gastos',
        descripcion: 'Formato para reportar gastos de viaje y representación',
        url: '/assets/formatos/gastos.pdf'
      },
      {
        nombre: 'Permiso Laboral',
        descripcion: 'Formato para solicitar permisos temporales',
        url: '/assets/formatos/permisos.pdf'
      },
      {
        nombre: 'Certificado Laboral',
        descripcion: 'Solicitud de certificado laboral',
        url: '/assets/formatos/certificado.pdf'
      },
      {
        nombre: 'Formato de Incapacidad',
        descripcion: 'Reporte de incapacidad médica',
        url: '/assets/formatos/incapacidad.pdf'
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