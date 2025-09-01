/**
 * LIBRERÍA DIGITAL - LOGIN SYSTEM (FIXED VERSION)
 * Descripción: Sistema de login que FUNCIONA sin interferencias
 */

// ===== CONFIGURACIÓN =====
const API_AUTH_URL = 'api/auth.php';
const MAX_ATTEMPTS = 3;

// ===== ELEMENTOS DOM =====
let loginForm, emailInput, passwordInput, submitButton, buttonText, loadingSpinner;
let messageContainer, attemptsCounter, lockoutTimer;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando sistema de login...');
    
    // Obtener elementos
    loginForm = document.getElementById('loginForm');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    submitButton = document.getElementById('loginButton') || loginForm.querySelector('button[type="submit"]');
    buttonText = document.getElementById('buttonText');
    loadingSpinner = document.getElementById('loadingSpinner');
    messageContainer = document.getElementById('login-messages');
    attemptsCounter = document.getElementById('attempts-counter');
    lockoutTimer = document.getElementById('lockout-timer');
    
    // Configurar eventos
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Toggle password
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        console.log('👁️ Botón de toggle password encontrado');
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            console.log(`👁️ Contraseña ${type === 'text' ? 'mostrada' : 'oculta'}`);
            
            const eyeIcon = document.getElementById('eyeIcon');
            if (eyeIcon) {
                eyeIcon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    } else {
        console.warn('⚠️ Botón de toggle password NO encontrado');
    }
    
    console.log('✅ Sistema de login inicializado');
});

// ===== FUNCIÓN PARA MOSTRAR MENSAJES =====
function showMessage(message, type = 'error') {
    console.log(`📢 MOSTRANDO MENSAJE: "${message}" (${type})`);
    
    if (!messageContainer) {
        console.error('❌ No se encontró messageContainer');
        alert(message); // Fallback
        return;
    }
    
    // Limpiar mensaje anterior
    clearMessage();
    
    // Iconos
    const icons = {
        error: 'fas fa-exclamation-circle',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        blocked: 'fas fa-ban'
    };
    
    // Crear mensaje
    const messageHTML = `
        <div class="flex items-center justify-between p-4 rounded-lg border-2 ${getMessageClasses(type)}">
            <div class="flex items-center">
                <i class="${icons[type]} mr-3 text-xl"></i>
                <span class="font-semibold text-lg">${message}</span>
            </div>
            <button onclick="clearMessage()" class="ml-4 hover:bg-gray-100 p-2 rounded">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>
    `;
    
    messageContainer.innerHTML = messageHTML;
    messageContainer.classList.remove('hidden');
    
    console.log('✅ Mensaje mostrado correctamente');
    
    // NO AUTO-OCULTAR - El mensaje permanece hasta click manual
}

// ===== FUNCIÓN PARA LIMPIAR MENSAJES =====
function clearMessage() {
    console.log('🧹 Limpiando mensaje');
    if (messageContainer) {
        messageContainer.innerHTML = '';
        messageContainer.classList.add('hidden');
    }
}

// Hacer función global
window.clearMessage = clearMessage;

// ===== OBTENER CLASES DE MENSAJE =====
function getMessageClasses(type) {
    switch(type) {
        case 'error':
            return 'bg-red-50 border-red-300 text-red-800';
        case 'success':
            return 'bg-green-50 border-green-300 text-green-800';
        case 'warning':
            return 'bg-yellow-50 border-yellow-300 text-yellow-800';
        case 'blocked':
            return 'bg-red-100 border-red-500 text-red-900';
        default:
            return 'bg-gray-50 border-gray-300 text-gray-800';
    }
}

