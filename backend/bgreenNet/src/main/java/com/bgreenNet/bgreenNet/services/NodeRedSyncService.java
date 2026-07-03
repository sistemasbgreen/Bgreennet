package com.bgreenNet.bgreenNet.services;

import com.bgreenNet.bgreenNet.models.VariableScadaConfig;
import com.bgreenNet.bgreenNet.repository.VariableScadaConfigRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NodeRedSyncService {

    @Autowired
    private VariableScadaConfigRepository variableScadaConfigRepository;

    private final String NODE_RED_URL = "http://172.30.72.143:1880/flows";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> sincronizarConfiguracion() {
        Map<String, Object> resultado = new HashMap<>();
        int actualizadas = 0;

        try {
            // Obtener el JSON de los flujos de Node-RED
            String jsonResponse = restTemplate.getForObject(NODE_RED_URL, String.class);
            if (jsonResponse == null) {
                resultado.put("success", false);
                resultado.put("message", "No se recibió respuesta de Node-RED");
                return resultado;
            }

            JsonNode flujos = objectMapper.readTree(jsonResponse);

            // Mapa para almacenar los tags encontrados en Node-RED: Tag -> {origen, db}
            Map<String, String[]> datosNodeRed = new HashMap<>();
            int s7EndpointsEncontrados = 0;

            // Recorrer todos los nodos buscando "s7 endpoint"
            for (JsonNode nodo : flujos) {
                if (nodo.has("type") && "s7 endpoint".equals(nodo.get("type").asText())) {
                    s7EndpointsEncontrados++;
                    String origen = nodo.has("name") ? nodo.get("name").asText() : "Desconocido";

                    // En node-red-contrib-s7 el array de variables puede llamarse 'variables' o 'vartable'
                    JsonNode varArray = null;
                    if (nodo.has("variables") && nodo.get("variables").isArray()) {
                        varArray = nodo.get("variables");
                    } else if (nodo.has("vartable") && nodo.get("vartable").isArray()) {
                        varArray = nodo.get("vartable");
                    }

                    if (varArray != null) {
                        for (JsonNode varNode : varArray) {
                            if (varNode.has("name") && varNode.has("addr")) {
                                String tag = varNode.get("name").asText().trim();
                                String addr = varNode.get("addr").asText().trim();
                                datosNodeRed.put(tag, new String[]{origen, addr});
                            }
                        }
                    }
                }
            }

            // Actualizar las variables en nuestra base de datos si coinciden
            List<VariableScadaConfig> variablesDB = variableScadaConfigRepository.findAll();
            for (VariableScadaConfig v : variablesDB) {
                if (datosNodeRed.containsKey(v.getTag().trim())) {
                    String[] datos = datosNodeRed.get(v.getTag().trim());
                    String nuevoOrigen = datos[0];
                    String nuevoDb = datos[1];

                    boolean cambio = false;
                    if (nuevoOrigen != null && !nuevoOrigen.equals(v.getOrigenNodeRed())) {
                        v.setOrigenNodeRed(nuevoOrigen);
                        cambio = true;
                    }
                    if (nuevoDb != null && !nuevoDb.equals(v.getDbNodeRed())) {
                        v.setDbNodeRed(nuevoDb);
                        cambio = true;
                    }

                    if (cambio) {
                        variableScadaConfigRepository.save(v);
                        actualizadas++;
                    }
                }
            }

            resultado.put("success", true);
            String debugInfo = " | Endpoints S7: " + s7EndpointsEncontrados + " | Tags en Node-RED: " + datosNodeRed.size();
            resultado.put("message", "Sincronización completa. Actualizadas: " + actualizadas + debugInfo);

        } catch (Exception e) {
            resultado.put("success", false);
            resultado.put("message", "Error al conectar con Node-RED: " + e.getMessage());
            e.printStackTrace();
        }

        return resultado;
    }
}
