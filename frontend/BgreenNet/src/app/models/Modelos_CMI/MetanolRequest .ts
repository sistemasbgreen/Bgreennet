export interface MetanolRequest {
  startDate: string;
  endDate: string;
  consumptionProductId: string;
  productionProductId: string;
  consumptionDocTypes: string[];     // ← nuevo
  productionDocTypes: string[];      // ← nuevo
}