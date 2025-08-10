# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Library Inventory Management System** ("Librería Digital") - a web-based application for managing book inventory, sales, and customers. The system is built with PHP backend, MySQL database, and vanilla JavaScript frontend.

## Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Tailwind CSS, FontAwesome
- **Backend**: PHP 7.4+ with PDO for database connections
- **Database**: MySQL 5.7+ with utf8mb4 charset
- **Development Environment**: Designed for local development with MySQL Server or Laragon

### Directory Structure
```
libreria-inventario/
├── index.html              # Main dashboard page
├── login.html              # Authentication page
├── MIGRATION_GUIDE.md      # Detailed hosting migration guide
├── api/                    # PHP backend endpoints
│   ├── auth.php           # Authentication API
│   └── users_fix.php      # User management utilities
├── assets/                 # Frontend assets
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   │   ├── auth/          # Authentication logic
│   │   ├── components/    # UI components
│   │   ├── modules/       # App modules
│   │   └── utils/         # Utility functions
│   └── images/            # Static images
├── database/              # Database configuration and setup
│   ├── config.php         # Database connection & utilities
│   ├── setup_local_mysql.sql # Full database schema
│   ├── sample_data.sql    # Test data
│   └── install.php        # Database installer
└── logs/                  # Application logs (auto-generated)
```

## Database Setup

### Initial Setup Commands
```bash
# Create database and run setup script
mysql -u root -p < database/setup_local_mysql.sql

# Or use the web installer
# Navigate to: database/install.php
```

### Database Configuration
- Database name: `libreria_inventario`
- Default credentials in `database/config.php`:
  - Host: `localhost:3306`
  - User: `root` 
  - Password: `root`
- Timezone: Colombia UTC-5

### Core Tables
- `usuarios` - User management with role-based access
- `libros` - Book inventory
- `categorias` - Book categories
- `proveedores` - Suppliers
- `clientes` - Customers
- `ventas/detalles_venta` - Sales transactions
- `sesiones` - User sessions
- `auditoria` - Activity logs

## Development Commands

### Database Operations
```bash
# Reset database with fresh schema
mysql -u root -p libreria_inventario < database/setup_local_mysql.sql

# Load sample data
mysql -u root -p libreria_inventario < database/sample_data.sql

# View database logs
php view_logs.php
```

### Testing
- **Default Login**: `admin@libreria.com` / `admin123`
- **Test Database Connection**: Navigate to `database/test_local_connection.php`
- **API Testing**: Use endpoints in `/api/` directory

### Local Development Server
```bash
# If using PHP built-in server
php -S localhost:8000

# Or configure with Apache/Nginx pointing to project root
```

## Key Application Features

### Authentication System
- Role-based access control (admin, seller, inventory, readonly)
- Session management with database storage
- Password validation (supports both plain text and hashed passwords for development)

### Frontend Architecture
- **Modular JavaScript**: Organized into auth, components, modules, utils
- **State Management**: Global AppState object with user preferences
- **UI Components**: Toast notifications, modal dialogs, form validation, table management
- **Responsive Design**: Tailwind CSS with mobile-first approach

### Backend API Structure
- RESTful endpoints in `/api/` directory
- Consistent JSON responses with error handling
- Database utilities in `database/config.php` for common operations
- PDO-based database layer with prepared statements

## Configuration Files

### Database Configuration (`database/config.php`)
- Singleton pattern for database connections
- Utility functions: `executeQuery()`, `executeUpdate()`, `executeQuerySingle()`
- Transaction support: `beginTransaction()`, `commitTransaction()`, `rollbackTransaction()`
- Automatic logging configuration

### Environment Detection
- Automatically detects development vs production environments
- Development mode: Error display enabled, debug logging
- Production mode: Error logging only, secure configuration

## Security Considerations
- SQL injection prevention via prepared statements
- Session token-based authentication
- Input sanitization and validation
- CORS headers configured for API endpoints
- Password hashing support (bcrypt)

## Migration to Production
- See `MIGRATION_GUIDE.md` for detailed hosting deployment instructions
- Update database credentials in `database/config.php`
- Configure SSL/HTTPS settings
- Set up automated backups
- Review security configurations

## Common Tasks

### Adding New Features
1. Database changes: Update `database/setup_local_mysql.sql`
2. Backend: Add new endpoints in `/api/` directory
3. Frontend: Add components in appropriate `/assets/js/` subdirectory
4. Test with default credentials

### Debugging Database Issues
1. Check logs in `/logs/` directory (auto-generated daily)
2. Use `checkDatabaseConnection()` utility function
3. Verify credentials in `database/config.php`
4. Test connection via `database/test_local_connection.php`

### User Management
- Default admin user: `admin@libreria.com`
- Use `/api/users_fix.php` for user maintenance tasks
- Roles: admin (full access), seller (sales), inventory (stock), readonly (view only)