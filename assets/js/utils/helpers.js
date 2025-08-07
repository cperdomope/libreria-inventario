/**
 * LIBRERÍA DIGITAL - UTILIDADES Y HELPERS
 * Archivo: assets/js/utils/helpers.js
 * Descripción: Funciones utilitarias reutilizables
 */

// ===== UTILITARIOS DE FORMATEO =====

/**
 * Formatear números como moneda
 */
function formatCurrency(amount, currency = 'COP') {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Formatear fechas
 */
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Date(date).toLocaleDateString('es-CO', {
        ...defaultOptions,
        ...options
    });
}

/**
 * Formatear fecha relativa (hace X tiempo)
 */
function formatRelativeDate(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInMs = now.getTime() - targetDate.getTime();
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
        return 'Ahora mismo';
    } else if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
        return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 7) {
        return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    } else {
        return formatDate(date, { month: 'short', day: 'numeric' });
    }
}

/**
 * Formatear números grandes (1K, 1M, etc.)
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ===== UTILITARIOS DE VALIDACIÓN =====

/**
 * Validar email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validar teléfono colombiano
 */
function isValidPhone(phone) {
    // Formato: +57 XXX XXX XXXX o XXX XXX XXXX
    const phoneRegex = /^(\+57\s?)?[3][0-9]{2}\s?[0-9]{3}\s?[0-9]{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validar ISBN
 */
function isValidISBN(isbn) {
    // ISBN-10 o ISBN-13
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    const isbn10Regex = /^[0-9]{9}[0-9X]$/;
    const isbn13Regex = /^978[0-9]{10}$/;
    
    return isbn10Regex.test(cleanISBN) || isbn13Regex.test(cleanISBN);
}

/**
 * Validar formato de precio
 */
function isValidPrice(price) {
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    return priceRegex.test(price) && parseFloat(price) >= 0;
}

// ===== UTILITARIOS DE TEXTO =====

/**
 * Sanitizar HTML
 */
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Truncar texto
 */
function truncateText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Convertir a slug (URL amigable)
 */
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9 -]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, '-') // Espacios a guiones
        .replace(/-+/g, '-') // Múltiples guiones a uno
        .trim('-'); // Remover guiones al inicio/final
}

/**
 * Capitalizar primera letra
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalizar cada palabra
 */
function titleCase(str) {
    return str.split(' ').map(capitalize).join(' ');
}

// ===== UTILITARIOS DE ARRAY Y OBJETO =====

/**
 * Generar ID único
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Generar UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Clonar objeto profundo
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const cloned = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

/**
 * Comparar objetos profundo
 */
function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
}

/**
 * Ordenar array de objetos por propiedad
 */
function sortBy(array, property, direction = 'asc') {
    return array.sort((a, b) => {
        const aVal = a[property];
        const bVal = b[property];
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// ===== UTILITARIOS DE DOM =====

/**
 * Esperar a que un elemento esté disponible
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
 * Crear elemento con atributos
 */
function createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className' || key === 'class') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    if (textContent) {
        element.textContent = textContent;
    }
    
    return element;
}

// ===== UTILITARIOS DE PERFORMANCE =====

/**
 * Debounce function
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

/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== UTILITARIOS DE ALMACENAMIENTO =====

/**
 * Guardar en localStorage con manejo de errores
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
        return false;
    }
}

/**
 * Cargar desde localStorage con manejo de errores
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error cargando desde localStorage:', error);
        return defaultValue;
    }
}

// ===== EXPORTACIÓN =====

// Crear objeto global con todas las utilidades
window.Utils = {
    // Formateo
    formatCurrency,
    formatDate,
    formatRelativeDate,
    formatNumber,
    
    // Validación
    isValidEmail,
    isValidPhone,
    isValidISBN,
    isValidPrice,
    
    // Texto
    sanitizeHTML,
    truncateText,
    slugify,
    capitalize,
    titleCase,
    
    // Array y objeto
    generateId,
    generateUUID,
    deepClone,
    deepEqual,
    sortBy,
    
    // DOM
    waitForElement,
    createElement,
    
    // Performance
    debounce,
    throttle,
    
    // Almacenamiento
    saveToStorage,
    loadFromStorage
};

// También exportar funciones individuales para uso directo
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.debounce = debounce;
window.throttle = throttle;