-- Agregar clientes de ejemplo para el sistema de ventas
-- Ejecutar este script después de la configuración inicial

USE libreria_inventario;

-- Limpiar clientes existentes si es necesario (opcional)
-- DELETE FROM clientes WHERE documento_numero IN ('1234567890', '9876543210', '1122334455', '5566778899', '2233445566');

-- Insertar clientes de ejemplo
INSERT INTO clientes (tipo_cliente, nombre, apellidos, documento_tipo, documento_numero, email, telefono, celular, direccion, ciudad, departamento, estado) VALUES
('persona', 'María', 'González', 'cedula', '9876543210', 'maria.gonzalez@email.com', '(601) 234-5678', '3101234567', 'Carrera 15 #32-45', 'Bogotá', 'Cundinamarca', 'activo'),
('persona', 'Carlos', 'Rodríguez', 'cedula', '1122334455', 'carlos.rodriguez@email.com', '(602) 345-6789', '3201234567', 'Calle 80 #12-34', 'Medellín', 'Antioquia', 'activo'),
('persona', 'Ana', 'Martínez', 'cedula', '5566778899', 'ana.martinez@email.com', '(603) 456-7890', '3301234567', 'Avenida 6 #45-67', 'Cali', 'Valle del Cauca', 'activo'),
('persona', 'Luis', 'Hernández', 'cedula', '2233445566', 'luis.hernandez@email.com', '(604) 567-8901', '3401234567', 'Transversal 12 #23-45', 'Barranquilla', 'Atlántico', 'activo'),
('empresa', 'Biblioteca Central', '', 'nit', '9001234567', 'compras@bibliotecacentral.edu.co', '(601) 678-9012', '3501234567', 'Carrera 30 #45-67', 'Bogotá', 'Cundinamarca', 'activo'),
('empresa', 'Colegio San José', '', 'nit', '8001234567', 'administracion@colegiosanjose.edu.co', '(602) 789-0123', '3601234567', 'Calle 50 #67-89', 'Medellín', 'Antioquia', 'activo'),
('persona', 'Sofía', 'López', 'cedula', '3344556677', 'sofia.lopez@email.com', '(605) 890-1234', '3701234567', 'Diagonal 25 #34-56', 'Bucaramanga', 'Santander', 'activo'),
('persona', 'Roberto', 'García', 'cedula', '4455667788', 'roberto.garcia@email.com', '(606) 901-2345', '3801234567', 'Avenida Libertadores #56-78', 'Pereira', 'Risaralda', 'activo');

-- Verificar inserción
SELECT 'Clientes insertados correctamente' as mensaje, COUNT(*) as total_clientes FROM clientes;

-- Mostrar todos los clientes
SELECT 
    id,
    CONCAT(nombre, ' ', COALESCE(apellidos, '')) as nombre_completo,
    documento_tipo,
    documento_numero,
    email,
    celular,
    ciudad,
    estado
FROM clientes 
ORDER BY nombre ASC;