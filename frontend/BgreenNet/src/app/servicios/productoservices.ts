import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { producto } from '../models/productos';


export interface MetaDetalle {
  valor: number;
  dateCreate?: string;
  dateModify?: string;
  userName?: string;
}

export interface MetaResponse {
  mensuales: MetaDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class productoservices {


    private baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getProductos(): Observable<producto[]> {
    return this.http.get<producto[]>(`${this.baseUrl}/productos`);
  }

  getMetas(producto: string, anio: string): Observable<MetaResponse> {
    return this.http.get<MetaResponse>(
      `${this.baseUrl}/obtener_metas?producto=${producto}&anio=${anio}`
    );
  }

  getCostoDirecto(anio: string): Observable<MetaResponse> {
    return this.http.get<MetaResponse>(
      `${this.baseUrl}/metas/consultar_costo-directo?anio=${anio}`
    );
  }

  guardarMeta(data: any) {
    return this.http.post(`${this.baseUrl}/agregar_metas`, data);
  }

  guardarCostoDirecto(data: any) {
    return this.http.post(`${this.baseUrl}/metas/agregar_costo-directo`, data);
  }

  insertarProducto(p: producto) {
    return this.http.post(`${this.baseUrl}/productos/insertar`, p);
  }

  actualizarProducto(p: producto) {
    return this.http.post(`${this.baseUrl}/productos/actualizar`, p);
  }

  insertarTipoDocumento(productoId: string, tipoMovimiento: string, tipoDocumento: string) {
    return this.http.post(`${this.baseUrl}/productos/tipo-documento`, { 
      productoId, 
      tipoMovimiento, 
      tipoDocumento 
    });
  }

  eliminarTipoDocumento(productoId: string) {
    return this.http.delete(`${this.baseUrl}/productos/tipo-documento`, {
      params: { productoId }
    });
  }

  // Catalogos
  getTiposDocumento() {
    return this.http.get<any[]>(`${this.baseUrl}/catalogos/tipos-documento`);
  }

  getTiposMovimiento() {
    return this.http.get<any[]>(`${this.baseUrl}/catalogos/tipos-movimiento`);
  }

  validarProductoEnSiesa(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/siesa/validar?id=${id}`);
  }
}