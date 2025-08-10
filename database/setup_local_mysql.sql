-- ================================================================
-- LIBRERÍA DIGITAL - SCRIPT COMPLETO PARA MYSQL LOCAL
-- Archivo: database/setup_local_mysql.sql
-- Descripción: Script completo para configurar la base de datos en MySQL local
-- Fecha: 2025-08-09
-- ================================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS libreria_inventario 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE libreria_inventario;

-- Configurar el modo SQL para compatibilidad
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- ================================================================
-- ELIMINACIÓN DE TABLAS EXISTENTES (SI EXISTEN)
-- ================================================================
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS configuracion;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS detalles_compra;
DROP TABLE IF EXISTS compras;
DROP TABLE IF EXISTS movimientos_stock;
DROP TABLE IF EXISTS detalles_venta;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS libros;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS sesiones;
DROP TABLE IF EXISTS usuarios;

-- Eliminar vistas si existen
DROP VIEW IF EXISTS vista_libros_mas_vendidos;
DROP VIEW IF EXISTS vista_ventas_mensuales;
DROP VIEW IF EXISTS vista_stock_bajo;

-- ================================================================
-- TABLA: usuarios
-- Descripción: Gestión de usuarios del sistema
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
    foto_perfil VARCHAR(255) NULL,
    telefono VARCHAR(20) NULL,
    direccion TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT NULL,
    actualizado_por INT NULL,
    
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_estado (estado)
);

-- Añadir foreign keys después de crear todas las tablas
ALTER TABLE usuarios 
    ADD CONSTRAINT fk_usuarios_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_usuarios_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ================================================================
-- TABLA: sesiones
-- Descripción: Control de sesiones activas
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
    CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ================================================================
-- TABLA: categorias
-- Descripción: Categorías de libros
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
    creado_por INT NULL,
    actualizado_por INT NULL,
    
    INDEX idx_nombre (nombre),
    INDEX idx_estado (estado),
    INDEX idx_orden_display (orden_display),
    CONSTRAINT fk_categorias_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_categorias_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ================================================================
-- TABLA: proveedores
-- Descripción: Proveedores de libros
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
    creado_por INT NULL,
    actualizado_por INT NULL,
    
    INDEX idx_nombre (nombre),
    INDEX idx_nit (nit),
    INDEX idx_email (email),
    INDEX idx_estado (estado),
    CONSTRAINT fk_proveedores_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_proveedores_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ================================================================
-- TABLA: libros
-- Descripción: Inventario de libros
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
    creado_por INT NULL,
    actualizado_por INT NULL,
    
    INDEX idx_titulo (titulo),
    INDEX idx_autor (autor),
    INDEX idx_isbn (isbn),
    INDEX idx_isbn13 (isbn13),
    INDEX idx_categoria_id (categoria_id),
    INDEX idx_proveedor_id (proveedor_id),
    INDEX idx_estado (estado),
    INDEX idx_stock_actual (stock_actual),
    INDEX idx_precio_venta (precio_venta),
    FULLTEXT idx_search (titulo, autor, descripcion),
    CONSTRAINT fk_libros_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    CONSTRAINT fk_libros_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    CONSTRAINT fk_libros_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_libros_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ================================================================
-- TABLA: clientes
-- Descripción: Clientes de la librería
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
    creado_por INT NULL,
    actualizado_por INT NULL,
    
    INDEX idx_nombre (nombre),
    INDEX idx_documento (documento_numero),
    INDEX idx_email (email),
    INDEX idx_estado (estado),
    INDEX idx_tipo_cliente (tipo_cliente),
    CONSTRAINT fk_clientes_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_clientes_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ================================================================
-- TABLA: ventas
-- Descripción: Facturas y ventas
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
    creado_por INT NULL,
    actualizado_por INT NULL,
    
    INDEX idx_numero_factura (numero_factura),
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_fecha_venta (fecha_venta),
    INDEX idx_estado (estado),
    INDEX idx_metodo_pago (metodo_pago),
    CONSTRAINT fk_ventas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_ventas_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ================================================================
-- TABLA: detalles_venta
-- Descripción: Detalles de cada venta
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
    CONSTRAINT fk_detalles_venta_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalles_venta_libro FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE RESTRICT
);

