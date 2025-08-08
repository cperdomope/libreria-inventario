-- ================================================================
-- LIBRERÍA DIGITAL - DATOS DE MUESTRA
-- Archivo: database/sample_data.sql
-- Descripción: Datos iniciales para probar el sistema
-- ================================================================

USE libreria_inventario;

-- ================================================================
-- INSERTAR DATOS DE CONFIGURACIÓN INICIAL
-- ================================================================
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

-- ================================================================
-- INSERTAR USUARIOS INICIALES
-- ================================================================
INSERT INTO usuarios (nombre, email, password, rol, estado, telefono, direccion) VALUES
('Carlos Ivan Perdomo', 'admin@libreria.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'activo', '3001234567', 'Calle Principal #123'),
('Ana García Mendez', 'vendedor@libreria.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', 'activo', '3007654321', 'Carrera 45 #23-12'),
('Luis Sánchez Torres', 'inventario@libreria.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inventory', 'activo', '3009876543', 'Avenida 68 #34-56'),
('María Rodríguez Silva', 'consulta@libreria.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'readonly', 'activo', '3005432198', 'Transversal 12 #45-78'),
('Juan Pablo Morales', 'juan.morales@libreria.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', 'activo', '3004567890', 'Diagonal 89 #12-34');

-- ================================================================
-- INSERTAR CATEGORÍAS
-- ================================================================
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

-- ================================================================
-- INSERTAR PROVEEDORES
-- ================================================================
INSERT INTO proveedores (nombre, razon_social, nit, email, telefono, direccion, ciudad, contacto_nombre, contacto_telefono, contacto_email, terminos_pago, descuento_por_volumen) VALUES
('Editorial Planeta', 'Editorial Planeta Colombia S.A.S.', '860123456-1', 'ventas@planeta.com.co', '(601) 345-6789', 'Av. El Dorado #45-23', 'Bogotá', 'Carmen López', '3101234567', 'carmen.lopez@planeta.com.co', '30_dias', 5.00),
('Penguin Random House', 'Penguin Random House Colombia', '860234567-2', 'comercial@penguinrandomhouse.com', '(601) 456-7890', 'Calle 72 #12-34', 'Bogotá', 'Roberto Méndez', '3102345678', 'roberto.mendez@penguinrandomhouse.com', '30_dias', 7.50),
('Editorial Norma', 'Grupo Editorial Norma S.A.', '860345678-3', 'pedidos@norma.com', '(601) 567-8901', 'Carrera 15 #78-90', 'Bogotá', 'Patricia Silva', '3103456789', 'patricia.silva@norma.com', '15_dias', 4.00),
('Fondo de Cultura Económica', 'FCE Colombia', '860456789-4', 'ventas@fce.com.co', '(601) 678-9012', 'Calle 11 #5-60', 'Bogotá', 'Miguel Ángel Torres', '3104567890', 'miguel.torres@fce.com.co', '60_dias', 8.00),
('Ediciones B', 'Ediciones B Colombia S.A.', '860567890-5', 'info@edicionesb.com.co', '(601) 789-0123', 'Zona Rosa, Local 201', 'Bogotá', 'Laura Gómez', '3105678901', 'laura.gomez@edicionesb.com.co', '30_dias', 6.00);

-- ================================================================
-- INSERTAR LIBROS DE MUESTRA
-- ================================================================
INSERT INTO libros (titulo, subtitulo, isbn, isbn13, autor, editorial, año_publicacion, edicion, idioma, paginas, formato, categoria_id, proveedor_id, precio_compra, precio_venta, stock_actual, stock_minimo, ubicacion, descripcion, codigo_barras) VALUES
-- Ficción
('Cien años de soledad', NULL, '0307474720', '9780307474728', 'Gabriel García Márquez', 'Editorial Sudamericana', 1967, '1ra Edición', 'Español', 417, 'tapa_blanda', 1, 1, 25000.00, 35000.00, 15, 5, 'A1-F01', 'Obra maestra del realismo mágico que narra la historia de la familia Buendía.', '9780307474728'),
('El amor en los tiempos del cólera', NULL, '0307387364', '9780307387363', 'Gabriel García Márquez', 'Editorial Sudamericana', 1985, '1ra Edición', 'Español', 368, 'tapa_blanda', 1, 1, 22000.00, 32000.00, 12, 5, 'A1-F02', 'Historia de amor que trasciende el tiempo y las adversidades.', '9780307387363'),
('Rayuela', NULL, '9788420652344', '9788420652344', 'Julio Cortázar', 'Alfaguara', 1963, '1ra Edición', 'Español', 564, 'tapa_blanda', 1, 2, 28000.00, 38000.00, 8, 3, 'A1-F03', 'Novela experimental que rompe con la narrativa tradicional.', '9788420652344'),
('La casa de los espíritus', NULL, '9788401352836', '9788401352836', 'Isabel Allende', 'Plaza & Janés', 1982, '1ra Edición', 'Español', 433, 'tapa_blanda', 1, 1, 24000.00, 34000.00, 20, 5, 'A1-F04', 'Saga familiar que mezcla lo político con lo mágico.', '9788401352836'),
('Pedro Páramo', NULL, '9788437608815', '9788437608815', 'Juan Rulfo', 'Cátedra', 1955, '1ra Edición', 'Español', 124, 'tapa_blanda', 1, 3, 18000.00, 26000.00, 25, 8, 'A1-F05', 'Obra cumbre de la literatura mexicana moderna.', '9788437608815'),

-- Clásicos
('Don Quijote de la Mancha', NULL, '9788424116378', '9788424116378', 'Miguel de Cervantes', 'Espasa', 1605, 'Edición Crítica', 'Español', 1200, 'tapa_dura', 8, 2, 45000.00, 65000.00, 12, 3, 'B1-C01', 'La novela más importante de la literatura española.', '9788424116378'),
('Hamlet', NULL, '9780141396309', '9780141396309', 'William Shakespeare', 'Penguin Classics', 1603, 'Edición Anotada', 'Español', 272, 'tapa_blanda', 8, 2, 20000.00, 29000.00, 18, 5, 'B1-C02', 'La tragedia más famosa de Shakespeare.', '9780141396309'),
('Orgullo y prejuicio', NULL, '9788491051947', '9788491051947', 'Jane Austen', 'Alianza Editorial', 1813, '1ra Edición', 'Español', 424, 'tapa_blanda', 8, 3, 22000.00, 31000.00, 14, 4, 'B1-C03', 'Romance clásico de la literatura inglesa.', '9788491051947'),
('1984', NULL, '9788499890944', '9788499890944', 'George Orwell', 'Debolsillo', 1949, '1ra Edición', 'Español', 326, 'tapa_blanda', 8, 1, 21000.00, 30000.00, 22, 6, 'B1-C04', 'Distopía sobre el totalitarismo y la vigilancia.', '9788499890944'),
('Crimen y castigo', NULL, '9788491051931', '9788491051931', 'Fiódor Dostoyevski', 'Alianza Editorial', 1866, '1ra Edición', 'Español', 671, 'tapa_blanda', 8, 3, 35000.00, 48000.00, 9, 3, 'B1-C05', 'Obra maestra de la literatura rusa.', '9788491051931'),

-- Autoayuda
('El Alquimista', NULL, '9788408043331', '9788408043331', 'Paulo Coelho', 'Editorial Planeta', 1988, '1ra Edición', 'Español', 192, 'tapa_blanda', 6, 1, 18000.00, 25000.00, 3, 8, 'C1-A01', 'Fábula sobre seguir los sueños personales.', '9788408043331'),
('Los 7 hábitos de la gente altamente efectiva', NULL, '9786073115605', '9786073115605', 'Stephen R. Covey', 'Paidós', 1989, '1ra Edición', 'Español', 416, 'tapa_blanda', 6, 2, 32000.00, 42000.00, 16, 6, 'C1-A02', 'Guía fundamental para el desarrollo personal.', '9786073115605'),
('Padre Rico, Padre Pobre', NULL, '9607707211', '9789607707215', 'Robert T. Kiyosaki', 'Aguilar', 1997, '1ra Edición', 'Español', 272, 'tapa_blanda', 6, 1, 28000.00, 38000.00, 11, 5, 'C1-A03', 'Educación financiera personal.', '9789607707215'),
('El poder del ahora', NULL, '9788484451341', '9788484451341', 'Eckhart Tolle', 'Gaia Ediciones', 1997, '1ra Edición', 'Español', 256, 'tapa_blanda', 6, 4, 25000.00, 34000.00, 13, 4, 'C1-A04', 'Guía espiritual para la transformación personal.', '9788484451341'),

-- Ciencia y Tecnología
('Breve historia del tiempo', NULL, '9788484322986', '9788484322986', 'Stephen Hawking', 'Crítica', 1988, '1ra Edición', 'Español', 246, 'tapa_blanda', 3, 2, 30000.00, 42000.00, 7, 3, 'D1-C01', 'Cosmología para el público general.', '9788484322986'),
('Sapiens: De animales a dioses', NULL, '9786073144223', '9786073144223', 'Yuval Noah Harari', 'Debate', 2011, '1ra Edición', 'Español', 496, 'tapa_blanda', 3, 2, 38000.00, 52000.00, 19, 5, 'D1-C02', 'Breve historia de la humanidad.', '9786073144223'),
('El gen egoísta', NULL, '9788434568884', '9788434568884', 'Richard Dawkins', 'Salvat', 1976, '1ra Edición', 'Español', 448, 'tapa_blanda', 3, 4, 35000.00, 47000.00, 6, 3, 'D1-C03', 'Perspectiva evolutiva desde los genes.', '9788434568884'),

-- Historia
('Guns, Germs and Steel', 'Armas, gérmenes y acero', '9780393317558', '9780393317558', 'Jared Diamond', 'Debate', 1997, '1ra Edición', 'Español', 576, 'tapa_blanda', 4, 2, 42000.00, 58000.00, 4, 2, 'E1-H01', 'Los destinos de las sociedades humanas.', '9780393317558'),
('Una historia del mundo en 12 mapas', NULL, '9786073116251', '9786073116251', 'Jerry Brotton', 'Debate', 2012, '1ra Edición', 'Español', 672, 'tapa_dura', 4, 2, 48000.00, 65000.00, 8, 3, 'E1-H02', 'Cómo los mapas han definido nuestro mundo.', '9786073116251'),

-- Infantil y Juvenil
('El Principito', NULL, '9788478887227', '9788478887227', 'Antoine de Saint-Exupéry', 'Salamandra', 1943, 'Edición Ilustrada', 'Español', 96, 'tapa_dura', 7, 3, 22000.00, 32000.00, 28, 10, 'F1-I01', 'Clásico de la literatura infantil.', '9788478887227'),
('Harry Potter y la piedra filosofal', NULL, '9788478886456', '9788478886456', 'J.K. Rowling', 'Salamandra', 1997, '1ra Edición', 'Español', 254, 'tapa_blanda', 7, 3, 32000.00, 45000.00, 35, 12, 'F1-I02', 'Primera aventura del joven mago.', '9788478886456'),
('Matilda', NULL, '9788420482095', '9788420482095', 'Roald Dahl', 'Alfaguara', 1988, '1ra Edición', 'Español', 232, 'tapa_blanda', 7, 1, 24000.00, 33000.00, 17, 6, 'F1-I03', 'Niña con poderes extraordinarios.', '9788420482095');

-- ================================================================
-- INSERTAR CLIENTES DE MUESTRA
-- ================================================================
INSERT INTO clientes (tipo_cliente, nombre, apellidos, documento_tipo, documento_numero, email, telefono, celular, direccion, ciudad, departamento) VALUES
('persona', 'María José', 'González Pérez', 'cedula', '52123456', 'maria.gonzalez@email.com', '(601) 234-5678', '3001234567', 'Calle 85 #12-34', 'Bogotá', 'Cundinamarca'),
('persona', 'Carlos Alberto', 'Rodríguez Silva', 'cedula', '1023456789', 'carlos.rodriguez@email.com', '(601) 345-6789', '3102345678', 'Carrera 15 #45-67', 'Bogotá', 'Cundinamarca'),
('persona', 'Ana Lucía', 'Martínez López', 'cedula', '41234567', 'ana.martinez@email.com', '(601) 456-7890', '3203456789', 'Avenida 68 #23-45', 'Bogotá', 'Cundinamarca'),
('empresa', 'Colegio San José', NULL, 'nit', '830123456-7', 'biblioteca@colegiosanjose.edu.co', '(601) 567-8901', '3004567890', 'Transversal 34 #12-56', 'Bogotá', 'Cundinamarca'),
('persona', 'Luis Fernando', 'Sánchez Torres', 'cedula', '79123456', 'luis.sanchez@email.com', '(601) 678-9012', '3105678901', 'Diagonal 123 #67-89', 'Bogotá', 'Cundinamarca'),
('empresa', 'Universidad Nacional', NULL, 'nit', '899999001-7', 'compras@unal.edu.co', '(601) 789-0123', '3006789012', 'Ciudad Universitaria', 'Bogotá', 'Cundinamarca'),
('persona', 'Patricia Elena', 'Morales Herrera', 'cedula', '63123456', 'patricia.morales@email.com', '(601) 890-1234', '3207890123', 'Calle 127 #45-23', 'Bogotá', 'Cundinamarca'),
('persona', 'Andrés Felipe', 'Castro Jiménez', 'cedula', '1098765432', 'andres.castro@email.com', '(601) 901-2345', '3108901234', 'Carrera 45 #78-90', 'Bogotá', 'Cundinamarca');

-- ================================================================
-- INSERTAR VENTAS DE MUESTRA
-- ================================================================
INSERT INTO ventas (numero_factura, cliente_id, usuario_id, fecha_venta, subtotal, descuento_porcentaje, descuento_valor, impuestos, total, metodo_pago, estado) VALUES
('FAC-001001', 1, 2, '2025-08-07 10:30:00', 67000.00, 0.00, 0.00, 12730.00, 79730.00, 'efectivo', 'completada'),
('FAC-001002', 2, 2, '2025-08-07 14:15:00', 35000.00, 5.00, 1750.00, 6317.50, 39567.50, 'tarjeta_credito', 'completada'),
('FAC-001003', 3, 5, '2025-08-08 09:45:00', 87500.00, 0.00, 0.00, 16625.00, 104125.00, 'transferencia', 'pendiente'),
('FAC-001004', 4, 2, '2025-08-08 11:20:00', 142750.00, 10.00, 14275.00, 24430.25, 152905.25, 'cheque', 'completada'),
('FAC-001005', 5, 5, '2025-08-08 16:30:00', 25000.00, 0.00, 0.00, 4750.00, 29750.00, 'efectivo', 'completada');

-- ================================================================
-- INSERTAR DETALLES DE VENTAS
-- ================================================================
INSERT INTO detalles_venta (venta_id, libro_id, cantidad, precio_unitario, descuento_porcentaje, descuento_valor, subtotal) VALUES
-- Venta 1 (FAC-001001)
(1, 1, 2, 35000.00, 0.00, 0.00, 70000.00),
-- Venta 2 (FAC-001002) 
(2, 11, 1, 25000.00, 0.00, 0.00, 25000.00),
-- Venta 3 (FAC-001003)
(3, 5, 1, 26000.00, 0.00, 0.00, 26000.00),
(3, 7, 2, 29000.00, 0.00, 0.00, 58000.00),
-- Venta 4 (FAC-001004)
(4, 6, 1, 65000.00, 0.00, 0.00, 65000.00),
(4, 12, 1, 42000.00, 0.00, 0.00, 42000.00),
(4, 15, 1, 52000.00, 0.00, 0.00, 52000.00),
-- Venta 5 (FAC-001005)
(5, 11, 1, 25000.00, 0.00, 0.00, 25000.00);

-- ================================================================
-- INSERTAR COMPRAS DE MUESTRA
-- ================================================================
INSERT INTO compras (numero_orden, proveedor_id, usuario_id, fecha_orden, fecha_entrega_esperada, subtotal, total, estado) VALUES
('ORD-2025-001', 1, 3, '2025-08-01', '2025-08-10', 500000.00, 500000.00, 'completa'),
('ORD-2025-002', 2, 3, '2025-08-03', '2025-08-12', 750000.00, 750000.00, 'parcial'),
('ORD-2025-003', 3, 3, '2025-08-05', '2025-08-15', 320000.00, 320000.00, 'enviada');

-- ================================================================
-- INSERTAR DETALLES DE COMPRAS
-- ================================================================
INSERT INTO detalles_compra (compra_id, libro_id, cantidad_ordenada, cantidad_recibida, precio_unitario, subtotal) VALUES
-- Compra 1 (ORD-2025-001)
(1, 1, 20, 20, 25000.00, 500000.00),
-- Compra 2 (ORD-2025-002) 
(2, 6, 15, 12, 45000.00, 675000.00),
(2, 11, 10, 8, 18000.00, 180000.00),
-- Compra 3 (ORD-2025-003)
(3, 19, 30, 0, 22000.00, 660000.00);

-- ================================================================
-- INSERTAR ALGUNOS PAGOS
-- ================================================================
INSERT INTO pagos (tipo_referencia, referencia_id, numero_pago, monto, metodo_pago, fecha_pago, usuario_id, estado) VALUES
('venta', 1, 'PAG-V-001001', 79730.00, 'efectivo', '2025-08-07 10:35:00', 2, 'completado'),
('venta', 2, 'PAG-V-001002', 39567.50, 'tarjeta_credito', '2025-08-07 14:20:00', 2, 'completado'),
('venta', 4, 'PAG-V-001004', 152905.25, 'cheque', '2025-08-08 11:25:00', 2, 'completado'),
('venta', 5, 'PAG-V-001005', 29750.00, 'efectivo', '2025-08-08 16:35:00', 5, 'completado'),
('compra', 1, 'PAG-C-001', 500000.00, 'transferencia', '2025-08-10 09:00:00', 3, 'completado');

-- ================================================================
-- REGISTROS DE AUDITORÍA INICIALES
-- ================================================================
INSERT INTO auditoria (usuario_id, accion, tabla_afectada, descripcion, fecha_accion) VALUES
(1, 'crear', 'usuarios', 'Sistema inicializado con usuarios por defecto', NOW()),
(1, 'crear', 'categorias', 'Categorías iniciales creadas', NOW()),
(1, 'crear', 'proveedores', 'Proveedores iniciales agregados', NOW()),
(1, 'crear', 'libros', 'Inventario inicial cargado', NOW()),
(1, 'crear', 'clientes', 'Clientes de muestra agregados', NOW());

-- ================================================================
-- MENSAJE FINAL
-- ================================================================
SELECT 'Base de datos inicializada exitosamente con datos de muestra' as mensaje,
       COUNT(*) as total_libros FROM libros
UNION ALL
SELECT 'Total de usuarios creados', COUNT(*) FROM usuarios
UNION ALL  
SELECT 'Total de categorías', COUNT(*) FROM categorias
UNION ALL
SELECT 'Total de proveedores', COUNT(*) FROM proveedores
UNION ALL
SELECT 'Total de clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'Total de ventas', COUNT(*) FROM ventas;