export interface CreateTareaRequest {
  titulo: string;
  descripcion: string;
  idUsuario: number;
  idUsuarioCreador: number;
  idEstado: number;
  idPrioridad: number;
  fechaLimite?: string;
}