// src/app/services/listas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SistemaInformacion } from '../models/sistemasinformacion';
import { Usuario } from '../models/usuario';
import { CrearSistema } from '../models/CrearSistema';




@Injectable({
  providedIn: 'root'
})
export class homeservices {

  private baseUrl = `${environment.apiUrl}/api/sistemasinformacion`;
  private urlrecursos = `${environment.apiUrl}/api/home/contacto`;

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


}