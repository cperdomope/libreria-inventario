<?php
/**
 * TEST ESPECÍFICO DE FUNCIONES DE BASE DE DATOS
 * Verificar que executeQuery y otras funciones funcionen correctamente
 */

echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <title>🔧 Test Database Functions</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .success { color: #16a34a; font-weight: bold; }
        .error { color: #dc2626; font-weight: bold; }
        .warning { color: #ca8a04; font-weight: bold; }
        pre { background: #f8f8f8; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .section { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🔧 Test Database Functions</h1>";

try {
    echo "<div class='section'>";
    echo "<h2>1. Loading Config</h2>";
    
    if (file_exists(__DIR__ . '/database/config.php')) {
        require_once __DIR__ . '/database/config.php';
        echo "<p class='success'>✅ Config loaded successfully</p>";
    } else {
        echo "<p class='error'>❌ Config file not found</p>";
        exit;
    }
    echo "</div>";

    echo "<div class='section'>";
    echo "<h2>2. Testing getDB() function</h2>";
    
    if (function_exists('getDB')) {
        echo "<p class='success'>✅ getDB() function exists</p>";
        
        try {
            $pdo = getDB();
            if ($pdo instanceof PDO) {
                echo "<p class='success'>✅ getDB() returns PDO object</p>";
            } else {
                echo "<p class='error'>❌ getDB() doesn't return PDO object</p>";
                echo "<pre>Returned: " . gettype($pdo) . "</pre>";
            }
        } catch (Exception $e) {
            echo "<p class='error'>❌ getDB() threw exception: " . $e->getMessage() . "</p>";
        }
    } else {
        echo "<p class='error'>❌ getDB() function doesn't exist</p>";
    }
    echo "</div>";

    echo "<div class='section'>";
    echo "<h2>3. Testing executeQuery() function</h2>";
    
    if (function_exists('executeQuery')) {
        echo "<p class='success'>✅ executeQuery() function exists</p>";
        
        // Test simple query
        try {
            $result = executeQuery("SELECT 1 as test_value");
            echo "<p>executeQuery result type: " . gettype($result) . "</p>";
            echo "<p>executeQuery result:</p>";
            echo "<pre>" . print_r($result, true) . "</pre>";
            
            if (is_array($result) && count($result) > 0 && isset($result[0]['test_value'])) {
                echo "<p class='success'>✅ executeQuery() works correctly</p>";
            } else {
                echo "<p class='error'>❌ executeQuery() doesn't return expected result</p>";
            }
        } catch (Exception $e) {
            echo "<p class='error'>❌ executeQuery() threw exception: " . $e->getMessage() . "</p>";
        }
    } else {
        echo "<p class='error'>❌ executeQuery() function doesn't exist</p>";
    }
    echo "</div>";

    echo "<div class='section'>";
    echo "<h2>4. Testing Direct PDO Query</h2>";
    
    try {
        $pdo = getDB();
        $stmt = $pdo->query("SELECT 1 as direct_test");
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<p>Direct PDO result type: " . gettype($result) . "</p>";
        echo "<p>Direct PDO result:</p>";
        echo "<pre>" . print_r($result, true) . "</pre>";
        
        if (is_array($result) && count($result) > 0) {
            echo "<p class='success'>✅ Direct PDO query works</p>";
        } else {
            echo "<p class='error'>❌ Direct PDO query failed</p>";
        }
    } catch (Exception $e) {
        echo "<p class='error'>❌ Direct PDO query threw exception: " . $e->getMessage() . "</p>";
    }
    echo "</div>";

    echo "<div class='section'>";
    echo "<h2>5. Testing Table Existence</h2>";
    
    try {
        $pdo = getDB();
        $stmt = $pdo->query("SHOW TABLES LIKE 'usuarios'");
        $tables = $stmt->fetchAll();
        
        echo "<p>Tables found: " . count($tables) . "</p>";
        
        if (count($tables) > 0) {
            echo "<p class='success'>✅ Table 'usuarios' exists</p>";
            
            // Test count
            $stmt = $pdo->query("SELECT COUNT(*) as user_count FROM usuarios");
            $count = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "<p class='success'>✅ Users in table: " . $count['user_count'] . "</p>";
            
        } else {
            echo "<p class='error'>❌ Table 'usuarios' does NOT exist</p>";
            echo "<p class='warning'>⚠️ Need to run database installer!</p>";
        }
    } catch (Exception $e) {
        echo "<p class='error'>❌ Table check threw exception: " . $e->getMessage() . "</p>";
    }
    echo "</div>";

    echo "<div class='section'>";
    echo "<h2>6. Fixed executeQuery Test</h2>";
    
    // Test if functions return false on error
    try {
        $result = executeQuery("SELECT COUNT(*) as total FROM usuarios");
        echo "<p>executeQuery('SELECT COUNT...'): </p>";
        echo "<pre>" . print_r($result, true) . "</pre>";
        
        if ($result === false) {
            echo "<p class='error'>❌ executeQuery returned FALSE - likely table doesn't exist</p>";
        } elseif (is_array($result) && isset($result[0]['total'])) {
            echo "<p class='success'>✅ executeQuery works with usuarios table</p>";
        } else {
            echo "<p class='warning'>⚠️ Unexpected result from executeQuery</p>";
        }
    } catch (Exception $e) {
        echo "<p class='error'>❌ executeQuery test threw exception: " . $e->getMessage() . "</p>";
    }
    echo "</div>";

} catch (Exception $e) {
    echo "<p class='error'>❌ Fatal error: " . $e->getMessage() . "</p>";
    echo "<p>File: " . $e->getFile() . "</p>";
    echo "<p>Line: " . $e->getLine() . "</p>";
}

echo "<div class='section'>";
echo "<h2>🎯 Conclusion</h2>";
echo "<p><strong>If you see errors above:</strong></p>";
echo "<ul>";
echo "<li>❌ Table 'usuarios' doesn't exist → Run <a href='database/install.php'>Database Installer</a></li>";
echo "<li>❌ executeQuery returns false → Database connection issues</li>";
echo "<li>❌ PDO errors → Check XAMPP MySQL is running</li>";
echo "</ul>";
echo "</div>";

echo "</div></body></html>";
?>