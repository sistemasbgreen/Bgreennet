package com.bgreenNet.bgreenNet.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ItemErpDTO {
    @JsonProperty("AUFNR")
    private String aufnr = "001";
    
    @JsonProperty("MATNR")
    private String matnr; // Item ID
    
    @JsonProperty("MAKTX")
    private String maktx; // Descripcion
    
    @JsonProperty("MENGE")
    private String menge; // Cantidad consumida
    
    @JsonProperty("BWART")
    private String bwart = "101";
    
    @JsonProperty("CHARG")
    private String charg = "0";
    
    @JsonProperty("RMZHL")
    private String rmzhl = "001";

    // Getters and Setters explicitos para asegurar compatibilidad
    public String getAufnr() {
        return aufnr;
    }

    public void setAufnr(String aufnr) {
        this.aufnr = aufnr;
    }

    public String getMatnr() {
        return matnr;
    }

    public void setMatnr(String matnr) {
        this.matnr = matnr;
    }

    public String getMaktx() {
        return maktx;
    }

    public void setMaktx(String maktx) {
        this.maktx = maktx;
    }

    public String getMenge() {
        return menge;
    }

    public void setMenge(String menge) {
        this.menge = menge;
    }

    public String getBwart() {
        return bwart;
    }

    public void setBwart(String bwart) {
        this.bwart = bwart;
    }

    public String getCharg() {
        return charg;
    }

    public void setCharg(String charg) {
        this.charg = charg;
    }

    public String getRmzhl() {
        return rmzhl;
    }

    public void setRmzhl(String rmzhl) {
        this.rmzhl = rmzhl;
    }
}
