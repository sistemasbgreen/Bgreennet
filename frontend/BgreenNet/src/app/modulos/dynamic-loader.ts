import { Component, OnInit, Type } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, NgComponentOutlet } from '@angular/common';

@Component({
  selector: 'app-dynamic-loader',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  template: `
    <div *ngIf="loading" class="loader-status">
      <i class="bi bi-arrow-repeat spin"></i> Cargando módulo...
    </div>
    <div *ngIf="error" class="loader-error">
      <i class="bi bi-exclamation-triangle"></i> {{ error }}
    </div>
    <ng-container *ngIf="componentLoaded && componentClass">
      <ng-container *ngComponentOutlet="componentClass"></ng-container>
    </ng-container>
  `,
  styles: [`
    .loader-status { padding: 40px; text-align: center; color: #006c2c; font-weight: 600; }
    .loader-error { padding: 40px; text-align: center; color: #c0392b; font-weight: 600; }
    .spin { display: inline-block; animation: fa-spin 2s infinite linear; }
    @keyframes fa-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class DynamicLoader implements OnInit {
  loading = true;
  error = '';
  componentLoaded = false;
  componentClass: Type<any> | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const modulo = params.get('modulo');
      const submodulo = params.get('submodulo');
      
      if (modulo && submodulo) {
        console.log(`📦 Cargando: /app/${modulo}/${submodulo}`);
        this.loadComponent(modulo, submodulo);
      }
    });
  }

  async loadComponent(modulo: string, submodulo: string) {
    this.loading = true;
    this.error = '';
    this.componentLoaded = false;
    this.componentClass = null;

    try {
      // Mapeo de rutas a componentes
      const componentMap: { [key: string]: () => Promise<any> } = {
        'configuracion/usuarios': () => import('../modulos/configuracion/usuarios/usuarios').then(m => m.Usuarios),
        'configuracion/sistemasinformacion': () => import('../modulos/configuracion/sistemasinformacion/sistemasinformacion').then(m => m.Sistemasinformacion),
        'configuracion/pulsos': () => import('../modulos/configuracion/pulsos/pulsos').then(m => m.Pulsos),
        'configuracion/metas-cmi': () => import('../modulos/configuracion/metas-cmi/metas-cmi').then(m => m.MetasCMI),
        'configuracion/maestro-configuracion': () => import('../modulos/configuracion/maestro-configuracion/maestro-configuracion').then(m => m.MaestroConfiguracion),
        // Agrega más rutas según necesites
      };

      const path = `${modulo}/${submodulo}`;
      const loader = componentMap[path];

      if (loader) {
        this.componentClass = await loader();
        this.componentLoaded = true;
        this.loading = false;
      } else {
        this.error = `No se encontró el módulo: ${path}`;
        this.loading = false;
      }
    } catch (err) {
      this.error = `Error al cargar el módulo: ${err}`;
      this.loading = false;
    }
  }
}