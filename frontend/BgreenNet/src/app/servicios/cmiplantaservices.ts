import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { MetanolRequest } from "../models/Modelos_CMI/MetanolRequest ";
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

  // getIndustrializacionAceite(fechaInicio: string, fechaFin: string): Observable<any> {
  //  return this.http.post<any>(this.urlindustrializacion, { fechaInicio, fechaFin });
 // }



}