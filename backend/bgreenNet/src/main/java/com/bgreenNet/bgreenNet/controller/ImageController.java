package com.bgreenNet.bgreenNet.controller;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.bgreenNet.bgreenNet.services.ImageService;
import com.bgreenNet.bgreenNet.util.UrlUtils;

@RestController
@RequestMapping({"/api/upload", "/upload"})
@CrossOrigin(origins = "*")
public class ImageController {


    private final ImageService imageService;

    @Autowired
    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    /**
     *Endpoint para subir imágenes , *POST /api/upload
     */
    
    @PostMapping
    public ResponseEntity<ImageUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Validar que se haya enviado un archivo
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ImageUploadResponse(null, "No se ha enviado ningún archivo"));
            }

            // Guardar imagen usando el servicio
            String imageUrl = imageService.saveImage(file);

     // Construir URL completa
     // String fullUrl = UrlUtils.sanitizeUrl("http://172.30.72.200/" + imageUrl);

      String fullUrl = UrlUtils.sanitizeUrl("https://bgreennet.bgreen.com.co" + imageUrl);
            
            return ResponseEntity.ok(new ImageUploadResponse(fullUrl, "Imagen subida exitosamente"));

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest()
                .body(new ImageUploadResponse(null, e.getMessage()));

        } catch (IOException e) {
 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ImageUploadResponse(null, "Error al guardar la imagen"));
        }
    }

 

    public static class ImageUploadResponse {
        private String url;
        private String mensaje;

        public ImageUploadResponse(String url, String mensaje) {
            this.url = url;
            this.mensaje = mensaje;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getMensaje() {
            return mensaje;
        }

        public void setMensaje(String mensaje) {
            this.mensaje = mensaje;
        }
    }
    
}
