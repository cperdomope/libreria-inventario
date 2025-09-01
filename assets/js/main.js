/**
 * LIBRERÍA DIGITAL - SISTEMA DE INVENTARIO
 * Archivo: assets/js/main.js
 * Descripción: Funcionalidad principal del sistema
 */

// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
  // API Configuration
  API_BASE_URL: "https://api.libreria-digital.com",
  API_TIMEOUT: 5000,

  // UI Configuration
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 4000,
  DEBOUNCE_DELAY: 300,

  // Pagination
  ITEMS_PER_PAGE: 10,

  // Local Storage Keys
  STORAGE_KEYS: {
    USER_PREFERENCES: "libreria_user_preferences",
    THEME: "libreria_theme",
    LANGUAGE: "libreria_language",
  },
};

// ===== ESTADO GLOBAL DE LA APLICACIÓN =====
const AppState = {
  currentSection: "dashboard",
  user: null,
  notifications: [],
  isLoading: false,
  isMobile: false,
  theme: "light",
};

// ===== UTILIDADES =====
const Utils = {
  /**
   * Debounce function para optimizar búsquedas
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Formatear números como moneda
   */
  formatCurrency(amount, currency = "USD") {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency === "USD" ? "COP" : currency,
    }).format(amount);
  },

  /**
   * Formatear fechas
   */
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(date).toLocaleDateString("es-CO", {
      ...defaultOptions,
      ...options,
    });
  },

  /**
   * Generar ID único
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  },

  /**
   * Validar email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Sanitizar HTML
   */
  sanitizeHTML(str) {
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerHTML;
  },
};

// ===== MANEJO DE NOTIFICACIONES =====
const NotificationManager = {
  /**
   * Mostrar notificación toast - SOLO para notificaciones del sistema, NO para login
   */
  showToast(message, type = "info", duration = CONFIG.TOAST_DURATION) {
    // NO mostrar toasts si estamos en la página de login
    if (window.location.pathname.includes('login.html')) {
      return;
    }
    
    const toast = this.createToast(message, type);
    const container = document.getElementById("toastContainer");

    if (!container) {
      console.warn("Toast container no encontrado");
      return;
    }

    container.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
      toast.classList.add("toast-enter");
    }, 10);

    // Remover automáticamente SOLO para toasts del sistema
    setTimeout(() => {
      this.removeToast(toast);
    }, duration);

    return toast;
  },

  /**
   * Crear elemento toast
   */
  createToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)} toast-icon"></i>
                <span class="toast-message">${Utils.sanitizeHTML(
                  message
                )}</span>
                <button class="toast-close" onclick="NotificationManager.removeToast(this.parentElement.parentElement)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    return toast;
  },

  /**
   * Obtener icono según tipo de notificación
   */
  getToastIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  },

  /**
   * Remover toast
   */
  removeToast(toast) {
    toast.classList.add("toast-exit");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, CONFIG.ANIMATION_DURATION);
  },

  /**
   * Actualizar badge de notificaciones
   */
  updateNotificationBadge(count) {
    const badge = document.querySelector(".notification-badge");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
  },
};

// ===== MANEJO DE CARGA =====
const LoadingManager = {
  /**
   * Mostrar spinner de carga
   */
  show(message = "Cargando...") {
    AppState.isLoading = true;
    const spinner = document.getElementById("loadingSpinner");
    if (spinner) {
      spinner.classList.remove("hidden");
      spinner.classList.add("fade-enter");
    }
  },

  /**
   * Ocultar spinner de carga
   */
  hide() {
    AppState.isLoading = false;
    const spinner = document.getElementById("loadingSpinner");
    if (spinner) {
      spinner.classList.add("fade-exit");
      setTimeout(() => {
        spinner.classList.add("hidden");
        spinner.classList.remove("fade-enter", "fade-exit");
      }, CONFIG.ANIMATION_DURATION);
    }
  },
};

// ===== MANEJO DE DATOS =====
const DataManager = {
  /**
   * Realizar petición API
   */
  async apiRequest(endpoint, options = {}) {
    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      timeout: CONFIG.API_TIMEOUT,
    };

    const config = { ...defaultOptions, ...options };

    try {
      LoadingManager.show();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      NotificationManager.showToast(
        "Error al conectar con el servidor",
        "error"
      );
      throw error;
    } finally {
      LoadingManager.hide();
    }
  },

  /**
   * Obtener token de autenticación
   */
  getAuthToken() {
    return localStorage.getItem("auth_token") || "";
  },

  /**
   * Guardar en localStorage
   */
  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  },

  /**
   * Cargar desde localStorage
   */
  loadFromStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return defaultValue;
    }
  },
};

