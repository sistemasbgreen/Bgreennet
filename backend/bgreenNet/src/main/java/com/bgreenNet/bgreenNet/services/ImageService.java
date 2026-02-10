package com.bgreenNet.bgreenNet.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImageService {

    @Value("${upload.path}")
    private String uploadPath;

    public String saveImage(MultipartFile file) throws IOException {
        // Validar tipo de archivo
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Solo se permiten imágenes");
        }

        // Validar tamaño (2MB)
        long maxSize = 2 * 1024 * 1024; // 2MB en bytes
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("El tamaño máximo es de 2MB");
        }

        // Generar nombre único
        String extension = getExtension(file.getOriginalFilename());
        String fileName = "pulso_" + UUID.randomUUID() + extension;

        // Crear directorio si no existe
        Path uploadDir = Paths.get(uploadPath);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        // Guardar archivo
        Path filePath = uploadDir.resolve(fileName);
        file.transferTo(filePath.toFile());

        // Devolver ruta relativa
        return "/Imagenes/Img/" + fileName;
    }

    private String getExtension(String fileName) {
        if (fileName == null) {
            return "";
        }
        int i = fileName.lastIndexOf('.');
        return i > 0 ? fileName.substring(i) : "";
    }
}