export interface PulsoUpdateDTO {
  id?: number;  // ✅ Opcional aquí, se envía en la URL
  titulo: string;
  descripcion?: string;
  imagenUrl?: string;
  imagenNombreOriginal?: string;
  imagenTipoMime?: string;
  imagenTamanoBytes?: number;
  fechaFinal: string;
  activo: boolean;
  fechaActivacion?: string; // Opcional — fecha en que el pulso se activa automáticamente
}