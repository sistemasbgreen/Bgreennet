import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ItemExistencia, BodegaInfo, ItemResumen } from '../models/items/item-existencia.model';

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  private baseUrl = `${environment.apiUrl}/api/items`;

  constructor(private http: HttpClient) {}

  /**
   * Consulta las existencias de ítems en bodega.
   * Si no se especifica bodega o es 'TODAS', consulta todas las bodegas.
   */
  getExistencias(bodega?: string, busqueda?: string): Observable<ItemExistencia[]> {
    let params = new HttpParams();
    if (bodega && bodega.trim() && bodega !== 'TODAS') {
      params = params.set('bodega', bodega.trim());
    }
    if (busqueda && busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    return this.http.get<ItemExistencia[]>(`${this.baseUrl}/existencias`, { params });
  }

  /**
   * Obtiene la lista de bodegas disponibles en Siesa
   */
  getBodegas(): Observable<BodegaInfo[]> {
    return this.http.get<BodegaInfo[]>(`${this.baseUrl}/bodegas`);
  }

  /**
   * Obtiene el resumen de métricas del inventario
   */
  getResumen(bodega?: string): Observable<ItemResumen> {
    let params = new HttpParams();
    if (bodega && bodega.trim() && bodega !== 'TODAS') {
      params = params.set('bodega', bodega.trim());
    }
    return this.http.get<ItemResumen>(`${this.baseUrl}/resumen`, { params });
  }
}
