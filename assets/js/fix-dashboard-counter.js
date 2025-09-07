/**
 * FIX DASHBOARD COUNTER - Actualización directa del contador de stock
 * Este script actualiza directamente el contador del dashboard sin depender del sistema complejo
 */

(function() {
    'use strict';
    
    console.log('🔧 Fix Dashboard Counter cargado');
    
    // Función para actualizar el contador de libros directamente
    async function updateBookCounter() {
        try {
            console.log('📊 Obteniendo total de stock desde API...');
            
            // Obtener el total de stock desde la API
            const response = await fetch('api_dashboard_simple.php');
            const result = await response.json();
            
            if (result.success && result.data && result.data.totalBooks !== undefined) {
                const totalStock = result.data.totalBooks;
                console.log('✅ Total de stock obtenido:', totalStock);
                
                // Actualizar directamente el elemento HTML
                const bookCounterElement = document.getElementById('total-books');
                if (bookCounterElement) {
                    // Animar el cambio de número
                    animateValue(bookCounterElement, parseInt(bookCounterElement.textContent.replace(/,/g, '')) || 0, totalStock, 1000);
                    console.log('✅ Contador actualizado en el DOM');
                } else {
                    console.error('❌ No se encontró el elemento #total-books');
                }
                
                return totalStock;
            } else {
                throw new Error('API no devolvió datos válidos');
            }
            
        } catch (error) {
            console.error('❌ Error actualizando contador:', error);
            
            // Fallback: intentar con la API de books
            try {
                console.log('🔄 Intentando con API de libros como fallback...');
                const response = await fetch('api/books.php?action=total_stock');
                const result = await response.json();
                
                if (result.success && result.total_stock !== undefined) {
                    const totalStock = result.total_stock;
                    console.log('✅ Total de stock desde API books:', totalStock);
                    
                    const bookCounterElement = document.getElementById('total-books');
                    if (bookCounterElement) {
                        animateValue(bookCounterElement, parseInt(bookCounterElement.textContent.replace(/,/g, '')) || 0, totalStock, 1000);
                        console.log('✅ Contador actualizado (fallback)');
                    }
                    
                    return totalStock;
                }
            } catch (fallbackError) {
                console.error('❌ Error en fallback:', fallbackError);
            }
            
            // Si todo falla, al menos mostrar que hay un error
            const bookCounterElement = document.getElementById('total-books');
            if (bookCounterElement && bookCounterElement.textContent.includes('2,547')) {
                bookCounterElement.textContent = 'Error';
                bookCounterElement.style.color = 'red';
                console.log('❌ Marcando como error');
            }
        }
    }
    
    // Función para animar el cambio de valor
    function animateValue(element, start, end, duration) {
        if (start === end) {
            element.textContent = formatNumber(end);
            return;
        }
        
        const range = end - start;
        const minTimer = 50;
        const stepTime = Math.abs(Math.floor(duration / range));
        const timer = Math.max(stepTime, minTimer);
        
        const startTime = new Date().getTime();
        const endTime = startTime + duration;
        
        function run() {
            const now = new Date().getTime();
            const remaining = Math.max((endTime - now) / duration, 0);
            const value = Math.round(end - (remaining * range));
            
            element.textContent = formatNumber(value);
            
            if (value !== end) {
                setTimeout(run, timer);
            } else {
                element.textContent = formatNumber(end);
            }
        }
        
        run();
    }
    
    // Función para formatear números con comas
    function formatNumber(num) {
        return num.toLocaleString();
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(updateBookCounter, 500); // Pequeño delay para asegurar que todo esté cargado
        });
    } else {
        // DOM ya está listo
        setTimeout(updateBookCounter, 500);
    }
    
    // Exponer función globalmente para uso manual
    window.fixDashboardCounter = updateBookCounter;
    
    console.log('🔧 Fix Dashboard Counter inicializado. Use fixDashboardCounter() para actualizar manualmente.');
    
})();