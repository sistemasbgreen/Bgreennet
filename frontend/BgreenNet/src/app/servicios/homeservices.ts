// src/app/services/listas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SistemaInformacion } from '../models/sistemasinformacion';




@Injectable({
  providedIn: 'root'
})
export class homeservices {

  private baseUrl = `${environment.apiUrl}/api/sistemasinformacion`;

  headers = new HttpHeaders({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });


  constructor(private http: HttpClient) { }

  getAll(): Observable<SistemaInformacion[]> {
    return this.http.get<SistemaInformacion[]>(this.baseUrl, { headers: this.headers });
  }

  getActivos(): Observable<SistemaInformacion[]> {
    return this.http.get<SistemaInformacion[]>(`${this.baseUrl}/activos`);
  }

  getById(id: number): Observable<SistemaInformacion> {
    return this.http.get<SistemaInformacion>(`${this.baseUrl}/${id}`);
  }

  create(sistema: SistemaInformacion): Observable<SistemaInformacion> {
    return this.http.post<SistemaInformacion>(this.baseUrl, sistema);
  }

  update(id: number, sistema: SistemaInformacion): Observable<SistemaInformacion> {
    return this.http.put<SistemaInformacion>(`${this.baseUrl}/${id}`, sistema);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }



}