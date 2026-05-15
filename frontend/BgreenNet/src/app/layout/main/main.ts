import { Component, OnInit, ElementRef, HostListener, Inject, PLATFORM_ID, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { CommonModule, isPlatformBrowser, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModuleConfigService } from '../../servicios/moduleConfigService';
import { UsuarioService } from '../../servicios/usuarioservices';
import { ModuloDTO } from '../../models/modulos/ModuloDTO';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-main',
  standalone: true,
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
  modulosOriginales: ModuloDTO[] = [];

  // Cambio de contraseña (Usa la misma lógica que Home)
  showChangePasswordModal = false;
  claveActual = '';
  nuevaClave = '';
  confirmarClave = '';
  errorClave = '';
  successClave = '';
  mostrarClaveActual = false;
  mostrarNuevaClave = false;
  mostrarConfirmarClave = false;
  
  esClaveVencida = false;
  usuarioId: number | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private moduleConfigService: ModuleConfigService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    this.guardarname();
    this.loadModuleConfig();
  }

  loadModuleConfig(): void {
    this.moduleConfigService.getModulos().subscribe({
      next: (modulos) => {
        this.modulosOriginales = JSON.parse(JSON.stringify(modulos));
        this.modulos = modulos;
        this.aplicarPermisos();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar configuración:', error);
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

  aplicarPermisos() {
    if (this.perfil === 'Administrador') {
      this.modulos = JSON.parse(JSON.stringify(this.modulosOriginales));
      return;
    }
    
    if (this.modulosOriginales.length === 0) return;
    
    this.modulos = this.modulosOriginales.map(moduloOriginal => {
      const modulo = JSON.parse(JSON.stringify(moduloOriginal));
      if (modulo.subModulos) {
        modulo.subModulos = modulo.subModulos.filter((sub: any) => {
          return sub.roles && sub.roles.includes(this.perfil);
        });
      }
      return modulo;
    }).filter(modulo => {
      return modulo.subModulos && modulo.subModulos.length > 0;
    });
  }

  guardarname() {
    if (isPlatformBrowser(this.platformId)) {
      const usuarioString = localStorage.getItem('usuario');
      if (usuarioString) {
        const usuario = JSON.parse(usuarioString);
        this.user = usuario.usuario;
        this.perfil = usuario.perfil_descripcion;
        this.usuarioId = usuario.idUsuario || usuario.id_usuario;
        
        // Verificar si la contraseña está vencida
        if (usuario.contrasenaExpirada === true || usuario.contrasenaExpirada === 'true') {
          this.esClaveVencida = true;
          
          // Mostrar alerta informativa
          Swal.fire({
            title: '¡Clave Vencida!',
            text: 'Su contraseña ha expirado. Por seguridad, debe actualizarla para continuar.',
            icon: 'warning',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0a5c2e',
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => {
            this.abrirModalCambiarClave();
          });
        }
      }
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

  home() {
    this.isUserMenuOpen = false;
    this.router.navigate(['/home']);
  }

  // ========================================
  // LÓGICA DEL MODAL (COPIADA DE HOME.TS)
  // ========================================

  get tieneMayuscula(): boolean { return /[A-Z]/.test(this.nuevaClave); }
  get tieneMinuscula(): boolean { return /[a-z]/.test(this.nuevaClave); }
  get tieneNumero(): boolean    { return /[0-9]/.test(this.nuevaClave); }
  get tieneCaracterEspecial(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.nuevaClave); }
  get tieneLongitud(): boolean  { return this.nuevaClave.length >= 8; }
  
  get passwordValido(): boolean {
    return this.tieneMayuscula && this.tieneMinuscula && this.tieneNumero && this.tieneLongitud && this.tieneCaracterEspecial;
  }

  get claveConfirmadaValida(): boolean {
    return this.nuevaClave === this.confirmarClave && this.nuevaClave.length > 0;
  }

  get esDiferenteDeActual(): boolean {
    return this.nuevaClave !== this.claveActual && this.nuevaClave.length > 0;
  }

  abrirModalCambiarClave(): void {
    this.showChangePasswordModal = true;
    this.claveActual = '';
    this.nuevaClave = '';
    this.confirmarClave = '';
    this.errorClave = '';
    this.successClave = '';
    this.isUserMenuOpen = false;
  }

  cerrarModalCambiarClave(): void {
    if (this.esClaveVencida) {
      Swal.fire({
        title: 'Acción requerida',
        text: 'Debe cambiar su clave antes de continuar.',
        icon: 'info',
        confirmButtonColor: '#0a5c2e'
      });
      return;
    }
    this.showChangePasswordModal = false;
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

    if (!this.usuarioId) {
      this.errorClave = 'Error: Sesión de usuario no válida.';
      return;
    }

    const dto = {
      idUsuario: this.usuarioId,
      claveActual: this.claveActual,
      nuevaClave: this.nuevaClave
    };

    this.usuarioService.cambiarClave(dto).subscribe({
      next: () => {
        this.successClave = 'Clave actualizada exitosamente.';
        
        if (this.esClaveVencida) {
          const userString = localStorage.getItem('usuario');
          if (userString) {
            const user = JSON.parse(userString);
            user.contrasenaExpirada = false;
            localStorage.setItem('usuario', JSON.stringify(user));
            this.esClaveVencida = false;
          }
        }

        setTimeout(() => {
          this.showChangePasswordModal = false;
          this.resetModal();
          this.cdr.detectChanges();
        }, 2000);
      },
      error: (err) => {
        console.error('Error al cambiar clave:', err);
        this.errorClave = err.error?.error || 'Error al intentar cambiar la clave. Verifica tu clave actual.';
      }
    });
  }
}
