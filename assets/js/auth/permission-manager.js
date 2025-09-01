/**
 * LIBRERÍA DIGITAL - GESTOR DE PERMISOS FRONTEND
 * Archivo: assets/js/auth/permission-manager.js
 * Descripción: Gestión de permisos y control de acceso en el frontend
 */

const PermissionManager = {
    // Estado de permisos
    state: {
        user: null,
        permissions: {},
        isInitialized: false
    },

    // Definición de módulos del sistema
    modules: {
        'dashboard': 'Dashboard',
        'inventory': 'Inventario',
        'stock': 'Control de Stock',
        'sales': 'Ventas',
        'reports': 'Reportes',
        'users': 'Usuarios'
    },

    /**
     * Inicializar el gestor de permisos
     */
    async init() {
        if (this.state.isInitialized) {
            return this.state;
        }

        console.log('🔐 Inicializando Permission Manager...');

        try {
            // Intentar obtener información del usuario actual
            await this.loadUserPermissions();
            this.state.isInitialized = true;
            console.log('✅ Permission Manager inicializado correctamente');
            return this.state;
        } catch (error) {
            console.error('❌ Error inicializando Permission Manager:', error);
            this.clearUserData();
            throw error;
        }
    },

    /**
     * Cargar permisos del usuario desde el servidor
     */
    async loadUserPermissions() {
        try {
            const response = await fetch('api/auth.php', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.state.user = result.user;
                this.state.permissions = result.permissions;
                console.log('👤 Usuario logueado:', this.state.user.nombre, '- Rol:', this.state.user.rol);
                return this.state;
            } else {
                throw new Error(result.message || 'No se pudo obtener información del usuario');
            }
        } catch (error) {
            console.error('Error cargando permisos:', error);
            // Si hay error, intentar cargar desde localStorage como fallback
            const sessionData = localStorage.getItem('libreria_session');
            if (sessionData) {
                try {
                    const data = JSON.parse(sessionData);
                    if (data.user && data.permissions) {
                        this.state.user = data.user;
                        this.state.permissions = data.permissions;
                        console.log('👤 Usuario cargado desde localStorage:', this.state.user.name);
                        return this.state;
                    }
                } catch (e) {
                    console.error('Error parsing localStorage data:', e);
                }
            }
            throw error;
        }
    },

    /**
     * Verificar si el usuario tiene permiso para una acción específica
     */
    hasPermission(module, action) {
        if (!this.state.permissions.all_permissions) {
            return false;
        }

        const modulePermissions = this.state.permissions.all_permissions[module];
        return modulePermissions && modulePermissions.includes(action);
    },

    /**
     * Verificar si el usuario puede acceder a un módulo
     */
    canAccessModule(module) {
        if (!this.state.permissions.modules) {
            return false;
        }

        return this.state.permissions.modules.hasOwnProperty(module);
    },

    /**
     * Obtener rol del usuario actual
     */
    getUserRole() {
        return this.state.user?.rol || null;
    },

    /**
     * Obtener información del usuario actual
     */
    getCurrentUser() {
        return this.state.user;
    },

    /**
     * Verificar si el usuario está logueado
     */
    isLoggedIn() {
        return this.state.user !== null;
    },

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            const response = await fetch('api/auth.php', {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.clearUserData();
                window.location.href = 'login.html';
                return true;
            } else {
                throw new Error(result.message || 'Error al cerrar sesión');
            }
        } catch (error) {
            console.error('Error en logout:', error);
            // Forzar redirect aunque haya error
            this.clearUserData();
            window.location.href = 'login.html';
        }
    },

    /**
     * Limpiar datos del usuario
     */
    clearUserData() {
        this.state.user = null;
        this.state.permissions = {};
        this.state.isInitialized = false;
    },

    /**
     * Obtener módulos accesibles para el rol actual
     */
    getAccessibleModules() {
        return this.state.permissions.modules || {};
    },

    /**
     * Verificar múltiples permisos
     */
    hasAnyPermission(permissions) {
        return permissions.some(([module, action]) => this.hasPermission(module, action));
    },

    /**
     * Verificar todos los permisos
     */
    hasAllPermissions(permissions) {
        return permissions.every(([module, action]) => this.hasPermission(module, action));
    },

    /**
     * Obtener información de permisos para debugging
     */
    getPermissionInfo() {
        return {
            user: this.state.user,
            role: this.getUserRole(),
            modules: this.getAccessibleModules(),
            allPermissions: this.state.permissions.all_permissions
        };
    }
};

