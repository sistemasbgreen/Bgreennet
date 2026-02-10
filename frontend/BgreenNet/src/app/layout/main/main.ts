import { Component, OnInit, ElementRef, HostListener, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { LayoutRoutingModule } from '../layout-routing-module';
import { CommonModule, isPlatformBrowser, NgFor, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationStart, NavigationEnd, NavigationError, NavigationCancel, Event as RouterEvent } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [FormsModule, CommonModule, RouterOutlet, RouterLink],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {

  isSidebarCollapsed = false;
  isMenuDropdownOpen = false;
  user: string = '';
  isUserMenuOpen = false;

  modulos = [
    {
      nombre: 'Configuración',
      rutaBase: 'app/configuracion', // ✅ Volvemos a string
      icono: '⚙️',
      expandido: false,
      submodulos: [
        { nombre: 'Usuarios', ruta: 'usuarios' },
        { nombre: 'Sistemas Información', ruta: 'sistemasinformacion' },
         { nombre: 'Pulsos', ruta: 'pulsos' }
      ]
    },
    {
      nombre: 'CMR',
      rutaBase: 'app/cmr', // ✅ Volvemos a string
      icono: '📊',
      expandido: false,
      submodulos: [
        { nombre: 'Reportes', ruta: 'reportes' },
        { nombre: 'Dashboard', ruta: 'dashboard' }
      ]
    }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.guardarname();
   // this.prueba();

    /*
    this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        console.log('🧭 Navegación iniciada a:', event.url);
      } else if (event instanceof NavigationEnd) {
        console.log('✅ Navegación completada a:', event.url);
      } else if (event instanceof NavigationError) {
        console.error('❌ Error en navegación:', event.error);
      } else if (event instanceof NavigationCancel) {
        console.warn('⚠️ Navegación cancelada a:', (event as any).url);
      }
    });

*/

  }
/*
  prueba() {
    console.log('🔍 Análisis de rutas generadas:');
    this.modulos.forEach(modulo => {
      console.log(`Módulo: ${modulo.nombre} → base:`, modulo.rutaBase);
      modulo.submodulos.forEach(sub => {
        const rutaCompleta = ['/', ...modulo.rutaBase, sub.ruta];
        console.log(`  → Submódulo: ${sub.nombre} → Ruta:`, rutaCompleta);
      });
    });
  }
*/
toggleSidebar() {
  this.isSidebarCollapsed = !this.isSidebarCollapsed;


  if (this.isSidebarCollapsed) {
    this.modulos.forEach(modulo => modulo.expandido = false);
  }


  // this.modulos.forEach(modulo => modulo.expandido = false);
}

  toggleSubmodulos(modulo: any) {
    modulo.expandido = !modulo.expandido;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  @ViewChild('userDropdown') userDropdown!: ElementRef;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.userDropdown && !this.userDropdown.nativeElement.contains(event.target)) {
      this.isUserMenuOpen = false;
    }
  }

  guardarname() {
    if (isPlatformBrowser(this.platformId)) {
      const usuarioString = localStorage.getItem('usuario');
      if (usuarioString) {
        const usuario = JSON.parse(usuarioString);
        this.user = usuario.usuario;
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

  openSettings() {
    // ✅ Navegación programática con array
    this.router.navigate(['/app', 'configuracion', 'usuarios']);
  }

  logout() {
    this.isUserMenuOpen = false;
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  changePassword() {
    this.isUserMenuOpen = false;
  }

  home() {
    this.isUserMenuOpen = false;
    this.router.navigate(['/home']);
  }
}