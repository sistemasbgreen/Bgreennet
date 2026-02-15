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

        // 🔑 FORZAR HERENCIA DE PERMISOS NTFS (agregado)
        forceInheritance(filePath);

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

    /**
     * 🔑 Método nuevo: Forzar herencia de permisos NTFS en Windows
     */
    private void forceInheritance(Path filePath) throws IOException {
        try {
            // Ejecutar icacls para habilitar herencia
            ProcessBuilder pb = new ProcessBuilder(
                "icacls", 
                filePath.toAbsolutePath().toString(), 
                "/inheritance:e"
            );
            
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            // Esperar máximo 5 segundos
            boolean completed = process.waitFor(5000, java.util.concurrent.TimeUnit.MILLISECONDS);
            
            if (!completed) {
                process.destroy();
                System.err.println("Timeout al aplicar permisos NTFS");
            }
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Proceso de permisos interrumpido: " + e.getMessage());
        } catch (IOException e) {
            // No bloqueamos la subida si fallan los permisos
            System.err.println("Advertencia: No se aplicaron permisos NTFS: " + e.getMessage());
        }
    }
}