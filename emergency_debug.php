<?php
/**
 * DIAGNÓSTICO DE EMERGENCIA - SISTEMA DE USUARIOS
 * Verificar TODOS los aspectos del sistema
 */

echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <title>🚨 Diagnóstico de Emergencia</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; }
        .section { background: white; margin: 10px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: #16a34a; font-weight: bold; }
        .error { color: #dc2626; font-weight: bold; }
        .warning { color: #ca8a04; font-weight: bold; }
        pre { background: #f8f8f8; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .status-ok { background: #dcfce7; border-left: 4px solid #16a34a; }
        .status-error { background: #fef2f2; border-left: 4px solid #dc2626; }
        .status-warning { background: #fefce8; border-left: 4px solid #ca8a04; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🚨 Diagnóstico de Emergencia - Sistema de Usuarios</h1>";

echo "<div class='section'>";
echo "<h2>📋 1. INFORMACIÓN DEL SERVIDOR</h2>";
echo "<div class='status-ok'>";
echo "<p><strong>PHP Version:</strong> " . PHP_VERSION . "</p>";
echo "<p><strong>Servidor:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p><strong>Documento Root:</strong> " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p><strong>Script actual:</strong> " . __FILE__ . "</p>";
echo "</div>";
echo "</div>";

// Test 1: Verificar archivos
echo "<div class='section'>";
echo "<h2>📁 2. VERIFICAR ARCHIVOS CRÍTICOS</h2>";

$criticalFiles = [
    'database/config.php' => __DIR__ . '/database/config.php',
    'api/users_simple.php' => __DIR__ . '/api/users_simple.php',
    'api/users.php' => __DIR__ . '/api/users.php',
    'index.html' => __DIR__ . '/index.html'
];

foreach ($criticalFiles as $name => $path) {
    if (file_exists($path)) {
        echo "<p class='success'>✅ $name - EXISTS</p>";
        if (is_readable($path)) {
            echo "<p class='success'>   📖 Readable</p>";
        } else {
            echo "<p class='error'>   ❌ Not readable</p>";
        }
    } else {
        echo "<p class='error'>❌ $name - MISSING</p>";
    }
}
echo "</div>";

// Test 2: Conexión a base de datos
echo "<div class='section'>";
echo "<h2>🗄️ 3. CONEXIÓN A BASE DE DATOS</h2>";

try {
    if (file_exists(__DIR__ . '/database/config.php')) {
        require_once __DIR__ . '/database/config.php';
        echo "<p class='success'>✅ Config file loaded</p>";
        
        // Probar conexión básica
        $pdo = getDB();
        echo "<p class='success'>✅ Database connection successful</p>";
        
        // Verificar base de datos
        $dbName = $pdo->query("SELECT DATABASE() as db_name")->fetch()['db_name'];
        echo "<p class='success'>✅ Connected to database: <strong>$dbName</strong></p>";
        
        // Verificar tabla usuarios
        $tables = $pdo->query("SHOW TABLES LIKE 'usuarios'")->fetchAll();
        if (count($tables) > 0) {
            echo "<p class='success'>✅ Table 'usuarios' exists</p>";
            
            // Contar usuarios
            $userCount = $pdo->query("SELECT COUNT(*) as count FROM usuarios")->fetch()['count'];
            echo "<p class='success'>✅ Users in database: <strong>$userCount</strong></p>";
            
            // Mostrar algunos usuarios
            $users = $pdo->query("SELECT id, nombre, email, rol FROM usuarios LIMIT 3")->fetchAll();
            echo "<div class='status-ok'>";
            echo "<strong>Sample users:</strong><br>";
            foreach ($users as $user) {
                echo "ID: {$user['id']} - {$user['nombre']} ({$user['email']}) - {$user['rol']}<br>";
            }
            echo "</div>";
            
        } else {
            echo "<p class='error'>❌ Table 'usuarios' does NOT exist</p>";
            echo "<div class='status-error'>Need to run database installer!</div>";
        }
        
    } else {
        echo "<p class='error'>❌ Config file missing</p>";
    }
    
} catch (Exception $e) {
    echo "<p class='error'>❌ Database Error: " . $e->getMessage() . "</p>";
    echo "<div class='status-error'>";
    echo "<strong>Error details:</strong><br>";
    echo "File: " . $e->getFile() . "<br>";
    echo "Line: " . $e->getLine() . "<br>";
    echo "Trace: " . $e->getTraceAsString();
    echo "</div>";
}
echo "</div>";

// Test 3: API Test
echo "<div class='section'>";
echo "<h2>🌐 4. API TEST</h2>";

if (file_exists(__DIR__ . '/api/users_fix.php')) {
    echo "<p class='success'>✅ API file exists (users_fix.php)</p>";
    
    // Simular GET request
    $_SERVER['REQUEST_METHOD'] = 'GET';
    ob_start();
    
    try {
        include __DIR__ . '/api/users_fix.php';
        $apiResponse = ob_get_contents();
        ob_end_clean();
        
        echo "<div class='status-ok'>";
        echo "<strong>API GET Response:</strong>";
        echo "<pre>" . htmlspecialchars($apiResponse) . "</pre>";
        echo "</div>";
        
        // Verificar si es JSON válido
        $json = json_decode($apiResponse, true);
        if ($json !== null) {
            echo "<p class='success'>✅ API returns valid JSON</p>";
            if (isset($json['success']) && $json['success']) {
                echo "<p class='success'>✅ API reports success</p>";
            } else {
                echo "<p class='error'>❌ API reports failure: " . ($json['message'] ?? 'Unknown error') . "</p>";
            }
        } else {
            echo "<p class='error'>❌ API response is not valid JSON</p>";
            echo "<p class='error'>JSON Error: " . json_last_error_msg() . "</p>";
        }
        
    } catch (Exception $e) {
        ob_end_clean();
        echo "<p class='error'>❌ API Error: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p class='error'>❌ API file missing</p>";
}
echo "</div>";

// Test 4: POST Test
echo "<div class='section'>";
echo "<h2>📝 5. POST REQUEST TEST</h2>";

if (file_exists(__DIR__ . '/api/users_fix.php')) {
    // Simular POST request
    $_SERVER['REQUEST_METHOD'] = 'POST';
    
    $testUser = [
        'nombre' => 'Usuario Test Emergency',
        'email' => 'emergency' . time() . '@test.com',
        'password' => 'test123',
        'rol' => 'seller',
        'estado' => 'activo',
        'telefono' => '3001234567'
    ];
    
    // Simular POST data
    $postData = json_encode($testUser);
    file_put_contents('php://input', $postData);
    
    echo "<div class='status-warning'>";
    echo "<strong>Test user data:</strong>";
    echo "<pre>" . htmlspecialchars($postData) . "</pre>";
    echo "</div>";
    
    ob_start();
    try {
        include __DIR__ . '/api/users_fix.php';
        $postResponse = ob_get_contents();
        ob_end_clean();
        
        echo "<div class='status-ok'>";
        echo "<strong>API POST Response:</strong>";
        echo "<pre>" . htmlspecialchars($postResponse) . "</pre>";
        echo "</div>";
        
        // Verificar respuesta
        $json = json_decode($postResponse, true);
        if ($json !== null && isset($json['success'])) {
            if ($json['success']) {
                echo "<p class='success'>✅ User creation successful!</p>";
                echo "<p class='success'>New user ID: " . ($json['user_id'] ?? 'Unknown') . "</p>";
            } else {
                echo "<p class='error'>❌ User creation failed: " . ($json['message'] ?? 'Unknown error') . "</p>";
                if (isset($json['errors'])) {
                    foreach ($json['errors'] as $error) {
                        echo "<p class='error'>   - $error</p>";
                    }
                }
            }
        }
        
    } catch (Exception $e) {
        ob_end_clean();
        echo "<p class='error'>❌ POST Test Error: " . $e->getMessage() . "</p>";
    }
}
echo "</div>";

// Test 5: Permisos
echo "<div class='section'>";
echo "<h2>🔐 6. PERMISOS DE ARCHIVOS</h2>";

$checkPaths = [
    __DIR__ . '/database',
    __DIR__ . '/api',
    __DIR__ . '/logs'
];

foreach ($checkPaths as $path) {
    if (is_dir($path)) {
        if (is_writable($path)) {
            echo "<p class='success'>✅ $path - Writable</p>";
        } else {
            echo "<p class='warning'>⚠️ $path - Not writable</p>";
        }
    } else {
        echo "<p class='error'>❌ $path - Directory missing</p>";
    }
}
echo "</div>";

// Recomendaciones
echo "<div class='section'>";
echo "<h2>💡 7. RECOMENDACIONES</h2>";
echo "<div class='status-warning'>";
echo "<ol>";
echo "<li><strong>Si la tabla 'usuarios' no existe:</strong> Ejecutar <a href='database/install.php'>database/install.php</a></li>";
echo "<li><strong>Si hay errores de conexión:</strong> Verificar que XAMPP MySQL esté activo</li>";
echo "<li><strong>Si el API falla:</strong> Revisar logs de PHP en XAMPP</li>";
echo "<li><strong>Para probar manualmente:</strong> Usar <a href='test_form_data.html'>test_form_data.html</a></li>";
echo "</ol>";
echo "</div>";
echo "</div>";

echo "</div></body></html>";
?>