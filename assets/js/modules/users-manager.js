/**
 * LIBRERÍA DIGITAL - GESTOR DE USUARIOS
 * Archivo: assets/js/modules/users-manager.js
 * Descripción: Módulo para gestión completa de usuarios
 */

console.log('👥 CARGANDO users-manager.js...');

const UsersManager = {
    // Estado del módulo
    state: {
        users: [],
        currentUser: null,
        isLoading: false,
        isInitialized: false,
        pagination: {
            current_page: 1,
            per_page: 10,
            total_records: 0,
            total_pages: 0
        },
        filters: {
            search: '',
            rol: '',
            estado: ''
        },
        stats: {
            total_users: 0,
            active_users: 0,
            admin_users: 0,
            new_users_this_month: 0,
            blocked_users: 0,
            recent_access_users: 0,
            role_distribution: {},
            status_distribution: {},
            current_month: ''
        }
    },

    // Elementos del DOM
    elements: {
        container: null,
        table: null,
        tbody: null,
        addButton: null,
        modal: null,
        form: null,
        searchInput: null,
        rolFilter: null,
        estadoFilter: null,
        pagination: null,
        // Elementos de estadísticas
        totalUsersCount: null,
        activeUsersCount: null,
        adminUsersCount: null,
        newUsersCount: null
    },

    /**
     * Inicializar el módulo
     */
    async init() {
        if (this.state.isInitialized) {
            console.log('👥 UsersManager ya está inicializado');
            return;
        }

        console.log('👥 Inicializando UsersManager...');

        try {
            // Bindear elementos del DOM
            this.bindElements();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Cargar estadísticas iniciales
            await this.loadUserStats();
            
            // Cargar usuarios iniciales
            await this.loadUsers();
            
            this.state.isInitialized = true;
            console.log('✅ UsersManager inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando UsersManager:', error);
            this.showError('Error inicializando gestión de usuarios: ' + error.message);
        }
    },

    /**
     * Bindear elementos del DOM
     */
    bindElements() {
        console.log('👥 Bindeando elementos del DOM...');

        this.elements.container = document.getElementById('users-section');
        this.elements.table = document.getElementById('users-table');
        this.elements.tbody = document.getElementById('users-tbody');
        this.elements.addButton = document.getElementById('add-user-btn');
        this.elements.modal = document.getElementById('user-modal');
        this.elements.form = document.getElementById('user-form');
        this.elements.searchInput = document.getElementById('users-search');
        this.elements.rolFilter = document.getElementById('users-rol-filter');
        this.elements.estadoFilter = document.getElementById('users-estado-filter');
        this.elements.pagination = document.getElementById('users-pagination');
        
        // Elementos de estadísticas
        this.elements.totalUsersCount = document.getElementById('total-users-count');
        this.elements.activeUsersCount = document.getElementById('active-users-count');
        this.elements.adminUsersCount = document.getElementById('admin-users-count');
        this.elements.newUsersCount = document.getElementById('new-users-count');

        // Verificar elementos críticos
        const criticalElements = ['container', 'table', 'tbody', 'addButton'];
        for (const elementName of criticalElements) {
            if (!this.elements[elementName]) {
                throw new Error(`Elemento crítico no encontrado: ${elementName}`);
            }
        }

        console.log('✅ Elementos bindeados correctamente');
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        console.log('👥 Configurando event listeners...');

        // Botón agregar usuario
        if (this.elements.addButton) {
            this.elements.addButton.addEventListener('click', () => this.openAddModal());
        }

        // Búsqueda en tiempo real
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', 
                this.debounce(() => this.handleSearch(), 500)
            );
        }

        // Filtros
        if (this.elements.rolFilter) {
            this.elements.rolFilter.addEventListener('change', () => this.handleFilters());
        }

        if (this.elements.estadoFilter) {
            this.elements.estadoFilter.addEventListener('change', () => this.handleFilters());
        }

        // Formulario
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        console.log('✅ Event listeners configurados');
    },

    /**
     * Cargar usuarios desde el servidor
     */
    async loadUsers(page = 1) {
        if (this.state.isLoading) return;

        console.log('👥 Cargando usuarios...');
        this.state.isLoading = true;
        this.showTableLoading(true);

        try {
            // Construir parámetros de consulta
            const params = new URLSearchParams({
                page: page,
                limit: this.state.pagination.per_page,
                search: this.state.filters.search,
                rol: this.state.filters.rol,
                estado: this.state.filters.estado
            });

            const response = await fetch(`api/users.php?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error cargando usuarios');
            }

            const data = await response.json();

            if (data.success) {
                this.state.users = data.data;
                this.state.pagination = data.pagination;
                this.state.filters = data.filters;

                this.renderUsers();
                this.renderPagination();
                
                console.log('✅ Usuarios cargados:', this.state.users.length);
            } else {
                throw new Error(data.message || 'Error en respuesta del servidor');
            }

        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
            this.showError('Error cargando usuarios: ' + error.message);
        } finally {
            this.state.isLoading = false;
            this.showTableLoading(false);
        }
    },

    /**
     * Renderizar tabla de usuarios
     */
    renderUsers() {
        if (!this.elements.tbody) return;

        console.log('👥 Renderizando usuarios en tabla...');

        if (this.state.users.length === 0) {
            this.elements.tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                            <p class="text-lg font-medium">No se encontraron usuarios</p>
                            <p class="text-sm">Ajusta los filtros o agrega nuevos usuarios</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.elements.tbody.innerHTML = this.state.users.map(user => this.renderUserRow(user)).join('');
        
        // Configurar event listeners para botones de acciones
        this.setupRowEventListeners();
    },

    /**
     * Renderizar fila de usuario
     */
    renderUserRow(user) {
        const estadoColors = {
            'activo': 'bg-green-100 text-green-800',
            'inactivo': 'bg-gray-100 text-gray-800',
            'suspendido': 'bg-red-100 text-red-800'
        };

        const rolColors = {
            'admin': 'bg-purple-100 text-purple-800',
            'seller': 'bg-blue-100 text-blue-800',
            'inventory': 'bg-orange-100 text-orange-800',
            'readonly': 'bg-gray-100 text-gray-800'
        };

        const isBlocked = user.is_blocked;
        const blockIcon = isBlocked ? '<i class="fas fa-lock text-red-500 ml-2"></i>' : '';

        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                                <span class="text-white font-medium">
                                    ${user.nombre.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${user.nombre}${blockIcon}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${user.email}</div>
                    ${user.telefono ? `<div class="text-sm text-gray-500">${user.telefono}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rolColors[user.rol] || 'bg-gray-100 text-gray-800'}">
                        ${user.rol_display}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${user.ultimo_acceso_formatted}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColors[user.estado] || 'bg-gray-100 text-gray-800'}">
                        ${user.estado_display}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="UsersManager.editUser(${user.id})" 
                                class="text-indigo-600 hover:text-indigo-900 transition-colors"
                                title="Editar usuario">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="UsersManager.confirmDeleteUser(${user.id}, '${user.nombre.replace(/'/g, "\\'")}')" 
                                class="text-red-600 hover:text-red-900 transition-colors"
                                title="Eliminar usuario">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${isBlocked ? 
                            `<button onclick="UsersManager.unblockUser(${user.id})" 
                                     class="text-green-600 hover:text-green-900 transition-colors"
                                     title="Desbloquear usuario">
                                <i class="fas fa-unlock"></i>
                             </button>` : ''
                        }
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Configurar event listeners para filas
     */
    setupRowEventListeners() {
        // Los event listeners se manejan mediante onclick en el HTML por simplicidad
        // En una aplicación más grande, sería mejor usar event delegation
    },

    /**
     * Renderizar paginación
     */
    renderPagination() {
        if (!this.elements.pagination) return;

        const { current_page, total_pages, total_records } = this.state.pagination;

        if (total_pages <= 1) {
            this.elements.pagination.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1 flex justify-between sm:hidden">
                    ${current_page > 1 ? 
                        `<button onclick="UsersManager.goToPage(${current_page - 1})" 
                                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Anterior
                         </button>` : 
                        `<span></span>`
                    }
                    ${current_page < total_pages ? 
                        `<button onclick="UsersManager.goToPage(${current_page + 1})" 
                                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Siguiente
                         </button>` : 
                        `<span></span>`
                    }
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700">
                            Mostrando
                            <span class="font-medium">${((current_page - 1) * this.state.pagination.per_page) + 1}</span>
                            a
                            <span class="font-medium">${Math.min(current_page * this.state.pagination.per_page, total_records)}</span>
                            de
                            <span class="font-medium">${total_records}</span>
                            resultados
                        </p>
                    </div>
                    <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        `;

        // Botón anterior
        paginationHTML += current_page > 1 ? 
            `<button onclick="UsersManager.goToPage(${current_page - 1})" 
                     class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <i class="fas fa-chevron-left"></i>
             </button>` :
            `<span class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400">
                <i class="fas fa-chevron-left"></i>
             </span>`;

        // Números de página
        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(total_pages, current_page + 2);

        if (startPage > 1) {
            paginationHTML += `<button onclick="UsersManager.goToPage(1)" class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === current_page;
            paginationHTML += `
                <button onclick="UsersManager.goToPage(${i})" 
                        class="relative inline-flex items-center px-4 py-2 border ${isActive ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium">
                    ${i}
                </button>
            `;
        }

        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                paginationHTML += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
            }
            paginationHTML += `<button onclick="UsersManager.goToPage(${total_pages})" class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">${total_pages}</button>`;
        }

        // Botón siguiente
        paginationHTML += current_page < total_pages ? 
            `<button onclick="UsersManager.goToPage(${current_page + 1})" 
                     class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <i class="fas fa-chevron-right"></i>
             </button>` :
            `<span class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400">
                <i class="fas fa-chevron-right"></i>
             </span>`;

        paginationHTML += `
                        </nav>
                    </div>
                </div>
            </div>
        `;

        this.elements.pagination.innerHTML = paginationHTML;
    },

    /**
     * Cargar estadísticas de usuarios
     */
    async loadUserStats() {
        console.log('📊 Cargando estadísticas de usuarios...');
        
        try {
            const response = await fetch('api/users.php?stats=true', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error cargando estadísticas');
            }

            const data = await response.json();

            if (data.success) {
                this.state.stats = data.data;
                this.updateStatsDisplay();
                
                console.log('✅ Estadísticas cargadas:', this.state.stats);
            } else {
                throw new Error(data.message || 'Error en respuesta del servidor');
            }

        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            this.showError('Error cargando estadísticas: ' + error.message);
        }
    },

    /**
     * Actualizar display de estadísticas
     */
    updateStatsDisplay() {
        console.log('📊 Actualizando display de estadísticas...');

        // Actualizar contadores principales
        if (this.elements.totalUsersCount) {
            this.elements.totalUsersCount.textContent = this.state.stats.total_users;
            this.animateCounter(this.elements.totalUsersCount, this.state.stats.total_users);
        }

        if (this.elements.activeUsersCount) {
            this.elements.activeUsersCount.textContent = this.state.stats.active_users;
            this.animateCounter(this.elements.activeUsersCount, this.state.stats.active_users);
        }

        if (this.elements.adminUsersCount) {
            this.elements.adminUsersCount.textContent = this.state.stats.admin_users;
            this.animateCounter(this.elements.adminUsersCount, this.state.stats.admin_users);
        }

        if (this.elements.newUsersCount) {
            this.elements.newUsersCount.textContent = this.state.stats.new_users_this_month;
            this.animateCounter(this.elements.newUsersCount, this.state.stats.new_users_this_month);
        }

        console.log('✅ Estadísticas actualizadas en la UI');
    },

    /**
     * Animar contador numérico
     */
    animateCounter(element, targetValue) {
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        
        // Si el valor es el mismo, no animar
        if (currentValue === targetValue) return;
        
        const duration = 1000; // 1 segundo
        const startTime = performance.now();
        
        const animateStep = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Usar easing para una animación más suave
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentDisplay = Math.round(currentValue + (targetValue - currentValue) * easedProgress);
            
            element.textContent = currentDisplay;
            
            if (progress < 1) {
                requestAnimationFrame(animateStep);
            } else {
                element.textContent = targetValue; // Asegurar valor exacto
            }
        };
        
        requestAnimationFrame(animateStep);
    },

    /**
     * Ir a página específica
     */
    async goToPage(page) {
        if (page < 1 || page > this.state.pagination.total_pages) return;
        await this.loadUsers(page);
    },

    /**
     * Manejar búsqueda
     */
    async handleSearch() {
        if (!this.elements.searchInput) return;
        
        this.state.filters.search = this.elements.searchInput.value;
        await this.loadUsers(1);
    },

    /**
     * Manejar filtros
     */
    async handleFilters() {
        this.state.filters.rol = this.elements.rolFilter?.value || '';
        this.state.filters.estado = this.elements.estadoFilter?.value || '';
        await this.loadUsers(1);
    },

    /**
     * Abrir modal para agregar usuario
     */
    openAddModal() {
        this.state.currentUser = null;
        this.showModal('Agregar Usuario');
        this.resetForm();
    },

    /**
     * Editar usuario
     */
    async editUser(userId) {
        console.log('👥 Editando usuario:', userId);

        const user = this.state.users.find(u => u.id === userId);
        if (!user) {
            this.showError('Usuario no encontrado');
            return;
        }

        this.state.currentUser = user;
        this.showModal('Editar Usuario');
        this.populateForm(user);
    },

    /**
     * Confirmar eliminación de usuario
     */
    confirmDeleteUser(userId, userName) {
        if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${userName}"?\n\nEsta acción no se puede deshacer.`)) {
            this.deleteUser(userId);
        }
    },

    /**
     * Eliminar usuario
     */
    async deleteUser(userId) {
        console.log('👥 Eliminando usuario:', userId);

        try {
            const response = await fetch(`api/users.php?id=${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(data.message);
                await this.loadUserStats(); // Actualizar estadísticas
                await this.loadUsers(this.state.pagination.current_page);
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error('❌ Error eliminando usuario:', error);
            this.showError('Error eliminando usuario: ' + error.message);
        }
    },

    /**
     * Desbloquear usuario
     */
    async unblockUser(userId) {
        console.log('👥 Desbloqueando usuario:', userId);

        try {
            const response = await fetch(`api/users.php?id=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    intentos_login: 0,
                    bloqueado_hasta: null
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Usuario desbloqueado exitosamente');
                await this.loadUserStats(); // Actualizar estadísticas
                await this.loadUsers(this.state.pagination.current_page);
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error('❌ Error desbloqueando usuario:', error);
            this.showError('Error desbloqueando usuario: ' + error.message);
        }
    },

    /**
     * Manejar envío del formulario
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        console.log('👥 Enviando formulario de usuario...');

        const formData = new FormData(this.elements.form);
        const userData = Object.fromEntries(formData.entries());

        try {
            const isEditing = this.state.currentUser !== null;
            const url = isEditing ? `api/users.php?id=${this.state.currentUser.id}` : 'api/users.php';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(data.message);
                this.hideModal();
                await this.loadUserStats(); // Actualizar estadísticas
                await this.loadUsers(this.state.pagination.current_page);
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error('❌ Error guardando usuario:', error);
            this.showError('Error guardando usuario: ' + error.message);
        }
    },

    /**
     * Mostrar modal
     */
    showModal(title) {
        if (!this.elements.modal) return;

        const titleElement = this.elements.modal.querySelector('#modal-title');
        if (titleElement) titleElement.textContent = title;

        this.elements.modal.classList.remove('hidden');
    },

    /**
     * Ocultar modal
     */
    hideModal() {
        if (!this.elements.modal) return;
        
        this.elements.modal.classList.add('hidden');
        this.resetForm();
    },

    /**
     * Resetear formulario
     */
    resetForm() {
        if (!this.elements.form) return;
        
        this.elements.form.reset();
        
        // Limpiar errores de validación
        const errorElements = this.elements.form.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());
    },

    /**
     * Poblar formulario con datos de usuario
     */
    populateForm(user) {
        if (!this.elements.form) return;

        const fields = ['nombre', 'email', 'rol', 'estado', 'telefono'];
        fields.forEach(field => {
            const input = this.elements.form.querySelector(`[name="${field}"]`);
            if (input && user[field] !== null) {
                input.value = user[field];
            }
        });

        // La contraseña se deja vacía en modo edición
        const passwordInput = this.elements.form.querySelector('[name="password"]');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.placeholder = 'Dejar vacío para mantener contraseña actual';
        }
    },

    /**
     * Mostrar loading en tabla
     */
    showTableLoading(show) {
        if (!this.elements.tbody) return;

        if (show) {
            this.elements.tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center">
                        <div class="flex flex-col items-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                            <p class="text-gray-500">Cargando usuarios...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * Mostrar mensaje de éxito
     */
    showSuccess(message) {
        console.log('✅', message);
        // Aquí puedes integrar con tu sistema de notificaciones
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            alert(message);
        }
    },

    /**
     * Mostrar mensaje de error
     */
    showError(message) {
        console.error('❌', message);
        // Aquí puedes integrar con tu sistema de notificaciones
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    },

    /**
     * Debounce function
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
    }
};

// Event listener para cerrar modal con Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && UsersManager.elements.modal && !UsersManager.elements.modal.classList.contains('hidden')) {
        UsersManager.hideModal();
    }
});

// Hacer el objeto globalmente accesible
window.UsersManager = UsersManager;

console.log('✅ users-manager.js cargado completamente');