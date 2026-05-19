
export interface OpDocto {
  indEstado: string;
  op:                       string;
  item:                     string;
  descripcion:              string;
  fecha:                    string | null;
  cantidadConsumida:        number;
  
  // Cost fields
  totalPurificacionGlicerina: number;
  totalManoObra:             number;
  totalOtrosCostos:          number;
  statusEnvio:               string;
  idOrden:                   string;
}