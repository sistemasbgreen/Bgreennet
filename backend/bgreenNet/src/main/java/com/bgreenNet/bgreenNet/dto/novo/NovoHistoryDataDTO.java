package com.bgreenNet.bgreenNet.dto.novo;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NovoHistoryDataDTO {

    @JsonProperty("DeviceId")
    private Long deviceId;

    @JsonProperty("DeviceName")
    private String deviceName;

    @JsonProperty("MeterId")
    private String meterId;

    @JsonProperty("History")
    private String history;

    @JsonProperty("HistoryId")
    private Long historyId;

    @JsonProperty("HistoryName")
    private String historyName;

    @JsonProperty("IntervalType")
    private String intervalType;

    @JsonProperty("DetailHistory")
    private Object detailHistory; // Flexible: Map o List según la configuración en NOVO

    @JsonProperty("HistoryDateTime")
    private String historyDateTime;

    @JsonProperty("RunType")
    private String runType;

    public Long getDeviceId() { return deviceId; }
    public void setDeviceId(Long deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getMeterId() { return meterId; }
    public void setMeterId(String meterId) { this.meterId = meterId; }

    public String getHistory() { return history; }
    public void setHistory(String history) { this.history = history; }

    public Long getHistoryId() { return historyId; }
    public void setHistoryId(Long historyId) { this.historyId = historyId; }

    public String getHistoryName() { return historyName; }
    public void setHistoryName(String historyName) { this.historyName = historyName; }

    public String getIntervalType() { return intervalType; }
    public void setIntervalType(String intervalType) { this.intervalType = intervalType; }

    public Object getDetailHistory() { return detailHistory; }
    public void setDetailHistory(Object detailHistory) { this.detailHistory = detailHistory; }

    public String getHistoryDateTime() { return historyDateTime; }
    public void setHistoryDateTime(String historyDateTime) { this.historyDateTime = historyDateTime; }

    public String getRunType() { return runType; }
    public void setRunType(String runType) { this.runType = runType; }
}
