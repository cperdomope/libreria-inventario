/**
 * LIBRERÍA DIGITAL - AUTHENTICATION SYSTEM
 * Archivo: assets/js/auth/auth.js
 * Descripción: Sistema de autenticación para la aplicación principal
 */

// ===== SISTEMA DE AUTENTICACIÓN =====
const AuthSystem = {
    // Estado de sesión
    currentSession: null,
    sessionKey: 'libreria_session',
    
    /**
     * Inicializar sistema de autenticación
     */
    init() {
        console.log('Inicializando sistema de autenticación...');
        
        // Verificar autenticación al cargar
        if (!this.checkAuthentication()) {
            this.redirectToLogin();
            return false;
        }
        
        // Configurar renovación automática de sesión
        this.setupSessionRenewal();
        
        // Configurar eventos de visibilidad
        this.setupVisibilityEvents();
        
        // Actualizar interfaz con datos del usuario
        this.updateUserInterface();
        
        console.log('Sistema de autenticación inicializado');
        return true;
    },
    
    /**
     * Verificar autenticación
     */
    checkAuthentication() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            
            if (!sessionData) {
                console.log('No hay sesión activa');
                return false;
            }
            
            const session = JSON.parse(sessionData);
            
            // Verificar si la sesión ha expirado
            if (Date.now() >= session.expires) {
                console.log('Sesión expirada');
                this.logout();
                return false;
            }
            
            // Cargar sesión actual
            this.currentSession = session;
            console.log('Sesión válida:', session.user.name);
            return true;
            
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            this.logout();
            return false;
        }
    },
    
    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        return this.currentSession ? this.currentSession.user : null;
    },
    
    /**
     * Verificar permisos
     */
    hasPermission(permission) {
        if (!this.currentSession) return false;
        return this.currentSession.user.permissions.includes(permission);
    },
    
    /**
     * Verificar rol
     */
    hasRole(role) {
        if (!this.currentSession) return false;
        return this.currentSession.user.role === role;
    },
    
    /**
     * Renovar sesión
     */
    renewSession() {
        if (!this.currentSession) return false;
        
        try {
            // Extender la sesión por 8 horas más
            this.currentSession.expires = Date.now() + (8 * 60 * 60 * 1000);
            this.currentSession.timestamp = Date.now();
            
            localStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
            console.log('Sesión renovada');
            return true;
            
        } catch (error) {
            console.error('Error renovando sesión:', error);
            return false;
        }
    },
    
    /**
     * Configurar renovación automática
     */
    setupSessionRenewal() {
        // Renovar sesión cada 30 minutos si está activa
        setInterval(() => {
            if (this.currentSession && this.checkAuthentication()) {
                this.renewSession();
            }
        }, 30 * 60 * 1000); // 30 minutos
    },
    
    /**
     * Configurar eventos de visibilidad
     */
    setupVisibilityEvents() {
        // Verificar sesión cuando la página se vuelve visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                if (!this.checkAuthentication()) {
                    this.showSessionExpiredModal();
                }
            }
        });
        
        // Verificar sesión en focus
        window.addEventListener('focus', () => {
            if (!this.checkAuthentication()) {
                this.showSessionExpiredModal();
            }
        });
    },
    
    /**
     * Actualizar interfaz de usuario
     */
    updateUserInterface() {
        if (!this.currentSession) return;
        
        const user = this.currentSession.user;
        
        // Actualizar información del usuario en el header
        const userNameElement = document.querySelector('.user-info .font-medium');
        const userRoleElement = document.querySelector('.user-info .text-sm');
        
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
        
        if (userRoleElement) {
            userRoleElement.textContent = this.getRoleDisplayName(user.role);
        }
        
        // Mostrar/ocultar elementos según permisos
        this.applyPermissions();
    },
    
    /**
     * Aplicar permisos a la interfaz
     */
    applyPermissions() {
        if (!this.currentSession) return;
        
        const user = this.currentSession.user;
        
        // Ocultar secciones según permisos
        if (!this.hasPermission('admin')) {
            // Ocultar gestión de usuarios para no-admin
            const usersNavLink = document.querySelector('[data-section="users"]');
            if (usersNavLink) {
                usersNavLink.parentElement.style.display = 'none';
            }
        }
        
        if (!this.hasPermission('write')) {
            // Deshabilitar botones de creación/edición
            const createButtons = document.querySelectorAll('[data-action="create"], [data-action="edit"]');
            createButtons.forEach(button => {
                button.disabled = true;
                button.classList.add('opacity-50', 'cursor-not-allowed');
            });
        }
        
        // Aplicar restricciones específicas por rol
        this.applyRoleRestrictions(user.role);
    },
    
    /**
     * Aplicar restricciones por rol
     */
    applyRoleRestrictions(role) {
        switch (role) {
            case 'seller':
                // Vendedores solo pueden acceder a ventas e inventario (consulta)
                this.hideNavSection('stock');
                this.hideNavSection('reports');
                break;
                
            case 'inventory':
                // Personal de inventario no puede acceder a ventas
                this.hideNavSection('sales');
                break;
                
            case 'readonly':
                // Solo lectura: ocultar todos los botones de acción
                const actionButtons = document.querySelectorAll('button[class*="bg-indigo"], button[class*="bg-green"], button[class*="bg-red"]');
                actionButtons.forEach(button => {
                    if (!button.textContent.includes('Ver') && !button.textContent.includes('Filtros')) {
                        button.style.display = 'none';
                    }
                });
                break;
        }
    },
    
    /**
     * Ocultar sección de navegación
     */
    hideNavSection(sectionName) {
        const navLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (navLink) {
            navLink.parentElement.style.display = 'none';
        }
    },
    
    /**
     * Obtener nombre de rol para mostrar
     */
    getRoleDisplayName(role) {
        const roleNames = {
            'admin': 'Administrador',
            'seller': 'Vendedor',
            'inventory': 'Inventario',
            'readonly': 'Solo Lectura'
        };
        return roleNames[role] || role;
    },
    
    /**
     * Mostrar modal de sesión expirada
     */
    showSessionExpiredModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
                <div class="flex items-center mb-4">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-500 text-2xl"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-lg font-medium text-gray-900">Sesión Expirada</h3>
                        <p class="text-sm text-gray-600 mt-1">Tu sesión ha expirado por seguridad.</p>
                    </div>
                </div>
                <div class="flex justify-end space-x-3">
                    <button id="renewSessionBtn" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Renovar Sesión
                    </button>
                    <button id="logoutBtn" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('renewSessionBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.redirectToLogin();
        });
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.logout();
        });
    },
    
    /**
     * Cerrar sesión
     */
    logout() {
        // Limpiar datos de sesión
        localStorage.removeItem(this.sessionKey);
        this.currentSession = null;
        
        // Mostrar notificación
        if (window.NotificationManager) {
            NotificationManager.showToast('Sesión cerrada exitosamente', 'info');
        }
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            this.redirectToLogin();
        }, 1000);
    },
    
    /**
     * Redirigir al login
     */
    redirectToLogin() {
        window.location.href = 'login.html';
    },
    
    /**
     * Obtener información de sesión para debugging
     */
    getSessionInfo() {
        if (!this.currentSession) return null;
        
        const now = Date.now();
        const timeRemaining = this.currentSession.expires - now;
        
        return {
            user: this.currentSession.user,
            expires: new Date(this.currentSession.expires).toLocaleString(),
            timeRemaining: Math.round(timeRemaining / (1000 * 60)) + ' minutos',
            isValid: timeRemaining > 0
        };
    }
};

// ===== NOTIFICATION MANAGER PARA AUTENTICACIÓN =====
const NotificationManager = {
    /**
     * Mostrar toast notification
     */
    showToast(message, type = 'info', duration = 4000) {
        // Buscar contenedor de toasts existente o crearlo
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type} transform transition-all duration-300 translate-x-full`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    },
    
    /**
     * Obtener icono para toast
     */
    getToastIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }
};

// ===== FUNCIÓN DE LOGOUT GLOBAL =====
function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        AuthSystem.logout();
    }
}

// ===== EXPORTAR PARA USO GLOBAL =====
window.AuthSystem = AuthSystem;
window.NotificationManager = NotificationManager;
window.handleLogout = handleLogout;