<?php
/**
 * LIBRERÍA DIGITAL - API DE USUARIOS
 * Archivo: api/users.php
 * Descripción: Endpoint para gestión completa de usuarios
 */

// Headers CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir configuración de base de datos
require_once '../database/config.php';
require_once 'permissions.php';

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Solo admin puede ver usuarios
            checkPermission('users', 'view');
            
            // Si se solicitan estadísticas
            if (isset($_GET['stats']) && $_GET['stats'] === 'true') {
                handleGetUserStats();
            } else {
                handleGetUsers();
            }
            break;
        case 'POST':
            // Solo admin puede crear usuarios
            checkPermission('users', 'create');
            handleCreateUser();
            break;
        case 'PUT':
            // Solo admin puede editar usuarios
            checkPermission('users', 'edit');
            handleUpdateUser();
            break;
        case 'DELETE':
            // Solo admin puede eliminar usuarios
            checkPermission('users', 'delete');
            handleDeleteUser();
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
            exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
}

/**
 * Obtener lista de usuarios con paginación y filtros
 */
function handleGetUsers() {
    try {
        // Parámetros de consulta
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        $search = $_GET['search'] ?? '';
        $rol_filter = $_GET['rol'] ?? '';
        $estado_filter = $_GET['estado'] ?? '';
        
        // Construir consulta base
        $where_conditions = [];
        $params = [];
        
        if (!empty($search)) {
            $where_conditions[] = "(nombre LIKE ? OR email LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        if (!empty($rol_filter)) {
            $where_conditions[] = "rol = ?";
            $params[] = $rol_filter;
        }
        
        if (!empty($estado_filter)) {
            $where_conditions[] = "estado = ?";
            $params[] = $estado_filter;
        }
        
        $where_clause = !empty($where_conditions) ? "WHERE " . implode(" AND ", $where_conditions) : "";
        
        // Consulta principal con paginación
        $sql = "SELECT 
                    id, 
                    nombre, 
                    email, 
                    rol, 
                    estado, 
                    ultimo_acceso,
                    intentos_login,
                    bloqueado_hasta,
                    telefono,
                    fecha_creacion,
                    fecha_actualizacion
                FROM usuarios 
                $where_clause 
                ORDER BY fecha_creacion DESC 
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $users = executeQuery($sql, $params);
        
        // Contar total de registros
        $count_sql = "SELECT COUNT(*) as total FROM usuarios $where_clause";
        $count_params = array_slice($params, 0, -2); // Remover limit y offset
        $total_result = executeQuerySingle($count_sql, $count_params);
        $total_records = $total_result['total'];
        
        // Procesar datos de usuarios
        $processed_users = [];
        foreach ($users as $user) {
            $processed_users[] = [
                'id' => (int)$user['id'],
                'nombre' => $user['nombre'],
                'email' => $user['email'],
                'rol' => $user['rol'],
                'estado' => $user['estado'],
                'ultimo_acceso' => $user['ultimo_acceso'],
                'intentos_login' => (int)$user['intentos_login'],
                'bloqueado_hasta' => $user['bloqueado_hasta'],
                'telefono' => $user['telefono'],
                'fecha_creacion' => $user['fecha_creacion'],
                'fecha_actualizacion' => $user['fecha_actualizacion'],
                'estado_display' => ucfirst($user['estado']),
                'rol_display' => getRolDisplayName($user['rol']),
                'ultimo_acceso_formatted' => formatDateTime($user['ultimo_acceso']),
                'is_blocked' => $user['bloqueado_hasta'] && new DateTime() < new DateTime($user['bloqueado_hasta'])
            ];
        }
        
        // Respuesta exitosa
        echo json_encode([
            'success' => true,
            'data' => $processed_users,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total_records' => (int)$total_records,
                'total_pages' => ceil($total_records / $limit)
            ],
            'filters' => [
                'search' => $search,
                'rol' => $rol_filter,
                'estado' => $estado_filter
            ]
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Error obteniendo usuarios: " . $e->getMessage());
    }
}

/**
 * Crear nuevo usuario
 */
function handleCreateUser() {
    try {
        // Obtener datos del cuerpo de la petición
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        $required_fields = ['nombre', 'email', 'password', 'rol'];
        foreach ($required_fields as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "El campo '$field' es requerido"]);
                return;
            }
        }
        
        // Validar email único
        $existing_user = executeQuerySingle("SELECT id FROM usuarios WHERE email = ?", [$input['email']]);
        if ($existing_user) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'El email ya está registrado']);
            return;
        }
        
        // Validar rol
        $valid_roles = ['admin', 'seller', 'inventory', 'readonly'];
        if (!in_array($input['rol'], $valid_roles)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Rol inválido']);
            return;
        }
        
        // Obtener usuario actual para auditoría
        $current_user = getCurrentUser();
        
        // Preparar datos
        $nombre = trim($input['nombre']);
        $email = trim($input['email']);
        $password = password_hash($input['password'], PASSWORD_DEFAULT);
        $rol = $input['rol'];
        $estado = $input['estado'] ?? 'activo';
        $telefono = trim($input['telefono'] ?? '');
        
        // Insertar usuario
        $sql = "INSERT INTO usuarios (nombre, email, password, rol, estado, telefono, creado_por) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $user_id = executeUpdate($sql, [
            $nombre,
            $email, 
            $password,
            $rol,
            $estado,
            $telefono,
            $current_user['id']
        ]);
        
        if ($user_id) {
            // Obtener el usuario creado
            $new_user = executeQuerySingle(
                "SELECT id, nombre, email, rol, estado, telefono, fecha_creacion FROM usuarios WHERE id = ?",
                [$user_id]
            );
            
            echo json_encode([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'data' => [
                    'id' => (int)$new_user['id'],
                    'nombre' => $new_user['nombre'],
                    'email' => $new_user['email'],
                    'rol' => $new_user['rol'],
                    'estado' => $new_user['estado'],
                    'telefono' => $new_user['telefono'],
                    'fecha_creacion' => $new_user['fecha_creacion'],
                    'rol_display' => getRolDisplayName($new_user['rol']),
                    'estado_display' => ucfirst($new_user['estado'])
                ]
            ]);
        } else {
            throw new Exception("Error al insertar usuario en la base de datos");
        }
        
    } catch (Exception $e) {
        throw new Exception("Error creando usuario: " . $e->getMessage());
    }
}

