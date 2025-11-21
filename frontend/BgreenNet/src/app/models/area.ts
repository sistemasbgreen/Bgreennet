import { Direccion } from "./direccion";


export interface Area {
  idArea: number;
  descripcionArea: string;
  direccion: Direccion;
  estado: number;
}