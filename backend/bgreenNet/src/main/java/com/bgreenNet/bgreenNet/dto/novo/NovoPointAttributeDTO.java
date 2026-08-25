package com.bgreenNet.bgreenNet.dto.novo;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NovoPointAttributeDTO {

    @JsonProperty("Attribute")
    private String attribute;

    @JsonProperty("PointAddress")
    private String pointAddress;

    @JsonProperty("PointName")
    private String pointName;

    @JsonProperty("PointUnit")
    private String pointUnit;

    @JsonProperty("CurrentValue")
    private String currentValue;

    @JsonProperty("ModificationDateTime")
    private String modificationDateTime;

    public String getAttribute() { return attribute; }
    public void setAttribute(String attribute) { this.attribute = attribute; }

    public String getPointAddress() { return pointAddress; }
    public void setPointAddress(String pointAddress) { this.pointAddress = pointAddress; }

    public String getPointName() { return pointName; }
    public void setPointName(String pointName) { this.pointName = pointName; }

    public String getPointUnit() { return pointUnit; }
    public void setPointUnit(String pointUnit) { this.pointUnit = pointUnit; }

    public String getCurrentValue() { return currentValue; }
    public void setCurrentValue(String currentValue) { this.currentValue = currentValue; }

    public String getModificationDateTime() { return modificationDateTime; }
    public void setModificationDateTime(String modificationDateTime) { this.modificationDateTime = modificationDateTime; }
}