// ===== MANEJO DE FORMULARIOS =====
const FormManager = {
  /**
   * Validar formulario
   */
  validateForm(formElement) {
    const fields = formElement.querySelectorAll("[required]");
    let isValid = true;
    const errors = [];

    fields.forEach((field) => {
      const value = field.value.trim();
      const fieldName = field.getAttribute("name") || field.getAttribute("id");

      // Validación de campos requeridos
      if (!value) {
        this.showFieldError(field, "Este campo es obligatorio");
        isValid = false;
        errors.push(`${fieldName} es obligatorio`);
        return;
      }

      // Validaciones específicas por tipo
      switch (field.type) {
        case "email":
          if (!Utils.isValidEmail(value)) {
            this.showFieldError(field, "Email inválido");
            isValid = false;
            errors.push(`${fieldName} debe ser un email válido`);
          }
          break;

        case "number":
          const min = parseFloat(field.getAttribute("min"));
          const max = parseFloat(field.getAttribute("max"));
          const numValue = parseFloat(value);

          if (isNaN(numValue)) {
            this.showFieldError(field, "Debe ser un número válido");
            isValid = false;
            errors.push(`${fieldName} debe ser un número válido`);
          } else {
            if (!isNaN(min) && numValue < min) {
              this.showFieldError(field, `Valor mínimo: ${min}`);
              isValid = false;
            }
            if (!isNaN(max) && numValue > max) {
              this.showFieldError(field, `Valor máximo: ${max}`);
              isValid = false;
            }
          }
          break;
      }

      // Limpiar error si el campo es válido
      if (isValid) {
        this.clearFieldError(field);
      }
    });

    return { isValid, errors };
  },

  /**
   * Mostrar error en campo
   */
  showFieldError(field, message) {
    field.classList.add("field-error");

    // Remover mensaje de error anterior
    const existingError = field.parentNode.querySelector(
      ".field-error-message"
    );
    if (existingError) {
      existingError.remove();
    }

    // Agregar nuevo mensaje de error
    const errorElement = document.createElement("div");
    errorElement.className = "field-error-message";
    errorElement.textContent = message;
    field.parentNode.appendChild(errorElement);
  },

  /**
   * Limpiar error de campo
   */
  clearFieldError(field) {
    field.classList.remove("field-error");
    const errorMessage = field.parentNode.querySelector(".field-error-message");
    if (errorMessage) {
      errorMessage.remove();
    }
  },

  /**
   * Serializar formulario a objeto
   */
  serializeForm(formElement) {
    const formData = new FormData(formElement);
    const data = {};

    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  },
};

// ===== MANEJO DE TABLAS =====
const TableManager = {
  /**
   * Crear tabla con datos
   */
  createTable(containerId, data, columns, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} no encontrado`);
      return;
    }

    const table = document.createElement("table");
    table.className = "table";

    // Crear header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    columns.forEach((column) => {
      const th = document.createElement("th");
      th.textContent = column.title;
      if (column.sortable) {
        th.classList.add("sortable");
        th.addEventListener("click", () => {
          this.sortTable(table, column.key);
        });
      }
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Crear body
    const tbody = document.createElement("tbody");
    this.populateTableBody(tbody, data, columns);
    table.appendChild(tbody);

    // Limpiar container y agregar tabla
    container.innerHTML = "";
    container.appendChild(table);

    // Agregar paginación si es necesaria
    if (options.pagination && data.length > CONFIG.ITEMS_PER_PAGE) {
      this.addPagination(container, data, columns);
    }
  },

  /**
   * Poblar cuerpo de tabla
   */
  populateTableBody(tbody, data, columns) {
    tbody.innerHTML = "";

    data.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.className = "stagger-item";
      tr.style.animationDelay = `${index * 0.1}s`;

      columns.forEach((column) => {
        const td = document.createElement("td");

        if (column.render) {
          td.innerHTML = column.render(row[column.key], row);
        } else {
          td.textContent = row[column.key] || "";
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  },

  /**
   * Ordenar tabla
   */
  sortTable(table, columnKey) {
    // Implementar lógica de ordenamiento
    console.log(`Sorting by ${columnKey}`);
  },
};

// ===== MANEJO DE MODAL =====
const ModalManager = {
  /**
   * Abrir modal
   */
  open(modalId, data = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal ${modalId} no encontrado`);
      return;
    }

    // Poblar datos si se proporcionan
    if (Object.keys(data).length > 0) {
      this.populateModal(modal, data);
    }

    // Mostrar modal
    modal.classList.remove("hidden");
    modal.classList.add("modal-entrance");

    // Agregar event listener para cerrar
    modal.addEventListener("click", this.handleModalClick);
    document.addEventListener("keydown", this.handleModalKeydown);
  },

  /**
   * Cerrar modal
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add("fade-exit");

    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("modal-entrance", "fade-exit");
    }, CONFIG.ANIMATION_DURATION);

    // Remover event listeners
    modal.removeEventListener("click", this.handleModalClick);
    document.removeEventListener("keydown", this.handleModalKeydown);
  },

  /**
   * Manejar click en modal
   */
  handleModalClick(event) {
    if (event.target.classList.contains("modal-overlay")) {
      const modalId = event.target.id;
      ModalManager.close(modalId);
    }
  },

  /**
   * Manejar teclas en modal
   */
  handleModalKeydown(event) {
    if (event.key === "Escape") {
      const openModal = document.querySelector(".modal-overlay:not(.hidden)");
      if (openModal) {
        ModalManager.close(openModal.id);
      }
    }
  },

  /**
   * Poblar modal con datos
   */
  populateModal(modal, data) {
    Object.keys(data).forEach((key) => {
      const element = modal.querySelector(`[data-field="${key}"]`);
      if (element) {
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          element.value = data[key];
        } else {
          element.textContent = data[key];
        }
      }
    });
  },
};

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
class App {
  constructor() {
    this.init();
  }

  /**
   * Inicializar aplicación
   */
  async init() {
    try {
      console.log("Iniciando Librería Digital...");

      // Detectar dispositivo móvil
      this.detectMobile();

      // Cargar preferencias del usuario
      this.loadUserPreferences();

      // Inicializar componentes
      this.initializeComponents();

      // Configurar event listeners
      this.setupEventListeners();

      // Cargar datos iniciales
      await this.loadInitialData();

      console.log("Aplicación iniciada correctamente");
    } catch (error) {
      console.error("Error al inicializar aplicación:", error);
      NotificationManager.showToast(
        "Error al inicializar la aplicación",
        "error"
      );
    }
  }

  /**
   * Detectar si es dispositivo móvil
   */
  detectMobile() {
    AppState.isMobile = window.innerWidth < 1024;

    // Actualizar clase en body
    document.body.classList.toggle("mobile", AppState.isMobile);
  }

