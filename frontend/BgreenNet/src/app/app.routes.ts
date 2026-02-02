// routes.ts
import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { AuthGuard } from './guard/auth.guard';
import { layoutRoutes } from './layout/layout-routes'; // contiene las rutas bajo /app




export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },

  // Rutas CMI
  {
    path: 'cmi',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./modulos/CMI/cmi-home/cmi-home').then(h => h.CmiHome)
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./modulos/CMI/productos/productos').then(p => p.Productos)
      }
    ]
  },

  // Layout principal (/app/...)
  {
    path: '',
    canActivate: [AuthGuard],
    children: layoutRoutes
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'login'
  }
];
