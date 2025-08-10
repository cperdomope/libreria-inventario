<?php
/**
 * LIBRERÍA DIGITAL - API DE CATEGORÍAS
 * Archivo: api/categories.php
 * Descripción: Endpoint para obtener categorías de libros
 */

// Headers CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Solo permitir GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Incluir configuración de base de datos
require_once '../database/config.php';

try {
    // Obtener todas las categorías activas
    $categories = executeQuery("
        SELECT 
            c.id,
            c.nombre,
            c.descripcion,
            c.color,
            c.icono,
            c.orden_display,
            COUNT(l.id) as total_libros,
            SUM(CASE WHEN l.stock_actual <= l.stock_minimo THEN 1 ELSE 0 END) as libros_stock_bajo
        FROM categorias c
        LEFT JOIN libros l ON c.id = l.categoria_id AND l.estado != 'descontinuado'
        WHERE c.estado = 'activa'
        GROUP BY c.id, c.nombre, c.descripcion, c.color, c.icono, c.orden_display
        ORDER BY c.orden_display ASC, c.nombre ASC
    ");

    echo json_encode([
        'success' => true,
        'data' => $categories,
        'total' => count($categories)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error al obtener categorías: ' . $e->getMessage()
    ]);
}