  /**
   * Cargar preferencias del usuario
   */
  loadUserPreferences() {
    const preferences = DataManager.loadFromStorage(
      CONFIG.STORAGE_KEYS.USER_PREFERENCES,
      {}
    );

    // Aplicar tema
    const theme = preferences.theme || "light";
    this.setTheme(theme);

    // Aplicar idioma
    const language = preferences.language || "es";
    this.setLanguage(language);
  }

  /**
   * Inicializar componentes
   */
  async initializeComponents() {
    // Inicializar sistema de permisos primero
    if (window.PermissionManager) {
      try {
        await PermissionManager.init();
        console.log('✅ PermissionManager inicializado');
      } catch (error) {
        console.error('❌ Error inicializando PermissionManager:', error);
        // Redirigir a login si no se pueden cargar los permisos
        window.location.href = 'login.html';
        return;
      }
    }

    // Inicializar navegación (después de permisos para renderizar menú correcto)
    if (window.NavigationManager) {
      NavigationManager.init();
    }

    // Configurar tooltips
    this.initializeTooltips();

    // Configurar búsqueda
    this.initializeSearch();

    // Inicializar contadores animados
    this.initializeCounters();
  }

  /**
   * Configurar event listeners globales
   */
  setupEventListeners() {
    // Redimensionar ventana
    window.addEventListener(
      "resize",
      Utils.debounce(() => {
        this.detectMobile();
      }, 250)
    );

    // Cambio de estado online/offline
    window.addEventListener("online", () => {
      NotificationManager.showToast("Conexión restaurada", "success");
    });

    window.addEventListener("offline", () => {
      NotificationManager.showToast("Sin conexión a internet", "warning");
    });

    // Prevenir envío de formularios por defecto
    document.addEventListener("submit", (event) => {
      event.preventDefault();
      this.handleFormSubmit(event);
    });

    // Manejar clicks en botones
    document.addEventListener("click", (event) => {
      if (event.target.matches(".btn, .action-btn")) {
        this.handleButtonClick(event);
      }
    });
  }

  /**
   * Cargar datos iniciales
   */
  async loadInitialData() {
    try {
      // Simular carga de datos (reemplazar con llamadas API reales)
      await this.loadDashboardData();
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
    }
  }

  /**
   * Cargar datos del dashboard
   */
  async loadDashboardData() {
    // Simular datos del dashboard
    const dashboardData = {
      totalBooks: 2547,
      todaySales: 1235,
      lowStock: 23,
      totalCustomers: 1127,
    };

    // Actualizar contadores en el dashboard
    this.updateDashboardStats(dashboardData);
  }

  /**
   * Actualizar estadísticas del dashboard
   */
  updateDashboardStats(data) {
    const stats = {
      totalBooks: data.totalBooks,
      todaySales: data.todaySales,
      lowStock: data.lowStock,
      totalCustomers: data.totalCustomers,
    };

    Object.keys(stats).forEach((key) => {
      const element = document.querySelector(`[data-stat="${key}"]`);
      if (element) {
        this.animateCounter(element, stats[key]);
      }
    });
  }

  /**
   * Animar contador numérico
   */
  animateCounter(element, targetValue) {
    const startValue = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(
        startValue + (targetValue - startValue) * easeOutQuart
      );

      element.textContent = this.formatCounterValue(currentValue, targetValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Formatear valor del contador
   */
  formatCounterValue(value, targetValue) {
    if (targetValue >= 1000) {
      return value.toLocaleString("es-CO");
    }
    return value.toString();
  }

  /**
   * Inicializar tooltips
   */
  initializeTooltips() {
    const tooltipElements = document.querySelectorAll("[data-tooltip]");
    tooltipElements.forEach((element) => {
      element.addEventListener("mouseenter", this.showTooltip);
      element.addEventListener("mouseleave", this.hideTooltip);
    });
  }

  /**
   * Inicializar búsqueda
   */
  initializeSearch() {
    const searchInputs = document.querySelectorAll(".search-input");
    searchInputs.forEach((input) => {
      input.addEventListener(
        "input",
        Utils.debounce((event) => {
          this.handleSearch(event.target.value);
        }, CONFIG.DEBOUNCE_DELAY)
      );
    });
  }

  /**
   * Inicializar contadores
   */
  initializeCounters() {
    const counters = document.querySelectorAll(".counter");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = parseInt(
            entry.target.textContent.replace(/[^\d]/g, "")
          );
          this.animateCounter(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    });

    counters.forEach((counter) => observer.observe(counter));
  }

  /**
   * Manejar envío de formularios
   */
  handleFormSubmit(event) {
    const form = event.target;
    const validation = FormManager.validateForm(form);

    if (validation.isValid) {
      const data = FormManager.serializeForm(form);
      console.log("Form data:", data);
      NotificationManager.showToast(
        "Formulario enviado correctamente",
        "success"
      );
    } else {
      NotificationManager.showToast("Por favor corrige los errores", "error");
    }
  }

  /**
   * Manejar clicks en botones
   */
  handleButtonClick(event) {
    const button = event.target.closest(".btn, .action-btn");

    // Efecto ripple
    if (button.classList.contains("ripple-effect")) {
      this.createRippleEffect(button, event);
    }

    // Manejar acciones específicas
    const action = button.getAttribute("data-action");
    if (action) {
      this.handleAction(action, button);
    }
  }

  /**
   * Crear efecto ripple
   */
  createRippleEffect(button, event) {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    ripple.classList.add("ripple");

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Manejar acciones específicas
   */
  handleAction(action, button) {
    switch (action) {
      case "add-book":
        ModalManager.open("addBookModal");
        break;
      case "export-pdf":
        this.exportToPDF();
        break;
      case "export-excel":
        this.exportToExcel();
        break;
      default:
        console.log(`Acción no implementada: ${action}`);
    }
  }

  /**
   * Manejar búsqueda
   */
  handleSearch(query) {
    console.log("Searching for:", query);
    // Implementar lógica de búsqueda
  }

  /**
   * Mostrar tooltip
   */
  showTooltip(event) {
    const element = event.target;
    const text = element.getAttribute("data-tooltip");

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip-content";
    tooltip.textContent = text;

    element.appendChild(tooltip);
  }

  /**
   * Ocultar tooltip
   */
  hideTooltip(event) {
    const tooltip = event.target.querySelector(".tooltip-content");
    if (tooltip) {
      tooltip.remove();
    }
  }

  /**
   * Establecer tema
   */
  setTheme(theme) {
    AppState.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);

    // Guardar preferencia
    const preferences = DataManager.loadFromStorage(
      CONFIG.STORAGE_KEYS.USER_PREFERENCES,
      {}
    );
    preferences.theme = theme;
    DataManager.saveToStorage(
      CONFIG.STORAGE_KEYS.USER_PREFERENCES,
      preferences
    );
  }

  /**
   * Establecer idioma
   */
  setLanguage(language) {
    document.documentElement.setAttribute("lang", language);

    // Guardar preferencia
    const preferences = DataManager.loadFromStorage(
      CONFIG.STORAGE_KEYS.USER_PREFERENCES,
      {}
    );
    preferences.language = language;
    DataManager.saveToStorage(
      CONFIG.STORAGE_KEYS.USER_PREFERENCES,
      preferences
    );
  }

  /**
   * Exportar a PDF
   */
  exportToPDF() {
    NotificationManager.showToast("Generando PDF...", "info");
    // Implementar exportación a PDF
  }

  /**
   * Exportar a Excel
   */
  exportToExcel() {
    NotificationManager.showToast("Generando Excel...", "info");
    // Implementar exportación a Excel
  }
}

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", () => {
  // NO inicializar la aplicación principal en la página de login
  if (window.location.pathname.includes('login.html')) {
    console.log('🚫 main.js: Evitando inicialización en página de login');
    return;
  }
  
