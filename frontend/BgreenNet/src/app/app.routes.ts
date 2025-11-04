import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { layoutRoutes } from './layout/layout-routes';
import { AuthGuard } from './guard/auth.guard';

export const routes: Routes = [
  {
    path: 'login', component: Login
  },
  {
    path: '',
    canActivate: [AuthGuard],  // ✅ Proteger todas las rutas del layout
    children: layoutRoutes
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
