export interface ItemExistencia {
  cia: number;
  itemId: string;
  descripcion: string;
  descripcionCorta?: string;
  unidadInventario?: string;
  tipoInvServ?: string;
  descTipoInvServ?: string;
  bodega: string;
  nombreBodega: string;
  stockActual: number;
  costoPromedio: number;
  valorTotalInventario: number;
}

export interface BodegaInfo {
  id: string;
  descripcion: string;
}

export interface ItemResumen {
  totalItems: number;
  itemsConStock: number;
  itemsSinStock: number;
  totalStock: number;
  valorTotalInventario: number;
  bodega: string;
}

export interface ItemRequisicion {
  item: ItemExistencia;
  cantidadSolicitada: number;
  observaciones?: string;
}