  window.app = new App();
});

// Función simple para abrir modal de venta (backup si SalesManager falla)
window.openSaleModalDirect = function() {
    console.log('🛒 Intentando abrir modal de venta directamente...');
    
    // Método 1: Usar SalesManager si está disponible
    if (window.SalesManager && window.SalesManager.openNewSaleModal) {
        console.log('✅ Usando SalesManager');
        window.SalesManager.openNewSaleModal();
        return;
    }
    
    // Método 2: Abrir modal directamente
    console.log('⚠️ SalesManager no disponible, abriendo modal directamente');
    const modal = document.querySelector('#new-sale-modal');
    if (modal) {
        modal.classList.remove('hidden');
        console.log('✅ Modal abierto directamente');
        
        // Poblar dropdown básico
        const clientSelect = document.querySelector('#sale-client-select');
        if (clientSelect && clientSelect.options.length <= 1) {
            clientSelect.innerHTML = `
                <option value="">Seleccionar cliente...</option>
                <option value="1">María José</option>
                <option value="2">Carlos Alberto</option>
                <option value="3">Colegio San José</option>
            `;
            console.log('✅ Clientes básicos agregados');
        }
        
        // Configurar botón de cerrar
        const closeBtn = document.querySelector('#close-new-sale-modal');
        if (closeBtn) {
            closeBtn.onclick = function() {
                modal.classList.add('hidden');
                console.log('✅ Modal cerrado');
            };
        }
        
        // Inicializar carrito vacío
        window.saleItems = [];
        
        // Configurar búsqueda de libros directamente
        setTimeout(() => {
            console.log('🔧 Configurando búsqueda de libros...');
            setupBookSearchDirect();
            updateCartDisplay(); // Mostrar carrito vacío
            setupSaveButton(); // Configurar botón guardar
        }, 100);
        
    } else {
        console.error('❌ Modal no encontrado');
        alert('Error: No se pudo abrir el modal de venta');
    }
};

// Función directa para configurar búsqueda de libros
window.setupBookSearchDirect = function() {
    console.log('🔧 === CONFIGURANDO BÚSQUEDA DIRECTA ===');
    
    const searchInput = document.querySelector('#sale-book-search');
    const resultsContainer = document.querySelector('#book-search-results');
    
    console.log('Elementos:', {
        searchInput: !!searchInput,
        resultsContainer: !!resultsContainer,
        searchInputVisible: searchInput ? searchInput.offsetParent !== null : false
    });
    
    if (!searchInput || !resultsContainer) {
        console.error('❌ Elementos de búsqueda no encontrados');
        return;
    }
    
    // Cargar libros inmediatamente
    if (!window.availableBooks || window.availableBooks.length === 0) {
        console.log('📚 Cargando libros...');
        window.availableBooks = getExampleBooks();
        loadBooksForSale(); // También intentar cargar desde API
    }
    
    // Remover event listeners anteriores
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    // Agregar event listener simple
    newSearchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        console.log('🔍 Búsqueda input:', query);
        
        if (query.length < 2) {
            resultsContainer.classList.add('hidden');
            resultsContainer.innerHTML = '';
            return;
        }
        
        performSearch(query, resultsContainer);
    });
    
    // Agregar event listener de focus para mostrar todos los libros
    newSearchInput.addEventListener('focus', function() {
        console.log('👁️ Campo de búsqueda enfocado');
        if (window.availableBooks && window.availableBooks.length > 0) {
            showAllBooks(resultsContainer);
        }
    });
    
    console.log('✅ Búsqueda configurada correctamente');
};

