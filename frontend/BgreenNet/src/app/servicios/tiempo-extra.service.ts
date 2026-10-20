import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SolicitudTiempoExtra } from '../models/presentismo';

@Injectable({
  providedIn: 'root'
})
export class TiempoExtraService {
  private readonly STORAGE_KEY = 'bgreen_solicitudes_tiempo_extra';
  private readonly apiUrl = `${environment.apiUrl}/api/presentismo/tiempo-extra`;

  private solicitudesSubject = new BehaviorSubject<SolicitudTiempoExtra[]>([]);
  public solicitudes$: Observable<SolicitudTiempoExtra[]> = this.solicitudesSubject.asObservable();

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
          const parsed: SolicitudTiempoExtra[] = JSON.parse(data);
          this.solicitudesSubject.next(parsed);
          return;
        }
      } catch (e) {
        console.error('Error al cargar solicitudes de tiempo extra desde storage:', e);
      }
    }
    this.solicitudesSubject.next([]);
  }

  private guardarEnStorage(lista: SolicitudTiempoExtra[]): void {
    this.solicitudesSubject.next(lista);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
      } catch (e) {
        console.error('Error al guardar solicitudes de tiempo extra:', e);
      }
    }
  }

  /**
   * Sincroniza las solicitudes existentes con la base de datos SQL Server
   */
  sincronizarConBackend(fechaKey?: string, cedula?: string): void {
    const params: string[] = [];
    if (fechaKey) params.push(`fechaKey=${encodeURIComponent(fechaKey)}`);
    if (cedula) params.push(`cedula=${encodeURIComponent(cedula)}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';

    this.http.get<any[]>(`${this.apiUrl}${query}`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          const normalizadas: SolicitudTiempoExtra[] = data.map(item => ({
            id: item.id || item.ID,
            fechaKey: item.fecha_key || item.fechaKey,
            cedulaColaborador: item.cedula_colaborador || item.cedulaColaborador || '',
            nombreColaborador: item.nombre_colaborador || item.nombreColaborador || 'Colaborador',
            horas: Number(item.horas || 0),
            horasTexto: item.horas_texto || item.horasTexto || `${item.horas} horas`,
            descripcion: item.descripcion || '',
            estado: item.estado || 'PENDIENTE',
            fechaSolicitud: item.fecha_solicitud || item.fechaSolicitud || new Date().toISOString(),
            aprobadoPor: item.aprobado_por || item.aprobadoPor || null,
            aprobadorAsignado: item.aprobador_asignado || item.aprobadorAsignado || null,
            correoAprobador: item.correo_aprobador || item.correoAprobador || null,
            fechaRespuesta: item.fecha_respuesta || item.fechaRespuesta || null,
            motivoRespuesta: item.motivo_respuesta || item.motivoRespuesta || null
          }));

          // Mezclar inteligentemente con local preservando novedades
          const map = new Map<string, SolicitudTiempoExtra>();
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
        // Modo offline / fallback transparente con storage
        console.warn('⚠️ Sincronización con backend diferida, usando caché local:', err?.message || err);
      }
    });
  }

  obtenerTodas(): SolicitudTiempoExtra[] {
    return this.solicitudesSubject.getValue();
  }

  obtenerPorDia(fechaKey: string, cedula?: string): SolicitudTiempoExtra[] {
    const lista = this.solicitudesSubject.getValue();
    return lista.filter(s => {
      const matchFecha = s.fechaKey === fechaKey;
      if (!matchFecha) return false;
      if (cedula && s.cedulaColaborador) {
        return s.cedulaColaborador.trim() === cedula.trim();
      }
      return true;
    });
  }

  obtenerPorDiaCualquierColaborador(fechaKey: string): SolicitudTiempoExtra[] {
    const lista = this.solicitudesSubject.getValue();
    return lista.filter(s => s.fechaKey === fechaKey);
  }

  crearSolicitud(params: {
    fechaKey: string;
    cedulaColaborador: string;
    nombreColaborador: string;
    horas: number;
    descripcion: string;
    aprobadorAsignado?: string;
    correoAprobador?: string;
  }): SolicitudTiempoExtra {
    const lista = [...this.solicitudesSubject.getValue()];
    const nueva: SolicitudTiempoExtra = {
      id: 'te_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      fechaKey: params.fechaKey,
      cedulaColaborador: (params.cedulaColaborador || '').trim(),
      nombreColaborador: (params.nombreColaborador || 'Colaborador').trim(),
      horas: params.horas,
      horasTexto: `${params.horas} ${params.horas === 1 ? 'hora' : 'horas'}`,
      descripcion: (params.descripcion || '').trim(),
      estado: 'PENDIENTE',
      fechaSolicitud: new Date().toISOString(),
      aprobadorAsignado: params.aprobadorAsignado || null,
      correoAprobador: params.correoAprobador || null
    };

    lista.unshift(nueva);
    this.guardarEnStorage(lista);

    // Enviar a la base de datos y disparar correo en background
    this.http.post(this.apiUrl, nueva, { headers: this.getHeaders() }).subscribe({
      next: () => {
        console.log('✅ Solicitud de tiempo extra persistida en BD y correo disparado.');
      },
      error: (err) => {
        console.warn('⚠️ No se pudo persistir en backend de inmediato:', err?.message || err);
      }
    });

    return nueva;
  }

  aprobarSolicitud(id: string, nombreAprobador: string): SolicitudTiempoExtra | null {
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

    // Notificar al backend para actualizar registro
    this.http.put(`${this.apiUrl}/${id}/aprobar`, { aprobadoPor: nombreAprobador }, { headers: this.getHeaders() }).subscribe({
      next: () => console.log('✅ Aprobación guardada en BD'),
      error: (err) => console.warn('⚠️ Error al actualizar estado en BD:', err?.message || err)
    });

    return lista[index];
  }

  rechazarSolicitud(id: string, nombreAprobador: string, motivo?: string): SolicitudTiempoExtra | null {
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

    // Notificar al backend para actualizar registro
    this.http.put(`${this.apiUrl}/${id}/rechazar`, { aprobadoPor: nombreAprobador, motivo }, { headers: this.getHeaders() }).subscribe({
      next: () => console.log('✅ Rechazo guardado en BD'),
      error: (err) => console.warn('⚠️ Error al actualizar estado en BD:', err?.message || err)
    });

    return lista[index];
  }

  eliminarSolicitud(id: string): boolean {
    const lista = this.solicitudesSubject.getValue().filter(s => s.id !== id);
    this.guardarEnStorage(lista);

    this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => console.log('✅ Solicitud eliminada de BD'),
      error: (err) => console.warn('⚠️ Error al eliminar en BD:', err?.message || err)
    });

    return true;
  }
}
