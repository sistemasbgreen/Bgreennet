import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  InterrupcionProgramacion,
  NominaFiltros,
  NominaKpis,
  LiquidacionNomina,
  LiquidacionFiltros,
  LiquidacionKpis,
  LlegadasTardeResponse,
  LlegadasTardeFiltros,
  RegistroLlegadaTarde,
  RegistroNoMarco,
  RegistroSalidaTarde,
  RegistroInvalido,
  ResumenSemanalResponse,
  ColaboradorResumenSemanal,
  DiaResumenSemanal
} from '../models/nomina';

@Injectable({
  providedIn: 'root'
})
export class NominaService {
  private readonly apiUrlInterrupciones = `${environment.apiUrl}/api/nomina/interrupciones`;
  private readonly apiUrlLiquidacion = `${environment.apiUrl}/api/nomina/liquidacion`;
  private readonly apiUrlLlegadasTarde = `${environment.apiUrl}/api/nomina/llegadas-tarde`;
  private readonly apiUrlResumenSemanal = `${environment.apiUrl}/api/nomina/resumen-semanal`;
  private readonly apiUrlTest = `${environment.apiUrl}/api/nomina/test`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  testDiagnostico(): Observable<any> {
    return this.http.get<any>(this.apiUrlTest, { headers: this.getHeaders() }).pipe(
      catchError(() => of(null))
    );
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

  // ==============================================================
  // 1. INTERRUPCIONES Y PROGRAMACIÓN (View_InterruptionsScheduling)
  // ==============================================================

  getInterrupciones(filtros?: Partial<NominaFiltros>): Observable<InterrupcionProgramacion[]> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
      if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda.trim());
      if (filtros.area && filtros.area !== 'TODAS') params = params.set('area', filtros.area);
      if (filtros.grupo && filtros.grupo !== 'TODOS') params = params.set('grupo', filtros.grupo);
      if (filtros.tipoInterrupcion && filtros.tipoInterrupcion !== 'TODOS') params = params.set('tipoInterrupcion', filtros.tipoInterrupcion);
      if (filtros.empresa && filtros.empresa !== 'TODAS') params = params.set('empresa', filtros.empresa);
      if (filtros.soloHorasAdicionales !== undefined) params = params.set('isAdditionalHour', String(filtros.soloHorasAdicionales));
    }

    return this.http.get<any[]>(this.apiUrlInterrupciones, { headers: this.getHeaders(), params }).pipe(
      map(data => {
        if (Array.isArray(data) && data.length > 0) {
          return this.mapearRespuestaServidor(data);
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  public mapearRespuestaServidor(rawItems: any[]): InterrupcionProgramacion[] {
    return rawItems.map(item => {
      const p1 = item.FirstName || item.firstName || '';
      const p2 = item.MiddleName || item.middleName || '';
      const a1 = item.LastName || item.lastName || '';
      const a2 = item.Surname || item.surname || '';
      const fullName = [p1, p2, a1, a2].filter(Boolean).join(' ').trim();

      const u1 = item.UserFirstName || item.userFirstName || '';
      const u2 = item.UserLastName || item.userLastName || '';
      const userFullName = [u1, u2].filter(Boolean).join(' ').trim() || item.UserLogin || item.userLogin || 'Sistema';

      return {
        personId: Number(item.PersonId ?? item.personId ?? 0),
        interruptionId: Number(item.InterruptionId ?? item.interruptionId ?? 0),
        positionDescription: item.PositionDescription || item.positionDescription || 'Operario / Cargo no especificado',
        areaName: item.AreaName || item.areaName || 'Planta / Operaciones',
        groupId: Number(item.GroupId ?? item.groupId ?? 0),
        groupName: item.GroupName || item.groupName || 'Cuadrilla General',
        firstName: p1,
        middleName: p2,
        lastName: a1,
        surname: a2,
        fullName: fullName || 'Colaborador',
        documentNumber: String(item.DocumentNumber || item.documentNumber || ''),
        cardNumber: String(item.CardNumber || item.cardNumber || ''),
        employeeTypeId: Number(item.EmployeeTypeId ?? item.employeeTypeId ?? 1),
        date: item.Date || item.date || '',
        endDate: item.EndDate || item.endDate || '',
        differenceInHours: Number(item.DifferenceInHours ?? item.differenceInHours ?? 0),
        interruptionName: item.InterruptionName || item.interruptionName || 'Novedad de Programación',
        interruptionAlias: item.InterruptionAlias || item.interruptionAlias || '',
        companyName: item.CompanyName || item.companyName || 'Biocosta S.A.S.',
        isAdditionalHour: Boolean(item.IsAdditionalHour ?? item.isAdditionalHour ?? false),
        interruptionTypeId: Number(item.InterruptionTypeId ?? item.interruptionTypeId ?? 1),
        defaultTime: item.DefaultTime || item.defaultTime || '00:00:00',
        createdDate: item.CreatedDate || item.createdDate || new Date().toISOString(),
        createdBy: Number(item.CreatedBy ?? item.createdBy ?? 0),
        userLogin: item.UserLogin || item.userLogin || '',
        userFirstName: u1,
        userLastName: u2,
        userFullName: userFullName,
        observations: item.Observations || item.observations || ''
      };
    });
  }

  calcularKpis(registros: InterrupcionProgramacion[]): NominaKpis {
    if (!registros || registros.length === 0) {
      return {
        totalRegistros: 0,
        totalHoras: 0,
        totalHorasAdicionales: 0,
        colaboradoresUnicos: 0,
        promedioHorasPorRegistro: 0,
        areasAfectadas: 0
      };
    }

    let totalHoras = 0;
    let totalHorasAdicionales = 0;
    const colaboradoresSet = new Set<string>();
    const areasSet = new Set<string>();

    registros.forEach(r => {
      const h = Number(r.differenceInHours || 0);
      totalHoras += h;
      if (r.isAdditionalHour) {
        totalHorasAdicionales += h;
      }
      if (r.documentNumber) colaboradoresSet.add(r.documentNumber);
      if (r.areaName) areasSet.add(r.areaName);
    });

    return {
      totalRegistros: registros.length,
      totalHoras: Math.round(totalHoras * 10) / 10,
      totalHorasAdicionales: Math.round(totalHorasAdicionales * 10) / 10,
      colaboradoresUnicos: colaboradoresSet.size,
      promedioHorasPorRegistro: Math.round((totalHoras / registros.length) * 10) / 10,
      areasAfectadas: areasSet.size
    };
  }

  exportarCsv(registros: InterrupcionProgramacion[], nombreArchivo: string = 'Nomina_Interrupciones.csv'): void {
    if (!registros || registros.length === 0) return;

    const headers = [
      'Documento',
      'Colaborador',
      'Cargo',
      'Área',
      'Grupo/Cuadrilla',
      'Concepto Novedad',
      'Tipo / Alias',
      'Hora Adicional',
      'Fecha Inicio',
      'Fecha Fin',
      'Horas (Dif)',
      'Empresa',
      'Registrado Por',
      'Fecha Creación',
      'Observaciones'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = registros.map(r => [
      escapeCsv(r.documentNumber),
      escapeCsv(r.fullName),
      escapeCsv(r.positionDescription),
      escapeCsv(r.areaName),
      escapeCsv(r.groupName),
      escapeCsv(r.interruptionName),
      escapeCsv(r.interruptionAlias || ''),
      escapeCsv(r.isAdditionalHour ? 'SÍ' : 'NO'),
      escapeCsv(r.date),
      escapeCsv(r.endDate),
      escapeCsv(r.differenceInHours),
      escapeCsv(r.companyName),
      escapeCsv(r.userFullName || r.userLogin || ''),
      escapeCsv(r.createdDate),
      escapeCsv(r.observations || '')
    ].join(';'));

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==============================================================
  // 2. LIQUIDACIÓN DE NÓMINA Y TURNOS (View_Liquidation)
  // ==============================================================

  getLiquidaciones(filtros?: Partial<LiquidacionFiltros>): Observable<LiquidacionNomina[]> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
      if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda.trim());
      if (filtros.tipoHora && filtros.tipoHora !== 'TODOS') params = params.set('hourtype', filtros.tipoHora);
      if (filtros.turno && filtros.turno !== 'TODOS') params = params.set('workshiftName', filtros.turno);
      if (filtros.grupo && filtros.grupo !== 'TODOS') params = params.set('groupName', filtros.grupo);
    }

    return this.http.get<any[]>(this.apiUrlLiquidacion, { headers: this.getHeaders(), params }).pipe(
      map(data => {
        if (Array.isArray(data) && data.length > 0) {
          return this.mapearRespuestaServidorLiquidacion(data);
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  public mapearRespuestaServidorLiquidacion(rawItems: any[]): LiquidacionNomina[] {
    return rawItems.map(item => {
      const p1 = item.FirstName || item.firstName || '';
      const p2 = item.MiddleName || item.middleName || '';
      const a1 = item.LastName || item.lastName || '';
      const a2 = item.Surname || item.surname || '';
      const fullName = [p1, p2, a1, a2].filter(Boolean).join(' ').trim() || 'Colaborador';

      const h = Number(item.Hours ?? item.hours ?? 0);
      const m = Number(item.Minutes ?? item.minutes ?? 0);
      const totalTiempo = Math.round((h + m / 60) * 100) / 100;

      return {
        personId: Number(item.PersonId ?? item.personId ?? 0),
        firstName: p1,
        middleName: p2,
        lastName: a1,
        surname: a2,
        fullName: fullName,
        documentNumber: String(item.DocumentNumber || item.documentNumber || ''),
        cardNumber: String(item.CardNumber || item.cardNumber || ''),
        date: item.Date || item.date || '',
        hourtype: item.Hourtype || item.hourtype || 'Hora Ordinaria',
        hours: h,
        minutes: m,
        totalTiempoHoras: totalTiempo,
        workshiftName: item.WorkshiftName || item.workshiftName || 'Turno Rotativo Operativo',
        firstArrival: item.FirstArrival || item.firstArrival || '',
        secondArrival: item.SecondArrival || item.secondArrival || '',
        firstDeparture: item.FirstDeparture || item.firstDeparture || '',
        secondDeparture: item.SecondDeparture || item.secondDeparture || '',
        dailyWorkingHours: Number(item.DailyWorkingHours ?? item.dailyWorkingHours ?? 8),
        groupId: Number(item.GroupId ?? item.groupId ?? 0),
        groupName: item.GroupName || item.groupName || 'Cuadrilla Planta',
        interruptionName: item.InterruptionName || item.interruptionName || '',
        startDateInterruption: item.StartDateInterruption || item.startDateInterruption || '',
        endDateInterruption: item.EndDateInterruption || item.endDateInterruption || '',
        totalInterruptionTime: item.TotalInterruptionTime || item.totalInterruptionTime || '',
        payrollNovelties: item.PayrollNovelties || item.payrollNovelties || ''
      };
    });
  }

  calcularKpisLiquidacion(registros: LiquidacionNomina[]): LiquidacionKpis {
    if (!registros || registros.length === 0) {
      return {
        totalRegistros: 0,
        totalHorasLiquidadas: 0,
        totalHorasDiarias: 0,
        colaboradoresUnicos: 0,
        turnosUnicos: 0,
        promedioHorasPorDia: 0
      };
    }

    let totalLiquidadas = 0;
    let totalDiarias = 0;
    const colabSet = new Set<string>();
    const turnoSet = new Set<string>();

    registros.forEach(r => {
      totalLiquidadas += r.totalTiempoHoras || 0;
      totalDiarias += Number(r.dailyWorkingHours || 0);
      if (r.documentNumber) colabSet.add(r.documentNumber);
      if (r.workshiftName) turnoSet.add(r.workshiftName);
    });

    return {
      totalRegistros: registros.length,
      totalHorasLiquidadas: Math.round(totalLiquidadas * 10) / 10,
      totalHorasDiarias: Math.round(totalDiarias * 10) / 10,
      colaboradoresUnicos: colabSet.size,
      turnosUnicos: turnoSet.size,
      promedioHorasPorDia: Math.round((totalLiquidadas / (registros.length || 1)) * 10) / 10
    };
  }

  exportarCsvLiquidacion(registros: LiquidacionNomina[], nombreArchivo: string = 'Nomina_Liquidacion.csv'): void {
    if (!registros || registros.length === 0) return;

    const headers = [
      'Documento',
      'Colaborador',
      'No. Carnet',
      'Fecha',
      'Tipo de Hora',
      'Horas',
      'Minutos',
      'Total Tiempo (H)',
      'Turno Asignado',
      '1ra Entrada',
      '1ra Salida',
      '2da Entrada',
      '2da Salida',
      'Horas Laboradas Día',
      'Grupo / Cuadrilla',
      'Novedad / Interrupción',
      'Inicio Novedad',
      'Fin Novedad',
      'Tiempo Novedad',
      'Concepto Liquidación Nómina'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = registros.map(r => [
      escapeCsv(r.documentNumber),
      escapeCsv(r.fullName),
      escapeCsv(r.cardNumber || ''),
      escapeCsv(r.date),
      escapeCsv(r.hourtype),
      escapeCsv(r.hours),
      escapeCsv(r.minutes),
      escapeCsv(r.totalTiempoHoras),
      escapeCsv(r.workshiftName),
      escapeCsv(r.firstArrival || ''),
      escapeCsv(r.firstDeparture || ''),
      escapeCsv(r.secondArrival || ''),
      escapeCsv(r.secondDeparture || ''),
      escapeCsv(r.dailyWorkingHours),
      escapeCsv(r.groupName),
      escapeCsv(r.interruptionName || ''),
      escapeCsv(r.startDateInterruption || ''),
      escapeCsv(r.endDateInterruption || ''),
      escapeCsv(r.totalInterruptionTime || ''),
      escapeCsv(r.payrollNovelties || '')
    ].join(';'));

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==============================================================
  // 3. LLEGADAS TARDE & CONTROL DE HORARIOS (InformeTurno)
  // ==============================================================

  getLlegadasTarde(filtros?: Partial<LlegadasTardeFiltros>): Observable<LlegadasTardeResponse> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
      if (filtros.grupo && filtros.grupo !== 'TODOS') params = params.set('grupo', filtros.grupo);
      if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda.trim());
    }

    return this.http.get<LlegadasTardeResponse>(this.apiUrlLlegadasTarde, { headers: this.getHeaders(), params }).pipe(
      catchError(() => of({
        fechaInicio: filtros?.fechaInicio || '',
        fechaFin: filtros?.fechaFin || '',
        resumen: {
          totalLlegadasTarde: 0,
          totalNoMarcaron: 0,
          totalSalidasTarde: 0,
          totalInvalidos: 0,
          totalMemorandos: 0
        },
        llegadasTarde: [],
        noMarcaron: [],
        salidasTarde: [],
        invalidos: []
      }))
    );
  }

  exportarCsvLlegadasTarde(data: LlegadasTardeResponse, nombreArchivo: string = 'Llegadas_Tarde_Control.csv'): void {
    if (!data) return;
    const rows: string[] = [];
    rows.push('SECCION;FECHA;COLABORADOR;DOCUMENTO;GRUPO;CENTRO_COSTO;TURNO;HORA_MARCACION;DETALLE_RETRASO_O_MOTIVO;MEMORANDO');

    data.llegadasTarde?.forEach(r => {
      rows.push(`"Llegada Tarde";"${r.fecha}";"${r.colaborador}";"${r.documento}";"${r.grupo}";"${r.centroCosto}";"${r.turno}";"${r.horaEntrada}";"${r.minutosRetraso} MIN";"${r.aplicaMemorando ? 'APLICA MEMORANDO (>15 min)' : 'Normal'}"`);
    });

    data.noMarcaron?.forEach(r => {
      rows.push(`"No Marcó";"${r.fecha}";"${r.colaborador}";"${r.documento}";"${r.grupo}";"${r.centroCosto}";"${r.turno}";"No registró";"${r.tipoOmision}";"APLICA MEMORANDO"`);
    });

    data.salidasTarde?.forEach(r => {
      rows.push(`"Salida Tarde";"${r.fecha}";"${r.colaborador}";"${r.documento}";"${r.grupo}";"${r.centroCosto}";"${r.turno}";"${r.horaSalida}";"${r.minutosRetraso} MIN";"N/A"`);
    });

    data.invalidos?.forEach(r => {
      rows.push(`"Inválido";"${r.fecha}";"${r.colaborador}";"${r.documento}";"${r.grupo}";"${r.centroCosto}";"-";"${r.hora}";"${r.motivo}";"N/A"`);
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==============================================================
  // 4. LIQUIDACIÓN DE HORAS Y TURNOS: RESUMEN SEMANAL (PROGRAMADO 42H VS EJECUTADO)
  // ==============================================================

  getResumenSemanal(fecha?: string, grupo?: string, busqueda?: string): Observable<ResumenSemanalResponse> {
    let params = new HttpParams();
    if (fecha && fecha.trim().length >= 10) params = params.set('fecha', fecha.trim().substring(0, 10));
    if (grupo && grupo.trim() && grupo !== 'TODOS') params = params.set('grupo', grupo.trim());
    if (busqueda && busqueda.trim()) params = params.set('busqueda', busqueda.trim());
    params = params.set('soloActivos', 'true');

    return this.http.get<ResumenSemanalResponse>(this.apiUrlResumenSemanal, { headers: this.getHeaders(), params }).pipe(
      tap(resp => {
        if (resp && resp.colaboradores) {
          console.group('%c📊 [LIQUIDACIÓN DE HORAS Y TURNOS] Horas Programadas (42h) vs Ejecutadas Semanales', 'color: #0284c7; font-weight: bold; font-size: 13px;');
          console.log(`📅 Rango de Semana: ${resp.semanaInicio} al ${resp.semanaFin}`);
          console.log('📊 Resumen General:', resp.resumen);
          console.log(`👥 Total Colaboradores (${resp.colaboradores.length}):`, resp.colaboradores);
          if (resp.colaboradores.length > 0) {
            console.log('📋 Muestra de Planilla Semanal:');
            console.table(resp.colaboradores.slice(0, 10).map(c => ({
              Colaborador: c.colaborador,
              Documento: c.documento,
              Grupo: c.grupo,
              'Prog (hrs)': c.totalHorasProgramadas,
              'Ejec (hrs)': c.totalHorasEjecutadas,
              'Dif (hrs)': c.diferenciaHoras,
              '% Cumpl.': `${c.porcentajeCumplimiento}%`,
              'Interrupciones': c.tieneInterrupciones ? `${c.totalHorasInterrupciones}h (${(c.novedadesSemana || []).join(', ')})` : 'Sin novedad'
            })));
          }
          console.groupEnd();
        }
      }),
      catchError(() => of({
        semanaInicio: '',
        semanaFin: '',
        diasMeta: [],
        resumen: {
          totalColaboradores: 0,
          totalHorasProgramadas: 0,
          totalHorasEjecutadas: 0,
          totalHorasInterrupciones: 0,
          totalConInterrupciones: 0,
          porcentajeCumplimientoGlobal: 0
        },
        colaboradores: []
      }))
    );
  }

  exportarCsvResumenSemanal(data: ResumenSemanalResponse, nombreArchivo: string = 'Nomina_Resumen_Semanal.csv'): void {
    if (!data || !data.colaboradores) return;
    const rows: string[] = [];
    rows.push('COLABORADOR;DOCUMENTO;GRUPO;AREA;TOTAL_HORAS_PROGRAMADAS;TOTAL_HORAS_EJECUTADAS;DIFERENCIA;CUMPLIMIENTO_PCT;TIENE_INTERRUPCIONES;HORAS_INTERRUPCIONES;NOVEDADES;LUNES_PROG;LUNES_EJEC;MARTES_PROG;MARTES_EJEC;MIERCOLES_PROG;MIERCOLES_EJEC;JUEVES_PROG;JUEVES_EJEC;VIERNES_PROG;VIERNES_EJEC;SABADO_PROG;SABADO_EJEC;DOMINGO_PROG;DOMINGO_EJEC');

    data.colaboradores.forEach(c => {
      const diasMap: Record<number, { prog: number, ejec: number }> = {};
      (c.dias || []).forEach(d => {
        diasMap[d.indice] = { prog: d.horasProgramadas || 0, ejec: d.horasEjecutadas || 0 };
      });

      const lun = diasMap[0] || { prog: 0, ejec: 0 };
      const mar = diasMap[1] || { prog: 0, ejec: 0 };
      const mie = diasMap[2] || { prog: 0, ejec: 0 };
      const jue = diasMap[3] || { prog: 0, ejec: 0 };
      const vie = diasMap[4] || { prog: 0, ejec: 0 };
      const sab = diasMap[5] || { prog: 0, ejec: 0 };
      const dom = diasMap[6] || { prog: 0, ejec: 0 };

      rows.push(
        `"${c.colaborador}";"${c.documento}";"${c.grupo}";"${c.area}";"${c.totalHorasProgramadas}";"${c.totalHorasEjecutadas}";"${c.diferenciaHoras}";"${c.porcentajeCumplimiento}%";"${c.tieneInterrupciones ? 'SI' : 'NO'}";"${c.totalHorasInterrupciones}";"${(c.novedadesSemana || []).join(', ')}";"${lun.prog}";"${lun.ejec}";"${mar.prog}";"${mar.ejec}";"${mie.prog}";"${mie.ejec}";"${jue.prog}";"${jue.ejec}";"${vie.prog}";"${vie.ejec}";"${sab.prog}";"${sab.ejec}";"${dom.prog}";"${dom.ejec}"`
      );
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  notificarHorasExtras(payload: any): Observable<any> {
    const url = `${environment.apiUrl}/api/nomina/notificar-horas-extras`;
    return this.http.post<any>(url, payload, { headers: this.getHeaders() }).pipe(
      catchError((err) => {
        return of({ success: false, error: err?.message || 'Error al enviar correo' });
      })
    );
  }

  getConfiguracionCorreosLT(): Observable<any> {
    const url = `${environment.apiUrl}/api/nomina/configuracion-correos-llegadas-tarde`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      catchError(() => of({
        correoPorGrupo: {},
        gruposPorCorreoDirectivo: {},
        correosGenerales: [],
        correosGenerales2: []
      }))
    );
  }

  enviarReporteLlegadasTarde(payload: any): Observable<any> {
    const url = `${environment.apiUrl}/api/nomina/enviar-reporte-llegadas-tarde`;
    return this.http.post<any>(url, payload, { headers: this.getHeaders() }).pipe(
      catchError((err) => {
        return of({ success: false, error: err?.error?.error || err?.message || 'Error al enviar reporte' });
      })
    );
  }
}
