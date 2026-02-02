import { EstadoTarea } from "./EstadoTarea";
import { PrioridadTarea } from "./PrioridadTarea";

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  fechaCompletado?: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
}
