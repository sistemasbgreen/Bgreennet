import { ConsumoDiario } from "./ConsumoDiario";
import { DatoMetanol } from "./DatoProducto";

export interface DailyData {
  date: string;
  consumo: number;
  produccion: number;
  consumo_diario: number;
}

export interface MetanolResponse {
  dailyData: DailyData[];
  monthlyAccumulated: number;
  totalConsumption: number;
  totalProduction: number;
  validDays: number;
}

