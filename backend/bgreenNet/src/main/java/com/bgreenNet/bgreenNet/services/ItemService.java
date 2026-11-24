package com.bgreenNet.bgreenNet.services;

import com.bgreenNet.bgreenNet.dto.ItemExistenciaDTO;
import com.bgreenNet.bgreenNet.repository.ItemRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ItemService {

    private final ItemRepository itemRepository;

    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public List<ItemExistenciaDTO> getExistencias(String bodega, String busqueda) {
        return itemRepository.findExistencias(bodega, busqueda);
    }

    public List<Map<String, Object>> getBodegas() {
        return itemRepository.findBodegas();
    }

    public Map<String, Object> getResumenExistencias(String bodega) {
        List<ItemExistenciaDTO> items = itemRepository.findExistencias(bodega, null);
        double totalStock = 0.0;
        double valorTotal = 0.0;
        int itemsConStock = 0;
        int itemsSinStock = 0;

        for (ItemExistenciaDTO item : items) {
            double stock = item.getStockActual() != null ? item.getStockActual() : 0.0;
            double valor = item.getValorTotalInventario() != null ? item.getValorTotalInventario() : 0.0;
            totalStock += stock;
            valorTotal += valor;
            if (stock > 0) {
                itemsConStock++;
            } else {
                itemsSinStock++;
            }
        }

        Map<String, Object> resumen = new HashMap<>();
        resumen.put("totalItems", items.size());
        resumen.put("itemsConStock", itemsConStock);
        resumen.put("itemsSinStock", itemsSinStock);
        resumen.put("totalStock", totalStock);
        resumen.put("valorTotalInventario", valorTotal);
        resumen.put("bodega", (bodega != null && !bodega.trim().isEmpty()) ? bodega.trim() : "TODAS");
        return resumen;
    }
}
