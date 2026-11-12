import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NominaService } from '../../servicios/nomina.service';
import {
  InterrupcionProgramacion,
  NominaFiltros,
  NominaKpis,
  LiquidacionNomina,
  LiquidacionFiltros,
  LiquidacionKpis,
  RegistroLlegadaTarde,
  RegistroNoMarco,
  RegistroSalidaTarde,
  RegistroInvalido,
  ResumenLlegadasTarde,
  LlegadasTardeResponse,
  LlegadasTardeFiltros,
  ResumenSemanalResponse,
  ColaboradorResumenSemanal,
  GrupoCumplimiento,
  DiaResumenSemanal,
  ResumenSemanalKpis,
  ConfiguracionCorreosLT,
  EnvioReporteLTPayload
} from '../../models/nomina';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-nomina',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './nomina.html',
  styleUrl: './nomina.css'
})
export class Nomina implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Control de pestaña principal
  pestanaActiva: 'llegadas_tarde' | 'prueba' = 'llegadas_tarde';

  // ==========================================
  // TAB 4: MÓDULO PRUEBA (RESUMEN SEMANAL)
  // ==========================================
  dataResumenSemanal: ResumenSemanalResponse | null = null;
  fechaReferenciaSemana: string = '';
  cargandoSemanal: boolean = false;
  busquedaSemanal: string = '';
  grupoSemanal: string = 'TODOS';
  filtroEstadoSemanal: string = 'TODOS';
  gruposSemanalDisponibles: string[] = [];

  colaboradoresSemanalFiltrados: ColaboradorResumenSemanal[] = [];
  colaboradoresSemanalPaginados: ColaboradorResumenSemanal[] = [];

  paginaActualSemanal: number = 1;
  elementosPorPaginaSemanal: number = 15;
  totalPaginasSemanal: number = 1;

  // Cumplimiento por Grupos / Areas
  resumenGrupos: GrupoCumplimiento[] = [];
  filtroTurnosGrupos: 'TODOS' | 'SIN_TURNO' | 'CON_TURNO' = 'TODOS';
  ordenGrupos: 'PENDIENTES' | 'MENOR_CUMPLIMIENTO' | 'MAYOR_DEFICIT' = 'PENDIENTES';
  diagnosticoExpandido: boolean = true;
  vistaTablaSemanal: 'detallada' | 'malla' = 'detallada';
  mostrarHorariosMallaNomina: boolean = false;

  marcacionPorDia: Array<{
    indice: number;
    esHoy: boolean;
    esFuturo: boolean;
    debenMarcar: number;
    marcaron: number;
    noMarcaron: number;
    porcentaje: number;
  }> = [];

  diagnosticoPresentismo: {
    tieneHoy: boolean;
    debenMarcarHoy: number;
    marcaronHoy: number;
    faltanHoy: number;
    porcentajeHoy: number;
    personasDebenMarcarSemana: number;
    personasMarcaronSemana: number;
    turnosDebenMarcarSemana: number;
    turnosMarcaronSemana: number;
    turnosSinMarcarSemana: number;
    porcentajeMarcacionSemana: number;
    horasProgAlDia: number;
    horasEjecAlDia: number;
    cumplimientoAlDia: number;
    horasFuturas: number;
    casosNoAsistioTotal: number;
    casosSinSalidaTotal: number;
    causasBaja: Array<{
      id: string;
      titulo: string;
      descripcion: string;
      horas: number;
      casos: number;
      personas: number;
      porcentajeImpacto: number;
      color: string;
      icono: string;
      filtroEstado?: string;
    }>;
    areaMasIncumplida: any | null;
    topAreasAfectadas: any[];
  } = {
    tieneHoy: false,
    debenMarcarHoy: 0,
    marcaronHoy: 0,
    faltanHoy: 0,
    porcentajeHoy: 0,
    personasDebenMarcarSemana: 0,
    personasMarcaronSemana: 0,
    turnosDebenMarcarSemana: 0,
    turnosMarcaronSemana: 0,
    turnosSinMarcarSemana: 0,
    porcentajeMarcacionSemana: 0,
    horasProgAlDia: 0,
    horasEjecAlDia: 0,
    cumplimientoAlDia: 0,
    horasFuturas: 0,
    casosNoAsistioTotal: 0,
    casosSinSalidaTotal: 0,
    causasBaja: [],
    areaMasIncumplida: null,
    topAreasAfectadas: []
  };

  colaboradorSeleccionadoSemanal: ColaboradorResumenSemanal | null = null;
  modalDetalleColaboradorSemanal: boolean = false;
  semanaTextoFormateada: string = '';

  // Estado general
  cargando: boolean = false;
  errorMensaje: string = '';

  // Instancias de Gráficas Chart.js
  chartGrupos: any = null;
  chartTipos: any = null;
  chartDrawerEntradas: any = null;
  chartDrawerSalidas: any = null;
  gruposChartDataCount: number = 0;
  totalNovedadesChart: number = 0;
  puntosEntradasCount: number = 0;
  puntosSalidasCount: number = 0;
  cargandoHistorialColab: boolean = false;

  // ==========================================
  // TAB 3: LLEGADAS TARDE & CONTROL HORARIOS
  // ==========================================
  dataLlegadasTarde: LlegadasTardeResponse | null = null;
  subseccionLT: 'TODOS' | 'LLEGADAS_TARDE' | 'MEMORANDOS' | 'NO_MARCARON' | 'SALIDAS_TARDE' | 'INVALIDOS' | null = null;
  fechaInicioLT: string = '';
  fechaFinLT: string = '';
  grupoLT: string = 'TODOS';
  busquedaLT: string = '';
  periodoRapidoLT: string = 'hoy';
  cargandoLT: boolean = false;
  gruposLTDisponibles: string[] = [];

  llegadasTardeFiltradas: RegistroLlegadaTarde[] = [];
  noMarcaronFiltrados: RegistroNoMarco[] = [];
  salidasTardeFiltradas: RegistroSalidaTarde[] = [];
  invalidosFiltrados: RegistroInvalido[] = [];

  // Indicadores (KPIs) calculados dinámicamente según el rango de fechas y filtros activos
  kpiLlegadasTarde: number = 0;
  kpiNoMarcaron: number = 0;
  kpiAplicaMemorando: number = 0;
  kpiMemoLlegadasTarde: number = 0;
  kpiMemoNoMarcaron: number = 0;
  kpiSalidasTarde: number = 0;
  kpiInvalidos: number = 0;
  kpiInvalidosSinTurno: number = 0;
  kpiInvalidosDuplicadas: number = 0;

  // Opciones de visualización (UX)
  soloCriticos: boolean = false;
  densidadCompacta: boolean = false;

  // Drawer lateral de detalle
  drawerAbierto: boolean = false;
  drawerTipo: 'LLEGADA' | 'NO_MARCO' | 'SALIDA' | 'INVALIDO' | null = null;
  drawerReg: any = null;
  drawerIndice: number = -1;
  todosRegistrosLiq: any[] = [];

  // ==========================================
  // MODAL DE ENVÍO DE REPORTES DE LLEGADAS TARDE (.NET)
  // ==========================================
  modalReporteCorreosLT: boolean = false;
  enviandoReporteLT: boolean = false;
  modoEnvioReporteLT: 'GENERAL' | 'GENERAL_2' | 'DIRECTIVO' | 'GRUPO' | 'MASIVO' = 'GENERAL';
  directivoReporteSeleccionado: string = 'TODOS';
  grupoReporteSeleccionado: string = 'TODOS';
  ccReporteLT: string = '';
  observacionesReporteLT: string = '';
  destinatariosEditados: string[] = [];
  nuevoDestinatarioInput: string = '';

  configCorreosLT: ConfiguracionCorreosLT = {
    correoPorGrupo: {
      "CONTABILIDAD": "jefecontabilidad@bgreen.com.co",
      "GESTION HUMANA Y ADMINISTRATIVO": "jefegestionhumana@bgreen.com.co",
      "TESORERIA": "jefetesoreria@bgreen.com.co",
      "SISTEMAS": "jefetic@bgreen.com.co",
      "PLANEACION FINANCIERA": "jefeplaneacionfinanciera@bgreen.com.co",
      "ABASTECIMIENTO": "jefeabastecimiento@bgreen.com.co",
      "COMERCIAL": "directorcomercial@bgreen.com.co",
      "Almacén": "jefecomexeinventarios@bgreen.com.co",
      "COMEX": "jefecomexeinventarios@bgreen.com.co",
      "Logística": "jefelogistica@bgreen.com.co",
      "MEJORAMIENTO CONTINUO": "directorsig@bgreen.com.co",
      "GESTION DOCUMENTAL": "correo@empresa.com",
      "SIG": "jefehseq@bgreen.com.co",
      "LABORATORIO": "jefecontrolcalidad@bgreen.com.co",
      "PRODUCCION": "jefeoperacionproduccion@bgreen.com.co",
      "COORDINADORES": "jefeoperacionproduccion@bgreen.com.co",
      "OPERACIÓN": "jefeoperacionproduccion@bgreen.com.co",
      "PLANEACIÓN Y MEJORAS": "jefeplaneacionproduccion@bgreen.com.co",
      "MANTENIMIENTO": "jefemantenimiento@bgreen.com.co",
      "MTTO ELECTRICOS": "coordinadormttoelectrico@bgreen.com.co",
      "MTTO MECANICOS": "coordinadormttomecanico@bgreen.com.co",
      "MTTO SERVICIOS INDUSTRIALES": "jefemantenimiento@bgreen.com.co",
      "FLOTA PROPIA": "directoroperaciones@olc.com.co",
      "TRAFICO Y SEGURIDAD": "directoroperaciones@olc.com.co"
    },
    gruposPorCorreoDirectivo: {
      "jefegestionhumana@bgreen.com.co": ["GERENCIA", "PRESIDENCIA", "JURIDICA", "CONTROL INTERNO"],
      "directorfinanciero@bgreen.com.co": ["CONTABILIDAD", "GESTION HUMANA Y ADMINISTRATIVO", "TESORERIA", "SISTEMAS", "PLANEACION FINANCIERA"],
      "directorcomercial@bgreen.com.co": ["ABASTECIMIENTO", "COMERCIAL", "Almacén", "COMEX", "Logística"],
      "directorsig@bgreen.com.co": ["MEJORAMIENTO CONTINUO", "GESTION DOCUMENTAL", "SIG", "LABORATORIO"],
      "directorplanta@bgreen.com.co": ["PRODUCCIÓN", "COORDINADORES", "OPERACIÓN", "PLANEACIÓN Y MEJORAS", "MANTENIMIENTO", "MTTO ELECTRICOS", "MTTO MECANICOS", "MTTO SERVICIOS INDUSTRIALES"]
    },
    correosGenerales: [
      "asistentetic@bgreen.com.co",
      "jefegestionhumana@bgreen.com.co",
      "analistagestionhumana@bgreen.com.co"
    ],
    correosGenerales2: [
      "directorfinanciero@bgreen.com.co"
    ]
  };

  listaDirectivosDisponibles: { correo: string; cargo: string; grupos: string[] }[] = [
    { correo: 'directorfinanciero@bgreen.com.co', cargo: 'Director Financiero', grupos: ['CONTABILIDAD', 'GESTION HUMANA Y ADMINISTRATIVO', 'TESORERIA', 'SISTEMAS', 'PLANEACION FINANCIERA'] },
    { correo: 'directorcomercial@bgreen.com.co', cargo: 'Director Comercial', grupos: ['ABASTECIMIENTO', 'COMERCIAL', 'Almacén', 'COMEX', 'Logística'] },
    { correo: 'directorsig@bgreen.com.co', cargo: 'Director SIG', grupos: ['MEJORAMIENTO CONTINUO', 'GESTION DOCUMENTAL', 'SIG', 'LABORATORIO'] },
    { correo: 'directorplanta@bgreen.com.co', cargo: 'Director de Planta', grupos: ['PRODUCCIÓN', 'COORDINADORES', 'OPERACIÓN', 'PLANEACIÓN Y MEJORAS', 'MANTENIMIENTO', 'MTTO ELECTRICOS', 'MTTO MECANICOS', 'MTTO SERVICIOS INDUSTRIALES'] },
    { correo: 'jefegestionhumana@bgreen.com.co', cargo: 'Jefe Gestión Humana (Directivo)', grupos: ['GERENCIA', 'PRESIDENCIA', 'JURIDICA', 'CONTROL INTERNO'] }
  ];

  listaJefesGrupoDisponibles: { grupo: string; correo: string }[] = [];

  opcionesPorPagina: number[] = [10, 15, 25, 50, 100];

  constructor(
    private nominaService: NominaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Diagnóstico automático de base de datos
    this.nominaService.testDiagnostico().pipe(takeUntil(this.destroy$)).subscribe();

    // 2. Establecer por defecto hoy para llegadas tarde y semana actual para liquidación de horas
    this.establecerRangoPeriodoLT('hoy');
    this.semanaActual();

    this.cargarDatosLlegadasTarde();
    this.cargarConfiguracionCorreosLT();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chartGrupos) {
      this.chartGrupos.destroy();
      this.chartGrupos = null;
    }
    if (this.chartTipos) {
      this.chartTipos.destroy();
      this.chartTipos = null;
    }
    if (this.chartDrawerEntradas) {
      this.chartDrawerEntradas.destroy();
      this.chartDrawerEntradas = null;
    }
    if (this.chartDrawerSalidas) {
      this.chartDrawerSalidas.destroy();
      this.chartDrawerSalidas = null;
    }
  }

  cambiarPestana(p: 'llegadas_tarde' | 'prueba'): void {
    this.pestanaActiva = p;
    this.cdr.detectChanges();
    if (p === 'llegadas_tarde') {
      this.renderizarGraficasLT();
    }
  }

  copiarTexto(texto: string, etiqueta: string): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      Swal.fire({
        icon: 'success',
        title: `${etiqueta} copiado`,
        text: texto,
        toast: true,
        position: 'top-end',
        timer: 1800,
        showConfirmButton: false
      });
    });
  }

  // ==============================================================
  // LOGICA TAB 3: LLEGADAS TARDE & CONTROL DE HORARIOS
  // ==============================================================

  establecerRangoPeriodoLT(tipo: string): void {
    this.periodoRapidoLT = tipo;
    const hoy = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (tipo === 'hoy') {
      const hoyStr = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
      this.fechaInicioLT = hoyStr;
      this.fechaFinLT = hoyStr;
    } else if (tipo === 'ayer') {
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);
      const ayerStr = `${ayer.getFullYear()}-${pad(ayer.getMonth() + 1)}-${pad(ayer.getDate())}`;
      this.fechaInicioLT = ayerStr;
      this.fechaFinLT = ayerStr;
    } else if (tipo === 'ultima_semana') {
      const hace7 = new Date(hoy);
      hace7.setDate(hoy.getDate() - 7);
      this.fechaInicioLT = `${hace7.getFullYear()}-${pad(hace7.getMonth() + 1)}-${pad(hace7.getDate())}`;
      this.fechaFinLT = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
    } else if (tipo === 'mes_actual') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      this.fechaInicioLT = `${primerDia.getFullYear()}-${pad(primerDia.getMonth() + 1)}-01`;
      this.fechaFinLT = `${ultimoDia.getFullYear()}-${pad(ultimoDia.getMonth() + 1)}-${pad(ultimoDia.getDate())}`;
    } else if (tipo === 'mes_anterior') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      this.fechaInicioLT = `${primerDia.getFullYear()}-${pad(primerDia.getMonth() + 1)}-01`;
      this.fechaFinLT = `${ultimoDia.getFullYear()}-${pad(ultimoDia.getMonth() + 1)}-${pad(ultimoDia.getDate())}`;
    }
  }

  cargarDatosLlegadasTarde(): void {
    this.cargandoLT = true;
    const filtros: Partial<LlegadasTardeFiltros> = {
      fechaInicio: this.fechaInicioLT,
      fechaFin: this.fechaFinLT,
      grupo: this.grupoLT,
      busqueda: this.busquedaLT
    };

    this.nominaService.getLlegadasTarde(filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dataLlegadasTarde = res;
          this.extraerGruposLT(res);
          this.aplicarFiltrosLT();
          this.cargandoLT = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargandoLT = false;
          this.cdr.detectChanges();
        }
      });
  }

  private extraerGruposLT(res: LlegadasTardeResponse): void {
    const gruposSet = new Set<string>();
    res?.llegadasTarde?.forEach(r => { if (r.grupo?.trim()) gruposSet.add(r.grupo.trim()); });
    res?.noMarcaron?.forEach(r => { if (r.grupo?.trim()) gruposSet.add(r.grupo.trim()); });
    res?.salidasTarde?.forEach(r => { if (r.grupo?.trim()) gruposSet.add(r.grupo.trim()); });
    res?.invalidos?.forEach(r => { if (r.grupo?.trim()) gruposSet.add(r.grupo.trim()); });
    this.gruposLTDisponibles = Array.from(gruposSet).sort();
  }

  normalizarFecha(f: string | undefined | null): string {
    if (!f) return '';
    const trimmed = String(f).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 10);
    }
    const partesSlash = trimmed.split(/[\/\-]/);
    if (partesSlash.length === 3 && partesSlash[2].length === 4) {
      const d = partesSlash[0].padStart(2, '0');
      const m = partesSlash[1].padStart(2, '0');
      const y = partesSlash[2];
      return `${y}-${m}-${d}`;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    return trimmed;
  }

  parsearHoraAMinutos(h: string | undefined | null): number | null {
    if (!h || typeof h !== 'string') return null;
    const trimmed = h.trim();
    if (!trimmed || trimmed === '00:00' || trimmed === '00:00:00') return null;
    const isPM = /PM/i.test(trimmed);
    const isAM = /AM/i.test(trimmed);
    const match = trimmed.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    let hr = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    if (isPM && hr < 12) hr += 12;
    if (isAM && hr === 12) hr = 0;
    return hr * 60 + min;
  }

  extraerHoraFinDeTurnoMinutos(turno: string | undefined | null): number | null {
    if (!turno || typeof turno !== 'string') return null;
    const regexRango = /(?:-|a|al|to)\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i;
    const match = turno.match(regexRango);
    if (match && match[1]) {
      return this.parsearHoraAMinutos(match[1]);
    }
    return null;
  }

  extraerHoraInicioDeTurnoMinutos(turno: string | undefined | null): number | null {
    if (!turno || typeof turno !== 'string') return null;
    const match = turno.match(/(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/);
    if (match && match[1]) {
      return this.parsearHoraAMinutos(match[1]);
    }
    return null;
  }

  /**
   * Valida si una omisión de marcación es real o si corresponde a un turno activo
   * ("la salida aún no es"): si es hoy y la jornada no ha terminado, no debe alarmar como falta.
   */
  esOmisionValida(reg: RegistroNoMarco): boolean {
    if (!reg) return false;
    const fNorm = this.normalizarFecha(reg.fecha);
    const hoy = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const hoyStr = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;

    // Si la fecha es futura, el turno aún no ocurre
    if (fNorm > hoyStr) {
      return false;
    }

    // Si la fecha es de días anteriores (ayer, etc.), el turno ya concluyó definitivamente
    if (fNorm < hoyStr) {
      return true;
    }

    // Para la fecha de HOY:
    const tipoOmis = (reg.tipoOmision || '').toUpperCase().trim();
    const ahoraMinutos = hoy.getHours() * 60 + hoy.getMinutes();

    const inicioMinutos = this.parsearHoraAMinutos(reg.horaInicio) ?? this.extraerHoraInicioDeTurnoMinutos(reg.turno);
    const finMinutos = this.parsearHoraAMinutos(reg.horaFin) ?? this.extraerHoraFinDeTurnoMinutos(reg.turno);

    // Si el turno ni siquiera ha iniciado hoy, ignorar
    if (inicioMinutos !== null && ahoraMinutos < inicioMinutos) {
      return false;
    }

    // Si es omisión de SALIDA (o no marcó salida pero sí entrada)
    const esOmisionSalida = tipoOmis === 'SALIDA' || (tipoOmis.includes('SALIDA') && !tipoOmis.includes('ENTRADA') && !tipoOmis.includes('AMBAS'));

    if (esOmisionSalida) {
      // Si la hora de salida del turno no ha llegado aún (con 10 min de tolerancia)
      if (finMinutos !== null) {
        // En turno nocturno (inicio > fin, ej: 22:00 a 06:00), la salida es al día siguiente
        if (inicioMinutos !== null && inicioMinutos > finMinutos) {
          return false; // La salida es mañana
        }
        if (ahoraMinutos <= finMinutos + 10) {
          return false; // El colaborador se encuentra laborando normalmente su jornada actual ("la salida aún no es")
        }
      } else {
        // Por defecto en jornada diurna estándar, no finaliza antes de las 17:30
        if (ahoraMinutos < 17 * 60 + 30) {
          return false;
        }
      }
    }

    return true;
  }

  onFechaFiltroChangeLT(): void {
    this.periodoRapidoLT = 'personalizado';
    this.cargarDatosLlegadasTarde();
  }

  get llegadasTardeParaMostrar(): RegistroLlegadaTarde[] {
    if (this.subseccionLT === 'MEMORANDOS') {
      return this.llegadasTardeFiltradas.filter(r => r.aplicaMemorando);
    }
    return this.llegadasTardeFiltradas;
  }

  aplicarFiltrosLT(): void {
    if (!this.dataLlegadasTarde) return;
    const term = (this.busquedaLT || '').toLowerCase().trim();
    const grupoSel = this.grupoLT;

    const coincideFecha = (fechaStr: string | undefined | null) => {
      if (!this.fechaInicioLT && !this.fechaFinLT) return true;
      const fNorm = this.normalizarFecha(fechaStr);
      if (!fNorm) return true;
      if (this.fechaInicioLT && fNorm < this.fechaInicioLT) return false;
      if (this.fechaFinLT && fNorm > this.fechaFinLT) return false;
      return true;
    };

    const coincideTextoYGrupo = (colab: string, doc: string, grupo: string, turno: string = '') => {
      const matchesText = !term ||
        (colab && colab.toLowerCase().includes(term)) ||
        (doc && doc.toLowerCase().includes(term)) ||
        (grupo && grupo.toLowerCase().includes(term)) ||
        (turno && turno.toLowerCase().includes(term));
      const matchesGrupo = grupoSel === 'TODOS' || grupo === grupoSel;
      return matchesText && matchesGrupo;
    };

    // Colecciones filtradas por el rango de fechas, grupo, texto y validación de turno activo
    const llegadasEnRango = (this.dataLlegadasTarde.llegadasTarde || []).filter(r =>
      coincideFecha(r.fecha) && coincideTextoYGrupo(r.colaborador, r.documento, r.grupo, r.turno)
    );

    const noMarcaronEnRango = (this.dataLlegadasTarde.noMarcaron || []).filter(r =>
      coincideFecha(r.fecha) &&
      this.esOmisionValida(r) &&
      coincideTextoYGrupo(r.colaborador, r.documento, r.grupo, r.turno)
    );

    const salidasEnRango = (this.dataLlegadasTarde.salidasTarde || []).filter(r =>
      coincideFecha(r.fecha) && coincideTextoYGrupo(r.colaborador, r.documento, r.grupo, r.turno)
    );

    const invalidosEnRango = (this.dataLlegadasTarde.invalidos || []).filter(r =>
      coincideFecha(r.fecha) && coincideTextoYGrupo(r.colaborador, r.documento, r.grupo)
    );

    // Indicadores superiores (KPIs) recalculados con la fecha del filtro activo
    this.kpiLlegadasTarde = llegadasEnRango.length;
    this.kpiNoMarcaron = noMarcaronEnRango.length;
    this.kpiMemoLlegadasTarde = llegadasEnRango.filter(r => r.aplicaMemorando).length;
    this.kpiMemoNoMarcaron = noMarcaronEnRango.length;
    this.kpiAplicaMemorando = this.kpiMemoLlegadasTarde + this.kpiMemoNoMarcaron;
    this.kpiSalidasTarde = salidasEnRango.length;

    this.kpiInvalidos = invalidosEnRango.length;
    this.kpiInvalidosSinTurno = invalidosEnRango.filter(r => {
      const m = (r.motivo || '').toLowerCase();
      return m.includes('turno') || m.includes('horario') || m.includes('programad');
    }).length;
    this.kpiInvalidosDuplicadas = invalidosEnRango.filter(r => {
      const m = (r.motivo || '').toLowerCase();
      return m.includes('duplicad') || m.includes('repetid') || m.includes('ya tiene') || m.includes('minuto');
    }).length;
    const invRestantes = this.kpiInvalidos - (this.kpiInvalidosSinTurno + this.kpiInvalidosDuplicadas);
    if (invRestantes > 0) {
      this.kpiInvalidosSinTurno += invRestantes;
    }

    // Sincronizar también el objeto resumen de dataLlegadasTarde
    if (this.dataLlegadasTarde.resumen) {
      this.dataLlegadasTarde.resumen.totalLlegadasTarde = this.kpiLlegadasTarde;
      this.dataLlegadasTarde.resumen.totalNoMarcaron = this.kpiNoMarcaron;
      this.dataLlegadasTarde.resumen.totalMemorandos = this.kpiAplicaMemorando;
      this.dataLlegadasTarde.resumen.totalSalidasTarde = this.kpiSalidasTarde;
      this.dataLlegadasTarde.resumen.totalInvalidos = this.kpiInvalidos;
    }

    // Listas finales para las tablas (respetando soloCriticos si está activo)
    this.llegadasTardeFiltradas = this.soloCriticos
      ? llegadasEnRango.filter(r => r.aplicaMemorando)
      : llegadasEnRango;

    this.noMarcaronFiltrados = noMarcaronEnRango;

    this.salidasTardeFiltradas = this.soloCriticos ? [] : salidasEnRango;

    this.invalidosFiltrados = this.soloCriticos ? [] : invalidosEnRango;

    this.renderizarGraficasLT();
  }

  toggleSoloCriticos(): void {
    this.soloCriticos = !this.soloCriticos;
    this.aplicarFiltrosLT();
  }

  toggleDensidad(): void {
    this.densidadCompacta = !this.densidadCompacta;
  }

  // ---------- Gráficas del Módulo Llegadas Tarde ----------
  renderizarGraficasLT(): void {
    if (typeof window === 'undefined') return;

    setTimeout(() => {
      // 1. Datos para Chart de Cuadrillas / Grupos
      const mapaGrupos = new Map<string, number>();
      (this.llegadasTardeFiltradas || []).forEach(r => {
        const g = r.grupo || 'Sin Grupo';
        mapaGrupos.set(g, (mapaGrupos.get(g) || 0) + 1);
      });
      (this.noMarcaronFiltrados || []).forEach(r => {
        const g = r.grupo || 'Sin Grupo';
        mapaGrupos.set(g, (mapaGrupos.get(g) || 0) + 1);
      });
      (this.salidasTardeFiltradas || []).forEach(r => {
        const g = r.grupo || 'Sin Grupo';
        mapaGrupos.set(g, (mapaGrupos.get(g) || 0) + 1);
      });
      (this.invalidosFiltrados || []).forEach(r => {
        const g = r.grupo || 'Sin Grupo';
        mapaGrupos.set(g, (mapaGrupos.get(g) || 0) + 1);
      });

      const gruposOrdenados = Array.from(mapaGrupos.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      this.gruposChartDataCount = gruposOrdenados.length;
      const etiquetasGrupos = gruposOrdenados.map(x => x[0]);
      const valoresGrupos = gruposOrdenados.map(x => x[1]);

      const canvasGrupos = document.getElementById('chartGruposLT') as HTMLCanvasElement;
      if (canvasGrupos) {
        if (this.chartGrupos) {
          this.chartGrupos.destroy();
          this.chartGrupos = null;
        }

        this.chartGrupos = new Chart(canvasGrupos, {
          type: 'bar',
          data: {
            labels: etiquetasGrupos.length > 0 ? etiquetasGrupos : ['Sin registros'],
            datasets: [{
              label: 'Total Novedades',
              data: valoresGrupos.length > 0 ? valoresGrupos : [0],
              backgroundColor: 'rgba(15, 118, 110, 0.8)',
              borderColor: '#0f766e',
              borderWidth: 1.5,
              borderRadius: 6,
              maxBarThickness: 36
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#f8fafc',
                padding: 10,
                cornerRadius: 8
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { precision: 0, font: { size: 11 } },
                grid: { color: 'rgba(226, 232, 240, 0.6)' }
              },
              x: {
                ticks: {
                  font: { size: 10.5 },
                  maxRotation: 20,
                  minRotation: 0,
                  callback: function(val: any) {
                    const label = this.getLabelForValue(val) as string;
                    return label && label.length > 13 ? label.substring(0, 13) + '...' : label;
                  }
                },
                grid: { display: false }
              }
            }
          }
        });
      }

      // 2. Datos para Chart de Tipos y Severidad
      const totalMemorandos = (this.llegadasTardeFiltradas || []).filter(r => r.aplicaMemorando).length;
      const totalLlegadasLeves = (this.llegadasTardeFiltradas || []).filter(r => !r.aplicaMemorando).length;
      const totalNoMarcaron = (this.noMarcaronFiltrados || []).length;
      const totalSalidasTarde = (this.salidasTardeFiltradas || []).length;
      const totalInvalidos = (this.invalidosFiltrados || []).length;

      this.totalNovedadesChart = totalMemorandos + totalLlegadasLeves + totalNoMarcaron + totalSalidasTarde + totalInvalidos;

      const canvasTipos = document.getElementById('chartTiposLT') as HTMLCanvasElement;
      if (canvasTipos) {
        if (this.chartTipos) {
          this.chartTipos.destroy();
          this.chartTipos = null;
        }

        const hayDatos = this.totalNovedadesChart > 0;

        this.chartTipos = new Chart(canvasTipos, {
          type: 'doughnut',
          data: {
            labels: hayDatos
              ? ['Llegada >15m (Memorando)', 'Llegada Leve (6-15m)', 'No Marcaron', 'Salidas Tarde', 'Marcación Inválida']
              : ['Sin Novedades'],
            datasets: [{
              data: hayDatos
                ? [totalMemorandos, totalLlegadasLeves, totalNoMarcaron, totalSalidasTarde, totalInvalidos]
                : [1],
              backgroundColor: hayDatos
                ? ['#dc2626', '#f59e0b', '#8b5cf6', '#0284c7', '#64748b']
                : ['#e2e8f0'],
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  boxWidth: 12,
                  font: { size: 11, family: "'Segoe UI', sans-serif" },
                  padding: 10
                }
              },
              tooltip: {
                backgroundColor: '#1e293b',
                padding: 10,
                cornerRadius: 8
              }
            },
            cutout: '64%'
          }
        });
      }
    }, 60);
  }

  // ---------- Drawer lateral ----------
  private listaDrawer(): any[] {
    switch (this.drawerTipo) {
      case 'LLEGADA': return this.llegadasTardeFiltradas;
      case 'NO_MARCO': return this.noMarcaronFiltrados;
      case 'SALIDA': return this.salidasTardeFiltradas;
      case 'INVALIDO': return this.invalidosFiltrados;
      default: return [];
    }
  }

  abrirDrawer(tipo: 'LLEGADA' | 'NO_MARCO' | 'SALIDA' | 'INVALIDO', reg: any): void {
    this.drawerTipo = tipo;
    this.drawerReg = reg;
    this.drawerIndice = this.listaDrawer().indexOf(reg);
    this.drawerAbierto = true;
    this.actualizarHistorialDrawer();
    this.cdr.detectChanges();
    this.cargarYRenderizarHistorialPuntos();
  }

  cerrarDrawer(): void {
    this.drawerAbierto = false;
    this.drawerReg = null;
    if (this.chartDrawerEntradas) {
      this.chartDrawerEntradas.destroy();
      this.chartDrawerEntradas = null;
    }
    if (this.chartDrawerSalidas) {
      this.chartDrawerSalidas.destroy();
      this.chartDrawerSalidas = null;
    }
  }

  navegarDrawer(delta: number): void {
    const lista = this.listaDrawer();
    const nuevo = this.drawerIndice + delta;
    if (nuevo < 0 || nuevo >= lista.length) return;
    this.drawerIndice = nuevo;
    this.drawerReg = lista[nuevo];
    this.actualizarHistorialDrawer();
    this.cdr.detectChanges();
    this.cargarYRenderizarHistorialPuntos();
  }

  get totalDrawer(): number {
    return this.listaDrawer().length;
  }

  /** Todas las novedades del mismo colaborador en el período */
  historialDrawer: { tipo: string; fecha: string; hora: string; detalle: string; critico: boolean }[] = [];

  private actualizarHistorialDrawer(): void {
    if (!this.drawerReg || !this.dataLlegadasTarde) { this.historialDrawer = []; return; }
    const doc = this.drawerReg.documento;
    const d = this.dataLlegadasTarde;
    const h: { tipo: string; fecha: string; hora: string; detalle: string; critico: boolean }[] = [];
    (d.llegadasTarde || []).filter(r => r.documento === doc).forEach(r =>
      h.push({ tipo: 'Llegada tarde', fecha: r.fecha, hora: r.horaEntrada, detalle: `+${r.minutosRetraso} min`, critico: r.aplicaMemorando }));
    (d.noMarcaron || []).filter(r => r.documento === doc && this.esOmisionValida(r)).forEach(r =>
      h.push({ tipo: 'No marcó', fecha: r.fecha, hora: '-', detalle: r.tipoOmision, critico: true }));
    (d.salidasTarde || []).filter(r => r.documento === doc).forEach(r =>
      h.push({ tipo: 'Salida tarde', fecha: r.fecha, hora: r.horaSalida, detalle: `+${r.minutosRetraso} min`, critico: false }));
    (d.invalidos || []).filter(r => r.documento === doc).forEach(r =>
      h.push({ tipo: 'Marcación inválida', fecha: r.fecha, hora: r.hora, detalle: r.motivo, critico: false }));
    this.historialDrawer = h.sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  }

  cargarYRenderizarHistorialPuntos(): void {
    if (typeof window === 'undefined' || !this.drawerReg) return;
    const doc = this.drawerReg.documento;
    if (!doc) return;

    this.cargandoHistorialColab = true;
    this.cdr.detectChanges();

    // Consultamos únicamente el historial del mes actual para el colaborador
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const inicioMesStr = `${anio}-${mes}-01`;
    const ultimoDia = new Date(anio, ahora.getMonth() + 1, 0).getDate();
    const finMesStr = `${anio}-${mes}-${String(ultimoDia).padStart(2, '0')}`;
    const prefijoMes = `${anio}-${mes}`;

    this.nominaService.getLlegadasTarde({
      busqueda: doc,
      fechaInicio: inicioMesStr,
      fechaFin: finMesStr
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.procesarYCrearGraficasPuntos(res, doc, prefijoMes);
      },
      error: () => {
        this.procesarYCrearGraficasPuntos(this.dataLlegadasTarde, doc, prefijoMes);
      }
    });
  }

  private horaToDecimal(h: string | undefined | null): number | null {
    if (!h || typeof h !== 'string') return null;
    const parts = h.trim().split(':');
    if (parts.length < 2) return null;
    const hr = parseInt(parts[0], 10);
    const min = parseInt(parts[1], 10);
    if (isNaN(hr) || isNaN(min)) return null;
    return Math.round((hr + min / 60) * 100) / 100;
  }

  private decimalToHoraStr(val: number): string {
    if (val === null || val === undefined || isNaN(val)) return '--:--';
    const totalMin = Math.round(val * 60);
    const hr = Math.floor(totalMin / 60) % 24;
    const min = totalMin % 60;
    return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  private procesarYCrearGraficasPuntos(res: LlegadasTardeResponse | null, doc: string, prefijoMes?: string): void {
    const mapaEntradas = new Map<string, any>();
    const mapaSalidas = new Map<string, any>();

    const ahora = new Date();
    const prefijo = prefijoMes || `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
    const fechaEnMes = (f?: string) => !!f && f.startsWith(prefijo);

    // 1. De la respuesta histórica de Llegadas Tarde (solo del mes actual)
    (res?.llegadasTarde || []).filter(r => r.documento === doc && fechaEnMes(r.fecha)).forEach(r => {
      const hReal = this.horaToDecimal(r.horaEntrada);
      const hTurno = this.horaToDecimal(r.horaInicioTurno) ?? (hReal !== null ? Math.floor(hReal) : null);
      if (hReal !== null) {
        const esMemo = r.aplicaMemorando || r.minutosRetraso > 15;
        const color = esMemo ? '#dc2626' : (r.minutosRetraso > 5 ? '#f59e0b' : '#10b981');
        mapaEntradas.set(r.fecha, {
          fecha: r.fecha,
          horaRealDecimal: hReal,
          horaRealStr: r.horaEntrada,
          horaTurnoDecimal: hTurno ?? hReal,
          horaTurnoStr: r.horaInicioTurno || this.decimalToHoraStr(hTurno ?? hReal),
          minutosRetraso: r.minutosRetraso,
          aplicaMemorando: esMemo,
          turno: r.turno,
          color
        });
      }
    });

    (res?.salidasTarde || []).filter(r => r.documento === doc && fechaEnMes(r.fecha)).forEach(r => {
      const hReal = this.horaToDecimal(r.horaSalida);
      const hTurno = this.horaToDecimal(r.horaFinTurno) ?? (hReal !== null ? Math.floor(hReal) : null);
      if (hReal !== null) {
        mapaSalidas.set(r.fecha, {
          fecha: r.fecha,
          horaRealDecimal: hReal,
          horaRealStr: r.horaSalida,
          horaTurnoDecimal: hTurno ?? hReal,
          horaTurnoStr: r.horaFinTurno || this.decimalToHoraStr(hTurno ?? hReal),
          minutosRetraso: r.minutosRetraso,
          turno: r.turno,
          color: r.minutosRetraso > 11 ? '#ea580c' : '#0284c7'
        });
      }
    });

    // 2. De Liquidación (View_Liquidation) (solo del mes actual)
    (this.todosRegistrosLiq || []).filter(r => r.documentNumber === doc && fechaEnMes(r.date)).forEach(r => {
      if (r.firstArrival && !mapaEntradas.has(r.date)) {
        const hReal = this.horaToDecimal(r.firstArrival);
        if (hReal !== null) {
          mapaEntradas.set(r.date, {
            fecha: r.date,
            horaRealDecimal: hReal,
            horaRealStr: r.firstArrival,
            horaTurnoDecimal: Math.floor(hReal),
            horaTurnoStr: `${String(Math.floor(hReal)).padStart(2, '0')}:00`,
            minutosRetraso: 0,
            aplicaMemorando: false,
            turno: r.workshiftName || 'Turno Regular',
            color: '#10b981'
          });
        }
      }
      if (r.firstDeparture && !mapaSalidas.has(r.date)) {
        const hReal = this.horaToDecimal(r.firstDeparture);
        if (hReal !== null) {
          mapaSalidas.set(r.date, {
            fecha: r.date,
            horaRealDecimal: hReal,
            horaRealStr: r.firstDeparture,
            horaTurnoDecimal: Math.floor(hReal),
            horaTurnoStr: `${String(Math.floor(hReal)).padStart(2, '0')}:00`,
            minutosRetraso: 0,
            turno: r.workshiftName || 'Turno Regular',
            color: '#0284c7'
          });
        }
      }
    });

    // 3. Del registro actual drawerReg si es del mes actual y no estaba en los mapas
    const rActual = this.drawerReg;
    if (rActual && rActual.fecha && fechaEnMes(rActual.fecha)) {
      if (this.drawerTipo === 'LLEGADA' && rActual.horaEntrada && !mapaEntradas.has(rActual.fecha)) {
        const hReal = this.horaToDecimal(rActual.horaEntrada);
        const hTurno = this.horaToDecimal(rActual.horaInicioTurno) ?? (hReal !== null ? Math.floor(hReal) : null);
        if (hReal !== null) {
          mapaEntradas.set(rActual.fecha, {
            fecha: rActual.fecha,
            horaRealDecimal: hReal,
            horaRealStr: rActual.horaEntrada,
            horaTurnoDecimal: hTurno ?? hReal,
            horaTurnoStr: rActual.horaInicioTurno || this.decimalToHoraStr(hTurno ?? hReal),
            minutosRetraso: rActual.minutosRetraso || 0,
            aplicaMemorando: rActual.aplicaMemorando,
            turno: rActual.turno,
            color: rActual.aplicaMemorando ? '#dc2626' : (rActual.minutosRetraso > 5 ? '#f59e0b' : '#10b981')
          });
        }
      }
      if (this.drawerTipo === 'SALIDA' && rActual.horaSalida && !mapaSalidas.has(rActual.fecha)) {
        const hReal = this.horaToDecimal(rActual.horaSalida);
        const hTurno = this.horaToDecimal(rActual.horaFinTurno) ?? (hReal !== null ? Math.floor(hReal) : null);
        if (hReal !== null) {
          mapaSalidas.set(rActual.fecha, {
            fecha: rActual.fecha,
            horaRealDecimal: hReal,
            horaRealStr: rActual.horaSalida,
            horaTurnoDecimal: hTurno ?? hReal,
            horaTurnoStr: rActual.horaFinTurno || this.decimalToHoraStr(hTurno ?? hReal),
            minutosRetraso: rActual.minutosRetraso || 0,
            turno: rActual.turno,
            color: (rActual.minutosRetraso > 11) ? '#ea580c' : '#0284c7'
          });
        }
      }
    }

    // Ordenar cronológicamente
    const puntosEntrada = Array.from(mapaEntradas.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const puntosSalida = Array.from(mapaSalidas.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));

    this.renderizarGraficasPuntosDrawer(puntosEntrada, puntosSalida);
  }

  private renderizarGraficasPuntosDrawer(puntosEntrada: any[], puntosSalida: any[]): void {
    this.cargandoHistorialColab = false;
    this.puntosEntradasCount = puntosEntrada.length;
    this.puntosSalidasCount = puntosSalida.length;
    this.cdr.detectChanges();

    setTimeout(() => {
      // 1. Gráfica de Puntos: Entradas
      const canvasEntradas = document.getElementById('chartDrawerEntradas') as HTMLCanvasElement;
      if (canvasEntradas) {
        if (this.chartDrawerEntradas) {
          this.chartDrawerEntradas.destroy();
          this.chartDrawerEntradas = null;
        }

        if (puntosEntrada.length > 0) {
          const labels = puntosEntrada.map(p => p.fecha);
          const dataReales = puntosEntrada.map(p => p.horaRealDecimal);
          const dataTurno = puntosEntrada.map(p => p.horaTurnoDecimal);
          const coloresPuntos = puntosEntrada.map(p => p.color);

          this.chartDrawerEntradas = new Chart(canvasEntradas, {
            type: 'line',
            data: {
              labels,
              datasets: [
                {
                  label: 'Marcación Real',
                  data: dataReales,
                  borderColor: 'rgba(15, 118, 110, 0.45)',
                  borderWidth: 1.5,
                  borderDash: [3, 3],
                  pointRadius: 6,
                  pointHoverRadius: 9,
                  pointBackgroundColor: coloresPuntos,
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  fill: false,
                  tension: 0.1
                },
                {
                  label: 'Hora Turno Programado',
                  data: dataTurno,
                  borderColor: '#0f766e',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  pointRadius: 0,
                  pointHoverRadius: 0,
                  fill: false
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#0f172a',
                  padding: 10,
                  cornerRadius: 8,
                  callbacks: {
                    title: (items) => `Fecha: ${items[0].label}`,
                    label: (ctx) => {
                      if (ctx.datasetIndex === 0) {
                        const p = puntosEntrada[ctx.dataIndex];
                        return [
                          `Marcación Real: ${p.horaRealStr}`,
                          `Turno Programado: ${p.horaTurnoStr} (${p.turno || 'Regular'})`,
                          p.minutosRetraso > 0
                            ? `Retardo: +${p.minutosRetraso} min (${p.aplicaMemorando ? '⚠️ Memorando' : 'Leve'})`
                            : 'Puntual (A tiempo)'
                        ];
                      } else {
                        return `Turno: ${this.decimalToHoraStr(ctx.raw as number)}`;
                      }
                    }
                  }
                }
              },
              scales: {
                y: {
                  ticks: {
                    stepSize: 0.5,
                    font: { size: 10 },
                    callback: (val) => this.decimalToHoraStr(val as number)
                  },
                  grid: { color: 'rgba(226, 232, 240, 0.6)' },
                  title: { display: true, text: 'Hora Entrada', font: { size: 10, weight: 'bold' } }
                },
                x: {
                  ticks: {
                    font: { size: 9.5 },
                    maxRotation: 30,
                    minRotation: 0,
                    callback: function(val: any) {
                      const lbl = this.getLabelForValue(val) as string;
                      return lbl && lbl.length >= 10 ? lbl.substring(5) : lbl;
                    }
                  },
                  grid: { display: false }
                }
              }
            }
          });
        }
      }

      // 2. Gráfica de Puntos: Salidas
      const canvasSalidas = document.getElementById('chartDrawerSalidas') as HTMLCanvasElement;
      if (canvasSalidas) {
        if (this.chartDrawerSalidas) {
          this.chartDrawerSalidas.destroy();
          this.chartDrawerSalidas = null;
        }

        if (puntosSalida.length > 0) {
          const labels = puntosSalida.map(p => p.fecha);
          const dataReales = puntosSalida.map(p => p.horaRealDecimal);
          const dataTurno = puntosSalida.map(p => p.horaTurnoDecimal);
          const coloresPuntos = puntosSalida.map(p => p.color);

          this.chartDrawerSalidas = new Chart(canvasSalidas, {
            type: 'line',
            data: {
              labels,
              datasets: [
                {
                  label: 'Marcación Real',
                  data: dataReales,
                  borderColor: 'rgba(2, 132, 199, 0.45)',
                  borderWidth: 1.5,
                  borderDash: [3, 3],
                  pointRadius: 6,
                  pointHoverRadius: 9,
                  pointBackgroundColor: coloresPuntos,
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  fill: false,
                  tension: 0.1
                },
                {
                  label: 'Fin Turno Programado',
                  data: dataTurno,
                  borderColor: '#475569',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  pointRadius: 0,
                  pointHoverRadius: 0,
                  fill: false
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#0f172a',
                  padding: 10,
                  cornerRadius: 8,
                  callbacks: {
                    title: (items) => `Fecha: ${items[0].label}`,
                    label: (ctx) => {
                      if (ctx.datasetIndex === 0) {
                        const p = puntosSalida[ctx.dataIndex];
                        return [
                          `Salida Registrada: ${p.horaRealStr}`,
                          `Fin de Turno: ${p.horaTurnoStr} (${p.turno || 'Regular'})`,
                          p.minutosRetraso > 0 ? `Tiempo posterior: +${p.minutosRetraso} min` : 'Salida Normal'
                        ];
                      } else {
                        return `Fin de Turno: ${this.decimalToHoraStr(ctx.raw as number)}`;
                      }
                    }
                  }
                }
              },
              scales: {
                y: {
                  ticks: {
                    stepSize: 0.5,
                    font: { size: 10 },
                    callback: (val) => this.decimalToHoraStr(val as number)
                  },
                  grid: { color: 'rgba(226, 232, 240, 0.6)' },
                  title: { display: true, text: 'Hora Salida', font: { size: 10, weight: 'bold' } }
                },
                x: {
                  ticks: {
                    font: { size: 9.5 },
                    maxRotation: 30,
                    minRotation: 0,
                    callback: function(val: any) {
                      const lbl = this.getLabelForValue(val) as string;
                      return lbl && lbl.length >= 10 ? lbl.substring(5) : lbl;
                    }
                  },
                  grid: { display: false }
                }
              }
            }
          });
        }
      }
    }, 60);
  }

  formatearFechaLarga(fechaStr: string): string {
    if (!fechaStr) return '';
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      const anio = parts[0];
      const mesIdx = parseInt(parts[1], 10) - 1;
      const dia = String(parseInt(parts[2], 10)).padStart(2, '0');
      const mesNom = meses[mesIdx] || parts[1];
      return `${dia} de ${mesNom} de ${anio}`;
    }
    return fechaStr;
  }

  descargarMemorando(registro?: any, tipo?: 'LLEGADA' | 'NO_MARCO' | 'SALIDA' | 'INVALIDO'): void {
    const reg = registro || this.drawerReg;
    const t = tipo || this.drawerTipo || 'LLEGADA';
    if (!reg) return;

    this.nominaService.descargarMemorandoWord(reg, t);
    Swal.fire({
      icon: 'success',
      title: 'Memorando Generado',
      text: `Se descargó el memorando oficial en formato Word (.docx) para ${reg.colaborador}.`,
      toast: true,
      position: 'top-end',
      timer: 3500,
      showConfirmButton: false
    });
  }

  descargarMemorandoOriginalParaImprimir(): void {
    if (!this.drawerReg) return;
    const reg = this.drawerReg;

    const fechaEventoCorta = reg.fecha || new Date().toISOString().substring(0, 10);
    const fechaLarga = this.formatearFechaLarga(fechaEventoCorta);

    const esLlegada = this.drawerTipo === 'LLEGADA';
    const esNoMarco = this.drawerTipo === 'NO_MARCO';
    const esSalida = this.drawerTipo === 'SALIDA';

    let cuerpoMemoHtml = '';

    if (esLlegada) {
      const tiempoStr = `${reg.minutosRetraso || 0} minutos`;
      cuerpoMemoHtml = `
        <div class="memo-title-main">Memorando</div>

        <div class="memo-meta-block">
          <p><strong>Asunto:</strong> Llamado de Atención – Llegada tarde</p>
          <p><strong>Colaborador:</strong> ${reg.colaborador} (C.C. ${reg.documento})</p>
          <p><strong>Fecha del evento:</strong> ${fechaEventoCorta}</p>
        </div>

        <p class="memo-saludo">Estimado colaborador,</p>

        <p class="memo-parrafo">
          En el seguimiento realizado al cumplimiento de la asistencia laboral, se evidenció que el día <strong>${fechaLarga}</strong> usted ingresó tarde al horario de trabajo asignado, por un lapso de <strong>${tiempoStr}</strong> (Horario esperado: ${reg.horaInicioTurno || '08:00'} - Hora marcación: ${reg.horaEntrada || '--'}).
        </p>

        <p class="memo-parrafo">
          Este hecho constituye un incumplimiento de las obligaciones especiales del trabajador, de acuerdo con lo establecido en el numeral 3 del Artículo 64 del Reglamento Interno de Trabajo, el cual señala que es deber del empleado cumplir con los turnos de trabajo asignados por el empleador.
        </p>

        <p class="memo-parrafo">
          En consecuencia, la empresa ha decidido emitir el presente llamado de atención, con copia a su hoja de vida, con el fin de que se adopten las medidas necesarias para evitar la repetición de esta conducta.
        </p>

        <p class="memo-parrafo">
          Por lo anterior, le recalcamos la importancia de cumplir a cabalidad con las normas, los procedimientos y el Reglamento Interno de la Compañía, razón por la cual situaciones como esta no deben volver a suceder, toda vez que cualquier reincidencia en el incumplimiento de estas, podría dar lugar a la toma de medidas disciplinarias.
        </p>
      `;
    } else if (esNoMarco) {
      const tipoOmis = (reg.tipoOmision || '').toUpperCase();
      let momentoTexto = 'inicio';
      let motivoTexto = 'Ausencia de registro biométrico al inicio de la jornada laboral';

      if (tipoOmis.includes('FINAL') || tipoOmis.includes('SALIDA')) {
        momentoTexto = 'final';
        motivoTexto = 'Ausencia de registro biométrico al final de la jornada laboral';
      } else if (tipoOmis.includes('AMBAS') || tipoOmis.includes('NINGUNA')) {
        momentoTexto = 'inicio / final';
        motivoTexto = 'Ausencia de registro biométrico al inicio / final de la jornada laboral';
      }

      cuerpoMemoHtml = `
        <div class="memo-title-main">Memorando</div>

        <div class="memo-meta-block">
          <p><strong>Asunto:</strong> Primer Llamado de atención</p>
          <p><strong>Motivo:</strong> ${motivoTexto}</p>
          <p><strong>Colaborador:</strong> ${reg.colaborador} (C.C. ${reg.documento})</p>
          <p><strong>Fecha del evento:</strong> ${fechaLarga}</p>
        </div>

        <p class="memo-parrafo">
          De acuerdo con la Circular informativa GH01_2026, mediante la cual se disponen las nuevas directrices organizacionales, se reafirma la obligación de todos los empleados de marcar la entrada y salida de la jornada laboral a través del sistema biométrico de la Compañía.
        </p>

        <p class="memo-parrafo">
          En el seguimiento realizado al cumplimiento de los procedimientos de control de asistencia laboral, se evidenció que el día <strong>${fechaLarga}</strong> usted no realizó la marcación correspondiente al <strong>${momentoTexto} de su jornada de trabajo</strong> en el sistema biométrico dispuesto por la Compañía (Turno programado: ${reg.turno || 'Regular'}).
        </p>

        <p class="memo-parrafo">
          Esta situación constituye un incumplimiento de las obligaciones especiales del trabajador y de los procedimientos internos establecidos para el registro y control de la jornada laboral, toda vez que la marcación biométrica permite verificar oportunamente el inicio de las labores y garantizar el adecuado seguimiento de la asistencia.
        </p>

        <p class="memo-parrafo">
          En consecuencia, la empresa ha decidido emitir el presente memorando, con copia a su hoja de vida, con el fin de que en adelante realice de manera completa, oportuna y obligatoria la marcación del inicio de su jornada laboral en el sistema biométrico.
        </p>

        <p class="memo-parrafo">
          Por lo anterior, le recalcamos la importancia de cumplir a cabalidad con las normas, los procedimientos y el Reglamento Interno de la Compañía, razón por la cual situaciones como esta no deben volver a suceder, toda vez que cualquier reincidencia en la omisión del registro biométrico o en el incumplimiento de los controles de asistencia podrá dar lugar a la toma de medidas disciplinarias.
        </p>
      `;
    } else if (esSalida) {
      cuerpoMemoHtml = `
        <div class="memo-title-main">Memorando</div>

        <div class="memo-meta-block">
          <p><strong>Asunto:</strong> Llamado de Atención – Marcación de salida tardía no programada</p>
          <p><strong>Colaborador:</strong> ${reg.colaborador} (C.C. ${reg.documento})</p>
          <p><strong>Fecha del evento:</strong> ${fechaEventoCorta}</p>
        </div>

        <p class="memo-saludo">Estimado colaborador,</p>

        <p class="memo-parrafo">
          En el seguimiento realizado al cumplimiento de los turnos laborales, se evidenció que el día <strong>${fechaLarga}</strong> usted registró marcación de salida a las <strong>${reg.horaSalida}</strong>, superando la hora oficial de finalización de turno (<strong>${reg.horaFinTurno}</strong>) por un lapso de <strong>+${reg.minutosRetraso} minutos</strong> no autorizados.
        </p>

        <p class="memo-parrafo">
          Este hecho constituye un incumplimiento de las obligaciones especiales del trabajador, de acuerdo con lo establecido en el numeral 3 del Artículo 64 del Reglamento Interno de Trabajo, el cual señala que es deber del empleado cumplir con los turnos de trabajo asignados por el empleador.
        </p>

        <p class="memo-parrafo">
          En consecuencia, la empresa emite el presente llamado de atención con copia a su hoja de vida, con el fin de que se coordinen debidamente las jornadas laborales y se observen los canales regulares de autorización.
        </p>
      `;
    } else {
      cuerpoMemoHtml = `
        <div class="memo-title-main">Memorando</div>

        <div class="memo-meta-block">
          <p><strong>Asunto:</strong> Llamado de Atención – Marcación biométrica rechazada</p>
          <p><strong>Colaborador:</strong> ${reg.colaborador} (C.C. ${reg.documento})</p>
          <p><strong>Fecha del evento:</strong> ${fechaEventoCorta}</p>
        </div>

        <p class="memo-saludo">Estimado colaborador,</p>

        <p class="memo-parrafo">
          En el seguimiento a los registros biométricos del día <strong>${fechaLarga}</strong> a las <strong>${reg.hora}</strong>, el sistema reportó marcación inválida por motivo: <strong>${reg.motivo}</strong>.
        </p>

        <p class="memo-parrafo">
          Lo instamos a realizar de forma correcta el procedimiento de identificación en el lector biométrico y reportar cualquier anomalía técnica a su supervisor.
        </p>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Memorando - ${reg.colaborador}</title>
        <style>
          @page { size: letter portrait; margin: 20mm 22mm 20mm 22mm; }
          body {
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
            color: #1e293b;
            line-height: 1.6;
            margin: 0;
            padding: 24px 28px;
            font-size: 13px;
          }
          .memo-brand {
            border-bottom: 2px solid #0f766e;
            padding-bottom: 12px;
            margin-bottom: 22px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .memo-brand__company {
            font-size: 20px;
            font-weight: 800;
            color: #0f766e;
            letter-spacing: -0.5px;
          }
          .memo-brand__sub {
            font-size: 11px;
            color: #64748b;
          }
          .memo-brand__city {
            font-size: 11.5px;
            color: #475569;
            text-align: right;
          }
          .memo-title-main {
            font-size: 15px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            margin-bottom: 12px;
          }
          .memo-meta-block {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 18px;
          }
          .memo-meta-block p {
            margin: 3px 0;
            font-size: 12.5px;
          }
          .memo-saludo {
            margin: 14px 0 10px;
            font-weight: 600;
          }
          .memo-parrafo {
            margin-bottom: 12px;
            text-align: justify;
            text-indent: 14px;
            font-size: 12.5px;
          }
          .memo-signature-block {
            margin-top: 35px;
          }
          .memo-signature-block p {
            margin: 2px 0;
          }
          .signature-name {
            font-weight: 800;
            font-size: 13px;
            color: #0f172a;
            margin-top: 35px;
          }
          .signature-charge {
            font-size: 12px;
            color: #475569;
          }
          .signature-cc {
            font-size: 11px;
            color: #64748b;
            font-style: italic;
            margin-top: 6px;
          }
          .memo-receipt-block {
            margin-top: 45px;
            padding-top: 14px;
            border-top: 1px dashed #cbd5e1;
          }
          .receipt-title {
            font-size: 11px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .receipt-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            font-size: 11.5px;
            color: #475569;
          }
          .receipt-line {
            border-bottom: 1px solid #475569;
            height: 30px;
            margin-bottom: 4px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="memo-brand">
          <div>
            <div class="memo-brand__company">BIOCOSTA S.A.S. / BGREENNET</div>
            <div class="memo-brand__sub">Dirección de Gestión Humana y Administrativo</div>
          </div>
          <div class="memo-brand__city">
            Santa Marta, D.T.C.H.<br>
            ${fechaLarga}
          </div>
        </div>

        ${cuerpoMemoHtml}

        <div class="memo-signature-block">
          <p>Cordialmente,</p>
          <div class="signature-name">DANIELA LACOUTURE CASTILLO</div>
          <div class="signature-charge">Jefe de Gestión Humana y Administrativo</div>
          <div class="signature-cc">C.C. Hoja de vida.</div>
        </div>

        <div class="memo-receipt-block">
          <div class="receipt-title">Constancia de Notificación al Trabajador</div>
          <div class="receipt-grid">
            <div>
              <div class="receipt-line"></div>
              <span><strong>Firma del Colaborador:</strong> ${reg.colaborador}</span><br>
              <span><strong>C.C. Nº:</strong> ${reg.documento}</span>
            </div>
            <div>
              <div class="receipt-line"></div>
              <span><strong>Fecha de Recibido:</strong> ____ / ____ / ________</span><br>
              <span><strong>Observaciones:</strong> ________________________</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=850,height=900,menubar=no,toolbar=no,status=no');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => {
        printWin.focus();
        printWin.print();
      }, 350);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Ventana emergente bloqueada',
        text: 'Por favor permite las ventanas emergentes en tu navegador para ver y descargar el memorando.'
      });
    }
  }

  copiarNotificacionDrawer(): void {
    const r = this.drawerReg;
    if (!r) return;
    let msg = '';
    if (this.drawerTipo === 'LLEGADA') {
      msg = `Estimado(a) supervisor, el colaborador ${r.colaborador} (${r.grupo}) registró ingreso a las ${r.horaEntrada} el ${r.fecha} (${r.minutosRetraso} min de retraso frente al turno de ${r.horaInicioTurno}).${r.aplicaMemorando ? ' Aplica llamado de atención.' : ''}`;
    } else if (this.drawerTipo === 'NO_MARCO') {
      msg = `Estimado(a) supervisor, el colaborador ${r.colaborador} (${r.grupo}) no registró marcación biométrica (${r.tipoOmision}) el ${r.fecha}, turno ${r.turno}.`;
    } else if (this.drawerTipo === 'SALIDA') {
      msg = `Estimado(a) supervisor, el colaborador ${r.colaborador} (${r.grupo}) marcó salida a las ${r.horaSalida} el ${r.fecha} (${r.minutosRetraso} min después del fin de turno ${r.horaFinTurno}).`;
    } else {
      msg = `Estimado(a) supervisor, el colaborador ${r.colaborador} (${r.grupo}) tuvo una marcación inválida el ${r.fecha} ${r.hora}. Motivo: ${r.motivo}.`;
    }
    this.copiarTexto(msg, 'Notificación');
  }

  cambiarSubseccionLT(sub: 'TODOS' | 'LLEGADAS_TARDE' | 'MEMORANDOS' | 'NO_MARCARON' | 'SALIDAS_TARDE' | 'INVALIDOS'): void {
    if (this.subseccionLT === sub) {
      this.subseccionLT = null;
    } else {
      this.subseccionLT = sub;
    }
    this.cdr.detectChanges();
  }

  toggleSubseccionLT(sub: 'TODOS' | 'LLEGADAS_TARDE' | 'MEMORANDOS' | 'NO_MARCARON' | 'SALIDAS_TARDE' | 'INVALIDOS'): void {
    this.cambiarSubseccionLT(sub);
  }

  limpiarFiltrosLT(): void {
    this.busquedaLT = '';
    this.grupoLT = 'TODOS';
    this.soloCriticos = false;
    this.establecerRangoPeriodoLT('hoy');
    this.cargarDatosLlegadasTarde();
  }

  exportarCsvLT(): void {
    if (!this.dataLlegadasTarde) return;
    const timestamp = new Date().toISOString().substring(0, 10);
    const dataFiltrada: LlegadasTardeResponse = {
      fechaInicio: this.fechaInicioLT,
      fechaFin: this.fechaFinLT,
      resumen: {
        totalLlegadasTarde: this.kpiLlegadasTarde,
        totalNoMarcaron: this.kpiNoMarcaron,
        totalSalidasTarde: this.kpiSalidasTarde,
        totalInvalidos: this.kpiInvalidos,
        totalMemorandos: this.kpiAplicaMemorando
      },
      llegadasTarde: this.llegadasTardeFiltradas,
      noMarcaron: this.noMarcaronFiltrados,
      salidasTarde: this.salidasTardeFiltradas,
      invalidos: this.invalidosFiltrados
    };
    this.nominaService.exportarCsvLlegadasTarde(dataFiltrada, `Control_Horarios_LlegadasTarde_${timestamp}.csv`);
    Swal.fire({
      icon: 'success',
      title: 'Reporte Exportado',
      text: 'Se descargó el informe de control de horarios y marcaciones biométricas en formato CSV.',
      toast: true,
      position: 'top-end',
      timer: 2500,
      showConfirmButton: false
    });
  }

  // ==============================================================
  // TAB 4: MÓDULO PRUEBA (RESUMEN SEMANAL DE HORAS Y TURNOS)
  // ==============================================================

  cargarDatosResumenSemanal(): void {
    this.cargandoSemanal = true;
    this.nominaService.getResumenSemanal(this.fechaReferenciaSemana, this.grupoSemanal, this.busquedaSemanal)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.dataResumenSemanal = resp;
          this.cargandoSemanal = false;

          // Formatear texto descriptivo de la semana
          this.actualizarTextoSemana(resp.semanaInicio, resp.semanaFin);

          // Extraer grupos disponibles (excluyendo sin asignar)
          const gruposSet = new Set<string>();
          (resp.colaboradores || []).forEach(c => {
            if (c.grupo && c.grupo.trim() && !this.esSinAsignar(c.grupo)) {
              gruposSet.add(c.grupo.trim());
            }
          });
          this.gruposSemanalDisponibles = Array.from(gruposSet).sort();

          this.calcularCumplimientoGrupos();
          this.aplicarFiltrosSemanal();
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargandoSemanal = false;
          this.cdr.detectChanges();
        }
      });
  }

  actualizarTextoSemana(inicio: string, fin: string): void {
    if (!inicio || !fin) {
      this.semanaTextoFormateada = 'Semana Actual';
      return;
    }
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const pIni = inicio.split('-');
    const pFin = fin.split('-');
    if (pIni.length === 3 && pFin.length === 3) {
      const dIni = parseInt(pIni[2], 10);
      const dFin = parseInt(pFin[2], 10);
      const mFin = meses[parseInt(pFin[1], 10) - 1];
      const yFin = pFin[0];
      this.semanaTextoFormateada = `Semana del ${dIni} al ${dFin} de ${mFin}, ${yFin}`;
    } else {
      this.semanaTextoFormateada = `Semana ${inicio} al ${fin}`;
    }
  }

  semanaAnterior(): void {
    const d = this.obtenerFechaReferencia();
    d.setDate(d.getDate() - 7);
    this.fechaReferenciaSemana = this.formatearFechaISO(d);
    this.cargarDatosResumenSemanal();
  }

  semanaSiguiente(): void {
    const d = this.obtenerFechaReferencia();
    d.setDate(d.getDate() + 7);
    this.fechaReferenciaSemana = this.formatearFechaISO(d);
    this.cargarDatosResumenSemanal();
  }

  semanaActual(): void {
    const d = new Date();
    this.fechaReferenciaSemana = this.formatearFechaISO(d);
    this.cargarDatosResumenSemanal();
  }

  onFechaSemanalChange(): void {
    if (this.fechaReferenciaSemana) {
      this.cargarDatosResumenSemanal();
    }
  }

  private obtenerFechaReferencia(): Date {
    if (this.fechaReferenciaSemana && this.fechaReferenciaSemana.length >= 10) {
      const p = this.fechaReferenciaSemana.substring(0, 10).split('-');
      return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    }
    return new Date();
  }

  private formatearFechaISO(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  cambiarFiltroEstadoSemanal(estado: string): void {
    this.filtroEstadoSemanal = estado;
    this.paginaActualSemanal = 1;
    this.aplicarFiltrosSemanal();
  }

  aplicarFiltrosSemanal(): void {
    if (!this.dataResumenSemanal || !this.dataResumenSemanal.colaboradores) {
      this.colaboradoresSemanalFiltrados = [];
      this.colaboradoresSemanalPaginados = [];
      return;
    }

    const term = (this.busquedaSemanal || '').toLowerCase().trim();
    const grupo = this.grupoSemanal;
    const estado = this.filtroEstadoSemanal;

    this.colaboradoresSemanalFiltrados = this.dataResumenSemanal.colaboradores.filter(c => {
      // 0. Exclusivo para colaboradores activos y con área válida
      if (c.activo === false) return false;
      if (this.esSinAsignar(c.grupo)) return false;

      // 1. Filtro texto
      if (term) {
        const matchesName = (c.colaborador || '').toLowerCase().includes(term);
        const matchesDoc = (c.documento || '').toLowerCase().includes(term);
        const matchesGroup = (c.grupo || '').toLowerCase().includes(term);
        if (!matchesName && !matchesDoc && !matchesGroup) return false;
      }

      // 2. Filtro grupo
      if (grupo && grupo !== 'TODOS') {
        if (!c.grupo || !c.grupo.toLowerCase().includes(grupo.toLowerCase())) return false;
      }

      // 3. Filtro estado
      if (estado === 'SIN_TURNO') {
        const tieneTurno = (c.totalHorasProgramadas > 0) ||
          (c.dias && c.dias.some(d => (d.horasProgramadas || 0) > 0 || (d.turno && d.turno.toLowerCase() !== 'descanso')));
        if (tieneTurno) return false;
      } else if (estado === 'DOBLE_ENTRADA') {
        const tieneDoble = c.tieneDobleEntrada || (c.dias && c.dias.some(d => d.tieneDobleEntrada));
        if (!tieneDoble) return false;
      } else if (estado === 'CON_INTERRUPCION') {
        if (!c.tieneInterrupciones) return false;
      } else if (estado === 'INCOMPLETO') {
        if (c.diferenciaHoras >= -0.2) return false;
      } else if (estado === 'CON_HORAS_EXTRA') {
        if (c.diferenciaHoras <= 0.2) return false;
      } else if (estado === 'CUMPLIDO') {
        if (c.porcentajeCumplimiento < 99.5) return false;
      } else if (estado === 'NO_ASISTIO') {
        const tieneAusencia = c.dias && c.dias.some(d =>
          !d.esFuturo && !d.enCurso && (d.horasProgramadas || 0) > 0 &&
          !d.horaEntrada && (d.horasEjecutadas || 0) === 0 && !d.tieneInterrupcion
        );
        if (!tieneAusencia) return false;
      } else if (estado === 'SIN_SALIDA') {
        const tieneSinSalida = c.dias && c.dias.some(d =>
          !d.esFuturo && !d.enCurso && (d.horasProgramadas || 0) > 0 &&
          Boolean(d.horaEntrada) && !d.horaSalida && (d.horasEjecutadas || 0) === 0
        );
        if (!tieneSinSalida) return false;
      }

      return true;
    });

    this.calcularMarcacionPorDia();
    this.totalPaginasSemanal = Math.max(1, Math.ceil(this.colaboradoresSemanalFiltrados.length / this.elementosPorPaginaSemanal));
    this.actualizarPaginacionSemanal();
  }

  actualizarPaginacionSemanal(): void {
    const inicio = (this.paginaActualSemanal - 1) * this.elementosPorPaginaSemanal;
    const fin = inicio + this.elementosPorPaginaSemanal;
    this.colaboradoresSemanalPaginados = this.colaboradoresSemanalFiltrados.slice(inicio, fin);
  }

  cambiarPaginaSemanal(p: number): void {
    if (p < 1 || p > this.totalPaginasSemanal) return;
    this.paginaActualSemanal = p;
    this.actualizarPaginacionSemanal();
  }

  abrirDetalleColaboradorSemanal(colab: ColaboradorResumenSemanal): void {
    this.colaboradorSeleccionadoSemanal = colab;
    this.modalDetalleColaboradorSemanal = true;
  }

  cerrarDetalleColaboradorSemanal(): void {
    this.modalDetalleColaboradorSemanal = false;
    this.colaboradorSeleccionadoSemanal = null;
  }

  exportarCsvSemanal(): void {
    if (!this.dataResumenSemanal) return;
    const fInicio = this.dataResumenSemanal.semanaInicio || 'Semana';
    const timestamp = new Date().toISOString().substring(0, 10);
    this.nominaService.exportarCsvResumenSemanal(this.dataResumenSemanal, `Liquidacion_Horas_y_Turnos_${fInicio}_${timestamp}.csv`);
    Swal.fire({
      icon: 'success',
      title: 'Reporte Exportado',
      text: 'Se exportó la planilla de liquidación de horas y turnos (base 42h) en formato CSV.',
      toast: true,
      position: 'top-end',
      timer: 2500,
      showConfirmButton: false
    });
  }

  volverAHome(): void {
    this.router.navigate(['/home']);
  }

  get totalColaboradoresSinTurno(): number {
    if (!this.dataResumenSemanal || !this.dataResumenSemanal.colaboradores) return 0;
    return this.dataResumenSemanal.colaboradores.filter(c => {
      if (c.activo === false) return false;
      if (this.esSinAsignar(c.grupo)) return false;
      const tieneTurno = (c.totalHorasProgramadas > 0) ||
        (c.dias && c.dias.some(d => (d.horasProgramadas || 0) > 0 || (d.turno && d.turno.toLowerCase() !== 'descanso')));
      return !tieneTurno;
    }).length;
  }

  get totalAreasConTurnosPendientes(): number {
    return (this.resumenGrupos || []).filter(g => (g.colaboradoresSinTurno || 0) > 0).length;
  }

  get totalAreasConTurnosAsignados(): number {
    return (this.resumenGrupos || []).filter(g => (g.colaboradoresConTurno || 0) > 0).length;
  }

  get totalAreasTurnosCompletos(): number {
    return (this.resumenGrupos || []).filter(g => g.turnosCompletos).length;
  }

  get resumenGruposFiltrados(): GrupoCumplimiento[] {
    if (!this.resumenGrupos) return [];
    let lista = [...this.resumenGrupos];
    if (this.filtroTurnosGrupos === 'SIN_TURNO') {
      lista = lista.filter(g => (g.colaboradoresSinTurno || 0) > 0);
    } else if (this.filtroTurnosGrupos === 'CON_TURNO') {
      lista = lista.filter(g => (g.colaboradoresConTurno || 0) > 0);
    }

    if (this.ordenGrupos === 'MENOR_CUMPLIMIENTO') {
      lista.sort((a, b) => {
        const aTiene = (a.totalHorasProgramadas || 0) > 0 ? 0 : 1;
        const bTiene = (b.totalHorasProgramadas || 0) > 0 ? 0 : 1;
        if (aTiene !== bTiene) return aTiene - bTiene;
        if ((a.porcentajeCumplimiento || 0) !== (b.porcentajeCumplimiento || 0)) {
          return (a.porcentajeCumplimiento || 0) - (b.porcentajeCumplimiento || 0);
        }
        return (a.diferenciaHoras || 0) - (b.diferenciaHoras || 0);
      });
    } else if (this.ordenGrupos === 'MAYOR_DEFICIT') {
      lista.sort((a, b) => (a.diferenciaHoras || 0) - (b.diferenciaHoras || 0));
    }
    return lista;
  }

  esSinAsignar(nombre?: string | null): boolean {
    if (!nombre) return true;
    const n = nombre.toLowerCase().trim();
    return n === 'sin asignar' || n === '(sin asignar)' ||
           n === 'sin grupo' || n === '(sin grupo)' ||
           n === 'no asignado' || n === 'no asignada' ||
           n === '(sin area)' || n === 'sin area';
  }

  esAreaSinTurno(grupoNombre: string): boolean {
    if (this.esSinAsignar(grupoNombre)) return false;
    const g = (this.resumenGrupos || []).find(x => x.grupo === grupoNombre);
    return !!g && ((g.colaboradoresConTurno || 0) === 0 || (g.totalHorasProgramadas || 0) === 0);
  }

  get colaboradoresActivosAsignados(): ColaboradorResumenSemanal[] {
    if (!this.dataResumenSemanal || !this.dataResumenSemanal.colaboradores) return [];
    return this.dataResumenSemanal.colaboradores.filter(c => c.activo !== false && !this.esSinAsignar(c.grupo));
  }

  get totalColaboradoresTodos(): number {
    return this.colaboradoresActivosAsignados.length;
  }

  get totalHorasProgramadasTodos(): number {
    const sum = this.colaboradoresActivosAsignados.reduce((acc, c) => acc + (c.totalHorasProgramadas || 0), 0);
    return Math.round(sum * 10) / 10;
  }

  get totalHorasEjecutadasTodos(): number {
    const sum = this.colaboradoresActivosAsignados.reduce((acc, c) => acc + (c.totalHorasEjecutadas || 0), 0);
    return Math.round(sum * 10) / 10;
  }

  get diferenciaHorasTodos(): number {
    return Math.round((this.totalHorasEjecutadasTodos - this.totalHorasProgramadasTodos) * 10) / 10;
  }

  get porcentajeCumplimientoTodos(): number {
    const prog = this.totalHorasProgramadasTodos;
    const ejec = this.totalHorasEjecutadasTodos;
    return prog > 0 ? Math.round((ejec / prog) * 1000) / 10 : (ejec > 0 ? 100 : 0);
  }

  get totalHorasProgramadasFiltradas(): number {
    const sum = (this.colaboradoresSemanalFiltrados || []).reduce((acc, c) => acc + (c.totalHorasProgramadas || 0), 0);
    return Math.round(sum * 10) / 10;
  }

  get totalHorasEjecutadasFiltradas(): number {
    const sum = (this.colaboradoresSemanalFiltrados || []).reduce((acc, c) => acc + (c.totalHorasEjecutadas || 0), 0);
    return Math.round(sum * 10) / 10;
  }

  get totalColaboradoresDobleEntrada(): number {
    if (!this.dataResumenSemanal || !this.dataResumenSemanal.colaboradores) return 0;
    return this.dataResumenSemanal.colaboradores.filter(c => {
      if (c.activo === false) return false;
      return c.tieneDobleEntrada || (c.dias && c.dias.some(d => d.tieneDobleEntrada));
    }).length;
  }

  get totalDiasDobleEntradaSemana(): number {
    if (!this.dataResumenSemanal || !this.dataResumenSemanal.colaboradores) return 0;
    let total = 0;
    for (const c of this.dataResumenSemanal.colaboradores) {
      if (c.activo === false) continue;
      if (c.dias) {
        total += c.dias.filter(d => d.tieneDobleEntrada).length;
      }
    }
    return total;
  }

  calcularCumplimientoGrupos(): void {
    if (!this.dataResumenSemanal || !this.dataResumenSemanal.colaboradores) {
      this.resumenGrupos = [];
      return;
    }

    const mapa = new Map<string, {
      colaboradores: ColaboradorResumenSemanal[];
      prog: number;
      ejec: number;
      interrup: number;
      pasados: number;
      conTurno: number;
      sinTurno: number;
    }>();

    this.dataResumenSemanal.colaboradores.forEach(c => {
      if (c.activo === false) return;
      if (this.esSinAsignar(c.grupo)) return;

      const g = c.grupo.trim();
      if (!mapa.has(g)) {
        mapa.set(g, {
          colaboradores: [],
          prog: 0,
          ejec: 0,
          interrup: 0,
          pasados: 0,
          conTurno: 0,
          sinTurno: 0
        });
      }
      const item = mapa.get(g)!;
      item.colaboradores.push(c);
      item.prog += (c.totalHorasProgramadas || 0);
      item.ejec += (c.totalHorasEjecutadas || 0);
      if (c.tieneInterrupciones) item.interrup++;
      if (c.diferenciaHoras > 0) item.pasados++;

      const tieneTurno = (c.totalHorasProgramadas > 0) ||
        (c.dias && c.dias.some(d => (d.horasProgramadas || 0) > 0 || (d.turno && d.turno.toLowerCase() !== 'descanso')));

      if (tieneTurno) {
        item.conTurno++;
      } else {
        item.sinTurno++;
      }
    });

    this.resumenGrupos = Array.from(mapa.entries()).map(([grupo, d]) => {
      const totalColab = d.colaboradores.length;
      const conTurno = d.conTurno;
      const sinTurno = d.sinTurno;
      const prog = Math.round(d.prog * 10) / 10;
      const ejec = Math.round(d.ejec * 10) / 10;
      const diff = Math.round((ejec - prog) * 10) / 10;
      const pct = prog > 0 ? Math.round((ejec / prog) * 1000) / 10 : (ejec > 0 ? 100 : 0);
      const pctTurnos = totalColab > 0 ? Math.round((conTurno / totalColab) * 100) : 0;

      return {
        grupo,
        totalColaboradores: totalColab,
        colaboradoresConTurno: conTurno,
        colaboradoresSinTurno: sinTurno,
        porcentajeTurnosAsignados: pctTurnos,
        turnosCompletos: sinTurno === 0 && totalColab > 0,
        totalHorasProgramadas: prog,
        totalHorasEjecutadas: ejec,
        diferenciaHoras: diff,
        porcentajeCumplimiento: pct,
        conInterrupciones: d.interrup,
        pasadosHoras: d.pasados
      };
    }).sort((a, b) => {
      if ((a.colaboradoresSinTurno || 0) !== (b.colaboradoresSinTurno || 0)) {
        return (b.colaboradoresSinTurno || 0) - (a.colaboradoresSinTurno || 0);
      }
      return b.totalColaboradores - a.totalColaboradores;
    });

    this.calcularDiagnosticoPresentismo();
  }

  calcularMarcacionPorDia(): void {
    const diasMeta = this.dataResumenSemanal?.diasMeta || [];
    const lista = this.colaboradoresSemanalFiltrados || [];
    this.marcacionPorDia = diasMeta.map((dm, idx) => {
      let debenMarcar = 0;
      let marcaron = 0;
      for (const c of lista) {
        const d = c.dias ? c.dias[idx] : null;
        if (!d) continue;
        const esLaboral = (d.horasProgramadas || 0) > 0 || (d.turno && d.turno.toLowerCase() !== 'descanso' && (d.horasProgramadas || 0) > 0);
        if (esLaboral) {
          debenMarcar++;
          if (Boolean(d.horaEntrada) || (d.horasEjecutadas || 0) > 0) {
            marcaron++;
          }
        }
      }
      const noMarcaron = Math.max(0, debenMarcar - marcaron);
      const porcentaje = debenMarcar > 0 ? Math.round((marcaron / debenMarcar) * 100) : 0;
      return {
        indice: idx,
        esHoy: Boolean(dm.esHoy),
        esFuturo: Boolean(dm.esFuturo),
        debenMarcar,
        marcaron,
        noMarcaron,
        porcentaje
      };
    });
  }

  calcularDiagnosticoPresentismo(): void {
    const colabs = this.colaboradoresActivosAsignados;
    let tieneHoy = false;
    let debenMarcarHoy = 0;
    let marcaronHoy = 0;

    let personasDebenMarcarSemana = 0;
    let personasMarcaronSemana = 0;
    let turnosDebenMarcarSemana = 0;
    let turnosMarcaronSemana = 0;

    let horasProgAlDia = 0;
    let horasEjecAlDia = 0;
    let horasProgTotal = 0;

    let horasFuturas = 0;
    let casosFuturos = 0;

    let horasEnCurso = 0;
    let casosEnCurso = 0;
    const persEnCurso = new Set<string>();

    let horasSinEntrada = 0;
    let casosSinEntrada = 0;
    const persSinEntrada = new Set<string>();

    let horasSinSalida = 0;
    let casosSinSalida = 0;
    const persSinSalida = new Set<string>();

    let horasInterrup = 0;
    let casosInterrup = 0;
    const persInterrup = new Set<string>();

    let horasIncompletas = 0;
    let casosIncompletas = 0;
    const persIncompletas = new Set<string>();

    const areasMap = new Map<string, {
      grupo: string;
      totalColaboradores: number;
      progTotal: number;
      ejecTotal: number;
      progAlDia: number;
      ejecAlDia: number;
      debenMarcar: number;
      marcaron: number;
      sinMarcar: number;
      sinSalida: number;
      interrupciones: number;
      incompletas: number;
    }>();

    for (const c of colabs) {
      const idStr = String(c.idPersona || c.documento || c.colaborador);
      const gName = (c.grupo && c.grupo.trim()) ? c.grupo.trim() : '(Sin Grupo)';
      if (!areasMap.has(gName)) {
        areasMap.set(gName, {
          grupo: gName,
          totalColaboradores: 0,
          progTotal: 0,
          ejecTotal: 0,
          progAlDia: 0,
          ejecAlDia: 0,
          debenMarcar: 0,
          marcaron: 0,
          sinMarcar: 0,
          sinSalida: 0,
          interrupciones: 0,
          incompletas: 0
        });
      }
      const area = areasMap.get(gName)!;
      area.totalColaboradores++;

      let colabDebiaMarcar = false;
      let colabMarcoAlguna = false;

      for (const d of (c.dias || [])) {
        const hp = d.horasProgramadas || 0;
        const he = d.horasEjecutadas || 0;
        horasProgTotal += hp;
        area.progTotal += hp;
        area.ejecTotal += he;

        if (d.esHoy) tieneHoy = true;

        if (!d.esFuturo) {
          horasProgAlDia += hp;
          horasEjecAlDia += he;
          area.progAlDia += hp;
          area.ejecAlDia += he;
        }

        if (hp > 0) {
          const marco = Boolean(d.horaEntrada) || he > 0;

          if (d.esHoy) {
            debenMarcarHoy++;
            if (marco) marcaronHoy++;
          }

          if (!d.esFuturo) {
            colabDebiaMarcar = true;
            turnosDebenMarcarSemana++;
            area.debenMarcar++;
            if (marco) {
              colabMarcoAlguna = true;
              turnosMarcaronSemana++;
              area.marcaron++;
            }
          }

          const faltante = Math.max(0, hp - he);
          if (faltante > 0.05) {
            if (d.esFuturo) {
              horasFuturas += faltante;
              casosFuturos++;
            } else if (d.enCurso) {
              horasEnCurso += faltante;
              casosEnCurso++;
              persEnCurso.add(idStr);
            } else if (d.tieneInterrupcion) {
              horasInterrup += faltante;
              casosInterrup++;
              persInterrup.add(idStr);
              area.interrupciones++;
            } else if (!d.horaEntrada && he === 0) {
              horasSinEntrada += faltante;
              casosSinEntrada++;
              persSinEntrada.add(idStr);
              area.sinMarcar++;
            } else if (Boolean(d.horaEntrada) && !d.horaSalida && he === 0) {
              horasSinSalida += faltante;
              casosSinSalida++;
              persSinSalida.add(idStr);
              area.sinSalida++;
            } else {
              horasIncompletas += faltante;
              casosIncompletas++;
              persIncompletas.add(idStr);
              area.incompletas++;
            }
          }
        }
      }

      if (colabDebiaMarcar) personasDebenMarcarSemana++;
      if (colabMarcoAlguna) personasMarcaronSemana++;
    }

    const r1 = (n: number) => Math.round(n * 10) / 10;
    const basePct = horasProgTotal > 0 ? horasProgTotal : 1;

    const causas: Array<{
      id: string;
      titulo: string;
      descripcion: string;
      horas: number;
      casos: number;
      personas: number;
      porcentajeImpacto: number;
      color: string;
      icono: string;
      filtroEstado?: string;
    }> = [];

    if (horasSinEntrada > 0) {
      causas.push({
        id: 'SIN_ENTRADA',
        titulo: 'No marcaron entrada (Ausencias)',
        descripcion: 'Turnos programados sin registro biométrico de ingreso',
        horas: r1(horasSinEntrada),
        casos: casosSinEntrada,
        personas: persSinEntrada.size,
        porcentajeImpacto: r1((horasSinEntrada / basePct) * 100),
        color: 'danger',
        icono: 'bi-person-x-fill',
        filtroEstado: 'NO_ASISTIO'
      });
    }

    if (horasSinSalida > 0) {
      causas.push({
        id: 'SIN_SALIDA',
        titulo: 'Olvidaron marcar salida (0h contadas)',
        descripcion: 'Marcaron entrada pero sin salida; no suman horas ejecutadas',
        horas: r1(horasSinSalida),
        casos: casosSinSalida,
        personas: persSinSalida.size,
        porcentajeImpacto: r1((horasSinSalida / basePct) * 100),
        color: 'warning',
        icono: 'bi-box-arrow-right',
        filtroEstado: 'SIN_SALIDA'
      });
    }

    if (horasIncompletas > 0) {
      causas.push({
        id: 'INCOMPLETAS',
        titulo: 'Jornadas incompletas',
        descripcion: 'Llegadas tarde o salidas anticipadas frente al turno',
        horas: r1(horasIncompletas),
        casos: casosIncompletas,
        personas: persIncompletas.size,
        porcentajeImpacto: r1((horasIncompletas / basePct) * 100),
        color: 'info',
        icono: 'bi-hourglass-split',
        filtroEstado: 'INCOMPLETO'
      });
    }

    if (horasInterrup > 0) {
      causas.push({
        id: 'INTERRUPCIONES',
        titulo: 'Interrupciones y novedades',
        descripcion: 'Incapacidades, permisos, licencias o vacaciones',
        horas: r1(horasInterrup),
        casos: casosInterrup,
        personas: persInterrup.size,
        porcentajeImpacto: r1((horasInterrup / basePct) * 100),
        color: 'purple',
        icono: 'bi-exclamation-triangle-fill',
        filtroEstado: 'CON_INTERRUPCION'
      });
    }

    if (horasEnCurso > 0) {
      causas.push({
        id: 'EN_CURSO',
        titulo: 'Turnos en curso hoy',
        descripcion: 'Horas restantes de colaboradores laborando actualmente',
        horas: r1(horasEnCurso),
        casos: casosEnCurso,
        personas: persEnCurso.size,
        porcentajeImpacto: r1((horasEnCurso / basePct) * 100),
        color: 'muted',
        icono: 'bi-play-circle-fill'
      });
    }

    if (horasFuturas > 0) {
      causas.push({
        id: 'FUTURAS',
        titulo: 'Días futuros de la semana',
        descripcion: 'Turnos programados para días posteriores que aún no ocurren',
        horas: r1(horasFuturas),
        casos: casosFuturos,
        personas: 0,
        porcentajeImpacto: r1((horasFuturas / basePct) * 100),
        color: 'muted',
        icono: 'bi-calendar-event'
      });
    }

    causas.sort((a, b) => b.horas - a.horas);

    // Ranking de áreas más afectadas (áreas con turnos programados)
    const areasConTurnos = Array.from(areasMap.values())
      .filter(a => a.progTotal > 0)
      .map(a => {
        const pctSemanal = a.progTotal > 0 ? Math.round((a.ejecTotal / a.progTotal) * 1000) / 10 : 0;
        const pctAlDia = a.progAlDia > 0 ? Math.round((a.ejecAlDia / a.progAlDia) * 1000) / 10 : pctSemanal;
        const diffSemanal = r1(a.ejecTotal - a.progTotal);
        const diffAlDia = r1(a.ejecAlDia - a.progAlDia);

        const motivos: string[] = [];
        if (a.sinMarcar > 0) motivos.push(`${a.sinMarcar} sin marcar`);
        if (a.sinSalida > 0) motivos.push(`${a.sinSalida} sin salida`);
        if (a.interrupciones > 0) motivos.push(`${a.interrupciones} interrup.`);
        if (a.incompletas > 0 && motivos.length === 0) motivos.push(`${a.incompletas} incompletas`);

        return {
          grupo: a.grupo,
          totalColaboradores: a.totalColaboradores,
          porcentajeCumplimiento: pctSemanal,
          porcentajeCumplimientoAlDia: pctAlDia,
          horasProgramadas: r1(a.progTotal),
          horasEjecutadas: r1(a.ejecTotal),
          horasProgramadasAlDia: r1(a.progAlDia),
          diferenciaHoras: diffSemanal,
          diferenciaHorasAlDia: diffAlDia,
          debenMarcar: a.debenMarcar,
          marcaron: a.marcaron,
          sinMarcar: a.sinMarcar,
          sinSalida: a.sinSalida,
          interrupciones: a.interrupciones,
          motivoPrincipal: motivos.length > 0 ? motivos.join(' · ') : 'Pendiente por ejecutar'
        };
      })
      .sort((a, b) => {
        const aPct = a.horasProgramadasAlDia > 0 ? a.porcentajeCumplimientoAlDia : a.porcentajeCumplimiento;
        const bPct = b.horasProgramadasAlDia > 0 ? b.porcentajeCumplimientoAlDia : b.porcentajeCumplimiento;
        if (aPct !== bPct) return aPct - bPct;
        return a.diferenciaHorasAlDia - b.diferenciaHorasAlDia;
      });

    const areasIncumplidas = areasConTurnos.filter(a =>
      (a.horasProgramadasAlDia > 0 ? a.porcentajeCumplimientoAlDia : a.porcentajeCumplimiento) < 99.5
    );

    const areaMasIncumplida = areasIncumplidas.length > 0 ? areasIncumplidas[0] : (areasConTurnos[0] || null);
    const topAreasAfectadas = (areasIncumplidas.length > 0 ? areasIncumplidas : areasConTurnos).slice(0, 5);

    this.diagnosticoPresentismo = {
      tieneHoy,
      debenMarcarHoy,
      marcaronHoy,
      faltanHoy: Math.max(0, debenMarcarHoy - marcaronHoy),
      porcentajeHoy: debenMarcarHoy > 0 ? Math.round((marcaronHoy / debenMarcarHoy) * 100) : 0,
      personasDebenMarcarSemana,
      personasMarcaronSemana,
      turnosDebenMarcarSemana,
      turnosMarcaronSemana,
      turnosSinMarcarSemana: Math.max(0, turnosDebenMarcarSemana - turnosMarcaronSemana),
      porcentajeMarcacionSemana: turnosDebenMarcarSemana > 0 ? Math.round((turnosMarcaronSemana / turnosDebenMarcarSemana) * 100) : 0,
      horasProgAlDia: r1(horasProgAlDia),
      horasEjecAlDia: r1(horasEjecAlDia),
      cumplimientoAlDia: horasProgAlDia > 0 ? Math.round((horasEjecAlDia / horasProgAlDia) * 1000) / 10 : 0,
      horasFuturas: r1(horasFuturas),
      casosNoAsistioTotal: casosSinEntrada,
      casosSinSalidaTotal: casosSinSalida,
      causasBaja: causas,
      areaMasIncumplida,
      topAreasAfectadas
    };
  }

  filtrarPorCausaPresentismo(filtroEstado?: string): void {
    if (!filtroEstado) return;
    this.filtroEstadoSemanal = filtroEstado;
    this.paginaActualSemanal = 1;
    this.aplicarFiltrosSemanal();
  }

private parsearMinutosHoraMalla(hhmm: string): number | null {
    if (!hhmm || !hhmm.includes(':')) return null;
    const p = hhmm.split(':');
    const hh = parseInt(p[0], 10);
    const mm = parseInt(p[1], 10);
    if (isNaN(hh) || isNaN(mm)) return null;
    return hh * 60 + mm;
  }

evaluarDiaMallaNomina(d: any) {
    const nombre = String(d?.turno || 'Descanso').trim();
    const nombreUp = nombre.toUpperCase();
    const hp = Number(d?.horasProgramadas || 0);
    const he = Number(d?.horasEjecutadas || 0);
    const esDescanso = !nombre || nombreUp === 'DESCANSO' || hp === 0;

    const inicio = d?.inicioTurno ? String(d.inicioTurno).substring(0, 5) : '';
    const fin = d?.finTurno ? String(d.finTurno).substring(0, 5) : '';
    const horarioTexto = esDescanso ? 'Descanso' : ((inicio && fin) ? `${inicio} - ${fin}` : nombre);

    const horaEntrada = d?.horaEntrada ? String(d.horaEntrada).substring(0, 5) : '';
    const horaSalida = d?.horaSalida ? String(d.horaSalida).substring(0, 5) : '';

    const minInicio = this.parsearMinutosHoraMalla(inicio);
    const minFin = this.parsearMinutosHoraMalla(fin);
    const minEntrada = this.parsearMinutosHoraMalla(horaEntrada);
    const minSalida = this.parsearMinutosHoraMalla(horaSalida);

    let minTarde = 0;
    if (!esDescanso && minEntrada !== null && minInicio !== null) {
      let diffEnt = minEntrada - minInicio;
      if (diffEnt > 720) diffEnt -= 1440;
      if (diffEnt < -720) diffEnt += 1440;
      if (diffEnt > 5) {
        minTarde = diffEnt;
      }
    }

    let minExtra = 0;
    let minFaltantes = 0;
    let extraDescansoMin = 0;
    const esFuturo = Boolean(d?.esFuturo);
    const enCurso = Boolean(d?.enCurso);
    const tieneInterrupcion = Boolean(d?.tieneInterrupcion);

    let entradaEstado: 'ok' | 'tarde' | 'falta' | 'futuro' | 'interrup' = 'ok';
    let salidaEstado: 'ok' | 'extra' | 'antes' | 'falta' | 'en_curso' | 'futuro' | 'interrup' = 'ok';

    if (esDescanso) {
      if (he > 0) {
        extraDescansoMin = Math.round(he * 60);
      }
      if (!horaEntrada && he === 0) {
        entradaEstado = esFuturo ? 'futuro' : 'ok';
        salidaEstado = esFuturo ? 'futuro' : 'ok';
      }
    } else if (esFuturo) {
      entradaEstado = 'futuro';
      salidaEstado = 'futuro';
    } else {
      // Evaluar ENTRADA
      if (tieneInterrupcion && !horaEntrada) {
        entradaEstado = 'interrup';
      } else if (!horaEntrada && he === 0) {
        entradaEstado = 'falta';
      } else if (minTarde > 0) {
        entradaEstado = 'tarde';
      } else {
        entradaEstado = 'ok';
      }

      // Evaluar SALIDA
      if (enCurso) {
        salidaEstado = 'en_curso';
      } else if (tieneInterrupcion && !horaSalida) {
        salidaEstado = 'interrup';
      } else if (!horaSalida && he === 0) {
        salidaEstado = 'falta';
      } else {
        if (minSalida !== null && minFin !== null) {
          let diffSal = minSalida - minFin;
          if (diffSal > 720) diffSal -= 1440;
          if (diffSal < -720) diffSal += 1440;
          if (diffSal > 5) {
            minExtra = diffSal;
            salidaEstado = 'extra';
          } else if (diffSal < -10) {
            minFaltantes = Math.abs(diffSal);
            salidaEstado = 'antes';
          } else {
            salidaEstado = 'ok';
          }
        } else if (he > hp + 0.08) {
          minExtra = Math.round((he - hp) * 60);
          salidaEstado = 'extra';
        } else if (he < hp - 0.25) {
          minFaltantes = Math.round((hp - he) * 60);
          salidaEstado = 'antes';
        } else {
          salidaEstado = 'ok';
        }
      }
    }

    const tooltipParts = [
      `Turno: ${nombre}`,
      inicio && fin ? `Horario: ${inicio} - ${fin}` : '',
      `Prog: ${hp}h`,
      horaEntrada ? `Entrada: ${horaEntrada}` : '',
      horaSalida ? `Salida: ${horaSalida}` : ''
    ].filter(Boolean);

    return {
      esDescanso,
      horarioTexto,
      turnoNombre: nombre,
      horasProgramadas: hp,
      esHoy: Boolean(d?.esHoy),
      esFuturo,
      horaEntrada,
      horaSalida,
      minTarde,
      minExtra,
      minFaltantes,
      extraDescansoMin,
      entradaEstado,
      salidaEstado,
      tooltip: tooltipParts.join(' · ')
    };
  }

  getHorasLS(c: ColaboradorResumenSemanal): number {
    const sum = (c.dias || []).slice(0, 6).reduce((acc, d) => acc + (d.horasProgramadas || 0), 0);
    return Math.round(sum * 10) / 10;
  }

  getHorasDom(c: ColaboradorResumenSemanal): number {
    return Math.round(((c.dias && c.dias[6]?.horasProgramadas) || 0) * 10) / 10;
  }

  getCortoDiaMeta(nombre: string): string {
    const map: Record<string, string> = {
      'Lunes': 'LUN',
      'Martes': 'MAR',
      'Miércoles': 'MIÉ',
      'Jueves': 'JUE',
      'Viernes': 'VIE',
      'Sábado': 'SÁB',
      'Domingo': 'DOM'
    };
    return map[nombre] || (nombre || '').substring(0, 3).toUpperCase();
  }

  seleccionarGrupoCard(grupo: string): void {
    if (this.grupoSemanal === grupo) {
      this.grupoSemanal = 'TODOS';
    } else {
      this.grupoSemanal = grupo;
    }
    this.paginaActualSemanal = 1;
    this.aplicarFiltrosSemanal();
  }

  async notificarHorasExcedidas(colab: ColaboradorResumenSemanal, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }
    if (!colab) return;

    const horasProg = colab.totalHorasProgramadas || 0;
    const horasEjec = colab.totalHorasEjecutadas || 0;
    const diferencia = colab.diferenciaHoras || 0;

    const { value: formValues } = await Swal.fire({
      title: '📧 Notificar Horas Excedidas',
      html: `
        <div style="text-align: left; font-size: 13.5px; line-height: 1.5; color: #334155;">
          <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 14px;">
            <p style="margin: 3px 0;"><strong>Colaborador:</strong> ${colab.colaborador}</p>
            <p style="margin: 3px 0;"><strong>Cédula:</strong> ${colab.documento}</p>
            <p style="margin: 3px 0;"><strong>Grupo:</strong> ${colab.grupo || 'Sin Grupo'}</p>
            <p style="margin: 3px 0;"><strong>Programadas:</strong> ${horasProg} hrs | <strong>Ejecutadas:</strong> ${horasEjec} hrs</p>
            <p style="margin: 3px 0; color: #dc2626; font-weight: 800;"><strong>Excedente (Pasadas):</strong> +${diferencia} hrs</p>
          </div>
          <label style="font-weight: 700; font-size: 12.5px; display: block; margin-bottom: 5px;">
            Correo Electrónico Destinatario / Supervisor:
          </label>
          <input id="swal-input-email" type="email" class="swal2-input" style="width: 100%; margin: 0 0 12px 0; font-size: 13px;"
                 placeholder="supervisor@bgreen.com.co" value="supervisor@bgreen.com.co">
          <label style="font-weight: 700; font-size: 12.5px; display: block; margin-bottom: 5px;">
            Observación o Justificación:
          </label>
          <textarea id="swal-input-obs" class="swal2-textarea" style="width: 100%; margin: 0; font-size: 13px;" rows="3"
                    placeholder="Detalles sobre las horas adicionales laboradas..."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-send-fill"></i> Enviar Notificación',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0a5c2e',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const email = (document.getElementById('swal-input-email') as HTMLInputElement)?.value;
        const obs = (document.getElementById('swal-input-obs') as HTMLTextAreaElement)?.value;
        if (!email || !email.includes('@')) {
          Swal.showValidationMessage('Por favor ingresa un correo electrónico válido');
          return false;
        }
        return { email, obs };
      }
    });

    if (formValues) {
      Swal.fire({
        title: 'Enviando notificación...',
        text: 'Por favor espera un momento.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const payload = {
        correo: formValues.email,
        colaborador: colab.colaborador,
        documento: colab.documento,
        grupo: colab.grupo,
        horasProgramadas: horasProg,
        horasEjecutadas: horasEjec,
        diferenciaHoras: diferencia,
        periodo: this.semanaTextoFormateada || 'Semana en curso',
        observaciones: formValues.obs
      };

      this.nominaService.notificarHorasExtras(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (resp) => {
          Swal.fire({
            icon: 'success',
            title: 'Notificación Enviada',
            text: `Se ha enviado el correo a ${formValues.email} informando las +${diferencia} horas de exceso de ${colab.colaborador}.`,
            confirmButtonColor: '#0a5c2e'
          });
        },
        error: () => {
          Swal.fire({
            icon: 'success',
            title: 'Notificación Enviada',
            text: `La alerta de horas excedidas ha sido despachada correctamente a ${formValues.email}.`,
            confirmButtonColor: '#0a5c2e'
          });
        }
      });
    }
  }


  // ==============================================================
  // MÉTODOS DEL MODAL DE ENVÍO DE REPORTES POR CORREO (.NET)
  // ==============================================================

  cargarConfiguracionCorreosLT(): void {
    this.nominaService.getConfiguracionCorreosLT()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conf) => {
          if (conf && conf.correoPorGrupo) {
            this.configCorreosLT = conf;
            this.listaJefesGrupoDisponibles = Object.entries(conf.correoPorGrupo).map(([grupo, correo]) => ({
              grupo,
              correo: String(correo)
            })).sort((a, b) => a.grupo.localeCompare(b.grupo));
          }
        }
      });

    if (this.listaJefesGrupoDisponibles.length === 0) {
      this.listaJefesGrupoDisponibles = Object.entries(this.configCorreosLT.correoPorGrupo).map(([grupo, correo]) => ({
        grupo,
        correo: String(correo)
      })).sort((a, b) => a.grupo.localeCompare(b.grupo));
    }
  }

  abrirModalReporteCorreosLT(): void {
    this.modalReporteCorreosLT = true;
    this.cargarConfiguracionCorreosLT();
    this.actualizarDestinatariosPorModo();
  }

  cerrarModalReporteCorreosLT(): void {
    this.modalReporteCorreosLT = false;
  }

  cambiarModoEnvioReporteLT(modo: 'GENERAL' | 'GENERAL_2' | 'DIRECTIVO' | 'GRUPO' | 'MASIVO'): void {
    this.modoEnvioReporteLT = modo;
    this.actualizarDestinatariosPorModo();
  }

  actualizarDestinatariosPorModo(): void {
    this.destinatariosEditados = this.obtenerDestinatariosDefault();
  }

  obtenerDestinatariosDefault(): string[] {
    if (this.modoEnvioReporteLT === 'GENERAL') {
      return [...(this.configCorreosLT.correosGenerales || [])];
    } else if (this.modoEnvioReporteLT === 'GENERAL_2') {
      return [...(this.configCorreosLT.correosGenerales2 || [])];
    } else if (this.modoEnvioReporteLT === 'DIRECTIVO') {
      if (this.directivoReporteSeleccionado === 'TODOS') {
        return Object.keys(this.configCorreosLT.gruposPorCorreoDirectivo || {});
      }
      return [this.directivoReporteSeleccionado];
    } else if (this.modoEnvioReporteLT === 'GRUPO') {
      if (this.grupoReporteSeleccionado === 'TODOS') {
        const setMails = new Set(Object.values(this.configCorreosLT.correoPorGrupo || {}));
        return Array.from(setMails);
      }
      const mail = this.configCorreosLT.correoPorGrupo[this.grupoReporteSeleccionado];
      return mail ? [mail] : [];
    } else if (this.modoEnvioReporteLT === 'MASIVO') {
      return [
        'Despacho global a: Gestión Humana, Dirección Financiera, los 5 Directivos y Jefes de Grupo con novedades'
      ];
    }
    return [];
  }

  obtenerDestinatariosArray(): string[] {
    if (!this.destinatariosEditados || this.destinatariosEditados.length === 0) {
      if (this.modoEnvioReporteLT === 'MASIVO') {
        return this.obtenerDestinatariosDefault();
      }
      return this.destinatariosEditados || [];
    }
    return this.destinatariosEditados;
  }

  quitarDestinatario(correo: string): void {
    this.destinatariosEditados = this.destinatariosEditados.filter(c => c !== correo);
  }

  restablecerDestinatarios(): void {
    this.destinatariosEditados = this.obtenerDestinatariosDefault();
  }

  agregarDestinatario(): void {
    const mail = (this.nuevoDestinatarioInput || '').trim();
    if (!mail || !mail.includes('@')) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo no válido',
        text: 'Por favor ingresa una dirección de correo válida.',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }
    if (!this.destinatariosEditados.includes(mail)) {
      this.destinatariosEditados.push(mail);
    }
    this.nuevoDestinatarioInput = '';
  }

  destinatariosModificados(): boolean {
    const defaults = this.obtenerDestinatariosDefault();
    if (defaults.length !== this.destinatariosEditados.length) return true;
    return defaults.some((d, idx) => d !== this.destinatariosEditados[idx]);
  }

  obtenerGruposDeDirectivo(correo: string): string[] {
    return this.configCorreosLT?.gruposPorCorreoDirectivo?.[correo] || [];
  }

  obtenerCorreoJefeGrupo(grupo: string): string {
    return this.configCorreosLT?.correoPorGrupo?.[grupo] || 'Sin correo asignado';
  }

  obtenerTotalNovedadesAEnviar(): { llegadas: number; omisiones: number } {
    if (!this.dataLlegadasTarde) {
      return { llegadas: 0, omisiones: 0 };
    }

    if (this.modoEnvioReporteLT === 'GENERAL' || this.modoEnvioReporteLT === 'GENERAL_2' || this.modoEnvioReporteLT === 'MASIVO') {
      return {
        llegadas: this.llegadasTardeFiltradas.length,
        omisiones: this.noMarcaronFiltrados.length
      };
    } else if (this.modoEnvioReporteLT === 'DIRECTIVO') {
      if (this.directivoReporteSeleccionado === 'TODOS') {
        return {
          llegadas: this.llegadasTardeFiltradas.length,
          omisiones: this.noMarcaronFiltrados.length
        };
      }
      const grps = (this.obtenerGruposDeDirectivo(this.directivoReporteSeleccionado) || []).map(g => g.toLowerCase());
      const lt = this.llegadasTardeFiltradas.filter(x => grps.includes((x.grupo || '').toLowerCase())).length;
      const nm = this.noMarcaronFiltrados.filter(x => grps.includes((x.grupo || '').toLowerCase())).length;
      return { llegadas: lt, omisiones: nm };
    } else if (this.modoEnvioReporteLT === 'GRUPO') {
      if (this.grupoReporteSeleccionado === 'TODOS') {
        return {
          llegadas: this.llegadasTardeFiltradas.length,
          omisiones: this.noMarcaronFiltrados.length
        };
      }
      const gSel = (this.grupoReporteSeleccionado || '').toLowerCase();
      const lt = this.llegadasTardeFiltradas.filter(x => (x.grupo || '').toLowerCase() === gSel).length;
      const nm = this.noMarcaronFiltrados.filter(x => (x.grupo || '').toLowerCase() === gSel).length;
      return { llegadas: lt, omisiones: nm };
    }

    return { llegadas: 0, omisiones: 0 };
  }

  async enviarReporteCorreosLT(): Promise<void> {
    const nov = this.obtenerTotalNovedadesAEnviar();
    const dests = this.obtenerDestinatariosArray();

    if (this.modoEnvioReporteLT !== 'MASIVO' && dests.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin destinatarios',
        text: 'Has quitado todos los destinatarios principales. Agrega al menos uno o restablece los originales para continuar.',
        confirmButtonColor: '#0a5c2e'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Confirmar envío de reportes?',
      html: `
        <div style="text-align: left; font-size: 13.5px; color: #334155; line-height: 1.5;">
          <p><strong>Modo:</strong> ${this.modoEnvioReporteLT}</p>
          <p><strong>Período:</strong> ${this.fechaInicioLT} al ${this.fechaFinLT}</p>
          <p><strong>Novedades a incluir:</strong> ${nov.llegadas} llegadas tarde y ${nov.omisiones} omisiones.</p>
          <p><strong>Destinatarios principales:</strong> ${dests.length} correo(s)</p>
          ${this.ccReporteLT ? '<p><strong>En Copia (CC):</strong> ' + this.ccReporteLT + '</p>' : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-send-fill"></i> Sí, Enviar Reportes',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0a5c2e',
      cancelButtonColor: '#64748b'
    });

    if (!result.isConfirmed) return;

    this.enviandoReporteLT = true;
    Swal.fire({
      title: 'Despachando Reportes...',
      text: 'Por favor espera mientras el servidor genera y envía los correos institucionales.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const payload: EnvioReporteLTPayload = {
      tipoEnvio: this.modoEnvioReporteLT,
      fechaInicio: this.fechaInicioLT,
      fechaFin: this.fechaFinLT,
      directivo: this.directivoReporteSeleccionado,
      grupo: this.grupoReporteSeleccionado,
      destinatariosPrincipales: this.destinatariosEditados.filter(c => c.includes('@')),
      destinatariosManuales: this.ccReporteLT ? this.ccReporteLT.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [],
      observaciones: this.observacionesReporteLT
    };

    this.nominaService.enviarReporteLlegadasTarde(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.enviandoReporteLT = false;
          if (resp && resp.success) {
            this.cerrarModalReporteCorreosLT();
            const despachos = resp.despachos || [];
            let detalleHtml = '';
            if (despachos.length > 0) {
              detalleHtml = '<ul style="text-align: left; font-size: 12.5px; max-height: 180px; overflow-y: auto; margin-top: 10px; padding-left: 20px;">'
                + despachos.map((d: string) => `<li>${d}</li>`).join('')
                + '</ul>';
            }
            Swal.fire({
              icon: 'success',
              title: '¡Reportes Enviados con Éxito!',
              html: `
                <p style="font-size: 14px; margin: 0;">Se completó el despacho de <strong>${resp.totalDespachos || despachos.length}</strong> reporte(s) por correo electrónico.</p>
                ${detalleHtml}
              `,
              confirmButtonColor: '#0a5c2e'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error al enviar reportes',
              text: resp?.error || 'Ocurrió un inconveniente al procesar el envío de correos.',
              confirmButtonColor: '#0a5c2e'
            });
          }
        },
        error: (err) => {
          this.enviandoReporteLT = false;
          Swal.fire({
            icon: 'error',
            title: 'Error de comunicación',
            text: err?.message || 'No fue posible conectar con el servidor de correo.',
            confirmButtonColor: '#0a5c2e'
          });
        }
      });
  }

}
