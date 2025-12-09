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
            path: '', //  Ruta por defecto dentro de /configuracion
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
      {
        path: 'cmi',
        children: [

        ]
      }
    ]
  }
];