// Función simple para realizar búsqueda
window.performSearch = function(query, resultsContainer) {
    console.log('🔍 Realizando búsqueda:', query);
    console.log('📚 Libros disponibles:', window.availableBooks?.length || 0);
    
    if (!window.availableBooks || window.availableBooks.length === 0) {
        console.log('⚠️ No hay libros, cargando de ejemplo...');
        window.availableBooks = getExampleBooks();
    }
    
    const filteredBooks = window.availableBooks.filter(book => 
        book.titulo.toLowerCase().includes(query.toLowerCase()) ||
        book.autor.toLowerCase().includes(query.toLowerCase()) ||
        (book.isbn && book.isbn.includes(query))
    );
    
    console.log('📊 Libros encontrados:', filteredBooks.length);
    
    displaySearchResults(filteredBooks, resultsContainer);
};

// Función para mostrar todos los libros
window.showAllBooks = function(resultsContainer) {
    if (!window.availableBooks || window.availableBooks.length === 0) {
        window.availableBooks = getExampleBooks();
    }
    
    console.log('📚 Mostrando todos los libros:', window.availableBooks.length);
    displaySearchResults(window.availableBooks.slice(0, 10), resultsContainer);
};

// Función para mostrar resultados
window.displaySearchResults = function(books, resultsContainer) {
    if (books.length === 0) {
        resultsContainer.innerHTML = '<div class="p-3 text-gray-500">No se encontraron libros</div>';
    } else {
        resultsContainer.innerHTML = books.map(book => `
            <div class="p-3 border-b hover:bg-gray-50 cursor-pointer" onclick="selectBookDirect(${book.id}, '${book.titulo.replace(/'/g, '\\\'')}')" style="border-bottom: 1px solid #e5e7eb;">
                <div class="font-medium" style="font-weight: 600;">${book.titulo}</div>
                <div class="text-sm text-gray-600">${book.autor}</div>
                <div class="text-sm text-gray-500">Stock: ${book.stock_actual} | Precio: $${book.precio_venta?.toLocaleString() || 'N/A'}</div>
            </div>
        `).join('');
        
        console.log('✅ Resultados mostrados:', books.length);
    }
    
    resultsContainer.classList.remove('hidden');
    resultsContainer.style.display = 'block';
};

// Función simple para seleccionar libro
window.selectBookDirect = function(bookId, bookTitle) {
    console.log('📚 Libro seleccionado:', bookId, bookTitle);
    
    const book = window.availableBooks.find(b => b.id === bookId);
    if (!book) {
        console.error('❌ Libro no encontrado:', bookId);
        return;
    }
    
    // Verificar stock
    if (book.stock_actual <= 0) {
        alert('⚠️ Este libro no tiene stock disponible');
        return;
    }
    
    // Agregar libro al carrito
    addBookToCart(book);
    
    // Limpiar búsqueda
    const searchInput = document.querySelector('#sale-book-search');
    const resultsContainer = document.querySelector('#book-search-results');
    
    if (searchInput) searchInput.value = '';
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
    }
};

// Variable global para almacenar items del carrito
window.saleItems = [];

// Función para agregar libro al carrito
window.addBookToCart = function(book) {
    console.log('🛒 Agregando libro al carrito:', book.titulo);
    
    // Verificar si el libro ya está en el carrito
    const existingItem = window.saleItems.find(item => item.libro_id === book.id);
    
    if (existingItem) {
        // Si ya existe, aumentar cantidad
        if (existingItem.cantidad < book.stock_actual) {
            existingItem.cantidad++;
            existingItem.total = existingItem.cantidad * existingItem.precio_unitario;
            console.log('📈 Cantidad aumentada a:', existingItem.cantidad);
        } else {
            alert('⚠️ No hay más stock disponible para este libro');
            return;
        }
    } else {
        // Si no existe, agregarlo nuevo
        const newItem = {
            libro_id: book.id,
            titulo: book.titulo,
            autor: book.autor,
            precio_unitario: book.precio_venta || 0,
            cantidad: 1,
            total: book.precio_venta || 0,
            stock_disponible: book.stock_actual
        };
        
        window.saleItems.push(newItem);
        console.log('✅ Libro agregado al carrito');
    }
    
    // Actualizar la visualización del carrito
    updateCartDisplay();
};

// Función para actualizar la visualización del carrito
window.updateCartDisplay = function() {
    const saleItemsContainer = document.querySelector('#sale-items');
    const subtotalElement = document.querySelector('#sale-subtotal');
    const totalElement = document.querySelector('#sale-total');
    
    if (!saleItemsContainer) {
        console.error('❌ Contenedor de items no encontrado');
        return;
    }
    
    if (window.saleItems.length === 0) {
        saleItemsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No hay libros agregados</p>';
        if (subtotalElement) subtotalElement.textContent = '$0';
        if (totalElement) totalElement.textContent = '$0';
        return;
    }
    
    // Generar HTML de los items
    const itemsHTML = window.saleItems.map((item, index) => `
        <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div class="flex-1">
                <div class="font-medium">${item.titulo}</div>
                <div class="text-sm text-gray-600">${item.autor}</div>
                <div class="text-sm text-gray-500">Stock disponible: ${item.stock_disponible}</div>
            </div>
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-1">
                    <button onclick="changeQuantity(${index}, -1)" class="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm">-</button>
                    <span class="w-8 text-center">${item.cantidad}</span>
                    <button onclick="changeQuantity(${index}, 1)" class="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm">+</button>
                </div>
                <div class="text-right">
                    <div class="font-medium">$${item.total.toLocaleString()}</div>
                    <div class="text-sm text-gray-500">$${item.precio_unitario.toLocaleString()} c/u</div>
                </div>
                <button onclick="removeFromCart(${index})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    saleItemsContainer.innerHTML = itemsHTML;
    
    // Calcular totales
    const subtotal = window.saleItems.reduce((sum, item) => sum + item.total, 0);
    
    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toLocaleString()}`;
    if (totalElement) totalElement.textContent = `$${subtotal.toLocaleString()}`;
    
    console.log('🔄 Carrito actualizado. Items:', window.saleItems.length, 'Total:', subtotal);
};

// Función para cambiar cantidad
window.changeQuantity = function(itemIndex, change) {
    const item = window.saleItems[itemIndex];
    if (!item) return;
    
    const newQuantity = item.cantidad + change;
    
    if (newQuantity <= 0) {
        removeFromCart(itemIndex);
        return;
    }
    
    if (newQuantity > item.stock_disponible) {
        alert('⚠️ No hay suficiente stock disponible');
        return;
    }
    
    item.cantidad = newQuantity;
    item.total = item.cantidad * item.precio_unitario;
    
    updateCartDisplay();
};

// Función para eliminar del carrito
window.removeFromCart = function(itemIndex) {
    window.saleItems.splice(itemIndex, 1);
    updateCartDisplay();
};

// Función para configurar el botón guardar venta
window.setupSaveButton = function() {
    const saveButton = document.querySelector('#save-sale-btn');
    
    if (!saveButton) {
        console.error('❌ Botón Guardar Venta no encontrado');
        return;
    }
    
    // Remover event listeners anteriores
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);
    
    // Agregar event listener
    newSaveButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('💾 Iniciando proceso de guardar venta...');
        saveSale();
    });
    
    console.log('✅ Botón Guardar Venta configurado');
};

