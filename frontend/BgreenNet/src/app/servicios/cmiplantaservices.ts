import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { MetanolRequest } from "../models/Modelos_CMI/MetanolRequest";
import { MetanolResponse } from "../models/Modelos_CMI/ProductoResponse";
import { CostoDirectoResponse } from "../models/Modelos_CMI/CostoDirectoResponse";

@Injectable({
  providedIn: 'root'
})
export class cmiplantaservices {
  private baseUrl = `${environment.apiUrl}/api/cmiplanta/ConsumoProductos`;
  private baseUrl1 = `${environment.apiUrl}/api/cmiplanta/datos`;
  private urlindustrializacion = `${environment.apiUrl}/api/estrategicos/industrializacion`;

  constructor(private http: HttpClient) { }

  obtenerDatos(request: MetanolRequest): Observable<MetanolResponse> {
    return this.http.post<MetanolResponse>(this.baseUrl, request);
  }

  getCostoDirecto(fechaInicio: string, fechaFin: string): Observable<CostoDirectoResponse> {
    return this.http.post<CostoDirectoResponse>(this.baseUrl1, { fechaInicio, fechaFin });
  }

  getIndustrializacionAceite(fecha: number): Observable<any> {
    return this.http.post<any>(this.urlindustrializacion, { fecha: fecha.toString() });
  }

  getIndustrializacionDetalle(anio: number, mes: number): Observable<any> {
    return this.http.post<any>(this.urlindustrializacion, { anio, mes });
  }

  getIndustrializacionConfig(): Observable<any> {
    return this.http.get<any>(`${this.urlindustrializacion}/config`);
  }

  agregarProveedor(nit: string, nombre?: string): Observable<any> {
    return this.http.post<any>(`${this.urlindustrializacion}/config/proveedores`, { nit, nombre });
  }

  toggleProveedor(id: number, activo: boolean): Observable<any> {
    return this.http.put<any>(`${this.urlindustrializacion}/config/proveedores/${id}/toggle`, { activo });
  }

  eliminarProveedor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.urlindustrializacion}/config/proveedores/${id}`);
  }

  actualizarMeta(metaAnual: number): Observable<any> {
    return this.http.put<any>(`${this.urlindustrializacion}/config/meta`, { metaAnual });
  }

  buscarProveedorSiesa(nit: string): Observable<any> {
    return this.http.get<any>(`${this.urlindustrializacion}/siesa/proveedor/${nit}`);
  }
}