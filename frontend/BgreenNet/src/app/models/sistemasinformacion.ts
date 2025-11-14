export interface SistemaInformacion {
  id: number;
  nombre: string;
  descripcion: string;
  url: string;
  imagenUrl: string;
  activo: boolean;
  fechaCreacion?: string; // ISO string desde el backend
}