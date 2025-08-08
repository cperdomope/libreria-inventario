<?php
/**
 * API USUARIOS - VERSIÓN SIMPLIFICADA
 * Para debug y corrección de errores
 */

// Limpiar cualquier salida previa
if (ob_get_level()) {
    ob_end_clean();
}

// Headers JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');

// Verificar conexión a BD
try {
    require_once __DIR__ . '/../database/config.php';
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de configuración',
        'error' => $e->getMessage(),
        'path' => __DIR__ . '/../database/config.php'
    ]);
    exit;
}

// Obtener método
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Obtener usuarios básico
            $users = executeQuery("SELECT id, nombre, email, rol, estado, created_at FROM usuarios ORDER BY created_at DESC LIMIT 10");
            
            $stats = [
                'total' => (int)executeQuery("SELECT COUNT(*) as count FROM usuarios")[0]['count'],
                'activos' => (int)executeQuery("SELECT COUNT(*) as count FROM usuarios WHERE estado = 'activo'")[0]['count'],
                'admins' => (int)executeQuery("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'admin'")[0]['count'],
                'nuevos_mes' => (int)executeQuery("SELECT COUNT(*) as count FROM usuarios WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)")[0]['count']
            ];
            
            echo json_encode([
                'success' => true,
                'users' => $users,
                'stats' => $stats,
                'total' => count($users),
                'method' => $method,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
            
        case 'POST':
            // Crear usuario básico
            $rawInput = file_get_contents('php://input');
            error_log("Raw POST input: " . $rawInput);
            
            $input = json_decode($rawInput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'JSON inválido',
                    'error' => json_last_error_msg(),
                    'raw_input' => substr($rawInput, 0, 200)
                ]);
                exit;
            }
            
            // Log de datos recibidos
            error_log("Parsed input: " . print_r($input, true));
            
            // Validación detallada
            $errors = [];
            if (empty($input['nombre'])) $errors[] = 'El nombre es requerido';
            if (empty($input['email'])) $errors[] = 'El email es requerido';
            if (empty($input['password'])) $errors[] = 'La contraseña es requerida';
            if (empty($input['rol'])) $errors[] = 'El rol es requerido';
            
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Datos incompletos',
                    'errors' => $errors,
                    'received_data' => array_keys($input)
                ]);
                exit;
            }
            
            // Verificar email duplicado
            $existing = executeQuerySingle("SELECT id FROM usuarios WHERE email = ?", [$input['email']]);
            if ($existing) {
                throw new Exception('El email ya está registrado');
            }
            
            // Hash de contraseña
            $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
            
            // Insertar usuario
            $userId = executeUpdate(
                "INSERT INTO usuarios (nombre, email, password, rol, estado, telefono, direccion, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                [
                    $input['nombre'],
                    $input['email'],
                    $hashedPassword,
                    $input['rol'],
                    $input['estado'] ?? 'activo',
                    $input['telefono'] ?? '',
                    $input['direccion'] ?? ''
                ]
            );
            
            if ($userId) {
                // Obtener usuario creado
                $newUser = executeQuerySingle("SELECT id, nombre, email, rol, estado, created_at FROM usuarios WHERE id = ?", [$userId]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Usuario creado exitosamente',
                    'user' => $newUser,
                    'user_id' => $userId
                ]);
            } else {
                throw new Exception('Error al crear usuario');
            }
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
        'error' => $e->getMessage(),
        'line' => $e->getLine(),
        'file' => $e->getFile()
    ]);
}
?>