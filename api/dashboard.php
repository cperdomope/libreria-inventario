<?php
/**
 * LIBRERÍA DIGITAL - API DEL DASHBOARD
 * Archivo: api/dashboard.php
 * Descripción: Endpoint para obtener estadísticas del dashboard
 */

// Headers CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir configuración de base de datos
require_once '../database/config.php';

// Solo permitir GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    // Simular sesión básica
    session_start();
    if (!isset($_SESSION['user_id'])) {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_SESSION['user_name'] = 'Sistema';
    }

    // Obtener estadísticas principales
    $stats = [];

    // 1. Total de unidades en stock (suma de todo el inventario)
    $totalStock = executeQuerySingle("SELECT SUM(stock_actual) as total FROM libros WHERE estado != 'descontinuado'");
    $stats['totalBooks'] = (int)($totalStock['total'] ?? 0);

    // 2. Ventas de hoy
    $today = date('Y-m-d');
    $salesToday = executeQuerySingle("SELECT COUNT(*) as total FROM ventas WHERE DATE(fecha_venta) = ?", [$today]);
    $stats['salesToday'] = (int)$salesToday['total'];

    // 3. Ingresos de hoy
    $revenueToday = executeQuerySingle("SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE DATE(fecha_venta) = ?", [$today]);
    $stats['revenueToday'] = (float)$revenueToday['total'];

    // 4. Stock bajo (libros con stock <= stock_minimo)
    $lowStock = executeQuerySingle("SELECT COUNT(*) as total FROM libros WHERE estado IN ('disponible', 'reservado', 'agotado') AND stock_actual <= stock_minimo");
    $stats['lowStock'] = (int)$lowStock['total'];

    // 5. Total de clientes
    $totalClients = executeQuerySingle("SELECT COUNT(*) as total FROM clientes");
    $stats['totalClients'] = (int)$totalClients['total'];

    // 6. Clientes nuevos hoy
    $newClientsToday = executeQuerySingle("SELECT COUNT(*) as total FROM clientes WHERE DATE(fecha_creacion) = ?", [$today]);
    $stats['newClientsToday'] = (int)$newClientsToday['total'];

    // 7. Clientes nuevos esta semana
    $weekStart = date('Y-m-d', strtotime('monday this week'));
    $newClientsWeek = executeQuerySingle("SELECT COUNT(*) as total FROM clientes WHERE fecha_registro >= ?", [$weekStart]);
    $stats['newClientsWeek'] = (int)$newClientsWeek['total'];

    // 8. Cliente con más compras
    $topClient = executeQuerySingle("
        SELECT c.nombre, c.apellido, COUNT(v.id) as total_compras 
        FROM clientes c 
        LEFT JOIN ventas v ON c.id = v.cliente_id 
        WHERE c.estado = 'activo' 
        GROUP BY c.id, c.nombre, c.apellido 
        ORDER BY total_compras DESC 
        LIMIT 1
    ");
    
    $stats['topClient'] = $topClient ? [
        'name' => $topClient['nombre'] . ' ' . $topClient['apellido'],
        'purchases' => (int)$topClient['total_compras']
    ] : [
        'name' => 'Sin datos',
        'purchases' => 0
    ];

    // 9. Ventas por categoría (últimos 30 días)
    $salesByCategory = executeQuery("
        SELECT c.nombre as categoria, COUNT(dv.id) as ventas
        FROM categorias c
        LEFT JOIN libros l ON c.id = l.categoria_id
        LEFT JOIN detalles_venta dv ON l.id = dv.libro_id
        LEFT JOIN ventas v ON dv.venta_id = v.id
        WHERE v.fecha_venta >= DATE_SUB(NOW(), INTERVAL 30 DAY) OR v.fecha_venta IS NULL
        GROUP BY c.id, c.nombre
        ORDER BY ventas DESC
    ");

    $stats['salesByCategory'] = [
        'labels' => array_column($salesByCategory, 'categoria'),
        'data' => array_map('intval', array_column($salesByCategory, 'ventas'))
    ];

    // 10. Tendencia de ventas últimos 7 días
    $salesTrend = executeQuery("
        SELECT 
            DATE(v.fecha_venta) as fecha,
            COUNT(*) as total_ventas
        FROM ventas v
        WHERE v.fecha_venta >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(v.fecha_venta)
        ORDER BY fecha ASC
    ");

    // Crear array con todos los días de la semana
    $trendData = [];
    $trendLabels = [];
    
    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $dayName = date('D', strtotime("-$i days"));
        
        $trendLabels[] = $dayName;
        
        // Buscar ventas para este día
        $dayVentas = array_filter($salesTrend, function($item) use ($date) {
            return $item['fecha'] === $date;
        });
        
        $trendData[] = !empty($dayVentas) ? (int)reset($dayVentas)['total_ventas'] : 0;
    }

    $stats['salesTrend'] = [
        'labels' => $trendLabels,
        'data' => $trendData
    ];

    // 11. Libros con stock crítico
    $criticalStock = executeQuery("
        SELECT l.titulo, l.autor, l.stock_actual, l.stock_minimo
        FROM libros l
        WHERE l.estado = 'activo' AND l.stock_actual <= l.stock_minimo
        ORDER BY (l.stock_actual / l.stock_minimo) ASC
        LIMIT 10
    ");

    $stats['criticalStock'] = array_map(function($book) {
        return [
            'title' => $book['titulo'],
            'author' => $book['autor'],
            'currentStock' => (int)$book['stock_actual'],
            'minStock' => (int)$book['stock_minimo'],
            'status' => $book['stock_actual'] == 0 ? 'critical' : 'warning'
        ];
    }, $criticalStock);

    // 12. Actividad reciente (últimas acciones en el sistema)
    $recentActivity = [];
    
    // Últimos libros agregados
    $recentBooks = executeQuery("
        SELECT titulo, fecha_creacion 
        FROM libros 
        WHERE estado = 'activo' 
        ORDER BY fecha_creacion DESC 
        LIMIT 3
    ");
    
    foreach ($recentBooks as $book) {
        $recentActivity[] = [
            'type' => 'book_added',
            'icon' => 'fa-plus',
            'color' => 'blue',
            'title' => 'Nuevo libro agregado',
            'description' => 'Se agregó "' . $book['titulo'] . '" al inventario',
            'time' => timeAgo($book['fecha_creacion'])
        ];
    }

    // Últimas ventas
    $recentSales = executeQuery("
        SELECT v.numero_factura, v.total, v.fecha_venta,
               CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        ORDER BY v.fecha_venta DESC
        LIMIT 3
    ");
    
    foreach ($recentSales as $sale) {
        $recentActivity[] = [
            'type' => 'sale',
            'icon' => 'fa-shopping-cart',
            'color' => 'green',
            'title' => 'Venta realizada',
            'description' => 'Factura ' . $sale['numero_factura'] . ' por $' . number_format($sale['total'], 0, ',', '.'),
            'time' => timeAgo($sale['fecha_venta'])
        ];
    }

    // Ordenar actividad por tiempo (más reciente primero)
    usort($recentActivity, function($a, $b) {
        return strtotime($b['time']) - strtotime($a['time']);
    });

    $stats['recentActivity'] = array_slice($recentActivity, 0, 6);

    // Log para debugging
    error_log("📊 Dashboard Stats generados: " . json_encode($stats));

    echo json_encode([
        'success' => true,
        'data' => $stats,
        'message' => 'Estadísticas del dashboard cargadas exitosamente',
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    error_log("❌ Error en Dashboard API: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar estadísticas: ' . $e->getMessage(),
        'data' => null
    ]);
}

/**
 * Calcular tiempo transcurrido
 */
function timeAgo($datetime) {
    $time = time() - strtotime($datetime);
    
    if ($time < 60) {
        return $time . ' seg';
    } elseif ($time < 3600) {
        return floor($time / 60) . ' min';
    } elseif ($time < 86400) {
        return floor($time / 3600) . ' hora' . (floor($time / 3600) > 1 ? 's' : '');
    } else {
        return floor($time / 86400) . ' día' . (floor($time / 86400) > 1 ? 's' : '');
    }
}
?>