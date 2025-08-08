/**
 * LIBRERÍA DIGITAL - OBSERVADOR DE SECCIONES
 * Archivo: assets/js/modules/section-observer.js
 * Descripción: Detecta cambios de sección y inicializa módulos apropiados
 */

class SectionObserver {
    constructor() {
        this.currentSection = null;
        this.observers = new Map();
        this.init();
    }
    
    init() {
        console.log('🔍 Inicializando SectionObserver...');
        
        // Detectar sección actual por URL
        this.detectCurrentSection();
        
        // Observar cambios de hash en la URL
        window.addEventListener('hashchange', () => {
            this.detectCurrentSection();
        });
        
        // Observar cambios en los parámetros de la URL
        window.addEventListener('popstate', () => {
            this.detectCurrentSection();
        });
        
        // Observar clics en navegación
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-section]');
            if (navLink) {
                const section = navLink.getAttribute('data-section');
                setTimeout(() => this.handleSectionChange(section), 100);
            }
        });
        
        // Observar cambios en las clases de las secciones
        this.observeDOM();
        
        console.log('✅ SectionObserver inicializado');
    }
    
    detectCurrentSection() {
        // Verificar URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sectionParam = urlParams.get('section');
        
        if (sectionParam) {
            this.handleSectionChange(sectionParam);
            return;
        }
        
        // Verificar hash
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            this.handleSectionChange(hash);
            return;
        }
        
        // Detectar sección visible
        const sections = document.querySelectorAll('.content-section');
        for (const section of sections) {
            if (!section.classList.contains('hidden')) {
                const sectionId = section.id.replace('-section', '');
                this.handleSectionChange(sectionId);
                break;
            }
        }
    }
    
    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('content-section')) {
                        const sectionId = target.id.replace('-section', '');
                        if (!target.classList.contains('hidden')) {
                            this.handleSectionChange(sectionId);
                        }
                    }
                }
            });
        });
        
        // Observar todas las secciones
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            observer.observe(section, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
    }
    
    handleSectionChange(section) {
        if (this.currentSection === section) {
            return; // No cambió la sección
        }
        
        console.log(`📱 Cambio de sección: ${this.currentSection} → ${section}`);
        this.currentSection = section;
        
        // Inicializar módulos específicos de la sección
        this.initSectionModules(section);
    }
    
    initSectionModules(section) {
        switch (section) {
            case 'users':
                console.log('👥 Inicializando módulos de usuarios...');
                this.initUserManagement();
                break;
                
            case 'inventory':
                console.log('📦 Sección de inventario activa');
                // Aquí se pueden inicializar módulos de inventario
                break;
                
            case 'sales':
                console.log('💰 Sección de ventas activa');
                // Aquí se pueden inicializar módulos de ventas
                break;
                
            default:
                console.log(`📄 Sección ${section} activa`);
        }
    }
    
    initUserManagement() {
        // Esperar un poco para que el DOM se actualice
        setTimeout(() => {
            if (window.UserManager && !window.UserManager.isInitialized) {
                console.log('🚀 Iniciando UserManager desde SectionObserver');
                window.UserManager.init();
            } else if (window.initUserManager) {
                console.log('🚀 Usando función de inicialización manual');
                window.initUserManager();
            } else {
                console.log('⚠️ UserManager no está disponible');
            }
        }, 200);
    }
    
    // Método para registrar observadores personalizados
    registerSectionObserver(section, callback) {
        if (!this.observers.has(section)) {
            this.observers.set(section, []);
        }
        this.observers.get(section).push(callback);
    }
}

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    window.sectionObserver = new SectionObserver();
});

// Hacer disponible globalmente
window.SectionObserver = SectionObserver;