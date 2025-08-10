# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Library Inventory Management System** ("Librería Digital") - a complete web-based application for managing book inventory, sales, and customers. The system is built with PHP backend, MySQL database, and vanilla JavaScript frontend with a modern, responsive interface.

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
├── CLAUDE.md               # Project documentation (this file)
├── MIGRATION_GUIDE.md      # Detailed hosting migration guide
├── api/                    # PHP backend endpoints
│   ├── auth.php           # Authentication API
│   ├── books.php          # Books management API (CRUD)
│   ├── categories.php     # Categories management API
│   └── users_fix.php      # User management utilities
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
│       │   ├── auth.js    # Core authentication
│       │   └── login.js   # Login page functionality
│       ├── components/    # UI components
│       │   └── dashboard.js # Dashboard components
│       ├── modules/       # App modules
│       │   ├── app-init.js # Application initialization
│       │   ├── inventory-manager.js # Complete inventory management
│       │   ├── navigation.js # Navigation and routing
│       │   ├── section-observer.js # Section visibility management
│       │   └── user-management.js # User administration
│       ├── utils/         # Utility functions
│       │   └── helpers.js # Common helper functions
│       ├── inventory-init.js # Inventory system initialization
│       └── main.js        # Main application entry point
├── database/              # Database configuration and setup
│   ├── config.php         # Database connection & utilities
│   ├── install.php        # Web-based database installer
│   ├── setup_local_mysql.sql # Primary database schema
│   ├── libreria_inventario.sql # Alternative schema file
│   └── sample_data.sql    # Test data for development
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
- Default credentials in `database/config.php`:
  - Host: `localhost:3306`
  - User: `root` 
  - Password: `root`
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

# Load sample data for testing
mysql -u root -p libreria_inventario < database/sample_data.sql
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

## Key Application Features

### Complete Inventory Management System
- **📚 Book Management**: Full CRUD operations (Create, Read, Update, Delete)
- **🔍 Advanced Search & Filtering**: Search by title, author, ISBN with category filters
- **📊 Pagination**: 5 books per page with intuitive navigation controls
- **📋 Book Details Modal**: Complete book information display
- **✏️ Inline Editing**: Edit books directly from the inventory table
- **🗑️ Smart Deletion**: Books with sales are marked as discontinued, others are permanently deleted
- **📈 Real-time Statistics**: Inventory counts, low stock alerts, total value calculations

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
- **⚡ Modular JavaScript**: Clean separation of concerns
- **🎛️ State Management**: Centralized application state
- **🧩 Component System**: Reusable UI components
- **📡 API Integration**: RESTful API consumption
- **🔄 Real-time Updates**: Dynamic content updates without page refresh

### Backend API Structure
- **📡 RESTful Design**: Standard HTTP methods and response codes
- **📄 JSON Responses**: Consistent API response format
- **🔍 Advanced Filtering**: Multiple filter combinations
- **📊 Pagination Support**: Configurable page sizes
- **⚡ Optimized Queries**: Efficient database operations
- **🛠️ Transaction Support**: ACID compliance for data integrity

## API Endpoints

### Books API (`/api/books.php`)
- `GET` - List books with pagination and filtering
- `GET ?id={id}` - Get single book details
- `POST` - Create new book
- `PUT ?id={id}` - Update existing book
- `DELETE ?id={id}` - Delete book (smart deletion)

### Categories API (`/api/categories.php`)
- `GET` - List all categories with book counts
- Supports display order and color coding

### Authentication API (`/api/auth.php`)
- Login/logout functionality
- Session management
- Role-based permissions

## Configuration Files

### Database Configuration (`database/config.php`)
- **Singleton Pattern**: Single database connection instance
- **Utility Functions**: 
  - `executeQuery($sql, $params)` - Execute SELECT queries
  - `executeUpdate($sql, $params)` - Execute INSERT/UPDATE/DELETE
  - `executeQuerySingle($sql, $params)` - Get single row
- **Transaction Support**: 
  - `beginTransaction()`
  - `commitTransaction()`
  - `rollbackTransaction()`
- **Automatic Logging**: Database operations logged to daily files

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
2. **Modify API**: Update `/api/books.php` validation and field handling
3. **Update Frontend Form**: Add fields to book modal in `index.html`
4. **Update JavaScript**: Modify `inventory-manager.js` field collection and validation

### Adding New Filters
1. **Database Query**: Update SQL in `handleGetBooks()` function
2. **API Parameters**: Add new filter parameters
3. **Frontend UI**: Add filter controls to `index.html`
4. **JavaScript Logic**: Update filter state management in `inventory-manager.js`

### Customizing Pagination
- **Change Page Size**: Modify `per_page` in `inventory-manager.js` state
- **Update Display**: Pagination automatically adjusts to new page size
- **API Compatibility**: Backend supports any page size via `limit` parameter

## User Roles & Permissions

### Role Hierarchy
- **Admin**: Full system access, user management, all inventory operations
- **Seller**: Sales operations, customer management, inventory viewing
- **Inventory**: Stock management, book operations, supplier management
- **Readonly**: View-only access to all information

### Default Users
- **Admin Account**: `admin@libreria.com` / `admin123`
- **Test Accounts**: Additional users in `sample_data.sql`

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

This documentation is maintained and updated with each significant change to the system. Last updated: August 2025.