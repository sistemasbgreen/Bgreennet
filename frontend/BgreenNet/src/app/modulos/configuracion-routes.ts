import { Routes } from '@angular/router';
import { Usuarios } from './configuracion/usuarios/usuarios';
import { Sistemasinformacion } from './configuracion/sistemasinformacion/sistemasinformacion';


export const configuracionRoutes: Routes = [
  {
    path: '',
    children: [
      { path: 'usuarios', component: Usuarios },
       { path: 'roles', component: Sistemasinformacion },
    ]
  }
];