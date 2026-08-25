package com.bgreenNet.bgreenNet.dto.novo;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class NovoPointDataDTO {

    @JsonProperty("DeviceId")
    private Long deviceId;

    @JsonProperty("DeviceName")
    private String deviceName;

    @JsonProperty("MeterId")
    private String meterId;

    @JsonProperty("ProtocolComm")
    private String protocolComm;

    @JsonProperty("Attributes")
    private List<NovoPointAttributeDTO> attributes;

    public Long getDeviceId() { return deviceId; }
    public void setDeviceId(Long deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getMeterId() { return meterId; }
    public void setMeterId(String meterId) { this.meterId = meterId; }

    public String getProtocolComm() { return protocolComm; }
    public void setProtocolComm(String protocolComm) { this.protocolComm = protocolComm; }

    public List<NovoPointAttributeDTO> getAttributes() { return attributes; }
    public void setAttributes(List<NovoPointAttributeDTO> attributes) { this.attributes = attributes; }
}