// Función principal para guardar la venta
window.saveSale = async function() {
    console.log('💾 === GUARDANDO VENTA ===');
    
    try {
        // Validar datos
        const validation = validateSaleData();
        if (!validation.valid) {
            alert('⚠️ ' + validation.message);
            return;
        }
        
        // Preparar datos de la venta
        const saleData = prepareSaleData();
        console.log('📦 Datos de venta preparados:', saleData);
        
        // Deshabilitar botón para evitar doble click
        const saveButton = document.querySelector('#save-sale-btn');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        // Enviar a la API
        const result = await sendSaleToAPI(saleData);
        
        if (result.success) {
            console.log('✅ Venta guardada exitosamente:', result);
            
            // Mostrar mensaje de éxito
            alert(`✅ Venta guardada exitosamente!\nNúmero de factura: ${result.numero_factura}\nTotal: $${saleData.total.toLocaleString()}`);
            
            // Limpiar formulario
            clearSaleForm();
            
            // Cerrar modal
            const modal = document.querySelector('#new-sale-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
            
            // Recargar tabla de ventas (si existe)
            if (window.SalesManager && window.SalesManager.loadSales) {
                window.SalesManager.loadSales();
            }
            
        } else {
            throw new Error(result.message || 'Error desconocido al guardar venta');
        }
        
    } catch (error) {
        console.error('❌ Error guardando venta:', error);
        alert('❌ Error al guardar la venta: ' + error.message);
    } finally {
        // Rehabilitar botón
        const saveButton = document.querySelector('#save-sale-btn');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Venta';
        }
    }
};

// Función para validar datos de la venta
window.validateSaleData = function() {
    // Validar cliente seleccionado
    const clientSelect = document.querySelector('#sale-client-select');
    if (!clientSelect || !clientSelect.value) {
        return { valid: false, message: 'Debe seleccionar un cliente' };
    }
    
    // Validar que hay items en el carrito
    if (!window.saleItems || window.saleItems.length === 0) {
        return { valid: false, message: 'Debe agregar al menos un libro a la venta' };
    }
    
    // Validar que todos los items tienen cantidad válida
    for (let item of window.saleItems) {
        if (item.cantidad <= 0) {
            return { valid: false, message: `El libro "${item.titulo}" tiene cantidad inválida` };
        }
        if (item.cantidad > item.stock_disponible) {
            return { valid: false, message: `No hay suficiente stock para "${item.titulo}"` };
        }
    }
    
    return { valid: true };
};

// Función para preparar datos de la venta
window.prepareSaleData = function() {
    const clientSelect = document.querySelector('#sale-client-select');
    const paymentMethodSelect = document.querySelector('#payment-method');
    const notesTextarea = document.querySelector('#sale-notes');
    
    const subtotal = window.saleItems.reduce((sum, item) => sum + item.total, 0);
    const descuento = 0; // Por ahora sin descuento
    const total = subtotal - descuento;
    
    return {
        cliente_id: parseInt(clientSelect.value),
        items: window.saleItems.map(item => ({
            libro_id: item.libro_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario
        })),
        subtotal: subtotal,
        descuento: descuento,
        total: total,
        metodo_pago: paymentMethodSelect?.value || 'efectivo',
        notas: notesTextarea?.value || ''
    };
};

// Función para enviar venta a la API
window.sendSaleToAPI = async function(saleData) {
    console.log('📡 Enviando venta a API...');
    
    try {
        // Intentar con API simple primero
        let response = await fetch('api_sales_simple.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(saleData)
        });
        
        console.log('📡 Respuesta API simple:', response.status, response.statusText);
        
        if (response.ok) {
            const result = await response.json();
            console.log('📡 Datos recibidos (API simple):', result);
            return result;
        }
        
        // Si falla la API simple, intentar con la principal
        console.log('📡 Intentando con API principal...');
        response = await fetch('api/sales.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(saleData)
        });
        
        console.log('📡 Respuesta API principal:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📡 Datos recibidos (API principal):', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error en API:', error);
        throw error;
    }
};

// Función para limpiar el formulario
window.clearSaleForm = function() {
    console.log('🧹 Limpiando formulario...');
    
    // Limpiar carrito
    window.saleItems = [];
    updateCartDisplay();
    
    // Limpiar cliente seleccionado
    const clientSelect = document.querySelector('#sale-client-select');
    if (clientSelect) clientSelect.value = '';
    
    // Limpiar campo de búsqueda
    const searchInput = document.querySelector('#sale-book-search');
    if (searchInput) searchInput.value = '';
    
    // Limpiar notas
    const notesTextarea = document.querySelector('#sale-notes');
    if (notesTextarea) notesTextarea.value = '';
    
    // Ocultar resultados de búsqueda
    const resultsContainer = document.querySelector('#book-search-results');
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
    }
    
    console.log('✅ Formulario limpiado');
};

