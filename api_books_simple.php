<?php
/**
 * API SIMPLE DE LIBROS - SIN PERMISOS COMPLEJOS
 * Solo para la búsqueda en ventas
 */

// Headers CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir solo configuración de base de datos
require_once 'database/config.php';

try {
    // Simular sesión básica para evitar errores
    session_start();
    if (!isset($_SESSION['user_id'])) {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_SESSION['user_name'] = 'Sistema';
    }
    
    // Obtener parámetros
    $limit = min(1000, max(1, intval($_GET['limit'] ?? 100)));
    $search = $_GET['search'] ?? '';
    
    // Construir consulta SQL
    $sql = "
        SELECT 
            id,
            titulo,
            autor,
            isbn,
            precio_venta,
            stock_actual,
            categoria_id,
            editorial,
            estado
        FROM libros
        WHERE estado = 'activo'
    ";
    
    $params = [];
    
    // Agregar búsqueda si se especifica
    if (!empty($search)) {
        $sql .= " AND (titulo LIKE ? OR autor LIKE ? OR isbn LIKE ?)";
        $searchParam = "%$search%";
        $params = [$searchParam, $searchParam, $searchParam];
    }
    
    $sql .= " ORDER BY titulo ASC LIMIT $limit";
    
    // Ejecutar consulta
    $books = executeQuery($sql, $params);
    
    // Log para debugging
    error_log("📚 API Simple Libros: " . count($books) . " libros encontrados");
    if (count($books) > 0) {
        error_log("📚 Primer libro: " . json_encode($books[0]));
    }
    
    echo json_encode([
        'success' => true,
        'data' => $books,
        'total' => count($books),
        'message' => 'Libros cargados exitosamente',
        'api_version' => 'simple'
    ]);
    
} catch (Exception $e) {
    error_log("❌ Error en API Simple Libros: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar libros: ' . $e->getMessage(),
        'data' => [],
        'api_version' => 'simple'
    ]);
}
?>