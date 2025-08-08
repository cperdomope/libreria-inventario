<?php
/**
 * LIBRERÍA DIGITAL - API DE GESTIÓN DE USUARIOS
 * Archivo: api/users.php
 * Descripción: Endpoint para crear, leer, actualizar y eliminar usuarios
 */

// Desactivar reportes de errores en la salida (para mantener JSON limpio)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Headers CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Incluir configuración de base de datos con manejo de errores
try {
    require_once __DIR__ . '/../database/config.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de configuración del servidor',
        'error' => $e->getMessage()
    ]);
    exit;
}

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Función para validar sesión (simplificado para desarrollo)
function validateSession($token = null) {
    // En producción, validar token de sesión real
    return true; // Por ahora permitir todas las operaciones
}

// Función para validar datos de usuario
function validateUserData($data) {
    $errors = [];
    
    if (empty($data['nombre'])) {
        $errors[] = 'El nombre es requerido';
    }
    
    if (empty($data['email'])) {
        $errors[] = 'El email es requerido';
    } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'El email no es válido';
    }
    
    if (empty($data['password']) && !isset($data['id'])) {
        $errors[] = 'La contraseña es requerida';
    } elseif (!empty($data['password']) && strlen($data['password']) < 6) {
        $errors[] = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (empty($data['rol'])) {
        $errors[] = 'El rol es requerido';
    } elseif (!in_array($data['rol'], ['admin', 'seller', 'inventory', 'readonly'])) {
        $errors[] = 'Rol inválido';
    }
    
    return $errors;
}

try {
    switch ($method) {
        case 'GET':
            // Obtener lista de usuarios
            if (isset($_GET['id'])) {
                // Obtener usuario específico
                $user = executeQuerySingle(
                    "SELECT id, nombre, email, rol, estado, telefono, direccion, created_at, updated_at 
                     FROM usuarios WHERE id = ?",
                    [$_GET['id']]
                );
                
                if ($user) {
                    echo json_encode(['success' => true, 'user' => $user]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                }
            } else {
                // Obtener lista completa con filtros opcionales
                $where = "WHERE 1=1";
                $params = [];
                
                if (isset($_GET['rol']) && $_GET['rol'] !== '') {
                    $where .= " AND rol = ?";
                    $params[] = $_GET['rol'];
                }
                
                if (isset($_GET['estado']) && $_GET['estado'] !== '') {
                    $where .= " AND estado = ?";
                    $params[] = $_GET['estado'];
                }
                
                if (isset($_GET['search']) && $_GET['search'] !== '') {
                    $where .= " AND (nombre LIKE ? OR email LIKE ?)";
                    $searchTerm = '%' . $_GET['search'] . '%';
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                }
                
                $users = executeQuery(
                    "SELECT id, nombre, email, rol, estado, telefono, direccion, created_at, updated_at 
                     FROM usuarios {$where} ORDER BY created_at DESC",
                    $params
                );
                
                // Obtener estadísticas
                $stats = [
                    'total' => executeQuery("SELECT COUNT(*) as count FROM usuarios")[0]['count'],
                    'activos' => executeQuery("SELECT COUNT(*) as count FROM usuarios WHERE estado = 'activo'")[0]['count'],
                    'admins' => executeQuery("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'admin'")[0]['count'],
                    'nuevos_mes' => executeQuery("SELECT COUNT(*) as count FROM usuarios WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)")[0]['count']
                ];
                
                echo json_encode([
                    'success' => true,
                    'users' => $users,
                    'stats' => $stats,
                    'total' => count($users)
                ]);
            }
            break;
            
        case 'POST':
            // Crear nuevo usuario
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validar datos
            $errors = validateUserData($input);
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'errors' => $errors]);
                break;
            }
            
            // Verificar que el email no exista
            $existing = executeQuerySingle("SELECT id FROM usuarios WHERE email = ?", [$input['email']]);
            if ($existing) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'El email ya está registrado']);
                break;
            }
            
            // Hash de la contraseña
            $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
            
            // Insertar usuario
            $userId = executeUpdate(
                "INSERT INTO usuarios (nombre, email, password, rol, estado, telefono, direccion, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
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
                // Registrar en auditoría
                executeUpdate(
                    "INSERT INTO auditoria (usuario_id, accion, tabla_afectada, descripcion, ip_address, fecha_accion) 
                     VALUES (?, 'crear', 'usuarios', ?, ?, NOW())",
                    [
                        1, // ID del usuario que creó (debería ser el usuario actual)
                        "Usuario creado: {$input['email']}",
                        $_SERVER['REMOTE_ADDR'] ?? 'unknown'
                    ]
                );
                
                // Obtener el usuario creado
                $newUser = executeQuerySingle(
                    "SELECT id, nombre, email, rol, estado, telefono, direccion, created_at 
                     FROM usuarios WHERE id = ?",
                    [$userId]
                );
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Usuario creado exitosamente',
                    'user' => $newUser
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al crear usuario']);
            }
            break;
            
        case 'PUT':
            // Actualizar usuario existente
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
                break;
            }
            
            // Validar datos
            $errors = validateUserData($input);
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'errors' => $errors]);
                break;
            }
            
            // Verificar que el usuario exista
            $existing = executeQuerySingle("SELECT id FROM usuarios WHERE id = ?", [$input['id']]);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                break;
            }
            
            // Preparar query de actualización
            $updateFields = [
                'nombre = ?',
                'email = ?',
                'rol = ?',
                'estado = ?',
                'telefono = ?',
                'direccion = ?',
                'updated_at = NOW()'
            ];
            
            $params = [
                $input['nombre'],
                $input['email'],
                $input['rol'],
                $input['estado'] ?? 'activo',
                $input['telefono'] ?? '',
                $input['direccion'] ?? ''
            ];
            
            // Actualizar contraseña si se proporciona
            if (!empty($input['password'])) {
                $updateFields[] = 'password = ?';
                $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
            }
            
            $params[] = $input['id']; // Para el WHERE
            
            $result = executeUpdate(
                "UPDATE usuarios SET " . implode(', ', $updateFields) . " WHERE id = ?",
                $params
            );
            
            if ($result !== false) {
                echo json_encode(['success' => true, 'message' => 'Usuario actualizado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al actualizar usuario']);
            }
            break;
            
        case 'DELETE':
            // Eliminar usuario (cambiar estado a inactivo)
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
                break;
            }
            
            $result = executeUpdate(
                "UPDATE usuarios SET estado = 'inactivo', updated_at = NOW() WHERE id = ?",
                [$_GET['id']]
            );
            
            if ($result > 0) {
                echo json_encode(['success' => true, 'message' => 'Usuario desactivado exitosamente']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
            break;
    }
    
} catch (Exception $e) {
    error_log("Error en users API: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor',
        'debug' => $e->getMessage() // Solo para desarrollo
    ]);
}
?>