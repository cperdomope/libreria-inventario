<?php
/**
 * DIAGNÓSTICO DE LOGIN Y BASE DE DATOS
 * Debug completo del sistema de autenticación
 */

// Headers
header('Content-Type: text/html; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Debug Login - Librería Digital</title>
    <script src='https://cdn.tailwindcss.com'></script>
</head>
<body class='bg-gray-100 min-h-screen py-8'>
    <div class='container mx-auto max-w-4xl px-4'>
        <div class='bg-white rounded-lg shadow-lg p-6'>
            <h1 class='text-2xl font-bold mb-6'>🔧 Diagnóstico del Sistema de Login</h1>";

try {
    // Incluir configuración
    require_once 'database/config.php';
    
    echo "<div class='bg-green-50 border border-green-200 rounded p-4 mb-4'>
            <h3 class='font-bold text-green-800'>✅ 1. Configuración Cargada</h3>
            <p class='text-sm text-green-700'>
                Host: " . DB_HOST . "<br>
                Database: " . DB_NAME . "<br>
                User: " . DB_USER . "<br>
                Charset: " . DB_CHARSET . "
            </p>
          </div>";
    
    // Test conexión
    $pdo = getDB();
    echo "<div class='bg-green-50 border border-green-200 rounded p-4 mb-4'>
            <h3 class='font-bold text-green-800'>✅ 2. Conexión a Base de Datos OK</h3>
          </div>";
    
    // Verificar usuarios
    $users = executeQuery("SELECT id, nombre, email, password, rol, estado FROM usuarios ORDER BY id");
    echo "<div class='bg-blue-50 border border-blue-200 rounded p-4 mb-4'>
            <h3 class='font-bold text-blue-800'>👥 3. Usuarios en Base de Datos (" . count($users) . ")</h3>
            <div class='overflow-x-auto'>
                <table class='min-w-full text-sm'>
                    <thead>
                        <tr class='bg-blue-100'>
                            <th class='p-2 text-left'>ID</th>
                            <th class='p-2 text-left'>Nombre</th>
                            <th class='p-2 text-left'>Email</th>
                            <th class='p-2 text-left'>Rol</th>
                            <th class='p-2 text-left'>Estado</th>
                            <th class='p-2 text-left'>Password Hash</th>
                        </tr>
                    </thead>
                    <tbody>";
    
    foreach ($users as $user) {
        echo "<tr class='border-b'>
                <td class='p-2'>{$user['id']}</td>
                <td class='p-2'>{$user['nombre']}</td>
                <td class='p-2'>{$user['email']}</td>
                <td class='p-2'>{$user['rol']}</td>
                <td class='p-2'>{$user['estado']}</td>
                <td class='p-2 font-mono text-xs'>" . substr($user['password'], 0, 30) . "...</td>
              </tr>";
    }
    
    echo "    </tbody>
                </table>
            </div>
          </div>";
    
    // Test de credenciales específicas
    echo "<div class='bg-yellow-50 border border-yellow-200 rounded p-4 mb-4'>
            <h3 class='font-bold text-yellow-800'>🧪 4. Test de Validación de Credenciales</h3>";
    
    $testCredentials = [
        ['email' => 'admin@libreria.com', 'password' => 'admin123'],
        ['email' => 'vendedor@libreria.com', 'password' => 'vendedor123'],
        ['email' => 'inventario@libreria.com', 'password' => 'inventario123']
    ];
    
    foreach ($testCredentials as $cred) {
        echo "<div class='mb-3 p-3 bg-white rounded border'>";
        echo "<h4 class='font-semibold'>Test: {$cred['email']} / {$cred['password']}</h4>";
        
        // Buscar usuario
        $user = executeQuerySingle(
            "SELECT id, nombre, email, password, rol, estado FROM usuarios WHERE email = ? AND estado = 'activo'", 
            [$cred['email']]
        );
        
        if (!$user) {
            echo "<p class='text-red-600'>❌ Usuario no encontrado o inactivo</p>";
        } else {
            echo "<p class='text-green-600'>✅ Usuario encontrado: {$user['nombre']} ({$user['rol']})</p>";
            
            // Test password_verify
            $hashCheck = password_verify($cred['password'], $user['password']);
            echo "<p>Password hash check: " . ($hashCheck ? '✅ VÁLIDO' : '❌ INVÁLIDO') . "</p>";
            
            // Test comparación directa
            $directCheck = ($cred['password'] === $user['password']);
            echo "<p>Comparación directa: " . ($directCheck ? '✅ VÁLIDO' : '❌ INVÁLIDO') . "</p>";
            
            // Mostrar hash almacenado
            echo "<p class='text-xs text-gray-600'>Hash almacenado: " . $user['password'] . "</p>";
            
            // Generar nuevo hash para comparar
            $newHash = password_hash($cred['password'], PASSWORD_DEFAULT);
            echo "<p class='text-xs text-gray-600'>Hash nuevo: " . $newHash . "</p>";
        }
        
        echo "</div>";
    }
    
    echo "</div>";
    
    // Test del API endpoint
    echo "<div class='bg-purple-50 border border-purple-200 rounded p-4 mb-4'>
            <h3 class='font-bold text-purple-800'>🌐 5. Test del API Endpoint</h3>
            <p class='mb-2'>Probando llamada al endpoint de autenticación...</p>
            <div id='apiTest'>Cargando...</div>
          </div>";
    
    // Verificar tabla de sesiones
    $sessions = executeQuery("SELECT COUNT(*) as total FROM sesiones");
    echo "<div class='bg-gray-50 border border-gray-200 rounded p-4 mb-4'>
            <h3 class='font-bold text-gray-800'>🗂️ 6. Tabla de Sesiones</h3>
            <p>Total de sesiones: {$sessions[0]['total']}</p>
          </div>";
    
} catch (Exception $e) {
    echo "<div class='bg-red-50 border border-red-200 rounded p-4 mb-4'>
            <h3 class='font-bold text-red-800'>❌ ERROR</h3>
            <p class='text-red-700'>" . $e->getMessage() . "</p>
            <p class='text-sm text-red-600 mt-2'>Trace: " . $e->getTraceAsString() . "</p>
          </div>";
}

echo "
            <div class='mt-6 p-4 bg-blue-50 rounded'>
                <h3 class='font-bold mb-2'>🔄 Acciones de Prueba</h3>
                <div class='space-x-2'>
                    <button onclick='testApiLogin()' class='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
                        Test API Login
                    </button>
                    <a href='login.html' class='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block'>
                        Ir al Login
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function testApiLogin() {
            const result = document.getElementById('apiTest');
            result.innerHTML = 'Probando login con admin@libreria.com...';
            
            try {
                const response = await fetch('api/auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'admin@libreria.com',
                        password: 'admin123',
                        remember: false
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `
                        <div class='bg-green-100 p-3 rounded'>
                            <p class='text-green-800 font-semibold'>✅ API Login Exitoso!</p>
                            <p class='text-sm'>Usuario: \${data.user.name}</p>
                            <p class='text-sm'>Rol: \${data.user.role}</p>
                            <p class='text-sm'>Token: \${data.token.substring(0, 20)}...</p>
                        </div>
                    `;
                } else {
                    result.innerHTML = `
                        <div class='bg-red-100 p-3 rounded'>
                            <p class='text-red-800 font-semibold'>❌ API Login Falló</p>
                            <p class='text-sm'>Error: \${data.message}</p>
                            <p class='text-xs'>Debug: \${JSON.stringify(data)}</p>
                        </div>
                    `;
                }
            } catch (error) {
                result.innerHTML = `
                    <div class='bg-red-100 p-3 rounded'>
                        <p class='text-red-800 font-semibold'>❌ Error de Red</p>
                        <p class='text-sm'>\${error.message}</p>
                    </div>
                `;
            }
        }
        
        // Auto-ejecutar test API al cargar
        setTimeout(testApiLogin, 1000);
    </script>
</body>
</html>";

?>