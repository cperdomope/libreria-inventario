<?php
/**
 * PRUEBA DE CONEXIÓN A LA BASE DE DATOS
 * Archivo temporal para verificar conectividad
 */

// Incluir configuración
require_once 'database/config.php';

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test de Conexión - Librería Digital</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="container mx-auto max-w-4xl px-4">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-center mb-6">
                <div class="bg-blue-600 p-3 rounded-full mr-4">
                    <i class="fas fa-database text-white text-xl"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Test de Conexión</h1>
                    <p class="text-gray-600">Librería Digital - Sistema de Inventario</p>
                </div>
            </div>

            <div class="space-y-4">
                <?php testFullConnection(); ?>
            </div>
        </div>
    </div>
</body>
</html>

<?php

function testFullConnection() {
    echo '<div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <h3 class="font-semibold text-blue-800">🔧 Configuración</h3>
            <div class="mt-2 text-sm text-blue-700">
                <p><strong>Host:</strong> ' . DB_HOST . '</p>
                <p><strong>Puerto:</strong> ' . DB_PORT . '</p>
                <p><strong>Base de datos:</strong> ' . DB_NAME . '</p>
                <p><strong>Usuario:</strong> ' . DB_USER . '</p>
                <p><strong>Charset:</strong> ' . DB_CHARSET . '</p>
            </div>
          </div>';

    // Test 1: Conexión básica al servidor MySQL
    echo '<div class="border rounded-lg p-4">';
    echo '<h4 class="font-semibold mb-2">1. Conexión al Servidor MySQL</h4>';
    
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $version = $pdo->query("SELECT VERSION() as version")->fetch()['version'];
        
        echo '<div class="flex items-center text-green-700">
                <i class="fas fa-check-circle mr-2"></i>
                <span>✅ Conectado al servidor MySQL</span>
              </div>';
        echo '<p class="text-sm text-gray-600 mt-1">Versión: ' . $version . '</p>';
        
    } catch (Exception $e) {
        echo '<div class="flex items-center text-red-700">
                <i class="fas fa-times-circle mr-2"></i>
                <span>❌ Error de conexión al servidor</span>
              </div>';
        echo '<p class="text-sm text-red-600 mt-1">Error: ' . $e->getMessage() . '</p>';
        return;
    }
    echo '</div>';

    // Test 2: Conexión a la base de datos específica
    echo '<div class="border rounded-lg p-4">';
    echo '<h4 class="font-semibold mb-2">2. Conexión a la Base de Datos</h4>';
    
    try {
        $pdo = getDB();
        $dbInfo = $pdo->query("SELECT DATABASE() as current_db")->fetch();
        
        echo '<div class="flex items-center text-green-700">
                <i class="fas fa-check-circle mr-2"></i>
                <span>✅ Conectado a la base de datos</span>
              </div>';
        echo '<p class="text-sm text-gray-600 mt-1">Base de datos actual: ' . $dbInfo['current_db'] . '</p>';
        
    } catch (Exception $e) {
        echo '<div class="flex items-center text-red-700">
                <i class="fas fa-times-circle mr-2"></i>
                <span>❌ Error conectando a la base de datos</span>
              </div>';
        echo '<p class="text-sm text-red-600 mt-1">Error: ' . $e->getMessage() . '</p>';
        return;
    }
    echo '</div>';

    // Test 3: Verificar tablas existentes
    echo '<div class="border rounded-lg p-4">';
    echo '<h4 class="font-semibold mb-2">3. Verificar Estructura de Tablas</h4>';
    
    try {
        $tables = executeQuery("SHOW TABLES");
        $tableCount = count($tables);
        
        if ($tableCount > 0) {
            echo '<div class="flex items-center text-green-700">
                    <i class="fas fa-check-circle mr-2"></i>
                    <span>✅ Tablas encontradas: ' . $tableCount . '</span>
                  </div>';
            
            echo '<div class="mt-2 grid grid-cols-3 gap-2 text-sm">';
            foreach ($tables as $table) {
                $tableName = array_values($table)[0];
                echo '<span class="bg-gray-100 px-2 py-1 rounded">' . $tableName . '</span>';
            }
            echo '</div>';
        } else {
            echo '<div class="flex items-center text-yellow-700">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    <span>⚠️ No se encontraron tablas</span>
                  </div>';
        }
        
    } catch (Exception $e) {
        echo '<div class="flex items-center text-red-700">
                <i class="fas fa-times-circle mr-2"></i>
                <span>❌ Error verificando tablas</span>
              </div>';
        echo '<p class="text-sm text-red-600 mt-1">Error: ' . $e->getMessage() . '</p>';
    }
    echo '</div>';

    // Test 4: Probar consulta de datos
    echo '<div class="border rounded-lg p-4">';
    echo '<h4 class="font-semibold mb-2">4. Prueba de Consulta de Datos</h4>';
    
    try {
        $usuarios = executeQuery("SELECT COUNT(*) as total FROM usuarios");
        $libros = executeQuery("SELECT COUNT(*) as total FROM libros");
        $categorias = executeQuery("SELECT COUNT(*) as total FROM categorias");
        
        echo '<div class="flex items-center text-green-700 mb-2">
                <i class="fas fa-check-circle mr-2"></i>
                <span>✅ Consultas ejecutadas correctamente</span>
              </div>';
        
        echo '<div class="grid grid-cols-3 gap-4 text-sm">
                <div class="bg-blue-50 p-3 rounded">
                    <div class="font-semibold text-blue-800">👥 Usuarios</div>
                    <div class="text-2xl font-bold text-blue-600">' . $usuarios[0]['total'] . '</div>
                </div>
                <div class="bg-green-50 p-3 rounded">
                    <div class="font-semibold text-green-800">📚 Libros</div>
                    <div class="text-2xl font-bold text-green-600">' . $libros[0]['total'] . '</div>
                </div>
                <div class="bg-purple-50 p-3 rounded">
                    <div class="font-semibold text-purple-800">🏷️ Categorías</div>
                    <div class="text-2xl font-bold text-purple-600">' . $categorias[0]['total'] . '</div>
                </div>
              </div>';
        
    } catch (Exception $e) {
        echo '<div class="flex items-center text-red-700">
                <i class="fas fa-times-circle mr-2"></i>
                <span>❌ Error ejecutando consultas</span>
              </div>';
        echo '<p class="text-sm text-red-600 mt-1">Error: ' . $e->getMessage() . '</p>';
    }
    echo '</div>';

    // Test 5: Verificar usuario de prueba
    echo '<div class="border rounded-lg p-4">';
    echo '<h4 class="font-semibold mb-2">5. Verificar Usuario de Prueba</h4>';
    
    try {
        $admin = executeQuerySingle("SELECT nombre, email, rol, estado FROM usuarios WHERE email = 'admin@libreria.com'");
        
        if ($admin) {
            echo '<div class="flex items-center text-green-700">
                    <i class="fas fa-check-circle mr-2"></i>
                    <span>✅ Usuario administrador encontrado</span>
                  </div>';
            echo '<div class="mt-2 text-sm text-gray-600">
                    <p><strong>Nombre:</strong> ' . $admin['nombre'] . '</p>
                    <p><strong>Email:</strong> ' . $admin['email'] . '</p>
                    <p><strong>Rol:</strong> ' . $admin['rol'] . '</p>
                    <p><strong>Estado:</strong> ' . $admin['estado'] . '</p>
                  </div>';
        } else {
            echo '<div class="flex items-center text-yellow-700">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    <span>⚠️ Usuario administrador no encontrado</span>
                  </div>';
        }
        
    } catch (Exception $e) {
        echo '<div class="flex items-center text-red-700">
                <i class="fas fa-times-circle mr-2"></i>
                <span>❌ Error verificando usuario</span>
              </div>';
        echo '<p class="text-sm text-red-600 mt-1">Error: ' . $e->getMessage() . '</p>';
    }
    echo '</div>';

    // Resultado final
    echo '<div class="bg-green-50 border-l-4 border-green-400 p-4 mt-6">
            <div class="flex items-center">
                <i class="fas fa-thumbs-up text-green-500 text-xl mr-3"></i>
                <div>
                    <h3 class="text-lg font-semibold text-green-800">✅ Sistema Listo</h3>
                    <p class="text-green-700">La aplicación está correctamente conectada a la base de datos.</p>
                    <div class="mt-2">
                        <a href="login.html" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-block">
                            <i class="fas fa-sign-in-alt mr-2"></i>
                            Ir al Sistema de Login
                        </a>
                    </div>
                </div>
            </div>
          </div>';
}

?>