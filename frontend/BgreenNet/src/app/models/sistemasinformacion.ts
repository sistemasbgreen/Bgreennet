export interface SistemaInformacion {
category: any;
  id: number;
  nombre: string;
  descripcion: string;
  url: string;
  imagenUrl: string;
  estado: boolean;
  fechaCreacion?: string; // ISO string desde el backend
}

// sistema-informacion.model.ts