-- ================================================================
-- TABLA: movimientos_stock
-- Descripción: Historial de movimientos de inventario
-- ================================================================
CREATE TABLE movimientos_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    libro_id INT NOT NULL,
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste', 'transferencia', 'devolucion') NOT NULL,
    motivo ENUM('compra', 'venta', 'ajuste_inventario', 'daño', 'perdida', 'devolucion_cliente', 'devolucion_proveedor', 'transferencia') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    precio_unitario DECIMAL(10,2) NULL,
    total DECIMAL(10,2) NULL,
    referencia_id INT NULL,
    referencia_tipo ENUM('venta', 'compra', 'ajuste', 'transferencia') NULL,
    usuario_id INT NOT NULL,
    notas TEXT NULL,
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_libro_id (libro_id),
    INDEX idx_tipo_movimiento (tipo_movimiento),
    INDEX idx_motivo (motivo),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_fecha_movimiento (fecha_movimiento),
    INDEX idx_referencia (referencia_tipo, referencia_id),
    CONSTRAINT fk_movimientos_libro FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE,
    CONSTRAINT fk_movimientos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- ================================================================
-- TABLA: compras
-- Descripción: Compras a proveedores
-- ================================================================
CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_orden VARCHAR(20) UNIQUE NOT NULL,
    proveedor_id INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_orden DATE NOT NULL,
    fecha_entrega_esperada DATE NULL,
    fecha_entrega_real DATE NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    descuento_valor DECIMAL(10,2) DEFAULT 0.00,
    impuestos DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado ENUM('borrador', 'enviada', 'confirmada', 'parcial', 'completa', 'cancelada') NOT NULL DEFAULT 'borrador',
    notas TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT NULL,
    actualizado_por INT NULL,
    
    INDEX idx_numero_orden (numero_orden),
    INDEX idx_proveedor_id (proveedor_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_fecha_orden (fecha_orden),
    INDEX idx_estado (estado),
    CONSTRAINT fk_compras_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT,
    CONSTRAINT fk_compras_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_compras_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_compras_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ================================================================
-- TABLA: detalles_compra
-- Descripción: Detalles de cada compra
-- ================================================================
CREATE TABLE detalles_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    libro_id INT NOT NULL,
    cantidad_ordenada INT NOT NULL DEFAULT 1,
    cantidad_recibida INT NOT NULL DEFAULT 0,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    descuento_valor DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_compra_id (compra_id),
    INDEX idx_libro_id (libro_id),
    CONSTRAINT fk_detalles_compra_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalles_compra_libro FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE RESTRICT
);

-- ================================================================
-- TABLA: pagos
-- Descripción: Pagos de ventas y compras
-- ================================================================
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_referencia ENUM('venta', 'compra') NOT NULL,
    referencia_id INT NOT NULL,
    numero_pago VARCHAR(20) UNIQUE NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque') NOT NULL,
    numero_transaccion VARCHAR(100) NULL,
    banco VARCHAR(50) NULL,
    numero_cheque VARCHAR(50) NULL,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE NULL,
    estado ENUM('pendiente', 'completado', 'rechazado', 'cancelado') NOT NULL DEFAULT 'completado',
    notas TEXT NULL,
    usuario_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tipo_referencia (tipo_referencia, referencia_id),
    INDEX idx_numero_pago (numero_pago),
    INDEX idx_metodo_pago (metodo_pago),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_estado (estado),
    INDEX idx_usuario_id (usuario_id),
    CONSTRAINT fk_pagos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- ================================================================
-- TABLA: configuracion
-- Descripción: Configuración del sistema
-- ================================================================
CREATE TABLE configuracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NULL,
    descripcion TEXT NULL,
    tipo ENUM('texto', 'numero', 'booleano', 'json') NOT NULL DEFAULT 'texto',
    categoria VARCHAR(50) DEFAULT 'general',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    actualizado_por INT NULL,
    
    INDEX idx_clave (clave),
    INDEX idx_categoria (categoria),
    CONSTRAINT fk_configuracion_usuario FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ================================================================
-- TABLA: auditoria
-- Descripción: Log de auditoría del sistema
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
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ================================================================
-- TRIGGERS PARA ACTUALIZAR STOCK AUTOMÁTICAMENTE
-- ================================================================

DELIMITER //

CREATE TRIGGER after_detalle_venta_insert
    AFTER INSERT ON detalles_venta
    FOR EACH ROW
