-- ================================================================
-- SCRIPT SIMPLIFICADO PARA MYSQL LOCAL - LIBRERÍA DIGITAL
-- Contraseña de MySQL: root
-- ================================================================

-- Crear base de datos
DROP DATABASE IF EXISTS libreria_inventario;
CREATE DATABASE libreria_inventario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE libreria_inventario;

-- ================================================================
-- TABLA: usuarios
-- ================================================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'seller', 'inventory', 'readonly') NOT NULL DEFAULT 'readonly',
    estado ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo',
    ultimo_acceso DATETIME NULL,
    intentos_login INT DEFAULT 0,
    bloqueado_hasta DATETIME NULL,
    telefono VARCHAR(20) NULL,
    direccion TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_estado (estado)
);

-- ================================================================
-- TABLA: sesiones
-- ================================================================
CREATE TABLE sesiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ================================================================
-- TABLA: categorias
-- ================================================================
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    icono VARCHAR(50) DEFAULT 'fas fa-book',
    estado ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
    orden_display INT DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre),
    INDEX idx_estado (estado),
    INDEX idx_orden_display (orden_display)
);

-- ================================================================
-- TABLA: proveedores
-- ================================================================
CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    razon_social VARCHAR(150) NULL,
    nit VARCHAR(20) UNIQUE NULL,
    email VARCHAR(100) NULL,
    telefono VARCHAR(20) NULL,
    direccion TEXT NULL,
    ciudad VARCHAR(50) NULL,
    pais VARCHAR(50) DEFAULT 'Colombia',
    contacto_nombre VARCHAR(100) NULL,
    contacto_telefono VARCHAR(20) NULL,
    contacto_email VARCHAR(100) NULL,
    terminos_pago ENUM('contado', '15_dias', '30_dias', '60_dias') DEFAULT 'contado',
    descuento_por_volumen DECIMAL(5,2) DEFAULT 0.00,
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    notas TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre),
    INDEX idx_nit (nit),
    INDEX idx_email (email),
    INDEX idx_estado (estado)
);

-- ================================================================
-- TABLA: libros
-- ================================================================
CREATE TABLE libros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255) NULL,
    isbn VARCHAR(20) UNIQUE NULL,
    isbn13 VARCHAR(20) UNIQUE NULL,
    autor VARCHAR(200) NOT NULL,
    editorial VARCHAR(100) NULL,
    año_publicacion YEAR NULL,
    edicion VARCHAR(50) NULL,
    idioma VARCHAR(30) DEFAULT 'Español',
    paginas INT NULL,
    formato ENUM('tapa_dura', 'tapa_blanda', 'bolsillo', 'digital') DEFAULT 'tapa_blanda',
    categoria_id INT NOT NULL,
    proveedor_id INT NULL,
    precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    stock_maximo INT NULL,
    ubicacion VARCHAR(50) NULL,
    descripcion TEXT NULL,
    imagen_portada VARCHAR(255) NULL,
    codigo_barras VARCHAR(50) NULL,
    peso DECIMAL(6,2) NULL,
    dimensiones VARCHAR(50) NULL,
    estado ENUM('disponible', 'agotado', 'descontinuado', 'reservado') NOT NULL DEFAULT 'disponible',
    destacado BOOLEAN DEFAULT FALSE,
    nuevo_ingreso BOOLEAN DEFAULT FALSE,
    descuento DECIMAL(5,2) DEFAULT 0.00,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_titulo (titulo),
    INDEX idx_autor (autor),
    INDEX idx_isbn (isbn),
    INDEX idx_isbn13 (isbn13),
    INDEX idx_categoria_id (categoria_id),
    INDEX idx_proveedor_id (proveedor_id),
    INDEX idx_estado (estado),
    INDEX idx_stock_actual (stock_actual),
    INDEX idx_precio_venta (precio_venta),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

-- ================================================================
-- TABLA: clientes
-- ================================================================
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_cliente ENUM('persona', 'empresa') NOT NULL DEFAULT 'persona',
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NULL,
    razon_social VARCHAR(150) NULL,
    documento_tipo ENUM('cedula', 'nit', 'pasaporte', 'cedula_extranjeria') NOT NULL DEFAULT 'cedula',
    documento_numero VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) NULL,
    telefono VARCHAR(20) NULL,
    celular VARCHAR(20) NULL,
    direccion TEXT NULL,
    ciudad VARCHAR(50) NULL,
    departamento VARCHAR(50) NULL,
    codigo_postal VARCHAR(10) NULL,
    fecha_nacimiento DATE NULL,
    genero ENUM('masculino', 'femenino', 'otro') NULL,
    ocupacion VARCHAR(100) NULL,
    descuento_especial DECIMAL(5,2) DEFAULT 0.00,
    limite_credito DECIMAL(10,2) DEFAULT 0.00,
    saldo_actual DECIMAL(10,2) DEFAULT 0.00,
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    notas TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre),
    INDEX idx_documento (documento_numero),
    INDEX idx_email (email),
    INDEX idx_estado (estado),
    INDEX idx_tipo_cliente (tipo_cliente)
);

