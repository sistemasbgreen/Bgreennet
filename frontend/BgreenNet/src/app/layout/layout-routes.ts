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
          }
        ]
      },
      // 👇 Rutas de CMI con loadComponent (sin módulos)
      {
        path: 'cmi',
        children: [
          {
            path: 'home',
            loadComponent: () => import('../modulos/CMI/cmi-home/cmi-home').then(c => c.CmiHome)
          },
          {
            path: 'cpo',
            loadComponent: () => import('../modulos/CMI/cpo/cpo').then(c => c.Cpo)
          },
          {
            path: 'metanol',
            loadComponent: () => import('../modulos/CMI/metanol/metanol').then(c => c.Metanol)
          },
          {
            path: 'metilato',
            loadComponent: () => import('../modulos/CMI/metilato/metilato').then(c => c.Metilato)
          },
          {
            path: '',
            redirectTo: 'home',
            pathMatch: 'full'
          }
        ]
      }
    ]
  }
];