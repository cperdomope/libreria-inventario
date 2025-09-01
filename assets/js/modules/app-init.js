/**
 * LIBRERÍA DIGITAL - INICIALIZACIÓN DE APLICACIÓN
 * Archivo: assets/js/app-init.js
 * Descripción: Inicialización y configuración específica de la página principal
 */

// ===== CONFIGURACIÓN INICIAL =====
document.addEventListener('DOMContentLoaded', function() {
    // NO ejecutar app-init en la página de login
    if (window.location.pathname.includes('login.html')) {
        console.log('🚫 app-init.js: Evitando ejecución en página de login');
        return;
    }
    
    console.log('Inicializando aplicación...');
    
    // VERIFICACIÓN TOLERANTE DE SESIÓN
    const sessionData = localStorage.getItem('libreria_session');
    const authToken = localStorage.getItem('auth_token') || localStorage.getItem('user_token');
    
    console.log('🔍 Verificando sesión...');
    console.log('- Session data:', !!sessionData);
    console.log('- Auth token:', !!authToken);
    
    // Solo redirigir si NO HAY NADA de sesión
    if (!sessionData && !authToken) {
        console.log('❌ Sin datos de sesión, redirigiendo al login');
        window.location.href = 'login.html';
        return;
    }
    
    // Si hay sessionData, verificar su validez
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            console.log('✅ Sesión válida para:', session.user?.name || session.user?.email || 'Usuario');
            
            // Solo redirigir si la sesión está REALMENTE expirada (más de 24 horas)
            if (session.expires && Date.now() > (session.expires + 60000)) { // +1 minuto de gracia
                console.log('⏰ Sesión expirada, redirigiendo al login');
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            
        } catch (error) {
            console.warn('⚠️ Error al parsear sesión, pero continuando:', error);
            // No redirigir por errores de parsing si hay token
            if (!authToken) {
                console.log('❌ Sin token alternativo, redirigiendo al login');
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
        }
    }
    
    // Inicializar navegación usando NavigationManager
    if (window.NavigationManager) {
        NavigationManager.init();
    }
    
    // Inicializar módulos de la aplicación
    initializeAppModules();
    
    // Inicializar eventos de UI
    initUIEvents();
    
    console.log('Aplicación inicializada correctamente');
});

// ===== INICIALIZACIÓN DE MÓDULOS =====
/**
 * Inicializar todos los módulos de la aplicación
 */
async function initializeAppModules() {
    console.log('🔧 Inicializando módulos de la aplicación...');
    
    try {
        // Esperar a que los elementos DOM estén listos
        await waitForDOM();
        
        // Inicializar módulo de inventario
        if (window.InventoryManager && typeof InventoryManager.init === 'function') {
            console.log('📚 Inicializando módulo de inventario...');
            await InventoryManager.init();
        }
        
        // Inicializar módulo de ventas
        if (window.SalesManager && typeof SalesManager.init === 'function') {
            console.log('🛒 Inicializando módulo de ventas...');
            await SalesManager.init();
        }
        
        // Inicializar módulo de usuarios
        if (window.UsersManager && typeof UsersManager.init === 'function') {
            console.log('👥 Inicializando módulo de usuarios...');
            await UsersManager.init();
        }
        
        // Escuchar cambios de sección para inicializar módulos específicos
        document.addEventListener('sectionChanged', handleSectionChange);
        
        console.log('✅ Todos los módulos inicializados exitosamente');
        
    } catch (error) {
        console.error('❌ Error inicializando módulos:', error);
    }
}

/**
 * Manejar cambios de sección
 */
function handleSectionChange(event) {
    const section = event.detail.section;
    
    switch (section) {
        case 'sales':
            // Actualizar datos de ventas cuando se accede a la sección
            if (window.SalesManager && SalesManager.isInitialized) {
                SalesManager.loadSales();
            }
            break;
        case 'inventory':
            // Actualizar datos de inventario cuando se accede a la sección
            if (window.InventoryManager && InventoryManager.isInitialized) {
                InventoryManager.loadBooks();
            }
            break;
    }
}

/**
 * Esperar a que el DOM esté completamente cargado
 */
function waitForDOM() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });
}

