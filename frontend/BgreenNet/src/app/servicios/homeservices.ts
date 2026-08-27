// src/app/services/listas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SistemaInformacion } from '../models/sistemasinformacion';
import { Usuario } from '../models/usuario';
import { CrearSistema } from '../models/CrearSistema';
import { Tarea } from '../models/Tareas/Tarea';
import { CreateTareaRequest } from '../models/Tareas/CreateTareaRequest';
import { UpdateTareaRequest } from '../models/Tareas/UpdateTareaRequest';

@Injectable({
  providedIn: 'root'
})
export class homeservices {

  private baseUrl = `${environment.apiUrl}/api/sistemasinformacion`;
  private urlrecursos = `${environment.apiUrl}/api/home/contacto`;
  private urltareas = `${environment.apiUrl}/api/tareas`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token && token !== 'null' && token !== 'undefined') {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Sistemas de informacion
  getAll(): Observable<SistemaInformacion[]> {
    return this.http.get<SistemaInformacion[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  obtenerpermisos(id: number): Observable<SistemaInformacion> {
    return this.http.get<SistemaInformacion>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  getActivos(): Observable<SistemaInformacion[]> {
    return this.http.get<SistemaInformacion[]>(`${this.baseUrl}/activos`);
  }

  Crearsistemainformacion(sistema: CrearSistema): Observable<CrearSistema> {
    return this.http.post<CrearSistema>(this.baseUrl, sistema, { headers: this.getHeaders() });
  }

  update(id: number, sistema: CrearSistema): Observable<CrearSistema> {
    return this.http.put<CrearSistema>(`${this.baseUrl}/${id}`, sistema, { headers: this.getHeaders() });
  }

  // Home
  contactos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.urlrecursos, { headers: this.getHeaders() });
  }

  // Tareas

  // Obtener tareas por usuario
  getTareasPorUsuario(idUsuario: number): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.urltareas}/usuario/${idUsuario}`, { headers: this.getHeaders() });
  }

  // Obtener tarea por ID
  getTareaPorId(idTarea: number): Observable<Tarea> {
    return this.http.get<Tarea>(`${this.urltareas}/${idTarea}`, { headers: this.getHeaders() });
  }

  // Crear tarea
  crearTarea(request: CreateTareaRequest): Observable<Tarea> {
    return this.http.post<Tarea>(`${this.urltareas}/crear`, request, { headers: this.getHeaders() });
  }

  // Actualizar tarea
  actualizarTarea(idTarea: number, request: UpdateTareaRequest): Observable<Tarea> {
    return this.http.put<Tarea>(`${this.urltareas}/${idTarea}`, request, { headers: this.getHeaders() });
  }

  getNotificacionesPendientes(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.urltareas}/notificaciones/${idUsuario}`, { headers: this.getHeaders() });
  }

  getSeguimientos(idTarea: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.urltareas}/${idTarea}/seguimiento`, { headers: this.getHeaders() });
  }

  enviarSeguimiento(idTarea: number, idUsuario: number, mensaje: string): Observable<any> {
    // Enviamos un objeto para asegurar que el Body sea JSON válido y procesable por Jackson
    return this.http.post<any>(`${this.urltareas}/${idTarea}/seguimiento/${idUsuario}`, { mensaje }, { headers: this.getHeaders() });
  }

  // Generic methods
  get(endpoint: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/${endpoint}`, { headers: this.getHeaders() });
  }

  put(endpoint: string, body: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/${endpoint}`, body, { headers: this.getHeaders() });
  }

}