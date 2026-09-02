package com.bgreenNet.bgreenNet.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping({"/api/logistico", "/logistico"})
@CrossOrigin(origins = "*")
public class LogisticoController {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String TBS_API_URL = "https://tbs.com.co/tbs/system/services/get_transports_public";
    private static final String API_USER = "bgreen";
    private static final String API_PASS = "cfs22.tbs24go";

    @GetMapping("/transports")
    public ResponseEntity<?> obtenerTransportesGet(
            @RequestParam(defaultValue = "900715610") String company_id,
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {
        return ejecutarConsultaRobusta(company_id, start, end);
    }

    @PostMapping("/transports")
    public ResponseEntity<?> obtenerTransportesPost(
            @RequestParam(required = false, defaultValue = "900715610") String company_id,
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end,
            @RequestBody(required = false) Map<String, Object> bodyMap) {
        
        if (bodyMap != null) {
            if (bodyMap.containsKey("company_id") && bodyMap.get("company_id") != null) {
                company_id = String.valueOf(bodyMap.get("company_id"));
            }
            if (bodyMap.containsKey("start") && bodyMap.get("start") != null) {
                start = String.valueOf(bodyMap.get("start"));
            }
            if (bodyMap.containsKey("end") && bodyMap.get("end") != null) {
                end = String.valueOf(bodyMap.get("end"));
            }
        }

        return ejecutarConsultaRobusta(company_id, start, end);
    }

    private HttpHeaders crearHeadersNavegador(String basicAuth, MediaType contentType) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", basicAuth);
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
        headers.set("Accept", "application/json, text/plain, */*");
        headers.set("Accept-Language", "es-ES,es;q=0.9,en;q=0.8");
        headers.set("Cache-Control", "no-cache");
        headers.set("Referer", "https://tbs.com.co/");
        headers.set("Origin", "https://tbs.com.co");
        headers.set("Connection", "keep-alive");
        if (contentType != null) {
            headers.setContentType(contentType);
        }
        return headers;
    }

    private ResponseEntity<?> ejecutarConsultaRobusta(String company_id, String start, String end) {
        LocalDate hoy = LocalDate.now();
        if (company_id == null || company_id.trim().isEmpty()) {
            company_id = "900715610";
        }
        if (start == null || start.trim().isEmpty()) {
            start = hoy.minusDays(30).toString();
        }
        if (end == null || end.trim().isEmpty()) {
            end = hoy.toString();
        }

        String credentials = API_USER + ":" + API_PASS;
        String basicAuth = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        System.out.println("=== LogisticoController: Iniciando consulta a TBS ===");
        System.out.println("URL: " + TBS_API_URL);
        System.out.println("company_id=" + company_id + ", start=" + start + ", end=" + end);
        System.out.println("Authorization header (primeros 20 chars): " + basicAuth.substring(0, Math.min(20, basicAuth.length())) + "...");

        // Intento 1 (Principal - Postman exact match): POST con Multipart Form-Data
        try {
            HttpHeaders headers = crearHeadersNavegador(basicAuth, MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> multipartBody = new LinkedMultiValueMap<>();
            multipartBody.add("company_id", company_id);
            multipartBody.add("start", start);
            multipartBody.add("end", end);

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(multipartBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(TBS_API_URL, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                System.out.println("✅ Intento 1 exitoso!");
                return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response.getBody());
            }
        } catch (HttpStatusCodeException e1) {
            System.err.println("❌ Intento 1 POST MultipartFormData falló con status: " + e1.getStatusCode() + " | Headers respuesta: " + e1.getResponseHeaders() + " | Body: " + e1.getResponseBodyAsString());
        } catch (Exception e1) {
            System.err.println("❌ Intento 1 POST MultipartFormData falló: " + e1.getMessage());
        }

        // Intento 2: POST con Query Params en la URL
        try {
            String urlConParams = UriComponentsBuilder.fromHttpUrl(TBS_API_URL)
                    .queryParam("company_id", company_id)
                    .queryParam("start", start)
                    .queryParam("end", end)
                    .toUriString();

            HttpHeaders headers = crearHeadersNavegador(basicAuth, null);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(urlConParams, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response.getBody());
            }
        } catch (HttpStatusCodeException e2) {
            System.err.println("Intento 2 POST QueryParams falló con status: " + e2.getStatusCode());
        } catch (Exception e2) {
            System.err.println("Intento 2 POST QueryParams falló: " + e2.getMessage());
        }

        // Intento 3: POST con JSON Body
        try {
            HttpHeaders headers = crearHeadersNavegador(basicAuth, MediaType.APPLICATION_JSON);

            Map<String, String> jsonBody = new HashMap<>();
            jsonBody.put("company_id", company_id);
            jsonBody.put("start", start);
            jsonBody.put("end", end);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(TBS_API_URL, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response.getBody());
            }
        } catch (HttpStatusCodeException e3) {
            System.err.println("Intento 3 POST JSON Body falló con status: " + e3.getStatusCode());
        } catch (Exception e3) {
            System.err.println("Intento 3 POST JSON Body falló: " + e3.getMessage());
        }

        // Intento 4: POST Form UrlEncoded
        try {
            HttpHeaders headers = crearHeadersNavegador(basicAuth, MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> formBody = new LinkedMultiValueMap<>();
            formBody.add("company_id", company_id);
            formBody.add("start", start);
            formBody.add("end", end);

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(formBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(TBS_API_URL, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response.getBody());
            }
        } catch (HttpStatusCodeException e4) {
            System.err.println("Intento 4 POST FormUrlEncoded falló con status: " + e4.getStatusCode());
        } catch (Exception e4) {
            System.err.println("Intento 4 POST FormUrlEncoded falló: " + e4.getMessage());
        }

        // Intento 5: GET con Query Params
        try {
            String urlConParams = UriComponentsBuilder.fromHttpUrl(TBS_API_URL)
                    .queryParam("company_id", company_id)
                    .queryParam("start", start)
                    .queryParam("end", end)
                    .toUriString();

            HttpHeaders headers = crearHeadersNavegador(basicAuth, null);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(urlConParams, HttpMethod.GET, entity, String.class);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response.getBody());

        } catch (HttpStatusCodeException e5) {
            System.err.println("Intento 5 GET falló con status: " + e5.getStatusCode() + " | Body: " + e5.getResponseBodyAsString());
            
            String detalleMsg = "El servicio externo TBS (tbs.com.co) retornó estado HTTP " + e5.getStatusCode().value();
            if (e5.getStatusCode().value() == 403) {
                detalleMsg = "Acceso denegado (403 Forbidden) por la API externa TBS (tbs.com.co). Es posible que las credenciales no tengan permiso, la IP esté bloqueada o la API requiera autorización actualizada.";
            } else if (e5.getStatusCode().value() == 401) {
                detalleMsg = "Credenciales no válidas (401 Unauthorized) para acceder a la API externa de TBS.";
            } else if (e5.getStatusCode().value() == 404) {
                detalleMsg = "El endpoint de la API externa de TBS no fue encontrado (404 Not Found).";
            }

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al consultar la API externa de TBS");
            errorResponse.put("detalle", detalleMsg);
            errorResponse.put("statusTBS", e5.getStatusCode().value());
            errorResponse.put("respuestaTBS", e5.getResponseBodyAsString());

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        } catch (Exception e5) {
            System.err.println("Error general al consultar TBS: " + e5.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error interno al consultar servicio de transportes TBS");
            errorResponse.put("detalle", "No fue posible establecer conexión con el servidor externo TBS: " + e5.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }
}
