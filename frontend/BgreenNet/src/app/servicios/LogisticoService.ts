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
  charge_type?: string | number;
  charge_type_name?: string;
  trailer_number?: string;
  quantity_received?: number;
  quantity_manifested?: number;
  interface_code?: string;
  category_name?: string;
  type?: number | string;
  starting_weight_value?: number;
  ending_weight_value?: number;
  net_weight_value?: number;
  starting_date?: string;
  starting_time?: string;
  end_date?: string;
  end_time?: string;
  driver_name?: string;
  citizen_card?: string | number;

  // Propiedades normalizadas y auxiliares para la UI
  placa?: string;
  remolque?: string | null;
  vehiculo?: string;
  conductor?: string;
  cedulaConductor?: string | number | null;
  driver?: string;
  origen?: string;
  destino?: string;
  estado?: string;
  fecha?: string;
  fechaFin?: string;
  guia?: string;
  producto?: string;
  tipoCarga?: string | null;
  categoria?: string | null;
  codigoInterfaz?: string | null;
  cantidadRecibida?: number | null;
  cantidadManifestada?: number | null;
  diferenciaCantidad?: number | null;
  pesoInicial?: number;
  pesoFinal?: number;
  pesoNeto?: number;
  horaInicio?: string;
  horaFin?: string;
  duracion?: string;
  [key: string]: any;
}

export interface ProductoConfigItem {
  id?: number;
  nombreProducto: string;
  permitido: boolean;
  fechaCreacion?: string;
  fechaModificacion?: string;
  usuario?: string;
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

  /**
   * Obtiene los nombres de los productos permitidos para mostrar en la vista principal.
   */
  getProductosPermitidos(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/productos-permitidos`);
  }

  /**
   * Obtiene la lista completa de configuraciones de productos (permitidos y ocultos).
   */
  getProductosConfig(): Observable<ProductoConfigItem[]> {
    return this.http.get<ProductoConfigItem[]>(`${this.baseUrl}/productos-config`);
  }

  /**
   * Marca o añade un producto como permitido rápidamente desde la interfaz.
   */
  permitirProducto(nombreProducto: string): Observable<ProductoConfigItem> {
    return this.http.post<ProductoConfigItem>(`${this.baseUrl}/productos-config/permitir`, {
      nombreProducto,
      usuario: 'MODULO_LOGISTICO'
    });
  }

  /**
   * Cambia el estado de visibilidad (permitido / oculto) de un producto por ID.
   */
  toggleProducto(id: number): Observable<ProductoConfigItem> {
    return this.http.put<ProductoConfigItem>(`${this.baseUrl}/productos-config/${id}/toggle`, {});
  }

  /**
   * Guarda o actualiza un registro de configuración de producto.
   */
  guardarProductoConfig(config: Partial<ProductoConfigItem>): Observable<ProductoConfigItem> {
    return this.http.post<ProductoConfigItem>(`${this.baseUrl}/productos-config`, config);
  }

  /**
   * Elimina un producto de la configuración.
   */
  eliminarProductoConfig(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/productos-config/${id}`);
  }
}

