package com.bgreenNet.bgreenNet.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.models.Area;
import com.bgreenNet.bgreenNet.models.Cargo;
import com.bgreenNet.bgreenNet.models.Empresa;
import com.bgreenNet.bgreenNet.models.Perfil;
import com.bgreenNet.bgreenNet.models.TipoIdentificacion;
import com.bgreenNet.bgreenNet.models.ImagenLogin;
import com.bgreenNet.bgreenNet.repository.ImagenLoginRepository;
import com.bgreenNet.bgreenNet.repository.AreaRepository;
import com.bgreenNet.bgreenNet.repository.CargoRepository;
import com.bgreenNet.bgreenNet.repository.EmpresaRepository;
import com.bgreenNet.bgreenNet.repository.PerfilRepository;
import com.bgreenNet.bgreenNet.repository.TipoIdentificacionRepository;
import java.time.LocalDateTime;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class ListasServices {
	
	@Autowired
    private PerfilRepository perfilRepository;
    
    @Autowired
    private EmpresaRepository empresaRepository;
    
    @Autowired
    private AreaRepository areaRepository;
    
    @Autowired
    private CargoRepository cargoRepository;
    
    @Autowired
    private TipoIdentificacionRepository tipoIdentificacionRepository;
    
    @Autowired
    private ImagenLoginRepository imagenLoginRepository;
    

    public List<Perfil> obtenerPerfiles() {
        return perfilRepository.findAll();
    }

    public List<Empresa> obtenerEmpresas() {
        return empresaRepository.findAll();
    }

    public List<Area> obtenerAreas() {
        return areaRepository.findAll();
    }

    public List<Cargo> obtenerCargos() {
        return cargoRepository.findAll();
    }
    

    public List<TipoIdentificacion> obtenerIdentificacion() {
        return tipoIdentificacionRepository.findAll();
    }

    // CRUD Imágenes Login
    public List<ImagenLogin> obtenerImagenesLogin() {
        return imagenLoginRepository.findByActivo(1);
    }

    public List<ImagenLogin> obtenerTodasLasImagenesLogin() {
        return imagenLoginRepository.findAll();
    }

    public ImagenLogin guardarImagenLogin(ImagenLogin imagen) {
        if (imagen.getId() == null) {
            imagen.setDateCreate(LocalDateTime.now());
        } else {
            imagen.setDateModify(LocalDateTime.now());
        }
        return imagenLoginRepository.save(imagen);
    }

    public void eliminarImagenLogin(Long id) {
        imagenLoginRepository.deleteById(id);
    }

}
