<?php
/**
 * LIBRERÍA DIGITAL - CONFIGURACIÓN DE BASE DE DATOS
 * Archivo: database/config.php
 * Descripción: Configuración de conexión a la base de datos MySQL
 */

// ================================================================
// CONFIGURACIÓN DE CONEXIÓN A LA BASE DE DATOS
// ================================================================

// Configuración para XAMPP por defecto
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'libreria_inventario');
define('DB_USER', 'root');
define('DB_PASS', ''); // XAMPP por defecto no tiene contraseña para root
define('DB_CHARSET', 'utf8mb4');

// Configuración adicional
define('DB_PREFIX', ''); // Prefijo para las tablas si se necesita
define('DB_COLLATE', 'utf8mb4_unicode_ci');

// ================================================================
// CONFIGURACIÓN DE CONEXIÓN PDO
// ================================================================
class DatabaseConnection {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET . " COLLATE " . DB_COLLATE,
                PDO::ATTR_PERSISTENT => true,
                PDO::ATTR_TIMEOUT => 30
            ];
            
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            
            // Configurar zona horaria
            $this->pdo->exec("SET time_zone = '-05:00'"); // Colombia UTC-5
            
        } catch (PDOException $e) {
            error_log("Error de conexión a la base de datos: " . $e->getMessage());
            die("Error de conexión a la base de datos. Por favor, contacte al administrador.");
        }
    }
    
    /**
     * Obtener instancia única de la conexión (Singleton)
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Obtener conexión PDO
     */
    public function getConnection() {
        return $this->pdo;
    }
    
    /**
     * Prevenir clonación
     */
    private function __clone() {}
    
    /**
     * Prevenir deserialización
     */
    public function __wakeup() {}
}

// ================================================================
// FUNCIONES DE UTILIDAD PARA BASE DE DATOS
// ================================================================

/**
 * Obtener conexión a la base de datos
 * @return PDO
 */
function getDB() {
    return DatabaseConnection::getInstance()->getConnection();
}

/**
 * Ejecutar una consulta SELECT
 * @param string $sql
 * @param array $params
 * @return array
 */
function executeQuery($sql, $params = []) {
    try {
        $pdo = getDB();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Error en executeQuery: " . $e->getMessage());
        return false;
    }
}

/**
 * Ejecutar una consulta SELECT que retorna un solo registro
 * @param string $sql
 * @param array $params
 * @return array|false
 */
function executeQuerySingle($sql, $params = []) {
    try {
        $pdo = getDB();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch();
    } catch (PDOException $e) {
        error_log("Error en executeQuerySingle: " . $e->getMessage());
        return false;
    }
}

/**
 * Ejecutar una consulta INSERT, UPDATE o DELETE
 * @param string $sql
 * @param array $params
 * @return bool|int
 */
function executeUpdate($sql, $params = []) {
    try {
        $pdo = getDB();
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        // Para INSERT, retornar el ID del último registro insertado
        if (strpos(strtoupper($sql), 'INSERT') === 0) {
            return $pdo->lastInsertId();
        }
        
        // Para UPDATE y DELETE, retornar número de filas afectadas
        return $stmt->rowCount();
    } catch (PDOException $e) {
        error_log("Error en executeUpdate: " . $e->getMessage());
        return false;
    }
}

/**
 * Iniciar transacción
 */
function beginTransaction() {
    try {
        return getDB()->beginTransaction();
    } catch (PDOException $e) {
        error_log("Error al iniciar transacción: " . $e->getMessage());
        return false;
    }
}

/**
 * Confirmar transacción
 */
function commitTransaction() {
    try {
        return getDB()->commit();
    } catch (PDOException $e) {
        error_log("Error al confirmar transacción: " . $e->getMessage());
        return false;
    }
}

/**
 * Cancelar transacción
 */
function rollbackTransaction() {
    try {
        return getDB()->rollback();
    } catch (PDOException $e) {
        error_log("Error al cancelar transacción: " . $e->getMessage());
        return false;
    }
}

/**
 * Verificar conexión a la base de datos
 * @return bool
 */
function checkDatabaseConnection() {
    try {
        $pdo = getDB();
        $stmt = $pdo->query("SELECT 1");
        return $stmt !== false;
    } catch (Exception $e) {
        error_log("Error al probar conexión: " . $e->getMessage());
        return false;
    }
}

/**
 * Obtener información de la base de datos
 * @return array
 */
function getDatabaseInfo() {
    try {
        $pdo = getDB();
        
        // Información del servidor
        $serverInfo = $pdo->getAttribute(PDO::ATTR_SERVER_INFO);
        $serverVersion = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
        
        // Información de la base de datos
        $dbName = $pdo->query("SELECT DATABASE() as db_name")->fetch()['db_name'];
        
        // Contar tablas
        $tableCount = $pdo->query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '$dbName'")->fetch()['count'];
        
        return [
            'server_info' => $serverInfo,
            'server_version' => $serverVersion,
            'database_name' => $dbName,
            'table_count' => $tableCount,
            'charset' => DB_CHARSET,
            'host' => DB_HOST,
            'port' => DB_PORT
        ];
    } catch (Exception $e) {
        error_log("Error al obtener información de la base de datos: " . $e->getMessage());
        return false;
    }
}

// ================================================================
// CONFIGURACIÓN DE LOGGING
// ================================================================

/**
 * Configurar logging de errores
 */
function configureDatabaseLogging() {
    // Crear directorio de logs si no existe
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    // Configurar archivo de log
    $logFile = $logDir . '/database_' . date('Y-m-d') . '.log';
    ini_set('log_errors', 1);
    ini_set('error_log', $logFile);
}

// Configurar logging al incluir este archivo
configureDatabaseLogging();

// ================================================================
// CONFIGURACIÓN DE ENTORNO
// ================================================================

// Detectar si estamos en desarrollo o producción
$isDevelopment = (isset($_SERVER['SERVER_NAME']) && 
                 ($_SERVER['SERVER_NAME'] === 'localhost' || 
                  $_SERVER['SERVER_NAME'] === '127.0.0.1' || 
                  strpos($_SERVER['SERVER_NAME'], 'xampp') !== false));

if ($isDevelopment) {
    // Configuración para desarrollo
    define('DB_DEBUG', true);
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    // Configuración para producción
    define('DB_DEBUG', false);
    ini_set('display_errors', 0);
    error_reporting(0);
}

// ================================================================
// CONSTANTES ÚTILES
// ================================================================
define('MAX_QUERY_TIME', 30); // Tiempo máximo de consulta en segundos
define('DB_BACKUP_ENABLED', true);
define('DB_CACHE_ENABLED', false);

// Información de la aplicación
define('APP_NAME', 'Librería Digital - Sistema de Inventario');
define('APP_VERSION', '1.0');
define('DB_VERSION', '1.0');

?>