BEGIN
    DECLARE stock_anterior INT;
    DECLARE venta_usuario_id INT;
    
    -- Obtener stock anterior
    SELECT stock_actual INTO stock_anterior FROM libros WHERE id = NEW.libro_id;
    
    -- Obtener usuario de la venta
    SELECT usuario_id INTO venta_usuario_id FROM ventas WHERE id = NEW.venta_id;
    
    -- Actualizar stock del libro
    UPDATE libros 
    SET stock_actual = stock_actual - NEW.cantidad,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = NEW.libro_id;
    
    -- Registrar movimiento de stock
    INSERT INTO movimientos_stock (
        libro_id, tipo_movimiento, motivo, cantidad, 
        stock_anterior, stock_nuevo, precio_unitario, total,
        referencia_id, referencia_tipo, usuario_id
    ) VALUES (
        NEW.libro_id, 'salida', 'venta', NEW.cantidad,
        stock_anterior,
        stock_anterior - NEW.cantidad,
        NEW.precio_unitario, NEW.subtotal,
        NEW.venta_id, 'venta',
        venta_usuario_id
    );
END;//

CREATE TRIGGER after_detalle_compra_update
    AFTER UPDATE ON detalles_compra
    FOR EACH ROW
BEGIN
    DECLARE stock_anterior INT;
    DECLARE cantidad_diferencia INT;
    DECLARE compra_usuario_id INT;
    
    IF NEW.cantidad_recibida > OLD.cantidad_recibida THEN
        SET cantidad_diferencia = NEW.cantidad_recibida - OLD.cantidad_recibida;
        
        -- Obtener stock anterior
        SELECT stock_actual INTO stock_anterior FROM libros WHERE id = NEW.libro_id;
        
        -- Obtener usuario de la compra
        SELECT usuario_id INTO compra_usuario_id FROM compras WHERE id = NEW.compra_id;
        
        -- Actualizar stock del libro
        UPDATE libros 
        SET stock_actual = stock_actual + cantidad_diferencia,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = NEW.libro_id;
        
        -- Registrar movimiento de stock
        INSERT INTO movimientos_stock (
            libro_id, tipo_movimiento, motivo, cantidad, 
            stock_anterior, stock_nuevo, precio_unitario, total,
            referencia_id, referencia_tipo, usuario_id
        ) VALUES (
            NEW.libro_id, 'entrada', 'compra', cantidad_diferencia,
            stock_anterior,
            stock_anterior + cantidad_diferencia,
            NEW.precio_unitario, (NEW.precio_unitario * cantidad_diferencia),
            NEW.compra_id, 'compra',
            compra_usuario_id
        );
    END IF;
END;//

DELIMITER ;

-- ================================================================
-- VISTAS ÚTILES
-- ================================================================

-- Vista: Libros con stock bajo
CREATE VIEW vista_stock_bajo AS
SELECT 
    l.id,
    l.titulo,
    l.autor,
    l.stock_actual,
    l.stock_minimo,
    c.nombre as categoria,
    p.nombre as proveedor,
    l.precio_venta,
    l.ubicacion
FROM libros l
LEFT JOIN categorias c ON l.categoria_id = c.id
LEFT JOIN proveedores p ON l.proveedor_id = p.id
WHERE l.stock_actual <= l.stock_minimo
AND l.estado = 'disponible'
ORDER BY l.stock_actual ASC;

-- Vista: Resumen de ventas por mes
CREATE VIEW vista_ventas_mensuales AS
SELECT 
    YEAR(fecha_venta) as año,
    MONTH(fecha_venta) as mes,
    COUNT(*) as total_ventas,
    SUM(total) as monto_total,
    AVG(total) as ticket_promedio,
    COUNT(DISTINCT cliente_id) as clientes_unicos
FROM ventas 
WHERE estado = 'completada'
GROUP BY YEAR(fecha_venta), MONTH(fecha_venta)
ORDER BY año DESC, mes DESC;

-- Vista: Top libros más vendidos
CREATE VIEW vista_libros_mas_vendidos AS
SELECT 
    l.id,
    l.titulo,
    l.autor,
    c.nombre as categoria,
    SUM(dv.cantidad) as total_vendido,
    SUM(dv.subtotal) as ingresos_generados,
    COUNT(DISTINCT dv.venta_id) as numero_ventas
FROM libros l
INNER JOIN detalles_venta dv ON l.id = dv.libro_id
INNER JOIN ventas v ON dv.venta_id = v.id
LEFT JOIN categorias c ON l.categoria_id = c.id
WHERE v.estado = 'completada'
GROUP BY l.id, l.titulo, l.autor, c.nombre
ORDER BY total_vendido DESC;

