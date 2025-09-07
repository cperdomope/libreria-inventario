<?php
/**
 * LIBRERÍA DIGITAL - API DE LIBROS
 * Archivo: api/books.php
 * Descripción: Endpoint para gestión y filtrado de libros
 */

// Headers CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir configuración de base de datos
require_once '../database/config.php';
require_once 'permissions.php';

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Todos los roles pueden ver inventario
            checkPermission('inventory', 'view');
            handleGetBooks();
            break;
        case 'POST':
            // Solo admin e inventory pueden crear libros
            checkPermission('inventory', 'create');
            handleCreateBook();
            break;
        case 'PUT':
            // Solo admin e inventory pueden editar libros
            checkPermission('inventory', 'edit');
            handleUpdateBook();
            break;
        case 'DELETE':
            // Solo admin e inventory pueden eliminar libros
            checkPermission('inventory', 'delete');
            handleDeleteBook();
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor: ' . $e->getMessage()]);
}

/**
 * Manejar búsqueda y filtrado de libros
 */
function handleGetBooks() {
    // Verificar si se solicita el total de stock
    $action = $_GET['action'] ?? null;
    if ($action === 'total_stock') {
        return getTotalStock();
    }
    
    // Si se proporciona un ID específico, devolver ese libro
    $bookId = $_GET['id'] ?? null;
    if ($bookId && is_numeric($bookId)) {
        return getSingleBook($bookId);
    }
    
    // Obtener parámetros de búsqueda y filtrado
    $search = $_GET['search'] ?? '';
    $categoria_id = $_GET['categoria_id'] ?? '';
    $estado = $_GET['estado'] ?? '';
    $stock_bajo = $_GET['stock_bajo'] ?? '';
    $formato = $_GET['formato'] ?? '';
    $destacado = $_GET['destacado'] ?? '';
    $nuevo_ingreso = $_GET['nuevo_ingreso'] ?? '';
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = max(1, min(100, intval($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;
    $order_by = $_GET['order_by'] ?? 'titulo';
    $order_direction = strtoupper($_GET['order_direction'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

    // Validar order_by para evitar SQL injection
    $allowed_order_fields = ['titulo', 'autor', 'precio_venta', 'stock_actual', 'fecha_creacion'];
    if (!in_array($order_by, $allowed_order_fields)) {
        $order_by = 'titulo';
    }

    // Construir consulta SQL base
    $sql = "
        SELECT 
            l.id,
            l.titulo,
            l.subtitulo,
            l.autor,
            l.isbn,
            l.isbn13,
            l.editorial,
            l.año_publicacion,
            l.precio_venta,
            l.stock_actual,
            l.stock_minimo,
            l.ubicacion,
            l.estado,
            l.destacado,
            l.nuevo_ingreso,
            l.formato,
            l.imagen_portada,
            l.descuento,
            l.fecha_creacion,
            c.nombre as categoria_nombre,
            c.color as categoria_color,
            p.nombre as proveedor_nombre
        FROM libros l
        LEFT JOIN categorias c ON l.categoria_id = c.id
        LEFT JOIN proveedores p ON l.proveedor_id = p.id
        WHERE 1=1
    ";

    $params = [];
    $where_conditions = [];

    // Filtro de búsqueda general (título, autor, ISBN)
    if (!empty($search)) {
        $where_conditions[] = "(l.titulo LIKE ? OR l.autor LIKE ? OR l.isbn LIKE ? OR l.isbn13 LIKE ? OR l.descripcion LIKE ?)";
        $search_param = "%$search%";
        $params = array_merge($params, [$search_param, $search_param, $search_param, $search_param, $search_param]);
    }

    // Filtro por categoría
    if (!empty($categoria_id) && is_numeric($categoria_id)) {
        $where_conditions[] = "l.categoria_id = ?";
        $params[] = $categoria_id;
    }

    // Filtro por estado
    if (!empty($estado)) {
        $where_conditions[] = "l.estado = ?";
        $params[] = $estado;
    }

    // Filtro por formato
    if (!empty($formato)) {
        $where_conditions[] = "l.formato = ?";
        $params[] = $formato;
    }

    // Filtro por stock bajo
    if ($stock_bajo === 'true') {
        $where_conditions[] = "l.stock_actual <= l.stock_minimo";
    }

    // Filtro por destacado
    if ($destacado === 'true') {
        $where_conditions[] = "l.destacado = 1";
    }

    // Filtro por nuevo ingreso
    if ($nuevo_ingreso === 'true') {
        $where_conditions[] = "l.nuevo_ingreso = 1";
    }

    // Agregar condiciones WHERE
    if (!empty($where_conditions)) {
        $sql .= " AND " . implode(' AND ', $where_conditions);
    }

    // Contar total de registros (para paginación)
    $count_sql = "SELECT COUNT(*) as total FROM (" . $sql . ") as count_query";
    $total_result = executeQuerySingle($count_sql, $params);
    $total_records = $total_result['total'] ?? 0;

    // Agregar ordenamiento y paginación
    $sql .= " ORDER BY l.$order_by $order_direction LIMIT $limit OFFSET $offset";

    // Ejecutar consulta
    $books = executeQuery($sql, $params);

    // Obtener estadísticas adicionales
    $stats = getInventoryStats();

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'data' => $books,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $limit,
            'total_records' => $total_records,
            'total_pages' => ceil($total_records / $limit),
            'has_next' => $page < ceil($total_records / $limit),
            'has_prev' => $page > 1
        ],
        'stats' => $stats,
        'filters_applied' => [
            'search' => $search,
            'categoria_id' => $categoria_id,
            'estado' => $estado,
            'stock_bajo' => $stock_bajo,
            'formato' => $formato,
            'destacado' => $destacado,
            'nuevo_ingreso' => $nuevo_ingreso
        ]
    ]);
}

/**
 * Obtener el total de stock de todos los libros
 */
function getTotalStock() {
    try {
        $sql = "SELECT SUM(stock_actual) as total_stock FROM libros WHERE estado != 'descontinuado'";
        $result = executeQuerySingle($sql);
        
        $totalStock = intval($result['total_stock'] ?? 0);
        
        error_log("📊 Total stock calculado: $totalStock");
        
        echo json_encode([
            'success' => true,
            'total_stock' => $totalStock,
            'message' => 'Total de stock obtenido exitosamente'
        ]);
        
    } catch (Exception $e) {
        error_log("❌ Error obteniendo total de stock: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener el total de stock: ' . $e->getMessage()
        ]);
    }
}

/**
 * Obtener estadísticas del inventario
 */
function getInventoryStats() {
    $stats_queries = [
        'total_books' => "SELECT COUNT(*) as count FROM libros WHERE estado != 'descontinuado'",
        'low_stock' => "SELECT COUNT(*) as count FROM libros WHERE stock_actual <= stock_minimo AND estado = 'disponible'",
        'out_of_stock' => "SELECT COUNT(*) as count FROM libros WHERE stock_actual = 0 AND estado = 'disponible'",
        'total_value' => "SELECT SUM(precio_venta * stock_actual) as total FROM libros WHERE estado != 'descontinuado'",
        'categories_count' => "SELECT COUNT(DISTINCT categoria_id) as count FROM libros WHERE estado != 'descontinuado'"
    ];

    $stats = [];
    foreach ($stats_queries as $key => $query) {
        $result = executeQuerySingle($query);
        $stats[$key] = $result['count'] ?? $result['total'] ?? 0;
    }

    return $stats;
}

/**
 * Crear nuevo libro
 */
function handleCreateBook() {
    // Obtener datos del POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validar campos requeridos
    $requiredFields = ['titulo', 'autor', 'categoria_id', 'precio_compra', 'precio_venta', 'stock_actual'];
    $errors = [];
    
    foreach ($requiredFields as $field) {
        if (empty($input[$field]) && $input[$field] !== '0' && $input[$field] !== 0) {
            $errors[] = "El campo '$field' es requerido";
        }
    }
    
    // Validar tipos de datos
    if (!empty($input['categoria_id']) && !is_numeric($input['categoria_id'])) {
        $errors[] = "La categoría debe ser un número válido";
    }
    
    if (!empty($input['precio_compra']) && !is_numeric($input['precio_compra'])) {
        $errors[] = "El precio de compra debe ser un número válido";
    }
    
    if (!empty($input['precio_venta']) && !is_numeric($input['precio_venta'])) {
        $errors[] = "El precio de venta debe ser un número válido";
    }
    
    if (!empty($input['stock_actual']) && !is_numeric($input['stock_actual'])) {
        $errors[] = "El stock actual debe ser un número válido";
    }
    
    if (!empty($input['stock_minimo']) && !is_numeric($input['stock_minimo'])) {
        $errors[] = "El stock mínimo debe ser un número válido";
    }
    
    // Validar año de publicación
    if (!empty($input['año_publicacion'])) {
        $year = intval($input['año_publicacion']);
        if ($year < 1000 || $year > 2030) {
            $errors[] = "El año de publicación debe estar entre 1000 y 2030";
        }
    }
    
    // Validar ISBN único si se proporciona
    if (!empty($input['isbn'])) {
        $existing = executeQuerySingle("SELECT id FROM libros WHERE isbn = ?", [$input['isbn']]);
        if ($existing) {
            $errors[] = "Ya existe un libro con este ISBN";
        }
    }
    
    if (!empty($input['isbn13'])) {
        $existing = executeQuerySingle("SELECT id FROM libros WHERE isbn13 = ?", [$input['isbn13']]);
        if ($existing) {
            $errors[] = "Ya existe un libro con este ISBN-13";
        }
    }
    
    // Verificar que la categoría existe
    if (!empty($input['categoria_id'])) {
        $categoryExists = executeQuerySingle("SELECT id FROM categorias WHERE id = ?", [$input['categoria_id']]);
        if (!$categoryExists) {
            $errors[] = "La categoría seleccionada no existe";
        }
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos inválidos', 'errors' => $errors]);
        return;
    }
    
    try {
        beginTransaction();
        
        // Preparar datos para inserción
        $bookData = [
            'titulo' => trim($input['titulo']),
            'subtitulo' => !empty($input['subtitulo']) ? trim($input['subtitulo']) : null,
            'isbn' => !empty($input['isbn']) ? trim($input['isbn']) : null,
            'isbn13' => !empty($input['isbn13']) ? trim($input['isbn13']) : null,
            'autor' => trim($input['autor']),
            'editorial' => !empty($input['editorial']) ? trim($input['editorial']) : null,
            'año_publicacion' => !empty($input['año_publicacion']) ? intval($input['año_publicacion']) : null,
            'edicion' => !empty($input['edicion']) ? trim($input['edicion']) : null,
            'idioma' => !empty($input['idioma']) ? trim($input['idioma']) : 'Español',
            'paginas' => !empty($input['paginas']) ? intval($input['paginas']) : null,
            'formato' => !empty($input['formato']) ? $input['formato'] : 'tapa_blanda',
            'categoria_id' => intval($input['categoria_id']),
            'proveedor_id' => !empty($input['proveedor_id']) ? intval($input['proveedor_id']) : null,
            'precio_compra' => floatval($input['precio_compra']),
            'precio_venta' => floatval($input['precio_venta']),
            'stock_actual' => intval($input['stock_actual']),
            'stock_minimo' => !empty($input['stock_minimo']) ? intval($input['stock_minimo']) : 5,
            'stock_maximo' => !empty($input['stock_maximo']) ? intval($input['stock_maximo']) : null,
            'ubicacion' => !empty($input['ubicacion']) ? trim($input['ubicacion']) : null,
            'descripcion' => !empty($input['descripcion']) ? trim($input['descripcion']) : null,
            'imagen_portada' => !empty($input['imagen_portada']) ? trim($input['imagen_portada']) : null,
            'codigo_barras' => !empty($input['codigo_barras']) ? trim($input['codigo_barras']) : null,
            'peso' => !empty($input['peso']) ? floatval($input['peso']) : null,
            'dimensiones' => !empty($input['dimensiones']) ? trim($input['dimensiones']) : null,
            'estado' => !empty($input['estado']) ? $input['estado'] : 'disponible',
            'destacado' => !empty($input['destacado']) ? 1 : 0,
            'nuevo_ingreso' => !empty($input['nuevo_ingreso']) ? 1 : 0,
            'descuento' => !empty($input['descuento']) ? floatval($input['descuento']) : 0.00,
            'creado_por' => 1 // TODO: Obtener del usuario autenticado
        ];
        
        // Construir query de inserción
        $fields = array_keys($bookData);
        $placeholders = str_repeat('?,', count($fields) - 1) . '?';
        
        $sql = "INSERT INTO libros (" . implode(', ', $fields) . ") VALUES ($placeholders)";
        $values = array_values($bookData);
        
        $bookId = executeUpdate($sql, $values);
        
        if ($bookId) {
            commitTransaction();
            
            // Obtener el libro creado con toda la información
            $newBook = executeQuerySingle("
                SELECT 
                    l.*,
                    c.nombre as categoria_nombre,
                    c.color as categoria_color
                FROM libros l
                LEFT JOIN categorias c ON l.categoria_id = c.id
                WHERE l.id = ?
            ", [$bookId]);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Libro agregado exitosamente',
                'data' => $newBook,
                'book_id' => $bookId
            ]);
        } else {
            rollbackTransaction();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al insertar el libro en la base de datos']);
        }
        
    } catch (Exception $e) {
        rollbackTransaction();
        error_log("Error creating book: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor: ' . $e->getMessage()]);
    }
}

/**
 * Actualizar libro
 */
function handleUpdateBook() {
    // Obtener ID del libro desde la URL
    $bookId = $_GET['id'] ?? null;
    
    if (!$bookId || !is_numeric($bookId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID del libro es requerido y debe ser numérico']);
        return;
    }
    
    // Verificar que el libro existe
    $existingBook = executeQuerySingle("SELECT id FROM libros WHERE id = ?", [$bookId]);
    if (!$existingBook) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Libro no encontrado']);
        return;
    }
    
    // Obtener datos del PUT
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validar campos requeridos
    $requiredFields = ['titulo', 'autor', 'categoria_id', 'precio_compra', 'precio_venta', 'stock_actual'];
    $errors = [];
    
    foreach ($requiredFields as $field) {
        if (empty($input[$field]) && $input[$field] !== '0' && $input[$field] !== 0) {
            $errors[] = "El campo '$field' es requerido";
        }
    }
    
    // Validar tipos de datos
    if (!empty($input['categoria_id']) && !is_numeric($input['categoria_id'])) {
        $errors[] = 'La categoría debe ser un número válido';
    }
    
    if (!empty($input['precio_compra']) && !is_numeric($input['precio_compra'])) {
        $errors[] = 'El precio de compra debe ser un número válido';
    }
    
    if (!empty($input['precio_venta']) && !is_numeric($input['precio_venta'])) {
        $errors[] = 'El precio de venta debe ser un número válido';
    }
    
    if (!empty($input['stock_actual']) && !is_numeric($input['stock_actual'])) {
        $errors[] = 'El stock actual debe ser un número válido';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Errores de validación', 'errors' => $errors]);
        return;
    }
    
    try {
        beginTransaction();
        
        // Log de datos recibidos
        error_log("📝 UPDATE Book ID: $bookId");
        error_log("📦 Input data: " . json_encode($input));
        
        // Campos actualizables
        $allowedFields = [
            'titulo', 'subtitulo', 'autor', 'editorial', 'isbn', 'isbn13',
            'año_publicacion', 'edicion', 'paginas', 'idioma', 'categoria_id',
            'precio_compra', 'precio_venta', 'stock_actual', 'stock_minimo',
            'ubicacion', 'peso', 'descripcion', 'codigo_barras', 'dimensiones',
            'formato', 'estado'
        ];
        
        $updateFields = [];
        $updateValues = [];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $input)) {
                // Manejar campos que deben ser NULL en lugar de cadena vacía para evitar duplicados
                $value = $input[$field];
                if (($field === 'isbn' || $field === 'isbn13') && trim($value) === '') {
                    $value = null; // Usar NULL en lugar de cadena vacía para campos únicos
                }
                
                $updateFields[] = "$field = ?";
                $updateValues[] = $value;
            }
        }
        
        // Agregar fecha de actualización
        $updateFields[] = 'fecha_actualizacion = NOW()';
        
        // Agregar ID al final para la cláusula WHERE
        $updateValues[] = $bookId;
        
        $sql = "UPDATE libros SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        error_log("🔄 SQL: $sql");
        error_log("📊 Values: " . json_encode($updateValues));
        
        // Log para depurar el problema de ISBN
        $isbnValue = null;
        $isbn13Value = null;
        foreach ($allowedFields as $i => $field) {
            if ($field === 'isbn' && array_key_exists($field, $input)) {
                $isbnValue = $updateValues[array_search($field, array_keys($input))];
            }
            if ($field === 'isbn13' && array_key_exists($field, $input)) {
                $isbn13Value = $updateValues[array_search($field, array_keys($input))];
            }
        }
        error_log("📝 ISBN value: " . var_export($isbnValue, true));
        error_log("📝 ISBN13 value: " . var_export($isbn13Value, true));
        
        $result = executeUpdate($sql, $updateValues);
        
        if ($result !== false) {
            commitTransaction();
            error_log("✅ Libro actualizado exitosamente. Filas afectadas: $result");
            
            // Obtener el libro actualizado con toda la información
            $updatedBook = executeQuerySingle("
                SELECT 
                    l.*,
                    c.nombre as categoria_nombre,
                    c.color as categoria_color
                FROM libros l
                LEFT JOIN categorias c ON l.categoria_id = c.id
                WHERE l.id = ?
            ", [$bookId]);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Libro actualizado exitosamente',
                'data' => $updatedBook,
                'rows_affected' => $result
            ]);
        } else {
            rollbackTransaction();
            error_log("❌ Error: executeUpdate retornó false");
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar el libro en la base de datos']);
        }
        
    } catch (Exception $e) {
        rollbackTransaction();
        error_log("Error updating book: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor: ' . $e->getMessage()]);
    }
}

