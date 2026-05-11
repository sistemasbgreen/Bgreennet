import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Usuario } from "../models/usuario";
import { Observable } from "rxjs";
import { CrearUsuario } from "../models/CrearUsuario";




@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private baseUrl = `${environment.apiUrl}/api/usuarios`;



  constructor(private http: HttpClient) { }

  // Obtener todos los usuarios
  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl + '/listar');
  }

  // Crear un nuevo usuario
  createUsuario(usuario: CrearUsuario): Observable<CrearUsuario> {
    return this.http.post<CrearUsuario>(this.baseUrl + '/crear', usuario);
  }

  // Obtener usuario por ID
  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`);
  }

  // Actualizar usuario
  actualizarUsuario(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl + '/actualizar'}/${id}`, usuario);
  }

  // Eliminar usuario
  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl + '/eliminar'}/${id}`);
  }

  // Cambiar clave (usuario cambia la suya: verifica clave actual)
  cambiarClave(dto: { idUsuario: number; claveActual: string; nuevaClave: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cambiar-clave`, dto);
  }

  // Cambiar clave (admin: no requiere clave actual)
  cambiarClaveAdmin(dto: { idUsuario: number; claveActual: string; nuevaClave: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cambiar-clave-admin`, dto);
  }

  // Bloquear o desbloquear usuario
  toggleBloqueo(idUsuario: number, bloqueado: boolean): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${idUsuario}/bloqueo`, { bloqueado });
  }
}