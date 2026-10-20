import { Usuario } from '../usuario';

export interface Subtarea {
  id?: number;
  idTarea?: number;
  idUsuario?: number;
  usuario?: Usuario;
  titulo: string;
  completada: boolean;
  fechaCreacion?: string;
  fechaCompletado?: string;
}
