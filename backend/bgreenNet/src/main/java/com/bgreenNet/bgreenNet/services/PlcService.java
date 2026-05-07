package com.bgreenNet.bgreenNet.services;

import com.github.s7connector.api.DaveArea;
import com.github.s7connector.api.S7Connector;
import com.github.s7connector.api.factory.S7ConnectorFactory;
import org.springframework.stereotype.Service;

import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Map;

@Service
public class PlcService {

    private final String IP_ADDRESS = "192.168.0.2";
    private final int RACK = 0;
    private final int SLOT = 1;
    
    
    

    public Map<String, Float> leerTodas() {

        Map<String, Float> valores = new HashMap<>();

        Map<String, int[]> variables = new HashMap<>();

        variables.put("120FT02", new int[]{18, 300});
        variables.put("150PT05", new int[]{18, 352});
        variables.put("320TT08", new int[]{18, 1028});
        variables.put("420TT06", new int[]{18, 32});
        variables.put("520PT032", new int[]{167, 148});
        variables.put("520TT014", new int[]{167, 124});
        variables.put("520AG01", new int[]{20, 1850});
        variables.put("520FT01", new int[]{63, 312});
        variables.put("520P05", new int[]{20, 1610});
        variables.put("550FT04", new int[]{147, 4});
        variables.put("550TT06", new int[]{285, 312});
        variables.put("550TT03", new int[]{18, 676});
        variables.put("550TT04", new int[]{18, 680});
        variables.put("550TT05", new int[]{18, 684});
        variables.put("550PT05", new int[]{18, 576});
        variables.put("550PT03", new int[]{18, 572});

        System.out.println("\n🔄 Leyendo datos del PLC...");
        int ok = 0;
        int fail = 0;

        try (S7Connector connector = S7ConnectorFactory
                .buildTCPConnector()
                .withHost(IP_ADDRESS)
                .withRack(RACK)
                .withSlot(SLOT)
                .build()) {

            for (Map.Entry<String, int[]> entry : variables.entrySet()) {

                String nombre = entry.getKey();
                int db = entry.getValue()[0];
                int offset = entry.getValue()[1];

                try {

                    byte[] data = connector.read(DaveArea.DB, db, 4, offset);

                    if (data != null && data.length == 4) {
                        float valor = ByteBuffer.wrap(data).getFloat();
                        valores.put(nombre, valor);

                        System.out.println("✔ " + nombre + " = " + valor);
                        ok++;
                    } else {
                        System.out.println("❌ " + nombre +
                                " (DB" + db + ", offset " + offset + ") - tamaño inválido");
                        fail++;
                    }

                } catch (Exception e) {
                    System.out.println("❌ " + nombre +
                            " (DB" + db + ", offset " + offset + ") - no accesible");
                    fail++;
                }
            }

            System.out.println("\n==============================");
            System.out.println("Lectura finalizada");
            System.out.println("✔ Variables OK  : " + ok);
            System.out.println("❌ Variables FAIL: " + fail);
            System.out.println("==============================\n");

        } catch (Exception e) {
            System.err.println("❌ Error general conectando al PLC:");
            e.printStackTrace();
        }

        return valores;
    }
}
