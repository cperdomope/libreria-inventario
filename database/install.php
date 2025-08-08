<?php
/**
 * LIBRERÍA DIGITAL - INSTALADOR DE BASE DE DATOS
 * Archivo: database/install.php
 * Descripción: Script para crear la base de datos y cargar datos iniciales
 */

// Configuración de errores para instalación
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Incluir configuración
require_once 'config.php';

// Configuración de instalación
$INSTALL_CONFIG = [
    'create_database' => true,
    'create_tables' => true,
    'insert_sample_data' => true,
    'create_admin_user' => true
];

// Credenciales del administrador por defecto
$ADMIN_CREDENTIALS = [
    'name' => 'Carlos Ivan Perdomo',
    'email' => 'admin@libreria.com',
    'password' => 'admin123', // Se hasheará
    'role' => 'admin'
];

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalador - Librería Digital</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center mb-6">
                    <div class="bg-indigo-600 p-3 rounded-full mr-4">
                        <i class="fas fa-database text-white text-xl"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Instalador de Base de Datos</h1>
                        <p class="text-gray-600">Librería Digital - Sistema de Inventario</p>
                    </div>
                </div>

                <div id="installation-content">
                    <?php
                    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
                        handleInstallation($_POST['action']);
                    } else {
                        showInstallationOptions();
                    }
                    ?>
                </div>
            </div>
        </div>
    </div>
</body>
</html>

<?php

/**
 * Mostrar opciones de instalación
 */
function showInstallationOptions() {
    global $INSTALL_CONFIG;
    ?>
    <div class="space-y-6">
        <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <i class="fas fa-info-circle text-blue-400"></i>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-blue-800">Información Importante</h3>
                    <div class="mt-2 text-sm text-blue-700">
                        <p>Este script creará la base de datos completa para el Sistema de Inventario de Librería.</p>
                        <p class="mt-1"><strong>Asegúrese de que XAMPP esté ejecutándose y MySQL esté activo.</strong></p>
                    </div>
                </div>
            </div>
        </div>

        <form method="POST" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-gray-900 mb-3">Opciones de Instalación</h3>
                    
                    <label class="flex items-center mb-2">
                        <input type="checkbox" name="create_database" value="1" checked class="mr-2">
                        <span>Crear base de datos</span>
                    </label>
                    
                    <label class="flex items-center mb-2">
                        <input type="checkbox" name="create_tables" value="1" checked class="mr-2">
                        <span>Crear tablas y estructura</span>
                    </label>
                    
                    <label class="flex items-center mb-2">
                        <input type="checkbox" name="insert_sample_data" value="1" checked class="mr-2">
                        <span>Insertar datos de muestra</span>
                    </label>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-gray-900 mb-3">Información del Sistema</h3>
                    <div class="text-sm space-y-1">
                        <p><strong>Host:</strong> <?php echo DB_HOST; ?></p>
                        <p><strong>Puerto:</strong> <?php echo DB_PORT; ?></p>
                        <p><strong>Base de datos:</strong> <?php echo DB_NAME; ?></p>
                        <p><strong>Usuario:</strong> <?php echo DB_USER; ?></p>
                        <p><strong>Charset:</strong> <?php echo DB_CHARSET; ?></p>
                    </div>
                </div>
            </div>

            <div class="flex justify-between items-center pt-4">
                <button type="button" onclick="testConnection()" 
                        class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-plug mr-2"></i>
                    Probar Conexión
                </button>
                
                <button type="submit" name="action" value="install" 
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                    <i class="fas fa-play mr-2"></i>
                    Iniciar Instalación
                </button>
            </div>
        </form>

        <div id="test-result" class="hidden"></div>
    </div>

    <script>
    function testConnection() {
        const resultDiv = document.getElementById('test-result');
        resultDiv.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Probando conexión...</div>';
        resultDiv.classList.remove('hidden');
        
        fetch('install.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=test_connection'
        })
        .then(response => response.text())
        .then(html => {
            resultDiv.innerHTML = html;
        })
        .catch(error => {
            resultDiv.innerHTML = '<div class="bg-red-50 border-l-4 border-red-400 p-4"><p class="text-red-700">Error al probar conexión: ' + error.message + '</p></div>';
        });
    }
    </script>
    <?php
}