/**
 * Actualizar usuario existente
 */
function handleUpdateUser() {
    try {
        // Obtener ID del usuario a actualizar
        $user_id = $_GET['id'] ?? null;
        if (!$user_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            return;
        }
        
        // Verificar que el usuario existe
        $existing_user = executeQuerySingle("SELECT * FROM usuarios WHERE id = ?", [$user_id]);
        if (!$existing_user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }
        
        // Obtener datos del cuerpo de la petición
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Obtener usuario actual para auditoría
        $current_user = getCurrentUser();
        
        // Preparar campos a actualizar
        $fields_to_update = [];
        $params = [];
        
        if (isset($input['nombre']) && !empty(trim($input['nombre']))) {
            $fields_to_update[] = "nombre = ?";
            $params[] = trim($input['nombre']);
        }
        
        if (isset($input['email']) && !empty(trim($input['email']))) {
            // Verificar que el email no esté en uso por otro usuario
            $email_check = executeQuerySingle(
                "SELECT id FROM usuarios WHERE email = ? AND id != ?", 
                [trim($input['email']), $user_id]
            );
            if ($email_check) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'El email ya está en uso']);
                return;
            }
            
            $fields_to_update[] = "email = ?";
            $params[] = trim($input['email']);
        }
        
        if (isset($input['rol'])) {
            $valid_roles = ['admin', 'seller', 'inventory', 'readonly'];
            if (!in_array($input['rol'], $valid_roles)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Rol inválido']);
                return;
            }
            $fields_to_update[] = "rol = ?";
            $params[] = $input['rol'];
        }
        
        if (isset($input['estado'])) {
            $valid_states = ['activo', 'inactivo', 'suspendido'];
            if (!in_array($input['estado'], $valid_states)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Estado inválido']);
                return;
            }
            $fields_to_update[] = "estado = ?";
            $params[] = $input['estado'];
        }
        
        if (isset($input['telefono'])) {
            $fields_to_update[] = "telefono = ?";
            $params[] = trim($input['telefono']);
        }
        
        // Actualizar contraseña si se proporciona
        if (isset($input['password']) && !empty($input['password'])) {
            $fields_to_update[] = "password = ?";
            $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
        }
        
        // Agregar campos de auditoría
        $fields_to_update[] = "actualizado_por = ?";
        $params[] = $current_user['id'];
        
        $params[] = $user_id; // Para la cláusula WHERE
        
        if (empty($fields_to_update)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No hay campos para actualizar']);
            return;
        }
        
        // Ejecutar actualización
        $sql = "UPDATE usuarios SET " . implode(", ", $fields_to_update) . " WHERE id = ?";
        $result = executeUpdate($sql, $params);
        
        if ($result !== false) {
            // Obtener usuario actualizado
            $updated_user = executeQuerySingle(
                "SELECT id, nombre, email, rol, estado, ultimo_acceso, telefono, fecha_actualizacion 
                 FROM usuarios WHERE id = ?",
                [$user_id]
            );
            
            echo json_encode([
                'success' => true,
                'message' => 'Usuario actualizado exitosamente',
                'data' => [
                    'id' => (int)$updated_user['id'],
                    'nombre' => $updated_user['nombre'],
                    'email' => $updated_user['email'],
                    'rol' => $updated_user['rol'],
                    'estado' => $updated_user['estado'],
                    'ultimo_acceso' => $updated_user['ultimo_acceso'],
                    'telefono' => $updated_user['telefono'],
                    'fecha_actualizacion' => $updated_user['fecha_actualizacion'],
                    'rol_display' => getRolDisplayName($updated_user['rol']),
                    'estado_display' => ucfirst($updated_user['estado']),
                    'ultimo_acceso_formatted' => formatDateTime($updated_user['ultimo_acceso'])
                ]
            ]);
        } else {
            throw new Exception("Error al actualizar usuario en la base de datos");
        }
        
    } catch (Exception $e) {
        throw new Exception("Error actualizando usuario: " . $e->getMessage());
    }
}

