/**
 * LIBRERÍA DIGITAL - GESTIÓN DE USUARIOS
 * Archivo: assets/js/modules/user-management.js
 * Descripción: Funcionalidad para gestión de usuarios
 */

// ===== CONFIGURACIÓN =====
const USER_API_URL = 'api/users_fix.php';

// ===== ESTADO DEL MÓDULO =====
const UserManager = {
    // Elementos DOM
    newUserBtn: null,
    modal: null,
    form: null,
    closeBtn: null,
    cancelBtn: null,
    togglePasswordBtn: null,
    
    // Estado
    isLoading: false,
    users: [],
    isInitialized: false,
    
    // Estado de paginación
    pagination: {
        currentPage: 1,
        itemsPerPage: 5,
        totalItems: 0,
        totalPages: 0
    },
    
    /**
     * Inicializar el módulo
     */
    init() {
        if (this.isInitialized) {
            console.log('⚠️ UserManager ya está inicializado');
            return;
        }
        
        console.log('🚀 Inicializando UserManager...');
        
        if (!this.bindElements()) {
            console.log('❌ No se pudieron vincular elementos, cancelando inicialización');
            return;
        }
        
        this.bindEvents();
        this.setupPaginationButtons();
        this.loadUsers();
        this.isInitialized = true;
        console.log('✅ UserManager inicializado correctamente');
    },
    
    /**
     * Vincular elementos DOM
     */
    bindElements() {
        this.newUserBtn = document.getElementById('new-user-btn');
        this.modal = document.getElementById('new-user-modal');
        this.form = document.getElementById('new-user-form');
        this.closeBtn = document.getElementById('close-modal-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.togglePasswordBtn = document.getElementById('toggle-password');
        
        // Verificar que los elementos existen
        if (!this.newUserBtn) {
            console.warn('⚠️ Botón "Nuevo Usuario" no encontrado');
            return false;
        }
        
        if (!this.modal || !this.form) {
            console.warn('⚠️ Modal o formulario no encontrado');
            return false;
        }
        
        return true;
    },
    
    /**
     * Vincular eventos
     */
    bindEvents() {
        if (!this.bindElements()) return;
        
        // Abrir modal
        this.newUserBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
        });
        
        // Cerrar modal
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.cancelBtn?.addEventListener('click', () => this.closeModal());
        
        // Cerrar modal al hacer click fuera
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
        
        // Toggle password visibility
        this.togglePasswordBtn?.addEventListener('click', this.togglePasswordVisibility);
        
        // Enviar formulario
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        
        // Validación en tiempo real
        const passwordField = document.getElementById('user-password');
        const confirmField = document.getElementById('user-password-confirm');
        
        confirmField?.addEventListener('input', () => {
            this.validatePasswordMatch();
        });
        
        passwordField?.addEventListener('input', () => {
            this.validatePasswordMatch();
        });
    },
    
    /**
     * Abrir modal
     */
    openModal() {
        console.log('📱 Abriendo modal de nuevo usuario');
        this.resetForm();
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Enfocar primer campo
        setTimeout(() => {
            document.getElementById('user-name')?.focus();
        }, 100);
    },
    
    /**
     * Cerrar modal
     */
    closeModal() {
        console.log('❌ Cerrando modal');
        this.modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.resetForm();
    },
    
    /**
     * Resetear formulario
     */
    resetForm() {
        this.form.reset();
        this.hideErrors();
        this.setLoading(false);
        
        // Resetear modo edición
        this.setModalEditMode(false);
    },
    
    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        const passwordField = document.getElementById('user-password');
        const eyeIcon = document.querySelector('#toggle-password i');
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            eyeIcon.className = 'fas fa-eye-slash';
        } else {
            passwordField.type = 'password';
            eyeIcon.className = 'fas fa-eye';
        }
    },
    
    /**
     * Validar que las contraseñas coincidan
     */
    validatePasswordMatch() {
        const password = document.getElementById('user-password').value;
        const confirm = document.getElementById('user-password-confirm').value;
        const confirmField = document.getElementById('user-password-confirm');
        
        if (confirm === '') {
            confirmField.classList.remove('border-red-500', 'border-green-500');
            return;
        }
        
        if (password === confirm) {
            confirmField.classList.remove('border-red-500');
            confirmField.classList.add('border-green-500');
        } else {
            confirmField.classList.remove('border-green-500');
            confirmField.classList.add('border-red-500');
        }
    },
    
    /**
     * Manejar envío del formulario
     */
    async handleFormSubmit() {
        if (this.isLoading) return;
        
        const isEditMode = this.form.dataset.editMode === 'true';
        const userId = this.form.dataset.editUserId;
        
        console.log(`📝 Enviando formulario de ${isEditMode ? 'editar' : 'nuevo'} usuario`);
        
        // Validar formulario
        if (!this.validateForm(isEditMode)) {
            return;
        }
        
        this.setLoading(true);
        
        try {
            // Recopilar datos del formulario
            const formData = new FormData(this.form);
            const userData = {};
            
            for (let [key, value] of formData.entries()) {
                userData[key] = value;
            }
            
            // Remover confirmación de contraseña
            delete userData.password_confirm;
            
            // Si es modo edición, agregar ID y acción
            if (isEditMode) {
                userData.user_id = userId;
                userData.action = 'update';
            }
            
            // Enviar a la API
            console.log('📤 Enviando datos:', userData);
            
            const response = await fetch(USER_API_URL, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            console.log('📡 Response status:', response.status);
            
            // Obtener respuesta como texto primero
            const responseText = await response.text();
            console.log('📄 Raw response:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
                console.log('✅ Parsed result:', result);
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                throw new Error(`Respuesta inválida del servidor: ${responseText.substring(0, 200)}`);
            }
            
            // Verificar si es una respuesta válida de la API
            if (typeof result === 'object' && result !== null) {
                if (result.success === true) {
                    this.handleSuccess(result, isEditMode);
                } else if (result.success === false) {
                    this.handleError(result);
                } else {
                    // Respuesta inesperada (como debug)
                    console.warn('⚠️ Respuesta inesperada:', result);
                    this.showErrors(['Respuesta inesperada del servidor. Revisa la configuración.']);
                }
            } else {
                this.showErrors(['Respuesta inválida del servidor']);
            }
            
        } catch (error) {
            console.error(`❌ Error al ${isEditMode ? 'actualizar' : 'crear'} usuario:`, error);
            this.showErrors([error.message || 'Error de conexión con el servidor']);
        } finally {
            this.setLoading(false);
        }
    },
    
    /**
     * Validar formulario
     */
    validateForm(isEditMode = false) {
        const errors = [];
        
        // Validar campos requeridos
        const nombre = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const password = document.getElementById('user-password').value;
        const passwordConfirm = document.getElementById('user-password-confirm').value;
        const rol = document.getElementById('user-role').value;
        
        if (!nombre) errors.push('El nombre es requerido');
        if (!email) errors.push('El email es requerido');
        if (!rol) errors.push('El rol es requerido');
        
        // En modo edición, la contraseña es opcional
        if (!isEditMode) {
            if (!password) errors.push('La contraseña es requerida');
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            errors.push('El email no es válido');
        }
        
        // Validar contraseña solo si se proporcionó
        if (password && password.length < 6) {
            errors.push('La contraseña debe tener al menos 6 caracteres');
        }
        
        // Validar que las contraseñas coincidan solo si se proporcionó contraseña
        if (password && password !== passwordConfirm) {
            errors.push('Las contraseñas no coinciden');
        }
        
        if (errors.length > 0) {
            this.showErrors(errors);
            return false;
        }
        
        this.hideErrors();
        return true;
    },
    
    /**
     * Mostrar errores
     */
    showErrors(errors) {
        const errorContainer = document.getElementById('form-errors');
        const errorList = document.getElementById('error-list');
        
        errorList.innerHTML = '';
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            errorList.appendChild(li);
        });
        
        errorContainer.classList.remove('hidden');
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    
    /**
     * Ocultar errores
     */
    hideErrors() {
        document.getElementById('form-errors').classList.add('hidden');
    },
    
    /**
     * Manejar éxito
     */
    handleSuccess(result, isEditMode = false) {
        const action = isEditMode ? 'actualizado' : 'creado';
        console.log(`✅ Usuario ${action} exitosamente:`, result.user);
        
        // Mostrar notificación de éxito
        this.showToast(`Usuario "${result.user.nombre}" ${action} exitosamente`, 'success');
        
        // Cerrar modal
        this.closeModal();
        
        // Si se creó un usuario nuevo, ir a la primera página para verlo
        if (!isEditMode) {
            this.pagination.currentPage = 1;
        }
        
        // Recargar lista de usuarios
        this.loadUsers();
        
        // Actualizar estadísticas
        this.updateStats();
    },
    
    /**
     * Manejar error
     */
    handleError(result) {
        console.error('❌ Error al crear usuario:', result);
        
        if (result.errors && Array.isArray(result.errors)) {
            this.showErrors(result.errors);
        } else if (result.message) {
            this.showErrors([result.message]);
        } else {
            this.showErrors(['Error desconocido al crear usuario']);
        }
    },
    
    /**
     * Cargar lista de usuarios
     */
    async loadUsers() {
        try {
            console.log('📥 Cargando usuarios y estadísticas...');
            const response = await fetch(USER_API_URL);
            const result = await response.json();
            
            if (result.success) {
                this.users = result.users;
                this.renderUsersList(result.users);
                this.updateStats(result.stats);
                console.log(`✅ ${result.users.length} usuarios cargados`);
                console.log('📊 Estadísticas recibidas:', result.stats);
            } else {
                console.error('❌ Error en respuesta de API:', result.message);
            }
        } catch (error) {
            console.error('❌ Error al cargar usuarios:', error);
        }
    },
    
    /**
     * Cargar solo estadísticas (función auxiliar)
     */
    async loadStats() {
        try {
            console.log('📊 Cargando solo estadísticas...');
            const response = await fetch(USER_API_URL);
            const result = await response.json();
            
            if (result.success && result.stats) {
                this.updateStats(result.stats);
                console.log('✅ Estadísticas actualizadas');
            }
        } catch (error) {
            console.error('❌ Error al cargar estadísticas:', error);
        }
    },
    
    /**
     * Renderizar lista de usuarios con paginación
     */
    renderUsersList(users) {
        const tableBody = document.getElementById('users-table-body');
        const countBadge = document.getElementById('users-count-badge');
        
        if (!tableBody) {
            console.warn('⚠️ Tabla de usuarios no encontrada');
            return;
        }
        
        // Actualizar datos de paginación
        this.pagination.totalItems = users.length;
        this.pagination.totalPages = Math.ceil(users.length / this.pagination.itemsPerPage);
        
        // Asegurar que la página actual sea válida
        if (this.pagination.currentPage > this.pagination.totalPages) {
            this.pagination.currentPage = Math.max(1, this.pagination.totalPages);
        }
        
        // Actualizar contador
        if (countBadge) {
            const count = users.length;
            countBadge.textContent = `${count} usuario${count !== 1 ? 's' : ''}`;
        }
        
        // Limpiar tabla
        tableBody.innerHTML = '';
        
        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center">
                        <div class="text-gray-500">
                            <i class="fas fa-users text-4xl mb-4"></i>
                            <p class="text-lg font-medium">No hay usuarios registrados</p>
                            <p class="text-sm">Crea el primer usuario del sistema</p>
                        </div>
                    </td>
                </tr>
            `;
            this.updatePaginationControls();
            return;
        }
        
        // Calcular índices para la página actual
        const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
        const endIndex = startIndex + this.pagination.itemsPerPage;
        const paginatedUsers = users.slice(startIndex, endIndex);
        
        // Renderizar usuarios de la página actual
        paginatedUsers.forEach(user => {
            const row = this.createUserRow(user);
            tableBody.appendChild(row);
        });
        
        // Actualizar controles de paginación
        this.updatePaginationControls();
        
        console.log(`📋 Tabla actualizada con ${paginatedUsers.length}/${users.length} usuarios (Página ${this.pagination.currentPage}/${this.pagination.totalPages})`);
    },
    
    /**
     * Crear fila de usuario para la tabla
     */
    createUserRow(user) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.dataset.userId = user.id;
        
        // Generar iniciales para el avatar
        const initials = this.getInitials(user.nombre);
        const avatarColor = this.getAvatarColor(user.rol);
        
        // Formatear fecha de último acceso
        const lastAccess = this.formatLastAccess(user.ultimo_acceso || user.created_at);
        
        // Configurar rol
        const roleConfig = this.getRoleConfig(user.rol);
        
        // Configurar estado
        const statusConfig = this.getStatusConfig(user.estado);
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-10 w-10 ${avatarColor} rounded-full flex items-center justify-center mr-4">
                        <span class="${avatarColor.includes('bg-') ? avatarColor.replace('bg-', 'text-').replace('100', '600') : 'text-gray-600'} font-semibold">${initials}</span>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${this.escapeHtml(user.nombre)}</div>
                        <div class="text-sm text-gray-500">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${this.escapeHtml(user.email)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleConfig.bgColor} ${roleConfig.textColor}">
                    <i class="${roleConfig.icon} mr-1"></i>${roleConfig.label}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>${lastAccess.date}</div>
                <div class="text-gray-500">${lastAccess.time}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}">
                    <i class="${statusConfig.icon} mr-1 text-xs"></i>${statusConfig.label}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2">
                    <button class="text-indigo-600 hover:text-indigo-900" title="Editar usuario" onclick="UserManager.editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-900" title="Ver perfil" onclick="UserManager.viewUser(${user.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-yellow-600 hover:text-yellow-900" title="Restablecer contraseña" onclick="UserManager.resetPassword(${user.id})">
                        <i class="fas fa-key"></i>
                    </button>
                    ${user.estado === 'activo' ? 
                        `<button class="text-red-600 hover:text-red-900" title="Desactivar usuario" onclick="UserManager.toggleUserStatus(${user.id}, 'inactivo')">
                            <i class="fas fa-ban"></i>
                        </button>` :
                        `<button class="text-green-600 hover:text-green-900" title="Activar usuario" onclick="UserManager.toggleUserStatus(${user.id}, 'activo')">
                            <i class="fas fa-play"></i>
                        </button>`
                    }
                    <button class="text-red-600 hover:text-red-900" title="Eliminar usuario" onclick="UserManager.deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        return row;
    },
    
    /**
     * Obtener iniciales del nombre
     */
    getInitials(nombre) {
        return nombre.split(' ').map(word => word.charAt(0)).slice(0, 2).join('').toUpperCase();
    },
    
    /**
     * Obtener color del avatar según el rol
     */
    getAvatarColor(rol) {
        const colors = {
            'admin': 'bg-red-100',
            'seller': 'bg-blue-100',
            'inventory': 'bg-purple-100',
            'readonly': 'bg-gray-100'
        };
        return colors[rol] || 'bg-gray-100';
    },
    
    /**
     * Configuración de roles
     */
    getRoleConfig(rol) {
        const configs = {
            'admin': {
                label: 'Administrador',
                icon: 'fas fa-crown',
                bgColor: 'bg-red-100',
                textColor: 'text-red-800'
            },
            'seller': {
                label: 'Vendedor',
                icon: 'fas fa-shopping-cart',
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-800'
            },
            'inventory': {
                label: 'Inventario',
                icon: 'fas fa-boxes',
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-800'
            },
            'readonly': {
                label: 'Solo Lectura',
                icon: 'fas fa-eye',
                bgColor: 'bg-gray-100',
                textColor: 'text-gray-800'
            }
        };
        return configs[rol] || configs['readonly'];
    },
    
    /**
     * Configuración de estados
     */
    getStatusConfig(estado) {
        const configs = {
            'activo': {
                label: 'Activo',
                icon: 'fas fa-circle',
                bgColor: 'bg-green-100',
                textColor: 'text-green-800'
            },
            'inactivo': {
                label: 'Inactivo',
                icon: 'fas fa-pause',
                bgColor: 'bg-yellow-100',
                textColor: 'text-yellow-800'
            },
            'suspendido': {
                label: 'Suspendido',
                icon: 'fas fa-ban',
                bgColor: 'bg-red-100',
                textColor: 'text-red-800'
            }
        };
        return configs[estado] || configs['inactivo'];
    },
    
    /**
     * Formatear fecha de último acceso
     */
    formatLastAccess(dateString) {
        if (!dateString) {
            return { date: 'Nunca', time: '' };
        }
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let dateStr;
        if (diffDays === 1) {
            dateStr = 'Hoy';
        } else if (diffDays === 2) {
            dateStr = 'Ayer';
        } else if (diffDays <= 7) {
            dateStr = `Hace ${diffDays - 1} días`;
        } else {
            dateStr = date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
        }
        
        const timeStr = date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        return { date: dateStr, time: timeStr };
    },
    
    /**
     * Escapar HTML para prevenir XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Actualizar estadísticas
     */
    updateStats(stats) {
        if (!stats) {
            console.warn('⚠️ No se recibieron estadísticas para actualizar');
            return;
        }
        
        console.log('📊 Actualizando estadísticas:', stats);
        
        // Actualizar contadores en la sección de usuarios
        const elements = {
            total: document.getElementById('total-users-count'),
            activos: document.getElementById('active-users-count'),
            admins: document.getElementById('admin-users-count'),
            nuevos: document.getElementById('new-users-count')
        };
        
        // Actualizar cada elemento con animación
        if (elements.total) {
            this.animateCounter(elements.total, stats.total);
        }
        if (elements.activos) {
            this.animateCounter(elements.activos, stats.activos);
        }
        if (elements.admins) {
            this.animateCounter(elements.admins, stats.admins);
        }
        if (elements.nuevos) {
            this.animateCounter(elements.nuevos, stats.nuevos_mes);
        }
        
        console.log('✅ Estadísticas actualizadas correctamente');
    },
    
    /**
     * Animar contador con efecto de incremento
     */
    animateCounter(element, targetValue) {
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        const increment = Math.ceil((targetValue - currentValue) / 10);
        
        if (currentValue !== targetValue) {
            element.textContent = Math.max(0, currentValue + increment);
            setTimeout(() => this.animateCounter(element, targetValue), 50);
        } else {
            element.textContent = targetValue;
        }
    },
    
    /**
     * Establecer estado de carga
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const saveBtn = document.getElementById('save-user-btn');
        const saveText = document.getElementById('save-btn-text');
        const saveSpinner = document.getElementById('save-spinner');
        
        if (loading) {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-75', 'cursor-not-allowed');
            saveText.textContent = 'Creando...';
            saveSpinner.classList.remove('hidden');
        } else {
            saveBtn.disabled = false;
            saveBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            saveText.textContent = 'Crear Usuario';
            saveSpinner.classList.add('hidden');
        }
    },
    
    /**
     * Mostrar toast notification
     */
    showToast(message, type = 'info') {
        // Reutilizar función de toast existente si está disponible
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            // Implementación básica
            console.log(`🔔 ${type.toUpperCase()}: ${message}`);
            alert(message);
        }
    },
    
    // ===== MÉTODOS DE ACCIONES CRUD =====
    
    /**
     * Editar usuario
     */
    async editUser(userId) {
        console.log(`✏️ Editando usuario ID: ${userId}`);
        
        try {
            // Buscar usuario en la lista actual
            const user = this.users.find(u => u.id == userId);
            if (!user) {
                this.showToast('Usuario no encontrado', 'error');
                return;
            }
            
            // Cargar datos en el formulario
            this.populateEditForm(user);
            
            // Cambiar el modal a modo edición
            this.setModalEditMode(true, userId);
            
            // Abrir modal
            this.openModal();
            
        } catch (error) {
            console.error('❌ Error al preparar edición:', error);
            this.showToast('Error al cargar datos del usuario', 'error');
        }
    },
    
    /**
     * Ver perfil de usuario
     */
    async viewUser(userId) {
        console.log(`👀 Viendo usuario ID: ${userId}`);
        
        try {
            const user = this.users.find(u => u.id == userId);
            if (!user) {
                this.showToast('Usuario no encontrado', 'error');
                return;
            }
            
            // Crear modal de vista
            this.showUserViewModal(user);
            
        } catch (error) {
            console.error('❌ Error al mostrar usuario:', error);
            this.showToast('Error al mostrar información del usuario', 'error');
        }
    },
    
    /**
     * Restablecer contraseña
     */
    async resetPassword(userId) {
        console.log(`🔑 Restableciendo contraseña para usuario ID: ${userId}`);
        
        const user = this.users.find(u => u.id == userId);
        if (!user) {
            this.showToast('Usuario no encontrado', 'error');
            return;
        }
        
        // Confirmar acción
        if (!confirm(`¿Estás seguro de restablecer la contraseña de ${user.nombre}?\n\nSe enviará una nueva contraseña temporal.`)) {
            return;
        }
        
        try {
            const response = await fetch(USER_API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'reset_password',
                    user_id: userId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`Contraseña restablecida para ${user.nombre}. Nueva contraseña: ${result.new_password}`, 'success');
            } else {
                this.showToast(result.message || 'Error al restablecer contraseña', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error al restablecer contraseña:', error);
            this.showToast('Error de conexión al restablecer contraseña', 'error');
        }
    },
    
    /**
     * Cambiar estado de usuario (activar/desactivar)
     */
    async toggleUserStatus(userId, newStatus) {
        console.log(`🔄 Cambiando estado de usuario ID: ${userId} a: ${newStatus}`);
        
        const user = this.users.find(u => u.id == userId);
        if (!user) {
            this.showToast('Usuario no encontrado', 'error');
            return;
        }
        
        const actionText = newStatus === 'activo' ? 'activar' : 'desactivar';
        
        // Confirmar acción
        if (!confirm(`¿Estás seguro de ${actionText} a ${user.nombre}?`)) {
            return;
        }
        
        try {
            const response = await fetch(USER_API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'toggle_status',
                    user_id: userId,
                    new_status: newStatus
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`Usuario ${actionText}do exitosamente`, 'success');
                // Actualizar la lista
                this.loadUsers();
            } else {
                this.showToast(result.message || `Error al ${actionText} usuario`, 'error');
            }
            
        } catch (error) {
            console.error(`❌ Error al ${actionText} usuario:`, error);
            this.showToast(`Error de conexión al ${actionText} usuario`, 'error');
        }
    },
    
    /**
     * Eliminar usuario (soft delete)
     */
    async deleteUser(userId) {
        console.log(`🗑️ Eliminando usuario ID: ${userId}`);
        
        const user = this.users.find(u => u.id == userId);
        if (!user) {
            this.showToast('Usuario no encontrado', 'error');
            return;
        }
        
        // Doble confirmación para eliminación
        if (!confirm(`⚠️ ¿Estás COMPLETAMENTE SEGURO de eliminar al usuario "${user.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }
        
        if (!confirm(`🚨 CONFIRMACIÓN FINAL: ¿Eliminar definitivamente a "${user.nombre}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(USER_API_URL, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`Usuario ${user.nombre} eliminado exitosamente`, 'success');
                
                // Verificar si necesitamos ajustar la página actual después de eliminar
                const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
                const remainingUsers = this.users.length - 1;
                const maxPage = Math.ceil(remainingUsers / this.pagination.itemsPerPage);
                
                if (this.pagination.currentPage > maxPage && maxPage > 0) {
                    this.pagination.currentPage = maxPage;
                }
                
                // Actualizar la lista
                this.loadUsers();
                this.updateStats();
            } else {
                this.showToast(result.message || 'Error al eliminar usuario', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error al eliminar usuario:', error);
            this.showToast('Error de conexión al eliminar usuario', 'error');
        }
    },
    
    // ===== MÉTODOS AUXILIARES PARA ACCIONES =====
    
    /**
     * Poblar formulario con datos de usuario para edición
     */
    populateEditForm(user) {
        document.getElementById('user-name').value = user.nombre || '';
        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-role').value = user.rol || '';
        document.getElementById('user-phone').value = user.telefono || '';
        document.getElementById('user-address').value = user.direccion || '';
        
        // Ocultar campos de contraseña en modo edición
        const passwordFields = document.querySelectorAll('[id*="password"]');
        passwordFields.forEach(field => {
            const container = field.closest('.mb-4');
            if (container) container.style.display = 'none';
        });
    },
    
    /**
     * Configurar modal en modo edición
     */
    setModalEditMode(isEdit, userId = null) {
        const modalTitle = document.querySelector('#new-user-modal h3');
        const saveButton = document.getElementById('save-user-btn');
        const saveButtonText = document.getElementById('save-btn-text');
        
        if (isEdit) {
            if (modalTitle) modalTitle.textContent = 'Editar Usuario';
            if (saveButtonText) saveButtonText.textContent = 'Actualizar Usuario';
            this.form.dataset.editMode = 'true';
            this.form.dataset.editUserId = userId;
        } else {
            if (modalTitle) modalTitle.textContent = 'Nuevo Usuario';
            if (saveButtonText) saveButtonText.textContent = 'Crear Usuario';
            delete this.form.dataset.editMode;
            delete this.form.dataset.editUserId;
            
            // Mostrar campos de contraseña
            const passwordFields = document.querySelectorAll('[id*="password"]');
            passwordFields.forEach(field => {
                const container = field.closest('.mb-4');
                if (container) container.style.display = 'block';
            });
        }
    },
    
    /**
     * Mostrar modal de vista de usuario
     */
    showUserViewModal(user) {
        // Crear overlay modal
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        // Formatear fecha de creación
        const createdDate = new Date(user.created_at || user.fecha_creacion).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Configuración de rol y estado
        const roleConfig = this.getRoleConfig(user.rol);
        const statusConfig = this.getStatusConfig(user.estado);
        
        overlay.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-semibold text-gray-900">Perfil de Usuario</h3>
                        <button class="text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <!-- Avatar y nombre -->
                    <div class="text-center mb-6">
                        <div class="h-20 w-20 ${this.getAvatarColor(user.rol)} rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-white text-2xl font-bold">${this.getInitials(user.nombre)}</span>
                        </div>
                        <h4 class="text-2xl font-bold text-gray-900">${this.escapeHtml(user.nombre)}</h4>
                        <p class="text-gray-600">ID: ${user.id}</p>
                    </div>
                    
                    <!-- Información básica -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <p class="text-gray-900 bg-gray-50 p-2 rounded">${this.escapeHtml(user.email)}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                            <span class="inline-flex px-3 py-1 text-sm font-semibold rounded-full ${roleConfig.bgColor} ${roleConfig.textColor}">
                                <i class="${roleConfig.icon} mr-2"></i>${roleConfig.label}
                            </span>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <span class="inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}">
                                <i class="${statusConfig.icon} mr-2"></i>${statusConfig.label}
                            </span>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <p class="text-gray-900 bg-gray-50 p-2 rounded">${user.telefono || 'No especificado'}</p>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                            <p class="text-gray-900 bg-gray-50 p-2 rounded">${user.direccion || 'No especificada'}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Registro</label>
                            <p class="text-gray-900 bg-gray-50 p-2 rounded">${createdDate}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Último Acceso</label>
                            <p class="text-gray-900 bg-gray-50 p-2 rounded">${user.ultimo_acceso ? this.formatLastAccess(user.ultimo_acceso).date + ' ' + this.formatLastAccess(user.ultimo_acceso).time : 'Nunca'}</p>
                        </div>
                    </div>
                    
                    <!-- Botones de acción -->
                    <div class="mt-8 flex gap-3 justify-end">
                        <button onclick="UserManager.editUser(${user.id}); this.closest('.fixed').remove()" 
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="UserManager.resetPassword(${user.id})" 
                                class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2">
                            <i class="fas fa-key"></i> Restablecer Contraseña
                        </button>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar al DOM
        document.body.appendChild(overlay);
        
        // Cerrar con ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    },
    
    // ===== MÉTODOS DE PAGINACIÓN =====
    
    /**
     * Configurar botones de paginación
     */
    setupPaginationButtons() {
        // Los botones se actualizarán dinámicamente en updatePaginationControls
        console.log('🔧 Configurando sistema de paginación');
    },
    
    /**
     * Actualizar controles de paginación
     */
    updatePaginationControls() {
        this.updatePaginationInfo();
        this.updatePaginationButtons();
    },
    
    /**
     * Actualizar información de paginación (texto "Mostrando X a Y de Z usuarios")
     */
    updatePaginationInfo() {
        const paginationInfo = document.getElementById('users-pagination-info');
        
        if (!paginationInfo || this.pagination.totalItems === 0) {
            if (paginationInfo) {
                paginationInfo.innerHTML = 'No hay usuarios para mostrar';
            }
            return;
        }
        
        const startItem = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage + 1;
        const endItem = Math.min(startItem + this.pagination.itemsPerPage - 1, this.pagination.totalItems);
        
        paginationInfo.innerHTML = `
            Mostrando <span class="font-medium">${startItem}</span> a <span class="font-medium">${endItem}</span> de
            <span class="font-medium">${this.pagination.totalItems}</span> usuarios
        `;
    },
    
    /**
     * Actualizar botones de paginación
     */
    updatePaginationButtons() {
        const buttonContainer = document.getElementById('users-pagination-buttons');
        
        if (!buttonContainer) {
            console.warn('⚠️ Contenedor de botones de paginación no encontrado');
            return;
        }
        
        // Limpiar botones existentes
        buttonContainer.innerHTML = '';
        
        // Botón "Anterior"
        const prevButton = this.createPaginationButton('Anterior', this.pagination.currentPage - 1, this.pagination.currentPage <= 1);
        buttonContainer.appendChild(prevButton);
        
        // Calcular páginas a mostrar
        const maxVisiblePages = 3; // Máximo 3 páginas numeradas
        let startPage = Math.max(1, this.pagination.currentPage - 1);
        let endPage = Math.min(this.pagination.totalPages, startPage + maxVisiblePages - 1);
        
        // Ajustar inicio si estamos cerca del final
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Botones de páginas numeradas
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = this.createPaginationButton(i.toString(), i, false, i === this.pagination.currentPage);
            buttonContainer.appendChild(pageButton);
        }
        
        // Botón "Siguiente"
        const nextButton = this.createPaginationButton('Siguiente', this.pagination.currentPage + 1, this.pagination.currentPage >= this.pagination.totalPages);
        buttonContainer.appendChild(nextButton);
    },
    
    /**
     * Crear botón de paginación
     */
    createPaginationButton(text, page, disabled = false, isActive = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.type = 'button';
        
        // Clases base
        button.className = 'px-3 py-1 text-sm rounded-md transition-colors duration-200';
        
        if (disabled) {
            button.className += ' border border-gray-300 text-gray-400 cursor-not-allowed opacity-50';
            button.disabled = true;
        } else if (isActive) {
            button.className += ' bg-indigo-600 text-white hover:bg-indigo-700';
        } else {
            button.className += ' border border-gray-300 text-gray-700 hover:bg-gray-100';
        }
        
        // Event listener para navegación
        if (!disabled) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToPage(page);
            });
        }
        
        return button;
    },
    
    /**
     * Ir a una página específica
     */
    goToPage(page) {
        if (page < 1 || page > this.pagination.totalPages || page === this.pagination.currentPage) {
            return;
        }
        
        console.log(`📄 Navegando a página ${page}/${this.pagination.totalPages}`);
        
        this.pagination.currentPage = page;
        
        // Re-renderizar la tabla con los usuarios de la nueva página
        this.renderUsersList(this.users);
    },
    
    /**
     * Ir a la primera página
     */
    goToFirstPage() {
        this.goToPage(1);
    },
    
    /**
     * Ir a la última página
     */
    goToLastPage() {
        this.goToPage(this.pagination.totalPages);
    },
    
    /**
     * Ir a la página siguiente
     */
    goToNextPage() {
        this.goToPage(this.pagination.currentPage + 1);
    },
    
    /**
     * Ir a la página anterior
     */
    goToPreviousPage() {
        this.goToPage(this.pagination.currentPage - 1);
    }
};

// ===== INICIALIZACIÓN AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', () => {
    // Intentar inicializar inmediatamente
    if (document.getElementById('new-user-btn')) {
        console.log('🚀 Inicializando UserManager inmediatamente');
        UserManager.init();
    } else {
        console.log('⏳ Botón no encontrado, esperando cambios de sección...');
        
        // Observar cambios en el DOM para detectar cuando se muestre la sección de usuarios
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id === 'users-section' && !target.classList.contains('hidden')) {
                        console.log('👥 Sección de usuarios activada, inicializando...');
                        if (document.getElementById('new-user-btn')) {
                            UserManager.init();
                            observer.disconnect(); // Dejar de observar una vez inicializado
                        }
                    }
                }
            });
        });
        
        // Observar cambios en las secciones
        const usersSection = document.getElementById('users-section');
        if (usersSection) {
            observer.observe(usersSection, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
        
        // También verificar por URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('section') === 'users') {
            console.log('🔗 URL indica sección usuarios, esperando elementos...');
            setTimeout(() => {
                if (document.getElementById('new-user-btn') && !UserManager.newUserBtn) {
                    console.log('🚀 Inicializando UserManager por URL parameter');
                    UserManager.init();
                }
            }, 500);
        }
    }
});

// Función para inicializar manualmente (para debugging)
window.initUserManager = () => {
    console.log('🔧 Inicialización manual de UserManager');
    UserManager.init();
};

// Hacer disponible globalmente para debugging
window.UserManager = UserManager;