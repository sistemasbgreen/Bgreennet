export interface UpdateTareaRequest {
  titulo?: string;
  descripcion?: string;
  idEstado?: number;
  idPrioridad?: number;
  notaCierre?: string;
  fechaLimite?: string | null;
  clearFechaLimite?: boolean;
}