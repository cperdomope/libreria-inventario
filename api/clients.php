<?php
/**
 * LIBRERÍA DIGITAL - API DE CLIENTES
 * Archivo: api/clients.php
 * Descripción: Endpoint para gestión de clientes
 */

// Headers CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir configuración de base de datos y permisos
require_once '../database/config.php';
require_once 'permissions.php';

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Intentar con permisos de ventas, si falla intentar con inventario
            try {
                checkPermission('sales', 'view');
            } catch (Exception $e) {
                try {
                    checkPermission('inventory', 'view');
                } catch (Exception $e2) {
                    // Si no tiene ningún permiso, denegar acceso
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Sin permisos para ver clientes']);
                    return;
                }
            }
            handleGetClients();
            break;
        case 'POST':
            // Solo admin y seller pueden crear clientes
            checkPermission('sales', 'create');
            handleCreateClient();
            break;
        case 'PUT':
            // Solo admin y seller pueden editar clientes
            checkPermission('sales', 'edit');
            handleUpdateClient();
            break;
        case 'DELETE':
            // Solo admin puede eliminar clientes
            checkPermission('sales', 'delete');
            handleDeleteClient();
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
 * Obtener clientes con filtros
 */
function handleGetClients() {
    try {
        error_log("🔍 handleGetClients: Iniciando carga de clientes");
        
        // Obtener parámetros de filtrado
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, min(100, intval($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;
        $search = $_GET['search'] ?? '';
        $tipo_cliente = $_GET['tipo_cliente'] ?? '';
        
        error_log("🔍 handleGetClients: Parámetros - page: $page, limit: $limit, search: '$search'");
        
        // Construir consulta SQL
        $sql = "
            SELECT 
                id,
                tipo_cliente,
                nombre,
                apellidos,
                razon_social,
                documento_tipo,
                documento_numero,
                email,
                telefono,
                celular,
                direccion,
                ciudad,
                departamento,
                codigo_postal,
                fecha_nacimiento,
                genero,
                ocupacion,
                descuento_especial,
                limite_credito,
                saldo_actual,
                estado,
                notas,
                fecha_creacion,
                fecha_actualizacion
            FROM clientes
            WHERE 1=1
        ";
        
        $params = [];
        $where_conditions = [];
        
        // Filtro de búsqueda general
        if (!empty($search)) {
            $where_conditions[] = "(nombre LIKE ? OR apellidos LIKE ? OR razon_social LIKE ? OR email LIKE ? OR documento_numero LIKE ?)";
            $search_param = "%$search%";
            $params = array_merge($params, [$search_param, $search_param, $search_param, $search_param, $search_param]);
        }
        
        // Filtro por tipo de cliente
        if (!empty($tipo_cliente)) {
            $where_conditions[] = "tipo_cliente = ?";
            $params[] = $tipo_cliente;
        }
        
        // Agregar condiciones WHERE
        if (!empty($where_conditions)) {
            $sql .= " AND " . implode(' AND ', $where_conditions);
        }
        
        // Contar total de registros
        $count_sql = "SELECT COUNT(*) as total FROM (" . $sql . ") as count_query";
        $total_result = executeQuerySingle($count_sql, $params);
        $total_records = $total_result['total'] ?? 0;
        
        // Agregar ordenamiento y paginación
        $sql .= " ORDER BY nombre ASC, apellidos ASC LIMIT $limit OFFSET $offset";
        
        // Ejecutar consulta
        error_log("🔍 handleGetClients: Ejecutando consulta SQL");
        $clients = executeQuery($sql, $params);
        error_log("🔍 handleGetClients: Clientes obtenidos: " . count($clients));
        
        // Debug: mostrar los primeros clientes
        if (count($clients) > 0) {
            error_log("🔍 handleGetClients: Primer cliente: " . json_encode($clients[0]));
        }
        
        echo json_encode([
            'success' => true,
            'data' => $clients,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total_records' => $total_records,
                'total_pages' => ceil($total_records / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error en handleGetClients: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener clientes']);
    }
}

/**
 * Crear nuevo cliente
 */
function handleCreateClient() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar datos requeridos
        $requiredFields = ['nombre', 'documento_tipo', 'documento_numero'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty(trim($input[$field]))) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Campo requerido: $field"]);
                return;
            }
        }
        
        // Verificar que no exista un cliente con el mismo documento
        $existing = executeQuerySingle(
            "SELECT id FROM clientes WHERE documento_numero = ? AND documento_tipo = ?", 
            [$input['documento_numero'], $input['documento_tipo']]
        );
        
        if ($existing) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ya existe un cliente con este documento']);
            return;
        }
        
        beginTransaction();
        
        // Obtener usuario actual para creado_por
        session_start();
        $creado_por = $_SESSION['user_id'] ?? 1;

        // Preparar datos para inserción
        $clientData = [
            'tipo_cliente' => $input['tipo_cliente'] ?? 'persona',
            'nombre' => trim($input['nombre']),
            'apellidos' => trim($input['apellidos'] ?? ''),
            'razon_social' => !empty($input['razon_social']) ? trim($input['razon_social']) : null,
            'documento_tipo' => $input['documento_tipo'],
            'documento_numero' => trim($input['documento_numero']),
            'email' => !empty($input['email']) ? trim($input['email']) : null,
            'telefono' => !empty($input['telefono']) ? trim($input['telefono']) : null,
            'celular' => !empty($input['celular']) ? trim($input['celular']) : null,
            'direccion' => !empty($input['direccion']) ? trim($input['direccion']) : null,
            'ciudad' => !empty($input['ciudad']) ? trim($input['ciudad']) : null,
            'departamento' => !empty($input['departamento']) ? trim($input['departamento']) : null,
            'codigo_postal' => !empty($input['codigo_postal']) ? trim($input['codigo_postal']) : null,
            'fecha_nacimiento' => !empty($input['fecha_nacimiento']) ? $input['fecha_nacimiento'] : null,
            'genero' => !empty($input['genero']) ? $input['genero'] : null,
            'ocupacion' => !empty($input['ocupacion']) ? trim($input['ocupacion']) : null,
            'descuento_especial' => isset($input['descuento_especial']) ? floatval($input['descuento_especial']) : 0.00,
            'limite_credito' => isset($input['limite_credito']) ? floatval($input['limite_credito']) : 0.00,
            'saldo_actual' => 0.00,
            'estado' => 'activo',
            'notas' => !empty($input['notas']) ? trim($input['notas']) : null,
            'creado_por' => $creado_por
        ];
        
        // Construir query de inserción
        $fields = array_keys($clientData);
        $placeholders = str_repeat('?,', count($fields) - 1) . '?';
        
        $sql = "INSERT INTO clientes (" . implode(', ', $fields) . ") VALUES ($placeholders)";
        $values = array_values($clientData);
        
        $clientId = executeUpdate($sql, $values);
        
        if ($clientId) {
            commitTransaction();
            
            // Obtener el cliente creado
            $newClient = executeQuerySingle("SELECT * FROM clientes WHERE id = ?", [$clientId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Cliente creado exitosamente',
                'data' => $newClient,
                'client_id' => $clientId
            ]);
        } else {
            rollbackTransaction();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al crear el cliente']);
        }
        
    } catch (Exception $e) {
        rollbackTransaction();
        error_log("Error creando cliente: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al crear cliente: ' . $e->getMessage()]);
    }
}

/**
 * Actualizar cliente
 */
function handleUpdateClient() {
    try {
        $clientId = $_GET['id'] ?? null;
        if (!$clientId || !is_numeric($clientId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de cliente requerido']);
            return;
        }
        
        // Verificar que el cliente existe
        $existingClient = executeQuerySingle("SELECT id FROM clientes WHERE id = ?", [$clientId]);
        if (!$existingClient) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Cliente no encontrado']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        beginTransaction();
        
        // Campos actualizables
        $allowedFields = [
            'tipo_cliente', 'nombre', 'apellidos', 'razon_social', 'documento_tipo', 'documento_numero',
            'email', 'telefono', 'celular', 'direccion', 'ciudad', 'departamento', 'codigo_postal',
            'fecha_nacimiento', 'genero', 'ocupacion', 'descuento_especial', 'limite_credito', 
            'saldo_actual', 'estado', 'notas'
        ];
        
        $updateFields = [];
        $updateValues = [];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $input)) {
                $updateFields[] = "$field = ?";
                $updateValues[] = $input[$field];
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No hay campos para actualizar']);
            return;
        }
        
        // Agregar fecha de modificación y usuario
        session_start();
        $actualizado_por = $_SESSION['user_id'] ?? 1;
        $updateFields[] = 'fecha_actualizacion = NOW()';
        $updateFields[] = 'actualizado_por = ?';
        $updateValues[] = $actualizado_por;
        
        // Agregar ID al final para la cláusula WHERE
        $updateValues[] = $clientId;
        
        $sql = "UPDATE clientes SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $result = executeUpdate($sql, $updateValues);
        
        if ($result !== false) {
            commitTransaction();
            
            // Obtener el cliente actualizado
            $updatedClient = executeQuerySingle("SELECT * FROM clientes WHERE id = ?", [$clientId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Cliente actualizado exitosamente',
                'data' => $updatedClient
            ]);
        } else {
            rollbackTransaction();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar el cliente']);
        }
        
    } catch (Exception $e) {
        rollbackTransaction();
        error_log("Error actualizando cliente: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al actualizar cliente']);
    }
}

/**
 * Eliminar cliente
 */
function handleDeleteClient() {
    try {
        $clientId = $_GET['id'] ?? null;
        if (!$clientId || !is_numeric($clientId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de cliente requerido']);
            return;
        }
        
        beginTransaction();
        
        // Verificar que el cliente existe
        $existingClient = executeQuerySingle("SELECT id, nombre, apellidos FROM clientes WHERE id = ?", [$clientId]);
        if (!$existingClient) {
            rollbackTransaction();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Cliente no encontrado']);
            return;
        }
        
        // Verificar si el cliente tiene ventas asociadas
        $hasSales = executeQuerySingle("SELECT COUNT(*) as count FROM ventas WHERE cliente_id = ?", [$clientId]);
        
        if ($hasSales['count'] > 0) {
            // Si tiene ventas, marcar como inactivo en lugar de eliminar
            $result = executeUpdate(
                "UPDATE clientes SET estado = 'inactivo', fecha_modificacion = NOW() WHERE id = ?", 
                [$clientId]
            );
            
            if ($result !== false) {
                commitTransaction();
                echo json_encode([
                    'success' => true,
                    'message' => 'Cliente marcado como inactivo (tiene ventas asociadas)',
                    'action' => 'deactivated'
                ]);
            } else {
                rollbackTransaction();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al desactivar el cliente']);
            }
        } else {
            // Si no tiene ventas, eliminar completamente
            $result = executeUpdate("DELETE FROM clientes WHERE id = ?", [$clientId]);
            
            if ($result !== false) {
                commitTransaction();
                echo json_encode([
                    'success' => true,
                    'message' => 'Cliente eliminado exitosamente',
                    'action' => 'deleted'
                ]);
            } else {
                rollbackTransaction();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al eliminar el cliente']);
            }
        }
        
    } catch (Exception $e) {
        rollbackTransaction();
        error_log("Error eliminando cliente: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
    }
}

?>