/**
 * UTILIDADES PARA CONTROL DE UI BASADO EN PERMISOS
 */
const UIPermissionController = {
    
    /**
     * Mostrar/ocultar elementos basado en permisos
     */
    toggleElementByPermission(elementId, module, action, showIfHasPermission = true) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const hasPermission = PermissionManager.hasPermission(module, action);
        const shouldShow = showIfHasPermission ? hasPermission : !hasPermission;

        if (shouldShow) {
            element.style.display = '';
            element.classList.remove('hidden');
        } else {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    },

    /**
     * Habilitar/deshabilitar elementos basado en permisos
     */
    toggleElementEnabledByPermission(elementId, module, action, enableIfHasPermission = true) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const hasPermission = PermissionManager.hasPermission(module, action);
        const shouldEnable = enableIfHasPermission ? hasPermission : !hasPermission;

        element.disabled = !shouldEnable;
        
        if (shouldEnable) {
            element.classList.remove('disabled', 'opacity-50', 'cursor-not-allowed');
        } else {
            element.classList.add('disabled', 'opacity-50', 'cursor-not-allowed');
        }
    },

    /**
     * Aplicar permisos a múltiples elementos
     */
    applyPermissionsToElements(permissionRules) {
        permissionRules.forEach(rule => {
            const { elementId, module, action, type = 'visibility', invert = false } = rule;
            
            if (type === 'visibility') {
                this.toggleElementByPermission(elementId, module, action, !invert);
            } else if (type === 'enabled') {
                this.toggleElementEnabledByPermission(elementId, module, action, !invert);
            }
        });
    },

    /**
     * Ocultar elementos que requieren permisos específicos
     */
    hideElementsWithoutPermission() {
        // Buscar elementos con atributos data-require-permission
        const elementsWithPermissions = document.querySelectorAll('[data-require-permission]');
        
        elementsWithPermissions.forEach(element => {
            const permissionData = element.getAttribute('data-require-permission');
            const [module, action] = permissionData.split(':');
            
            if (!PermissionManager.hasPermission(module, action)) {
                element.style.display = 'none';
                element.classList.add('hidden');
            }
        });
    },

    /**
     * Mostrar información del usuario en la UI
     */
    updateUserInfo() {
        const user = PermissionManager.getCurrentUser();
        if (!user) return;

        // Actualizar nombre de usuario
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(element => {
            element.textContent = user.nombre;
        });

        // Actualizar rol de usuario
        const userRoleElements = document.querySelectorAll('[data-user-role]');
        userRoleElements.forEach(element => {
            element.textContent = this.getRoleDisplayName(user.rol);
        });

        // Actualizar email de usuario
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(element => {
            element.textContent = user.email;
        });
    },

    /**
     * Obtener nombre de visualización del rol
     */
    getRoleDisplayName(role) {
        const roleNames = {
            'admin': 'Administrador',
            'inventory': 'Inventario',
            'seller': 'Vendedor',
            'readonly': 'Solo Lectura'
        };
        return roleNames[role] || role;
    },

    /**
     * Configurar botón de logout
     */
    setupLogoutButton() {
        const logoutButtons = document.querySelectorAll('[data-logout-btn]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('¿Está seguro que desea cerrar sesión?')) {
                    PermissionManager.logout();
                }
            });
        });
    }
};

// Exportar para uso global
window.PermissionManager = PermissionManager;
window.UIPermissionController = UIPermissionController;

// Auto-inicializar cuando se carga el script
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await PermissionManager.init();
        UIPermissionController.updateUserInfo();
        UIPermissionController.hideElementsWithoutPermission();
        UIPermissionController.setupLogoutButton();
    } catch (error) {
        console.warn('No se pudo inicializar los permisos, redirigiendo a login...');
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
});