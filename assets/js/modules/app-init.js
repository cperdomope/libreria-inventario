/**
 * LIBRERÍA DIGITAL - INICIALIZACIÓN DE APLICACIÓN
 * Archivo: assets/js/app-init.js
 * Descripción: Inicialización y configuración específica de la página principal
 */

// ===== CONFIGURACIÓN INICIAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando aplicación...');
    
    // Inicializar sistema de autenticación PRIMERO
    if (window.AuthSystem) {
        const isAuthenticated = AuthSystem.init();
        if (!isAuthenticated) {
            return; // Si no está autenticado, se redirige al login
        }
    } else {
        console.error('Sistema de autenticación no disponible');
        window.location.href = 'login.html';
        return;
    }
    
    // Inicializar navegación usando NavigationManager
    if (window.NavigationManager) {
        NavigationManager.init();
    }
    
    // Inicializar eventos de UI
    initUIEvents();
    
    console.log('Aplicación inicializada correctamente');
});

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
    
    // Manejar eventos de teclado globales
    document.addEventListener('keydown', (e) => {
        handleGlobalKeyboard(e);
    });
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