<?php
/**
 * API SIMPLE DE VENTAS - SIN PERMISOS COMPLEJOS
 * Solo para crear ventas desde el modal
 */

// Headers CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir configuración de base de datos
require_once 'database/config.php';

try {
    // Simular sesión básica
    session_start();
    if (!isset($_SESSION['user_id'])) {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_SESSION['user_name'] = 'Sistema';
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    $requiredFields = ['cliente_id', 'items', 'metodo_pago'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Campo requerido: $field"]);
            exit;
        }
    }
    
    // Validar que hay items
    if (empty($input['items']) || !is_array($input['items'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Debe incluir al menos un item']);
        exit;
    }
    
    beginTransaction();
    
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
        'usuario_id' => $_SESSION['user_id'],
        'subtotal' => $subtotal,
        'descuento_valor' => $descuento,
        'total' => $total,
        'metodo_pago' => $input['metodo_pago'],
        'notas' => $input['notas'] ?? '',
        'estado' => 'completada',
        'creado_por' => $_SESSION['user_id']
    ];
    
    error_log("💾 Guardando venta: " . json_encode($ventaData));
    
    $ventaId = executeUpdate("
        INSERT INTO ventas (numero_factura, cliente_id, usuario_id, subtotal, descuento_valor, total, metodo_pago, notas, estado, creado_por) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ", array_values($ventaData));
    
    if (!$ventaId) {
        throw new Exception('Error al crear la venta');
    }
    
    error_log("✅ Venta creada con ID: " . $ventaId);
    
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
        
        error_log("📦 Stock actualizado para libro ID: " . $item['libro_id']);
    }
    
    commitTransaction();
    
    echo json_encode([
        'success' => true,
        'message' => 'Venta creada exitosamente',
        'venta_id' => $ventaId,
        'numero_factura' => $numeroFactura,
        'total' => $total,
        'api_version' => 'simple'
    ]);
    
} catch (Exception $e) {
    rollbackTransaction();
    error_log("❌ Error creando venta: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al crear venta: ' . $e->getMessage(),
        'api_version' => 'simple'
    ]);
}
?>