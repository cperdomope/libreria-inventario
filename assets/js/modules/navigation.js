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
    this.renderNavigationMenu(); // Renderizar menú basado en permisos
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
    this.hideCurrentSection();

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
   * Validar acceso a sección usando el sistema de permisos por roles
   */
  validateSectionAccess(sectionName) {
    const section = this.sections[sectionName];

    // Verificar si requiere autenticación
    if (section.requiresAuth && !this.isUserAuthenticated()) {
      return false;
    }

    // Usar el sistema de permisos por roles
    if (window.PermissionManager) {
      // Mapear secciones a módulos de permisos
      const moduleMap = {
        'dashboard': 'dashboard',
        'inventory': 'inventory',
        'stock': 'stock',
        'sales': 'sales',
        'reports': 'reports',
        'users': 'users'
      };

      const module = moduleMap[sectionName];
      if (module && !PermissionManager.canAccessModule(module)) {
        console.warn(`🚫 Acceso denegado a la sección "${sectionName}" para el rol actual`);
        return false;
      }
    }

    return true;
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isUserAuthenticated() {
    return window.PermissionManager ? PermissionManager.isLoggedIn() : false;
  },

  /**
   * Verificar si el usuario es administrador
   */
  isUserAdmin() {
    return window.PermissionManager ? PermissionManager.getUserRole() === 'admin' : false;
  },

  /**
   * Renderizar menú de navegación basado en permisos
   */
  renderNavigationMenu() {
    if (!window.PermissionManager) {
      console.warn('PermissionManager no disponible para renderizar menú');
      return;
    }

    const sidebarNav = document.querySelector('#sidebar nav ul');
    if (!sidebarNav) return;

    // Limpiar menú existente
    sidebarNav.innerHTML = '';

    // Definir ítems de menú con sus permisos requeridos
    const menuItems = [
      {
        section: 'dashboard',
        module: 'dashboard',
        action: 'view',
        icon: 'fas fa-chart-pie',
        title: 'Dashboard',
        alwaysShow: true // Dashboard siempre visible
      },
      {
        section: 'inventory',
        module: 'inventory',
        action: 'view',
        icon: 'fas fa-book',
        title: 'Inventario'
      },
      {
        section: 'stock',
        module: 'stock',
        action: 'view',
        icon: 'fas fa-boxes',
        title: 'Control de Stock'
      },
      {
        section: 'sales',
        module: 'sales',
        action: 'view',
        icon: 'fas fa-shopping-cart',
        title: 'Ventas'
      },
      {
        section: 'reports',
        module: 'reports',
        action: 'view',
        icon: 'fas fa-chart-bar',
        title: 'Reportes'
      },
      {
        section: 'users',
        module: 'users',
        action: 'view',
        icon: 'fas fa-users',
        title: 'Usuarios'
      }
    ];

    // Filtrar y renderizar ítems según permisos
    menuItems.forEach(item => {
      const canAccess = item.alwaysShow || PermissionManager.canAccessModule(item.module);
      
      if (canAccess) {
        const li = document.createElement('li');
        li.innerHTML = `
          <a href="#" class="nav-link flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors duration-200" 
             data-section="${item.section}">
            <i class="${item.icon} mr-3 text-lg"></i>
            <span class="font-medium">${item.title}</span>
          </a>
        `;
        sidebarNav.appendChild(li);
      }
    });

    console.log('✅ Menú de navegación renderizado según permisos');
  },

  /**
   * Ocultar sección actual
   */
  hideCurrentSection() {
    const currentSection = document.getElementById(
      `${this.state.currentSection}-section`
    );
    if (currentSection) {
      currentSection.classList.remove("active");
      currentSection.classList.add("fade-exit");
      setTimeout(() => {
        currentSection.classList.remove("fade-exit");
      }, 300);
    }
  },

  /**
   * Mostrar sección
   */
  showSection(sectionName) {
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
      // Agregar clase active y animación de entrada
      section.classList.add("active");
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

    // Cargar datos específicos de la sección
    this.loadSectionData(newSection);

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
   * Cargar datos específicos de cada sección
   */
  loadSectionData(sectionName) {
    switch (sectionName) {
      case 'users':
        // Cargar estadísticas de usuarios si el manager está disponible
        if (window.UserManager && typeof window.UserManager.loadUsers === 'function') {
          console.log('🔄 Cargando datos de usuarios...');
          window.UserManager.loadUsers();
        } else {
          console.warn('⚠️ UserManager no disponible, intentando cargar después...');
          // Intentar cargar después de un breve delay
          setTimeout(() => {
            if (window.UserManager && typeof window.UserManager.loadUsers === 'function') {
              window.UserManager.loadUsers();
            }
          }, 500);
        }
        break;
        
      case 'dashboard':
        // Aquí se pueden cargar estadísticas generales del dashboard
        console.log('📊 Cargando estadísticas del dashboard...');
        break;
        
      case 'inventory':
        // Cargar datos de inventario si el manager está disponible
        console.log('📚 Cargando datos de inventario...');
        if (window.InventoryManager && typeof window.InventoryManager.loadBooks === 'function') {
          console.log('🔄 Recargando datos de inventario...');
          window.InventoryManager.loadBooks();
        }
        break;
        
      default:
        console.log(`📄 Sección ${sectionName} cargada`);
        break;
    }
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
    
    // Inicializar InventoryManager si está disponible
    if (window.InventoryManager && typeof window.InventoryManager.init === 'function') {
      try {
        await window.InventoryManager.init();
        console.log("✅ InventoryManager inicializado correctamente");
      } catch (error) {
        console.error("❌ Error inicializando InventoryManager:", error);
      }
    } else {
      console.warn("⚠️ InventoryManager no disponible, intentando cargar después...");
      // Intentar cargar después de un breve delay para permitir que se carguen todos los scripts
      setTimeout(async () => {
        if (window.InventoryManager && typeof window.InventoryManager.init === 'function') {
          try {
            await window.InventoryManager.init();
            console.log("✅ InventoryManager inicializado correctamente (intento retrasado)");
          } catch (error) {
            console.error("❌ Error inicializando InventoryManager (intento retrasado):", error);
          }
        } else {
          console.error("❌ InventoryManager no está disponible después del delay");
        }
      }, 500);
    }
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
