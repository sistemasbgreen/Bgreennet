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


@Component({
  selector: 'app-home',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  @Injectable({
    providedIn: 'root'
  })



  fullName: string = '';
  sistemaInformacionData: SistemaInformacion[] = [];
  sistemacontactosData: Usuarios[] = [];
  subscription: any;
  isMenuOpen = false;
  nameempresa = '';
  initials = '';

  images = [
    'https://bgreen.bgreen.com.co/bgreennet/Img/Pulso5.png',
    'https://bgreen.bgreen.com.co/bgreennet/Img/Pulso14.png',
    'https://bgreen.bgreen.com.co/bgreennet/Img/Pulso15.png',
    'https://bgreen.bgreen.com.co/bgreennet/Img/Pulso10.png'
  ];

  selectedImage: string | null = null;
  showModal = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router,
    private homeservice: homeservices,private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.sistemasinformacion();
    this.guardarname();
    this.loadUserData();

    this.subscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Opcional: verifica que la ruta actual es la correcta
      if (this.router.url === '/home' || this.router.url.startsWith('/home')) {
        this.sistemasinformacion();
      }
    });
  }


  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    // Redirigir a login
    window.location.href = '/login'; // o usa Router si prefieres
  }


  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }



  loadUserData(): void {
    const userString = localStorage.getItem('usuario');

    if (userString) {
      const user = JSON.parse(userString);
      this.fullName = `${user.nombre} ${user.apellido}`.toUpperCase();
      this.nameempresa = user.empresa_descripcion || 'N/A';
      this.initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
    }
  }


  irAUsuarios() {
    this.router.navigate(['app/configuracion/usuarios']);
  }


  logout1() {

    console.log('Cerrando sesión...');

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    this.router.navigate(['/login']);
  }

  guardarname() {
    // Verificamos que el código se ejecuta en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const usuarioString = localStorage.getItem('usuario');

      if (usuarioString) {
        const usuario = JSON.parse(usuarioString);
        this.fullName = usuario.usuario; // Asignamos el nombre al atributo público

      } else {
        console.log('No se encontró el usuario en localStorage');
      }
    } else {
      console.log('No se puede acceder a localStorage desde el servidor.');
    }
  }


  sistemasinformacion(): void {
    this.homeservice.getAll().subscribe({
      next: (data) => {
        this.sistemaInformacionData = data;
          this.cdr.detectChanges();
          console.log(this.sistemaInformacionData)
      },
      error: (err) => console.error('Error al cargar sistemas de informacion', err)
    });
  }


  openModal(imageSrc: string): void {
    this.selectedImage = imageSrc;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedImage = null;
  }

  /* Cerrar con tecla ESC
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showModal) {
      this.closeModal();
    }
  }
    */

  onModalClick(event: MouseEvent): void {
    // Cierra solo si se hace clic en el fondo (no en la imagen)
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal')) {
      this.closeModal();
    }
  }

}
