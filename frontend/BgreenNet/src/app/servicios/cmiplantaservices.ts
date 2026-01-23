import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { MetanolRequest } from "../models/Modelos_CMI/MetanolRequest ";
import { MetanolResponse } from "../models/Modelos_CMI/ProductoResponse";




@Injectable({
  providedIn: 'root'
})


export class cmiplantaservices {
  private baseUrl = `${environment.apiUrl}/api/cmiplanta/ComsumoProductos`;

  constructor(private http: HttpClient) { }
  obtenerDatos(request: MetanolRequest): Observable<MetanolResponse> {
    return this.http.post<MetanolResponse>(this.baseUrl, request);
  }

}