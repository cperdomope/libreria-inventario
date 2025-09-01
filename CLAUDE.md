# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Library Inventory Management System** ("Librería Digital") - a complete web-based application for managing book inventory, sales, and customers. The system is built with PHP backend, MySQL database, and vanilla JavaScript frontend with a modern, responsive interface.

## Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Tailwind CSS (CDN), FontAwesome (CDN)
- **Backend**: PHP 7.4+ with PDO for database connections
- **Database**: MySQL 5.7+ with utf8mb4 charset
- **Development Environment**: Designed for local development with MySQL Server or Laragon

### Application State Management
The frontend uses a modular architecture with centralized state management:
- `AppState` object in `main.js` manages global application state
- Individual modules like `InventoryManager` maintain their own state objects
- Real-time UI updates without page refreshes using DOM manipulation
- Event-driven communication between modules via global `window` objects
- Initialization order: `main.js` → `app-init.js` → `inventory-manager.js`

### Directory Structure
```
libreria-inventario/
├── index.html              # Main dashboard page
├── login.html              # Authentication page
├── CLAUDE.md               # Project documentation (this file)
├── MIGRATION_GUIDE.md      # Detailed hosting migration guide
├── api/                    # PHP backend endpoints
│   ├── auth.php           # Authentication API with permissions
│   ├── books.php          # Books management API (CRUD)
│   ├── categories.php     # Categories management API
│   ├── clients.php        # Client management API
│   ├── dashboard.php      # Dashboard statistics API
│   ├── permissions.php    # Role-based permission system
│   └── sales.php          # Sales management API
├── assets/                 # Frontend assets
│   ├── css/               # Stylesheets
│   │   ├── animations.css # UI animations and transitions
│   │   ├── components.css # Reusable UI components
│   │   ├── inventory.css  # Inventory-specific styles
│   │   ├── login.css      # Authentication page styles
│   │   ├── responsive.css # Mobile and tablet responsive rules
│   │   ├── styles.css     # Main application styles
│   │   └── text-fix.css   # Text visibility and input fixes
│   ├── images/            # Static images and icons
│   │   ├── icons/         # Icon files
│   │   └── logo.png       # Application logo
│   └── js/                # JavaScript modules
│       ├── auth/          # Authentication logic
│       │   ├── login.js   # Login page functionality
│       │   └── permission-manager.js # Frontend permission management
│       ├── components/    # UI components
│       │   └── dashboard.js # Dashboard components
│       ├── modules/       # App modules
│       │   ├── app-init.js # Application initialization
│       │   ├── inventory-manager.js # Complete inventory management (main file)
│       │   ├── navigation.js # Navigation and routing with permissions
│       │   ├── sales-manager.js # Complete sales management system
│       │   └── section-observer.js # Section visibility management
│       ├── inventory-init.js # Inventory system initialization
│       └── main.js        # Main application entry point
├── database/              # Database configuration and setup
│   ├── config.php         # Database connection & utilities
│   ├── install.php        # Web-based database installer
│   ├── setup_local_mysql.sql # Complete database schema with sample data
│   └── add_sample_clients.sql # Additional sample client data
├── fix-admin-password.php # Utility script for password reset
├── fix-dashboard.js      # Dashboard troubleshooting script
├── api_books_simple.php  # Simplified books API (no auth)
├── api_dashboard_simple.php # Simplified dashboard API
├── api_sales_simple.php  # Simplified sales API
└── logs/                  # Application logs (auto-generated)
    └── database_*.log     # Daily database logs
```

## Database Setup

### Initial Setup Commands
```bash
# Create database and run setup script
mysql -u root -p < database/setup_local_mysql.sql

# Or use the web installer (recommended for beginners)
# Navigate to: database/install.php
```

### Database Configuration
- Database name: `libreria_inventario`
- Credentials in `database/config.php`:
  - Host: `localhost:3306`
  - User: `root` 
  - Password: Auto-detected (supports: 'root', '', 'password', '123456')
- Timezone: Colombia UTC-5
- Character set: utf8mb4_unicode_ci

### Core Tables
- `usuarios` - User management with role-based access control
- `libros` - Complete book inventory with all metadata
- `categorias` - Book categories with colors and display order
- `proveedores` - Suppliers information
- `clientes` - Customer database
- `ventas/detalles_venta` - Sales transactions and line items
- `sesiones` - User sessions management
- `auditoria` - Activity logs and audit trail

## Development Commands

### Database Operations
```bash
# Reset database with fresh schema
mysql -u root -p libreria_inventario < database/setup_local_mysql.sql

# Schema includes sample data for testing

# Backup current database
mysqldump -u root -p libreria_inventario > backup_$(date +%Y%m%d).sql
```

