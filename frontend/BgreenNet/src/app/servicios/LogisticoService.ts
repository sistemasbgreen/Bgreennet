import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TransporteItem {
  id?: string | number;
  transport_id?: string | number;
  company_id?: string | number;
  company_name?: string;
  supplier_name?: string;
  products?: string;
  input_output?: string;
  vehicle_plate?: string;
  starting_weight_value?: number;
  ending_weight_value?: number;
  net_weight_value?: number;
  starting_date?: string;
  starting_time?: string;
  placa?: string;
  vehiculo?: string;
  conductor?: string;
  driver?: string;
  driver_name?: string;
  origen?: string;
  destino?: string;
  estado?: string;
  fecha?: string;
  guia?: string;
  producto?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class LogisticoService {
  private baseUrl = `${environment.apiUrl}/api/logistico`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los servicios de transporte a través del proxy backend de la aplicación.
   */
  getTransportes(companyId: string, start: string, end: string): Observable<any> {
    const params = new HttpParams()
      .set('company_id', companyId)
      .set('start', start)
      .set('end', end);

    const bodyPayload = {
      company_id: companyId,
      start: start,
      end: end
    };

    // Intentar primero POST enviando tanto query parameters como JSON body
    return this.http.post<any>(`${this.baseUrl}/transports?company_id=${companyId}&start=${start}&end=${end}`, bodyPayload).pipe(
      catchError(err => {
        console.warn('Proxy POST falló, intentando GET proxy...', err);
        return this.http.get<any>(`${this.baseUrl}/transports`, { params }).pipe(
          catchError(err2 => {
            console.error('Error al comunicarse con el backend proxy:', err2);
            return throwError(() => err2);
          })
        );
      })
    );
  }
}
