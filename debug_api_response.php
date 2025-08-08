<?php
/**
 * DEBUG API RESPONSE
 * Ver exactamente qué devuelve el API de usuarios
 */

echo "<h2>Debug API Response</h2>";
echo "<pre>";

echo "1. Verificando archivo API...\n";
$apiFile = __DIR__ . '/api/users.php';
if (file_exists($apiFile)) {
    echo "✅ Archivo api/users.php existe\n";
} else {
    echo "❌ Archivo api/users.php NO existe\n";
    exit;
}

echo "\n2. Verificando permisos...\n";
if (is_readable($apiFile)) {
    echo "✅ Archivo es legible\n";
} else {
    echo "❌ Archivo no es legible\n";
}

echo "\n3. Llamando al API directamente...\n";

// Capturar toda la salida
ob_start();
$_SERVER['REQUEST_METHOD'] = 'GET';

try {
    include $apiFile;
    $output = ob_get_contents();
} catch (Exception $e) {
    $output = "ERROR: " . $e->getMessage();
} finally {
    ob_end_clean();
}

echo "Respuesta del API:\n";
echo "==================\n";
echo htmlspecialchars($output);
echo "\n==================\n";

echo "\n4. Verificando si es JSON válido...\n";
$json = json_decode($output, true);
if ($json !== null) {
    echo "✅ Respuesta es JSON válido\n";
    echo "Contenido decodificado:\n";
    print_r($json);
} else {
    echo "❌ Respuesta NO es JSON válido\n";
    echo "Error JSON: " . json_last_error_msg() . "\n";
    echo "Primeros 200 caracteres de la respuesta:\n";
    echo substr($output, 0, 200) . "\n";
}

echo "\n5. Probando conexión a BD...\n";
try {
    require_once 'database/config.php';
    $pdo = getDB();
    echo "✅ Conexión a BD exitosa\n";
    
    $users = executeQuery("SELECT COUNT(*) as total FROM usuarios");
    echo "✅ Query de prueba exitosa - Total usuarios: " . $users[0]['total'] . "\n";
} catch (Exception $e) {
    echo "❌ Error de BD: " . $e->getMessage() . "\n";
}

echo "</pre>";
?>