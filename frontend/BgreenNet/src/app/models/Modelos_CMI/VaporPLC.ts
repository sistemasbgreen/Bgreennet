/**
 * Modelo que representa un registro crudo de la tabla Tabla_14 del PLC (DB_Process_Data_PLCs)
 * Los valores vienen en notación científica (ej: 9.32E-39) por diferencias de codificación
 * entre el PLC y SQL Server. El valor real se extrae de la mantisa (antes del 'E').
 */
export interface VaporPLC {
  Id: number;
  FechaRegistro: string;   // ISO 8601 - ej: "2026-06-02T19:12:48.970+00:00"
  '1100FTSG12': number;    // Flujo total planta (mantisa: ej 9.32)
  '1100FTSG11': number;    // Flujo ISBL (mantisa: ej 5.87)
  '550FT04': number;       // Flujo área 550 (mantisa: ej 8.75)
}

/**
 * Registro de vapor procesado y agrupado por día (sumando todos los registros del día).
 */
export interface VaporDiario {
  fecha: string;           // YYYY-MM-DD
  totalVapor: number;      // Suma de 1100FTSG12 del día
  isblDesagregado: number; // Suma de (1100FTSG11 - 550FT04) del día
  zona700yOtros: number;   // Suma de (1100FTSG12 - 1100FTSG11) del día
  registros: number;       // Cantidad de registros sumados (debug)
}

/**
 * Combinación de vapor diario con producción B100 para el dashboard.
 */
export interface VaporConB100 {
  fecha: string;           // YYYY-MM-DD
  etiqueta: string;        // DD/MM para el eje X
  totalVapor: number;
  isblDesagregado: number;
  zona700yOtros: number;
  tonB100: number;         // Producción B100 en toneladas
  foco: number;            // kg vapor / Ton B100 (0 si no hay B100)
  focoStatus: 'ok' | 'desviacion' | 'sin-dato'; // verde / rojo / gris
}

/**
 * KPIs calculados del indicador FOCO.
 */
export interface FocoKPIs {
  focoUltimoDia: number | null;
  focoMensual: number | null;
  focoAnual: number | null;
  totalVaporMes: number;
  totalB100Mes: number;
  totalVaporAnio: number;
  totalB100Anio: number;
  meta: number; // 730 kg/Ton
  metaMensual?: number;
}
