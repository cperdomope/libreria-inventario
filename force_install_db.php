<?php
/**
 * INSTALADOR FORZADO DE BASE DE DATOS
 * Este script GARANTIZA que la base de datos se instale correctamente
 */

echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <title>🔧 Force Install Database</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .success { color: #16a34a; font-weight: bold; }
        .error { color: #dc2626; font-weight: bold; }
        .warning { color: #ca8a04; font-weight: bold; }
        pre { background: #f8f8f8; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .step { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🔧 Force Install Database</h1>
        <p>Este script instalará la base de datos paso a paso, mostrando cada operación.</p>";

try {
    // Paso 1: Conectar sin especificar base de datos
    echo "<div class='step'>";
    echo "<h2>Paso 1: Conexión al servidor MySQL</h2>";
    
    $dsn = "mysql:host=localhost;port=3306;charset=utf8mb4";
    $pdo = new PDO($dsn, 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p class='success'>✅ Conectado al servidor MySQL</p>";
    
    $version = $pdo->query("SELECT VERSION() as version")->fetch()['version'];
    echo "<p>MySQL Version: $version</p>";
    echo "</div>";

    // Paso 2: Crear base de datos
    echo "<div class='step'>";
    echo "<h2>Paso 2: Crear base de datos</h2>";
    
    $pdo->exec("DROP DATABASE IF EXISTS libreria_inventario");
    echo "<p class='warning'>⚠️ Base de datos anterior eliminada (si existía)</p>";
    
    $pdo->exec("CREATE DATABASE libreria_inventario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p class='success'>✅ Base de datos 'libreria_inventario' creada</p>";
    
    $pdo->exec("USE libreria_inventario");
    echo "<p class='success'>✅ Conectado a base de datos 'libreria_inventario'</p>";
    echo "</div>";

    // Paso 3: Crear tabla usuarios
    echo "<div class='step'>";
    echo "<h2>Paso 3: Crear tabla usuarios</h2>";
    
    $createUsersTable = "
    CREATE TABLE usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'seller', 'inventory', 'readonly') NOT NULL DEFAULT 'readonly',
        estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
        telefono VARCHAR(20) NULL,
        direccion TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_rol (rol),
        INDEX idx_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($createUsersTable);
    echo "<p class='success'>✅ Tabla 'usuarios' creada</p>";
    echo "</div>";

    // Paso 4: Crear otros tablas básicas
    echo "<div class='step'>";
    echo "<h2>Paso 4: Crear tablas adicionales</h2>";
    
    // Tabla categorias
    $pdo->exec("
    CREATE TABLE categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        color VARCHAR(7) DEFAULT '#6366F1',
        icono VARCHAR(50) DEFAULT 'fas fa-tag',
        orden_display INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p class='success'>✅ Tabla 'categorias' creada</p>";
    
    // Tabla configuracion
    $pdo->exec("
    CREATE TABLE configuracion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clave VARCHAR(100) NOT NULL UNIQUE,
        valor TEXT,
        descripcion TEXT,
        tipo ENUM('texto', 'numero', 'booleano', 'json') DEFAULT 'texto',
        categoria VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p class='success'>✅ Tabla 'configuracion' creada</p>";
    
    // Tabla auditoria
    $pdo->exec("
    CREATE TABLE auditoria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NULL,
        accion VARCHAR(50) NOT NULL,
        tabla_afectada VARCHAR(100),
        descripcion TEXT,
        ip_address VARCHAR(45),
        fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_usuario (usuario_id),
        INDEX idx_accion (accion),
        INDEX idx_fecha (fecha_accion)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p class='success'>✅ Tabla 'auditoria' creada</p>";
    echo "</div>";

    // Paso 5: Insertar usuarios de prueba
    echo "<div class='step'>";
    echo "<h2>Paso 5: Insertar usuarios de prueba</h2>";
    
    $users = [
        ['Carlos Ivan Perdomo', 'admin@libreria.com', 'admin123', 'admin'],
        ['Ana García Méndez', 'vendedor@libreria.com', 'vendedor123', 'seller'],
        ['Luis Sánchez Torres', 'inventario@libreria.com', 'inventario123', 'inventory'],
        ['María Rodríguez Silva', 'consulta@libreria.com', 'consulta123', 'readonly']
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO usuarios (nombre, email, password, rol, estado, created_at) 
        VALUES (?, ?, ?, ?, 'activo', NOW())
    ");
    
    foreach ($users as $user) {
        $hashedPassword = password_hash($user[2], PASSWORD_DEFAULT);
        $stmt->execute([$user[0], $user[1], $hashedPassword, $user[3]]);
        echo "<p class='success'>✅ Usuario creado: {$user[1]} ({$user[3]})</p>";
    }
    echo "</div>";

    // Paso 6: Verificar instalación
    echo "<div class='step'>";
    echo "<h2>Paso 6: Verificar instalación</h2>";
    
    $userCount = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
    echo "<p class='success'>✅ Total usuarios: $userCount</p>";
    
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "<p class='success'>✅ Tablas creadas: " . implode(', ', $tables) . "</p>";
    
    echo "<div style='background: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0;'>";
    echo "<h3 style='color: #16a34a; margin-top: 0;'>🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!</h3>";
    echo "<p><strong>Credenciales de acceso:</strong></p>";
    echo "<ul>";
    echo "<li><strong>Admin:</strong> admin@libreria.com / admin123</li>";
    echo "<li><strong>Vendedor:</strong> vendedor@libreria.com / vendedor123</li>";
    echo "<li><strong>Inventario:</strong> inventario@libreria.com / inventario123</li>";
    echo "<li><strong>Consulta:</strong> consulta@libreria.com / consulta123</li>";
    echo "</ul>";
    echo "</div>";
    echo "</div>";

    // Paso 7: Enlaces útiles
    echo "<div class='step'>";
    echo "<h2>Paso 7: Próximos pasos</h2>";
    echo "<div style='display: flex; gap: 10px; flex-wrap: wrap;'>";
    echo "<a href='test_database_functions.php' style='background: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;'>🔧 Test Database Functions</a>";
    echo "<a href='test_final.html' style='background: #28a745; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;'>🚀 Test Final</a>";
    echo "<a href='index.html' style='background: #6f42c1; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;'>🏠 Ir a la Aplicación</a>";
    echo "</div>";
    echo "</div>";

} catch (Exception $e) {
    echo "<div class='step' style='border-color: #dc2626; background: #fef2f2;'>";
    echo "<h2 style='color: #dc2626;'>❌ Error Fatal</h2>";
    echo "<p class='error'>Error: " . $e->getMessage() . "</p>";
    echo "<p>Archivo: " . $e->getFile() . "</p>";
    echo "<p>Línea: " . $e->getLine() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
    echo "<div style='background: #fefce8; border: 1px solid #ca8a04; padding: 10px; border-radius: 4px; margin-top: 15px;'>";
    echo "<h3 style='color: #ca8a04;'>💡 Posibles soluciones:</h3>";
    echo "<ul>";
    echo "<li>Verificar que XAMPP esté ejecutándose</li>";
    echo "<li>Verificar que MySQL esté activo en el panel de XAMPP</li>";
    echo "<li>Verificar usuario/contraseña de MySQL (por defecto: root / sin contraseña)</li>";
    echo "</ul>";
    echo "</div>";
    echo "</div>";
}

echo "</div></body></html>";
?>