/**
 * Manejar instalación
 */
function handleInstallation($action) {
    switch ($action) {
        case 'test_connection':
            testDatabaseConnection();
            break;
        case 'install':
            runInstallation();
            break;
        default:
            echo '<p class="text-red-600">Acción no válida.</p>';
    }
}

/**
 * Probar conexión a la base de datos
 */
function testDatabaseConnection() {
    try {
        // Intentar conexión sin especificar base de datos
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        
        $version = $pdo->query("SELECT VERSION() as version")->fetch()['version'];
        
        echo '<div class="bg-green-50 border-l-4 border-green-400 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-check-circle text-green-400"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-green-800">Conexión Exitosa</h3>
                        <div class="mt-2 text-sm text-green-700">
                            <p>MySQL Version: ' . $version . '</p>
                            <p>Servidor: ' . DB_HOST . ':' . DB_PORT . '</p>
                        </div>
                    </div>
                </div>
              </div>';
              
    } catch (Exception $e) {
        echo '<div class="bg-red-50 border-l-4 border-red-400 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-times-circle text-red-400"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error de Conexión</h3>
                        <div class="mt-2 text-sm text-red-700">
                            <p>' . $e->getMessage() . '</p>
                        </div>
                    </div>
                </div>
              </div>';
    }
}

/**
 * Ejecutar instalación completa
 */
function runInstallation() {
    $results = [];
    $hasErrors = false;
    
    echo '<div class="space-y-4">';
    
    // Paso 1: Crear base de datos
    if (isset($_POST['create_database'])) {
        $result = createDatabase();
        displayStep('Crear Base de Datos', $result['success'], $result['message']);
        if (!$result['success']) $hasErrors = true;
    }
    
    // Paso 2: Crear tablas
    if (isset($_POST['create_tables']) && !$hasErrors) {
        $result = createTables();
        displayStep('Crear Tablas', $result['success'], $result['message']);
        if (!$result['success']) $hasErrors = true;
    }
    
    // Paso 3: Insertar datos de muestra
    if (isset($_POST['insert_sample_data']) && !$hasErrors) {
        $result = insertSampleData();
        displayStep('Insertar Datos de Muestra', $result['success'], $result['message']);
        if (!$result['success']) $hasErrors = true;
    }
    
    echo '</div>';
    
    // Resultado final
    if (!$hasErrors) {
        echo '<div class="mt-6 bg-green-50 border-l-4 border-green-400 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-check-circle text-green-400 text-xl"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-lg font-medium text-green-800">¡Instalación Completada!</h3>
                        <div class="mt-2 text-sm text-green-700">
                            <p>La base de datos ha sido creada exitosamente.</p>
                            <p class="mt-2"><strong>Credenciales de administrador:</strong></p>
                            <p>Email: admin@libreria.com</p>
                            <p>Contraseña: admin123</p>
                        </div>
                        <div class="mt-4">
                            <a href="../login.html" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-block">
                                <i class="fas fa-sign-in-alt mr-2"></i>
                                Ir al Sistema
                            </a>
                        </div>
                    </div>
                </div>
              </div>';
    } else {
        echo '<div class="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-times-circle text-red-400 text-xl"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-lg font-medium text-red-800">Error en la Instalación</h3>
                        <p class="mt-2 text-sm text-red-700">La instalación no pudo completarse. Revise los errores anteriores.</p>
                    </div>
                </div>
              </div>';
    }
}

/**
 * Crear base de datos
 */
function createDatabase() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        
        $sql = "CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET " . DB_CHARSET . " COLLATE " . DB_COLLATE;
        $pdo->exec($sql);
        
        return ['success' => true, 'message' => 'Base de datos "' . DB_NAME . '" creada exitosamente.'];
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
    }
}

/**
 * Crear tablas
 */
