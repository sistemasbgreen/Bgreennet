export interface CreateTareaRequest {
  titulo: string;
  descripcion: string;
  idUsuario: number;
  idEstado: number;
  idPrioridad: number;
}