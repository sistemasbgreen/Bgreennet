import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Perfil } from '../models/perfil';
import { Empresa } from '../models/empresa';
import { TiposIdentificacion } from '../models/tiposIdentificacion';
import { Cargo } from '../models/cargo';
import { Area } from '../models/area';



@Injectable({
  providedIn: 'root'
})
export class ListasService {

  private baseUrl = `${environment.apiUrl}/api/listas`;

  constructor(private http: HttpClient) {}

  obtenerPerfiles(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(`${this.baseUrl}/perfiles`);
  }

  obtenerEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.baseUrl}/empresas`);
  }

  obtenerAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.baseUrl}/areas`);
  }

  obtenerCargos(): Observable<Cargo[]> {
    return this.http.get<Cargo[]>(`${this.baseUrl}/cargos`);
  }

    obtenerIdentificacion(): Observable<TiposIdentificacion[]> {
    return this.http.get<TiposIdentificacion[]>(`${this.baseUrl}/identificacion`);
  }
}