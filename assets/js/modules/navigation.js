/**
 * LIBRERÍA DIGITAL - NAVEGACIÓN
 * Archivo: assets/js/navigation.js
 * Descripción: Manejo de navegación y sidebar
 */

/**
 * LIBRERÍA DIGITAL - NAVEGACIÓN
 * Archivo: assets/js/navigation.js
 * Descripción: Manejo de navegación y sidebar
 */

const NavigationManager = {
  // Estado de navegación
  state: {
    currentSection: "dashboard",
    sidebarOpen: false,
    navigationHistory: ["dashboard"],
    breadcrumbs: [],
  },

  // Configuración de secciones
  sections: {
    dashboard: {
      title: "Dashboard",
      icon: "fas fa-chart-pie",
      component: "DashboardComponent",
      requiresAuth: true,
    },
    inventory: {
      title: "Inventario",
      icon: "fas fa-book",
      component: "InventoryComponent",
      requiresAuth: true,
    },
    stock: {
      title: "Control de Stock",
      icon: "fas fa-boxes",
      component: "StockComponent",
      requiresAuth: true,
    },
    sales: {
      title: "Ventas",
      icon: "fas fa-shopping-cart",
      component: "SalesComponent",
      requiresAuth: true,
    },
    reports: {
      title: "Reportes",
      icon: "fas fa-chart-bar",
      component: "ReportsComponent",
      requiresAuth: true,
    },
    users: {
      title: "Usuarios",
      icon: "fas fa-users",
      component: "UsersComponent",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },

  /**
   * Inicializar navegación
   */
  init() {
    console.log("Inicializando NavigationManager...");

    this.setupEventListeners();
    this.setupSidebar();
    this.setupBreadcrumbs();
    this.loadInitialSection();

    console.log("NavigationManager inicializado");
  },

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Event listeners para links de navegación
    document.addEventListener("click", (event) => {
      const navLink = event.target.closest(".nav-link");
      if (navLink) {
        event.preventDefault();
        const section = navLink.getAttribute("data-section");
        if (section) {
          this.navigateToSection(section);
        }
      }
    });

    // Toggle del sidebar móvil
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }

    // Cerrar sidebar al hacer click en el overlay
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    // Manejar cambio de tamaño de ventana
    window.addEventListener("resize", () => {
      this.handleResize();
    });

    // Navegación con teclado
    document.addEventListener("keydown", (event) => {
      this.handleKeyboardNavigation(event);
    });

    // History API para navegación del navegador
    window.addEventListener("popstate", (event) => {
      if (event.state && event.state.section) {
        this.navigateToSection(event.state.section, false);
      }
    });
  },

  /**
   * Configurar sidebar
   */
  setupSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    // Agregar animación de entrada al sidebar
    sidebar.classList.add("sidebar-entrance");

    // Configurar estado inicial basado en el tamaño de pantalla
    this.handleResize();
  },

  /**
   * Configurar breadcrumbs
   */
  setupBreadcrumbs() {
    this.updateBreadcrumbs();
  },

  /**
   * Cargar sección inicial
   */
  loadInitialSection() {
    // Obtener sección de la URL o usar dashboard por defecto
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get("section") || "dashboard";

    this.navigateToSection(section, false);
  },

  /**
   * Navegar a una sección
   */
  navigateToSection(sectionName, addToHistory = true) {
    console.log(`Navegando a: ${sectionName}`);

    // Validar que la sección existe
    if (!this.sections[sectionName]) {
      console.error(`Sección '${sectionName}' no encontrada`);
      NotificationManager.showToast("Página no encontrada", "error");
      return;
    }

    // Validar permisos
    if (!this.validateSectionAccess(sectionName)) {
      NotificationManager.showToast(
        "No tienes permisos para acceder a esta sección",
        "error"
      );
      return;
    }

    // Ocultar sección actual
    this.hidCurrentSection();

    // Actualizar estado
    const previousSection = this.state.currentSection;
    this.state.currentSection = sectionName;

    // Agregar al historial de navegación
    if (addToHistory) {
      this.state.navigationHistory.push(sectionName);
      this.updateBrowserHistory(sectionName);
    }

    // Actualizar UI
    this.updateActiveNavLink(sectionName);
    this.showSection(sectionName);
    this.updateBreadcrumbs();
    this.updatePageTitle(sectionName);

    // Cerrar sidebar en móvil
    if (window.innerWidth < 1024) {
      this.closeSidebar();
    }

    // Ejecutar callback de navegación
    this.onNavigationChange(sectionName, previousSection);

    console.log(`Navegación completada a: ${sectionName}`);
  },

  /**
   * Validar acceso a sección
   */
  validateSectionAccess(sectionName) {
    const section = this.sections[sectionName];

    // Verificar si requiere autenticación
    if (section.requiresAuth && !this.isUserAuthenticated()) {
      return false;
    }

    // Verificar si requiere permisos de admin
    if (section.requiresAdmin && !this.isUserAdmin()) {
      return false;
    }

    return true;
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isUserAuthenticated() {
    // Implementar lógica de autenticación
    return true; // Por ahora siempre retorna true
  },

  /**
   * Verificar si el usuario es administrador
   */
  isUserAdmin() {
    // Implementar lógica de verificación de admin
    return true; // Por ahora siempre retorna true
  },

  /**
   * Ocultar sección actual
   */
  hidCurrentSection() {
    const currentSection = document.getElementById(
      `${this.state.currentSection}-section`
    );
    if (currentSection) {
      currentSection.classList.add("fade-exit");
      setTimeout(() => {
        currentSection.classList.add("hidden");
        currentSection.classList.remove("fade-exit");
      }, 200);
    }
  },

  /**
   * Mostrar sección
   */
  showSection(sectionName) {
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
      // Remover clase hidden y agregar animación de entrada
      section.classList.remove("hidden");
      section.classList.add("page-enter");

      // Limpiar clases de animación después de la transición
      setTimeout(() => {
        section.classList.remove("page-enter");
      }, 600);

      // Cargar contenido de la sección si es necesario
      this.loadSectionContent(sectionName);
    } else {
      console.error(
        `Elemento de sección '${sectionName}-section' no encontrado`
      );
    }
  },

  /**
   * Cargar contenido de sección
   */
  async loadSectionContent(sectionName) {
    const section = this.sections[sectionName];

    if (section.component && window[section.component]) {
      try {
        await window[section.component].load();
      } catch (error) {
        console.error(`Error cargando componente ${section.component}:`, error);
        NotificationManager.showToast("Error cargando contenido", "error");
      }
    }
  },

  /**
   * Actualizar link activo en navegación
   */
  updateActiveNavLink(sectionName) {
    // Remover clase activa de todos los links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    // Agregar clase activa al link correspondiente
    const activeLink = document.querySelector(
      `[data-section="${sectionName}"]`
    );
    if (activeLink) {
      activeLink.classList.add("active");
    }
  },

  /**
   * Actualizar historial del navegador
   */
  updateBrowserHistory(sectionName) {
    const url = new URL(window.location);
    url.searchParams.set("section", sectionName);

    window.history.pushState(
      { section: sectionName },
      this.sections[sectionName].title,
      url.toString()
    );
  },

  /**
   * Actualizar breadcrumbs
   */
  updateBreadcrumbs() {
    const breadcrumbContainer = document.querySelector(".breadcrumbs");
    if (!breadcrumbContainer) return;

    const currentSection = this.sections[this.state.currentSection];
    const breadcrumbs = [
      { name: "Inicio", section: "dashboard" },
      { name: currentSection.title, section: this.state.currentSection },
    ];

    // Si no estamos en dashboard, mostrar breadcrumbs
    if (this.state.currentSection !== "dashboard") {
      breadcrumbContainer.innerHTML = breadcrumbs
        .map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return `
                    <span class="breadcrumb-item ${isLast ? "active" : ""}">
                        ${
                          isLast
                            ? item.name
                            : `<a href="#" data-section="${item.section}">${item.name}</a>`
                        }
                        ${
                          !isLast
                            ? '<i class="fas fa-chevron-right breadcrumb-separator"></i>'
                            : ""
                        }
                    </span>
                `;
        })
        .join("");
    } else {
      breadcrumbContainer.innerHTML = "";
    }
  },

  /**
   * Actualizar título de página
   */
  updatePageTitle(sectionName) {
    const section = this.sections[sectionName];
    document.title = `${section.title} - Librería Digital`;
  },

  /**
   * Toggle sidebar
   */
  toggleSidebar() {
    if (this.state.sidebarOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  },

  /**
   * Abrir sidebar
   */
  openSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (sidebar) {
      sidebar.classList.add("active");
    }

    if (overlay) {
      overlay.classList.add("active");
    }

    this.state.sidebarOpen = true;
    document.body.classList.add("sidebar-open");
  },

  /**
   * Cerrar sidebar
   */
  closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (sidebar) {
      sidebar.classList.remove("active");
    }

    if (overlay) {
      overlay.classList.remove("active");
    }

    this.state.sidebarOpen = false;
    document.body.classList.remove("sidebar-open");
  },

  /**
   * Manejar redimensionamiento de ventana
   */
  handleResize() {
    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop) {
      // En desktop, siempre cerrar el overlay y mostrar sidebar
      this.closeSidebar();
      const sidebar = document.getElementById("sidebar");
      if (sidebar) {
        sidebar.classList.add("desktop-mode");
      }
    } else {
      // En móvil, quitar modo desktop
      const sidebar = document.getElementById("sidebar");
      if (sidebar) {
        sidebar.classList.remove("desktop-mode");
      }
    }
  },

  /**
   * Manejar navegación con teclado
   */
  handleKeyboardNavigation(event) {
    // Cerrar sidebar con Escape
    if (event.key === "Escape" && this.state.sidebarOpen) {
      this.closeSidebar();
      return;
    }

    // Navegación con Alt + números
    if (event.altKey && event.key >= "1" && event.key <= "6") {
      event.preventDefault();
      const sectionIndex = parseInt(event.key) - 1;
      const sectionNames = Object.keys(this.sections);
      const targetSection = sectionNames[sectionIndex];

      if (targetSection) {
        this.navigateToSection(targetSection);
      }
    }
  },

  /**
   * Callback ejecutado cuando cambia la navegación
   */
  onNavigationChange(newSection, previousSection) {
    // Ejecutar analytics si está configurado
    if (window.gtag) {
      gtag("config", "GA_TRACKING_ID", {
        page_title: this.sections[newSection].title,
        page_location: window.location.href,
      });
    }

    // Ejecutar eventos personalizados
    document.dispatchEvent(
      new CustomEvent("navigationChange", {
        detail: { newSection, previousSection },
      })
    );

    // Log para debugging
    console.log(`Navegación: ${previousSection} → ${newSection}`);
  },

  /**
   * Obtener sección actual
   */
  getCurrentSection() {
    return this.state.currentSection;
  },

  /**
   * Obtener historial de navegación
   */
  getNavigationHistory() {
    return [...this.state.navigationHistory];
  },

  /**
   * Ir a página anterior
   */
  goBack() {
    if (this.state.navigationHistory.length > 1) {
      // Remover sección actual del historial
      this.state.navigationHistory.pop();
      // Obtener sección anterior
      const previousSection =
        this.state.navigationHistory[this.state.navigationHistory.length - 1];
      this.navigateToSection(previousSection, false);
    }
  },

  /**
   * Verificar si se puede ir hacia atrás
   */
  canGoBack() {
    return this.state.navigationHistory.length > 1;
  },

  /**
   * Limpiar historial de navegación
   */
  clearHistory() {
    this.state.navigationHistory = [this.state.currentSection];
  },

  /**
   * Registrar nueva sección dinámicamente
   */
  registerSection(name, config) {
    this.sections[name] = config;
    console.log(`Sección '${name}' registrada`);
  },

  /**
   * Destruir NavigationManager
   */
  destroy() {
    // Limpiar event listeners
    document.removeEventListener("click", this.handleNavClick);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("popstate", this.handlePopState);

    console.log("NavigationManager destruido");
  },
};

// Componentes de sección (ejemplos)
const DashboardComponent = {
  async load() {
    console.log("Cargando Dashboard...");
    // Implementar carga de datos del dashboard
  },
};

const InventoryComponent = {
  async load() {
    console.log("Cargando Inventario...");
    // Implementar carga de datos del inventario
  },
};

const StockComponent = {
  async load() {
    console.log("Cargando Control de Stock...");
    // Implementar carga de datos de stock
  },
};

const SalesComponent = {
  async load() {
    console.log("Cargando Ventas...");
    // Implementar carga de datos de ventas
  },
};

const ReportsComponent = {
  async load() {
    console.log("Cargando Reportes...");
    // Implementar carga de datos de reportes
  },
};

const UsersComponent = {
  async load() {
    console.log("Cargando Usuarios...");
    // Implementar carga de datos de usuarios
  },
};

// Exportar para uso global
window.NavigationManager = NavigationManager;
window.DashboardComponent = DashboardComponent;
window.InventoryComponent = InventoryComponent;
window.StockComponent = StockComponent;
window.SalesComponent = SalesComponent;
window.ReportsComponent = ReportsComponent;
window.UsersComponent = UsersComponent;
