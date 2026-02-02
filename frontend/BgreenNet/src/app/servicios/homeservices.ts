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

  headers = new HttpHeaders({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });


  constructor(private http: HttpClient) { }


  //Sistemas de informacion
  getAll(): Observable<SistemaInformacion[]> {
    return this.http.get<SistemaInformacion[]>(this.baseUrl, { headers: this.headers });
  }

  obtenerpermisos(id: number): Observable<SistemaInformacion> {
    return this.http.get<SistemaInformacion>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

  getActivos(): Observable<SistemaInformacion[]> {
    return this.http.get<SistemaInformacion[]>(`${this.baseUrl}/activos`);
  }


  Crearsistemainformacion(sistema: CrearSistema): Observable<CrearSistema> {
    return this.http.post<CrearSistema>(this.baseUrl, sistema, { headers: this.headers });
  }


  update(id: number, sistema: CrearSistema): Observable<CrearSistema> {
    return this.http.put<CrearSistema>(`${this.baseUrl}/${id}`, sistema);
  }

  //Home
  contactos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.urlrecursos, { headers: this.headers });
  }


  //Tareas

   // Obtener tareas por usuario
  getTareasPorUsuario(idUsuario: number): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.urltareas}/usuario/${idUsuario}`);
  }

  // Obtener tarea por ID
  getTareaPorId(idTarea: number): Observable<Tarea> {
    return this.http.get<Tarea>(`${this.urltareas}/${idTarea}`);
  }

  // Crear tarea
crearTarea(request: CreateTareaRequest): Observable<Tarea> {
  return this.http.post<Tarea>(`${this.urltareas}/crear`, request);
}


  // Actualizar tarea
  actualizarTarea(idTarea: number, request: UpdateTareaRequest): Observable<Tarea> {
    return this.http.put<Tarea>(`${this.urltareas}/${idTarea}`, request);
  }


}