import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScadaService {
  private scadaUrl = `${environment.apiUrl}/api/scada`;
  private plcUrl = `${environment.apiUrl}/api/plc`;

  constructor(private http: HttpClient) {}

  // Obtiene el último registro de Tabla_12
  getUltimoScada(): Observable<any> {
    return this.http.get<any>(`${this.scadaUrl}/ultimo`);
  }

  // Obtiene los registros de hoy de Tabla_12 (o de una fecha específica)
  getHoyScada(fecha?: string): Observable<any[]> {
    const url = fecha ? `${this.scadaUrl}/hoy?fecha=${fecha}` : `${this.scadaUrl}/hoy`;
    return this.http.get<any[]>(url);
  }

  // Lee los valores actuales de las variables desde el PLC
  getPlcVariables(): Observable<Map<string, number>> {
    return this.http.get<Map<string, number>>(`${this.plcUrl}/leer`);
  }

  // Obtiene la configuración de todas las variables
  getVariablesConfig(): Observable<any[]> {
    return this.http.get<any[]>(`${this.scadaUrl}/variables`);
  }

  // Obtiene todas las unidades de proceso
  getUnidades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.scadaUrl}/unidades`);
  }

  // Obtiene todas las unidades de medida físicas
  getUnidadesMedida(): Observable<any[]> {
    return this.http.get<any[]>(`${this.scadaUrl}/unidades-medida`);
  }

  // Actualiza una variable
  updateVariableConfig(config: any): Observable<any> {
    return this.http.put<any>(`${this.scadaUrl}/variables`, config);
  }

  // Sincroniza variables desde Tabla_14
  syncVariables(): Observable<any> {
    return this.http.post<any>(`${this.scadaUrl}/variables/sync`, {});
  }

  // Guarda/Actualiza unidad de proceso
  saveUnidad(unidad: any): Observable<any> {
    return this.http.post<any>(`${this.scadaUrl}/unidades`, unidad);
  }

  // Guarda/Actualiza unidad de medida física
  saveUnidadMedida(um: any): Observable<any> {
    return this.http.post<any>(`${this.scadaUrl}/unidades-medida`, um);
  }

  // Envía una alerta de correo para variables especiales
  sendAlertEmail(tag: string, valor: number, tipo: 'fuera' | 'dentro', chartImage?: string | null): Observable<any> {
    return this.http.post<any>(`${this.scadaUrl}/variables/alerta`, { tag, valor, tipo, chartImage });
  }

  // Obtiene los receptores de correos de alertas PLC
  getReceptoresPlc(): Observable<any> {
    return this.http.get<any>(`${this.scadaUrl}/receptores-plc`);
  }

  // Guarda los receptores de correos de alertas PLC
  saveReceptoresPlc(destinatarios: string): Observable<any> {
    return this.http.post<any>(`${this.scadaUrl}/receptores-plc`, { destinatarios });
  }
}
