# 📋 Guía de Migración a Hosting Remoto

Esta guía te ayudará a migrar tu proyecto de Sistema de Inventario para Librería desde MySQL local a un servidor de hosting remoto.

## 📋 Requisitos Previos

- Acceso a un hosting con soporte para PHP 7.4+ y MySQL 5.7+
- Panel de control del hosting (cPanel, Plesk, etc.)
- Cliente FTP o acceso a File Manager
- Backup de tu base de datos local

## 🗂️ Paso 1: Preparar los Archivos

### 1.1 Crear Backup de la Base de Datos Local

```bash
# Desde línea de comandos MySQL:
mysqldump -u root -p libreria_inventario > backup_libreria_$(date +%Y%m%d).sql

# O usa MySQL Workbench / phpMyAdmin para exportar
```

### 1.2 Preparar Archivos del Proyecto

Asegúrate de tener todos estos archivos listos para subir:

```
libreria-inventario/
├── index.html
├── login.html
├── assets/
├── api/
├── database/
│   ├── config.php (necesitará modificación)
│   └── setup_local_mysql.sql (para referencia)
└── logs/ (crear en el servidor)
```

## 🔧 Paso 2: Configurar la Base de Datos en el Hosting

### 2.1 Crear Base de Datos

En tu panel de control del hosting:

1. **Acceder a MySQL Databases** (cPanel) o equivalente
2. **Crear nueva base de datos:**
   - Nombre: `tu_usuario_libreria` (o similar)
   - Charset: `utf8mb4`
   - Collation: `utf8mb4_unicode_ci`

3. **Crear usuario de base de datos:**
   - Usuario: `tu_usuario_db`
   - Contraseña: `contraseña_segura`
   - Permisos: TODOS los permisos sobre la base de datos

### 2.2 Importar Estructura y Datos

**Opción A: Using phpMyAdmin (Recomendado)**
1. Acceder a phpMyAdmin desde el panel del hosting
2. Seleccionar la base de datos creada
3. Ir a **"Importar"**
4. Subir el archivo `setup_local_mysql.sql` o tu backup
5. Ejecutar

**Opción B: Línea de comandos (si está disponible)**
```bash
mysql -h host_de_tu_servidor -u tu_usuario_db -p tu_base_de_datos < backup_libreria.sql
```

## 🌐 Paso 3: Actualizar Configuración

### 3.1 Modificar `database/config.php`

Actualiza las credenciales de conexión:

```php
<?php
// ================================================================
// CONFIGURACIÓN PARA HOSTING REMOTO
// ================================================================

// Configuración del hosting (actualizar con tus datos reales)
define('DB_HOST', 'tu_host_mysql');        // ej: 'localhost' o 'mysql.tuhosting.com'
define('DB_PORT', '3306');                 // Puerto MySQL del hosting
define('DB_NAME', 'tu_usuario_libreria');  // Nombre de tu base de datos
define('DB_USER', 'tu_usuario_db');        // Usuario de la base de datos
define('DB_PASS', 'tu_contraseña_db');     // Contraseña del usuario
define('DB_CHARSET', 'utf8mb4');

// Resto del archivo permanece igual...
?>
```

### 3.2 Configuraciones Específicas del Hosting

#### Para hosting compartido:
```php
// Añadir después de las definiciones de DB_*
define('DB_SSL', false);                    // SSL normalmente no es necesario
define('DB_PERSISTENT', false);             // Evitar conexiones persistentes
```

#### Para servidores dedicados/VPS:
```php
define('DB_SSL', true);                     // Habilitar SSL si está disponible
define('DB_PERSISTENT', true);              // Conexiones persistentes OK
```

## 📁 Paso 4: Subir Archivos al Servidor

### 4.1 Estructura de Directorios en el Hosting

```
public_html/                    (o www/, htdocs/)
├── index.html                 # Página principal
├── login.html                 # Página de login
├── assets/                    # CSS, JS, imágenes
├── api/                       # Endpoints PHP
├── database/                  # Configuración DB
└── logs/                      # Crear manualmente con permisos 755
```

### 4.2 Subir Archivos

**Via FTP:**
```bash
# Usar cliente FTP como FileZilla
# Host: ftp.tudominio.com
# Usuario: tu_usuario_ftp
# Contraseña: tu_contraseña_ftp
```

**Via File Manager del hosting:**
1. Acceder al File Manager desde cPanel
2. Navegar a `public_html/`
3. Subir archivos y carpetas
4. Extraer si subiste un ZIP

### 4.3 Configurar Permisos