// Función para configurar la búsqueda de libros (función original)
window.setupBookSearch = function() {
    const searchInput = document.querySelector('#sale-book-search');
    const resultsContainer = document.querySelector('#book-search-results');
    
    if (!searchInput || !resultsContainer) {
        console.log('⚠️ Elementos de búsqueda de libros no encontrados');
        return;
    }
    
    console.log('📚 Configurando búsqueda de libros...');
    
    // Cargar libros desde la API
    loadBooksForSale();
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        console.log('🔍 Buscando libros:', query);
        
        if (query.length < 2) {
            resultsContainer.classList.add('hidden');
            return;
        }
        
        searchBooks(query);
    });
    
    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.add('hidden');
        }
    });
};

// Variable global para almacenar libros
window.availableBooks = [];

// Función para cargar libros desde la API
window.loadBooksForSale = async function() {
    try {
        console.log('📚 Cargando libros desde API...');
        
        // Intentar con la API simple primero (sin permisos complejos)
        let response = await fetch('api_books_simple.php?limit=1000');
        console.log('📚 Respuesta API simple:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📚 Datos API simple:', data);
            
            if (data.success && data.data && data.data.length > 0) {
                window.availableBooks = data.data;
                console.log('✅ Libros cargados desde API simple:', window.availableBooks.length);
                console.log('✅ Primer libro:', window.availableBooks[0]);
                return;
            }
        }
        
        // Si falla, intentar con la API principal
        console.log('📚 Intentando con API principal...');
        response = await fetch('api/books.php?limit=1000');
        console.log('📚 Respuesta API principal:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📚 Datos recibidos:', data);
            
            if (data.success && data.data && data.data.length > 0) {
                window.availableBooks = data.data;
                console.log('✅ Libros cargados desde API:', window.availableBooks.length);
                console.log('✅ Primer libro:', window.availableBooks[0]);
                return;
            } else {
                console.log('⚠️ API respondió pero sin datos válidos');
            }
        } else {
            console.log('⚠️ Error HTTP en API:', response.status);
            
            // Intentar con el test directo
            try {
                console.log('📚 Intentando con test directo...');
                const testResponse = await fetch('test_books_db.php');
                if (testResponse.ok) {
                    const testText = await testResponse.text();
                    console.log('📚 Test DB resultado:', testText);
                }
            } catch (testError) {
                console.log('⚠️ Test directo también falló:', testError);
            }
        }
        
        // Fallback a libros de ejemplo
        console.log('📚 Usando libros de ejemplo como fallback');
        window.availableBooks = getExampleBooks();
        console.log('✅ Libros de ejemplo cargados:', window.availableBooks.length);
        
    } catch (error) {
        console.error('❌ Error general cargando libros:', error);
        window.availableBooks = getExampleBooks();
    }
};

// Función para obtener libros de ejemplo (basados en datos reales de la DB)
window.getExampleBooks = function() {
    return [
        {
            id: 1,
            titulo: 'Cien años de soledad',
            autor: 'Gabriel García Márquez',
            isbn: '978-0307389732',
            precio_venta: 25000,
            stock_actual: 7  // Stock real de la base de datos
        },
        {
            id: 2,
            titulo: 'El amor en los tiempos del cólera',
            autor: 'Gabriel García Márquez',
            isbn: '978-0307387738',
            precio_venta: 23000,
            stock_actual: 5
        },
        {
            id: 3,
            titulo: 'Don Quijote de la Mancha',
            autor: 'Miguel de Cervantes',
            isbn: '978-8420412146',
            precio_venta: 30000,
            stock_actual: 12
        }
    ];
};

// Función para buscar libros
window.searchBooks = function(query) {
    const resultsContainer = document.querySelector('#book-search-results');
    
    if (!window.availableBooks || window.availableBooks.length === 0) {
        console.log('⚠️ No hay libros disponibles para buscar');
        loadBooksForSale(); // Intentar cargar de nuevo
        return;
    }
    
    const filteredBooks = window.availableBooks.filter(book => 
        book.titulo.toLowerCase().includes(query.toLowerCase()) ||
        book.autor.toLowerCase().includes(query.toLowerCase()) ||
        book.isbn.includes(query)
    );
    
    console.log('📚 Libros encontrados:', filteredBooks.length);
    
    if (filteredBooks.length === 0) {
        resultsContainer.innerHTML = '<div class="p-3 text-gray-500">No se encontraron libros</div>';
    } else {
        resultsContainer.innerHTML = filteredBooks.map(book => `
            <div class="p-3 border-b hover:bg-gray-50 cursor-pointer" onclick="selectBook(${book.id})">
                <div class="font-medium">${book.titulo}</div>
                <div class="text-sm text-gray-600">${book.autor}</div>
                <div class="text-sm text-gray-500">Stock: ${book.stock_actual} | Precio: $${book.precio_venta?.toLocaleString() || 'N/A'}</div>
            </div>
        `).join('');
    }
    
    resultsContainer.classList.remove('hidden');
};

// Función para seleccionar un libro
window.selectBook = function(bookId) {
    const book = window.availableBooks.find(b => b.id === bookId);
    if (!book) {
        console.error('❌ Libro no encontrado:', bookId);
        return;
    }
    
    console.log('📚 Libro seleccionado:', book.titulo);
    
    // Limpiar búsqueda
    const searchInput = document.querySelector('#sale-book-search');
    const resultsContainer = document.querySelector('#book-search-results');
    
    if (searchInput) searchInput.value = '';
    if (resultsContainer) resultsContainer.classList.add('hidden');
    
    // Agregar libro a la venta (función simple)
    addBookToSaleSimple(book);
};

