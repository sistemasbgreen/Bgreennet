import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ModuloDTO } from '../models/modulos/ModuloDTO';
import { SubModuloDTO } from '../models/modulos/SubModuloDTO';


@Injectable({
  providedIn: 'root'
})
export class ModuleConfigService {

  private apiUrl = `${environment.apiUrl}/api/module-config`;
  private modulosSubject = new BehaviorSubject<ModuloDTO[]>([]);

  constructor(private http: HttpClient) { }

  // Obtener módulos como Observable
  getModulos(): Observable<ModuloDTO[]> {
    return this.http.get<ModuloDTO[]>(`${this.apiUrl}/config`);

  }

  // Cargar configuración desde el backend
  loadConfig(): void {
    this.http.get<ModuloDTO[]>(`${this.apiUrl}/config`).subscribe({
      next: (modulos) => {
        this.modulosSubject.next(modulos);
      },
      error: (error) => {
        console.error('Error al cargar configuración de módulos:', error);
      }
    });
  }

    getPermisosByPerfil(idPerfil: number): Observable<SubModuloDTO[]> {
    return this.http.get<SubModuloDTO[]>(`${this.apiUrl}/permisos/perfil/${idPerfil}`);
  }
  
  //  Asignar/Revocar permiso
  asignarPermiso(idPerfil: number, idSubModulo: number, activo: boolean): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/permiso`, {
      idPerfil,
      idSubModulo,
      activo
    });
  }
  
  

  // Revocar permiso a submódulo
  revocarPermiso(idPerfil: number, idSubModulo: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/permiso/${idPerfil}/${idSubModulo}`);
  }
}