/**
 * Eliminar libro
 */
function handleDeleteBook() {
    // Obtener ID del libro desde la URL
    $bookId = $_GET['id'] ?? null;
    
    if (!$bookId || !is_numeric($bookId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID del libro es requerido y debe ser numérico']);
        return;
    }
    
    try {
        beginTransaction();
        
        // Verificar que el libro existe
        $existingBook = executeQuerySingle("SELECT id, titulo FROM libros WHERE id = ?", [$bookId]);
        if (!$existingBook) {
            rollbackTransaction();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Libro no encontrado']);
            return;
        }
        
        // Verificar si el libro tiene transacciones asociadas
        $hasTransactions = executeQuerySingle("
            SELECT COUNT(*) as count 
            FROM detalles_venta 
            WHERE libro_id = ?
        ", [$bookId]);
        
        if ($hasTransactions['count'] > 0) {
            // Si tiene transacciones, marcar como descontinuado en lugar de eliminar
            $result = executeUpdate("
                UPDATE libros 
                SET estado = 'descontinuado', 
                    fecha_modificacion = NOW() 
                WHERE id = ?
            ", [$bookId]);
            
            if ($result !== false) {
                commitTransaction();
                echo json_encode([
                    'success' => true, 
                    'message' => 'Libro marcado como descontinuado (tiene ventas asociadas)',
                    'action' => 'discontinued'
                ]);
            } else {
                rollbackTransaction();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al marcar el libro como descontinuado']);
            }
        } else {
            // Si no tiene transacciones, eliminar completamente
            $result = executeUpdate("DELETE FROM libros WHERE id = ?", [$bookId]);
            
            if ($result !== false) {
                commitTransaction();
                echo json_encode([
                    'success' => true, 
                    'message' => 'Libro eliminado exitosamente',
                    'action' => 'deleted'
                ]);
            } else {
                rollbackTransaction();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al eliminar el libro de la base de datos']);
            }
        }
        
    } catch (Exception $e) {
        rollbackTransaction();
        error_log("Error deleting book: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor: ' . $e->getMessage()]);
    }
}

/**
 * Obtener un libro específico por ID
 */
function getSingleBook($bookId) {
    try {
        $book = executeQuerySingle("
            SELECT 
                l.*,
                c.nombre as categoria_nombre,
                c.color as categoria_color
            FROM libros l
            LEFT JOIN categorias c ON l.categoria_id = c.id
            WHERE l.id = ?
        ", [$bookId]);
        
        if ($book) {
            echo json_encode([
                'success' => true,
                'data' => [$book] // Devolver como array para mantener consistencia con la API
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Libro no encontrado']);
        }
        
    } catch (Exception $e) {
        error_log("Error getting single book: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor: ' . $e->getMessage()]);
    }
}