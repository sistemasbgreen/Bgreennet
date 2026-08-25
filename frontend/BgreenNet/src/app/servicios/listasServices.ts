import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError } from 'rxjs';
import { Perfil } from '../models/perfil';
import { Empresa } from '../models/empresa';
import { TiposIdentificacion } from '../models/tiposIdentificacion';
import { Cargo } from '../models/cargo';
import { Area } from '../models/area';
import { ImagenLogin } from '../models/imagen-login';



@Injectable({
  providedIn: 'root'
})
export class ListasService {

  private baseUrl = `${environment.apiUrl}/api/listas`;
   private apiUrl = 'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC';


  constructor(private http: HttpClient) {}

  obtenerPerfiles(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(`${this.baseUrl}/perfiles`);
  }

  obtenerEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.baseUrl}/empresas`);
  }

  crearEmpresa(empresa: any): Observable<any> {
    const url = `${this.baseUrl}/empresas`;
    console.log('%c[ListasService] POST crearEmpresa', 'color: #2196F3; font-weight: bold');
    console.log('  URL:', url);
    console.log('  Payload:', empresa);
    return this.http.post<any>(url, empresa).pipe(
      catchError(() => this.http.post<any>(`${this.baseUrl}/empresas/crear`, empresa))
    );
  }

  actualizarEmpresa(id: number, empresa: any): Observable<any> {
    const payload = { idEmpresa: id, ...empresa };
    const url = `${this.baseUrl}/empresas/actualizar/${id}`;
    console.log('%c[ListasService] PUT actualizarEmpresa', 'color: #FF9800; font-weight: bold');
    console.log('  URL:', url);
    console.log('  Payload:', payload);
    return this.http.put<any>(url, payload);
  }

  obtenerAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.baseUrl}/areas`);
  }

  crearArea(area: any): Observable<any> {
    const url = `${this.baseUrl}/areas`;
    console.log('%c[ListasService] POST crearArea', 'color: #2196F3; font-weight: bold');
    console.log('  URL:', url);
    console.log('  Payload:', area);
    return this.http.post<any>(url, area).pipe(
      catchError(() => this.http.post<any>(`${this.baseUrl}/areas/crear`, area))
    );
  }

  actualizarArea(id: number, area: any): Observable<any> {
    const payload = { idArea: id, ...area };
    const url = `${this.baseUrl}/areas/actualizar/${id}`;
    console.log('%c[ListasService] PUT actualizarArea', 'color: #FF9800; font-weight: bold');
    console.log('  URL:', url);
    console.log('  Payload:', payload);
    return this.http.put<any>(url, payload);
  }

  obtenerCargos(): Observable<Cargo[]> {
    return this.http.get<Cargo[]>(`${this.baseUrl}/cargos`);
  }

  crearCargo(cargo: any): Observable<any> {
    const url = `${this.baseUrl}/cargos`;
    console.log('%c[ListasService] POST crearCargo', 'color: #2196F3; font-weight: bold');
    console.log('  URL:', url);
    console.log('  Payload:', cargo);
    return this.http.post<any>(url, cargo).pipe(
      catchError(() => this.http.post<any>(`${this.baseUrl}/cargos/crear`, cargo))
    );
  }

  actualizarCargo(id: number, cargo: any): Observable<any> {
    const payload = { idCargo: id, ...cargo };
    const url = `${this.baseUrl}/cargos/actualizar/${id}`;
    console.log('%c[ListasService] PUT actualizarCargo', 'color: #FF9800; font-weight: bold');
    console.log('  URL:', url);
    console.log('  Payload:', payload);
    return this.http.put<any>(url, payload);
  }

    obtenerIdentificacion(): Observable<TiposIdentificacion[]> {
    return this.http.get<TiposIdentificacion[]>(`${this.baseUrl}/identificacion`);
  }


  getTrmData(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // CRUD Imágenes Login
  getImagenesLogin(): Observable<ImagenLogin[]> {
    return this.http.get<ImagenLogin[]>(`${this.baseUrl}/login-images?t=${new Date().getTime()}`);
  }

  getAllImagenesLogin(): Observable<ImagenLogin[]> {
    return this.http.get<ImagenLogin[]>(`${this.baseUrl}/login-images/todas`);
  }

  saveImagenLogin(imagen: ImagenLogin): Observable<ImagenLogin> {
    return this.http.post<ImagenLogin>(`${this.baseUrl}/login-images`, imagen);
  }

  deleteImagenLogin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/login-images/${id}`);
  }


}