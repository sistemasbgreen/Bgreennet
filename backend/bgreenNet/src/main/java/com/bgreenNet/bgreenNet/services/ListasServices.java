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

    public Empresa guardarEmpresa(Empresa empresa) {
        LocalDateTime now = LocalDateTime.now();
        if (empresa.getIdEmpresa() == null) {
            empresa.setDateCreate(now);
        }
        empresa.setDateModify(now);
        if (empresa.getActivo() == null) {
            empresa.setActivo(1);
        }
        return empresaRepository.save(empresa);
    }

    public Empresa actualizarEmpresa(Integer id, Empresa datos) {
        Empresa existente = empresaRepository.findById(id).orElse(new Empresa());
        if (existente.getIdEmpresa() == null) {
            existente.setDateCreate(LocalDateTime.now());
        }
        if (datos.getDescripcionEmpresa() != null) {
            existente.setDescripcionEmpresa(datos.getDescripcionEmpresa());
        }
        if (datos.getActivo() != null) {
            existente.setActivo(datos.getActivo());
        }
        existente.setDateModify(LocalDateTime.now());
        return empresaRepository.save(existente);
    }

    public List<Area> obtenerAreas() {
        return areaRepository.findAll();
    }

    public Area guardarArea(Area area) {
        LocalDateTime now = LocalDateTime.now();
        if (area.getIdArea() == null) {
            area.setDateCreate(now);
        }
        area.setDateModify(now);
        if (area.getActivo() == null) {
            area.setActivo(1);
        }
        if (area.getIdDireccionFk() == null) {
            area.setIdDireccionFk(1L);
        }
        return areaRepository.save(area);
    }

    public Area actualizarArea(Integer id, Area datos) {
        Area existente = areaRepository.findById(id).orElse(new Area());
        if (existente.getIdArea() == null) {
            existente.setDateCreate(LocalDateTime.now());
        }
        if (datos.getDescripcionArea() != null) {
            existente.setDescripcionArea(datos.getDescripcionArea());
        }
        if (datos.getIdDireccionFk() != null) {
            existente.setIdDireccionFk(datos.getIdDireccionFk());
        } else if (existente.getIdDireccionFk() == null) {
            existente.setIdDireccionFk(1L);
        }
        if (datos.getActivo() != null) {
            existente.setActivo(datos.getActivo());
        }
        existente.setDateModify(LocalDateTime.now());
        return areaRepository.save(existente);
    }

    public List<Cargo> obtenerCargos() {
        return cargoRepository.findAll();
    }

    public Cargo guardarCargo(Cargo cargo) {
        LocalDateTime now = LocalDateTime.now();
        if (cargo.getIdCargo() == null) {
            cargo.setDateCreate(now);
        }
        cargo.setDateModify(now);
        if (cargo.getActivo() == null) {
            cargo.setActivo(1);
        }
        return cargoRepository.save(cargo);
    }

    public Cargo actualizarCargo(Integer id, Cargo datos) {
        Cargo existente = cargoRepository.findById(id).orElse(new Cargo());
        if (existente.getIdCargo() == null) {
            existente.setDateCreate(LocalDateTime.now());
        }
        if (datos.getDescripcionCargo() != null) {
            existente.setDescripcionCargo(datos.getDescripcionCargo());
        }
        if (datos.getActivo() != null) {
            existente.setActivo(datos.getActivo());
        }
        existente.setDateModify(LocalDateTime.now());
        return cargoRepository.save(existente);
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
