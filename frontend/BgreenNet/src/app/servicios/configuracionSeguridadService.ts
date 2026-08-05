import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


export interface ConfiguracionSeguridad {
  idConfiguracion?: number;
  expiracionDias: number;
  intentosInvalidos: number;
  minCaracteres: number;
  requiereLetras: boolean;
  requiereNumeros: boolean;
  requiereEspeciales: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionSeguridadService {
  private apiUrl = `${environment.apiUrl}/api/configuracion-seguridad`.trim();

  constructor(private http: HttpClient) { }

  getConfiguracion(): Observable<ConfiguracionSeguridad> {
    return this.http.get<ConfiguracionSeguridad>(this.apiUrl);
  }

  updateConfiguracion(config: ConfiguracionSeguridad): Observable<ConfiguracionSeguridad> {
    return this.http.put<ConfiguracionSeguridad>(this.apiUrl, config);
  }
}
