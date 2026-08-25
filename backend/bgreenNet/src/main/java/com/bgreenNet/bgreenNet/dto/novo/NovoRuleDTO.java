package com.bgreenNet.bgreenNet.dto.novo;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NovoRuleDTO {

    @JsonProperty("RuleId")
    private Long ruleId;

    @JsonProperty("RuleDescription")
    private String ruleDescription;

    @JsonProperty("RuleType")
    private String ruleType;

    @JsonProperty("RuleFilter")
    private String ruleFilter;

    public Long getRuleId() {
        return ruleId;
    }

    public void setRuleId(Long ruleId) {
        this.ruleId = ruleId;
    }

    public String getRuleDescription() {
        return ruleDescription;
    }

    public void setRuleDescription(String ruleDescription) {
        this.ruleDescription = ruleDescription;
    }

    public String getRuleType() {
        return ruleType;
    }

    public void setRuleType(String ruleType) {
        this.ruleType = ruleType;
    }

    public String getRuleFilter() {
        return ruleFilter;
    }

    public void setRuleFilter(String ruleFilter) {
        this.ruleFilter = ruleFilter;
    }
}
