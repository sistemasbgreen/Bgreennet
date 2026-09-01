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

export interface InfoServidor {
  appName: string;
  serverPort: string;
  activeProfile: string;
  javaVersion: string;
  osName: string;
  uptime: string;
  jvmMemory: string;
  tomcatMaxThreads: string;
  tomcatMinSpareThreads: string;
  tomcatConnectionTimeout: string;
  forwardHeaders: string;
}

export interface InfoBaseDatos {
  id: string;
  nombre: string;
  url: string;
  usuario: string;
  driver: string;
  databaseName: string;
  host: string;
  poolMax: number;
  poolMin: number;
  connectionTimeout: number;
  passwordConfigurada: boolean;
}

export interface InfoCorreo {
  host: string;
  puerto: string;
  usuario: string;
  reporteEmailTo: string;
  reporteEmailFrom: string;
  auth: string;
  starttls: string;
  passwordConfigurada: boolean;
}

export interface InfoAlmacenamiento {
  rutaUpload: string;
  maxFileSize: string;
  maxRequestSize: string;
  staticLocations: string;
  carpetaExiste?: boolean;
  totalArchivos?: number;
  tamanoTotalBytes?: number;
  tamanoTotalFormateado?: string;
  estadoCarpeta?: string;
}

export interface InfoSeguridadJpa {
  jwtExpiracionMs: number;
  jwtExpiracionFormateada: string;
  jwtSecretConfigurado: boolean;
  jpaDialect: string;
  jpaDdlAuto: string;
  jpaTimeZone: string;
}

export interface PropiedadesServidor {
  servidor: InfoServidor;
  basesDatos: InfoBaseDatos[];
  correo: InfoCorreo;
  almacenamiento: InfoAlmacenamiento;
  seguridadJpa: InfoSeguridadJpa;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionSeguridadService {
  private apiUrl = `${environment.apiUrl}/api/configuracion-seguridad`;

  constructor(private http: HttpClient) { }

  getConfiguracion(): Observable<ConfiguracionSeguridad> {
    return this.http.get<ConfiguracionSeguridad>(this.apiUrl);
  }

  updateConfiguracion(config: ConfiguracionSeguridad): Observable<ConfiguracionSeguridad> {
    return this.http.put<ConfiguracionSeguridad>(this.apiUrl, config);
  }

  getPropiedadesServidor(): Observable<PropiedadesServidor> {
    return this.http.get<PropiedadesServidor>(`${this.apiUrl}/propiedades-servidor`);
  }
}
