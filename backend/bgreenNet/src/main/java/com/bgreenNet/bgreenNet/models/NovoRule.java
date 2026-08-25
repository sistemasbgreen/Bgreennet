package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "novo_rules")
public class NovoRule {

    @Id
    @Column(name = "rule_id")
    private Long ruleId;

    @Column(name = "rule_description")
    private String ruleDescription;

    @Column(name = "rule_type")
    private String ruleType;

    @Column(name = "rule_filter")
    private String ruleFilter;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getRuleId() { return ruleId; }
    public void setRuleId(Long ruleId) { this.ruleId = ruleId; }

    public String getRuleDescription() { return ruleDescription; }
    public void setRuleDescription(String ruleDescription) { this.ruleDescription = ruleDescription; }

    public String getRuleType() { return ruleType; }
    public void setRuleType(String ruleType) { this.ruleType = ruleType; }

    public String getRuleFilter() { return ruleFilter; }
    public void setRuleFilter(String ruleFilter) { this.ruleFilter = ruleFilter; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
