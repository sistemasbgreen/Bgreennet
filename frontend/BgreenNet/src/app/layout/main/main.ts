import { Component, OnInit, ElementRef, HostListener, Inject, PLATFORM_ID, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { CommonModule, isPlatformBrowser, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModuleConfigService } from '../../servicios/moduleConfigService';
import { ModuloDTO } from '../../models/modulos/ModuloDTO';

@Component({
  selector: 'app-main',
  imports: [FormsModule, CommonModule, RouterOutlet, RouterLink],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main implements OnInit {

  isSidebarCollapsed = false;
  isMenuDropdownOpen = false;
  user: string = '';
  perfil: string = '';
  isUserMenuOpen = false;
  
  modulos: ModuloDTO[] = [];
  modulosOriginales: ModuloDTO[] = []; //  Guardar copia original

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private moduleConfigService: ModuleConfigService
  ) { }

  ngOnInit(): void {
    this.guardarname();
    this.loadModuleConfig(); //  Cargar configuración desde backend
  }

  // Cargar configuración desde el backend
  loadModuleConfig(): void {
    this.moduleConfigService.getModulos().subscribe({
      next: (modulos) => {
        this.modulosOriginales = JSON.parse(JSON.stringify(modulos)); //  Guardar copia original
        this.modulos = modulos;
        this.cdr.detectChanges();
        console.log(' Configuración de módulos cargada:', this.modulos);
        
        //  Aplicar permisos después de cargar los módulos
        this.aplicarPermisos();
        
        // Debug
        this.modulos.forEach(modulo => {
          console.log('Módulo:', modulo.nombre);
          if (modulo.subModulos) {
            modulo.subModulos.forEach(sub => {
              console.log(`  - Submódulo: ${sub.nombre}, Ruta: ${modulo.ruta}/${sub.ruta}, Roles:`, sub.roles);
            });
          }
        });
      },
      error: (error) => {
        console.error(' Error al cargar configuración:', error);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (this.isSidebarCollapsed) {
      this.modulos.forEach(modulo => modulo.expandido = false);
    }
  }

  toggleSubmodulos(modulo: ModuloDTO) {
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

  //  Adaptar lógica de permisos para datos dinámicos
  aplicarPermisos() {
    if (this.perfil === 'Administrador') {
      //  el admin ve todo, restaurar módulos originales
      this.modulos = JSON.parse(JSON.stringify(this.modulosOriginales));
      console.log(' Administrador: mostrando todos los módulos');
      return;
    }
    
    console.log('👤 Perfil del usuario:', this.perfil);
    
    if (this.modulosOriginales.length === 0) {
      console.warn('⚠️ No hay módulos originales para filtrar');
      return;
    }
    
    //  Filtrar módulos y submódulos según permisos del perfil
    this.modulos = this.modulosOriginales.map(moduloOriginal => {
      const modulo = JSON.parse(JSON.stringify(moduloOriginal)); // Clonar módulo
      
      if (modulo.subModulos) {
        //  Mantener solo los submódulos que tienen el rol del usuario
        modulo.subModulos = modulo.subModulos.filter((sub: { roles: string | string[]; nombre: any; }) => {
          const tienePermiso = sub.roles && sub.roles.includes(this.perfil);
          console.log(`  - ${sub.nombre}: ${tienePermiso ? ' Tiene permiso' : ' No tiene permiso'}`);
          return tienePermiso;
        });
      }
      
      return modulo;
    }).filter(modulo => {
      //  Mantener solo los módulos que tienen al menos un submódulo visible
      const tieneSubmodulos = modulo.subModulos && modulo.subModulos.length > 0;
      console.log(`Módulo ${modulo.nombre}: ${tieneSubmodulos ? ' Visible' : ' Oculto (sin submódulos visibles)'}`);
      return tieneSubmodulos;
    });
    
    console.log(' Permisos aplicados. Módulos visibles:', this.modulos.length);
  }

  guardarname() {
    if (isPlatformBrowser(this.platformId)) {
      const usuarioString = localStorage.getItem('usuario');
      if (usuarioString) {
        const usuario = JSON.parse(usuarioString);
        this.user = usuario.usuario;
        this.perfil = usuario.perfil_descripcion;
        console.log('👤 Usuario:', this.user, '| Perfil:', this.perfil);
        //  NO llamar aplicarPermisos() aquí, se llama después de cargar módulos
      } else {
        console.log('⚠️ No se encontró el usuario en localStorage');
      }
    } else {
      console.log('⚠️ No se puede acceder a localStorage desde el servidor.');
    }
  }

  toggleMenuDropdown() {
    this.isMenuDropdownOpen = !this.isMenuDropdownOpen;
    if (this.isUserMenuOpen) this.isUserMenuOpen = false;
  }

  openSettings() {
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