package com.bgreenNet.bgreenNet.dto.novo;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class NovoHistoryResponse {

    @JsonProperty("Result")
    private int result;

    @JsonProperty("Message")
    private String message;

    @JsonProperty("Data")
    private List<NovoHistoryDataDTO> data;

    public int getResult() { return result; }
    public void setResult(int result) { this.result = result; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<NovoHistoryDataDTO> getData() { return data; }
    public void setData(List<NovoHistoryDataDTO> data) { this.data = data; }
}
