/**
 * LIBRERÍA DIGITAL - LOGIN SYSTEM
 * Archivo: assets/js/auth/login.js
 * Descripción: Funcionalidad de autenticación y login
 */

// ===== CONFIGURACIÓN DE API =====
const API_BASE = 'api/';
const AUTH_ENDPOINT = API_BASE + 'auth.php';

// ===== ESTADO DE LA APLICACIÓN =====
const LoginApp = {
    // Elementos DOM
    form: null,
    emailInput: null,
    passwordInput: null,
    togglePassword: null,
    eyeIcon: null,
    submitButton: null,
    buttonText: null,
    loadingSpinner: null,
    
    // Estado
    isLoading: false,
    attempts: 0,
    maxAttempts: 5, // Aumentar intentos
    lockoutTime: 2 * 60 * 1000, // Reducir a 2 minutos
    
    /**
     * Inicializar la aplicación de login
     */
    init() {
        console.log('Inicializando sistema de login...');
        
        // Verificar si ya está autenticado
        if (this.isAuthenticated()) {
            this.redirectToApp();
            return;
        }
        
        // Obtener elementos DOM
        this.getElements();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Verificar estado de lockout
        this.checkLockoutStatus();
        
        // Aplicar animaciones iniciales
        this.applyInitialAnimations();
        
        console.log('Sistema de login inicializado correctamente');
    },
    
    /**
     * Obtener elementos DOM
     */
    getElements() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.togglePassword = document.getElementById('togglePassword');
        this.eyeIcon = document.getElementById('eyeIcon');
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.buttonText = document.getElementById('buttonText');
        this.loadingSpinner = document.getElementById('loadingSpinner');
    },
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Submit del formulario
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Toggle password visibility
        this.togglePassword.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });
        
        // Validación en tiempo real
        this.emailInput.addEventListener('blur', () => {
            this.validateEmail();
        });
        
        this.passwordInput.addEventListener('blur', () => {
            this.validatePassword();
        });
        
        // Limpiar errores al escribir
        this.emailInput.addEventListener('input', () => {
            this.clearFieldError(this.emailInput);
        });
        
        this.passwordInput.addEventListener('input', () => {
            this.clearFieldError(this.passwordInput);
        });
        
        // Enter key handling
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.passwordInput.focus();
            }
        });
        
        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
    },
    
    /**
     * Aplicar animaciones iniciales
     */
    applyInitialAnimations() {
        // Animar elementos con delay escalonado
        const elements = document.querySelectorAll('.max-w-md > *');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 150);
        });
    },
    
    /**
     * Toggle visibilidad de contraseña
     */
    togglePasswordVisibility() {
        const type = this.passwordInput.type === 'password' ? 'text' : 'password';
        this.passwordInput.type = type;
        
        // Cambiar icono
        this.eyeIcon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        
        // Enfocar el input
        this.passwordInput.focus();
        
        // Mover cursor al final
        setTimeout(() => {
            const length = this.passwordInput.value.length;
            this.passwordInput.setSelectionRange(length, length);
        }, 0);
    },
    
    /**
     * Validar email
     */
    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showFieldError(this.emailInput, 'El email es requerido');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showFieldError(this.emailInput, 'Formato de email inválido');
            return false;
        }
        
        this.showFieldSuccess(this.emailInput);
        return true;
    },
    
    /**
     * Validar contraseña
     */
    validatePassword() {
        const password = this.passwordInput.value;
        
        if (!password) {
            this.showFieldError(this.passwordInput, 'La contraseña es requerida');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError(this.passwordInput, 'La contraseña debe tener al menos 6 caracteres');
            return false;
        }
        
        this.showFieldSuccess(this.passwordInput);
        return true;
    },
    
    /**
     * Mostrar error en campo
     */
    showFieldError(field, message) {
        field.classList.add('input-error');
        field.classList.remove('input-success');
        
        // Remover mensaje anterior
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Agregar nuevo mensaje
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        field.parentNode.appendChild(errorDiv);
    },
    
    /**
     * Mostrar éxito en campo
     */
    showFieldSuccess(field) {
        field.classList.remove('input-error');
        field.classList.add('input-success');
        
        // Remover mensajes de error
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    },
    
    /**
     * Limpiar error de campo
     */
    clearFieldError(field) {
        field.classList.remove('input-error', 'input-success');
        
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    },
    
    /**
     * Manejar intento de login
     */
    async handleLogin() {
        // Prevenir múltiples envíos
        if (this.isLoading) return;
        
        // Verificar lockout
        if (this.isLockedOut()) {
            this.showToast('Cuenta bloqueada. Intenta más tarde.', 'error');
            return;
        }
        
        // Validar campos
        const emailValid = this.validateEmail();
        const passwordValid = this.validatePassword();
        
        if (!emailValid || !passwordValid) {
            this.shakeForm();
            return;
        }
        
        // Iniciar loading
        this.setLoading(true);
        
        try {
            const email = this.emailInput.value.trim();
            const password = this.passwordInput.value;
            const remember = document.getElementById('remember-me').checked;
            
            // Enviar credenciales a la API
            const response = await fetch(AUTH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    remember: remember
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.handleSuccessfulLogin(data);
            } else {
                this.handleFailedLogin(data.message || 'Credenciales inválidas');
            }
            
        } catch (error) {
            console.error('Error durante login:', error);
            this.handleFailedLogin('Error de conexión al servidor');
        } finally {
            this.setLoading(false);
        }
    },
    
    /**
     * Validar credenciales (ahora se usa la API)
     */
    validateCredentials(email, password) {
        // Esta función ya no se usa, la validación se hace en la API
        return true;
    },
    
    /**
     * Manejar login exitoso
     */
    handleSuccessfulLogin(data) {
        const user = data.user;
        
        // Guardar sesión
        const sessionData = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                permissions: user.permissions
            },
            token: data.token,
            timestamp: Date.now(),
            expires: new Date(data.expires_at).getTime()
        };
        
        localStorage.setItem('libreria_session', JSON.stringify(sessionData));
        
        // Resetear intentos
        this.attempts = 0;
        localStorage.removeItem('login_attempts');
        
        // Mostrar éxito
        this.showToast(`¡Bienvenido, ${user.name}!`, 'success');
        
        // Animar salida y redirigir
        setTimeout(() => {
            this.animateExit(() => {
                this.redirectToApp();
            });
        }, 1000);
    },
    
    /**
     * Manejar login fallido
     */
    handleFailedLogin(message = 'Credenciales inválidas') {
        this.attempts++;
        const remainingAttempts = this.maxAttempts - this.attempts;
        
        // Guardar intentos en localStorage
        localStorage.setItem('login_attempts', JSON.stringify({
            count: this.attempts,
            timestamp: Date.now()
        }));
        
        if (remainingAttempts > 0) {
            this.showToast(
                `${message}. Te quedan ${remainingAttempts} intentos.`, 
                'warning'
            );
            this.shakeForm();
        } else {
            // BLOQUEO DESHABILITADO - Solo mostrar mensaje
            this.showToast('Demasiados intentos fallidos. Intenta nuevamente.', 'warning');
            this.shakeForm();
            // Resetear intentos para permitir más intentos
            this.attempts = 0;
            localStorage.removeItem('login_attempts');
        }
    },
    
    /**
     * Verificar estado de lockout (DESHABILITADO)
     */
    checkLockoutStatus() {
        // BLOQUEO DESHABILITADO - Limpiar cualquier bloqueo existente
        localStorage.removeItem('account_lockout');
        localStorage.removeItem('login_attempts');
        this.attempts = 0;
        
        // Cargar intentos previos
        const attempts = localStorage.getItem('login_attempts');
        if (attempts) {
            const data = JSON.parse(attempts);
            // Resetear intentos después de 1 hora
            if (Date.now() - data.timestamp > 60 * 60 * 1000) {
                localStorage.removeItem('login_attempts');
                this.attempts = 0;
            } else {
                this.attempts = data.count;
            }
        }
    },
    
    /**
     * Verificar si está bloqueado (DESHABILITADO)
     */
    isLockedOut() {
        // BLOQUEO DESHABILITADO - Nunca devolver true
        return false;
    },
    
    /**
     * Deshabilitar formulario
     */
    disableForm() {
        this.emailInput.disabled = true;
        this.passwordInput.disabled = true;
        this.submitButton.disabled = true;
        this.form.classList.add('opacity-50');
    },
    
    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        const session = localStorage.getItem('libreria_session');
        if (!session) return false;
        
        try {
            const data = JSON.parse(session);
            return Date.now() < data.expires;
        } catch {
            return false;
        }
    },
    
    /**
     * Redirigir a aplicación principal
     */
    redirectToApp() {
        window.location.href = 'index.html';
    },
    
    /**
     * Establecer estado de loading
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.buttonText.textContent = 'Validando...';
            this.loadingSpinner.classList.remove('hidden');
            this.submitButton.disabled = true;
        } else {
            this.buttonText.textContent = 'Iniciar Sesión';
            this.loadingSpinner.classList.add('hidden');
            this.submitButton.disabled = false;
        }
    },
    
    /**
     * Animar formulario (shake)
     */
    shakeForm() {
        this.form.querySelector('.bg-white').classList.add('shake');
        setTimeout(() => {
            this.form.querySelector('.bg-white').classList.remove('shake');
        }, 500);
    },
    
    /**
     * Animar salida
     */
    animateExit(callback) {
        const container = document.querySelector('.max-w-md');
        container.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        container.style.opacity = '0';
        container.style.transform = 'translateY(-30px) scale(0.95)';
        
        setTimeout(callback, 500);
    },
    
    /**
     * Mostrar toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
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
    },
    
    /**
     * Utility: Delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    LoginApp.init();
});

// ===== EXPORTAR PARA USO GLOBAL =====
window.LoginApp = LoginApp;