# Base de Datos - Librería Digital

## 📋 Descripción
Sistema completo de base de datos para el Sistema de Inventario de Librería Digital, diseñado para funcionar con XAMPP y MySQL.

## 🗂️ Estructura de Archivos

```
database/
├── README.md                 # Documentación de la base de datos
├── libreria_inventario.sql   # Estructura completa de la base de datos
├── sample_data.sql          # Datos de muestra para testing
├── config.php               # Configuración de conexión PDO
└── install.php              # Instalador web interactivo
```

## 📊 Estructura de la Base de Datos

### Tablas Principales

| Tabla | Descripción | Registros Clave |
|-------|-------------|-----------------|
| **usuarios** | Gestión de usuarios del sistema | Login, roles, permisos |
| **libros** | Inventario principal de libros | ISBN, stock, precios |
| **categorias** | Clasificación de libros | Ficción, ciencia, historia, etc. |
| **proveedores** | Gestión de proveedores | Contactos, términos de pago |
| **clientes** | Base de clientes | Personas y empresas |
| **ventas** | Registro de ventas/facturas | Transacciones completadas |
| **detalles_venta** | Items de cada venta | Cantidades, precios |
| **movimientos_stock** | Historial de inventario | Entradas, salidas, ajustes |
| **compras** | Órdenes de compra | Pedidos a proveedores |
| **detalles_compra** | Items de cada compra | Cantidades ordenadas/recibidas |
| **pagos** | Registro de pagos | Efectivo, tarjetas, transferencias |
| **configuracion** | Configuración del sistema | Parámetros globales |
| **auditoria** | Log de actividades | Seguimiento de acciones |

### Relaciones Principales

```
usuarios (1) ←→ (N) ventas
usuarios (1) ←→ (N) compras
usuarios (1) ←→ (N) movimientos_stock

libros (1) ←→ (N) detalles_venta
libros (1) ←→ (N) detalles_compra
libros (1) ←→ (N) movimientos_stock

categorias (1) ←→ (N) libros
proveedores (1) ←→ (N) libros
proveedores (1) ←→ (N) compras

clientes (1) ←→ (N) ventas

ventas (1) ←→ (N) detalles_venta
compras (1) ←→ (N) detalles_compra
```

## 🚀 Instalación

### Opción 1: Instalador Web (Recomendado)

1. **Verificar XAMPP:**
   - Asegúrese de que XAMPP esté ejecutándose
   - MySQL debe estar activo en el panel de control

2. **Acceder al Instalador:**
   ```
   http://localhost/libreria-inventario/database/install.php
   ```

3. **Seguir el Asistente:**
   - Probar conexión a la base de datos
   - Seleccionar opciones de instalación
   - Ejecutar instalación

### Opción 2: Instalación Manual

1. **Abrir phpMyAdmin:**
   ```
   http://localhost/phpmyadmin
   ```

2. **Crear Base de Datos:**
   ```sql
   CREATE DATABASE libreria_inventario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Importar Estructura:**
   - Seleccionar la base de datos creada
   - Ir a "Importar"
   - Seleccionar archivo `libreria_inventario.sql`
   - Ejecutar

4. **Importar Datos de Muestra:**
   - Importar archivo `sample_data.sql`

## 🔧 Configuración

### Archivo config.php

```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'libreria_inventario');
define('DB_USER', 'root');
define('DB_PASS', ''); // XAMPP por defecto
define('DB_CHARSET', 'utf8mb4');
```

### Credenciales de Prueba

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| **Admin** | admin@libreria.com | admin123 | Todos los permisos |
| **Vendedor** | vendedor@libreria.com | vendedor123 | Ventas e inventario (consulta) |
| **Inventario** | inventario@libreria.com | inventario123 | Gestión de stock |
| **Solo Lectura** | consulta@libreria.com | consulta123 | Solo consulta |

## 📈 Características Avanzadas

### Triggers Automáticos
- **Control de Stock:** Actualización automática al vender/comprar
- **Movimientos:** Registro automático de cambios en inventario
- **Auditoría:** Log automático de acciones importantes

### Vistas Predefinidas
- `vista_stock_bajo`: Libros con stock por debajo del mínimo
- `vista_ventas_mensuales`: Resumen de ventas por mes
- `vista_libros_mas_vendidos`: Ranking de libros más vendidos

### Índices de Rendimiento
- Búsqueda fulltext en libros (título, autor, descripción)
- Índices compuestos para reportes
- Índices optimizados para consultas frecuentes

## 🔒 Seguridad

### Contraseñas
- Hash con `password_hash()` de PHP
- Algoritmo PASSWORD_DEFAULT (bcrypt)
- Salt automático incluido

### Sesiones
- Control de tokens únicos
- Seguimiento de IP y User-Agent
- Expiración automática

### Auditoría
- Log completo de acciones
- Seguimiento de cambios en datos críticos
- IP y timestamp de cada acción

## 📊 Datos de Muestra Incluidos

- **21 Libros** en diferentes categorías
- **5 Usuarios** con diferentes roles
- **10 Categorías** organizadas
- **5 Proveedores** de ejemplo
- **8 Clientes** (personas y empresas)
- **5 Ventas** completadas
- **3 Compras** en diferentes estados
- **Configuración** inicial del sistema

## 🛠️ Mantenimiento

### Backups Recomendados
```bash
# Backup completo
mysqldump -u root libreria_inventario > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup solo estructura
mysqldump -u root --no-data libreria_inventario > estructura.sql

# Backup solo datos
mysqldump -u root --no-create-info libreria_inventario > datos.sql
```

### Limpieza Periódica
- Sesiones expiradas (automático con cron)
- Logs de auditoría antiguos (configurable)
- Movimientos de stock históricos (según política)

## 🔍 Consultas Útiles

### Stock Bajo
```sql
SELECT * FROM vista_stock_bajo;
```

### Ventas del Día
```sql
SELECT * FROM ventas WHERE DATE(fecha_venta) = CURDATE();
```

### Top 10 Libros Vendidos
```sql
SELECT * FROM vista_libros_mas_vendidos LIMIT 10;
```

### Actividad de Usuario
```sql
SELECT * FROM auditoria WHERE usuario_id = ? ORDER BY fecha_accion DESC LIMIT 20;
```

## 📞 Soporte

### Problemas Comunes

1. **Error de Conexión:**
   - Verificar que MySQL esté ejecutándose
   - Verificar credenciales en `config.php`
   - Verificar puerto (3306 por defecto)

2. **Error de Permisos:**
   - El usuario debe tener permisos CREATE, ALTER, INSERT, SELECT, UPDATE, DELETE
   - Para root en XAMPP local, todos los permisos están disponibles

3. **Error de Charset:**
   - Asegurar UTF-8 en toda la cadena
   - Verificar configuración de MySQL

4. **Tablas No Creadas:**
   - Verificar sintaxis SQL
   - Revisar logs de MySQL
   - Usar instalador web para diagnóstico

### Información Técnica
- **Motor:** InnoDB (transacciones ACID)
- **Charset:** UTF-8 (utf8mb4)
- **Collation:** utf8mb4_unicode_ci
- **Versión MySQL:** 5.7+ recomendada
- **Versión PHP:** 7.4+ requerida

---

**Librería Digital v1.0** - Sistema de Inventario
Desarrollado para XAMPP/MySQL - Agosto 2025