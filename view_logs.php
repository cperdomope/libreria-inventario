<?php
/**
 * VISOR DE LOGS DE PHP
 * Para debugging del sistema de usuarios
 */

header('Content-Type: text/html; charset=UTF-8');

// Encontrar el archivo de log de PHP
$logFiles = [
    ini_get('error_log'),
    'C:\xampp\apache\logs\error.log',
    'C:\xampp\php\logs\php_error_log',
    __DIR__ . '/logs/database_' . date('Y-m-d') . '.log',
    '/var/log/apache2/error.log',
    '/var/log/php_errors.log'
];

$foundLog = null;
foreach ($logFiles as $logFile) {
    if ($logFile && file_exists($logFile) && is_readable($logFile)) {
        $foundLog = $logFile;
        break;
    }
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP Error Logs - Librería Digital</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="container mx-auto max-w-6xl px-4">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-900">📋 PHP Error Logs</h1>
                <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    🔄 Refrescar
                </button>
            </div>
            
            <div class="mb-6">
                <h3 class="font-semibold text-gray-800 mb-2">📁 Ubicaciones de logs verificadas:</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <?php foreach ($logFiles as $logFile): ?>
                        <div class="flex items-center">
                            <?php if ($logFile && file_exists($logFile)): ?>
                                <span class="text-green-600">✅</span>
                                <span class="ml-2 text-green-800"><?php echo htmlspecialchars($logFile); ?></span>
                            <?php else: ?>
                                <span class="text-red-600">❌</span>
                                <span class="ml-2 text-gray-600"><?php echo htmlspecialchars($logFile ?: 'No configurado'); ?></span>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <?php if ($foundLog): ?>
                <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h4 class="font-semibold text-green-800">📄 Leyendo log: <?php echo htmlspecialchars($foundLog); ?></h4>
                    <p class="text-sm text-green-700">Tamaño: <?php echo number_format(filesize($foundLog)); ?> bytes</p>
                </div>
                
                <div class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto" style="max-height: 600px; overflow-y: auto;">
                    <pre class="text-xs"><?php
                        // Mostrar las últimas 100 líneas del log
                        $lines = file($foundLog);
                        if ($lines) {
                            $recentLines = array_slice($lines, -100);
                            echo htmlspecialchars(implode('', $recentLines));
                        } else {
                            echo "No se pudieron leer las líneas del archivo";
                        }
                    ?></pre>
                </div>
            <?php else: ?>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 class="font-semibold text-yellow-800">⚠️ No se encontraron logs de PHP</h4>
                    <p class="text-yellow-700">Configuración actual de PHP:</p>
                    <ul class="text-sm text-yellow-700 mt-2 space-y-1">
                        <li><strong>log_errors:</strong> <?php echo ini_get('log_errors') ? 'ON' : 'OFF'; ?></li>
                        <li><strong>error_log:</strong> <?php echo ini_get('error_log') ?: 'No configurado'; ?></li>
                        <li><strong>display_errors:</strong> <?php echo ini_get('display_errors') ? 'ON' : 'OFF'; ?></li>
                    </ul>
                </div>
            <?php endif; ?>
            
            <div class="mt-6 p-4 bg-blue-50 rounded border">
                <h4 class="font-semibold text-blue-800 mb-2">🔧 Test rápido de API</h4>
                <button onclick="testAPI()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    Probar API de Usuarios
                </button>
                <div id="apiResult" class="mt-4"></div>
            </div>
        </div>
    </div>

    <script>
        async function testAPI() {
            const result = document.getElementById('apiResult');
            result.innerHTML = '<div class="text-blue-600">Probando API...</div>';
            
            try {
                const response = await fetch('api/users_simple.php');
                const text = await response.text();
                
                result.innerHTML = `
                    <div class="bg-gray-100 p-3 rounded">
                        <h5 class="font-semibold">Respuesta de la API:</h5>
                        <pre class="text-xs mt-2 overflow-x-auto">${text}</pre>
                    </div>
                `;
            } catch (error) {
                result.innerHTML = `<div class="text-red-600">Error: ${error.message}</div>`;
            }
        }
    </script>
</body>
</html>