/**
 * Eliminar usuario
 */
function handleDeleteUser() {
    try {
        $user_id = $_GET['id'] ?? null;
        if (!$user_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            return;
        }
        
        // Verificar que el usuario existe
        $user = executeQuerySingle("SELECT nombre, email FROM usuarios WHERE id = ?", [$user_id]);
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }
        
        // Obtener usuario actual
        $current_user = getCurrentUser();
        
        // No permitir que se elimine a sí mismo
        if ($user_id == $current_user['id']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No puedes eliminarte a ti mismo']);
            return;
        }
        
        // Eliminar usuario
        $result = executeUpdate("DELETE FROM usuarios WHERE id = ?", [$user_id]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => "Usuario '{$user['nombre']}' eliminado exitosamente"
            ]);
        } else {
            throw new Exception("Error al eliminar usuario de la base de datos");
        }
        
    } catch (Exception $e) {
        throw new Exception("Error eliminando usuario: " . $e->getMessage());
    }
}

/**
 * Obtener nombre display del rol
 */
function getRolDisplayName($rol) {
    $roles = [
        'admin' => 'Administrador',
        'seller' => 'Vendedor',
        'inventory' => 'Inventario',
        'readonly' => 'Solo Lectura'
    ];
    return $roles[$rol] ?? ucfirst($rol);
}

