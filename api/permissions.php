<?php
/**
 * LIBRERÍA DIGITAL - SISTEMA DE PERMISOS
 * Archivo: api/permissions.php
 * Descripción: Sistema de autorización basado en roles
 */

// Desactivar errores HTML
error_reporting(0);
ini_set('display_errors', 0);

/**
 * Clase para gestión de permisos por roles
 */
class PermissionManager {
    
    // Definición de módulos del sistema
    const MODULES = [
        'dashboard' => 'Dashboard',
        'inventory' => 'Inventario', 
        'stock' => 'Control de Stock',
        'sales' => 'Ventas',
        'reports' => 'Reportes',
        'users' => 'Usuarios'
    ];
    
    // Definición de acciones posibles
    const ACTIONS = [
        'view' => 'Ver/Consultar',
        'create' => 'Crear',
        'edit' => 'Editar', 
        'delete' => 'Eliminar',
        'manage' => 'Administrar'
    ];
    
    // Matriz de permisos por rol
    private static $permissions = [
        'admin' => [
            'dashboard' => ['view'],
            'inventory' => ['view', 'create', 'edit', 'delete', 'manage'],
            'stock' => ['view', 'create', 'edit', 'delete', 'manage'],
            'sales' => ['view', 'create', 'edit', 'delete', 'manage'],
            'reports' => ['view', 'create', 'edit', 'delete', 'manage'],
            'users' => ['view', 'create', 'edit', 'delete', 'manage']
        ],
        'inventory' => [
            'dashboard' => ['view'],
            'inventory' => ['view', 'create', 'edit', 'delete', 'manage'],
            'stock' => ['view', 'create', 'edit', 'delete', 'manage'],
            'sales' => [], // Sin acceso
            'reports' => [], // Sin acceso  
            'users' => [] // Sin acceso
        ],
        'seller' => [
            'dashboard' => ['view'],
            'inventory' => ['view'], // Solo consulta
            'stock' => [], // Sin acceso
            'sales' => ['view', 'create', 'edit', 'delete'],
            'reports' => [], // Sin acceso
            'users' => [] // Sin acceso
        ],
        'readonly' => [
            'dashboard' => ['view'],
            'inventory' => ['view'], // Solo lectura
            'stock' => ['view'], // Solo lectura
            'sales' => [], // Sin acceso
            'reports' => [], // Sin acceso
            'users' => [] // Sin acceso
        ]
    ];
    
    /**
     * Verificar si un usuario tiene permiso para una acción específica
     */
    public static function hasPermission($userRole, $module, $action) {
        // Validar que el rol existe
        if (!isset(self::$permissions[$userRole])) {
            return false;
        }
        
        // Validar que el módulo existe para el rol
        if (!isset(self::$permissions[$userRole][$module])) {
            return false;
        }
        
        // Verificar si tiene el permiso específico
        return in_array($action, self::$permissions[$userRole][$module]);
    }
    
    /**
     * Obtener todos los permisos de un rol
     */
    public static function getRolePermissions($userRole) {
        return self::$permissions[$userRole] ?? [];
    }
    
    /**
     * Obtener módulos accesibles por un rol
     */
    public static function getAccessibleModules($userRole) {
        $permissions = self::getRolePermissions($userRole);
        $accessibleModules = [];
        
        foreach ($permissions as $module => $actions) {
            if (!empty($actions)) {
                $accessibleModules[$module] = [
                    'name' => self::MODULES[$module],
                    'actions' => $actions
                ];
            }
        }
        
        return $accessibleModules;
    }
    
    /**
     * Verificar si un usuario puede acceder a un módulo
     */
    public static function canAccessModule($userRole, $module) {
        $permissions = self::getRolePermissions($userRole);
        return isset($permissions[$module]) && !empty($permissions[$module]);
    }
    
    /**
     * Middleware para validar permisos en endpoints
     */
    public static function requirePermission($module, $action) {
        // Verificar que hay sesión activa
        session_start();
        if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_role'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No autorizado. Debe iniciar sesión.']);
            exit;
        }
        
        // Verificar permisos
        if (!self::hasPermission($_SESSION['user_role'], $module, $action)) {
            http_response_code(403);
            echo json_encode([
                'success' => false, 
                'message' => 'Acceso denegado. No tiene permisos para realizar esta acción.',
                'required_permission' => "$module:$action",
                'user_role' => $_SESSION['user_role']
            ]);
            exit;
        }
        
        return true;
    }
    
    /**
     * Obtener información de permisos para frontend
     */
    public static function getPermissionsForUser($userRole) {
        return [
            'role' => $userRole,
            'modules' => self::getAccessibleModules($userRole),
            'all_permissions' => self::getRolePermissions($userRole)
        ];
    }
}

