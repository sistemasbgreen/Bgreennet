package com.bgreenNet.bgreenNet.dto;

import java.util.List;

public class MetaResponseDTO {

	 private List<MetaDetalleDTO> mensuales;

	    public MetaResponseDTO(List<MetaDetalleDTO> mensuales) {
	        this.mensuales = mensuales;
	    }

		public List<MetaDetalleDTO> getMensuales() {
			return mensuales;
		}

		public void setMensuales(List<MetaDetalleDTO> mensuales) {
			this.mensuales = mensuales;
		}
	    
}
