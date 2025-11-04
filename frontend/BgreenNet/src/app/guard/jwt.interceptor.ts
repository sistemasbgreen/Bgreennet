import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {  HttpRequest,  HttpHandler,  HttpEvent,  HttpInterceptor,  HttpErrorResponse} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/authservices';


@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    
    // Solo agregar token en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const token = this.authService.getToken();
      
      // Si existe token y NO es la petición de login, agregar header Authorization
      if (token && !request.url.includes('/auth/login')) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('🔑 Token agregado al request:', request.url);
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token inválido o expirado
          console.error('❌ Error 401: Token inválido o expirado');
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}