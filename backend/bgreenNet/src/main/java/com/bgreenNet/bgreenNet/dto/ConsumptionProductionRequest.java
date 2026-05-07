package com.bgreenNet.bgreenNet.dto;

import org.antlr.v4.runtime.misc.NotNull;

public class ConsumptionProductionRequest {
	  @NotNull
	    private String startDate;
	    @NotNull
	    private String endDate;
	    @NotNull
	    private String consumptionProductId; // ej: "10"
	    private String productionProductId = "26";
		public String getStartDate() {
			return startDate;
		}
		public void setStartDate(String startDate) {
			this.startDate = startDate;
		}
		public String getEndDate() {
			return endDate;
		}
		public void setEndDate(String endDate) {
			this.endDate = endDate;
		}
		public String getConsumptionProductId() {
			return consumptionProductId;
		}
		public void setConsumptionProductId(String consumptionProductId) {
			this.consumptionProductId = consumptionProductId;
		}
		public String getProductionProductId() {
			return productionProductId;
		}
		public void setProductionProductId(String productionProductId) {
			this.productionProductId = productionProductId;
		} 
	    
	    
}