function createTables() {
    try {
        $sqlFile = __DIR__ . '/libreria_inventario.sql';
        
        if (!file_exists($sqlFile)) {
            return ['success' => false, 'message' => 'Archivo SQL no encontrado: ' . $sqlFile];
        }
        
        $sql = file_get_contents($sqlFile);
        
        // Conectar a la base de datos
        $pdo = getDB();
        $pdo->exec("USE " . DB_NAME);
        
        // Limpiar base de datos existente si es necesario
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        
        // Obtener lista de tablas existentes (en orden inverso para evitar problemas de FK)
        $tables = ['auditoria', 'pagos', 'detalles_compra', 'compras', 'detalles_venta', 'ventas', 
                  'movimientos_stock', 'libros', 'clientes', 'proveedores', 'categorias', 'configuracion', 'sesiones', 'usuarios'];
        
        // Eliminar tablas en orden inverso para evitar problemas de FK
        foreach ($tables as $table) {
            $pdo->exec("DROP TABLE IF EXISTS `$table`");
        }
        
        // Eliminar vistas si existen
        $pdo->exec("DROP VIEW IF EXISTS vista_stock_bajo");
        $pdo->exec("DROP VIEW IF EXISTS vista_ventas_mensuales");
        $pdo->exec("DROP VIEW IF EXISTS vista_libros_mas_vendidos");
        
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        // Procesar el archivo SQL línea por línea para manejar DELIMITER
        $statements = [];
        $currentStatement = '';
        $inDelimiterBlock = false;
        $customDelimiter = '//';
        
        $lines = explode("\n", $sql);
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Saltar líneas vacías y comentarios
            if (empty($line) || substr($line, 0, 2) === '--' || substr($line, 0, 2) === '/*') {
                continue;
            }
            
            // Manejar cambios de delimiter
            if (preg_match('/^DELIMITER\s+(.+)$/i', $line, $matches)) {
                $customDelimiter = trim($matches[1]);
                $inDelimiterBlock = ($customDelimiter !== ';');
                continue;
            }
            
            // Agregar línea al statement actual
            $currentStatement .= $line . "\n";
            
            // Determinar si el statement está completo
            if ($inDelimiterBlock) {
                // En bloque de delimiter personalizado, buscar el delimiter personalizado
                if (substr(rtrim($line), -strlen($customDelimiter)) === $customDelimiter) {
                    // Remover el delimiter personalizado del final
                    $currentStatement = substr($currentStatement, 0, -strlen($customDelimiter) - 1);
                    $statements[] = trim($currentStatement);
                    $currentStatement = '';
                }
            } else {
                // Delimiter normal, buscar punto y coma
                if (substr($line, -1) === ';') {
                    $statements[] = trim($currentStatement);
                    $currentStatement = '';
                }
            }
        }
        
        // Agregar último statement si existe
        if (!empty(trim($currentStatement))) {
            $statements[] = trim($currentStatement);
        }
        
        // Ejecutar cada statement individualmente
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement)) {
                try {
                    $pdo->exec($statement);
                } catch (Exception $e) {
                    // Log del error específico para debugging
                    error_log("Error ejecutando statement: " . substr($statement, 0, 100) . "... Error: " . $e->getMessage());
                    throw $e;
                }
            }
        }
        
        return ['success' => true, 'message' => 'Estructura de tablas creada exitosamente.'];
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
    }
}

/**
 * Insertar datos de muestra
 */
function insertSampleData() {
    try {
        $sqlFile = __DIR__ . '/sample_data.sql';
        
        if (!file_exists($sqlFile)) {
            return ['success' => false, 'message' => 'Archivo de datos no encontrado: ' . $sqlFile];
        }
        
        $sql = file_get_contents($sqlFile);
        
        // Hash para las contraseñas (admin123)
        $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $sql = str_replace('$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', $hashedPassword, $sql);
        
        $pdo = getDB();
        $pdo->exec($sql);
        
        return ['success' => true, 'message' => 'Datos de muestra insertados exitosamente.'];
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
    }
}

/**
 * Mostrar paso de instalación
 */
function displayStep($title, $success, $message) {
    $iconClass = $success ? 'fas fa-check-circle text-green-400' : 'fas fa-times-circle text-red-400';
    $bgClass = $success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400';
    $textClass = $success ? 'text-green-800' : 'text-red-800';
    $messageClass = $success ? 'text-green-700' : 'text-red-700';
    
    echo '<div class="' . $bgClass . ' border-l-4 p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <i class="' . $iconClass . '"></i>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium ' . $textClass . '">' . $title . '</h3>
                    <div class="mt-2 text-sm ' . $messageClass . '">
                        <p>' . $message . '</p>
                    </div>
                </div>
            </div>
          </div>';
}
?>