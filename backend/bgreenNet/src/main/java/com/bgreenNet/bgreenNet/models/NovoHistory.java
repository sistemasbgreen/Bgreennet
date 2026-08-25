package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "novo_histories")
public class NovoHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "device_id")
    private Long deviceId;

    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "meter_id")
    private String meterId;

    @Column(name = "history")
    private String history;

    @Column(name = "history_id")
    private Long historyId;

    @Column(name = "history_name")
    private String historyName;

    @Column(name = "interval_type")
    private String intervalType;

    @Column(name = "detail_history_json", columnDefinition = "VARCHAR(MAX)")
    private String detailHistoryJson;

    @Column(name = "history_date_time")
    private LocalDateTime historyDateTime;

    @Column(name = "run_type")
    private String runType;

    @Column(name = "imported_at")
    private LocalDateTime importedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getDetailHistoryJson() { return detailHistoryJson; }
    public void setDetailHistoryJson(String detailHistoryJson) { this.detailHistoryJson = detailHistoryJson; }

    public LocalDateTime getHistoryDateTime() { return historyDateTime; }
    public void setHistoryDateTime(LocalDateTime historyDateTime) { this.historyDateTime = historyDateTime; }

    public String getRunType() { return runType; }
    public void setRunType(String runType) { this.runType = runType; }

    public LocalDateTime getImportedAt() { return importedAt; }
    public void setImportedAt(LocalDateTime importedAt) { this.importedAt = importedAt; }
}
