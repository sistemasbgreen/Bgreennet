

CREATE TABLE ImagenLogin (
    id INT IDENTITY(1,1) PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    nombre VARCHAR(255),
    activo BIT DEFAULT 1,
    date_create DATETIME DEFAULT GETDATE(),
    date_modify DATETIME,
    usuario_creacion VARCHAR(100)
);

INSERT INTO ImagenLogin (url, nombre, activo, usuario_creacion) VALUES 
('https://bgreennet.bgreen.com.co/imagenes/Fondo_Pantalla.jpg', 'Bgreen Principal', 1, 'Sistema'),
('https://cdn.pixabay.com/photo/2025/07/17/10/48/nature-9719280_1280.png', 'Naturaleza Pixabay', 1, 'Sistema'),
('https://bgreen.com.co/Img/Inicio/Carousel4.jpg', 'Carousel 4', 1, 'Sistema'),
('https://bgreen.com.co/Img/Inicio/Carousel3.jpg', 'Carousel 3', 1, 'Sistema'),
('https://bgreen.com.co/Img/Galeria/bgreen10.jpg', 'Galería 10', 1, 'Sistema'),
('https://bgreen.com.co/Img/Galeria/bgreen13.jpg', 'Galería 13', 1, 'Sistema');
