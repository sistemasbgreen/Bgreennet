export interface EventoAcceso {
  Identificacion_evento?: number | string;
  PRSNIDENTIFICATION?: number | string;
  GROUPIDENTIFICATION?: number | string;
  CMPNIDENTIFICATION?: number | string;
  AREAIDENTIFICATION?: number | string;
  CMPNIDENTIFICATION1?: number | string;
  COMPIDENTIFICATION?: number | string;
  UBCTIDENTIFICATION?: number | string;
  EVENTO: 'ENTRADA' | 'SALIDA' | 'INVÁLIDO';
  Fecha_hora: string;
  Motivo_invalidez?: string | null;
  Documento: string;
  Nombre?: string;
  EVENISMANUAL?: boolean | number | null;
  EVENISTOLIQUIDATE?: boolean | number | null;
  EVENINCONTINGENCY?: boolean | number | null;
  EVENCREATEDATE?: string | null;
  ubicacion?: string;
}

export interface ResumenDiaPresentismo {
  fechaKey: string; // YYYY-MM-DD
  fechaDate: Date;
  diaNumero: number;
  esHoy: boolean;
  esFinDeSemana: boolean;
  esMesActual: boolean;
  eventos: EventoAcceso[];
  primeraEntrada?: string | null;
  ultimaSalida?: string | null;
  totalHorasTexto?: string;
  totalMinutos?: number;
  estado: 'PRESENTE' | 'COMPLETO' | 'SOLO_ENTRADA' | 'SOLO_SALIDA' | 'SIN_REGISTRO' | 'INVALIDO';
  turno?: TurnoDiaInfo;
  solicitudesTiempoExtra?: SolicitudTiempoExtra[];
  tieneDobleEntrada?: boolean;
  entradasMultiples?: string[];
}

export interface TurnoDiaInfo {
  nombre: string;
  codigo: string;
  horario: string;
  horaEntrada: string;
  horaSalida: string;
  toleranciaEntrada: string;
  toleranciaSalida: string;
  duracion: string;
  esLaborable: boolean;
  esDescanso: boolean;
  esFestivo: boolean;
  tipoBadge: 'ordinario' | 'descanso' | 'festivo';
}

export interface EstadisticasMesPresentismo {
  diasTrabajados: number;
  horasTotales: string;
  promedioEntrada: string;
  estadoHoy: 'PRESENTE' | 'SALIDA' | 'SIN_REGISTRO';
  primerIngresoHoy: string;
  ultimaSalidaHoy: string;
}

export interface DiaMiniBarra {
  diaNumero: number;
  diaNombre: string; // 'L', 'M', 'X', 'J', 'V'
  fechaKey: string;
  fechaDate: Date;
  horasTexto: string;
  minutosTotales: number;
  porcentajeAltura: number;
  estadoColor: 'puntual' | 'tarde' | 'sede_hoy' | 'vacio' | 'festivo';
  tooltipTexto: string;
  esHoy: boolean;
  esFestivo: boolean;
  primeraEntrada?: string | null;
  ultimaSalida?: string | null;
}

export interface ResumenSemanaMes {
  numeroSemana: number;
  nombreSemana?: string; // "Semana 1", "Semana 2", etc.
  rangoTexto: string; // "05 - 09 Oct"
  diasHabiles?: number; // Ej. 4 o 5
  diasHabilesTexto?: string; // "4 días hábiles"
  minutosTotales: number;
  horasTexto: string; // "34h 10m"
  metaMinutos?: number; // Meta prorrateada en minutos (ej. 4 * 504 = 2016 min = 33h 36m)
  metaTexto?: string; // "33h 36m"
  porcentajeProgreso?: number; // 0 - 100%
  porcentajePuntualidad?: number; // 0 - 100% puntualidad en la semana
  diferenciaMinutos?: number; // minutosTotales - metaMinutos
  diferenciaTexto?: string; // "+1h 20m" o "−0h 55m"
  esPositiva?: boolean;
  esSemanaActual: boolean;
  esFutura?: boolean;
  dias: ResumenDiaPresentismo[];
  miniBarras?: DiaMiniBarra[];
}

export interface ResumenMesMetas {
  totalHorasMesTexto: string; // "69h 21m"
  metaMesTexto: string; // "92h 24m"
  totalMinutosMes: number;
  metaMinutosMes: number;
  porcentajeMes: number;
  porcentajePuntualidad: number;
  llegadasTardeCount: number;
  totalEntradasRegistradas: number;
}

export interface SolicitudTiempoExtra {
  id: string;
  fechaKey: string; // YYYY-MM-DD
  cedulaColaborador: string;
  nombreColaborador: string;
  horas: number; // e.g. 2
  horasTexto: string; // e.g. "2 horas"
  descripcion: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  fechaSolicitud: string;
  aprobadoPor?: string | null;
  aprobadorAsignado?: string | null;
  correoAprobador?: string | null;
  fechaRespuesta?: string | null;
  motivoRespuesta?: string | null;
}

export interface KpiPresentismoResumen {
  porcentajeCumplimiento: number;
  diasAsistidos: number;
  diasHabilesMes: number;
  porcentajePuntualidad: number;
  llegadasTardeCount: number;
  minutosTardeAcumulados: number;
  salidasAnticipadasCount: number;
  salidasTardesCount?: number;
  minutosSalidasAnticipadas: number;
  minutosSalidasTardes?: number;
  promedioHoraEntrada: string;
  promedioHoraSalida: string;
  horasPromedioDiaTexto: string;
  variacionCumplimientoVsMesAnterior?: number;
  variacionPuntualidadVsMesAnterior?: number;
}

export interface ColaboradorRankingPuntualidad {
  id: string;
  cedula: string;
  nombre: string;
  cargo: string;
  area: string;
  diasAsistidos: number;
  porcentajeCumplimiento: number;
  porcentajePuntualidad: number;
  llegadasTarde: number;
  minutosTarde: number;
  salidasAnticipadas: number;
  salidasTardes?: number;
}

export interface MarcacionErronea {
  documento: string;
  nombre: string;
  fecha: string;
  horas: string[];
  totalEntradas: number;
  area?: string;
  cargo?: string;
}