```bash
# Permisos recomendados:
chmod 644 *.html *.php        # Archivos
chmod 644 assets/css/*        # CSS
chmod 644 assets/js/*         # JavaScript
chmod 755 database/           # Directorio database
chmod 755 api/                # Directorio API
chmod 755 logs/               # Directorio logs (crear si no existe)
chmod 644 database/config.php # Configuración
```

## 🧪 Paso 5: Probar la Instalación

### 5.1 Verificar Conexión a Base de Datos

Navega a: `https://tudominio.com/database/test_local_connection.php`

Deberías ver:
- ✓ Conexión establecida exitosamente
- ✓ Listado de tablas creadas
- ✓ Conteo de registros

### 5.2 Probar API Endpoints

```bash
# Test de conexión API
curl https://tudominio.com/api/test_connection.php

# Test de autenticación
curl -X POST https://tudominio.com/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@libreria.com","password":"admin123"}'
```

### 5.3 Verificar Frontend

1. Navega a `https://tudominio.com/`
2. Verifica que la página carga sin errores
3. Prueba el login con credenciales por defecto
4. Verifica funcionalidades básicas

## 🔐 Paso 6: Configuraciones de Seguridad

### 6.1 Cambiar Credenciales por Defecto

```sql
-- Actualizar contraseñas de usuarios de prueba
UPDATE usuarios SET 
    password = '$2y$10$TU_NUEVO_HASH_AQUI' 
WHERE email = 'admin@libreria.com';
```

### 6.2 Configurar HTTPS

En `database/config.php`, añade:

```php
// Forzar HTTPS en producción
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    define('SITE_URL', 'https://' . $_SERVER['HTTP_HOST']);
} else {
    define('SITE_URL', 'https://' . $_SERVER['HTTP_HOST']); // Forzar HTTPS
}
```

### 6.3 Ocultar Archivos de Configuración

Crear `.htaccess` en la raíz:

```apache
# Proteger archivos sensibles
<Files "*.sql">
    Order Deny,Allow
    Deny from all
</Files>

<Files "config.php">
    Order Deny,Allow
    Deny from all
</Files>

# Habilitar compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Habilitar caché de navegador
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/ico "access plus 1 year"
</IfModule>
```

## 📊 Paso 7: Monitoreo y Mantenimiento

### 7.1 Configurar Logs

Crear directorio de logs con permisos apropiados:

```bash
mkdir logs
chmod 755 logs
```

### 7.2 Backup Automático

Configurar cron job para backup diario (si está disponible):

```bash
# Crontab para backup diario a las 2 AM
0 2 * * * mysqldump -h host_mysql -u usuario -p'contraseña' base_datos > /path/to/backup/libreria_$(date +\%Y\%m\%d).sql
```

### 7.3 Monitoreo de Rendimiento

Verificar regularmente:
- Tiempo de respuesta de la aplicación
- Uso de base de datos
- Logs de errores PHP
- Espacio en disco

## 🐛 Solución de Problemas Comunes

### Error: "Can't connect to MySQL server"
```php
// Verificar en config.php:
// 1. Host correcto (puede ser diferente a 'localhost')
// 2. Puerto correcto (puede ser diferente a 3306)
// 3. Credenciales correctas
```

### Error: "Access denied for user"
```sql
-- Verificar permisos de usuario:
SHOW GRANTS FOR 'tu_usuario'@'%';

-- Otorgar permisos necesarios:
GRANT ALL PRIVILEGES ON tu_base_datos.* TO 'tu_usuario'@'%';
FLUSH PRIVILEGES;
```

### Error: "Table doesn't exist"
```sql
-- Verificar que se importaron todas las tablas:
SHOW TABLES;

-- Re-importar si es necesario:
SOURCE backup_libreria.sql;
```

### Error 500 - Internal Server Error
```bash
# Verificar logs de error del servidor:
tail -f /var/log/apache2/error.log
# o
tail -f logs/database_*.log
```

## 📞 Soporte

### Información para el Hosting Provider

Si necesitas contactar soporte técnico, ten lista esta información:

- **Versión PHP necesaria:** 7.4 o superior
- **Extensiones PHP requeridas:** PDO, pdo_mysql, json, openssl
- **Versión MySQL mínima:** 5.7
- **Permisos especiales:** Creación de tablas, triggers, vistas

### Verificaciones de Compatibilidad

Antes de contratar hosting, verifica:
- ✅ PHP 7.4+
- ✅ MySQL 5.7+ o MariaDB 10.2+
- ✅ Soporte para PDO MySQL
- ✅ Al menos 100MB espacio en disco
- ✅ Backup automático disponible
- ✅ SSL/HTTPS incluido

---

¡Tu proyecto estará listo para funcionar en producción siguiendo esta guía!

**Última actualización:** Agosto 2025  
**Versión de la guía:** 1.0