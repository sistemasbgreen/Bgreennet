import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SupervisionAsistenciaItem {
  idSupervision?: number;
  idSupervisor: number;
  cedulaSupervisor: string;
  nombreSupervisor: string;
  tipoAlcance: string; // 'GLOBAL' | 'AREA' | 'COLABORADOR'
  idArea?: number;
  nombreArea?: string;
  cedulaColaborador?: string;
  nombreColaborador?: string;
  puedeAprobarHorasExtra: boolean;
  activo: boolean;
  observacion?: string;
  dateCreate?: string;
  dateModify?: string;
}

export interface SupervisorAsignadoResumen {
  idSupervisor: number;
  cedulaSupervisor: string;
  nombreSupervisor: string;
  cargoSupervisor?: string;
  areaSupervisor?: string;
  tipoAlcance: 'GLOBAL' | 'AREA' | 'COLABORADOR' | 'MIXTO';
  totalAreas: number;
  totalColaboradores: number;
  areasNombres: string[];
  colaboradoresNombres: string[];
  puedeAprobarHorasExtra: boolean;
  activo: boolean;
  observacion?: string;
  reglas: SupervisionAsistenciaItem[];
}

export interface AreaAsignacionPayload {
  idArea: number;
  nombreArea: string;
}

export interface ColaboradorAsignacionPayload {
  cedula: string;
  nombre: string;
  idArea?: number;
  nombreArea?: string;
}

export interface GuardarSupervisionPayload {
  idSupervisor: number;
  cedulaSupervisor: string;
  nombreSupervisor: string;
  tipoAlcance: 'GLOBAL' | 'AREA' | 'COLABORADOR';
  areas?: AreaAsignacionPayload[];
  colaboradores?: ColaboradorAsignacionPayload[];
  puedeAprobarHorasExtra: boolean;
  activo: boolean;
  observacion?: string;
}

export interface PermisosVisibilidadAsistencia {
  esSupervisorConfigurado: boolean;
  accesoGlobal: boolean;
  areasPermitidas: number[];
  nombresAreasPermitidas: string[];
  cedulasPermitidas: string[];
  nombresColaboradoresPermitidos: string[];
  puedeAprobarHorasExtra: boolean;
  reglas: SupervisionAsistenciaItem[];
}

@Injectable({
  providedIn: 'root'
})
export class SupervisionAsistenciaService {
  private readonly baseUrl = `${environment.apiUrl}/api/presentismo/supervisores`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  listarSupervisores(): Observable<SupervisorAsignadoResumen[]> {
    return this.http.get<SupervisorAsignadoResumen[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  listarTodasReglas(): Observable<SupervisionAsistenciaItem[]> {
    return this.http.get<SupervisionAsistenciaItem[]>(`${this.baseUrl}/todas`, { headers: this.getHeaders() });
  }

  obtenerMisPermisos(cedula?: string, idUsuario?: number): Observable<PermisosVisibilidadAsistencia> {
    const params: string[] = [];
    if (cedula) params.push(`cedula=${encodeURIComponent(cedula)}`);
    if (idUsuario) params.push(`idUsuario=${encodeURIComponent(idUsuario)}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<PermisosVisibilidadAsistencia>(`${this.baseUrl}/mis-permisos${query}`, { headers: this.getHeaders() });
  }

  guardarSupervision(payload: GuardarSupervisionPayload): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload, { headers: this.getHeaders() });
  }

  toggleActivoRegla(id: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  toggleActivoSupervisor(idSupervisor: number, activo: boolean): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/supervisor/${idSupervisor}/toggle`, { activo }, { headers: this.getHeaders() });
  }

  eliminarRegla(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  eliminarPorSupervisor(idSupervisor: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/supervisor/${idSupervisor}`, { headers: this.getHeaders() });
  }
}
