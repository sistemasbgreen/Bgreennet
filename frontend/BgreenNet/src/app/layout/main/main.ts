import { Component, ElementRef, HostListener, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { LayoutRoutingModule } from '../layout-routing-module';
import { CommonModule, isPlatformBrowser, NgFor, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main',
imports: [LayoutRoutingModule, FormsModule, CommonModule, NgFor, NgIf, RouterOutlet, NgForOf, RouterLink],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {

   isSidebarCollapsed = false;
   isMenuDropdownOpen = false;



   modulos = [
  {
    nombre: 'Configuración',
    ruta: '/app/configuracion', 
    icono: '⚙️',
    expandido: false,
    submodulos: [
      { nombre: 'Usuarios', ruta: '/app/configuracion/usuarios' }, 
      { nombre: 'Roles', ruta: '/app/configuracion/roles' },       
    ]
  },
  {
    nombre: 'CMR',
    ruta: '/app/cmr',
    icono: '📊',
    expandido: false,
    submodulos: [
      { nombre: 'Reportes', ruta: '/app/cmr/reportes' },     
      { nombre: 'Dashboard', ruta: '/app/cmr/dashboard' },   
    ]
  }
];



 user: string = '';


  constructor(@Inject(PLATFORM_ID) private platformId: Object , private router: Router,) {}

  isUserMenuOpen = false;

ngOnInit(): void {
    this.guardarname();
       this.isSidebarCollapsed = !this.isSidebarCollapsed;
  
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleSubmodulos(modulo: any) {
    modulo.expandido = !modulo.expandido;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }



  // Opcional: cerrar menú si se hace clic fuera
  @ViewChild('userDropdown') userDropdown!: ElementRef;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.userDropdown && !this.userDropdown.nativeElement.contains(event.target)) {
      this.isUserMenuOpen = false;
    }
  }



 guardarname() {
    // Verificamos que el código se ejecuta en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const usuarioString = localStorage.getItem('usuario');

      if (usuarioString) {
        const usuario = JSON.parse(usuarioString);
        this.user = usuario.usuario; // 👈 Asignamos el nombre al atributo público

      } else {
        console.log('No se encontró el usuario en localStorage');
      }
    } else {
      console.log('No se puede acceder a localStorage desde el servidor.');
    }
  }


   toggleMenuDropdown() {
    this.isMenuDropdownOpen = !this.isMenuDropdownOpen;
    if (this.isUserMenuOpen) this.isUserMenuOpen = false;
  }


  goToHome() {
    console.log('Ir a inicio');
  }

    logout() {
    localStorage.removeItem('token');
    
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);



}

changePassword() {
    this.isUserMenuOpen = false;
    // Tu lógica para cambio de clave aquí

  }

  openReports() {

  }

  openSettings() {

  }

  home() {

    this.router.navigate(['/home']);
  }

  
}