-- ================================================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ================================================================
CREATE INDEX idx_ventas_fecha_estado ON ventas(fecha_venta, estado);
CREATE INDEX idx_movimientos_stock_fecha_tipo ON movimientos_stock(fecha_movimiento, tipo_movimiento);
CREATE INDEX idx_libros_stock_categoria ON libros(stock_actual, categoria_id);
CREATE INDEX idx_auditoria_fecha_usuario ON auditoria(fecha_accion, usuario_id);

-- ================================================================
-- INSERTAR DATOS INICIALES
-- ================================================================

-- Configuración inicial
INSERT INTO configuracion (clave, valor, descripcion, tipo, categoria) VALUES
('empresa_nombre', 'Librería Digital', 'Nombre de la empresa', 'texto', 'empresa'),
('empresa_nit', '900123456-7', 'NIT de la empresa', 'texto', 'empresa'),
('empresa_direccion', 'Calle 123 #45-67, Bogotá, Colombia', 'Dirección de la empresa', 'texto', 'empresa'),
('empresa_telefono', '(601) 234-5678', 'Teléfono de la empresa', 'texto', 'empresa'),
('empresa_email', 'info@libreriadigital.com', 'Email de contacto', 'texto', 'empresa'),
('moneda_simbolo', '$', 'Símbolo de la moneda', 'texto', 'sistema'),
('moneda_codigo', 'COP', 'Código de la moneda', 'texto', 'sistema'),
('iva_porcentaje', '19', 'Porcentaje de IVA', 'numero', 'sistema'),
('stock_minimo_global', '5', 'Stock mínimo por defecto', 'numero', 'inventario'),
('precio_margen_defecto', '30', 'Margen de ganancia por defecto (%)', 'numero', 'ventas'),
('factura_consecutivo', '1000', 'Último número de factura', 'numero', 'ventas'),
('backup_automatico', 'true', 'Realizar backup automático', 'booleano', 'sistema'),
('notificaciones_stock_bajo', 'true', 'Notificar cuando hay stock bajo', 'booleano', 'inventario');

