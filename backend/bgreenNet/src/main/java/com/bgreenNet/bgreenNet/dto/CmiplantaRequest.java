package com.bgreenNet.bgreenNet.dto;

import java.util.List;

public class CmiplantaRequest {
		
    private String startDate;
    private String endDate;
    private String consumptionProductId;
    private String productionProductId;
    private List<String> consumptionDocTypes;
    private List<String> productionDocTypes;
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
	public List<String> getConsumptionDocTypes() {
		return consumptionDocTypes;
	}
	public void setConsumptionDocTypes(List<String> consumptionDocTypes) {
		this.consumptionDocTypes = consumptionDocTypes;
	}
	public List<String> getProductionDocTypes() {
		return productionDocTypes;
	}
	public void setProductionDocTypes(List<String> productionDocTypes) {
		this.productionDocTypes = productionDocTypes;
	}
    
    

}
