export interface PulsoCreateDTO {
  titulo: string;
  descripcion?: string;
  imagenUrl?: string;
  imagenNombreOriginal?: string;
  imagenTipoMime?: string;
  imagenTamanoBytes?: number;
  fechaFinal: string;  // ✅ Formato ISO: "2024-12-31T23:59:59"
  fechaActivacion?: string; // Opcional — fecha en que el pulso se activará automáticamente
  creadoPor: string;
}