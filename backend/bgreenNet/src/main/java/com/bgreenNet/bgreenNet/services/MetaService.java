package com.bgreenNet.bgreenNet.services;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.MetaResponseDTO;
import com.bgreenNet.bgreenNet.dto.ProductoDTO;
import com.bgreenNet.bgreenNet.repository.MetaRepository;

@Service
public class MetaService {
	
	@Autowired
    private MetaRepository repository;

    public List<ProductoDTO> getProductos() {
        return repository.obtenerProductos();
    }

    public MetaResponseDTO getMetas(String productoId, int anio) {
        return new MetaResponseDTO(repository.obtenerMetas(productoId, anio));
    }

    public void guardarMeta(String productoId, int anio, int mes, double valor, String usuario) {
        repository.guardarMeta(productoId, anio, mes, valor, usuario);
    }

    public MetaResponseDTO getCostoDirecto(int anio) {
        return new MetaResponseDTO(repository.obtenerCostoDirecto(anio));
    }
    
    public void guardarCosto(int anio, int mes, double valor, String usuario) {
        repository.guardarCosto(anio, mes, valor, usuario);
    }

    public int insertarProducto(ProductoDTO producto) {
        return repository.insertarProducto(producto);
    }

    public void actualizarProducto(ProductoDTO producto) {
        repository.actualizarProducto(producto);
    }

    public void eliminarTiposDocumentoPorProducto(String productoId) {
        repository.eliminarTiposDocumentoPorProducto(productoId);
    }

    public void insertarTipoDocumento(String productoId, String tipoMov, String tipoDoc) {
        repository.insertarTipoDocumento(productoId, tipoMov, tipoDoc);
    }

    public List<Map<String, Object>> getTiposDocumento() {
        return repository.obtenerTiposDocumento();
    }

    public List<Map<String, Object>> getTiposMovimiento() {
        return repository.obtenerTiposMovimiento();
    }

    public Map<String, Object> validarProductoEnSiesa(String id) {
        return repository.validarProductoEnSiesa(id);
    }

}