### Code Validation & Testing
```bash
# PHP syntax validation
find . -name "*.php" -exec php -l {} \; | grep -v "No syntax errors"

# Test database connection
php -r "require 'database/config.php'; try { $result = checkDatabaseConnection(); echo $result ? 'Connection OK' : 'Connection failed'; } catch(Exception $e) { echo 'Connection failed: ' . $e->getMessage(); }"

# API endpoint testing (requires server running)
curl -X GET http://localhost:8000/api/books.php
curl -X POST http://localhost:8000/api/auth.php -H "Content-Type: application/json" -d '{"email":"admin@libreria.com","password":"admin123"}'

# Check PHP error logs (Windows)
type logs\database_%date:~-4,4%-%date:~-10,2%-%date:~-7,2%.log

# Check PHP error logs (Linux/Mac)
tail -f logs/database_$(date +%Y-%m-%d).log
```

### Testing
- **Default Login**: `admin@libreria.com` / `admin123`
- **Web Database Installer**: Navigate to `database/install.php`
- **API Endpoints**: All APIs in `/api/` directory support GET, POST, PUT, DELETE

### Local Development Server
```bash
# Using PHP built-in server
php -S localhost:8000

# Using Laragon (Windows)
# Place project in laragon/www/ and access via http://libreria-inventario.test

# Using XAMPP/WAMP
# Place project in htdocs/ and access via http://localhost/libreria-inventario
```

### Utility Scripts
```bash
# Reset admin password
php fix-admin-password.php

# Debug dashboard issues
node fix-dashboard.js

# Use simplified APIs for testing (no auth required)
curl http://localhost:8000/api_books_simple.php?search=principito
curl http://localhost:8000/api_dashboard_simple.php
curl http://localhost:8000/api_sales_simple.php
```

## Key Application Features

### Complete Inventory Management System
- **📚 Book Management**: Full CRUD operations (Create, Read, Update, Delete)
- **🔍 Advanced Search & Filtering**: Search by title, author, ISBN with category filters
- **📊 Pagination**: 5 books per page with intuitive navigation controls
- **📋 Book Details Modal**: Complete book information display
- **✏️ Inline Editing**: Edit books directly from the inventory table
- **🗑️ Smart Deletion**: Books with sales are marked as discontinued, others are permanently deleted
- **📈 Real-time Statistics**: Inventory counts, low stock alerts, total value calculations

### Sales Management System
- **🛒 Complete Sales Module**: Create, track, and manage sales transactions
- **👥 Client Management**: Customer database with contact information
- **📦 Stock Integration**: Automatic stock updates when sales are processed
- **📋 Sales History**: Comprehensive transaction logs with filtering
- **💰 Sales Analytics**: Revenue tracking and sales performance metrics
- **🔄 Transaction Management**: Edit, cancel, and refund capabilities
- **📱 Responsive Sales Interface**: Mobile-friendly sales processing

### Stock Control System (Control de Stock)
Based on current database data, the system manages:

#### **Stock Statistics**
- **Total Books in Inventory**: 5 active titles
- **Stock Distribution**:
  - El Principito: 28 units (Stock óptimo)
  - El Alquimista: 20 units (Stock óptimo)  
  - Cien años de soledad: 15 units (Stock óptimo)
  - El amor en los tiempos del cólera: 12 units (Stock medio)
  - Don Quijote de la Mancha: 12 units (Stock crítico - close to minimum)
- **Total Inventory Value**: $1,656,000 COP
- **Average Stock per Title**: 17.4 units

#### **Stock Alerts & Monitoring**
- **Critical Stock Alert**: Don Quijote (12 units, minimum: 3) - Still above minimum but trending low
- **Stock Below Minimum**: Currently 0 books (all titles above their minimum thresholds)
- **Optimal Stock Levels**: 4 out of 5 titles (80%) maintain healthy stock levels
- **Minimum Stock Thresholds**: Range from 3-10 units depending on book category

#### **Category Distribution**
- **Ficción** (2 books): García Márquez titles with 27 total units
- **Autoayuda** (1 book): El Alquimista with 20 units  
- **Infantil y Juvenil** (1 book): El Principito with 28 units (highest stock)
- **Clásicos** (1 book): Don Quijote with 12 units
- **Price Range**: $25,000 - $65,000 COP per unit

#### **Warehouse Locations**
- **Section A1**: García Márquez collection (Ficción)
- **Section B1**: Cervantes classics
- **Section C1**: Self-help/Autoayuda
- **Section F1**: Children's literature
- **Location System**: Alphanumeric format (Section-Shelf-Position)

### Advanced UI/UX Features
- **🎨 Modern Interface**: Clean, professional design with Tailwind CSS
- **📱 Fully Responsive**: Works on desktop, tablet, and mobile devices
- **🌟 Interactive Elements**: Hover effects, transitions, loading states
- **🔔 Toast Notifications**: Success/error feedback for all operations
- **⌨️ Keyboard Navigation**: Arrow key navigation and shortcuts
- **🎯 Visual Feedback**: Loading spinners, disabled states, progress indicators

