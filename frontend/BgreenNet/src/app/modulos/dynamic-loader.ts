// src/app/modulos/dynamic-loader/dynamic-loader.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dynamic-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loading">Cargando módulo...</div>
    <div *ngIf="error">{{ error }}</div>
    <ng-container *ngIf="componentLoaded">
      <!-- El componente se cargará aquí dinámicamente -->
    </ng-container>
  `
})
export class DynamicLoader implements OnInit {
  loading = true;
  error = '';
  componentLoaded = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const modulo = this.route.snapshot.paramMap.get('modulo');
    const submodulo = this.route.snapshot.paramMap.get('submodulo');
    
    console.log(`📦 Cargando: /app/${modulo}/${submodulo}`);
    
    // Aquí cargarías el componente dinámicamente según la ruta
    this.loadComponent(modulo!, submodulo!);
  }

  async loadComponent(modulo: string, submodulo: string) {
    try {
      // Mapeo de rutas a componentes
      const componentMap: { [key: string]: () => Promise<any> } = {
        'configuracion/usuarios': () => import('../modulos/configuracion/usuarios/usuarios').then(c => c.Usuarios),
        'configuracion/sistemasinformacion': () => import('../modulos/configuracion/sistemasinformacion/sistemasinformacion').then(c => c.Sistemasinformacion),
        'configuracion/pulsos': () => import('../modulos/configuracion/pulsos/pulsos').then(c => c.Pulsos),
        // Agrega más rutas según necesites
      };
1
      const path = `${modulo}/${submodulo}`;
      const loader = componentMap[path];

      if (loader) {
        await loader();
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