import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { layoutRoutes } from './layout/layout-routes'; // contiene /app
import { AuthGuard } from './guard/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },

  // 👇 Rutas protegidas con layout (/app/...)
  {
    path: '',
    canActivate: [AuthGuard],
    children: layoutRoutes // esto incluye /app
  },

  // 👇 Rutas de CMI SIN layout (hermanas de /app)
  {
    path: 'cmi',
    canActivate: [AuthGuard], // opcional: ¿requiere autenticación?
    children: [
      {
        path: 'home',
        loadComponent: () => import('./modulos/CMI/cmi-home/cmi-home').then(c => c.CmiHome)
      },
      {
        path: 'cpo',
        loadComponent: () => import('./modulos/CMI/cpo/cpo').then(c => c.Cpo)
      },
      {
        path: 'metanol',
        loadComponent: () => import('./modulos/CMI/metanol/metanol').then(c => c.Metanol)
      },
      {
        path: 'metilato',
        loadComponent: () => import('./modulos/CMI/metilato/metilato').then(c => c.Metilato)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },

  {
    path: '**',
    redirectTo: '/login'
  }
];