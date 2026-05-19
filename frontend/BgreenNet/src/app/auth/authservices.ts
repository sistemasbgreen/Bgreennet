import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';



export interface LoginRequest {
  usuario: string;
  contrasena: string;
}

export interface LoginResponse {
  id_usuario: number;
  usuario: string;
  id_detalle_usuario: number;
  nombre: string;
  apellido: string;
  identificacion: number;
  id_perfil_fk: number;
  id_empresa_fk: number;
  id_area_fk: number;
  id_cargo_fk: number;
  perfil_descripcion: string;
  empresa_descripcion: string;
  area_descripcion: string;
  cargo_descripcion: string;
  correo: string;
  token: string;  //  JWT Token
  contrasenaExpirada: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(false);
  private usuarioData = new BehaviorSubject<LoginResponse | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const session = localStorage.getItem('usuario');
      const token = localStorage.getItem('token');
      
      if (session && token) {
        this.loggedIn.next(true);
        this.usuarioData.next(JSON.parse(session));
        this.tokenSubject.next(token);
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('Intentando login:', credentials.usuario);

    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, credentials).pipe(
      tap(response => {
        console.log('Login exitoso:', response);
        
        if (isPlatformBrowser(this.platformId)) {
          // Guardar usuario y token
          localStorage.setItem('usuario', JSON.stringify(response));
          localStorage.setItem('token', response.token);
        }

        this.loggedIn.next(true);
        this.usuarioData.next(response);
        this.tokenSubject.next(response.token);
      })
    );
  }

 logout(): void {
  
  if (isPlatformBrowser(this.platformId)) {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  }
  
  this.loggedIn.next(false);
  this.usuarioData.next(null);
  
  // Navegar y limpiar historial
  this.router.navigate(['/login'], { replaceUrl: true }).then(() => {
    // Limpiar historial de navegación
    if (isPlatformBrowser(this.platformId)) {
      window.history.pushState(null, '', '/login');
    }
  });
}

  isLoggedIn(): boolean {
    return this.loggedIn.value;
  }

  //  Obtener el token JWT
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  //  Obtener datos del usuario actual
  getCurrentUser(): LoginResponse | null {
    return this.usuarioData.value;
  }

  //  Observable del usuario (para suscribirse a cambios)
  getCurrentUser$(): Observable<LoginResponse | null> {
    return this.usuarioData.asObservable();
  }
  
}