// Función simple para agregar libro a la venta
window.addBookToSaleSimple = function(book) {
    // Por ahora, solo mostrar una confirmación
    alert(`Libro agregado: ${book.titulo}\nPrecio: $${book.precio_venta?.toLocaleString()}\n\n(Esta es una versión simplificada)`);
    
    console.log('📚 Libro agregado a la venta:', book);
};

// Función de test simple para búsqueda de libros
window.testBookSearch = function() {
    console.log('🧪 === TEST BÚSQUEDA DE LIBROS ===');
    
    const searchInput = document.querySelector('#sale-book-search');
    const resultsContainer = document.querySelector('#book-search-results');
    
    console.log('Elementos encontrados:', {
        searchInput: !!searchInput,
        resultsContainer: !!resultsContainer,
        availableBooks: window.availableBooks?.length || 0,
        modalVisible: !document.querySelector('#new-sale-modal')?.classList.contains('hidden')
    });
    
    // Verificar si el modal está abierto
    if (!searchInput || searchInput.offsetParent === null) {
        console.log('⚠️ Modal no está abierto o elemento no visible');
        console.log('🔄 Abriendo modal primero...');
        openSaleModalDirect();
        
        // Esperar un poco y probar de nuevo
        setTimeout(() => {
            testBookSearch();
        }, 1000);
        return;
    }
    
    // Forzar carga de libros de ejemplo
    console.log('📚 Forzando carga de libros...');
    window.availableBooks = getExampleBooks();
    console.log('✅ Libros disponibles:', window.availableBooks.map(b => b.titulo));
    
    // Probar búsqueda directa
    console.log('🔍 Probando búsqueda de "cien"...');
    searchBooks('cien');
    
    // Verificar resultado
    setTimeout(() => {
        const isVisible = !resultsContainer.classList.contains('hidden');
        console.log('📊 Resultado búsqueda:', {
            contenedorVisible: isVisible,
            contenidoHTML: resultsContainer.innerHTML.slice(0, 100)
        });
    }, 500);
};

// Función para probar el carrito completo
window.testCart = function() {
    console.log('🧪 === TEST CARRITO COMPLETO ===');
    
    // Asegurar que hay libros disponibles
    if (!window.availableBooks || window.availableBooks.length === 0) {
        window.availableBooks = getExampleBooks();
    }
    
    // Limpiar carrito
    window.saleItems = [];
    
    // Agregar un libro al carrito
    const primerLibro = window.availableBooks[0];
    console.log('📚 Agregando libro:', primerLibro.titulo);
    addBookToCart(primerLibro);
    
    // Agregar otro libro
    if (window.availableBooks.length > 1) {
        const segundoLibro = window.availableBooks[1];
        console.log('📚 Agregando segundo libro:', segundoLibro.titulo);
        addBookToCart(segundoLibro);
    }
    
    console.log('🛒 Estado del carrito:', window.saleItems);
    console.log('💰 Total items:', window.saleItems.length);
};

// Función para probar todo el flujo de venta completo
window.testCompleteSale = function() {
    console.log('🧪 === TEST VENTA COMPLETA ===');
    
    // Verificar que el modal esté abierto
    if (!document.querySelector('#new-sale-modal') || document.querySelector('#new-sale-modal').classList.contains('hidden')) {
        console.log('🔄 Abriendo modal primero...');
        openSaleModalDirect();
        
        setTimeout(() => {
            testCompleteSale();
        }, 1000);
        return;
    }
    
    // Seleccionar cliente
    const clientSelect = document.querySelector('#sale-client-select');
    if (clientSelect && clientSelect.options.length > 1) {
        clientSelect.value = clientSelect.options[1].value;
        console.log('✅ Cliente seleccionado:', clientSelect.options[1].text);
    }
    
    // Asegurar que hay libros
    if (!window.availableBooks || window.availableBooks.length === 0) {
        window.availableBooks = getExampleBooks();
    }
    
    // Limpiar carrito y agregar libro
    window.saleItems = [];
    const libro = window.availableBooks[0];
    addBookToCart(libro);
    console.log('✅ Libro agregado:', libro.titulo);
    
    // Mostrar estado actual
    console.log('📊 Estado de la venta:');
    console.log('- Cliente:', clientSelect?.value);
    console.log('- Items:', window.saleItems.length);
    console.log('- Total:', window.saleItems.reduce((sum, item) => sum + item.total, 0));
    
    // Validar datos
    const validation = validateSaleData();
    console.log('✅ Validación:', validation);
    
    if (validation.valid) {
        console.log('🎯 Todo listo para guardar! Usa saveSale() para guardar.');
    }
};

// Función para probar solo la API
window.testLoadBooks = async function() {
    console.log('🧪 === TEST CARGA DE LIBROS ===');
    
    try {
        // Probar API simple
        console.log('📚 Probando API simple...');
        const response1 = await fetch('api_books_simple.php?limit=10');
        console.log('API simple response:', response1.status);
        
        if (response1.ok) {
            const data1 = await response1.json();
            console.log('API simple data:', data1);
        }
        
        // Probar API principal
        console.log('📚 Probando API principal...');
        const response2 = await fetch('api/books.php?limit=10');
        console.log('API principal response:', response2.status);
        
        if (response2.ok) {
            const data2 = await response2.json();
            console.log('API principal data:', data2);
        }
        
    } catch (error) {
        console.error('Error probando APIs:', error);
    }
};

// Exportar para uso global
window.Utils = Utils;
window.NotificationManager = NotificationManager;
window.LoadingManager = LoadingManager;
window.DataManager = DataManager;
window.FormManager = FormManager;
window.TableManager = TableManager;
window.ModalManager = ModalManager;
