package com.bgreenNet.bgreenNet.dto;

import java.util.List;

public class ReportResponse {

	  private List<DailyRecord> dailyData;
	    private int monthlyAccumulated; // ponderado
	    private double totalConsumption;
	    private double totalProduction;
	    private int validDays;
	    
	    
		public List<DailyRecord> getDailyData() {
			return dailyData;
		}
		public void setDailyData(List<DailyRecord> dailyData) {
			this.dailyData = dailyData;
		}
		public int getMonthlyAccumulated() {
			return monthlyAccumulated;
		}
		public void setMonthlyAccumulated(int monthlyAccumulated) {
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
