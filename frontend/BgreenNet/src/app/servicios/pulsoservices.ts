// src/app/services/pulso.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Pulso } from '../models/Pulsos/pulso';
import { PulsoCreateDTO } from '../models/Pulsos/PulsoCreateDTO';
import { PulsoUpdateDTO } from '../models/Pulsos/PulsoUpdateDTO';

@Injectable({
  providedIn: 'root'
})
export class PulsoService {
  private apiUrl = `${environment.apiUrl}/api/pulsos`;

  constructor(private http: HttpClient) {}

  //  Obtener todos los pulsos
  getAllPulsos(): Observable<Pulso[]> {
    return this.http.get<Pulso[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  //  Obtener solo pulsos activos y vigentes
  getActivePulsos(): Observable<Pulso[]> {
    return this.http.get<Pulso[]>(`${this.apiUrl}/activos`).pipe(
      catchError(this.handleError)
    );
  }

  

  //  El backend devuelve un objeto { id: number, mensaje: string }
  createPulso(pulso: PulsoCreateDTO): Observable<{ id: number; mensaje: string }> {
    return this.http.post<{ id: number; mensaje: string }>(this.apiUrl, pulso).pipe(
      catchError(this.handleError)
    );
  }

  //  El backend devuelve un objeto { mensaje: string }
  updatePulso(id: number, pulso: PulsoUpdateDTO): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/${id}`, pulso).pipe(
      catchError(this.handleError)
    );
  }

  //  El backend devuelve un objeto { mensaje: string }
  updateEstado(id: number, activo: boolean): Observable<{ mensaje: string }> {
    const params = { activo: activo.toString() };
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/${id}/estado`, null, { params }).pipe(
      catchError(this.handleError)
    );
  }

  //  El backend devuelve un objeto { mensaje: string }
  deletePulso(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // ⚠️ IMPORTANTE: Este endpoint NO existe en tu backend actual
  // Debes implementarlo o usar un servicio externo (Cloudinary, AWS S3, etc.)
  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(`${environment.apiUrl}/api/upload`, formData).pipe(
      map(response => response.url), // Extraer solo la URL
      catchError(this.handleError)
    );
  }

  //  Formatear fecha para mostrar
  formatFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  //  Calcular días restantes
calcularDiasRestantes(fechaFinal: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaFin = new Date(fechaFinal);
  fechaFin.setHours(0, 0, 0, 0);

  const diffTime = fechaFin.getTime() - hoy.getTime();

  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}


  //  Manejo de errores mejorado
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      //  Intentar extraer el mensaje del backend
      if (error.error?.mensaje) {
        errorMessage = error.error.mensaje;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Solicitud incorrecta. Verifica los datos.';
            break;
          case 401:
            errorMessage = 'No autorizado. Inicia sesión nuevamente.';
            break;
          case 403:
            errorMessage = 'Acceso denegado.';
            break;
          case 404:
            errorMessage = 'Recurso no encontrado.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor.';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.message}`;
        }
      }
    }
    
    console.error('Error del servicio:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}