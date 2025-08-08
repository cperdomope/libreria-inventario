<?php
/**
 * SCRIPT PARA ARREGLAR LAS CONTRASEÑAS EN LA BASE DE DATOS
 * Actualiza las contraseñas con hashes correctos
 */

// Headers
header('Content-Type: text/html; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'database/config.php';

echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <title>Fix Passwords - Librería Digital</title>
    <script src='https://cdn.tailwindcss.com'></script>
</head>
<body class='bg-gray-100 min-h-screen py-8'>
    <div class='container mx-auto max-w-3xl px-4'>
        <div class='bg-white rounded-lg shadow-lg p-6'>
            <h1 class='text-2xl font-bold mb-6'>🔧 Reparar Contraseñas de Usuarios</h1>";

try {
    // Definir contraseñas correctas
    $correctPasswords = [
        'admin@libreria.com' => 'admin123',
        'vendedor@libreria.com' => 'vendedor123',
        'inventario@libreria.com' => 'inventario123',
        'consulta@libreria.com' => 'consulta123',
        'juan.morales@libreria.com' => 'vendedor123'
    ];
    
    echo "<div class='bg-blue-50 border border-blue-200 rounded p-4 mb-4'>
            <h3 class='font-bold text-blue-800'>🔄 Actualizando Contraseñas...</h3>
          </div>";
    
    foreach ($correctPasswords as $email => $password) {
        // Verificar si el usuario existe
        $user = executeQuerySingle("SELECT id, nombre, email FROM usuarios WHERE email = ?", [$email]);
        
        if ($user) {
            // Generar hash de la contraseña
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // Actualizar en la base de datos
            $result = executeUpdate(
                "UPDATE usuarios SET password = ? WHERE email = ?", 
                [$hashedPassword, $email]
            );
            
            if ($result) {
                echo "<div class='bg-green-50 border border-green-200 rounded p-3 mb-2'>
                        <p class='text-green-800'>✅ <strong>{$email}</strong> - Contraseña actualizada</p>
                        <p class='text-xs text-green-600'>Usuario: {$user['nombre']}</p>
                        <p class='text-xs text-green-600'>Password: {$password}</p>
                        <p class='text-xs text-gray-500'>Hash: " . substr($hashedPassword, 0, 40) . "...</p>
                      </div>";
            } else {
                echo "<div class='bg-red-50 border border-red-200 rounded p-3 mb-2'>
                        <p class='text-red-800'>❌ <strong>{$email}</strong> - Error al actualizar</p>
                      </div>";
            }
        } else {
            echo "<div class='bg-yellow-50 border border-yellow-200 rounded p-3 mb-2'>
                    <p class='text-yellow-800'>⚠️ <strong>{$email}</strong> - Usuario no encontrado</p>
                  </div>";
        }
    }
    
    echo "<div class='bg-green-50 border border-green-400 border-l-4 p-4 mt-6'>
            <h3 class='font-bold text-green-800'>✅ Contraseñas Actualizadas Correctamente</h3>
            <p class='text-green-700'>Ahora puedes usar estas credenciales:</p>
            <ul class='mt-2 text-sm text-green-700 space-y-1'>";
    
    foreach ($correctPasswords as $email => $password) {
        echo "<li><strong>{$email}</strong> / {$password}</li>";
    }
    
    echo "  </ul>
          </div>";
    
    // Verificación final
    echo "<div class='bg-blue-50 border border-blue-200 rounded p-4 mt-4'>
            <h3 class='font-bold text-blue-800'>🧪 Verificación de Contraseñas</h3>";
    
    foreach ($correctPasswords as $email => $password) {
        $user = executeQuerySingle("SELECT password FROM usuarios WHERE email = ?", [$email]);
        if ($user) {
            $isValid = password_verify($password, $user['password']);
            $status = $isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO';
            echo "<p class='text-sm'>{$email}: {$status}</p>";
        }
    }
    
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='bg-red-50 border border-red-200 rounded p-4'>
            <h3 class='font-bold text-red-800'>❌ ERROR</h3>
            <p class='text-red-700'>{$e->getMessage()}</p>
          </div>";
}

echo "
            <div class='mt-6 text-center space-x-4'>
                <a href='debug_login.php' class='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block'>
                    Ver Diagnóstico Completo
                </a>
                <a href='login.html' class='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block'>
                    Probar Login Ahora
                </a>
            </div>
        </div>
    </div>
</body>
</html>";

?>