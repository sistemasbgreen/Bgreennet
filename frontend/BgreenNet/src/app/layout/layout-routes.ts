import { Routes } from '@angular/router';
import { Main } from './main/main';
import { Home } from '../home/home/home';
import { Cmiplanta } from '../home/cmiplanta/cmiplanta';

export const layoutRoutes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: Home
  },
  {
    path: 'cmiplanta',
    component: Cmiplanta
  },
  {
    path: 'app',
    component: Main,
    children: [
      {
        path: 'configuracion',
        children: [
          {
            path: '',
            redirectTo: 'usuarios',
            pathMatch: 'full'
          },
          {
            path: 'usuarios',
            loadComponent: () => import('../modulos/configuracion/usuarios/usuarios').then(c => c.Usuarios)
          },
          {
            path: 'sistemasinformacion',
            loadComponent: () => import('../modulos/configuracion/sistemasinformacion/sistemasinformacion').then(c => c.Sistemasinformacion)
          },
          {
            path: 'pulsos',
            loadComponent: () => import('../modulos/configuracion/pulsos/pulsos').then(c => c.Pulsos)
          },
          {
            path: 'homeconfig',
            loadComponent: () => import('../modulos/configuracion/homeconfig/homeconfig').then(c => c.Homeconfig)
          },
          {
            path: 'metas',
            redirectTo: 'metas-cmi',
            pathMatch: 'full'
          },
          {
            path: 'metas-cmi',
            loadComponent: () => import('../modulos/configuracion/metas-cmi/metas-cmi').then(c => c.MetasCMI)
          }
        ]
      },
      {
        path: 'cmi',
        children: [
          {
            path: 'home',
            loadComponent: () => import('../modulos/CMI/cmi-home/cmi-home').then(c => c.CmiHome)
          },
          {
            path: '',
            redirectTo: 'home',
            pathMatch: 'full'
          }
        ]
      },
      // 👇 NUEVA: Ruta comodín para cargar componentes dinámicamente
      {
        path: ':modulo/:submodulo',
        loadComponent: () => import('../modulos/dynamic-loader').then(c => c.DynamicLoader)
      }
    ]
  }
];