import { SubModuloDTO } from "./SubModuloDTO";

export interface ModuloDTO {
  nombre: string;
  ruta: string;
  icono: string;
  expandido: boolean;
  subModulos: SubModuloDTO[];
}