package com.bgreenNet.bgreenNet.client;

import com.bgreenNet.bgreenNet.config.NovoConnectorProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.nio.charset.StandardCharsets;

class NovoSoapClientTest {

    private NovoSoapClient soapClient;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private com.bgreenNet.bgreenNet.services.ConfiguracionSeguridadService configSeguridadService;

    private NovoConnectorProperties properties;

    @BeforeEach
    void setUp() throws Exception {
        MockitoAnnotations.openMocks(this);
        properties = new NovoConnectorProperties();
        properties.setUrl("http://localhost:8080/scadaotherapp.asmx");
        properties.setApiKey("my-secret-key");

        com.bgreenNet.bgreenNet.models.ConfiguracionSeguridad emptyConfig = new com.bgreenNet.bgreenNet.models.ConfiguracionSeguridad();
        when(configSeguridadService.obtenerConfiguracion()).thenReturn(emptyConfig);

        soapClient = new NovoSoapClient(properties, configSeguridadService);

        // Inyectar el RestTemplate mockeado mediante reflexión
        java.lang.reflect.Field field = NovoSoapClient.class.getDeclaredField("restTemplate");
        field.setAccessible(true);
        field.set(soapClient, restTemplate);
    }

    @Test
    void testLoadUserRulesJson_Success() {
        String soapResponseXml = 
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n" +
            "  <soap:Body>\n" +
            "    <LoadUserRulesJsonResponse xmlns=\"http://tempuri.org/\">\n" +
            "      <LoadUserRulesJsonResult>{\"Result\":0,\"Message\":\"OK\",\"Data\":[]}</LoadUserRulesJsonResult>\n" +
            "    </LoadUserRulesJsonResponse>\n" +
            "  </soap:Body>\n" +
            "</soap:Envelope>";

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(soapResponseXml));

        String json = soapClient.loadUserRulesJson();

        assertNotNull(json);
        assertEquals("{\"Result\":0,\"Message\":\"OK\",\"Data\":[]}", json);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("http://localhost:8080/scadaotherapp.asmx"), captor.capture(), eq(String.class));
        
        HttpEntity<String> entity = captor.getValue();
        assertEquals("my-secret-key", entity.getHeaders().getFirst("X-API-KEY"));
        assertEquals("http://tempuri.org/LoadUserRulesJson", entity.getHeaders().getFirst("SOAPAction"));
        assertTrue(entity.getBody().contains("<LoadUserRulesJson xmlns=\"http://tempuri.org/\" />"));
    }

    @Test
    void testLoadRuleHistoryDataJson_Success() {
        String soapResponseXml = 
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n" +
            "  <soap:Body>\n" +
            "    <LoadRuleHistoryDataJsonResponse xmlns=\"http://tempuri.org/\">\n" +
            "      <LoadRuleHistoryDataJsonResult>{\"Result\":0,\"Data\":[{\"HistoryId\":1}]}</LoadRuleHistoryDataJsonResult>\n" +
            "    </LoadRuleHistoryDataJsonResponse>\n" +
            "  </soap:Body>\n" +
            "</soap:Envelope>";

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(soapResponseXml));

        String json = soapClient.loadRuleHistoryDataJson(34L, "08-24-2026 00:00:00", "08-24-2026 23:59:59");

        assertNotNull(json);
        assertEquals("{\"Result\":0,\"Data\":[{\"HistoryId\":1}]}", json);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("http://localhost:8080/scadaotherapp.asmx"), captor.capture(), eq(String.class));
        
        HttpEntity<String> entity = captor.getValue();
        assertEquals("my-secret-key", entity.getHeaders().getFirst("X-API-KEY"));
        assertEquals("http://tempuri.org/LoadRuleHistoryDataJson", entity.getHeaders().getFirst("SOAPAction"));
        assertTrue(entity.getBody().contains("<IdRule>34</IdRule>"));
        assertTrue(entity.getBody().contains("<DateTimeStart>08-24-2026 00:00:00</DateTimeStart>"));
    }

    @Test
    void testLoadPointRuleDataJson_Success() {
        String soapResponseXml = 
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n" +
            "  <soap:Body>\n" +
            "    <LoadPointRuleDataJsonResponse xmlns=\"http://tempuri.org/\">\n" +
            "      <LoadPointRuleDataJsonResult>{\"Result\":0,\"Data\":[]}</LoadPointRuleDataJsonResult>\n" +
            "    </LoadPointRuleDataJsonResponse>\n" +
            "  </soap:Body>\n" +
            "</soap:Envelope>";

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(soapResponseXml));

        String json = soapClient.loadPointRuleDataJson(36L);

        assertNotNull(json);
        assertEquals("{\"Result\":0,\"Data\":[]}", json);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("http://localhost:8080/scadaotherapp.asmx"), captor.capture(), eq(String.class));
        
        HttpEntity<String> entity = captor.getValue();
        assertEquals("my-secret-key", entity.getHeaders().getFirst("X-API-KEY"));
        assertEquals("http://tempuri.org/LoadPointRuleDataJson", entity.getHeaders().getFirst("SOAPAction"));
        assertTrue(entity.getBody().contains("<IdRule>36</IdRule>"));
    }

    @Test
    void testSoapFaultHandling() {
        String soapFaultXml = 
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n" +
            "  <soap:Body>\n" +
            "    <soap:Fault>\n" +
            "      <faultcode>soap:Server</faultcode>\n" +
            "      <faultstring>Server was unable to process request. --&gt; Object reference not set to an instance of an object.</faultstring>\n" +
            "    </soap:Fault>\n" +
            "  </soap:Body>\n" +
            "</soap:Envelope>";

        org.springframework.web.client.HttpServerErrorException exception = 
            new org.springframework.web.client.HttpServerErrorException(
                org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, 
                "Internal Server Error", 
                soapFaultXml.getBytes(), 
                StandardCharsets.UTF_8
            );

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(exception);

        Exception ex = assertThrows(RuntimeException.class, () -> {
            soapClient.loadUserRulesJson();
        });

        assertTrue(ex.getMessage().contains("Server was unable to process request."));
    }
}
