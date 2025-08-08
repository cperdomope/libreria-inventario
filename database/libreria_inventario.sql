-- ================================================================
-- LIBRERÍA DIGITAL - BASE DE DATOS
-- Sistema de Inventario para Librería
-- Archivo: database/libreria_inventario.sql
-- Versión: 1.0
-- Fecha: 2025-08-08
-- ================================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS libreria_inventario 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE libreria_inventario;

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
    INDEX idx_estado (estado),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

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
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
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
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
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
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
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
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
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
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
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
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
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
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE RESTRICT
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
    referencia_id INT NULL, -- ID de venta, compra, etc.
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
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
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
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
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
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE RESTRICT
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
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
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
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
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
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ================================================================
-- TRIGGERS PARA ACTUALIZAR STOCK AUTOMÁTICAMENTE
-- ================================================================

-- Trigger para actualizar stock después de una venta
DELIMITER //
CREATE TRIGGER after_detalle_venta_insert
    AFTER INSERT ON detalles_venta
    FOR EACH ROW
BEGIN
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
        (SELECT stock_actual + NEW.cantidad FROM libros WHERE id = NEW.libro_id),
        (SELECT stock_actual FROM libros WHERE id = NEW.libro_id),
        NEW.precio_unitario, NEW.subtotal,
        NEW.venta_id, 'venta',
        (SELECT usuario_id FROM ventas WHERE id = NEW.venta_id)
    );
END;//

-- Trigger para actualizar stock después de una compra
CREATE TRIGGER after_detalle_compra_update
    AFTER UPDATE ON detalles_compra
    FOR EACH ROW
BEGIN
    IF NEW.cantidad_recibida > OLD.cantidad_recibida THEN
        SET @cantidad_diferencia = NEW.cantidad_recibida - OLD.cantidad_recibida;
        
        -- Actualizar stock del libro
        UPDATE libros 
        SET stock_actual = stock_actual + @cantidad_diferencia,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = NEW.libro_id;
        
        -- Registrar movimiento de stock
        INSERT INTO movimientos_stock (
            libro_id, tipo_movimiento, motivo, cantidad, 
            stock_anterior, stock_nuevo, precio_unitario, total,
            referencia_id, referencia_tipo, usuario_id
        ) VALUES (
            NEW.libro_id, 'entrada', 'compra', @cantidad_diferencia,
            (SELECT stock_actual - @cantidad_diferencia FROM libros WHERE id = NEW.libro_id),
            (SELECT stock_actual FROM libros WHERE id = NEW.libro_id),
            NEW.precio_unitario, (NEW.precio_unitario * @cantidad_diferencia),
            NEW.compra_id, 'compra',
            (SELECT usuario_id FROM compras WHERE id = NEW.compra_id)
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
-- COMENTARIOS FINALES
-- ================================================================
-- Base de datos creada exitosamente para el Sistema de Inventario
-- Incluye todas las tablas necesarias para:
-- - Gestión de usuarios y autenticación
-- - Inventario de libros y categorías
-- - Proveedores y compras
-- - Clientes y ventas
-- - Control de stock automático
-- - Auditoría y reportes
-- - Configuración del sistema
-- 
-- Total de tablas: 13
-- Total de vistas: 3
-- Total de triggers: 2
-- ================================================================