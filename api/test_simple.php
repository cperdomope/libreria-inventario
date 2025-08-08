<?php
/**
 * API SIMPLE DE PRUEBA
 * Versión básica para verificar funcionamiento
 */

// Headers JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Verificar método
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            echo json_encode([
                'success' => true,
                'message' => 'API funcionando correctamente',
                'method' => $method,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            echo json_encode([
                'success' => true,
                'message' => 'POST recibido',
                'data' => $input
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Método no permitido: ' . $method
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor',
        'error' => $e->getMessage()
    ]);
}
?>