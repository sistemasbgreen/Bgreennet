export interface InterrupcionProgramacion {
  personId: number;
  interruptionId: number;
  positionDescription: string;
  areaName: string;
  groupId: number;
  groupName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  surname?: string;
  fullName?: string;
  documentNumber: string;
  cardNumber?: string;
  employeeTypeId: number;
  date: string; // ISO string o YYYY-MM-DD HH:mm:ss
  endDate: string; // ISO string o YYYY-MM-DD HH:mm:ss
  differenceInHours: number;
  interruptionName: string;
  interruptionAlias?: string;
  companyName: string;
  isAdditionalHour: boolean;
  interruptionTypeId: number;
  defaultTime?: string | number;
  createdDate: string;
  createdBy?: number;
  userLogin?: string;
  userFirstName?: string;
  userLastName?: string;
  userFullName?: string;
  observations?: string;
}

export interface NominaFiltros {
  fechaInicio: string;
  fechaFin: string;
  busqueda: string;
  area: string;
  grupo: string;
  tipoInterrupcion: string;
  empresa: string;
  soloHorasAdicionales: boolean;
}

export interface NominaKpis {
  totalRegistros: number;
  totalHoras: number;
  totalHorasAdicionales: number;
  colaboradoresUnicos: number;
  promedioHorasPorRegistro: number;
  areasAfectadas: number;
}

// ==========================================
// VISTA: View_Liquidation (Liquidación de Horas)
// ==========================================
export interface LiquidacionNomina {
  personId: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  surname?: string;
  fullName: string;
  documentNumber: string;
  cardNumber?: string;
  date: string; // YYYY-MM-DD
  hourtype: string; // Tipo de hora (Ordinaria, Recargo nocturno, Extra diurna, etc.)
  hours: number;
  minutes: number;
  totalTiempoHoras: number; // hours + minutes / 60
  workshiftName: string; // Turno asignado
  firstArrival?: string; // 1ra Entrada
  secondArrival?: string; // 2da Entrada
  firstDeparture?: string; // 1ra Salida
  secondDeparture?: string; // 2da Salida
  dailyWorkingHours: number; // Horas trabajadas en el día
  groupId: number;
  groupName: string;
  interruptionName?: string;
  startDateInterruption?: string;
  endDateInterruption?: string;
  totalInterruptionTime?: string | number;
  payrollNovelties?: string; // Novedades para liquidación contable
}

export interface LiquidacionFiltros {
  fechaInicio: string;
  fechaFin: string;
  busqueda: string;
  tipoHora: string;
  turno: string;
  grupo: string;
  novedadNomina: string;
}

export interface LiquidacionKpis {
  totalRegistros: number;
  totalHorasLiquidadas: number;
  totalHorasDiarias: number;
  colaboradoresUnicos: number;
  turnosUnicos: number;
  promedioHorasPorDia: number;
}

// ==============================================================
// 3. LLEGADAS TARDE & CONTROL DE HORARIOS (InformeTurno)
// ==============================================================

export interface RegistroLlegadaTarde {
  idPersona?: string | number;
  colaborador: string;
  documento: string;
  grupo: string;
  centroCosto: string;
  turno: string;
  fecha: string;
  horaEntrada: string;
  horaInicioTurno: string;
  minutosRetraso: number;
  aplicaMemorando: boolean; // > 15 min
}

export interface RegistroNoMarco {
  idPersona?: string | number;
  colaborador: string;
  documento: string;
  fecha: string;
  turno: string;
  grupo: string;
  centroCosto: string;
  horaInicio?: string;
  horaFin?: string;
  tipoOmision: 'ENTRADA' | 'SALIDA' | 'AMBAS' | string;
}

export interface RegistroSalidaTarde {
  idPersona?: string | number;
  colaborador: string;
  documento: string;
  grupo: string;
  centroCosto: string;
  turno: string;
  fecha: string;
  horaSalida: string;
  horaFinTurno: string;
  minutosRetraso: number;
}

export interface RegistroInvalido {
  idEvento: string;
  idPersona?: string | number;
  colaborador: string;
  documento: string;
  grupo: string;
  centroCosto: string;
  fecha: string;
  hora: string;
  motivo: string;
}

export interface ResumenLlegadasTarde {
  totalLlegadasTarde: number;
  totalNoMarcaron: number;
  totalSalidasTarde: number;
  totalInvalidos: number;
  totalMemorandos: number;
}

