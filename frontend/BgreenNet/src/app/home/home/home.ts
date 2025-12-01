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
    this.sistemasinformacion();
    this.guardarname();
    this.loadUserData();

    // Cargar contactos al inicio
    this.cargarContactosIniciales();

    this.subscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url === '/home' || this.router.url.startsWith('/home')) {
        this.sistemasinformacion();
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
        console.log("RESPUESTA CONTACTOS INICIALES => ", response);
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
        console.log('Contactos cargados para modal:', this.sistemacontactosData);
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

  sistemasinformacion(): void {
    this.homeservice.getAll().subscribe({
      next: (data) => {
        this.sistemaInformacionData = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar sistemas de información', err)
    });
  }

  // ========================================
  // GESTIÓN DE USUARIO
  // ========================================
  loadUserData(): void {
    const userString = localStorage.getItem('usuario');

    if (userString) {
      const user = JSON.parse(userString);
      this.fullName = `${user.nombre} ${user.apellido}`.toUpperCase();
      this.nameempresa = user.empresa_descripcion || 'N/A';
      this.initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
    }
  }

  guardarname() {
    if (isPlatformBrowser(this.platformId)) {
      const usuarioString = localStorage.getItem('usuario');

      if (usuarioString) {
        const usuario = JSON.parse(usuarioString);
        this.fullName = usuario.usuario;
      } else {
        console.log('No se encontró el usuario en localStorage');
      }
    } else {
      console.log('No se puede acceder a localStorage desde el servidor.');
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  }

  logout1() {
    console.log('Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  irAUsuarios() {
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

  







}