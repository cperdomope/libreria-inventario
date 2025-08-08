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
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
            // Obtener usuarios
            $users = $pdo->query("
                SELECT id, nombre, email, rol, estado, telefono, created_at 
                FROM usuarios 
                ORDER BY created_at DESC 
                LIMIT 50
            ")->fetchAll(PDO::FETCH_ASSOC);

            $stats = [
                'total' => (int)$pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn(),
                'activos' => (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE estado = 'activo'")->fetchColumn(),
                'admins' => (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin'")->fetchColumn(),
                'nuevos_mes' => (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)")->fetchColumn()
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
            if (empty($rawInput)) {
                exitWithJson([
                    'success' => false,
                    'message' => 'No se recibieron datos POST'
                ], 400);
            }

            $input = json_decode($rawInput, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                exitWithJson([
                    'success' => false,
                    'message' => 'JSON inválido: ' . json_last_error_msg(),
                    'received' => substr($rawInput, 0, 200)
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
                INSERT INTO usuarios (nombre, email, password, rol, estado, telefono, direccion, created_at) 
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
            $stmt = $pdo->prepare("SELECT id, nombre, email, rol, estado, telefono, created_at FROM usuarios WHERE id = ?");
            $stmt->execute([$userId]);
            $newUser = $stmt->fetch(PDO::FETCH_ASSOC);

            exitWithJson([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'user' => $newUser,
                'user_id' => $userId
            ], 201);
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