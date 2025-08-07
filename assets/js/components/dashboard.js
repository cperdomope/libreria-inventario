/**
 * LIBRERÍA DIGITAL - COMPONENTE DASHBOARD
 * Archivo: assets/js/components/dashboard.js
 * Descripción: Funcionalidad específica del dashboard
 */

const DashboardComponent = {
    // Estado del dashboard
    state: {
        isLoaded: false,
        stats: null,
        charts: null,
        recentActivity: []
    },

    /**
     * Inicializar dashboard
     */
    async init() {
        console.log('Inicializando Dashboard...');
        
        try {
            await this.loadDashboardData();
            this.setupEventListeners();
            this.renderCharts();
            this.setupRealtimeUpdates();
            
            this.state.isLoaded = true;
            console.log('Dashboard inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
        }
    },

    /**
     * Cargar datos del dashboard
     */
    async loadDashboardData() {
        // Simular carga de datos desde API
        const mockData = {
            totalBooks: 2547,
            todaySales: 1235,
            lowStock: 23,
            totalCustomers: 1127,
            salesGrowth: 5.2,
            customerGrowth: 12
        };

        this.state.stats = mockData;
        this.updateStatCards(mockData);
    },

    /**
     * Actualizar tarjetas de estadísticas
     */
    updateStatCards(data) {
        const statCards = {
            'total-books': data.totalBooks,
            'today-sales': data.todaySales,
            'low-stock': data.lowStock,
            'total-customers': data.totalCustomers
        };

        Object.entries(statCards).forEach(([id, value]) => {
            const element = document.querySelector(`[data-stat="${id.replace('-', '')}"]`);
            if (element) {
                this.animateCounter(element, value);
            }
        });
    },

    /**
     * Animar contadores numéricos
     */
    animateCounter(element, targetValue) {
        const startValue = 0;
        const duration = 2000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function para animación suave
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(
                startValue + (targetValue - startValue) * easeOutQuart
            );

            element.textContent = this.formatNumber(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    /**
     * Formatear números para display
     */
    formatNumber(value) {
        if (value >= 1000) {
            return value.toLocaleString('es-CO');
        }
        return value.toString();
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Listeners para botones de acción rápida
        const quickActions = document.querySelectorAll('[data-quick-action]');
        quickActions.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-quick-action');
                this.handleQuickAction(action);
            });
        });

        // Listener para refrescar dashboard
        const refreshButton = document.querySelector('[data-action="refresh-dashboard"]');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refresh();
            });
        }
    },

    /**
     * Manejar acciones rápidas
     */
    handleQuickAction(action) {
        switch (action) {
            case 'add-book':
                console.log('Abrir modal agregar libro');
                break;
            case 'new-sale':
                console.log('Iniciar nueva venta');
                break;
            case 'view-reports':
                console.log('Ver reportes');
                break;
            default:
                console.log(`Acción no implementada: ${action}`);
        }
    },

    /**
     * Renderizar gráficos
     */
    renderCharts() {
        this.renderSalesChart();
        this.renderCategoriesChart();
        this.renderStockChart();
    },

    /**
     * Renderizar gráfico de ventas
     */
    renderSalesChart() {
        const chartContainer = document.getElementById('sales-chart');
        if (!chartContainer) return;

        // Placeholder para Chart.js o biblioteca similar
        chartContainer.innerHTML = `
            <div class="chart-placeholder">
                <i class="fas fa-chart-line text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-500">Gráfico de ventas</p>
                <p class="text-sm text-gray-400">Últimos 7 días</p>
            </div>
        `;
    },

    /**
     * Renderizar gráfico de categorías
     */
    renderCategoriesChart() {
        const chartContainer = document.getElementById('categories-chart');
        if (!chartContainer) return;

        chartContainer.innerHTML = `
            <div class="chart-placeholder">
                <i class="fas fa-chart-pie text-4xl text-green-400 mb-2"></i>
                <p class="text-gray-500">Categorías más vendidas</p>
                <p class="text-sm text-gray-400">Este mes</p>
            </div>
        `;
    },

    /**
     * Renderizar gráfico de stock
     */
    renderStockChart() {
        const chartContainer = document.getElementById('stock-chart');
        if (!chartContainer) return;

        chartContainer.innerHTML = `
            <div class="chart-placeholder">
                <i class="fas fa-chart-bar text-4xl text-yellow-400 mb-2"></i>
                <p class="text-gray-500">Niveles de stock</p>
                <p class="text-sm text-gray-400">Estado actual</p>
            </div>
        `;
    },

    /**
     * Configurar actualizaciones en tiempo real
     */
    setupRealtimeUpdates() {
        // Simular actualizaciones periódicas
        setInterval(() => {
            this.updateRecentActivity();
        }, 30000); // Cada 30 segundos
    },

    /**
     * Actualizar actividad reciente
     */
    updateRecentActivity() {
        const activities = [
            {
                type: 'book_added',
                message: 'Se agregó "Rayuela" al inventario',
                time: 'Hace 5 min',
                icon: 'fa-plus',
                color: 'blue'
            },
            {
                type: 'sale_completed',
                message: '3 libros vendidos por $87.50',
                time: 'Hace 12 min',
                icon: 'fa-shopping-cart',
                color: 'green'
            },
            {
                type: 'low_stock',
                message: '"El Alquimista" tiene solo 3 unidades',
                time: 'Hace 1 hora',
                icon: 'fa-exclamation-triangle',
                color: 'yellow'
            }
        ];

        this.state.recentActivity = activities;
        this.renderRecentActivity();
    },

    /**
     * Renderizar actividad reciente
     */
    renderRecentActivity() {
        const container = document.querySelector('.recent-activity-list');
        if (!container) return;

        const html = this.state.recentActivity.map(activity => `
            <div class="flex items-center space-x-4 p-3 bg-${activity.color}-50 rounded-lg">
                <div class="bg-${activity.color}-500 p-2 rounded-full">
                    <i class="fas ${activity.icon} text-white text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium text-gray-900">${this.getActivityTitle(activity.type)}</p>
                    <p class="text-gray-600 text-sm">${activity.message}</p>
                </div>
                <span class="text-gray-500 text-sm">${activity.time}</span>
            </div>
        `).join('');

        container.innerHTML = html;
    },

    /**
     * Obtener título de actividad
     */
    getActivityTitle(type) {
        const titles = {
            'book_added': 'Nuevo libro agregado',
            'sale_completed': 'Venta realizada',
            'low_stock': 'Stock bajo',
            'new_customer': 'Nuevo cliente',
            'inventory_update': 'Inventario actualizado'
        };

        return titles[type] || 'Actividad';
    },

    /**
     * Refrescar dashboard
     */
    async refresh() {
        console.log('Refrescando dashboard...');
        
        try {
            await this.loadDashboardData();
            this.renderCharts();
            this.updateRecentActivity();
            
            // Mostrar notificación de éxito
            if (window.NotificationManager) {
                NotificationManager.showToast('Dashboard actualizado', 'success');
            }
        } catch (error) {
            console.error('Error refrescando dashboard:', error);
            
            if (window.NotificationManager) {
                NotificationManager.showToast('Error al actualizar dashboard', 'error');
            }
        }
    },

    /**
     * Obtener datos actuales
     */
    getData() {
        return {
            stats: this.state.stats,
            recentActivity: this.state.recentActivity,
            isLoaded: this.state.isLoaded
        };
    }
};

// Exportar para uso global
window.DashboardComponent = DashboardComponent;