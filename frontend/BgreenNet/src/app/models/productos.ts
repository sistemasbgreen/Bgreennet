export interface producto {
  id: string;
  nombre: string;
  idProductoSiesa?: string;
  esCostoDirecto?: boolean;
  consumptionDocTypes: string[];
  productionDocTypes: string[];
  consumptionDocIds?: number[];
  productionDocIds?: number[];
  metaActual?: number;
}