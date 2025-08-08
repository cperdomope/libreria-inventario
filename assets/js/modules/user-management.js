/**
 * LIBRERÍA DIGITAL - GESTIÓN DE USUARIOS
 * Archivo: assets/js/modules/user-management.js
 * Descripción: Funcionalidad para gestión de usuarios
 */

// ===== CONFIGURACIÓN =====
const USER_API_URL = 'api/users_fix.php';

// ===== ESTADO DEL MÓDULO =====
const UserManager = {
    // Elementos DOM
    newUserBtn: null,
    modal: null,
    form: null,
    closeBtn: null,
    cancelBtn: null,
    togglePasswordBtn: null,
    
    // Estado
    isLoading: false,
    users: [],
    isInitialized: false,
    
    /**
     * Inicializar el módulo
     */
    init() {
        if (this.isInitialized) {
            console.log('⚠️ UserManager ya está inicializado');
            return;
        }
        
        console.log('🚀 Inicializando UserManager...');
        
        if (!this.bindElements()) {
            console.log('❌ No se pudieron vincular elementos, cancelando inicialización');
            return;
        }
        
        this.bindEvents();
        this.loadUsers();
        this.isInitialized = true;
        console.log('✅ UserManager inicializado correctamente');
    },
    
    /**
     * Vincular elementos DOM
     */
    bindElements() {
        this.newUserBtn = document.getElementById('new-user-btn');
        this.modal = document.getElementById('new-user-modal');
        this.form = document.getElementById('new-user-form');
        this.closeBtn = document.getElementById('close-modal-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.togglePasswordBtn = document.getElementById('toggle-password');
        
        // Verificar que los elementos existen
        if (!this.newUserBtn) {
            console.warn('⚠️ Botón "Nuevo Usuario" no encontrado');
            return false;
        }
        
        if (!this.modal || !this.form) {
            console.warn('⚠️ Modal o formulario no encontrado');
            return false;
        }
        
        return true;
    },
    
    /**
     * Vincular eventos
     */
    bindEvents() {
        if (!this.bindElements()) return;
        
        // Abrir modal
        this.newUserBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
        });
        
        // Cerrar modal
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.cancelBtn?.addEventListener('click', () => this.closeModal());
        
        // Cerrar modal al hacer click fuera
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
        
        // Toggle password visibility
        this.togglePasswordBtn?.addEventListener('click', this.togglePasswordVisibility);
        
        // Enviar formulario
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        
        // Validación en tiempo real
        const passwordField = document.getElementById('user-password');
        const confirmField = document.getElementById('user-password-confirm');
        
        confirmField?.addEventListener('input', () => {
            this.validatePasswordMatch();
        });
        
        passwordField?.addEventListener('input', () => {
            this.validatePasswordMatch();
        });
    },
    
    /**
     * Abrir modal
     */
    openModal() {
        console.log('📱 Abriendo modal de nuevo usuario');
        this.resetForm();
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Enfocar primer campo
        setTimeout(() => {
            document.getElementById('user-name')?.focus();
        }, 100);
    },
    
    /**
     * Cerrar modal
     */
    closeModal() {
        console.log('❌ Cerrando modal');
        this.modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.resetForm();
    },
    
    /**
     * Resetear formulario
     */
    resetForm() {
        this.form.reset();
        this.hideErrors();
        this.setLoading(false);
    },
    
    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        const passwordField = document.getElementById('user-password');
        const eyeIcon = document.querySelector('#toggle-password i');
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            eyeIcon.className = 'fas fa-eye-slash';
        } else {
            passwordField.type = 'password';
            eyeIcon.className = 'fas fa-eye';
        }
    },
    
    /**
     * Validar que las contraseñas coincidan
     */
    validatePasswordMatch() {
        const password = document.getElementById('user-password').value;
        const confirm = document.getElementById('user-password-confirm').value;
        const confirmField = document.getElementById('user-password-confirm');
        
        if (confirm === '') {
            confirmField.classList.remove('border-red-500', 'border-green-500');
            return;
        }
        
        if (password === confirm) {
            confirmField.classList.remove('border-red-500');
            confirmField.classList.add('border-green-500');
        } else {
            confirmField.classList.remove('border-green-500');
            confirmField.classList.add('border-red-500');
        }
    },
    
    /**
     * Manejar envío del formulario
     */
    async handleFormSubmit() {
        if (this.isLoading) return;
        
        console.log('📝 Enviando formulario de nuevo usuario');
        
        // Validar formulario
        if (!this.validateForm()) {
            return;
        }
        
        this.setLoading(true);
        
        try {
            // Recopilar datos del formulario
            const formData = new FormData(this.form);
            const userData = {};
            
            for (let [key, value] of formData.entries()) {
                userData[key] = value;
            }
            
            // Remover confirmación de contraseña
            delete userData.password_confirm;
            
            // Enviar a la API
            console.log('📤 Enviando datos:', userData);
            
            const response = await fetch(USER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', response.headers);
            
            // Obtener respuesta como texto primero
            const responseText = await response.text();
            console.log('📄 Raw response:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
                console.log('✅ Parsed result:', result);
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                throw new Error(`Respuesta inválida del servidor: ${responseText.substring(0, 200)}`);
            }
            
            if (result.success) {
                this.handleSuccess(result);
            } else {
                this.handleError(result);
            }
            
        } catch (error) {
            console.error('❌ Error al crear usuario:', error);
            this.showErrors([error.message || 'Error de conexión con el servidor']);
        } finally {
            this.setLoading(false);
        }
    },
    
    /**
     * Validar formulario
     */
    validateForm() {
        const errors = [];
        
        // Validar campos requeridos
        const nombre = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const password = document.getElementById('user-password').value;
        const passwordConfirm = document.getElementById('user-password-confirm').value;
        const rol = document.getElementById('user-role').value;
        
        if (!nombre) errors.push('El nombre es requerido');
        if (!email) errors.push('El email es requerido');
        if (!password) errors.push('La contraseña es requerida');
        if (!rol) errors.push('El rol es requerido');
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            errors.push('El email no es válido');
        }
        
        // Validar contraseña
        if (password && password.length < 6) {
            errors.push('La contraseña debe tener al menos 6 caracteres');
        }
        
        // Validar que las contraseñas coincidan
        if (password !== passwordConfirm) {
            errors.push('Las contraseñas no coinciden');
        }
        
        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }
        
        this.hideErrors();
        return true;
    },
    
    /**
     * Mostrar errores
     */
    showErrors(errors) {
        const errorContainer = document.getElementById('form-errors');
        const errorList = document.getElementById('error-list');
        
        errorList.innerHTML = '';
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            errorList.appendChild(li);
        });
        
        errorContainer.classList.remove('hidden');
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    
    /**
     * Ocultar errores
     */
    hideErrors() {
        document.getElementById('form-errors').classList.add('hidden');
    },
    
    /**
     * Manejar éxito
     */
    handleSuccess(result) {
        console.log('✅ Usuario creado exitosamente:', result.user);
        
        // Mostrar notificación de éxito
        this.showToast(`Usuario "${result.user.nombre}" creado exitosamente`, 'success');
        
        // Cerrar modal
        this.closeModal();
        
        // Recargar lista de usuarios
        this.loadUsers();
        
        // Actualizar estadísticas
        this.updateStats();
    },
    
    /**
     * Manejar error
     */
    handleError(result) {
        console.error('❌ Error al crear usuario:', result);
        
        if (result.errors && Array.isArray(result.errors)) {
            this.showErrors(result.errors);
        } else if (result.message) {
            this.showErrors([result.message]);
        } else {
            this.showErrors(['Error desconocido al crear usuario']);
        }
    },
    
    /**
     * Cargar lista de usuarios
     */
    async loadUsers() {
        try {
            console.log('📥 Cargando usuarios...');
            const response = await fetch(USER_API_URL);
            const result = await response.json();
            
            if (result.success) {
                this.users = result.users;
                this.renderUsersList(result.users);
                this.updateStats(result.stats);
                console.log(`✅ ${result.users.length} usuarios cargados`);
            }
        } catch (error) {
            console.error('❌ Error al cargar usuarios:', error);
        }
    },
    
    /**
     * Renderizar lista de usuarios
     */
    renderUsersList(users) {
        // En una implementación completa, aquí actualizarías la tabla de usuarios
        // Por ahora, solo log de confirmación
        console.log('📋 Lista de usuarios actualizada:', users);
    },
    
    /**
     * Actualizar estadísticas
     */
    updateStats(stats) {
        if (!stats) return;
        
        // Actualizar contadores en el dashboard
        const elements = {
            total: document.querySelector('[data-stat="total-users"]'),
            activos: document.querySelector('[data-stat="active-users"]'),
            admins: document.querySelector('[data-stat="admin-users"]'),
            nuevos: document.querySelector('[data-stat="new-users"]')
        };
        
        if (elements.total) elements.total.textContent = stats.total;
        if (elements.activos) elements.activos.textContent = stats.activos;
        if (elements.admins) elements.admins.textContent = stats.admins;
        if (elements.nuevos) elements.nuevos.textContent = stats.nuevos_mes;
    },
    
    /**
     * Establecer estado de carga
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const saveBtn = document.getElementById('save-user-btn');
        const saveText = document.getElementById('save-btn-text');
        const saveSpinner = document.getElementById('save-spinner');
        
        if (loading) {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-75', 'cursor-not-allowed');
            saveText.textContent = 'Creando...';
            saveSpinner.classList.remove('hidden');
        } else {
            saveBtn.disabled = false;
            saveBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            saveText.textContent = 'Crear Usuario';
            saveSpinner.classList.add('hidden');
        }
    },
    
    /**
     * Mostrar toast notification
     */
    showToast(message, type = 'info') {
        // Reutilizar función de toast existente si está disponible
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            // Implementación básica
            console.log(`🔔 ${type.toUpperCase()}: ${message}`);
            alert(message);
        }
    }
};