### Authentication & Security System
- **🔐 Role-based Access Control**: Admin, seller, inventory, readonly roles
- **🛡️ Session Management**: Database-stored sessions with timeout
- **🔒 Password Security**: BCrypt hashing support
- **🚫 SQL Injection Protection**: PDO prepared statements throughout
- **📊 Activity Logging**: Comprehensive audit trail

### Frontend Architecture
- **⚡ Modular JavaScript**: Clean separation of concerns with module objects
- **🎛️ State Management**: `InventoryManager.state` object manages inventory state
- **🧩 Component System**: Reusable UI components with event-driven updates
- **📡 API Integration**: Fetch-based RESTful API consumption with error handling
- **🔄 Real-time Updates**: Dynamic DOM updates via `renderBooks()` and `renderPagination()`
- **🎯 Event Handling**: Centralized event listeners in `setupEventListeners()`

### Backend API Structure
- **📡 RESTful Design**: Standard HTTP methods and response codes
- **📄 JSON Responses**: Consistent API response format
- **🔍 Advanced Filtering**: Multiple filter combinations
- **📊 Pagination Support**: Configurable page sizes
- **⚡ Optimized Queries**: Efficient database operations
- **🛠️ Transaction Support**: ACID compliance for data integrity

## API Endpoints

### Books API (`/api/books.php`)
- `GET` - List books with pagination and filtering (requires 'inventory:view' permission)
- `GET ?id={id}` - Get single book details (requires 'inventory:view' permission)
- `POST` - Create new book (requires 'inventory:create' permission)
- `PUT ?id={id}` - Update existing book (requires 'inventory:edit' permission)
- `DELETE ?id={id}` - Delete book with smart deletion (requires 'inventory:delete' permission)

### Categories API (`/api/categories.php`)
- `GET` - List all categories with book counts and statistics
- No authentication required (public endpoint)

### Sales API (`/api/sales.php`)
- `GET` - List sales with filtering and pagination (requires 'sales:view' permission)
- `POST` - Create new sale with stock management (requires 'sales:create' permission)
- `PUT ?id={id}` - Update sale status and notes (requires 'sales:edit' permission)
- `DELETE ?id={id}` - Delete sale and restore stock (requires 'sales:delete' permission)

### Permissions API (`/api/permissions.php`)
- Core permission system with role-based access control
- Session management with 30-minute timeout
- Permission validation middleware for all protected endpoints

### Authentication API (`/api/auth.php`)
- `POST` - User login with role-based session creation
- `GET` - Get current user info and permissions
- `DELETE` - User logout and session cleanup
- Integrated with permission system for role management

### Dashboard API (`/api/dashboard.php`)
- `GET` - Dashboard statistics and metrics (requires appropriate permissions)
- Real-time inventory counts, sales summaries, and system health

### Clients API (`/api/clients.php`)
- `GET` - List clients with pagination and filtering
- `POST` - Create new client record
- `PUT ?id={id}` - Update existing client information
- `DELETE ?id={id}` - Remove client from system

### Simplified APIs (No Authentication)
- `api_books_simple.php` - Lightweight books search for sales module
- `api_dashboard_simple.php` - Basic dashboard data without complex permissions
- `api_sales_simple.php` - Streamlined sales operations

## Configuration Files

### Database Configuration (`database/config.php`)
- **Singleton Pattern**: `DatabaseConnection` class with single instance
- **Utility Functions**: 
  - `executeQuery($sql, $params)` - Execute SELECT queries, returns array
  - `executeUpdate($sql, $params)` - Execute INSERT/UPDATE/DELETE, returns ID or row count
  - `executeQuerySingle($sql, $params)` - Get single row, returns associative array
  - `getDB()` - Get PDO connection instance
- **Transaction Support**: 
  - `beginTransaction()`
  - `commitTransaction()`
  - `rollbackTransaction()`
- **Automatic Logging**: Database operations logged to daily files in `/logs/`
- **Environment Detection**: Automatically detects development vs production mode

### JavaScript Module Architecture
Key patterns used in the frontend modules:
- **Module Pattern**: Objects like `InventoryManager` and `SalesManager` encapsulate functionality
- **State Management**: Each module maintains its own `state` object with current data
- **Element Binding**: `bindElements()` method caches DOM references for performance
- **Event Delegation**: Event handlers attached to parent containers for dynamic content
- **Async/Await**: Modern promise handling for API calls
- **Error Boundaries**: Try-catch blocks with user-friendly error messages
- **Initialization Guards**: `isInitialized` flags prevent double initialization
- **Cross-module Communication**: Global window objects for module interaction
- **Simplified API Fallbacks**: Use `api_*_simple.php` when complex auth is not needed

