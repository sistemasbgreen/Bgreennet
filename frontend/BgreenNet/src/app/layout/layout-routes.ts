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
    path: 'home/orden-produccion',
    loadComponent: () =>
      import('../modulos/orden-produccion/orden-produccion')
        .then(o => o.OrdenProduccion)
  },
    {
    path: 'home/seguimiento-variable',
    loadComponent: () =>
      import('../home/seguimiento-variable/seguimiento-variable')
        .then(o => o.SeguimientoVariable)
  },
  {
    path: 'home',
    component: Home,
    pathMatch: 'full'
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
            loadComponent: () => import('../modulos/configuracion/metas-cmi/metas-cmi').then(c => c.MetasCMI)
          },
          {
            path: 'metas-cmi',
            loadComponent: () => import('../modulos/configuracion/metas-cmi/metas-cmi').then(c => c.MetasCMI)
          },
          {
            path: 'maestro-configuracion',
            loadComponent: () => import('../modulos/configuracion/maestro-configuracion/maestro-configuracion').then(c => c.MaestroConfiguracion)
          },
          {
            path: 'seguimiento-variable',
            loadComponent: () => import('../modulos/configuracion/variables-plc/variables-plc').then(c => c.VariablesPlc)
          },
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