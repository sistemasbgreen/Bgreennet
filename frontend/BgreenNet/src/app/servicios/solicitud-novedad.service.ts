import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SolicitudNovedad, TipoNovedad } from '../models/presentismo';

@Injectable({
  providedIn: 'root'
})
export class SolicitudNovedadService {
  private readonly STORAGE_KEY = 'bgreen_solicitudes_novedades';
  private readonly apiUrl = `${environment.apiUrl}/api/presentismo/novedades`;

  private solicitudesSubject = new BehaviorSubject<SolicitudNovedad[]>([]);
  public solicitudes$: Observable<SolicitudNovedad[]> = this.solicitudesSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.cargarDesdeStorage();
    this.sincronizarConBackend();
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token && token !== 'null' && token !== 'undefined') {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  private cargarDesdeStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (data) {
          const parsed: SolicitudNovedad[] = JSON.parse(data);
          this.solicitudesSubject.next(parsed);
          return;
        }
      } catch (e) {
        console.error('Error al cargar solicitudes de novedades desde storage:', e);
      }
    }
    this.solicitudesSubject.next([]);
  }

  private guardarEnStorage(lista: SolicitudNovedad[]): void {
    this.solicitudesSubject.next(lista);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
      } catch (e) {
        console.error('Error al guardar solicitudes de novedades:', e);
      }
    }
  }

  /**
   * Sincroniza las solicitudes de novedades existentes con la base de datos SQL Server
   */
  sincronizarConBackend(cedula?: string): void {
    const params: string[] = [];
    if (cedula) params.push(`cedula=${encodeURIComponent(cedula)}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';

    this.http.get<any[]>(`${this.apiUrl}${query}`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          const normalizadas: SolicitudNovedad[] = data.map(item => ({
            id: item.id || item.ID,
            cedulaColaborador: item.cedula_colaborador || item.cedulaColaborador || '',
            nombreColaborador: item.nombre_colaborador || item.nombreColaborador || 'Colaborador',
            tipoNovedad: (item.tipo_novedad || item.tipoNovedad || 'DESCANSO') as TipoNovedad,
            fechaInicio: item.fecha_inicio || item.fechaInicio,
            fechaFin: item.fecha_fin || item.fechaFin || item.fecha_inicio || item.fechaInicio,
            dias: Number(item.dias || 1),
            motivo: item.motivo || '',
            soporteUrl: item.soporte_url || item.soporteUrl || null,
            soporteNombre: item.soporte_nombre || item.soporteNombre || null,
            soporteTipo: item.soporte_tipo || item.soporteTipo || null,
            estado: item.estado || 'PENDIENTE',
            fechaSolicitud: item.fecha_solicitud || item.fechaSolicitud || new Date().toISOString(),
            aprobadoPor: item.aprobado_por || item.aprobadoPor || null,
            aprobadorAsignado: item.aprobador_asignado || item.aprobadorAsignado || null,
            correoAprobador: item.correo_aprobador || item.correoAprobador || null,
            fechaRespuesta: item.fecha_respuesta || item.fechaRespuesta || null,
            motivoRespuesta: item.motivo_respuesta || item.motivoRespuesta || null
          }));

          // Mezclar con local
          const map = new Map<string, SolicitudNovedad>();
          normalizadas.forEach(s => map.set(s.id, s));
          this.solicitudesSubject.getValue().forEach(s => {
            if (!map.has(s.id)) map.set(s.id, s);
          });

          const listaFinal = Array.from(map.values()).sort(
            (a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
          );
          this.guardarEnStorage(listaFinal);
        }
      },
      error: (err) => {
        console.warn('⚠️ Sincronización de novedades diferida, usando caché local:', err?.message || err);
      }
    });
  }

  obtenerTodas(): SolicitudNovedad[] {
    return this.solicitudesSubject.getValue();
  }

  obtenerPorDia(fechaKey: string, cedula?: string): SolicitudNovedad[] {
    const lista = this.solicitudesSubject.getValue();
    return lista.filter(s => {
      const matchFecha = fechaKey >= s.fechaInicio && fechaKey <= s.fechaFin;
      if (!matchFecha) return false;
      if (cedula && s.cedulaColaborador) {
        return s.cedulaColaborador.trim() === cedula.trim();
      }
      return true;
    });
  }

  obtenerPorDiaCualquierColaborador(fechaKey: string): SolicitudNovedad[] {
    const lista = this.solicitudesSubject.getValue();
    return lista.filter(s => fechaKey >= s.fechaInicio && fechaKey <= s.fechaFin);
  }

  crearSolicitud(params: {
    cedulaColaborador: string;
    nombreColaborador: string;
    tipoNovedad: TipoNovedad;
    fechaInicio: string;
    fechaFin: string;
    dias?: number;
    motivo: string;
    soporteUrl?: string | null;
    soporteNombre?: string | null;
    soporteTipo?: string | null;
    aprobadorAsignado?: string;
    correoAprobador?: string;
  }): SolicitudNovedad {
    const lista = [...this.solicitudesSubject.getValue()];
    const diasCalc = params.dias || this.calcularDias(params.fechaInicio, params.fechaFin);
    const nueva: SolicitudNovedad = {
      id: 'nov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      cedulaColaborador: (params.cedulaColaborador || '').trim(),
      nombreColaborador: (params.nombreColaborador || 'Colaborador').trim(),
      tipoNovedad: params.tipoNovedad,
      fechaInicio: params.fechaInicio,
      fechaFin: params.fechaFin || params.fechaInicio,
      dias: diasCalc,
      motivo: (params.motivo || '').trim(),
      soporteUrl: params.soporteUrl || null,
      soporteNombre: params.soporteNombre || null,
      soporteTipo: params.soporteTipo || null,
      estado: 'PENDIENTE',
      fechaSolicitud: new Date().toISOString(),
      aprobadorAsignado: params.aprobadorAsignado || null,
      correoAprobador: params.correoAprobador || null
    };

    lista.unshift(nueva);
    this.guardarEnStorage(lista);

    // Persistir en backend
    this.http.post(this.apiUrl, nueva, { headers: this.getHeaders() }).subscribe({
      next: () => {
        console.log('✅ Solicitud de novedad persistida en BD y correo disparado.');
      },
      error: (err) => {
        console.warn('⚠️ No se pudo persistir novedad en backend de inmediato:', err?.message || err);
      }
    });

    return nueva;
  }

  aprobarSolicitud(id: string, nombreAprobador: string): SolicitudNovedad | null {
    const lista = [...this.solicitudesSubject.getValue()];
    const index = lista.findIndex(s => s.id === id);
    if (index === -1) return null;

    lista[index] = {
      ...lista[index],
      estado: 'APROBADO',
      aprobadoPor: nombreAprobador || 'Líder / Supervisor',
      fechaRespuesta: new Date().toISOString()
    };

    this.guardarEnStorage(lista);

    this.http.put(`${this.apiUrl}/${id}/aprobar`, { aprobadoPor: nombreAprobador }, { headers: this.getHeaders() }).subscribe({
      next: () => console.log('✅ Aprobación de novedad guardada en BD'),
      error: (err) => console.warn('⚠️ Error al actualizar estado de novedad en BD:', err?.message || err)
    });

    return lista[index];
  }

  rechazarSolicitud(id: string, nombreAprobador: string, motivo?: string): SolicitudNovedad | null {
    const lista = [...this.solicitudesSubject.getValue()];
    const index = lista.findIndex(s => s.id === id);
    if (index === -1) return null;

    lista[index] = {
      ...lista[index],
      estado: 'RECHAZADO',
      aprobadoPor: nombreAprobador || 'Líder / Supervisor',
      fechaRespuesta: new Date().toISOString(),
      motivoRespuesta: motivo || 'No autorizado'
    };

    this.guardarEnStorage(lista);

    this.http.put(`${this.apiUrl}/${id}/rechazar`, { aprobadoPor: nombreAprobador, motivo }, { headers: this.getHeaders() }).subscribe({
      next: () => console.log('✅ Rechazo de novedad guardado en BD'),
      error: (err) => console.warn('⚠️ Error al actualizar estado de novedad en BD:', err?.message || err)
    });

    return lista[index];
  }

  eliminarSolicitud(id: string): boolean {
    const lista = this.solicitudesSubject.getValue().filter(s => s.id !== id);
    this.guardarEnStorage(lista);

    this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => console.log('✅ Solicitud de novedad eliminada de BD'),
      error: (err) => console.warn('⚠️ Error al eliminar novedad en BD:', err?.message || err)
    });

    return true;
  }

  private calcularDias(fInicio: string, fFin: string): number {
    if (!fInicio || !fFin) return 1;
    try {
      const d1 = new Date(fInicio + 'T00:00:00');
      const d2 = new Date(fFin + 'T00:00:00');
      const diffMs = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  }
}
