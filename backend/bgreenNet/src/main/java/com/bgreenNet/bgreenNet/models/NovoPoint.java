package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "novo_points")
public class NovoPoint {

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

    @Column(name = "protocol_comm")
    private String protocolComm;

    @Column(name = "attribute_name")
    private String attributeName;

    @Column(name = "point_address")
    private String pointAddress;

    @Column(name = "point_name")
    private String pointName;

    @Column(name = "point_unit")
    private String pointUnit;

    @Column(name = "current_value")
    private String currentValue;

    @Column(name = "modification_date_time")
    private LocalDateTime modificationDateTime;

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

    public String getProtocolComm() { return protocolComm; }
    public void setProtocolComm(String protocolComm) { this.protocolComm = protocolComm; }

    public String getAttributeName() { return attributeName; }
    public void setAttributeName(String attributeName) { this.attributeName = attributeName; }

    public String getPointAddress() { return pointAddress; }
    public void setPointAddress(String pointAddress) { this.pointAddress = pointAddress; }

    public String getPointName() { return pointName; }
    public void setPointName(String pointName) { this.pointName = pointName; }

    public String getPointUnit() { return pointUnit; }
    public void setPointUnit(String pointUnit) { this.pointUnit = pointUnit; }

    public String getCurrentValue() { return currentValue; }
    public void setCurrentValue(String currentValue) { this.currentValue = currentValue; }

    public LocalDateTime getModificationDateTime() { return modificationDateTime; }
    public void setModificationDateTime(LocalDateTime modificationDateTime) { this.modificationDateTime = modificationDateTime; }

    public LocalDateTime getImportedAt() { return importedAt; }
    public void setImportedAt(LocalDateTime importedAt) { this.importedAt = importedAt; }
}
