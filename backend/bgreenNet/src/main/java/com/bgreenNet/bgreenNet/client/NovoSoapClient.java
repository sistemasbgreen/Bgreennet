package com.bgreenNet.bgreenNet.client;

import com.bgreenNet.bgreenNet.config.NovoConnectorProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

@Component
public class NovoSoapClient {

    private static final Logger logger = LoggerFactory.getLogger(NovoSoapClient.class);

    private final NovoConnectorProperties properties;
    private final RestTemplate restTemplate;
    private final com.bgreenNet.bgreenNet.services.ConfiguracionSeguridadService configSeguridadService;

    @Autowired
    public NovoSoapClient(NovoConnectorProperties properties,
                          com.bgreenNet.bgreenNet.services.ConfiguracionSeguridadService configSeguridadService) {
        this.properties = properties;
        this.configSeguridadService = configSeguridadService;
        
        // Configuración de timeouts de conexión y lectura por defecto
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getConnectionTimeout());
        factory.setReadTimeout(properties.getReadTimeout());
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Llama al método LoadUserRulesJson del Web Service de NOVO.
     */
    public String loadUserRulesJson() {
        String soapEnvelope = 
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n" +
            "  <soap:Body>\n" +
            "    <LoadUserRulesJson xmlns=\"http://tempuri.org/\" />\n" +
            "  </soap:Body>\n" +
            "</soap:Envelope>";

        return executeSoapCall("LoadUserRulesJson", soapEnvelope, "LoadUserRulesJsonResult");
    }

    /**
     * Llama al método LoadRuleHistoryDataJson del Web Service de NOVO.
     */
    public String loadRuleHistoryDataJson(Long ruleId, String dateTimeStart, String dateTimeEnd) {
        String soapEnvelope = String.format(
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n" +
            "  <soap:Body>\n" +
            "    <LoadRuleHistoryDataJson xmlns=\"http://tempuri.org/\">\n" +
            "      <IdRule>%d</IdRule>\n" +
            "      <DateTimeStart>%s</DateTimeStart>\n" +
            "      <DateTimeEnd>%s</DateTimeEnd>\n" +
            "    </LoadRuleHistoryDataJson>\n" +
            "  </soap:Body>\n" +
            "</soap:Envelope>",
            ruleId, dateTimeStart, dateTimeEnd
        );

        return executeSoapCall("LoadRuleHistoryDataJson", soapEnvelope, "LoadRuleHistoryDataJsonResult");
    }

    /**
     * Llama al método LoadPointRuleDataJson del Web Service de NOVO.
     */
    public String loadPointRuleDataJson(Long ruleId) {
        String soapEnvelope = String.format(
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n" +
            "  <soap:Body>\n" +
            "    <LoadPointRuleDataJson xmlns=\"http://tempuri.org/\">\n" +
            "      <IdRule>%d</IdRule>\n" +
            "    </LoadPointRuleDataJson>\n" +
            "  </soap:Body>\n" +
            "</soap:Envelope>",
            ruleId
        );

        return executeSoapCall("LoadPointRuleDataJson", soapEnvelope, "LoadPointRuleDataJsonResult");
    }

