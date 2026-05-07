package com.bgreenNet.bgreenNet.dto;

import java.util.List;

public class CmiplantaResponseDTO {

	 private List<CmiplantaDTO> dailyData;
	    private double monthlyAccumulated;
	    private double totalConsumption;
	    private double totalProduction;
	    private int validDays;
		public List<CmiplantaDTO> getDailyData() {
			return dailyData;
		}
		public void setDailyData(List<CmiplantaDTO> dailyData) {
			this.dailyData = dailyData;
		}
		public double getMonthlyAccumulated() {
			return monthlyAccumulated;
		}
		public void setMonthlyAccumulated(double monthlyAccumulated) {
			this.monthlyAccumulated = monthlyAccumulated;
		}
		public double getTotalConsumption() {
			return totalConsumption;
		}
		public void setTotalConsumption(double totalConsumption) {
			this.totalConsumption = totalConsumption;
		}
		public double getTotalProduction() {
			return totalProduction;
		}
		public void setTotalProduction(double totalProduction) {
			this.totalProduction = totalProduction;
		}
		public int getValidDays() {
			return validDays;
		}
		public void setValidDays(int validDays) {
			this.validDays = validDays;
		}
	
	    
	
		
		
}
