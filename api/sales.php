<?php
/**
 * LIBRERÍA DIGITAL - API DE VENTAS
 * Archivo: api/sales.php
 * Descripción: Endpoint para gestión de ventas con control de permisos
 */

// Headers CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir configuración de base de datos y permisos
require_once '../database/config.php';
require_once 'permissions.php';

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Admin, seller e inventory pueden ver ventas
            checkPermission('sales', 'view');
            handleGetSales();
            break;
        case 'POST':
            // Solo admin y seller pueden crear ventas
            checkPermission('sales', 'create');
            handleCreateSale();
            break;
        case 'PUT':
            // Solo admin y seller pueden editar ventas
            checkPermission('sales', 'edit');
            handleUpdateSale();
            break;
        case 'DELETE':
            // Solo admin puede eliminar ventas
            checkPermission('sales', 'delete');
            handleDeleteSale();
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor: ' . $e->getMessage()]);
}

/**
 * Obtener ventas con filtros
 */
function handleGetSales() {
    try {
        // Obtener parámetros de filtrado
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, min(100, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        $fecha_desde = $_GET['fecha_desde'] ?? '';
        $fecha_hasta = $_GET['fecha_hasta'] ?? '';
        $cliente_id = $_GET['cliente_id'] ?? '';
        
        // Construir consulta SQL
        $sql = "
            SELECT 
                v.id,
                v.numero_factura,
                v.fecha_venta,
                v.total,
                v.descuento_valor as descuento,
                v.metodo_pago,
                v.estado,
                c.nombre as cliente_nombre,
                c.apellidos as cliente_apellidos,
                c.razon_social as cliente_razon_social,
                c.tipo_cliente as cliente_tipo,
                c.email as cliente_email,
                u.nombre as vendedor_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE 1=1
        ";
        
        $params = [];
        $where_conditions = [];
        
        // Filtro por fecha
        if (!empty($fecha_desde)) {
            $where_conditions[] = "v.fecha_venta >= ?";
            $params[] = $fecha_desde;
        }
        
        if (!empty($fecha_hasta)) {
            $where_conditions[] = "v.fecha_venta <= ?";
            $params[] = $fecha_hasta . ' 23:59:59';
        }
        
        // Filtro por cliente
        if (!empty($cliente_id) && is_numeric($cliente_id)) {
            $where_conditions[] = "v.cliente_id = ?";
            $params[] = $cliente_id;
        }
        
        // Agregar condiciones WHERE
        if (!empty($where_conditions)) {
            $sql .= " AND " . implode(' AND ', $where_conditions);
        }
        
        // Contar total de registros
        $count_sql = "SELECT COUNT(*) as total FROM (" . $sql . ") as count_query";
        $total_result = executeQuerySingle($count_sql, $params);
        $total_records = $total_result['total'] ?? 0;
        
        // Agregar ordenamiento y paginación
        $sql .= " ORDER BY v.fecha_venta DESC LIMIT $limit OFFSET $offset";
        
        // Ejecutar consulta
        $sales = executeQuery($sql, $params);
        
        // Obtener detalles de cada venta
        foreach ($sales as &$sale) {
            $sale['detalles'] = getSaleDetails($sale['id']);
        }
        
        echo json_encode([
            'success' => true,
            'data' => $sales,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total_records' => $total_records,
                'total_pages' => ceil($total_records / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error en handleGetSales: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener ventas']);
    }
}

/**
 * Crear nueva venta
 */
function handleCreateSale() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar datos requeridos
        $requiredFields = ['cliente_id', 'items', 'metodo_pago'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Campo requerido: $field"]);
                return;
            }
        }
        
        // Validar que hay items
        if (empty($input['items']) || !is_array($input['items'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Debe incluir al menos un item']);
            return;
        }
        
        beginTransaction();
        
        // Obtener usuario actual
        $user = SessionManager::getCurrentUser();
        error_log("Usuario actual: " . print_r($user, true));
        
        if (!$user) {
            throw new Exception('No se pudo obtener el usuario actual');
        }
        
        // Calcular totales
        $subtotal = 0;
        $validatedItems = [];
        
        foreach ($input['items'] as $item) {
            // Validar item
            if (!isset($item['libro_id']) || !isset($item['cantidad']) || !isset($item['precio_unitario'])) {
                throw new Exception('Item inválido: falta libro_id, cantidad o precio_unitario');
            }
            
            // Verificar stock
            $book = executeQuerySingle("SELECT id, titulo, stock_actual, precio_venta FROM libros WHERE id = ?", [$item['libro_id']]);
            if (!$book) {
                throw new Exception("Libro no encontrado: " . $item['libro_id']);
            }
            
            if ($book['stock_actual'] < $item['cantidad']) {
                throw new Exception("Stock insuficiente para: " . $book['titulo']);
            }
            
            $itemTotal = $item['cantidad'] * $item['precio_unitario'];
            $subtotal += $itemTotal;
            
            $validatedItems[] = [
                'libro_id' => $item['libro_id'],
                'cantidad' => $item['cantidad'],
                'precio_unitario' => $item['precio_unitario'],
                'total' => $itemTotal
            ];
        }
        
        $descuento = $input['descuento'] ?? 0;
        $total = $subtotal - $descuento;
        
        // Generar número de factura
        $numeroFactura = 'F' . date('Ymd') . sprintf('%04d', rand(1, 9999));
        
        // Insertar venta
        $ventaData = [
            'numero_factura' => $numeroFactura,
            'cliente_id' => $input['cliente_id'],
            'usuario_id' => $user['id'],
            'subtotal' => $subtotal,
            'descuento_valor' => $descuento,
            'total' => $total,
            'metodo_pago' => $input['metodo_pago'],
            'notas' => $input['notas'] ?? '',
            'estado' => 'completada',
            'creado_por' => $user['id']
        ];
        
        error_log("Datos de venta a insertar: " . print_r($ventaData, true));
        
        $ventaId = executeUpdate("
            INSERT INTO ventas (numero_factura, cliente_id, usuario_id, subtotal, descuento_valor, total, metodo_pago, notas, estado, creado_por) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ", array_values($ventaData));
        
        error_log("ID de venta creada: " . $ventaId);
        
        if (!$ventaId) {
            throw new Exception('Error al crear la venta - executeUpdate retornó: ' . var_export($ventaId, true));
        }
        
        // Insertar detalles y actualizar stock
        foreach ($validatedItems as $item) {
            // Insertar detalle
            executeUpdate("
                INSERT INTO detalles_venta (venta_id, libro_id, cantidad, precio_unitario, total) 
                VALUES (?, ?, ?, ?, ?)
            ", [$ventaId, $item['libro_id'], $item['cantidad'], $item['precio_unitario'], $item['total']]);
            
            // Actualizar stock
            executeUpdate("
                UPDATE libros 
                SET stock_actual = stock_actual - ? 
                WHERE id = ?
            ", [$item['cantidad'], $item['libro_id']]);
        }
        
        commitTransaction();
        
        echo json_encode([
            'success' => true,
            'message' => 'Venta creada exitosamente',
            'venta_id' => $ventaId,
            'numero_factura' => $numeroFactura
        ]);
        
    } catch (Exception $e) {
        rollbackTransaction();
        error_log("Error creando venta: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al crear venta: ' . $e->getMessage()]);
    }
}

/**
 * Actualizar venta (solo estado y notas)
 */
function handleUpdateSale() {
    try {
        $ventaId = $_GET['id'] ?? null;
        if (!$ventaId || !is_numeric($ventaId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de venta requerido']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Solo permitir actualizar estado y notas
        $allowedFields = ['estado', 'notas'];
        $updateFields = [];
        $updateValues = [];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateFields[] = "$field = ?";
                $updateValues[] = $input[$field];
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No hay campos para actualizar']);
            return;
        }
        
        $updateValues[] = $ventaId;
        
        $result = executeUpdate("
            UPDATE ventas 
            SET " . implode(', ', $updateFields) . " 
            WHERE id = ?
        ", $updateValues);
        
        if ($result !== false) {
            echo json_encode(['success' => true, 'message' => 'Venta actualizada exitosamente']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar venta']);
        }
        
    } catch (Exception $e) {
        error_log("Error actualizando venta: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al actualizar venta']);
    }
}

/**
 * Eliminar venta (solo admin)
 */
function handleDeleteSale() {
    try {
        $ventaId = $_GET['id'] ?? null;
        if (!$ventaId || !is_numeric($ventaId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de venta requerido']);
            return;
        }
        
        beginTransaction();
        
        // Primero restaurar el stock
        $detalles = executeQuery("SELECT libro_id, cantidad FROM detalles_venta WHERE venta_id = ?", [$ventaId]);
        
        foreach ($detalles as $detalle) {
            executeUpdate("
                UPDATE libros 
                SET stock_actual = stock_actual + ? 
                WHERE id = ?
            ", [$detalle['cantidad'], $detalle['libro_id']]);
        }
        
        // Eliminar detalles
        executeUpdate("DELETE FROM detalles_venta WHERE venta_id = ?", [$ventaId]);
        
        // Eliminar venta
        $result = executeUpdate("DELETE FROM ventas WHERE id = ?", [$ventaId]);
        
        if ($result !== false) {
            commitTransaction();
            echo json_encode(['success' => true, 'message' => 'Venta eliminada exitosamente']);
        } else {
            rollbackTransaction();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Venta no encontrada']);
        }
        
    } catch (Exception $e) {
        rollbackTransaction();
        error_log("Error eliminando venta: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al eliminar venta']);
    }
}

/**
 * Obtener detalles de una venta
 */
function getSaleDetails($ventaId) {
    return executeQuery("
        SELECT 
            dv.libro_id,
            dv.cantidad,
            dv.precio_unitario,
            dv.total,
            l.titulo,
            l.autor,
            l.isbn
        FROM detalles_venta dv
        JOIN libros l ON dv.libro_id = l.id
        WHERE dv.venta_id = ?
    ", [$ventaId]);
}

?>