### CSS Architecture
- **`text-fix.css`**: Ensures text visibility in all input fields and forms
- **`inventory.css`**: Inventory-specific styles and layouts
- **Responsive Design**: Mobile-first approach with breakpoints
- **Component-based**: Reusable CSS classes and utilities

## Security Implementation

### Input Validation & Sanitization
- **Server-side Validation**: All inputs validated on PHP backend
- **Client-side Validation**: Real-time form validation feedback
- **XSS Prevention**: HTML entity encoding for all user content
- **SQL Injection Prevention**: PDO prepared statements exclusively

### Authentication Security
- **Session Security**: Secure session handling with database storage
- **Password Policies**: Minimum length and complexity requirements
- **Role-based Permissions**: Granular access control per function
- **CSRF Protection**: Token-based request validation

## Production Deployment

### Migration Steps
1. **See `MIGRATION_GUIDE.md`** for comprehensive deployment guide
2. **Update Database Credentials**: Modify `database/config.php`
3. **Configure SSL/HTTPS**: Secure connection setup
4. **Set Production Environment**: Disable debug modes
5. **Setup Automated Backups**: Database and file backups
6. **Configure Security Headers**: CORS, CSP, security headers

### Performance Optimization
- **Database Indexing**: Optimized for common queries
- **Pagination**: Reduces memory usage and improves response times
- **Cached Queries**: Category and user data caching
- **Minified Assets**: CSS and JavaScript optimization

## Troubleshooting

### Common Issues & Solutions

#### Database Connection Problems
1. **Check credentials** in `database/config.php`
2. **Verify MySQL service** is running
3. **Use web installer** at `database/install.php`
4. **Check logs** in `/logs/` directory
5. **Test connection** with `checkDatabaseConnection()` function

#### Text Visibility Issues
- **CSS Override**: `text-fix.css` handles input visibility
- **Browser Compatibility**: Tested on Chrome, Firefox, Safari, Edge
- **Color Contrast**: WCAG compliant color schemes

#### API Issues
- **Check HTTP methods**: Ensure correct GET/POST/PUT/DELETE usage
- **Verify JSON format**: All requests expect JSON content-type
- **Authentication**: Ensure valid session for protected endpoints
- **Error Codes**: Use HTTP response codes for debugging

### Development Tools
- **Browser Console**: All operations logged with emojis for easy identification
- **Network Tab**: Monitor API requests and responses
- **Database Logs**: Daily logs in `/logs/` directory
- **Error Reporting**: Comprehensive error messages in development mode

## Common Development Tasks

### Adding New Book Fields
1. **Update Database Schema**: Add columns to `libros` table in `setup_local_mysql.sql`
2. **Modify API**: Update `/api/books.php` in `handleCreateBook()` and `handleUpdateBook()` functions
3. **Update Frontend Form**: Add fields to book modal in `index.html` 
4. **Update JavaScript**: Modify `collectFormData()` and `validateBookForm()` in `inventory-manager.js`

### Adding New Filters
1. **Database Query**: Update SQL in `handleGetBooks()` function in `api/books.php`
2. **API Parameters**: Add new filter parameters to GET request handling
3. **Frontend UI**: Add filter controls to advanced filters modal in `index.html`
4. **JavaScript Logic**: Update `currentFilters` state and `applyAdvancedFilters()` in `inventory-manager.js`

### Customizing Pagination  
- **Change Page Size**: Modify `per_page` in `InventoryManager.state.pagination`
- **Update Display**: Pagination automatically adjusts to new page size
- **API Compatibility**: Backend supports any page size via `limit` parameter

## User Roles & Permissions

### Role Hierarchy
- **Admin**: Full system access to all modules (dashboard, inventory, stock, sales, reports)
- **Inventory**: Manages inventory and stock control, dashboard access only
- **Seller**: Creates sales and views inventory (read-only), dashboard access
- **Readonly**: View-only access to dashboard, inventory and stock information

### Default Users
- **Admin Account**: `admin@libreria.com` / `admin123`
- **Test Accounts**: Additional users included in schema

## Best Practices

### Code Organization
- **Modular Structure**: Each feature in separate files
- **Consistent Naming**: CamelCase for JavaScript, snake_case for PHP/SQL
- **Error Handling**: Comprehensive try-catch blocks
- **Documentation**: Inline comments for complex logic

### Database Design
- **Normalized Structure**: Efficient relational design
- **Foreign Keys**: Referential integrity maintained
- **Indexes**: Performance optimization for common queries
- **Audit Trail**: All changes logged with timestamps

### Security Guidelines
- **Input Validation**: Never trust user input
- **Prepared Statements**: All database queries parameterized
- **Session Management**: Secure session handling
- **Error Messages**: Generic messages in production

Last updated: August 2025.