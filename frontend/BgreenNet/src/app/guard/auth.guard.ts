import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { 
  Router, 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot 
} from '@angular/router';
import { AuthService } from '../auth/authservices';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (isPlatformBrowser(this.platformId)) {
      // ✅ Verificación directa en localStorage (más segura tras logout)
      const token = localStorage.getItem('token');
      const usuario = localStorage.getItem('usuario');

      if (token && usuario) {
        console.log('✅ Usuario autenticado (localStorage), acceso permitido');
        return true;
      }

      console.log('🚫 No autenticado, redirigiendo a login');
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // En entornos SSR (Server-Side Rendering), permitimos temporalmente
    // o puedes bloquear retornando `false` si no soportas SSR sin autenticación.
    return true;
  }



}