/**
 * Clase para gestión de sesiones de usuario
 */
class SessionManager {
    
    /**
     * Iniciar sesión de usuario
     */
    public static function login($userData) {
        session_start();
        
        $_SESSION['user_id'] = $userData['id'];
        $_SESSION['user_name'] = $userData['nombre'];
        $_SESSION['user_email'] = $userData['email'];
        $_SESSION['user_role'] = $userData['rol'];
        $_SESSION['user_status'] = $userData['estado'];
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();
        
        // Guardar sesión en base de datos
        self::saveSessionToDatabase($userData['id']);
        
        return true;
    }
    
    /**
     * Cerrar sesión
     */
    public static function logout() {
        session_start();
        
        // Eliminar sesión de base de datos
        if (isset($_SESSION['user_id'])) {
            self::removeSessionFromDatabase($_SESSION['user_id']);
        }
        
        // Destruir sesión
        session_destroy();
        
        return true;
    }
    
    /**
     * Verificar si hay sesión activa
     */
    public static function isLoggedIn() {
        session_start();
        
        // Verificar que existen datos de sesión
        if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_role'])) {
            return false;
        }
        
        // Verificar timeout de sesión (30 minutos)
        if (isset($_SESSION['last_activity'])) {
            $timeout = 30 * 60; // 30 minutos
            if ((time() - $_SESSION['last_activity']) > $timeout) {
                self::logout();
                return false;
            }
        }
        
        // Actualizar tiempo de última actividad
        $_SESSION['last_activity'] = time();
        
        return true;
    }
    
    /**
     * Obtener datos del usuario actual
     */
    public static function getCurrentUser() {
        session_start();
        
        if (!self::isLoggedIn()) {
            return null;
        }
        
        return [
            'id' => $_SESSION['user_id'],
            'nombre' => $_SESSION['user_name'],
            'email' => $_SESSION['user_email'],
            'rol' => $_SESSION['user_role'],
            'estado' => $_SESSION['user_status']
        ];
    }
    
    /**
     * Guardar sesión en base de datos
     */
    private static function saveSessionToDatabase($userId) {
        try {
            $sessionId = session_id();
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
            
            $sql = "INSERT INTO sesiones (usuario_id, session_id, ip_address, user_agent, fecha_inicio, ultima_actividad) 
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE 
                    ultima_actividad = NOW(), ip_address = VALUES(ip_address), user_agent = VALUES(user_agent)";
            
            executeUpdate($sql, [$userId, $sessionId, $ipAddress, $userAgent]);
            
        } catch (Exception $e) {
            error_log("Error guardando sesión: " . $e->getMessage());
        }
    }
    
    /**
     * Eliminar sesión de base de datos
     */
    private static function removeSessionFromDatabase($userId) {
        try {
            $sessionId = session_id();
            $sql = "DELETE FROM sesiones WHERE usuario_id = ? AND session_id = ?";
            executeUpdate($sql, [$userId, $sessionId]);
            
        } catch (Exception $e) {
            error_log("Error eliminando sesión: " . $e->getMessage());
        }
    }
    
    /**
     * Limpiar sesiones expiradas
     */
    public static function cleanExpiredSessions() {
        try {
            // Eliminar sesiones de más de 24 horas
            $sql = "DELETE FROM sesiones WHERE ultima_actividad < DATE_SUB(NOW(), INTERVAL 24 HOUR)";
            executeUpdate($sql);
            
        } catch (Exception $e) {
            error_log("Error limpiando sesiones expiradas: " . $e->getMessage());
        }
    }
}

/**
 * Función helper para verificar permisos rápidamente
 */
function checkPermission($module, $action) {
    return PermissionManager::requirePermission($module, $action);
}

/**
 * Función helper para obtener usuario actual
 */
function getCurrentUser() {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'nombre' => $_SESSION['user_name'],
        'email' => $_SESSION['user_email'],
        'rol' => $_SESSION['user_role'],
        'estado' => $_SESSION['user_status']
    ];
}

/**
 * Función helper para verificar si está logueado
 */
function isLoggedIn() {
    session_start();
    return isset($_SESSION['user_id']) && isset($_SESSION['user_role']);
}

?>