// services/op-docto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable } from 'rxjs';
import { OpDocto } from '../models/OordenesProduccion/OpDocto';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class OpDoctoService {
  
    private baseUrl = `${environment.apiUrl}/api/op-docto`;

  constructor(private http: HttpClient) {}


  getDocumentos(limit: number = 30): Observable<OpDocto[]> {
    return this.http.get<OpDocto[]>(`${this.baseUrl}?limit=${limit}`);
  }

  getDocumentosPorFecha(fechaInicio: string, fechaFin: string): Observable<OpDocto[]> {
    return this.http.get<OpDocto[]>(`${this.baseUrl}/por-fechas`, {
      params: { fechaInicio, fechaFin }
    });
  }

  getReceptores(): Observable<string> {
    return this.http.get(`${this.baseUrl}/receptores`, { responseType: 'text' });
  }

  updateReceptores(receptores: string): Observable<string> {
    return this.http.put(`${this.baseUrl}/receptores`, receptores, {
      responseType: 'text',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  enviarReporte(fecha: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/enviar-reporte`, { fecha }, { responseType: 'text' });
  }
}