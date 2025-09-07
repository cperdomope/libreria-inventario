/**
 * LIBRERÍA DIGITAL - GESTOR DE INVENTARIO
 * Archivo: assets/js/modules/inventory-manager.js
 * Descripción: Funcionalidad de filtrado y gestión de inventario de libros
 */

const InventoryManager = {
    // Estado del inventario
    state: {
        books: [],
        categories: [],
        currentFilters: {
            search: '',
            categoria_id: '',
            estado: '',
            formato: '',
            stock_bajo: false,
            destacado: false,
            nuevo_ingreso: false,
            precio_min: '',
            precio_max: ''
        },
        pagination: {
            current_page: 1,
            per_page: 5,
            total_records: 0,
            total_pages: 0
        },
        loading: false,
        error: null,
        isInitialized: false,
        submitting: false,
        editingBookId: null
    },

    // Elementos del DOM
    elements: {
        searchInput: null,
        categoryFilter: null,
        advancedFiltersBtn: null,
        advancedFiltersModal: null,
        closeFiltersModal: null,
        applyFilters: null,
        clearFilters: null,
        booksTableBody: null,
        booksCount: null,
        paginationContainer: null,
        loadingState: null,
        emptyState: null,
        // Filtros avanzados
        estadoFilter: null,
        formatoFilter: null,
        stockBajoFilter: null,
        agotadoFilter: null,
        destacadoFilter: null,
        nuevoIngresoFilter: null,
        precioMin: null,
        precioMax: null,
        // Modal agregar libro
        addBookBtn: null,
        addBookModal: null,
        closeAddBookModal: null,
        addBookForm: null,
        cancelAddBook: null,
        saveBookBtn: null,
        bookCategoriaSelect: null,
        addBookErrors: null
    },

    /**
     * Inicializar el gestor de inventario
     */
    async init() {
        if (this.state.isInitialized) {
            console.log('InventoryManager ya inicializado');
            return;
        }
        
        console.log('🔄 Inicializando Inventory Manager...');
        
        try {
            // Verificar que los elementos existen
            const inventorySection = document.getElementById('inventory-section');
            if (!inventorySection) {
                throw new Error('Sección de inventario no encontrada');
            }
            
            this.bindElements();
            
            // Verificar elementos críticos
            const criticalElements = ['searchInput', 'categoryFilter', 'booksTableBody', 'addBookBtn'];
            const missingElements = criticalElements.filter(key => !this.elements[key]);
            
            if (missingElements.length > 0) {
                console.warn('⚠️ Elementos faltantes:', missingElements);
                // Continuar de todas formas
            }
            
            this.setupEventListeners();
            await this.loadCategories();
            await this.loadBooks();
            
            this.state.isInitialized = true;
            console.log('✅ Inventory Manager inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Inventory Manager:', error);
            this.showError('Error al cargar el inventario: ' + error.message);
            throw error;
        }
    },

    /**
     * Vincular elementos del DOM
     */
    bindElements() {
        console.log('🔗 Vinculando elementos del DOM...');
        
        // Elementos principales
        const mainElements = {
            searchInput: 'search-input',
            categoryFilter: 'category-filter', 
            advancedFiltersBtn: 'advanced-filters-btn',
            advancedFiltersModal: 'advanced-filters-modal',
            closeFiltersModal: 'close-filters-modal',
            applyFilters: 'apply-filters',
            clearFilters: 'clear-filters',
            booksTableBody: 'books-table-body',
            booksCount: 'books-count',
            paginationContainer: 'pagination-container',
            loadingState: 'loading-state',
            emptyState: 'empty-state'
        };
        
        // Filtros avanzados
        const advancedFilterElements = {
            estadoFilter: 'estado-filter',
            formatoFilter: 'formato-filter',
            stockBajoFilter: 'stock-bajo-filter',
            agotadoFilter: 'agotado-filter',
            destacadoFilter: 'destacado-filter',
            nuevoIngresoFilter: 'nuevo-ingreso-filter',
            precioMin: 'precio-min',
            precioMax: 'precio-max'
        };
        
        // Modal agregar libro
        const addBookElements = {
            addBookBtn: 'add-book-btn',
            addBookModal: 'add-book-modal',
            closeAddBookModal: 'close-add-book-modal',
            addBookForm: 'add-book-form',
            cancelAddBook: 'cancel-add-book',
            saveBookBtn: 'save-book-btn',
            bookCategoriaSelect: 'book-categoria',
            addBookErrors: 'add-book-errors'
        };
        
        // Combinar todos los elementos
        const allElements = { ...mainElements, ...advancedFilterElements, ...addBookElements };
        
        // Vincular elementos y reportar cuáles faltan
        const foundElements = [];
        const missingElements = [];
        
        Object.entries(allElements).forEach(([key, id]) => {
            const element = document.getElementById(id);
            this.elements[key] = element;
            
            if (element) {
                foundElements.push(id);
            } else {
                missingElements.push(id);
            }
        });
        
        console.log(`✅ Elementos encontrados: ${foundElements.length}/${Object.keys(allElements).length}`);
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Elementos faltantes:', missingElements);
        }
        
        // Verificar elementos críticos
        const criticalElements = ['search-input', 'books-table-body', 'add-book-btn'];
        const missingCritical = criticalElements.filter(id => !document.getElementById(id));
        
        if (missingCritical.length > 0) {
            throw new Error(`Elementos críticos faltantes: ${missingCritical.join(', ')}`);
        }
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Búsqueda en tiempo real con debounce
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', Utils.debounce((e) => {
                this.state.currentFilters.search = e.target.value;
                this.state.pagination.current_page = 1;
                this.loadBooks();
            }, 500));
        }

        // Filtro de categoría
        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.addEventListener('change', (e) => {
                this.state.currentFilters.categoria_id = e.target.value;
                this.state.pagination.current_page = 1;
                this.loadBooks();
            });
        }

        // Modal de filtros avanzados
        if (this.elements.advancedFiltersBtn) {
            this.elements.advancedFiltersBtn.addEventListener('click', () => {
                this.showAdvancedFiltersModal();
            });
        }

        if (this.elements.closeFiltersModal) {
            this.elements.closeFiltersModal.addEventListener('click', () => {
                this.hideAdvancedFiltersModal();
            });
        }

        // Aplicar filtros
        if (this.elements.applyFilters) {
            this.elements.applyFilters.addEventListener('click', () => {
                this.applyAdvancedFilters();
            });
        }

        // Limpiar filtros
        if (this.elements.clearFilters) {
            this.elements.clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Cerrar modal al hacer clic fuera
        if (this.elements.advancedFiltersModal) {
            this.elements.advancedFiltersModal.addEventListener('click', (e) => {
                if (e.target === this.elements.advancedFiltersModal) {
                    this.hideAdvancedFiltersModal();
                }
            });
        }

        // Modal agregar libro
        if (this.elements.addBookBtn) {
            this.elements.addBookBtn.addEventListener('click', () => {
                this.showAddBookModal();
            });
        }

        if (this.elements.closeAddBookModal) {
            this.elements.closeAddBookModal.addEventListener('click', () => {
                this.hideAddBookModal();
            });
        }

        if (this.elements.cancelAddBook) {
            this.elements.cancelAddBook.addEventListener('click', () => {
                this.hideAddBookModal();
            });
        }

        if (this.elements.addBookForm) {
            this.elements.addBookForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddBook();
            });
        }

        // Cerrar modal al hacer clic fuera
        if (this.elements.addBookModal) {
            this.elements.addBookModal.addEventListener('click', (e) => {
                if (e.target === this.elements.addBookModal) {
                    this.hideAddBookModal();
                }
            });
        }
    },

    /**
     * Cargar categorías desde la API
     */
    async loadCategories() {
        console.log('📂 Cargando categorías...');
        
        try {
            const response = await fetch('api/categories.php');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.state.categories = result.data || [];
                console.log(`✅ Categorías cargadas: ${this.state.categories.length}`);
                this.populateCategoriesDropdown();
                return this.state.categories;
            } else {
                console.error('❌ Error del servidor cargando categorías:', result.message);
                this.showError('Error cargando categorías: ' + result.message);
                return [];
            }
        } catch (error) {
            console.error('❌ Error de conexión en loadCategories:', error);
            this.showError('Error de conexión al cargar categorías');
            
            // Usar categorías de respaldo si no se pueden cargar desde la API
            this.state.categories = [
                { id: 1, nombre: 'Ficción', color: '#8B5CF6' },
                { id: 2, nombre: 'No Ficción', color: '#10B981' },
                { id: 3, nombre: 'Ciencia', color: '#3B82F6' },
                { id: 4, nombre: 'Historia', color: '#F59E0B' }
            ];
            this.populateCategoriesDropdown();
            return this.state.categories;
        }
    },

    /**
     * Poblar dropdown de categorías
     */
    populateCategoriesDropdown() {
        console.log('📝 Poblando dropdowns de categorías...', this.state.categories);
        
        // Poblar filtro de categorías
        if (this.elements.categoryFilter) {
            console.log('📝 Poblando filtro de categorías');
            
            // Limpiar opciones existentes excepto la primera
            while (this.elements.categoryFilter.children.length > 1) {
                this.elements.categoryFilter.removeChild(this.elements.categoryFilter.lastChild);
            }

            // Verificar que hay categorías para agregar
            if (this.state.categories && this.state.categories.length > 0) {
                // Agregar categorías
                this.state.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.nombre;
                    this.elements.categoryFilter.appendChild(option);
                });
                console.log(`✅ ${this.state.categories.length} categorías agregadas al filtro`);
            } else {
                console.warn('⚠️ No hay categorías para agregar al filtro');
                // Agregar opción de error
                const errorOption = document.createElement('option');
                errorOption.value = '';
                errorOption.textContent = 'Error cargando categorías';
                errorOption.disabled = true;
                this.elements.categoryFilter.appendChild(errorOption);
            }
        } else {
            console.warn('⚠️ Elemento categoryFilter no encontrado');
        }

        // Poblar select de categorías en modal de agregar libro
        if (this.elements.bookCategoriaSelect) {
            console.log('📝 Poblando select de categorías del modal');
            
            // Limpiar opciones existentes excepto la primera
            while (this.elements.bookCategoriaSelect.children.length > 1) {
                this.elements.bookCategoriaSelect.removeChild(this.elements.bookCategoriaSelect.lastChild);
            }

            // Verificar que hay categorías para agregar
            if (this.state.categories && this.state.categories.length > 0) {
                // Agregar categorías
                this.state.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.nombre;
                    this.elements.bookCategoriaSelect.appendChild(option);
                });
                console.log(`✅ ${this.state.categories.length} categorías agregadas al modal`);
            } else {
                console.warn('⚠️ No hay categorías para agregar al modal');
                // Agregar opción de error
                const errorOption = document.createElement('option');
                errorOption.value = '';
                errorOption.textContent = 'Error cargando categorías';
                errorOption.disabled = true;
                this.elements.bookCategoriaSelect.appendChild(errorOption);
            }
        } else {
            console.warn('⚠️ Elemento bookCategoriaSelect no encontrado');
        }
    },

    /**
     * Cargar libros desde la API
     */
    async loadBooks() {
        if (this.state.loading) return;

        this.setLoading(true);
        
        try {
            const queryParams = new URLSearchParams({
                page: this.state.pagination.current_page,
                limit: this.state.pagination.per_page,
                ...this.state.currentFilters
            });

            // Remover parámetros vacíos
            for (const [key, value] of queryParams.entries()) {
                if (!value || value === 'false') {
                    queryParams.delete(key);
                }
            }

            const response = await fetch(`api/books.php?${queryParams}`);
            const result = await response.json();
            
            if (result.success) {
                this.state.books = result.data;
                this.state.pagination = result.pagination;
                this.renderBooks();
                this.renderPagination();
                await this.updateBooksCount();
                this.state.error = null;
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('Error cargando libros:', error);
            this.showError('Error al cargar los libros');
        } finally {
            this.setLoading(false);
        }
    },

    /**
     * Renderizar tabla de libros
     */
    renderBooks() {
        if (!this.elements.booksTableBody) return;

        if (this.state.books.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        const booksHtml = this.state.books.map(book => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="h-12 w-8 bg-indigo-100 rounded flex items-center justify-center mr-4">
                            <i class="fas fa-book text-indigo-600"></i>
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${this.escapeHtml(book.titulo)}</div>
                            <div class="text-sm text-gray-500">${this.escapeHtml(book.autor)}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${book.isbn || book.isbn13 || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" 
                          style="background-color: ${book.categoria_color}20; color: ${book.categoria_color}">
                        ${this.escapeHtml(book.categoria_nombre)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span class="${book.stock_actual <= book.stock_minimo ? 'text-red-600 font-semibold' : ''}">
                        ${book.stock_actual}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    $${this.formatPrice(book.precio_venta)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${this.getStatusBadge(book.estado, book.stock_actual)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end gap-2">
                        <button class="btn-view-book text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50" 
                                title="Ver detalles" data-book-id="${book.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-edit-book text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50" 
                                title="Editar" data-book-id="${book.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete-book text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" 
                                title="Eliminar" data-book-id="${book.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.elements.booksTableBody.innerHTML = booksHtml;
        
        // Agregar event listeners para los botones de acción
        this.attachActionButtons();
    },

    /**
     * Adjuntar event listeners a botones de acción
     */
    attachActionButtons() {
        console.log('📎 Adjuntando event listeners a botones de acción...');
        
        // Remover event listeners existentes primero para evitar duplicación
        document.querySelectorAll('.btn-view-book, .btn-edit-book, .btn-delete-book').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        // Botones Ver detalle
        const viewButtons = document.querySelectorAll('.btn-view-book');
        console.log(`👁️ Encontrados ${viewButtons.length} botones de ver detalles`);
        viewButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const bookId = btn.getAttribute('data-book-id');
                console.log(`👁️ Ver detalles clickeado - Botón ${index + 1}, Book ID: ${bookId}`);
                this.showBookDetails(bookId);
            });
        });

        // Botones Editar
        const editButtons = document.querySelectorAll('.btn-edit-book');
        console.log(`✏️ Encontrados ${editButtons.length} botones de editar`);
        editButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const bookId = btn.getAttribute('data-book-id');
                console.log(`✏️ Editar clickeado - Botón ${index + 1}, Book ID: ${bookId}`);
                this.showEditBookModal(bookId);
            });
        });

        // Botones Eliminar
        const deleteButtons = document.querySelectorAll('.btn-delete-book');
        console.log(`🗑️ Encontrados ${deleteButtons.length} botones de eliminar`);
        deleteButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const bookId = btn.getAttribute('data-book-id');
                console.log(`🗑️ Eliminar clickeado - Botón ${index + 1}, Book ID: ${bookId}`);
                this.confirmDeleteBook(bookId);
            });
        });
        
        console.log('✅ Event listeners adjuntados correctamente');
    },

    /**
     * Renderizar paginación
     */
    renderPagination() {
        const paginationButtons = document.getElementById('pagination-buttons');
        if (!paginationButtons) return;

        const { current_page, total_pages, has_prev, has_next } = this.state.pagination;
        
        // Si solo hay una página o no hay resultados, no mostrar paginación
        if (total_pages <= 1) {
            paginationButtons.innerHTML = '';
            this.updatePaginationInfo();
            return;
        }

        let buttonsHtml = '';

        // Botón anterior
        buttonsHtml += `
            <button ${!has_prev ? 'disabled' : ''} 
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onclick="InventoryManager.goToPage(${current_page - 1})">
                <i class="fas fa-chevron-left mr-1"></i>Anterior
            </button>
        `;

        // Botones de páginas
        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(total_pages, current_page + 2);

        for (let page = startPage; page <= endPage; page++) {
            const isActive = page === current_page;
            buttonsHtml += `
                <button class="${isActive 
                    ? 'px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors' 
                    : 'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors'}"
                        onclick="InventoryManager.goToPage(${page})">
                    ${page}
                </button>
            `;
        }

        // Botón siguiente
        buttonsHtml += `
            <button ${!has_next ? 'disabled' : ''} 
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onclick="InventoryManager.goToPage(${current_page + 1})">
                Siguiente<i class="fas fa-chevron-right ml-1"></i>
            </button>
        `;

        paginationButtons.innerHTML = buttonsHtml;
        
        // Actualizar información de paginación
        this.updatePaginationInfo();
    },

    /**
     * Actualizar información de paginación
     */
    updatePaginationInfo() {
        const { current_page, per_page, total_records } = this.state.pagination;
        
        const showingFrom = total_records === 0 ? 0 : Math.min((current_page - 1) * per_page + 1, total_records);
        const showingTo = Math.min(current_page * per_page, total_records);
        
        const fromElement = document.getElementById('showing-from');
        const toElement = document.getElementById('showing-to');
        const totalElement = document.getElementById('total-records');
        
        if (fromElement) fromElement.textContent = showingFrom;
        if (toElement) toElement.textContent = showingTo;
        if (totalElement) totalElement.textContent = total_records;
    },

    /**
     * Ir a página específica
     */
    goToPage(page) {
        if (page < 1 || page > this.state.pagination.total_pages || page === this.state.pagination.current_page || this.state.loading) {
            return;
        }
        
        this.state.pagination.current_page = page;
        this.loadBooks();
    },

    /**
     * Mostrar modal de filtros avanzados
     */
    showAdvancedFiltersModal() {
        if (this.elements.advancedFiltersModal) {
            this.elements.advancedFiltersModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Ocultar modal de filtros avanzados
     */
    hideAdvancedFiltersModal() {
        if (this.elements.advancedFiltersModal) {
            this.elements.advancedFiltersModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    },

    /**
     * Aplicar filtros avanzados
     */
    applyAdvancedFilters() {
        // Recopilar valores de filtros avanzados
        this.state.currentFilters.estado = this.elements.estadoFilter?.value || '';
        this.state.currentFilters.formato = this.elements.formatoFilter?.value || '';
        this.state.currentFilters.stock_bajo = this.elements.stockBajoFilter?.checked || false;
        this.state.currentFilters.destacado = this.elements.destacadoFilter?.checked || false;
        this.state.currentFilters.nuevo_ingreso = this.elements.nuevoIngresoFilter?.checked || false;
        this.state.currentFilters.precio_min = this.elements.precioMin?.value || '';
        this.state.currentFilters.precio_max = this.elements.precioMax?.value || '';

        // Resetear a la primera página
        this.state.pagination.current_page = 1;
        
        // Cargar libros con nuevos filtros
        this.loadBooks();
        
        // Cerrar modal
        this.hideAdvancedFiltersModal();
    },

    /**
     * Limpiar todos los filtros
     */
    clearAllFilters() {
        // Resetear filtros
        this.state.currentFilters = {
            search: '',
            categoria_id: '',
            estado: '',
            formato: '',
            stock_bajo: false,
            destacado: false,
            nuevo_ingreso: false,
            precio_min: '',
            precio_max: ''
        };

        // Limpiar elementos del DOM
        if (this.elements.searchInput) this.elements.searchInput.value = '';
        if (this.elements.categoryFilter) this.elements.categoryFilter.value = '';
        if (this.elements.estadoFilter) this.elements.estadoFilter.value = '';
        if (this.elements.formatoFilter) this.elements.formatoFilter.value = '';
        if (this.elements.stockBajoFilter) this.elements.stockBajoFilter.checked = false;
        if (this.elements.agotadoFilter) this.elements.agotadoFilter.checked = false;
        if (this.elements.destacadoFilter) this.elements.destacadoFilter.checked = false;
        if (this.elements.nuevoIngresoFilter) this.elements.nuevoIngresoFilter.checked = false;
        if (this.elements.precioMin) this.elements.precioMin.value = '';
        if (this.elements.precioMax) this.elements.precioMax.value = '';

        // Resetear paginación
        this.state.pagination.current_page = 1;
        
        // Recargar libros
        this.loadBooks();
        
        // Cerrar modal
        this.hideAdvancedFiltersModal();
    },

    /**
     * Actualizar contador de libros (suma total de stock de todo el inventario)
     */
    async updateBooksCount() {
        if (this.elements.booksCount) {
            try {
                // Obtener el total de stock de todos los libros del inventario
                const totalStock = await this.getTotalStock();
                console.log('📊 Total de stock en inventario:', totalStock);
                
                this.elements.booksCount.textContent = `${totalStock} unidades en stock`;
            } catch (error) {
                console.error('❌ Error obteniendo total de stock:', error);
                // Fallback: usar los libros de la página actual
                const currentPageStock = this.state.books.reduce((total, book) => {
                    return total + (parseInt(book.stock_actual) || 0);
                }, 0);
                this.elements.booksCount.textContent = `${currentPageStock}+ unidades`;
            }
        }
    },

    /**
     * Obtener el total de stock de todo el inventario
     */
    async getTotalStock() {
        try {
            // Usar una consulta optimizada para obtener solo la suma del stock
            // Si la API no soporta esto, usar el método tradicional
            const response = await fetch('api/books.php?action=total_stock');
            const result = await response.json();
            
            // Si la API devuelve el total directamente, usar ese valor
            if (result.success && result.total_stock !== undefined) {
                console.log('📊 Total de stock desde API optimizada:', result.total_stock);
                return result.total_stock;
            }
            
            // Fallback: obtener todos los libros y sumar manualmente
            const fallbackResponse = await fetch('api/books.php?limit=1000');
            const fallbackResult = await fallbackResponse.json();
            
            if (fallbackResult.success && fallbackResult.data) {
                const totalStock = fallbackResult.data.reduce((total, book) => {
                    return total + (parseInt(book.stock_actual) || 0);
                }, 0);
                
                console.log('📊 Calculado desde API (fallback) - Libros encontrados:', fallbackResult.data.length);
                console.log('📊 Total de stock calculado:', totalStock);
                
                return totalStock;
            } else {
                throw new Error('No se pudieron obtener los datos de stock');
            }
        } catch (error) {
            console.error('❌ Error en getTotalStock:', error);
            throw error;
        }
    },

    /**
     * Establecer estado de carga
     */
    setLoading(loading) {
        this.state.loading = loading;
        
        if (this.elements.loadingState && this.elements.booksTableBody) {
            if (loading) {
                this.elements.loadingState.classList.remove('hidden');
                this.elements.booksTableBody.style.opacity = '0.5';
            } else {
                this.elements.loadingState.classList.add('hidden');
                this.elements.booksTableBody.style.opacity = '1';
            }
        }
    },

    /**
     * Mostrar estado vacío
     */
    showEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.classList.remove('hidden');
        }
        if (this.elements.booksTableBody) {
            this.elements.booksTableBody.innerHTML = '';
        }
        
        // Limpiar paginación cuando no hay resultados
        const paginationButtons = document.getElementById('pagination-buttons');
        if (paginationButtons) {
            paginationButtons.innerHTML = '';
        }
        
        // Actualizar información de paginación
        this.updatePaginationInfo();
    },

    /**
     * Ocultar estado vacío
     */
    hideEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.classList.add('hidden');
        }
    },

    /**
     * Mostrar error
     */
    showError(message) {
        this.state.error = message;
        console.error('Inventory Error:', message);
        
        if (window.NotificationManager) {
            NotificationManager.showToast(message, 'error');
        }
    },

    /**
     * Obtener badge de estado
     */
    getStatusBadge(estado, stock) {
        if (stock === 0) {
            return '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Agotado</span>';
        }

        switch (estado) {
            case 'disponible':
                return '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Disponible</span>';
            case 'agotado':
                return '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Agotado</span>';
            case 'descontinuado':
                return '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Descontinuado</span>';
            case 'reservado':
                return '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Reservado</span>';
            default:
                return '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Desconocido</span>';
        }
    },

    /**
     * Formatear precio
     */
    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    },

    /**
     * Escapar HTML para prevenir XSS
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    /**
     * Mostrar modal de agregar libro
     */
    showAddBookModal(skipReset = false) {
        if (this.elements.addBookModal) {
            // Solo resetear el formulario si no estamos en modo edición
            if (!skipReset && !this.state.editingBookId) {
                console.log('🔄 Reseteando formulario para nuevo libro');
                this.resetAddBookForm();
            } else if (skipReset) {
                console.log('⏭️ Saltando reset del formulario (modo edición)');
            }
            
            this.elements.addBookModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal mostrado');
        }
    },

    /**
     * Ocultar modal de agregar libro
     */
    hideAddBookModal() {
        if (this.elements.addBookModal) {
            this.elements.addBookModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            this.resetAddBookForm();
            this.resetEditMode();
        }
    },

    /**
     * Resetear formulario de agregar libro
     */
    resetAddBookForm() {
        if (this.elements.addBookForm) {
            this.elements.addBookForm.reset();
            
            // Resetear valores por defecto
            const stockMinimoField = document.getElementById('book-stock-minimo');
            if (stockMinimoField) stockMinimoField.value = '5';
            
            const formatoField = document.getElementById('book-formato');
            if (formatoField) formatoField.value = 'tapa_blanda';
            
            const estadoField = document.getElementById('book-estado');
            if (estadoField) estadoField.value = 'disponible';
        }
        
        // Ocultar errores
        this.hideAddBookErrors();
        
        // Resetear botón
        this.setSaveButtonState(false);
    },

    /**
     * Manejar envío del formulario de agregar libro
     */
    async handleAddBook() {
        // Prevenir múltiples submissions
        if (this.state.submitting) {
            console.log('📌 Submission ya en proceso, ignorando...');
            return;
        }
        
        this.state.submitting = true;
        this.hideAddBookErrors();
        
        // Validar formulario
        const formData = this.collectFormData();
        const validationErrors = this.validateBookForm(formData);
        
        if (validationErrors.length > 0) {
            this.showAddBookErrors(validationErrors);
            this.state.submitting = false;
            return;
        }
        
        this.setSaveButtonState(true);
        
        try {
            // Determinar si es edición o creación
            const isEditing = !!this.state.editingBookId;
            const url = isEditing ? `api/books.php?id=${this.state.editingBookId}` : 'api/books.php';
            const method = isEditing ? 'PUT' : 'POST';
            
            console.log('🔄 Procesando formulario:', {
                isEditing,
                editingBookId: this.state.editingBookId,
                editingBookIdType: typeof this.state.editingBookId,
                url,
                method
            });
            
            console.log('📦 Datos del formulario:', formData);
            
            // Verificar que tenemos un ID válido para edición
            if (isEditing && (!this.state.editingBookId || isNaN(parseInt(this.state.editingBookId)))) {
                throw new Error('ID de edición inválido');
            }
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            console.log('📡 Respuesta HTTP:', response.status, response.statusText);
            
            // Verificar si hay error de autenticación
            if (response.status === 401 || response.status === 403) {
                throw new Error('No está autorizado para realizar esta acción. Por favor, inicie sesión.');
            }
            
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📦 Resultado de API:', result);
            
            if (result.success) {
                // Mostrar notificación de éxito
                const message = isEditing ? 'Libro actualizado exitosamente' : 'Libro agregado exitosamente';
                console.log('✅ Éxito:', message);
                
                if (window.NotificationManager) {
                    NotificationManager.showToast(message, 'success');
                }
                
                // Cerrar modal
                this.hideAddBookModal();
                
                // Limpiar formulario y estado de edición
                this.clearAddBookForm();
                this.resetEditMode();
                
                // Recargar lista de libros
                await this.loadBooks();
                
            } else {
                // Mostrar errores del servidor
                console.error('❌ Error del servidor:', result);
                const errors = result.errors || [result.message];
                this.showAddBookErrors(errors);
            }
            
        } catch (error) {
            console.error('❌ Error en handleAddBook:', error);
            const isEditing = !!this.state.editingBookId;
            const errorMessage = isEditing ? 'Error al actualizar el libro' : 'Error al agregar el libro';
            this.showAddBookErrors([`${errorMessage}: ${error.message}`]);
        } finally {
            this.setSaveButtonState(false);
            
            // Pequeño retraso antes de permitir nuevos submissions
            setTimeout(() => {
                this.state.submitting = false;
            }, 500);
        }
    },

    /**
     * Recopilar datos del formulario
     */
    collectFormData() {
        const formData = {};
        
        // Campos de texto
        const textFields = [
            'titulo', 'subtitulo', 'autor', 'editorial', 'isbn', 'isbn13',
            'edicion', 'idioma', 'ubicacion', 'descripcion', 'codigo_barras', 'dimensiones'
        ];
        
        textFields.forEach(field => {
            const element = document.getElementById(`book-${field.replace('_', '-')}`);
            if (element) {
                formData[field] = element.value.trim();
            }
        });
        
        // Campos numéricos
        const numberFields = [
            { field: 'año_publicacion', id: 'book-year' },
            { field: 'paginas', id: 'book-paginas' },
            { field: 'precio_compra', id: 'book-precio-compra' },
            { field: 'precio_venta', id: 'book-precio-venta' },
            { field: 'stock_actual', id: 'book-stock-actual' },
            { field: 'stock_minimo', id: 'book-stock-minimo' },
            { field: 'peso', id: 'book-peso' }
        ];
        
        numberFields.forEach(({field, id}) => {
            const element = document.getElementById(id);
            if (element && element.value) {
                formData[field] = parseFloat(element.value);
            }
        });
        
        // Selects
        const selectFields = [
            { field: 'formato', id: 'book-formato' },
            { field: 'estado', id: 'book-estado' },
            { field: 'categoria_id', id: 'book-categoria' }
        ];
        selectFields.forEach(({field, id}) => {
            const element = document.getElementById(id);
            if (element) {
                formData[field] = element.value;
            }
        });
        
        // Checkboxes
        const checkboxFields = [
            { field: 'destacado', id: 'book-destacado' },
            { field: 'nuevo_ingreso', id: 'book-nuevo-ingreso' }
        ];
        checkboxFields.forEach(({field, id}) => {
            const element = document.getElementById(id);
            if (element) {
                formData[field] = element.checked;
            }
        });
        
        return formData;
    },

    /**
     * Validar datos del formulario
     */
    validateBookForm(formData) {
        const errors = [];
        
        // Campos requeridos
        if (!formData.titulo) errors.push('El título es requerido');
        if (!formData.autor) errors.push('El autor es requerido');
        if (!formData.categoria_id) errors.push('La categoría es requerida');
        if (!formData.precio_compra || formData.precio_compra <= 0) errors.push('El precio de compra debe ser mayor a 0');
        if (!formData.precio_venta || formData.precio_venta <= 0) errors.push('El precio de venta debe ser mayor a 0');
        if (formData.stock_actual === undefined || formData.stock_actual < 0) errors.push('El stock actual debe ser mayor o igual a 0');
        
        // Validar año
        if (formData.año_publicacion && (formData.año_publicacion < 1000 || formData.año_publicacion > 2030)) {
            errors.push('El año de publicación debe estar entre 1000 y 2030');
        }
        
        // Validar que precio de venta sea mayor que precio de compra
        if (formData.precio_compra && formData.precio_venta && formData.precio_venta <= formData.precio_compra) {
            errors.push('El precio de venta debe ser mayor que el precio de compra');
        }
        
        return errors;
    },

    /**
     * Limpiar formulario de agregar libro
     */
    clearAddBookForm() {
        if (this.elements.addBookForm) {
            this.elements.addBookForm.reset();
        }
        
        // También limpiar errores
        this.hideAddBookErrors();
    },

    /**
     * Resetear modo de edición
     */
    resetEditMode() {
        console.log('🔄 Reseteando modo de edición. ID anterior:', this.state.editingBookId);
        
        // Limpiar ID de edición
        this.state.editingBookId = null;
        
        // Restaurar título del modal
        const modalTitle = document.querySelector('#add-book-modal h3');
        if (modalTitle) {
            modalTitle.textContent = 'Agregar Nuevo Libro';
            console.log('✅ Título del modal restaurado');
        }
        
        // Restaurar texto del botón
        const saveBtn = document.getElementById('save-book-btn');
        if (saveBtn) {
            const saveText = document.getElementById('save-btn-text');
            if (saveText) {
                saveText.textContent = 'Guardar Libro';
            } else {
                saveBtn.textContent = 'Guardar Libro';
            }
            console.log('✅ Texto del botón restaurado');
        }
        
        console.log('✅ Modo de edición reseteado');
    },

    /**
     * Mostrar errores en el formulario
     */
    showAddBookErrors(errors) {
        if (!this.elements.addBookErrors) return;
        
        const errorList = document.getElementById('error-list');
        if (errorList) {
            errorList.innerHTML = errors.map(error => `<div>• ${error}</div>`).join('');
        }
        
        this.elements.addBookErrors.classList.remove('hidden');
    },

    /**
     * Ocultar errores en el formulario
     */
    hideAddBookErrors() {
        if (this.elements.addBookErrors) {
            this.elements.addBookErrors.classList.add('hidden');
        }
    },

    /**
     * Establecer estado del botón guardar
     */
    setSaveButtonState(loading) {
        const saveBtn = this.elements.saveBookBtn;
        const saveText = document.getElementById('save-btn-text');
        const saveSpinner = document.getElementById('save-btn-spinner');
        
        if (saveBtn) {
            saveBtn.disabled = loading;
        }
        
        if (saveText) {
            saveText.textContent = loading ? 'Guardando...' : 'Guardar Libro';
        }
        
        if (saveSpinner) {
            if (loading) {
                saveSpinner.classList.remove('hidden');
            } else {
                saveSpinner.classList.add('hidden');
            }
        }
    },

    /**
     * Forzar recarga de categorías
     */
    async refreshCategories() {
        console.log('🔄 Forzando recarga de categorías...');
        this.state.categories = [];
        await this.loadCategories();
    },

    /**
     * Mostrar detalles de un libro
     */
    async showBookDetails(bookId) {
        try {
            // Buscar el libro en el estado actual o hacer petición a la API
            let book = this.state.books.find(b => b.id == bookId);
            
            if (!book) {
                // Si no está en el estado actual, obtenerlo de la API
                const response = await fetch(`api/books.php?id=${bookId}`);
                const result = await response.json();
                
                if (result.success && result.data.length > 0) {
                    book = result.data[0];
                } else {
                    throw new Error('Libro no encontrado');
                }
            }
            
            this.displayBookDetailsModal(book);
            
        } catch (error) {
            console.error('Error obteniendo detalles del libro:', error);
            if (window.NotificationManager) {
                NotificationManager.showToast('Error al cargar los detalles del libro', 'error');
            }
        }
    },

    /**
     * Mostrar modal de edición de libro
     */
    async showEditBookModal(bookId) {
        try {
            console.log('📝 Iniciando edición para libro ID:', bookId, 'Tipo:', typeof bookId);
            
            // Asegurar que bookId es un número
            bookId = parseInt(bookId);
            if (isNaN(bookId)) {
                throw new Error('ID de libro inválido');
            }
            
            console.log('📊 Estado actual tiene', this.state.books.length, 'libros');
            console.log('📊 IDs de libros en estado:', this.state.books.map(b => `${b.id} (${typeof b.id})`));
            
            // Buscar el libro en el estado actual - comparación estricta de tipos
            let book = this.state.books.find(b => parseInt(b.id) === bookId);
            
            if (book) {
                console.log('✅ Libro encontrado en estado local:', book);
            } else {
                console.log('🔍 Libro no encontrado en estado, buscando en API...');
                
                const response = await fetch(`api/books.php?id=${bookId}`);
                const result = await response.json();
                
                console.log('📡 Respuesta de API:', result);
                
                if (result.success && result.data && result.data.length > 0) {
                    book = result.data[0];
                    console.log('✅ Libro obtenido de API:', book);
                } else {
                    throw new Error('Libro no encontrado en la base de datos');
                }
            }
            
            // Verificar que el libro tiene los datos necesarios
            if (!book.id) {
                throw new Error('El libro no tiene un ID válido');
            }
            
            console.log('🔄 Cargando datos en formulario...');
            this.populateEditForm(book);
            this.showAddBookModal(true); // Reutilizamos el modal, pero en modo edición (skip reset)
            
            console.log('✅ Modal de edición abierto correctamente');
            
        } catch (error) {
            console.error('❌ Error cargando libro para editar:', error);
            
            // Mostrar error más específico al usuario
            let errorMessage = 'Error al cargar el libro para editar';
            if (error.message.includes('No autorizado')) {
                errorMessage = 'No tiene permisos para editar este libro. Por favor, inicie sesión.';
            } else if (error.message.includes('Libro no encontrado')) {
                errorMessage = 'El libro seleccionado no existe o ha sido eliminado.';
            } else if (error.message.includes('ID de libro inválido')) {
                errorMessage = 'Error: ID de libro inválido.';
            }
            
            if (window.NotificationManager) {
                NotificationManager.showToast(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
        }
    },

    /**
     * Confirmar eliminación de libro
     */
    confirmDeleteBook(bookId) {
        const book = this.state.books.find(b => b.id == bookId);
        const bookTitle = book ? book.titulo : `Libro ID ${bookId}`;
        
        if (confirm(`¿Está seguro que desea eliminar el libro "${bookTitle}"?\n\nEsta acción no se puede deshacer.`)) {
            this.deleteBook(bookId);
        }
    },

    /**
     * Eliminar libro
     */
    async deleteBook(bookId) {
        try {
            const response = await fetch(`api/books.php?id=${bookId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (window.NotificationManager) {
                    NotificationManager.showToast('Libro eliminado exitosamente', 'success');
                }
                
                // Recargar lista de libros
                await this.loadBooks();
                
            } else {
                throw new Error(result.message || 'Error eliminando libro');
            }
            
        } catch (error) {
            console.error('Error eliminando libro:', error);
            if (window.NotificationManager) {
                NotificationManager.showToast('Error al eliminar el libro: ' + error.message, 'error');
            }
        }
    },

    /**
     * Mostrar modal con detalles del libro
     */
    displayBookDetailsModal(book) {
        // Crear modal dinámicamente si no existe
        let modal = document.getElementById('book-details-modal');
        if (!modal) {
            modal = this.createBookDetailsModal();
            document.body.appendChild(modal);
        }
        
        // Poblar con datos del libro
        this.populateBookDetails(book);
        
        // Mostrar modal
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Poblar formulario de edición con datos del libro
     */
    populateEditForm(book) {
        console.log('📝 Poblando formulario con datos del libro:', book);
        
        // Cambiar título del modal
        const modalTitle = document.querySelector('#add-book-modal h3');
        if (modalTitle) {
            modalTitle.textContent = 'Editar Libro';
            console.log('✅ Título del modal cambiado');
        } else {
            console.warn('⚠️ No se encontró el título del modal');
        }
        
        // Cambiar texto del botón
        const saveText = document.getElementById('save-btn-text');
        if (saveText) {
            saveText.textContent = 'Actualizar Libro';
            console.log('✅ Texto del botón cambiado');
        } else {
            console.warn('⚠️ No se encontró el texto del botón guardar');
        }
        
        // Resetear formulario primero para limpiar datos previos
        if (this.elements.addBookForm) {
            console.log('🔄 Limpiando formulario antes de cargar datos...');
            // No hacer reset completo, solo limpiar valores
        }
        
        // Llenar campos con datos del libro
        const fields = [
            { id: 'book-titulo', value: book.titulo },
            { id: 'book-subtitulo', value: book.subtitulo },
            { id: 'book-autor', value: book.autor },
            { id: 'book-editorial', value: book.editorial },
            { id: 'book-isbn', value: book.isbn },
            { id: 'book-isbn13', value: book.isbn13 },
            { id: 'book-year', value: book.año_publicacion },
            { id: 'book-edicion', value: book.edicion },
            { id: 'book-paginas', value: book.paginas },
            { id: 'book-idioma', value: book.idioma },
            { id: 'book-categoria', value: book.categoria_id },
            { id: 'book-formato', value: book.formato },
            { id: 'book-estado', value: book.estado },
            { id: 'book-precio-compra', value: book.precio_compra },
            { id: 'book-precio-venta', value: book.precio_venta },
            { id: 'book-stock-actual', value: book.stock_actual },
            { id: 'book-stock-minimo', value: book.stock_minimo },
            { id: 'book-ubicacion', value: book.ubicacion },
            { id: 'book-peso', value: book.peso },
            { id: 'book-descripcion', value: book.descripcion },
            { id: 'book-codigo-barras', value: book.codigo_barras },
            { id: 'book-dimensiones', value: book.dimensiones }
        ];
        
        let fieldsFound = 0;
        let fieldsPopulated = 0;
        
        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                fieldsFound++;
                if (field.value !== null && field.value !== undefined && field.value !== '') {
                    element.value = field.value;
                    fieldsPopulated++;
                    console.log(`✅ Campo ${field.id} = "${field.value}"`);
                } else {
                    element.value = ''; // Limpiar campo si no hay valor
                    console.log(`⚪ Campo ${field.id} vacío`);
                }
            } else {
                console.warn(`⚠️ Campo ${field.id} no encontrado en el DOM`);
            }
        });
        
        console.log(`📊 Campos encontrados: ${fieldsFound}/${fields.length}, poblados: ${fieldsPopulated}`);
        
        // Manejar checkboxes por separado
        const checkboxFields = [
            { id: 'book-destacado', value: book.destacado },
            { id: 'book-nuevo-ingreso', value: book.nuevo_ingreso }
        ];
        
        checkboxFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                // Convertir valores de BD (0/1, "0"/"1", true/false) a boolean
                const isChecked = !!(field.value && field.value !== '0' && field.value !== 0);
                element.checked = isChecked;
                console.log(`✅ Checkbox ${field.id} = ${isChecked} (valor original: ${field.value})`);
            } else {
                console.warn(`⚠️ Checkbox ${field.id} no encontrado`);
            }
        });
        
        // Agregar ID del libro al formulario para identificar que es edición
        this.state.editingBookId = book.id;
        console.log(`✅ ID de edición establecido: ${book.id}`);
        
        // Forzar actualización visual
        setTimeout(() => {
            console.log('🔄 Verificando campos después de 100ms...');
            fields.slice(0, 5).forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    console.log(`🔍 ${field.id} valor actual: "${element.value}"`);
                }
            });
        }, 100);
    },

    /**
     * Crear modal de detalles del libro
     */
    createBookDetailsModal() {
        const modal = document.createElement('div');
        modal.id = 'book-details-modal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 hidden';
        
        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div class="flex items-center justify-between pb-4 border-b">
                    <h3 class="text-lg font-medium text-gray-900">Detalles del Libro</h3>
                    <button id="close-book-details" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div id="book-details-content">
                        <!-- El contenido se llenará dinámicamente -->
                    </div>
                </div>
                
                <div class="mt-6 flex justify-end">
                    <button id="close-details-btn" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        // Agregar event listeners
        const closeBtn1 = modal.querySelector('#close-book-details');
        const closeBtn2 = modal.querySelector('#close-details-btn');
        
        [closeBtn1, closeBtn2].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.closeBookDetailsModal());
            }
        });
        
        // Cerrar al hacer clic fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeBookDetailsModal();
            }
        });
        
        return modal;
    },

    /**
     * Poblar detalles del libro en el modal
     */
    populateBookDetails(book) {
        const content = document.getElementById('book-details-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">Información Básica</h4>
                        <div class="bg-gray-50 p-4 rounded">
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Título:</span> ${book.titulo || 'N/A'}</p>
                            ${book.subtitulo ? `<p class="text-gray-800"><span class="font-medium text-gray-900">Subtítulo:</span> ${book.subtitulo}</p>` : ''}
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Autor:</span> ${book.autor || 'N/A'}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Editorial:</span> ${book.editorial || 'N/A'}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Categoría:</span> ${book.categoria_nombre || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">Detalles de Publicación</h4>
                        <div class="bg-gray-50 p-4 rounded">
                            <p class="text-gray-800"><span class="font-medium text-gray-900">ISBN:</span> ${book.isbn || 'N/A'}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">ISBN-13:</span> ${book.isbn13 || 'N/A'}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Año:</span> ${book.año_publicacion || 'N/A'}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Edición:</span> ${book.edicion || 'N/A'}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Páginas:</span> ${book.paginas || 'N/A'}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Idioma:</span> ${book.idioma || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">Precios e Inventario</h4>
                        <div class="bg-gray-50 p-4 rounded">
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Precio Compra:</span> $${Number(book.precio_compra || 0).toLocaleString()}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Precio Venta:</span> $${Number(book.precio_venta || 0).toLocaleString()}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Stock Actual:</span> ${book.stock_actual || 0}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Stock Mínimo:</span> ${book.stock_minimo || 0}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Estado:</span> <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">${book.estado || 'N/A'}</span></p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">Información Adicional</h4>
                        <div class="bg-gray-50 p-4 rounded">
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Ubicación:</span> ${book.ubicacion || 'N/A'}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Peso:</span> ${book.peso || 'N/A'}g</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Dimensiones:</span> ${book.dimensiones || 'N/A'}</p>
                            <p class="text-gray-800"><span class="font-medium text-gray-900">Código Barras:</span> ${book.codigo_barras || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                ${book.descripcion ? `
                <div class="md:col-span-2">
                    <h4 class="font-semibold text-gray-700 mb-2">Descripción</h4>
                    <div class="bg-gray-50 p-4 rounded">
                        <p class="text-gray-800">${book.descripcion}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Cerrar modal de detalles
     */
    closeBookDetailsModal() {
        const modal = document.getElementById('book-details-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    },

    /**
     * Método de debug para verificar estado
     */
    debugState() {
        console.log('🐛 Estado del InventoryManager:', {
            isInitialized: this.state.isInitialized,
            categoriesCount: this.state.categories.length,
            booksCount: this.state.books.length,
            elements: Object.keys(this.elements).reduce((acc, key) => {
                acc[key] = !!this.elements[key];
                return acc;
            }, {}),
            currentFilters: this.state.currentFilters
        });
    }
};

// Exportar para uso global
window.InventoryManager = InventoryManager;