export interface Pulso {
  id?: number;
  titulo: string;
  descripcion?: string;
  imagenUrl?: string;
  imagenNombreOriginal?: string;
  imagenTipoMime?: string;
  imagenTamanoBytes?: number;
  fechaFinal: string;
  activo: boolean;
  dateCreate?: string;    // ✅ Coincide con date_create de BD
  dateModify?: string;    // ✅ Coincide con date_Modify de BD
  creadoPor?: string;
  idPulso : number;
  fechaActivacion?: string; // Fecha en la que el pulso se activa automáticamente
}