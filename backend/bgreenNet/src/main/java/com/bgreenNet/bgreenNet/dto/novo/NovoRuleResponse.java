package com.bgreenNet.bgreenNet.dto.novo;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class NovoRuleResponse {

    @JsonProperty("Result")
    private int result;

    @JsonProperty("Message")
    private String message;

    @JsonProperty("Data")
    private List<NovoRuleDTO> data;

    public int getResult() {
        return result;
    }

    public void setResult(int result) {
        this.result = result;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<NovoRuleDTO> getData() {
        return data;
    }

    public void setData(List<NovoRuleDTO> data) {
        this.data = data;
    }
}