/**
 * Formatear fecha y hora
 */
function formatDateTime($datetime) {
    if (!$datetime) return 'Nunca';
    
    try {
        $date = new DateTime($datetime);
        return $date->format('d/m/Y H:i');
    } catch (Exception $e) {
        return 'Fecha inválida';
    }
}

/**
 * Obtener estadísticas de usuarios
 */
function handleGetUserStats() {
    try {
        // 1. Total de usuarios
        $totalUsers = executeQuerySingle("SELECT COUNT(*) as count FROM usuarios");
        $totalUsersCount = (int)$totalUsers['count'];

        // 2. Usuarios activos
        $activeUsers = executeQuerySingle("SELECT COUNT(*) as count FROM usuarios WHERE estado = 'activo'");
        $activeUsersCount = (int)$activeUsers['count'];

        // 3. Usuarios administradores
        $adminUsers = executeQuerySingle("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'admin'");
        $adminUsersCount = (int)$adminUsers['count'];

        // 4. Usuarios creados este mes
        $currentMonth = date('Y-m');
        $newUsersThisMonth = executeQuerySingle(
            "SELECT COUNT(*) as count FROM usuarios WHERE DATE_FORMAT(fecha_creacion, '%Y-%m') = ?",
            [$currentMonth]
        );
        $newUsersCount = (int)$newUsersThisMonth['count'];

        // 5. Usuarios por rol
        $usersByRole = executeQuery(
            "SELECT rol, COUNT(*) as count FROM usuarios GROUP BY rol ORDER BY rol"
        );
        
        $roleDistribution = [];
        foreach ($usersByRole as $roleData) {
            $roleDistribution[$roleData['rol']] = (int)$roleData['count'];
        }

        // 6. Usuarios por estado
        $usersByStatus = executeQuery(
            "SELECT estado, COUNT(*) as count FROM usuarios GROUP BY estado ORDER BY estado"
        );
        
        $statusDistribution = [];
        foreach ($usersByStatus as $statusData) {
            $statusDistribution[$statusData['estado']] = (int)$statusData['count'];
        }

        // 7. Usuarios bloqueados
        $blockedUsers = executeQuerySingle(
            "SELECT COUNT(*) as count FROM usuarios WHERE bloqueado_hasta IS NOT NULL AND bloqueado_hasta > NOW()"
        );
        $blockedUsersCount = (int)$blockedUsers['count'];

        // 8. Últimos usuarios registrados (para información adicional)
        $recentUsers = executeQuery(
            "SELECT nombre, email, rol, fecha_creacion 
             FROM usuarios 
             ORDER BY fecha_creacion DESC 
             LIMIT 5"
        );

        // 9. Estadísticas de acceso
        $usersWithRecentAccess = executeQuerySingle(
            "SELECT COUNT(*) as count FROM usuarios 
             WHERE ultimo_acceso IS NOT NULL 
             AND ultimo_acceso >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        );
        $recentAccessCount = (int)$usersWithRecentAccess['count'];

        // Respuesta con todas las estadísticas
        echo json_encode([
            'success' => true,
            'data' => [
                'total_users' => $totalUsersCount,
                'active_users' => $activeUsersCount,
                'admin_users' => $adminUsersCount,
                'new_users_this_month' => $newUsersCount,
                'blocked_users' => $blockedUsersCount,
                'recent_access_users' => $recentAccessCount,
                'role_distribution' => $roleDistribution,
                'status_distribution' => $statusDistribution,
                'recent_users' => $recentUsers,
                'stats_generated_at' => date('Y-m-d H:i:s'),
                'current_month' => date('F Y') // Para mostrar el mes actual
            ],
            'message' => 'Estadísticas obtenidas exitosamente'
        ]);

    } catch (Exception $e) {
        throw new Exception("Error obteniendo estadísticas de usuarios: " . $e->getMessage());
    }
}

?>