export interface LlegadasTardeResponse {
  fechaInicio: string;
  fechaFin: string;
  resumen: ResumenLlegadasTarde;
  llegadasTarde: RegistroLlegadaTarde[];
  noMarcaron: RegistroNoMarco[];
  salidasTarde: RegistroSalidaTarde[];
  invalidos: RegistroInvalido[];
}

export interface LlegadasTardeFiltros {
  fechaInicio: string;
  fechaFin: string;
  grupo: string;
  tipoSeccion: 'TODOS' | 'LLEGADAS_TARDE' | 'NO_MARCARON' | 'SALIDAS_TARDE' | 'INVALIDOS';
  busqueda: string;
}

// ==============================================================
// 4. MÓDULO PRUEBA: RESUMEN SEMANAL PROGRAMADO VS EJECUTADO
// ==============================================================

export interface DiaResumenSemanal {
  indice: number;
  nombreDia: string;
  fecha: string;
  esHoy: boolean;
  esFuturo: boolean;
  turno: string;
  inicioTurno?: string;
  finTurno?: string;
  horasProgramadas: number;
  horasEjecutadas: number;
  almuerzoDescontado?: number;
  horaEntrada?: string;
  horaSalida?: string;
  enCurso: boolean;
  tieneInterrupcion: boolean;
  horasInterrupcion: number;
  interrupcion?: string;
  estado: 'CUMPLIDO' | 'EN_CURSO' | 'INCOMPLETO' | 'CON_HORAS_EXTRA' | 'DESCANSO' | 'EXTRA_DESCANSO' | 'NO_ASISTIO' | 'CON_INTERRUPCION' | 'FUTURO';
  tieneDobleEntrada?: boolean;
  cantidadEntradas?: number;
}

export interface ColaboradorResumenSemanal {
  idPersona: string | number;
  documento: string;
  colaborador: string;
  grupo: string;
  area: string;
  activo?: boolean;
  totalHorasProgramadas: number;
  totalHorasEjecutadas: number;
  diferenciaHoras: number;
  porcentajeCumplimiento: number;
  tieneInterrupciones: boolean;
  totalHorasInterrupciones: number;
  novedadesSemana: string[];
  tieneDobleEntrada?: boolean;
  totalDoblesEntradas?: number;
  dias: DiaResumenSemanal[];
}

export interface ResumenSemanalKpis {
  totalColaboradores: number;
  activo?: boolean;
  totalHorasProgramadas: number;
  totalHorasEjecutadas: number;
  totalHorasInterrupciones: number;
  totalConInterrupciones: number;
  totalColaboradoresDobleEntrada?: number;
  totalDiasDobleEntrada?: number;
  porcentajeCumplimientoGlobal: number;
}

export interface ResumenSemanalResponse {
  semanaInicio: string;
  semanaFin: string;
  diasMeta: any[];
  resumen: ResumenSemanalKpis;
  colaboradores: ColaboradorResumenSemanal[];
}


export interface GrupoCumplimiento {
  grupo: string;
  totalColaboradores: number;
  totalHorasProgramadas: number;
  totalHorasEjecutadas: number;
  diferenciaHoras: number;
  porcentajeCumplimiento: number;
  conInterrupciones: number;
  pasadosHoras: number;
  colaboradoresConTurno?: number;
  colaboradoresSinTurno?: number;
  porcentajeTurnosAsignados?: number;
  turnosCompletos?: boolean;
  [key: string]: any;
}

export interface NotificacionHorasExtrasPayload {
  correo?: string;
  colaborador: string;
  documento: string;
  grupo: string;
  horasProgramadas: number;
  horasEjecutadas: number;
  diferenciaHoras: number;
  periodo?: string;
  observaciones?: string;
}

export interface ConfiguracionCorreosLT {
  correoPorGrupo: { [grupo: string]: string };
  gruposPorCorreoDirectivo: { [correoDirectivo: string]: string[] };
  correosGenerales: string[];
  correosGenerales2: string[];
  idsExcluidos?: string[];
}

export interface EnvioReporteLTPayload {
  tipoEnvio: 'GENERAL' | 'GENERAL_2' | 'DIRECTIVO' | 'GRUPO' | 'MASIVO' | 'PERSONALIZADO';
  fechaInicio: string;
  fechaFin: string;
  directivo?: string;
  grupo?: string;
  destinatariosPrincipales?: string[];
  destinatariosManuales?: string[];
  observaciones?: string;
  asunto?: string;
}