// ===== INICIALIZACIÓN AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', () => {
    // Intentar inicializar inmediatamente
    if (document.getElementById('new-user-btn')) {
        console.log('🚀 Inicializando UserManager inmediatamente');
        UserManager.init();
    } else {
        console.log('⏳ Botón no encontrado, esperando cambios de sección...');
        
        // Observar cambios en el DOM para detectar cuando se muestre la sección de usuarios
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id === 'users-section' && !target.classList.contains('hidden')) {
                        console.log('👥 Sección de usuarios activada, inicializando...');
                        if (document.getElementById('new-user-btn')) {
                            UserManager.init();
                            observer.disconnect(); // Dejar de observar una vez inicializado
                        }
                    }
                }
            });
        });
        
        // Observar cambios en las secciones
        const usersSection = document.getElementById('users-section');
        if (usersSection) {
            observer.observe(usersSection, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
        
        // También verificar por URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('section') === 'users') {
            console.log('🔗 URL indica sección usuarios, esperando elementos...');
            setTimeout(() => {
                if (document.getElementById('new-user-btn') && !UserManager.newUserBtn) {
                    console.log('🚀 Inicializando UserManager por URL parameter');
                    UserManager.init();
                }
            }, 500);
        }
    }
});

// Función para inicializar manualmente (para debugging)
window.initUserManager = () => {
    console.log('🔧 Inicialización manual de UserManager');
    UserManager.init();
};

// Hacer disponible globalmente para debugging
window.UserManager = UserManager;