    private String executeSoapCall(String soapActionName, String soapEnvelope, String expectedResultTag) {
        // Carga dinámica de configuración desde base de datos con fallback a properties
        com.bgreenNet.bgreenNet.models.ConfiguracionSeguridad dbConfig = configSeguridadService.obtenerConfiguracion();
        
        String url = (dbConfig.getNovoUrl() != null && !dbConfig.getNovoUrl().isBlank()) 
                ? dbConfig.getNovoUrl().trim() : properties.getUrl();
                
        String apiKey = (dbConfig.getNovoApiKey() != null && !dbConfig.getNovoApiKey().isBlank()) 
                ? dbConfig.getNovoApiKey().trim() : properties.getApiKey();

        int connTimeout = dbConfig.getNovoConnectionTimeout() != null 
                ? dbConfig.getNovoConnectionTimeout() : properties.getConnectionTimeout();
                
        int readTimeout = dbConfig.getNovoReadTimeout() != null 
                ? dbConfig.getNovoReadTimeout() : properties.getReadTimeout();

        // Aplicar timeouts dinámicamente al RestTemplate
        if (restTemplate.getRequestFactory() instanceof SimpleClientHttpRequestFactory) {
            SimpleClientHttpRequestFactory factory = (SimpleClientHttpRequestFactory) restTemplate.getRequestFactory();
            factory.setConnectTimeout(connTimeout);
            factory.setReadTimeout(readTimeout);
        }

        // Logging seguro: Evita imprimir la API KEY real
        logger.info("Iniciando llamada SOAP a NOVO. Action: {}, URL: {}", soapActionName, url);
        logger.debug("Carga útil enviada a NOVO:\n{}", soapEnvelope);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "xml", StandardCharsets.UTF_8));
        headers.add("SOAPAction", "http://tempuri.org/" + soapActionName);
        headers.add("X-API-KEY", apiKey);

        HttpEntity<String> requestEntity = new HttpEntity<>(soapEnvelope, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                logger.info("Respuesta exitosa recibida del servicio NOVO.");
                String jsonResult = extractJsonFromSoapResponse(response.getBody(), expectedResultTag);
                logger.debug("JSON extraído de la respuesta SOAP: {}", jsonResult);
                return jsonResult;
            } else {
                throw new RuntimeException("Respuesta fallida de NOVO. Código de estado: " + response.getStatusCode());
            }
        } catch (HttpStatusCodeException ex) {
            String responseBody = ex.getResponseBodyAsString();
            String soapFault = tryExtractSoapFault(responseBody);
            if (soapFault != null) {
                logger.error("Error devuelto por el servicio SOAP de NOVO (SOAP Fault): {}", soapFault);
                throw new RuntimeException("Error en Web Service de NOVO: " + soapFault, ex);
            }
            logger.error("Error HTTP al comunicarse con NOVO. Código: {}, Mensaje: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new RuntimeException("Error de conexión HTTP con NOVO (Código: " + ex.getStatusCode() + ")", ex);
        } catch (Exception ex) {
            logger.error("Error inesperado en llamada de integración con NOVO: {}", ex.getMessage(), ex);
            throw new RuntimeException("Error de comunicación con NOVO: " + ex.getMessage(), ex);
        }
    }

    private String extractJsonFromSoapResponse(String soapXml, String tagName) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(soapXml.getBytes(StandardCharsets.UTF_8)));

            NodeList nodeList = doc.getElementsByTagNameNS("*", tagName);
            if (nodeList.getLength() > 0) {
                return nodeList.item(0).getTextContent();
            }

            nodeList = doc.getElementsByTagName(tagName);
            if (nodeList.getLength() > 0) {
                return nodeList.item(0).getTextContent();
            }

            throw new RuntimeException("No se encontró la etiqueta <" + tagName + "> en la respuesta SOAP de NOVO");
        } catch (Exception e) {
            throw new RuntimeException("Error al analizar XML de respuesta SOAP: " + e.getMessage(), e);
        }
    }

    private String tryExtractSoapFault(String xml) {
        if (xml == null || xml.isBlank()) return null;
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

            NodeList faultStringList = doc.getElementsByTagNameNS("*", "faultstring");
            if (faultStringList.getLength() > 0) {
                return faultStringList.item(0).getTextContent();
            }
            
            faultStringList = doc.getElementsByTagName("faultstring");
            if (faultStringList.getLength() > 0) {
                return faultStringList.item(0).getTextContent();
            }
        } catch (Exception ignored) {
            if (xml.contains("<faultstring>")) {
                int start = xml.indexOf("<faultstring>") + "<faultstring>".length();
                int end = xml.indexOf("</faultstring>");
                if (end > start) {
                    return xml.substring(start, end);
                }
            }
        }
        return null;
    }
}
