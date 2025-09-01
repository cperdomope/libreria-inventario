<?php
/**
 * LIBRERÍA DIGITAL - API DE AUTENTICACIÓN (SEGURA)
 * Archivo: api/auth.php
 * Descripción: Endpoint para validar credenciales, con control de intentos y bloqueo.
 */

// Desactivar errores HTML para que no interfieran con JSON
error_reporting(0);
ini_set('display_errors', 0);

// ===== HEADERS Y CONFIGURACIÓN INICIAL =====
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// ===== CONSTANTES DE SEGURIDAD =====
define('MAX_LOGIN_ATTEMPTS', 3);
define('LOCKOUT_TIME_MINUTES', 2);

try {
    // Incluir archivos necesarios
    require_once '../database/config.php';
    require_once 'permissions.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error de configuración',
        'error' => $e->getMessage()
    ]);
    exit;
}

/**
 * Manejar login de usuario
 */
function handleLogin() {
    // ===== OBTENCIÓN DE DATOS =====
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email y contraseña son requeridos.']);
        return;
    }

try {
    // 1. BUSCAR USUARIO POR EMAIL
    $sql = "SELECT id, nombre, email, password, rol, estado, intentos_login, bloqueado_hasta FROM usuarios WHERE email = ?";
    $user = executeQuerySingle($sql, [$email]);
    
    error_log("Auth: Buscando usuario con email: $email");
    error_log("Auth: Usuario encontrado: " . ($user ? 'SI' : 'NO'));

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Credenciales inválidas.']);
        exit;
    }

    // 2. VERIFICAR SI EL USUARIO ESTÁ BLOQUEADO
    if ($user['bloqueado_hasta'] && new DateTime() < new DateTime($user['bloqueado_hasta'])) {
        $bloqueadoHasta = new DateTime($user['bloqueado_hasta']);
        $ahora = new DateTime();
        $diferencia = $ahora->diff($bloqueadoHasta);
        $minutosRestantes = $diferencia->i + ($diferencia->h * 60);

        http_response_code(429); // Too Many Requests
        echo json_encode([
            'success' => false,
            'message' => "Cuenta bloqueada. Inténtalo de nuevo en " . ($minutosRestantes + 1) . " minutos."
        ]);
        exit;
    }

    // 3. VERIFICAR SI LA CUENTA ESTÁ INACTIVA
    if ($user['estado'] !== 'activo') {
        http_response_code(403); // Forbidden
        echo json_encode(['success' => false, 'message' => 'Esta cuenta de usuario está inactiva.']);
        exit;
    }

    // 4. VERIFICAR CONTRASEÑA
    if (password_verify($password, $user['password'])) {
        // CONTRASEÑA CORRECTA
        
        // Reiniciar intentos fallidos si es necesario
        if ($user['intentos_login'] > 0) {
            executeUpdate("UPDATE usuarios SET intentos_login = 0, bloqueado_hasta = NULL WHERE id = ?", [$user['id']]);
        }

        // Crear sesión básica
        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['nombre'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['rol'];
        $_SESSION['user_status'] = $user['estado'];
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();
        
        // Obtener permisos del usuario
        $permissions = PermissionManager::getPermissionsForUser($user['rol']);

        // Respuesta exitosa
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'user' => [
                'id' => $user['id'],
                'name' => $user['nombre'],
                'email' => $user['email'],
                'role' => $user['rol'],
                'estado' => $user['estado']
            ],
            'permissions' => $permissions,
            'token' => session_id() // Token de sesión simple
        ]);

    } else {
        // CONTRASEÑA INCORRECTA
        $intentos_actuales = $user['intentos_login'] + 1;

        if ($intentos_actuales >= MAX_LOGIN_ATTEMPTS) {
            // Bloquear la cuenta
            $bloqueo = new DateTime();
            $bloqueo->add(new DateInterval('PT' . LOCKOUT_TIME_MINUTES . 'M'));
            $bloqueado_hasta_str = $bloqueo->format('Y-m-d H:i:s');

            executeUpdate(
                "UPDATE usuarios SET intentos_login = ?, bloqueado_hasta = ? WHERE id = ?",
                [$intentos_actuales, $bloqueado_hasta_str, $user['id']]
            );

            http_response_code(429);
            echo json_encode([
                'success' => false,
                'message' => "Has excedido el número de intentos. Tu cuenta ha sido bloqueada por " . LOCKOUT_TIME_MINUTES . " minutos."
            ]);

        } else {
            // Solo incrementar el contador de intentos
            executeUpdate("UPDATE usuarios SET intentos_login = ? WHERE id = ?", [$intentos_actuales, $user['id']]);
            
            $intentos_restantes = MAX_LOGIN_ATTEMPTS - $intentos_actuales;

            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => "Credenciales inválidas. Te quedan $intentos_restantes intento(s)."
            ]);
        }
    }

    } catch (Exception $e) {
        error_log("Error en login: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error del servidor. Inténtelo nuevamente.'
        ]);
    }
}

/**
 * Obtener información del usuario actual
 */
function handleGetUserInfo() {
    try {
        session_start();
        
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }
        
        $user = [
            'id' => $_SESSION['user_id'],
            'nombre' => $_SESSION['user_name'],
            'email' => $_SESSION['user_email'],
            'rol' => $_SESSION['user_role'],
            'estado' => $_SESSION['user_status']
        ];
        
        $permissions = PermissionManager::getPermissionsForUser($user['rol']);
        
        echo json_encode([
            'success' => true,
            'user' => $user,
            'permissions' => $permissions
        ]);
        
    } catch (Exception $e) {
        error_log("Error obteniendo info de usuario: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error del servidor']);
    }
}

/**
 * Cerrar sesión
 */
function handleLogout() {
    try {
        session_start();
        session_destroy();
        
        echo json_encode([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente'
        ]);
        
    } catch (Exception $e) {
        error_log("Error en logout: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error del servidor']);
    }
}

// ===== MANEJAR SOLICITUD =====
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleLogin();
        break;
    case 'GET':
        handleGetUserInfo();
        break;
    case 'DELETE':
        handleLogout();
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        exit;
}
?>