// ===== NAVEGACIÓN DE LA APLICACIÓN =====
const AppNavigation = {
    // Elementos DOM
    navLinks: null,
    contentSections: null,
    sidebarToggle: null,
    sidebar: null,
    sidebarOverlay: null,
    
    /**
     * Inicializar sistema de navegación
     */
    init() {
        // Obtener elementos DOM
        this.navLinks = document.querySelectorAll('.nav-link');
        this.contentSections = document.querySelectorAll('.content-section');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        
        // Configurar eventos
        this.setupNavigationEvents();
        this.setupMobileEvents();
        this.setupResponsiveEvents();
    },
    
    /**
     * Configurar eventos de navegación
     */
    setupNavigationEvents() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const sectionName = link.getAttribute('data-section');
                this.navigateToSection(sectionName);
            });
        });
    },
    
    /**
     * Configurar eventos móviles
     */
    setupMobileEvents() {
        // Toggle del sidebar móvil
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }
        
        // Cerrar sidebar al hacer click en overlay
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }
    },
    
    /**
     * Configurar eventos responsive
     */
    setupResponsiveEvents() {
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                this.closeMobileSidebar();
            }
        });
    },
    
    /**
     * Navegar a una sección específica
     */
    navigateToSection(sectionName) {
        // Actualizar estado de navegación
        this.updateActiveNavLink(sectionName);
        
        // Mostrar sección correspondiente
        this.showSection(sectionName);
        
        // Cerrar sidebar móvil si está abierto
        if (window.innerWidth < 1024) {
            this.closeMobileSidebar();
        }
        
        // Emitir evento personalizado
        this.emitNavigationEvent(sectionName);
    },
    
    /**
     * Actualizar enlace activo en la navegación
     */
    updateActiveNavLink(sectionName) {
        // Remover clases activas de todos los enlaces
        this.navLinks.forEach(link => {
            link.classList.remove('bg-indigo-50', 'text-indigo-600');
            link.classList.add('text-gray-700');
        });
        
        // Agregar clase activa al enlace seleccionado
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('bg-indigo-50', 'text-indigo-600');
            activeLink.classList.remove('text-gray-700');
        }
    },
    
    /**
     * Mostrar sección específica
     */
    showSection(sectionName) {
        const targetSectionId = `${sectionName}-section`;
        
        // Ocultar todas las secciones
        this.contentSections.forEach(section => {
            section.classList.remove('active');
            section.classList.remove('slide-in');
        });
        
        // Mostrar sección objetivo con animación
        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.classList.add('slide-in');
        } else {
            console.warn(`Sección ${targetSectionId} no encontrada`);
        }
    },
    
    /**
     * Toggle sidebar móvil
     */
    toggleMobileSidebar() {
        if (this.sidebar && this.sidebarOverlay) {
            this.sidebar.classList.toggle('-translate-x-full');
            this.sidebarOverlay.classList.toggle('hidden');
        }
    },
    
    /**
     * Cerrar sidebar móvil
     */
    closeMobileSidebar() {
        if (this.sidebar && this.sidebarOverlay) {
            this.sidebar.classList.add('-translate-x-full');
            this.sidebarOverlay.classList.add('hidden');
        }
    },
    
    /**
     * Emitir evento de navegación personalizado
     */
    emitNavigationEvent(sectionName) {
        const event = new CustomEvent('sectionChanged', {
            detail: { section: sectionName }
        });
        document.dispatchEvent(event);
    }
};

// ===== EVENTOS DE UI =====
function initUIEvents() {
    // Animaciones de hover para tarjetas
    initCardHoverEffects();
    
    // Eventos de búsqueda
    initSearchEvents();
    
    // Otros eventos de UI
    initOtherUIEvents();
}

/**
 * Inicializar efectos de hover para tarjetas
 */
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.card-hover');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

/**
 * Inicializar eventos de búsqueda
 */
function initSearchEvents() {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            handleSearch(query);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                handleSearchSubmit(query);
            }
        });
    }
}

/**
 * Manejar búsqueda en tiempo real
 */
function handleSearch(query) {
    if (query.length > 2) {
        console.log(`Buscando: ${query}`);
        // Implementar lógica de búsqueda
    }
}

/**
 * Manejar envío de búsqueda
 */
function handleSearchSubmit(query) {
    if (query) {
        console.log(`Búsqueda enviada: ${query}`);
        // Implementar navegación a resultados de búsqueda
    }
}

/**
 * Inicializar otros eventos de UI
 */
function initOtherUIEvents() {
    // Manejar clicks en notificaciones
    const notificationBell = document.querySelector('.notification-badge');
    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            console.log('Notificaciones clicked');
            // Implementar panel de notificaciones
        });
    }
    
    // Manejar modal de usuarios
    initUserModalEvents();
    
    // Manejar eventos de teclado globales
    document.addEventListener('keydown', (e) => {
        handleGlobalKeyboard(e);
    });
}

/**
 * Inicializar eventos del modal de usuario
 */
function initUserModalEvents() {
    const modal = document.getElementById('user-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            if (window.UsersManager) {
                UsersManager.hideModal();
            }
        });
    }
    
    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', () => {
            if (window.UsersManager) {
                UsersManager.hideModal();
            }
        });
    }
    
    // Cerrar modal al hacer clic fuera de él
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal && window.UsersManager) {
                UsersManager.hideModal();
            }
        });
    }
}

/**
 * Manejar eventos de teclado globales
 */
function handleGlobalKeyboard(event) {
    // Cerrar sidebar con Escape
    if (event.key === 'Escape') {
        AppNavigation.closeMobileSidebar();
    }
    
    // Navegación con teclas numéricas
    if (event.altKey && event.key >= '1' && event.key <= '6') {
        event.preventDefault();
        const sectionIndex = parseInt(event.key) - 1;
        const sections = ['dashboard', 'inventory', 'stock', 'sales', 'reports', 'users'];
        const targetSection = sections[sectionIndex];
        
        if (targetSection) {
            AppNavigation.navigateToSection(targetSection);
        }
    }
}

/**
 * Inicializar sección por defecto
 */
function initDefaultSection() {
    // Obtener sección de URL o usar dashboard por defecto
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') || 'dashboard';
    
    // Navegar a la sección inicial
    AppNavigation.navigateToSection(section);
}

// ===== UTILIDADES =====

/**
 * Esperar a que un elemento esté disponible en el DOM
 */
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Elemento ${selector} no encontrado después de ${timeout}ms`));
        }, timeout);
    });
}

/**
 * Debounce function para optimizar eventos
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar para uso global
window.AppNavigation = AppNavigation;
window.waitForElement = waitForElement;
window.debounce = debounce;