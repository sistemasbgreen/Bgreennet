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

  // 👇 Rutas protegidas que usan el layout principal (ej. /app/home, /app/configuracion/...)
  {
    path: '',
    canActivate: [AuthGuard],
    children: layoutRoutes // ✅ Incluye todas las rutas de la app con layout
  },

  // 👇 Sección CMI: rutas protegidas pero fuera del layout principal
  {
    path: 'cmi',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./modulos/CMI/cmi-home/cmi-home').then(h => h.CmiHome)
      },
      {
        path: 'productos',
        loadComponent: () => import('./modulos/CMI/productos/productos').then(p => p.Productos)
      }
      // Agrega más rutas de CMI aquí si es necesario
    ]
  },

  // Redirección por defecto al entrar a la raíz (ej. dominio.com/)
  // Solo si layoutRoutes no maneja ya la redirección desde '' → /app
  // Normalmente, esto ya está cubierto dentro de layoutRoutes (ver nota abajo)
  {
    path: '',
    redirectTo: '/app/home',
    pathMatch: 'full'
  },

  // Ruta comodín: cualquier otra ruta no definida
  {
    path: '**',
    redirectTo: '/login'
  }
];