package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ConfiguracionEntorno")
public class ConfiguracionEntorno {
	
	 @Id
	 @GeneratedValue(strategy = GenerationType.IDENTITY)
	 
	    private Long id;
	    private String entorno;
	    private String dbUrl;
	    private String dbUsername;
	    private String dbPassword;
	    private String apiUrl;
	    private String mailServer;
	    private Boolean activo;
		public Long getId() {
			return id;
		}
		public void setId(Long id) {
			this.id = id;
		}
		public String getEntorno() {
			return entorno;
		}
		public void setEntorno(String entorno) {
			this.entorno = entorno;
		}
		public String getDbUrl() {
			return dbUrl;
		}
		public void setDbUrl(String dbUrl) {
			this.dbUrl = dbUrl;
		}
		public String getDbUsername() {
			return dbUsername;
		}
		public void setDbUsername(String dbUsername) {
			this.dbUsername = dbUsername;
		}
		public String getDbPassword() {
			return dbPassword;
		}
		public void setDbPassword(String dbPassword) {
			this.dbPassword = dbPassword;
		}
		public String getApiUrl() {
			return apiUrl;
		}
		public void setApiUrl(String apiUrl) {
			this.apiUrl = apiUrl;
		}
		public String getMailServer() {
			return mailServer;
		}
		public void setMailServer(String mailServer) {
			this.mailServer = mailServer;
		}
		public Boolean getActivo() {
			return activo;
		}
		public void setActivo(Boolean activo) {
			this.activo = activo;
		}
	    
	    
	    

}