// ===== FUNCIÓN DE LOADING =====
function setLoading(isLoading) {
    if (!submitButton || !buttonText) return;
    
    if (isLoading) {
        submitButton.disabled = true;
        buttonText.textContent = 'Validando...';
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    } else {
        submitButton.disabled = false;
        buttonText.textContent = 'Iniciar Sesión';
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}

// ===== FUNCIÓN PRINCIPAL DE LOGIN =====
async function handleLogin(event) {
    event.preventDefault();
    console.log('🔐 Iniciando proceso de login...');
    
    // Limpiar mensajes anteriores
    clearMessage();
    setLoading(true);
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showMessage('Por favor, ingresa tu email y contraseña.', 'warning');
        setLoading(false);
        return;
    }
    
    try {
        console.log('📤 Enviando credenciales al servidor...');
        
        const response = await fetch(API_AUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers.get('Content-Type'));
        
        const responseText = await response.text();
        console.log('📥 Raw response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('📥 Parsed JSON:', data);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            console.error('❌ Raw response text:', responseText);
            throw new Error('Respuesta del servidor no válida');
        }
        
        if (data.success) {
            console.log('🎉 LOGIN EXITOSO!');
            
            // Mostrar mensaje de éxito con información del rol
            const roleDisplayNames = {
                'admin': 'Administrador',
                'inventory': 'Inventario',
                'seller': 'Vendedor',
                'readonly': 'Solo Lectura'
            };
            const roleDisplay = roleDisplayNames[data.user.role] || data.user.role;
            showMessage(`¡Bienvenido ${data.user.name}! (${roleDisplay}) Redirigiendo...`, 'success');
            
            // GUARDAR SESIÓN CORRECTAMENTE
            const sessionData = {
                token: data.token,
                user: data.user,
                permissions: data.permissions, // Incluir permisos
                timestamp: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
            };
            
            console.log('💾 Guardando datos de sesión:', sessionData);
            console.log('🔐 Permisos del usuario:', data.permissions);
            
            // Guardar en TODOS los formatos para máxima compatibilidad
            localStorage.setItem('libreria_session', JSON.stringify(sessionData));
            localStorage.setItem('user_token', data.token);
            localStorage.setItem('auth_token', data.token); // Para compatibilidad con main.js
            localStorage.setItem('user_info', JSON.stringify(data.user));
            localStorage.setItem('user_permissions', JSON.stringify(data.permissions));
            
            console.log('✅ Sesión guardada correctamente');
            
            // Redirigir inmediatamente para evitar problemas de timing
            setTimeout(() => {
                console.log('🚀 Redirigiendo al dashboard...');
                console.log('🔍 Session data guardada:', localStorage.getItem('libreria_session'));
                console.log('🔍 Auth token guardado:', localStorage.getItem('auth_token'));
                console.log('🔍 User token guardado:', localStorage.getItem('user_token'));
                console.log('🔍 User permissions guardadas:', localStorage.getItem('user_permissions'));
                window.location.href = 'index.html';
            }, 500);
            
        } else {
            console.log('❌ Error de login:', data.message);
            
            if (response.status === 429) {
                showMessage(data.message, 'blocked');
                startLockoutTimer(120); // 2 minutos
            } else {
                showMessage(data.message, 'error');
                
                // Mostrar intentos restantes
                const attemptsMatch = data.message.match(/Te quedan (\d+) intento/);
                if (attemptsMatch) {
                    const remaining = parseInt(attemptsMatch[1]);
                    updateAttemptsCounter(remaining);
                }
            }
        }
        
    } catch (error) {
        console.error('💥 Error de conexión:', error);
        showMessage('Error de conexión. Verifica tu internet e inténtalo nuevamente.', 'error');
    } finally {
        setLoading(false);
    }
}

// ===== CONTADOR DE INTENTOS =====
function updateAttemptsCounter(remaining) {
    if (!attemptsCounter) return;
    
    if (remaining < MAX_ATTEMPTS) {
        const attemptsText = document.getElementById('attempts-text');
        if (attemptsText) {
            attemptsText.textContent = `Intentos restantes: ${remaining}`;
        }
        attemptsCounter.classList.remove('hidden');
    }
}

// ===== TEMPORIZADOR DE BLOQUEO =====
function startLockoutTimer(seconds) {
    if (!lockoutTimer) return;
    
    lockoutTimer.classList.remove('hidden');
    submitButton.disabled = true;
    
    let remaining = seconds;
    
    const updateTimer = () => {
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;
        
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
        
        if (remaining <= 0) {
            lockoutTimer.classList.add('hidden');
            submitButton.disabled = false;
            clearMessage();
            return;
        }
        
        remaining--;
        setTimeout(updateTimer, 1000);
    };
    
    updateTimer();
}

console.log('📄 login.js cargado completamente');