-- ================================================================
-- TABLA: ventas
-- ================================================================
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_factura VARCHAR(20) UNIQUE NOT NULL,
    cliente_id INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    descuento_valor DECIMAL(10,2) DEFAULT 0.00,
    impuestos DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    metodo_pago ENUM('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'mixto') NOT NULL DEFAULT 'efectivo',
    estado ENUM('pendiente', 'completada', 'cancelada', 'anulada') NOT NULL DEFAULT 'pendiente',
    notas TEXT NULL,
    fecha_entrega DATE NULL,
    direccion_entrega TEXT NULL,
    estado_entrega ENUM('pendiente', 'enviado', 'entregado') NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_numero_factura (numero_factura),
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_fecha_venta (fecha_venta),
    INDEX idx_estado (estado),
    INDEX idx_metodo_pago (metodo_pago),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- ================================================================
-- TABLA: detalles_venta
-- ================================================================
CREATE TABLE detalles_venta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    libro_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    descuento_valor DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_venta_id (venta_id),
    INDEX idx_libro_id (libro_id),
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE RESTRICT
);

-- ================================================================
-- TABLA: auditoria
-- ================================================================
CREATE TABLE auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    accion ENUM('crear', 'actualizar', 'eliminar', 'login', 'logout', 'acceso_denegado') NOT NULL,
    tabla_afectada VARCHAR(50) NULL,
    registro_id INT NULL,
    datos_anteriores JSON NULL,
    datos_nuevos JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    descripcion TEXT NULL,
    fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_tabla_afectada (tabla_afectada),
    INDEX idx_fecha_accion (fecha_accion),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ================================================================
-- INSERTAR DATOS INICIALES (contraseña en texto plano para desarrollo)
-- ================================================================

-- USUARIOS con contraseñas simples para desarrollo
INSERT INTO usuarios (nombre, email, password, rol, estado, telefono, direccion) VALUES
('Administrador Sistema', 'admin@libreria.com', 'admin123', 'admin', 'activo', '3001234567', 'Calle Principal #123'),
('Ana García', 'vendedor@libreria.com', 'admin123', 'seller', 'activo', '3007654321', 'Carrera 45 #23-12'),
('Luis Sánchez', 'inventario@libreria.com', 'admin123', 'inventory', 'activo', '3009876543', 'Avenida 68 #34-56'),
('María Rodríguez', 'consulta@libreria.com', 'admin123', 'readonly', 'activo', '3005432198', 'Transversal 12 #45-78');

-- CATEGORÍAS
INSERT INTO categorias (nombre, descripcion, color, icono, orden_display) VALUES
('Ficción', 'Novelas y cuentos de ficción', '#8B5CF6', 'fas fa-magic', 1),
('No Ficción', 'Libros de ensayo y biografías', '#10B981', 'fas fa-graduation-cap', 2),
('Ciencia', 'Libros científicos y técnicos', '#3B82F6', 'fas fa-flask', 3),
('Historia', 'Libros de historia', '#F59E0B', 'fas fa-landmark', 4),
('Autoayuda', 'Libros de desarrollo personal', '#06B6D4', 'fas fa-heart', 5),
('Infantil', 'Libros para niños y jóvenes', '#F97316', 'fas fa-child', 6);

-- PROVEEDORES
INSERT INTO proveedores (nombre, razon_social, email, telefono, ciudad) VALUES
('Editorial Planeta', 'Editorial Planeta Colombia S.A.S.', 'ventas@planeta.com.co', '(601) 345-6789', 'Bogotá'),
('Penguin Random House', 'Penguin Random House Colombia', 'comercial@penguinrandomhouse.com', '(601) 456-7890', 'Bogotá'),
('Editorial Norma', 'Grupo Editorial Norma S.A.', 'pedidos@norma.com', '(601) 567-8901', 'Bogotá');

