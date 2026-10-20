export interface CreateSubtareaDTO {
  titulo: string;
  idUsuario?: number;
}

export interface CreateTareaRequest {
  titulo: string;
  descripcion: string;
  idUsuario: number;
  idUsuarioCreador: number;
  idEstado: number;
  idPrioridad: number;
  fechaLimite?: string;
  subtareas?: CreateSubtareaDTO[];
  idUsuariosAsignados?: number[];
}