-- Usuario administrador por defecto (contraseña: admin123)
INSERT INTO usuarios (nombre, email, password, rol, estado, telefono, direccion) VALUES
('Administrador del Sistema', 'admin@libreria.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'activo', '3001234567', 'Calle Principal #123'),
('Ana García Mendez', 'vendedor@libreria.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', 'activo', '3007654321', 'Carrera 45 #23-12'),
('Luis Sánchez Torres', 'inventario@libreria.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inventory', 'activo', '3009876543', 'Avenida 68 #34-56'),
('María Rodríguez Silva', 'consulta@libreria.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'readonly', 'activo', '3005432198', 'Transversal 12 #45-78');

-- Categorías iniciales
INSERT INTO categorias (nombre, descripcion, color, icono, orden_display) VALUES
('Ficción', 'Novelas y cuentos de ficción', '#8B5CF6', 'fas fa-magic', 1),
('No Ficción', 'Libros de ensayo, biografías y documentales', '#10B981', 'fas fa-graduation-cap', 2),
('Ciencia y Tecnología', 'Libros científicos y técnicos', '#3B82F6', 'fas fa-flask', 3),
('Historia', 'Libros de historia y biografías históricas', '#F59E0B', 'fas fa-landmark', 4),
('Arte y Literatura', 'Libros de arte, poesía y crítica literaria', '#EF4444', 'fas fa-palette', 5),
('Autoayuda', 'Libros de desarrollo personal', '#06B6D4', 'fas fa-heart', 6),
('Infantil y Juvenil', 'Libros para niños y jóvenes', '#F97316', 'fas fa-child', 7),
('Clásicos', 'Literatura clásica universal', '#6366F1', 'fas fa-crown', 8),
('Religión y Espiritualidad', 'Libros religiosos y espirituales', '#A855F7', 'fas fa-pray', 9),
('Economía y Negocios', 'Libros de administración y finanzas', '#059669', 'fas fa-chart-line', 10);

-- Proveedores iniciales
INSERT INTO proveedores (nombre, razon_social, nit, email, telefono, direccion, ciudad, contacto_nombre, contacto_telefono, contacto_email, terminos_pago, descuento_por_volumen) VALUES
('Editorial Planeta', 'Editorial Planeta Colombia S.A.S.', '860123456-1', 'ventas@planeta.com.co', '(601) 345-6789', 'Av. El Dorado #45-23', 'Bogotá', 'Carmen López', '3101234567', 'carmen.lopez@planeta.com.co', '30_dias', 5.00),
('Penguin Random House', 'Penguin Random House Colombia', '860234567-2', 'comercial@penguinrandomhouse.com', '(601) 456-7890', 'Calle 72 #12-34', 'Bogotá', 'Roberto Méndez', '3102345678', 'roberto.mendez@penguinrandomhouse.com', '30_dias', 7.50),
('Editorial Norma', 'Grupo Editorial Norma S.A.', '860345678-3', 'pedidos@norma.com', '(601) 567-8901', 'Carrera 15 #78-90', 'Bogotá', 'Patricia Silva', '3103456789', 'patricia.silva@norma.com', '15_dias', 4.00);

-- Libros de muestra
INSERT INTO libros (titulo, subtitulo, isbn, isbn13, autor, editorial, año_publicacion, edicion, idioma, paginas, formato, categoria_id, proveedor_id, precio_compra, precio_venta, stock_actual, stock_minimo, ubicacion, descripcion, codigo_barras) VALUES
('Cien años de soledad', NULL, '0307474720', '9780307474728', 'Gabriel García Márquez', 'Editorial Sudamericana', 1967, '1ra Edición', 'Español', 417, 'tapa_blanda', 1, 1, 25000.00, 35000.00, 15, 5, 'A1-F01', 'Obra maestra del realismo mágico que narra la historia de la familia Buendía.', '9780307474728'),
('El amor en los tiempos del cólera', NULL, '0307387364', '9780307387363', 'Gabriel García Márquez', 'Editorial Sudamericana', 1985, '1ra Edición', 'Español', 368, 'tapa_blanda', 1, 1, 22000.00, 32000.00, 12, 5, 'A1-F02', 'Historia de amor que trasciende el tiempo y las adversidades.', '9780307387363'),
('Don Quijote de la Mancha', NULL, '9788424116378', '9788424116378', 'Miguel de Cervantes', 'Espasa', 1605, 'Edición Crítica', 'Español', 1200, 'tapa_dura', 8, 2, 45000.00, 65000.00, 12, 3, 'B1-C01', 'La novela más importante de la literatura española.', '9788424116378'),
('El Alquimista', NULL, '9788408043331', '9788408043331', 'Paulo Coelho', 'Editorial Planeta', 1988, '1ra Edición', 'Español', 192, 'tapa_blanda', 6, 1, 18000.00, 25000.00, 20, 8, 'C1-A01', 'Fábula sobre seguir los sueños personales.', '9788408043331'),
('El Principito', NULL, '9788478887227', '9788478887227', 'Antoine de Saint-Exupéry', 'Salamandra', 1943, 'Edición Ilustrada', 'Español', 96, 'tapa_dura', 7, 3, 22000.00, 32000.00, 28, 10, 'F1-I01', 'Clásico de la literatura infantil.', '9788478887227');

-- Cliente de ejemplo
INSERT INTO clientes (tipo_cliente, nombre, apellidos, documento_tipo, documento_numero, email, telefono, celular, direccion, ciudad, departamento) VALUES
('persona', 'Cliente', 'De Prueba', 'cedula', '1234567890', 'cliente@ejemplo.com', '(601) 234-5678', '3001234567', 'Calle 123 #45-67', 'Bogotá', 'Cundinamarca');

-- Registro de auditoría inicial
INSERT INTO auditoria (usuario_id, accion, tabla_afectada, descripcion, fecha_accion) VALUES
(1, 'crear', 'usuarios', 'Sistema inicializado con configuración local MySQL', NOW());

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================
SELECT 'Base de datos MySQL local configurada exitosamente' as mensaje,
       COUNT(*) as total_libros FROM libros
UNION ALL
SELECT 'Total de usuarios creados', COUNT(*) FROM usuarios
UNION ALL  
SELECT 'Total de categorías', COUNT(*) FROM categorias
UNION ALL
SELECT 'Total de proveedores', COUNT(*) FROM proveedores
UNION ALL
SELECT 'Configuración completada', 1;

-- ================================================================
-- SCRIPT COMPLETADO EXITOSAMENTE
-- ================================================================