-- LIBROS DE MUESTRA
INSERT INTO libros (titulo, autor, editorial, categoria_id, proveedor_id, precio_compra, precio_venta, stock_actual, stock_minimo, ubicacion) VALUES
('Cien años de soledad', 'Gabriel García Márquez', 'Editorial Sudamericana', 1, 1, 25000.00, 35000.00, 15, 5, 'A1-F01'),
('El amor en los tiempos del cólera', 'Gabriel García Márquez', 'Editorial Sudamericana', 1, 1, 22000.00, 32000.00, 12, 5, 'A1-F02'),
('Don Quijote de la Mancha', 'Miguel de Cervantes', 'Espasa', 1, 2, 45000.00, 65000.00, 8, 3, 'B1-C01'),
('El Alquimista', 'Paulo Coelho', 'Editorial Planeta', 5, 1, 18000.00, 25000.00, 20, 8, 'C1-A01'),
('El Principito', 'Antoine de Saint-Exupéry', 'Salamandra', 6, 3, 22000.00, 32000.00, 25, 10, 'F1-I01'),
('Breve historia del tiempo', 'Stephen Hawking', 'Crítica', 3, 2, 30000.00, 42000.00, 10, 3, 'D1-C01'),
('Sapiens', 'Yuval Noah Harari', 'Debate', 4, 2, 38000.00, 52000.00, 18, 5, 'D1-C02'),
('1984', 'George Orwell', 'Debolsillo', 1, 1, 21000.00, 30000.00, 22, 6, 'B1-C04'),
('Harry Potter y la piedra filosofal', 'J.K. Rowling', 'Salamandra', 6, 3, 32000.00, 45000.00, 35, 12, 'F1-I02'),
('Los 7 hábitos de la gente altamente efectiva', 'Stephen R. Covey', 'Paidós', 5, 2, 32000.00, 42000.00, 16, 6, 'C1-A02');

-- CLIENTES DE MUESTRA
INSERT INTO clientes (tipo_cliente, nombre, apellidos, documento_tipo, documento_numero, email, telefono, ciudad, departamento) VALUES
('persona', 'María José', 'González Pérez', 'cedula', '52123456', 'maria.gonzalez@email.com', '3001234567', 'Bogotá', 'Cundinamarca'),
('persona', 'Carlos Alberto', 'Rodríguez Silva', 'cedula', '1023456789', 'carlos.rodriguez@email.com', '3102345678', 'Bogotá', 'Cundinamarca'),
('empresa', 'Colegio San José', NULL, 'nit', '830123456-7', 'biblioteca@colegiosanjose.edu.co', '3004567890', 'Bogotá', 'Cundinamarca'),
('persona', 'Ana Lucía', 'Martínez López', 'cedula', '41234567', 'ana.martinez@email.com', '3203456789', 'Bogotá', 'Cundinamarca'),
('persona', 'Luis Fernando', 'Sánchez Torres', 'cedula', '79123456', 'luis.sanchez@email.com', '3105678901', 'Bogotá', 'Cundinamarca');

-- VENTAS DE MUESTRA
INSERT INTO ventas (numero_factura, cliente_id, usuario_id, fecha_venta, subtotal, impuestos, total, metodo_pago, estado) VALUES
('FAC-001001', 1, 2, '2025-08-07 10:30:00', 70000.00, 13300.00, 83300.00, 'efectivo', 'completada'),
('FAC-001002', 2, 2, '2025-08-07 14:15:00', 25000.00, 4750.00, 29750.00, 'tarjeta_credito', 'completada'),
('FAC-001003', 3, 1, '2025-08-08 09:45:00', 90000.00, 17100.00, 107100.00, 'transferencia', 'completada');

-- DETALLES DE VENTAS
INSERT INTO detalles_venta (venta_id, libro_id, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 2, 35000.00, 70000.00),
(2, 4, 1, 25000.00, 25000.00),
(3, 3, 1, 65000.00, 65000.00),
(3, 4, 1, 25000.00, 25000.00);

-- REGISTRO DE AUDITORÍA INICIAL
INSERT INTO auditoria (usuario_id, accion, tabla_afectada, descripcion) VALUES
(1, 'crear', 'sistema', 'Sistema inicializado con MySQL local y contraseña root');

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================
SELECT 'CONFIGURACIÓN MYSQL COMPLETADA' as status;
SELECT 'Contraseña MySQL configurada: root' as config;
SELECT 'Base de datos: libreria_inventario' as database_name;

-- MOSTRAR CREDENCIALES DE LOGIN
SELECT 'CREDENCIALES DE LOGIN:' as info;
SELECT 
    email as 'Email',
    'admin123' as 'Password',
    rol as 'Rol',
    estado as 'Estado'
FROM usuarios 
ORDER BY id;

SELECT CONCAT('Total de registros creados: ', 
    (SELECT COUNT(*) FROM usuarios), ' usuarios, ',
    (SELECT COUNT(*) FROM categorias), ' categorías, ',
    (SELECT COUNT(*) FROM libros), ' libros, ',
    (SELECT COUNT(*) FROM clientes), ' clientes'
) as resumen;