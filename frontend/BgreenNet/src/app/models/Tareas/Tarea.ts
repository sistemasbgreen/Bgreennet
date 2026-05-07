import { EstadoTarea } from "./EstadoTarea";
import { PrioridadTarea } from "./PrioridadTarea";
import { Usuario } from "../usuario";

export interface Tarea {
  id: number;
  idUsuario: number;
  idUsuarioCreador: number;
  usuario?: Usuario;
  usuarioCreador?: Usuario;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaCompletado?: string;
  notaCierre?: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  fechaLimite?: string;
}
