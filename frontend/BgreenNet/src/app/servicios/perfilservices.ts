import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Perfil } from '../models/perfil';
import { Observable } from 'rxjs';
import { PermisosXperfil } from '../models/permisosXperfil';
import { AsignarPermiso } from '../models/asignarpermisos';


@Injectable({
  providedIn: 'root'
})
export class Perfilservices {
  private baseUrl = `${environment.apiUrl}/api/perfil`;


  constructor(private http: HttpClient) { }

  Obtenerperfil(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(this.baseUrl);
  }

  crearPerfil(perfil: Perfil): Observable<Perfil> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post<Perfil>(this.baseUrl, perfil, { headers });
  }

  actualizarPerfil(id: number, usuario: Perfil): Observable<Perfil> {
    return this.http.put<Perfil>(`${this.baseUrl + '/actualizar'}/${id}`, usuario);
  }

  obtenerpermisos(id: number): Observable<PermisosXperfil> {
    return this.http.get<PermisosXperfil>(`${this.baseUrl}/${id}`);
  }

eliminarPermiso(dto: AsignarPermiso): Observable<boolean> {
  return this.http.delete<boolean>(`${this.baseUrl}/eliminar`, {
    body: dto
  });
}

asignarPermiso(dto: AsignarPermiso): Observable<boolean> {
  return this.http.post<boolean>(`${this.baseUrl}/asignar`, dto);
}


}
