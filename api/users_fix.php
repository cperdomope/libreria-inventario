<?php
/**
 * API USUARIOS - VERSIÓN CORREGIDA Y SIMPLIFICADA
 * Esta versión DEBE funcionar
 */

// Limpiar cualquier salida previa
while (ob_get_level()) {
    ob_end_clean();
}

// Iniciar buffer de salida limpio
ob_start();

// Headers JSON SIEMPRE primero
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Función para terminar con JSON válido
function exitWithJson($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Manejar OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exitWithJson(['success' => true, 'message' => 'CORS OK']);
}

try {
    // Verificar que config.php existe
    $configPath = __DIR__ . '/../database/config.php';
    if (!file_exists($configPath)) {
        exitWithJson([
            'success' => false,
            'message' => 'Archivo de configuración no encontrado',
            'debug' => "Path: $configPath"
        ], 500);
    }

    // Incluir configuración
    require_once $configPath;

    // Verificar funciones de BD
    if (!function_exists('getDB')) {
        exitWithJson([
            'success' => false,
            'message' => 'Función getDB no disponible'
        ], 500);
    }

    // Probar conexión
    $pdo = getDB();
    if (!$pdo) {
        exitWithJson([
            'success' => false,
            'message' => 'No se pudo conectar a la base de datos'
        ], 500);
    }

    // Verificar tabla usuarios
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'usuarios'");
    if ($tableCheck->rowCount() === 0) {
        exitWithJson([
            'success' => false,
            'message' => 'La tabla usuarios no existe. Ejecutar instalador de BD.',
            'action_required' => 'Run database installer'
        ], 500);
    }

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Obtener usuarios (excluyendo eliminados - usuarios con email que contiene '_deleted_')
            $users = $pdo->query("
                SELECT id, nombre, email, rol, estado, telefono, fecha_creacion as created_at 
                FROM usuarios 
                WHERE email NOT LIKE '%_deleted_%'
                ORDER BY fecha_creacion DESC 
                LIMIT 50
            ")->fetchAll(PDO::FETCH_ASSOC);

            $stats = [
                'total' => (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE email NOT LIKE '%_deleted_%'")->fetchColumn(),
                'activos' => (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE estado = 'activo' AND email NOT LIKE '%_deleted_%'")->fetchColumn(),
                'admins' => (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND email NOT LIKE '%_deleted_%'")->fetchColumn(),
                'nuevos_mes' => (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 1 MONTH) AND email NOT LIKE '%_deleted_%'")->fetchColumn()
            ];

            exitWithJson([
                'success' => true,
                'users' => $users,
                'stats' => $stats,
                'total' => count($users),
                'message' => 'Usuarios obtenidos correctamente'
            ]);
            break;

        case 'POST':
            // Crear usuario
            $rawInput = file_get_contents('php://input');
            
            // Debug básico (se puede remover en producción)
            error_log("Usuarios API: Creando nuevo usuario");
            
            if (empty($rawInput)) {
                exitWithJson([
                    'success' => false,
                    'message' => 'No se recibieron datos POST',
                    'debug' => [
                        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
                        'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'not set',
                        'post_data' => $_POST,
                        'raw_input_length' => strlen($rawInput)
                    ]
                ], 400);
            }

            $input = json_decode($rawInput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                exitWithJson([
                    'success' => false,
                    'message' => 'JSON inválido: ' . json_last_error_msg(),
                    'received' => substr($rawInput, 0, 200),
                    'debug' => [
                        'json_error_code' => json_last_error(),
                        'json_error_msg' => json_last_error_msg()
                    ]
                ], 400);
            }

            // Validar campos requeridos
            $required = ['nombre', 'email', 'password', 'rol'];
            $missing = [];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    $missing[] = $field;
                }
            }

            if (!empty($missing)) {
                exitWithJson([
                    'success' => false,
                    'message' => 'Campos requeridos faltantes: ' . implode(', ', $missing),
                    'received_fields' => array_keys($input)
                ], 400);
            }

            // Validar email
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                exitWithJson([
                    'success' => false,
                    'message' => 'Email inválido'
                ], 400);
            }

            // Verificar email único
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
            $stmt->execute([$input['email']]);
            if ($stmt->fetch()) {
                exitWithJson([
                    'success' => false,
                    'message' => 'El email ya está registrado'
                ], 409);
            }

            // Validar rol
            $validRoles = ['admin', 'seller', 'inventory', 'readonly'];
            if (!in_array($input['rol'], $validRoles)) {
                exitWithJson([
                    'success' => false,
                    'message' => 'Rol inválido. Valores válidos: ' . implode(', ', $validRoles)
                ], 400);
            }

            // Hash de contraseña
            $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);

            // Insertar usuario
            $stmt = $pdo->prepare("
                INSERT INTO usuarios (nombre, email, password, rol, estado, telefono, direccion, fecha_creacion) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");

            $success = $stmt->execute([
                $input['nombre'],
                $input['email'],
                $hashedPassword,
                $input['rol'],
                $input['estado'] ?? 'activo',
                $input['telefono'] ?? '',
                $input['direccion'] ?? ''
            ]);

            if (!$success) {
                exitWithJson([
                    'success' => false,
                    'message' => 'Error al insertar en la base de datos',
                    'db_error' => $stmt->errorInfo()
                ], 500);
            }

            $userId = $pdo->lastInsertId();

            // Obtener usuario creado
            $stmt = $pdo->prepare("SELECT id, nombre, email, rol, estado, telefono, fecha_creacion as created_at FROM usuarios WHERE id = ?");
            $stmt->execute([$userId]);
            $newUser = $stmt->fetch(PDO::FETCH_ASSOC);

            exitWithJson([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'user' => $newUser,
                'user_id' => $userId
            ], 201);
            break;

        case 'PUT':
            // Actualizar usuario, cambiar estado, restablecer contraseña
            $rawInput = file_get_contents('php://input');
            
            if (empty($rawInput)) {
                exitWithJson([
                    'success' => false,
                    'message' => 'No se recibieron datos PUT'
                ], 400);
            }

            $input = json_decode($rawInput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                exitWithJson([
                    'success' => false,
                    'message' => 'JSON inválido: ' . json_last_error_msg()
                ], 400);
            }

            $action = $input['action'] ?? '';
            
            switch ($action) {
                case 'update':
                    // Actualizar usuario completo
                    if (empty($input['user_id'])) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'ID de usuario requerido'
                        ], 400);
                    }

                    $userId = (int)$input['user_id'];
                    
                    // Verificar que el usuario existe
                    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE id = ?");
                    $stmt->execute([$userId]);
                    if (!$stmt->fetch()) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'Usuario no encontrado'
                        ], 404);
                    }

                    // Validar campos requeridos
                    $required = ['nombre', 'email', 'rol'];
                    $missing = [];
                    foreach ($required as $field) {
                        if (empty($input[$field])) {
                            $missing[] = $field;
                        }
                    }

                    if (!empty($missing)) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'Campos requeridos faltantes: ' . implode(', ', $missing)
                        ], 400);
                    }

                    // Validar email único (excluyendo el usuario actual)
                    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
                    $stmt->execute([$input['email'], $userId]);
                    if ($stmt->fetch()) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'El email ya está registrado por otro usuario'
                        ], 409);
                    }

                    // Construir query de actualización
                    $updateFields = ['nombre = ?', 'email = ?', 'rol = ?'];
                    $updateValues = [$input['nombre'], $input['email'], $input['rol']];
                    
                    // Campos opcionales
                    if (isset($input['telefono'])) {
                        $updateFields[] = 'telefono = ?';
                        $updateValues[] = $input['telefono'];
                    }
                    if (isset($input['direccion'])) {
                        $updateFields[] = 'direccion = ?';
                        $updateValues[] = $input['direccion'];
                    }
                    if (isset($input['estado'])) {
                        $updateFields[] = 'estado = ?';
                        $updateValues[] = $input['estado'];
                    }
                    
                    // Si se proporciona nueva contraseña
                    if (!empty($input['password'])) {
                        $updateFields[] = 'password = ?';
                        $updateValues[] = password_hash($input['password'], PASSWORD_DEFAULT);
                    }

                    $updateValues[] = $userId; // Para la condición WHERE

                    $stmt = $pdo->prepare("UPDATE usuarios SET " . implode(', ', $updateFields) . " WHERE id = ?");
                    $success = $stmt->execute($updateValues);

                    if (!$success) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'Error al actualizar usuario',
                            'db_error' => $stmt->errorInfo()
                        ], 500);
                    }

                    // Obtener usuario actualizado
                    $stmt = $pdo->prepare("SELECT id, nombre, email, rol, estado, telefono, fecha_creacion as created_at FROM usuarios WHERE id = ?");
                    $stmt->execute([$userId]);
                    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);

                    exitWithJson([
                        'success' => true,
                        'message' => 'Usuario actualizado exitosamente',
                        'user' => $updatedUser
                    ]);
                    break;

                case 'toggle_status':
                    // Cambiar estado de usuario
                    if (empty($input['user_id']) || empty($input['new_status'])) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'ID de usuario y nuevo estado requeridos'
                        ], 400);
                    }

                    $userId = (int)$input['user_id'];
                    $newStatus = $input['new_status'];
                    
                    $validStatuses = ['activo', 'inactivo', 'suspendido'];
                    if (!in_array($newStatus, $validStatuses)) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'Estado inválido. Valores válidos: ' . implode(', ', $validStatuses)
                        ], 400);
                    }

                    $stmt = $pdo->prepare("UPDATE usuarios SET estado = ? WHERE id = ?");
                    $success = $stmt->execute([$newStatus, $userId]);

                    if (!$success) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'Error al cambiar estado'
                        ], 500);
                    }

                    if ($stmt->rowCount() === 0) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'Usuario no encontrado'
                        ], 404);
                    }

                    exitWithJson([
                        'success' => true,
                        'message' => "Estado cambiado a $newStatus exitosamente"
                    ]);
                    break;

                case 'reset_password':
                    // Restablecer contraseña
                    if (empty($input['user_id'])) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'ID de usuario requerido'
                        ], 400);
                    }

                    $userId = (int)$input['user_id'];
                    
                    // Generar contraseña temporal
                    $tempPassword = 'temp' . rand(1000, 9999);
                    $hashedPassword = password_hash($tempPassword, PASSWORD_DEFAULT);

                    $stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
                    $success = $stmt->execute([$hashedPassword, $userId]);

                    if (!$success) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'Error al restablecer contraseña'
                        ], 500);
                    }

                    if ($stmt->rowCount() === 0) {
                        exitWithJson([
                            'success' => false,
                            'message' => 'Usuario no encontrado'
                        ], 404);
                    }

                    exitWithJson([
                        'success' => true,
                        'message' => 'Contraseña restablecida exitosamente',
                        'new_password' => $tempPassword
                    ]);
                    break;

                default:
                    exitWithJson([
                        'success' => false,
                        'message' => "Acción PUT '$action' no soportada"
                    ], 400);
            }
            break;

        case 'DELETE':
            // Eliminar usuario
            $rawInput = file_get_contents('php://input');
            
            if (empty($rawInput)) {
                exitWithJson([
                    'success' => false,
                    'message' => 'No se recibieron datos DELETE'
                ], 400);
            }

            $input = json_decode($rawInput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                exitWithJson([
                    'success' => false,
                    'message' => 'JSON inválido: ' . json_last_error_msg()
                ], 400);
            }

            if (empty($input['user_id'])) {
                exitWithJson([
                    'success' => false,
                    'message' => 'ID de usuario requerido'
                ], 400);
            }

            $userId = (int)$input['user_id'];
            
            // Verificar que el usuario existe primero
            $stmt = $pdo->prepare("SELECT nombre FROM usuarios WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if (!$user) {
                exitWithJson([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // Soft delete: cambiar estado a 'suspendido' y modificar email para evitar conflictos
            $stmt = $pdo->prepare("UPDATE usuarios SET estado = 'suspendido', email = CONCAT(email, '_deleted_', UNIX_TIMESTAMP()) WHERE id = ?");
            $success = $stmt->execute([$userId]);

            if (!$success) {
                exitWithJson([
                    'success' => false,
                    'message' => 'Error al eliminar usuario'
                ], 500);
            }

            exitWithJson([
                'success' => true,
                'message' => "Usuario '{$user['nombre']}' eliminado exitosamente"
            ]);
            break;

        default:
            exitWithJson([
                'success' => false,
                'message' => "Método $method no soportado"
            ], 405);
    }

} catch (PDOException $e) {
    exitWithJson([
        'success' => false,
        'message' => 'Error de base de datos',
        'error' => $e->getMessage(),
        'code' => $e->getCode()
    ], 500);

} catch (Exception $e) {
    exitWithJson([
        'success' => false,
        'message' => 'Error del servidor',
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ], 500);
}
?>