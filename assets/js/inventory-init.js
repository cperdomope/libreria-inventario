/**
 * LIBRERÍA DIGITAL - INICIALIZACIÓN DE INVENTARIO
 * Archivo: assets/js/inventory-init.js
 * Descripción: Inicialización específica para la sección de inventario
 */

// Función para inicializar inventario cuando el DOM esté listo
function initializeInventory() {
    console.log('🔄 Inicializando sistema de inventario...');
    
    // Verificar si estamos en la página correcta
    const inventorySection = document.getElementById('inventory-section');
    if (!inventorySection) {
        console.warn('⚠️ Sección de inventario no encontrada');
        return;
    }
    
    // Verificar que el InventoryManager esté disponible
    if (!window.InventoryManager) {
        console.error('❌ InventoryManager no está disponible');
        return;
    }
    
    // Inicializar cuando la sección sea visible
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id === 'inventory-section' && target.classList.contains('active')) {
                    console.log('✅ Sección de inventario activa, inicializando...');
                    setTimeout(() => {
                        window.InventoryManager.init().then(() => {
                            console.log('✅ InventoryManager inicializado correctamente');
                        }).catch((error) => {
                            console.error('❌ Error inicializando InventoryManager:', error);
                        });
                    }, 100);
                }
            }
        });
    });
    
    observer.observe(inventorySection, { 
        attributes: true, 
        attributeFilter: ['class'] 
    });
    
    // También inicializar si la sección ya está activa
    if (inventorySection.classList.contains('active')) {
        console.log('✅ Sección de inventario ya activa, inicializando inmediatamente...');
        setTimeout(() => {
            window.InventoryManager.init().then(() => {
                console.log('✅ InventoryManager inicializado correctamente');
            }).catch((error) => {
                console.error('❌ Error inicializando InventoryManager:', error);
            });
        }, 100);
    }
}

// NO ejecutar en la página de login
if (window.location.pathname.includes('login.html')) {
    console.log('🚫 inventory-init.js: Evitando ejecución en página de login');
} else {
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeInventory);
    } else {
        initializeInventory();
    }
}

// También intentar inicializar después de un delay para asegurar que todo esté cargado
setTimeout(() => {
    // NO ejecutar en la página de login
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    if (window.InventoryManager && !window.InventoryManager.state.isInitialized) {
        console.log('🔄 Intento de inicialización tardía del inventario...');
        const inventorySection = document.getElementById('inventory-section');
        if (inventorySection && inventorySection.classList.contains('active')) {
            window.InventoryManager.init().catch(console.error);
        }
    }
}, 2000);