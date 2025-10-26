import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface LoginRequest {
  usuario: string;
  contrasena: string;
}

export interface LoginResponse {
  idUsuario: number;
  usuario: string;
  nombreCompleto: string;
  perfil: string;
}

@Injectable({
  providedIn: 'root'
})


export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(false);
  private usuarioData = new BehaviorSubject<any>(null);

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const session = localStorage.getItem('usuario');
      if (session) {
        this.loggedIn.next(true);
        this.usuarioData.next(JSON.parse(session));
      }
    }
  }

  login(credentials: any) {
    console.log(credentials)

    return this.http.post('/api/auth/login', credentials).pipe(
      tap(response => {
        
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('usuario', JSON.stringify(response));
        }

        this.loggedIn.next(true);
        this.usuarioData.next(response);
      })
    );

  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuario');
    }
    this.loggedIn.next(false);
    this.usuarioData.next(null);
  }

  isLoggedIn(): boolean {
    return this.loggedIn.value;
  }
}