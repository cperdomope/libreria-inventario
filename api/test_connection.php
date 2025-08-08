<?php
/**
 * API ENDPOINT - TEST DE CONEXIÓN
 * Archivo: api/test_connection.php
 * Propósito: Verificar conexión desde JavaScript
 */

// Headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir configuración
require_once '../database/config.php';

try {
    // Test de conexión básica
    $pdo = getDB();
    
    // Obtener información básica
    $dbInfo = $pdo->query("SELECT DATABASE() as db_name, VERSION() as version")->fetch();
    
    // Contar registros principales
    $counts = [
        'usuarios' => executeQuery("SELECT COUNT(*) as total FROM usuarios")[0]['total'] ?? 0,
        'libros' => executeQuery("SELECT COUNT(*) as total FROM libros")[0]['total'] ?? 0,
        'categorias' => executeQuery("SELECT COUNT(*) as total FROM categorias")[0]['total'] ?? 0,
        'ventas' => executeQuery("SELECT COUNT(*) as total FROM ventas")[0]['total'] ?? 0
    ];
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Conexión exitosa a la base de datos',
        'database' => $dbInfo['db_name'],
        'mysql_version' => $dbInfo['version'],
        'host' => DB_HOST,
        'port' => DB_PORT,
        'charset' => DB_CHARSET,
        'counts' => $counts,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Error en la conexión
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos',
        'error' => $e->getMessage(),
        'host' => DB_HOST,
        'port' => DB_PORT,
        'database' => DB_NAME,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>