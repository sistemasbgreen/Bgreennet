import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { layoutRoutes } from './layout/layout-routes';

export const routes: Routes = [
        {
    path: 'login',
    component: Login
  },
  {
    path: '',
    children: layoutRoutes
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
