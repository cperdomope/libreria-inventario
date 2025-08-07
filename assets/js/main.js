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
   * Mostrar notificación toast
   */
  showToast(message, type = "info", duration = CONFIG.TOAST_DURATION) {
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

    // Remover automáticamente
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
  initializeComponents() {
    // Inicializar navegación
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
  window.app = new App();
});

// Exportar para uso global
window.Utils = Utils;
window.NotificationManager = NotificationManager;
window.LoadingManager = LoadingManager;
window.DataManager = DataManager;
window.FormManager = FormManager;
window.TableManager = TableManager;
window.ModalManager = ModalManager;
