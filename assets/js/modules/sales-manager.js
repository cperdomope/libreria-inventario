/**
 * LIBRERÍA DIGITAL - GESTOR DE VENTAS
 * Archivo: assets/js/modules/sales-manager.js
 * Descripción: Módulo para gestión completa de ventas
 */

console.log('🛒 CARGANDO sales-manager.js...');

const SalesManager = {
    // Estado del módulo
    state: {
        sales: [],
        clients: [],
        books: [],
        currentSale: null,
        pagination: {
            current_page: 1,
            per_page: 10,
            total_records: 0,
            total_pages: 0
        },
        filters: {
            fecha_desde: '',
            fecha_hasta: '',
            cliente_id: '',
            estado: ''
        },
        newSale: {
            cliente_id: '',
            items: [],
            subtotal: 0,
            descuento: 0,
            total: 0,
            metodo_pago: 'efectivo',
            notas: ''
        }
    },

    // Referencias a elementos DOM
    elements: {},

    // Flag de inicialización
    isInitialized: false,

    /**
     * Inicializar el módulo de ventas
     */
    async init() {
        if (this.isInitialized) return;

        try {
            console.log('🛒 Inicializando módulo de ventas...');
            
            // Esperar a que el DOM esté completamente cargado
            if (document.readyState !== 'complete') {
                console.log('⏳ Esperando a que el DOM esté listo...');
                await new Promise(resolve => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        document.addEventListener('DOMContentLoaded', resolve, { once: true });
                    }
                });
            }
            
            this.bindElements();
            this.setupEventListeners();
            await this.loadInitialData();
            await this.loadSales();
            
            this.isInitialized = true;
            console.log('✅ Módulo de ventas inicializado exitosamente');
            
            // Test inmediato del botón
            if (this.elements.createSaleBtn) {
                console.log('✅ Botón Crear Venta está disponible y listo');
                // Agregar test click manual
                window.testSalesButton = () => {
                    console.log('🧪 Test manual del botón');
                    this.openNewSaleModal();
                };
            } else {
                console.log('⚠️ Botón Crear Venta NO está disponible');
            }
        } catch (error) {
            console.error('❌ Error inicializando módulo de ventas:', error);
            this.showToast('Error al inicializar módulo de ventas', 'error');
        }
    },

    /**
     * Vincular elementos DOM
     */
    bindElements() {
        console.log('🔗 Vinculando elementos DOM...');
        
        // Botones principales
        this.elements.createSaleBtn = document.querySelector('#create-sale-btn');
        this.elements.salesTable = document.querySelector('#sales-table');
        this.elements.salesTableBody = document.querySelector('#sales-table-body');
        
        // Modal nueva venta
        this.elements.newSaleModal = document.querySelector('#new-sale-modal');
        this.elements.closeNewSaleModal = document.querySelector('#close-new-sale-modal');
        this.elements.saveSaleBtn = document.querySelector('#save-sale-btn');
        this.elements.cancelSaleBtn = document.querySelector('#cancel-sale-btn');
        
        // Formulario nueva venta
        this.elements.clientSelect = document.querySelector('#sale-client-select');
        this.elements.clientSearch = document.querySelector('#sale-client-search');
        this.elements.bookSearch = document.querySelector('#sale-book-search');
        this.elements.bookSearchResults = document.querySelector('#book-search-results');
        this.elements.saleItems = document.querySelector('#sale-items');
        this.elements.saleSubtotal = document.querySelector('#sale-subtotal');
        this.elements.saleDiscount = document.querySelector('#sale-discount');
        this.elements.saleTotal = document.querySelector('#sale-total');
        this.elements.paymentMethod = document.querySelector('#payment-method');
        this.elements.saleNotes = document.querySelector('#sale-notes');

        // Modal detalles venta
        this.elements.saleDetailModal = document.querySelector('#sale-detail-modal');
        this.elements.closeSaleDetailModal = document.querySelector('#close-sale-detail-modal');
        this.elements.saleDetailContent = document.querySelector('#sale-detail-content');

        // Filtros
        this.elements.dateFromFilter = document.querySelector('#date-from-filter');
        this.elements.dateToFilter = document.querySelector('#date-to-filter');
        this.elements.clientFilter = document.querySelector('#client-filter');
        this.elements.statusFilter = document.querySelector('#status-filter');
        this.elements.applyFiltersBtn = document.querySelector('#apply-sales-filters');
        this.elements.clearFiltersBtn = document.querySelector('#clear-sales-filters');

        // Paginación
        this.elements.paginationContainer = document.querySelector('#sales-pagination');

        // Debug: Verificar elementos críticos
        console.log('🔗 createSaleBtn encontrado:', !!this.elements.createSaleBtn);
        console.log('🔗 clientSelect encontrado:', !!this.elements.clientSelect);
        console.log('🔗 newSaleModal encontrado:', !!this.elements.newSaleModal);
        console.log('🔗 salesTableBody encontrado:', !!this.elements.salesTableBody);
        
        if (!this.elements.clientSelect) {
            console.error('❌ CRÍTICO: elemento #sale-client-select no encontrado en el DOM');
        }
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón crear venta
        if (this.elements.createSaleBtn) {
            // Método 1: Event listener normal
            this.elements.createSaleBtn.addEventListener('click', (e) => {
                console.log('🔘 Click en botón Crear Venta detectado');
                e.preventDefault();
                e.stopPropagation();
                this.openNewSaleModal();
            });
            
            // Método 2: Agregar también onclick como backup
            this.elements.createSaleBtn.onclick = (e) => {
                console.log('🔘 OnClick backup detectado');
                e.preventDefault();
                this.openNewSaleModal();
            };
            
            console.log('🔗 Event listeners agregados al botón Crear Venta');
        } else {
            console.error('❌ Botón Crear Venta no encontrado');
        }

        // Modal nueva venta
        if (this.elements.closeNewSaleModal) {
            this.elements.closeNewSaleModal.addEventListener('click', () => this.closeNewSaleModal());
        }
        
        if (this.elements.saveSaleBtn) {
            this.elements.saveSaleBtn.addEventListener('click', (e) => {
                console.log('🔘 Click en botón Guardar Venta detectado');
                e.preventDefault();
                this.saveSale();
            });
            console.log('🔗 Event listener agregado al botón Guardar Venta');
        } else {
            console.error('❌ Botón Guardar Venta no encontrado en bindElements');
        }
        
        if (this.elements.cancelSaleBtn) {
            this.elements.cancelSaleBtn.addEventListener('click', () => this.closeNewSaleModal());
        }

        // Búsqueda de libros
        if (this.elements.bookSearch) {
            this.elements.bookSearch.addEventListener('input', (e) => this.searchBooks(e.target.value));
        }

        // Búsqueda de clientes
        if (this.elements.clientSearch) {
            this.elements.clientSearch.addEventListener('input', (e) => this.searchClients(e.target.value));
        }

        // Descuento
        if (this.elements.saleDiscount) {
            this.elements.saleDiscount.addEventListener('input', () => this.updateTotals());
        }

        // Filtros
        if (this.elements.applyFiltersBtn) {
            this.elements.applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }
        
        if (this.elements.clearFiltersBtn) {
            this.elements.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Event delegation para acciones de tabla
        if (this.elements.salesTableBody) {
            this.elements.salesTableBody.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (!button) return;

                const saleId = button.dataset.saleId;
                const action = button.dataset.action;

                switch (action) {
                    case 'view':
                        this.viewSaleDetail(saleId);
                        break;
                    case 'print':
                        this.printInvoice(saleId);
                        break;
                    case 'cancel':
                        this.cancelSale(saleId);
                        break;
                }
            });
        }

        // Cerrar modales al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.newSaleModal) {
                this.closeNewSaleModal();
            }
            if (e.target === this.elements.saleDetailModal) {
                this.closeSaleDetailModal();
            }
        });
    },

    /**
     * Cargar datos iniciales
     */
    async loadInitialData() {
        try {
            console.log('🔄 Cargando datos iniciales...');
            
            // Cargar clientes
            console.log('📞 Cargando clientes...');
            
            try {
                const clientsResponse = await fetch('api/clients.php?limit=100');
                console.log('📞 Response status:', clientsResponse.status);
                
                if (clientsResponse.ok) {
                    const clientsData = await clientsResponse.json();
                    console.log('📞 Clientes recibidos:', clientsData);
                    
                    if (clientsData.success && clientsData.data) {
                        this.state.clients = clientsData.data;
                        console.log('📞 Clientes en estado:', this.state.clients.length);
                    } else {
                        console.warn('⚠️ Respuesta exitosa pero sin datos de clientes');
                        this.state.clients = [];
                    }
                } else {
                    console.error('❌ Error HTTP cargando clientes:', clientsResponse.status, clientsResponse.statusText);
                    
                    // Intentar con el endpoint de test si falla el principal
                    try {
                        console.log('📞 Intentando con endpoint de test...');
                        const testResponse = await fetch('test_clients_api.php');
                        if (testResponse.ok) {
                            const testData = await testResponse.json();
                            console.log('📞 Datos de test recibidos:', testData);
                            if (testData.success && testData.clients) {
                                this.state.clients = testData.clients;
                                console.log('📞 Clientes cargados desde test:', this.state.clients.length);
                            }
                        }
                    } catch (testError) {
                        console.error('❌ Error también con endpoint de test:', testError);
                    }
                }
                
                // Si aún no hay clientes, crear uno de ejemplo
                if (this.state.clients.length === 0) {
                    console.log('📞 No hay clientes, creando cliente de ejemplo...');
                    await this.createExampleClient();
                }
                
            } catch (error) {
                console.error('❌ Error general cargando clientes:', error);
                // Fallback con datos estáticos
                this.state.clients = [
                    {
                        id: 1,
                        tipo_cliente: 'persona',
                        nombre: 'María José',
                        apellidos: '',
                        documento_numero: '12345678',
                        email: 'maria@ejemplo.com'
                    },
                    {
                        id: 2,
                        tipo_cliente: 'persona', 
                        nombre: 'Carlos Alberto',
                        apellidos: '',
                        documento_numero: '87654321',
                        email: 'carlos@ejemplo.com'
                    },
                    {
                        id: 3,
                        tipo_cliente: 'empresa',
                        nombre: 'Colegio San José',
                        razon_social: 'Colegio San José',
                        documento_numero: '900123456',
                        email: 'admin@colegiosanjose.edu'
                    }
                ];
                console.log('📞 Usando clientes de fallback:', this.state.clients.length);
            }

            // Cargar libros para búsqueda
            console.log('📚 Cargando libros...');
            const booksResponse = await fetch('api/books.php?limit=1000');
            if (booksResponse.ok) {
                const booksData = await booksResponse.json();
                console.log('📚 Libros recibidos:', booksData.data?.length || 0);
                this.state.books = booksData.data || [];
            } else {
                console.error('❌ Error cargando libros:', booksResponse.status, booksResponse.statusText);
            }

            this.populateClientSelect();
        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
        }
    },

    /**
     * Cargar lista de ventas
     */
    async loadSales() {
        try {
            const params = new URLSearchParams({
                page: this.state.pagination.current_page,
                limit: this.state.pagination.per_page,
                ...this.state.filters
            });

            const response = await fetch(`/api/sales.php?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.state.sales = data.data || [];
                this.state.pagination = data.pagination || this.state.pagination;
                this.renderSalesTable();
                this.renderPagination();
            } else {
                throw new Error(data.message || 'Error al cargar ventas');
            }
        } catch (error) {
            console.error('Error cargando ventas:', error);
            this.showToast('Error al cargar las ventas', 'error');
            this.renderEmptyState();
        }
    },

    /**
     * Renderizar tabla de ventas
     */
    renderSalesTable() {
        if (!this.elements.salesTableBody) return;

        if (this.state.sales.length === 0) {
            this.renderEmptyState();
            return;
        }

        const salesHTML = this.state.sales.map(sale => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${sale.numero_factura || sale.numero_venta || '#' + sale.id}</div>
                    <div class="text-sm text-gray-500">${sale.id}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${this.getClientDisplayName(sale)}</div>
                    <div class="text-sm text-gray-500">${sale.cliente_email || ''}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${this.formatDate(sale.fecha_venta)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${sale.detalles?.length || 0} items
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${this.formatCurrency(sale.total)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusClass(sale.estado)}">
                        ${this.getStatusText(sale.estado)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${sale.metodo_pago}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end gap-2">
                        <button 
                            class="text-indigo-600 hover:text-indigo-900" 
                            title="Ver detalles"
                            data-sale-id="${sale.id}"
                            data-action="view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button 
                            class="text-green-600 hover:text-green-900" 
                            title="Imprimir factura"
                            data-sale-id="${sale.id}"
                            data-action="print">
                            <i class="fas fa-print"></i>
                        </button>
                        ${sale.estado === 'completada' ? `
                            <button 
                                class="text-red-600 hover:text-red-900" 
                                title="Anular venta"
                                data-sale-id="${sale.id}"
                                data-action="cancel">
                                <i class="fas fa-times-circle"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        this.elements.salesTableBody.innerHTML = salesHTML;
    },

    /**
     * Abrir modal nueva venta
     */
    openNewSaleModal() {
        console.log('🔷 Abriendo modal nueva venta...');
        console.log('🔷 Modal elemento encontrado:', !!this.elements.newSaleModal);
        console.log('🔷 Cliente select encontrado:', !!this.elements.clientSelect);
        console.log('🔷 Número de clientes disponibles:', this.state.clients.length);
        
        this.resetNewSaleForm();
        
        if (this.elements.newSaleModal) {
            this.elements.newSaleModal.classList.remove('hidden');
            console.log('✅ Modal abierto - clase hidden removida');
            
            // Re-poblar clientes cuando se abre el modal
            this.populateClientSelect();
        } else {
            console.error('❌ No se pudo abrir el modal - elemento no encontrado');
            console.log('❌ Verificando si existe el elemento en DOM...');
            const modalTest = document.querySelector('#new-sale-modal');
            console.log('❌ Modal en DOM:', !!modalTest);
        }
    },

    /**
     * Cerrar modal nueva venta
     */
    closeNewSaleModal() {
        if (this.elements.newSaleModal) {
            this.elements.newSaleModal.classList.add('hidden');
        }
        this.resetNewSaleForm();
    },

    /**
     * Resetear formulario nueva venta
     */
    resetNewSaleForm() {
        this.state.newSale = {
            cliente_id: '',
            items: [],
            subtotal: 0,
            descuento: 0,
            total: 0,
            metodo_pago: 'efectivo',
            notas: ''
        };

        // Limpiar campos del formulario
        if (this.elements.clientSelect) this.elements.clientSelect.value = '';
        if (this.elements.clientSearch) this.elements.clientSearch.value = '';
        if (this.elements.bookSearch) this.elements.bookSearch.value = '';
        if (this.elements.saleDiscount) this.elements.saleDiscount.value = '0';
        if (this.elements.paymentMethod) this.elements.paymentMethod.value = 'efectivo';
        if (this.elements.saleNotes) this.elements.saleNotes.value = '';

        this.renderSaleItems();
        this.updateTotals();
    },

    /**
     * Buscar libros
     */
    async searchBooks(query) {
        if (query.length < 2) {
            this.clearBookSearchResults();
            return;
        }

        try {
            const filteredBooks = this.state.books.filter(book => 
                book.titulo.toLowerCase().includes(query.toLowerCase()) ||
                book.autor.toLowerCase().includes(query.toLowerCase()) ||
                book.isbn?.includes(query) ||
                book.isbn13?.includes(query)
            ).slice(0, 10);

            this.renderBookSearchResults(filteredBooks);
        } catch (error) {
            console.error('Error buscando libros:', error);
        }
    },

    /**
     * Renderizar resultados búsqueda libros
     */
    renderBookSearchResults(books) {
        if (!this.elements.bookSearchResults) return;

        if (books.length === 0) {
            this.elements.bookSearchResults.innerHTML = `
                <div class="p-3 text-sm text-gray-500">No se encontraron libros</div>
            `;
            this.elements.bookSearchResults.classList.remove('hidden');
            return;
        }

        const resultsHTML = books.map(book => `
            <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 book-search-item" 
                 data-book-id="${book.id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">${book.titulo}</div>
                        <div class="text-sm text-gray-500">${book.autor}</div>
                        <div class="text-sm text-gray-400">Stock: ${book.stock_actual}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-medium text-gray-900">${this.formatCurrency(book.precio_venta)}</div>
                        <div class="text-sm text-gray-500">${book.categoria_nombre}</div>
                    </div>
                </div>
            </div>
        `).join('');

        this.elements.bookSearchResults.innerHTML = resultsHTML;
        this.elements.bookSearchResults.classList.remove('hidden');

        // Event listeners para seleccionar libro
        this.elements.bookSearchResults.querySelectorAll('.book-search-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const bookId = parseInt(e.currentTarget.dataset.bookId);
                this.addBookToSale(bookId);
            });
        });
    },

    /**
     * Limpiar resultados búsqueda libros
     */
    clearBookSearchResults() {
        if (this.elements.bookSearchResults) {
            this.elements.bookSearchResults.classList.add('hidden');
            this.elements.bookSearchResults.innerHTML = '';
        }
    },

    /**
     * Agregar libro a la venta
     */
    addBookToSale(bookId) {
        const book = this.state.books.find(b => b.id === bookId);
        if (!book) return;

        // Verificar si el libro ya está en la venta
        const existingItem = this.state.newSale.items.find(item => item.libro_id === bookId);
        
        if (existingItem) {
            if (existingItem.cantidad < book.stock_actual) {
                existingItem.cantidad++;
                existingItem.total = existingItem.cantidad * existingItem.precio_unitario;
            } else {
                this.showToast('No hay suficiente stock disponible', 'warning');
                return;
            }
        } else {
            if (book.stock_actual <= 0) {
                this.showToast('El libro no tiene stock disponible', 'warning');
                return;
            }

            this.state.newSale.items.push({
                libro_id: bookId,
                titulo: book.titulo,
                autor: book.autor,
                precio_unitario: parseFloat(book.precio_venta),
                cantidad: 1,
                total: parseFloat(book.precio_venta),
                stock_disponible: book.stock_actual
            });
        }

        this.renderSaleItems();
        this.updateTotals();
        this.clearBookSearchResults();
        
        if (this.elements.bookSearch) {
            this.elements.bookSearch.value = '';
        }
    },

    /**
     * Renderizar items de venta
     */
    renderSaleItems() {
        if (!this.elements.saleItems) return;

        if (this.state.newSale.items.length === 0) {
            this.elements.saleItems.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-shopping-cart text-3xl mb-2"></i>
                    <p>No hay items en la venta</p>
                    <p class="text-sm">Busca y agrega libros arriba</p>
                </div>
            `;
            return;
        }

        const itemsHTML = this.state.newSale.items.map((item, index) => `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex-1">
                    <div class="font-medium text-gray-900">${item.titulo}</div>
                    <div class="text-sm text-gray-500">${item.autor}</div>
                    <div class="text-sm text-gray-400">Stock disponible: ${item.stock_disponible}</div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <div class="text-sm text-gray-500">Precio unitario</div>
                        <div class="font-medium">${this.formatCurrency(item.precio_unitario)}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button 
                            class="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-50"
                            onclick="SalesManager.updateItemQuantity(${index}, -1)">
                            <i class="fas fa-minus text-xs"></i>
                        </button>
                        <span class="w-12 text-center font-medium">${item.cantidad}</span>
                        <button 
                            class="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-50"
                            onclick="SalesManager.updateItemQuantity(${index}, 1)">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                    <div class="text-right min-w-20">
                        <div class="text-sm text-gray-500">Total</div>
                        <div class="font-medium">${this.formatCurrency(item.total)}</div>
                    </div>
                    <button 
                        class="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded"
                        onclick="SalesManager.removeItemFromSale(${index})"
                        title="Eliminar item">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.elements.saleItems.innerHTML = itemsHTML;
    },

    /**
     * Actualizar cantidad de item
     */
    updateItemQuantity(index, change) {
        const item = this.state.newSale.items[index];
        if (!item) return;

        const newQuantity = item.cantidad + change;
        
        if (newQuantity <= 0) {
            this.removeItemFromSale(index);
            return;
        }

        if (newQuantity > item.stock_disponible) {
            this.showToast('No hay suficiente stock disponible', 'warning');
            return;
        }

        item.cantidad = newQuantity;
        item.total = item.cantidad * item.precio_unitario;

        this.renderSaleItems();
        this.updateTotals();
    },

    /**
     * Eliminar item de venta
     */
    removeItemFromSale(index) {
        this.state.newSale.items.splice(index, 1);
        this.renderSaleItems();
        this.updateTotals();
    },

    /**
     * Actualizar totales de venta
     */
    updateTotals() {
        const subtotal = this.state.newSale.items.reduce((sum, item) => sum + item.total, 0);
        const descuento = parseFloat(this.elements.saleDiscount?.value || 0);
        const total = Math.max(0, subtotal - descuento);

        this.state.newSale.subtotal = subtotal;
        this.state.newSale.descuento = descuento;
        this.state.newSale.total = total;

        // Actualizar UI
        if (this.elements.saleSubtotal) {
            this.elements.saleSubtotal.textContent = this.formatCurrency(subtotal);
        }
        if (this.elements.saleTotal) {
            this.elements.saleTotal.textContent = this.formatCurrency(total);
        }
    },

    /**
     * Guardar venta
     */
    async saveSale() {
        console.log('💾 Iniciando proceso de guardar venta...');
        console.log('💾 Items en venta:', this.state.newSale.items.length);
        console.log('💾 Cliente seleccionado:', this.elements.clientSelect?.value);
        console.log('💾 Estado completo de nueva venta:', this.state.newSale);
        
        try {
            // Validaciones
            if (this.state.newSale.items.length === 0) {
                console.log('❌ Error: No hay items en la venta');
                this.showToast('Agrega al menos un item a la venta', 'warning');
                return;
            }

            if (!this.elements.clientSelect?.value) {
                console.log('❌ Error: No hay cliente seleccionado');
                this.showToast('Selecciona un cliente', 'warning');
                return;
            }

            // Preparar datos
            const saleData = {
                cliente_id: parseInt(this.elements.clientSelect.value),
                items: this.state.newSale.items.map(item => ({
                    libro_id: item.libro_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario
                })),
                descuento: this.state.newSale.descuento,
                metodo_pago: this.elements.paymentMethod?.value || 'efectivo',
                notas: this.elements.saleNotes?.value || ''
            };

            console.log('💾 Datos preparados para enviar:', saleData);

            // Mostrar loading
            if (this.elements.saveSaleBtn) {
                this.elements.saveSaleBtn.disabled = true;
                this.elements.saveSaleBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
                console.log('💾 Botón cambiado a estado loading');
            }

            // Enviar solicitud
            console.log('💾 Enviando petición a api/sales.php...');
            const response = await fetch('api/sales.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saleData)
            });

            console.log('💾 Respuesta recibida:', response.status, response.statusText);
            const data = await response.json();
            console.log('💾 Datos de respuesta:', data);

            if (data.success) {
                this.showToast('Venta creada exitosamente', 'success');
                this.closeNewSaleModal();
                await this.loadSales();
                
                // Preguntar si quiere imprimir factura
                if (confirm('¿Deseas imprimir la factura ahora?')) {
                    this.printInvoice(data.venta_id);
                }
            } else {
                throw new Error(data.message || 'Error al crear la venta');
            }

        } catch (error) {
            console.error('Error guardando venta:', error);
            this.showToast('Error al guardar la venta: ' + error.message, 'error');
        } finally {
            // Restaurar botón
            if (this.elements.saveSaleBtn) {
                this.elements.saveSaleBtn.disabled = false;
                this.elements.saveSaleBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Guardar Venta';
            }
        }
    },

    /**
     * Ver detalles de venta
     */
    async viewSaleDetail(saleId) {
        try {
            const response = await fetch(`/api/sales.php?id=${saleId}`);
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                const sale = data.data[0];
                this.renderSaleDetailModal(sale);
            } else {
                this.showToast('No se pudo cargar la venta', 'error');
            }
        } catch (error) {
            console.error('Error cargando detalles de venta:', error);
            this.showToast('Error al cargar los detalles', 'error');
        }
    },

    /**
     * Renderizar modal de detalles
     */
    renderSaleDetailModal(sale) {
        if (!this.elements.saleDetailContent) return;

        const detailsHTML = `
            <div class="space-y-6">
                <!-- Información general -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Número de Factura</label>
                        <p class="text-lg font-semibold text-gray-900">${sale.numero_factura || sale.numero_venta || '#' + sale.id}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Fecha</label>
                        <p class="text-gray-900">${this.formatDate(sale.fecha_venta)}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Cliente</label>
                        <p class="text-gray-900">${sale.cliente_nombre || 'Cliente General'}</p>
                        ${sale.cliente_email ? `<p class="text-sm text-gray-500">${sale.cliente_email}</p>` : ''}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Vendedor</label>
                        <p class="text-gray-900">${sale.vendedor_nombre || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Estado</label>
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusClass(sale.estado)}">
                            ${this.getStatusText(sale.estado)}
                        </span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Método de Pago</label>
                        <p class="text-gray-900">${sale.metodo_pago}</p>
                    </div>
                </div>

                <!-- Items -->
                <div>
                    <h4 class="text-lg font-medium text-gray-900 mb-3">Items de la Venta</h4>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left">Libro</th>
                                    <th class="px-4 py-2 text-center">Cantidad</th>
                                    <th class="px-4 py-2 text-right">Precio Unit.</th>
                                    <th class="px-4 py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sale.detalles?.map(item => `
                                    <tr class="border-t">
                                        <td class="px-4 py-2">
                                            <div class="font-medium">${item.titulo}</div>
                                            <div class="text-gray-500">${item.autor}</div>
                                            ${item.isbn ? `<div class="text-gray-400 text-xs">ISBN: ${item.isbn}</div>` : ''}
                                        </td>
                                        <td class="px-4 py-2 text-center">${item.cantidad}</td>
                                        <td class="px-4 py-2 text-right">${this.formatCurrency(item.precio_unitario)}</td>
                                        <td class="px-4 py-2 text-right font-medium">${this.formatCurrency(item.total)}</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="4" class="px-4 py-2 text-center text-gray-500">No hay detalles disponibles</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Totales -->
                <div class="border-t pt-4">
                    <div class="flex justify-end">
                        <div class="w-64 space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Subtotal:</span>
                                <span class="font-medium">${this.formatCurrency(sale.subtotal || sale.total)}</span>
                            </div>
                            ${sale.descuento > 0 ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Descuento:</span>
                                    <span class="font-medium text-red-600">-${this.formatCurrency(sale.descuento)}</span>
                                </div>
                            ` : ''}
                            <div class="flex justify-between border-t pt-2">
                                <span class="text-lg font-semibold">Total:</span>
                                <span class="text-lg font-bold text-green-600">${this.formatCurrency(sale.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${sale.notas ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                        <p class="text-gray-900 bg-gray-50 p-3 rounded-lg">${sale.notas}</p>
                    </div>
                ` : ''}
            </div>
        `;

        this.elements.saleDetailContent.innerHTML = detailsHTML;
        
        if (this.elements.saleDetailModal) {
            this.elements.saleDetailModal.classList.remove('hidden');
        }
    },

    /**
     * Cerrar modal detalles
     */
    closeSaleDetailModal() {
        if (this.elements.saleDetailModal) {
            this.elements.saleDetailModal.classList.add('hidden');
        }
    },

    /**
     * Imprimir factura
     */
    printInvoice(saleId) {
        // Abrir ventana de impresión
        const printWindow = window.open(`/print/invoice.php?id=${saleId}`, '_blank', 'width=800,height=600');
        
        if (printWindow) {
            printWindow.onload = function() {
                printWindow.print();
            };
        } else {
            // Fallback: generar URL para descargar
            window.open(`/api/sales.php?id=${saleId}&action=print`, '_blank');
        }
    },

    /**
     * Anular venta
     */
    async cancelSale(saleId) {
        if (!confirm('¿Estás seguro de que deseas anular esta venta? Esta acción restaurará el stock de los libros.')) {
            return;
        }

        try {
            const response = await fetch(`/api/sales.php?id=${saleId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Venta anulada exitosamente', 'success');
                await this.loadSales();
            } else {
                throw new Error(data.message || 'Error al anular la venta');
            }
        } catch (error) {
            console.error('Error anulando venta:', error);
            this.showToast('Error al anular la venta: ' + error.message, 'error');
        }
    },

    /**
     * Poblar select de clientes
     */
    populateClientSelect() {
        console.log('👥 Poblando select de clientes...');
        console.log('👥 Elemento clientSelect encontrado:', !!this.elements.clientSelect);
        console.log('👥 Número de clientes:', this.state.clients.length);
        console.log('👥 Datos de clientes:', this.state.clients);
        
        if (!this.elements.clientSelect) {
            console.error('❌ Elemento clientSelect no encontrado');
            return;
        }

        if (this.state.clients.length === 0) {
            console.warn('⚠️ No hay clientes disponibles');
            this.elements.clientSelect.innerHTML = '<option value="">No hay clientes disponibles</option>';
            return;
        }

        const clientsHTML = [
            '<option value="">Seleccionar cliente...</option>',
            ...this.state.clients.map((client, index) => {
                let displayName;
                if (client.tipo_cliente === 'empresa') {
                    // Para empresas, mostrar solo razón social o nombre
                    displayName = client.razon_social || client.nombre;
                } else {
                    // Para personas, mostrar solo nombre completo
                    displayName = `${client.nombre} ${client.apellidos || ''}`.trim();
                }
                console.log(`👥 Cliente ${index + 1}:`, {
                    id: client.id,
                    tipo: client.tipo_cliente,
                    nombre: client.nombre,
                    apellidos: client.apellidos,
                    razon_social: client.razon_social,
                    display: displayName
                });
                return `<option value="${client.id}">${displayName}</option>`;
            })
        ].join('');

        this.elements.clientSelect.innerHTML = clientsHTML;
        console.log('✅ Select de clientes poblado exitosamente');
        console.log('✅ HTML generado:', clientsHTML.slice(0, 200) + '...');
    },

    /**
     * Aplicar filtros
     */
    async applyFilters() {
        this.state.filters = {
            fecha_desde: this.elements.dateFromFilter?.value || '',
            fecha_hasta: this.elements.dateToFilter?.value || '',
            cliente_id: this.elements.clientFilter?.value || '',
            estado: this.elements.statusFilter?.value || ''
        };

        this.state.pagination.current_page = 1;
        await this.loadSales();
    },

    /**
     * Limpiar filtros
     */
    async clearFilters() {
        this.state.filters = {
            fecha_desde: '',
            fecha_hasta: '',
            cliente_id: '',
            estado: ''
        };

        // Limpiar campos
        if (this.elements.dateFromFilter) this.elements.dateFromFilter.value = '';
        if (this.elements.dateToFilter) this.elements.dateToFilter.value = '';
        if (this.elements.clientFilter) this.elements.clientFilter.value = '';
        if (this.elements.statusFilter) this.elements.statusFilter.value = '';

        this.state.pagination.current_page = 1;
        await this.loadSales();
    },

    /**
     * Renderizar estado vacío
     */
    renderEmptyState() {
        if (!this.elements.salesTableBody) return;

        this.elements.salesTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-shopping-cart text-gray-400 text-4xl mb-4"></i>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No hay ventas registradas</h3>
                        <p class="text-gray-500 mb-4">Comienza creando tu primera venta</p>
                        <button 
                            class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            onclick="SalesManager.openNewSaleModal()">
                            <i class="fas fa-plus"></i>
                            Crear Primera Venta
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Renderizar paginación
     */
    renderPagination() {
        if (!this.elements.paginationContainer) return;

        const { current_page, total_pages, total_records, per_page } = this.state.pagination;

        if (total_pages <= 1) {
            this.elements.paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-700">
                    Mostrando ${((current_page - 1) * per_page) + 1} a ${Math.min(current_page * per_page, total_records)} de ${total_records} ventas
                </div>
                <div class="flex gap-2">
        `;

        // Botón anterior
        if (current_page > 1) {
            paginationHTML += `
                <button 
                    class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onclick="SalesManager.goToPage(${current_page - 1})">
                    Anterior
                </button>
            `;
        }

        // Números de página
        const startPage = Math.max(1, current_page - 2);
        const endPage = Math.min(total_pages, current_page + 2);

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === current_page;
            paginationHTML += `
                <button 
                    class="px-3 py-2 text-sm border rounded-md ${isActive 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white border-gray-300 hover:bg-gray-50'}"
                    onclick="SalesManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Botón siguiente
        if (current_page < total_pages) {
            paginationHTML += `
                <button 
                    class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onclick="SalesManager.goToPage(${current_page + 1})">
                    Siguiente
                </button>
            `;
        }

        paginationHTML += '</div></div>';
        this.elements.paginationContainer.innerHTML = paginationHTML;
    },

    /**
     * Ir a página específica
     */
    async goToPage(page) {
        this.state.pagination.current_page = page;
        await this.loadSales();
    },

    // Funciones auxiliares
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getStatusClass(status) {
        const classes = {
            'completada': 'bg-green-100 text-green-800',
            'pendiente': 'bg-yellow-100 text-yellow-800',
            'anulada': 'bg-red-100 text-red-800',
            'en_proceso': 'bg-blue-100 text-blue-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    },

    getStatusText(status) {
        const texts = {
            'completada': 'Completada',
            'pendiente': 'Pendiente',
            'anulada': 'Anulada',
            'en_proceso': 'En Proceso'
        };
        return texts[status] || status;
    },

    /**
     * Crear cliente de ejemplo si no existe ninguno
     */
    async createExampleClient() {
        try {
            const exampleClient = {
                tipo_cliente: 'persona',
                nombre: 'Cliente',
                apellidos: 'De Ejemplo',
                documento_tipo: 'cedula',
                documento_numero: Math.floor(Math.random() * 1000000000).toString(),
                email: 'cliente.ejemplo@email.com',
                telefono: '(601) 234-5678',
                celular: '3001234567',
                direccion: 'Calle 123 #45-67',
                ciudad: 'Bogotá',
                departamento: 'Cundinamarca',
                genero: 'otro'
            };

            const response = await fetch('api/clients.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(exampleClient)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('✅ Cliente de ejemplo creado:', data.data);
                    this.state.clients = [data.data];
                } else {
                    console.error('❌ Error creando cliente de ejemplo:', data.message);
                }
            } else {
                console.error('❌ Error en petición de cliente de ejemplo:', response.status);
            }
        } catch (error) {
            console.error('❌ Error creando cliente de ejemplo:', error);
        }
    },

    showToast(message, type = 'info') {
        console.log(`📢 Toast: ${type.toUpperCase()}: ${message}`);
        
        // Usar el sistema de toast existente
        if (window.showToast) {
            window.showToast(message, type);
        } else if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback: mostrar alert
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
    /**
     * Obtener nombre para mostrar del cliente en la tabla
     */
    getClientDisplayName(sale) {
        // Si el cliente es empresa, mostrar razón social si existe
        if (sale.cliente_tipo === 'empresa' && sale.cliente_razon_social) {
            return sale.cliente_razon_social;
        }
        
        // Para personas o cuando no hay razón social, mostrar nombre completo
        const nombre = sale.cliente_nombre || '';
        const apellidos = sale.cliente_apellidos || '';
        return (nombre + ' ' + apellidos).trim() || 'Cliente sin nombre';
    }
};

// Exportar inmediatamente para que esté disponible
window.SalesManager = SalesManager;
console.log('✅ SalesManager exportado a window:', typeof window.SalesManager);

// Función simple para probar el botón directamente
window.forceOpenSaleModal = function() {
    console.log('🧪 === FORZAR APERTURA DE MODAL ===');
    
    const modal = document.querySelector('#new-sale-modal');
    console.log('Modal encontrado:', !!modal);
    
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'block';
        console.log('✅ Modal forzado a abrir');
        console.log('✅ Clases actuales:', modal.className);
    } else {
        console.log('❌ Modal no encontrado');
    }
};

// Función para test completo
window.testCreateSaleButton = function() {
    console.log('🧪 === TEST BOTÓN CREAR VENTA ===');
    
    const button = document.querySelector('#create-sale-btn');
    console.log('Botón encontrado:', !!button);
    
    if (button) {
        console.log('Simulando click...');
        button.click();
    } else {
        console.log('❌ Botón no encontrado en DOM');
    }
    
    console.log('SalesManager disponible:', typeof SalesManager !== 'undefined');
    if (typeof SalesManager !== 'undefined') {
        console.log('SalesManager inicializado:', SalesManager.isInitialized);
        console.log('Elementos encontrados:', {
            createSaleBtn: !!SalesManager.elements.createSaleBtn,
            newSaleModal: !!SalesManager.elements.newSaleModal,
            clientSelect: !!SalesManager.elements.clientSelect
        });
    }
};

// Función de debug para probar desde la consola
window.debugSales = function() {
    console.log('🧪 === DEBUG SALES MANAGER ===');
    console.log('🧪 SalesManager inicializado:', SalesManager.isInitialized);
    console.log('🧪 Elementos DOM:');
    console.log('  - createSaleBtn:', !!SalesManager.elements.createSaleBtn);
    console.log('  - newSaleModal:', !!SalesManager.elements.newSaleModal);
    console.log('  - saveSaleBtn:', !!SalesManager.elements.saveSaleBtn);
    console.log('  - clientSelect:', !!SalesManager.elements.clientSelect);
    console.log('🧪 Estado actual:');
    console.log('  - Clientes cargados:', SalesManager.state.clients.length);
    console.log('  - Libros cargados:', SalesManager.state.books.length);
    console.log('  - Items en venta actual:', SalesManager.state.newSale.items.length);
    
    if (SalesManager.elements.clientSelect) {
        console.log('🧪 Opciones en select de clientes:', SalesManager.elements.clientSelect.options.length);
    }
    
    // Probar abrir modal
    console.log('🧪 Probando abrir modal...');
    SalesManager.openNewSaleModal();
    
    // Agregar un item de prueba si hay libros
    if (SalesManager.state.books.length > 0) {
        console.log('🧪 Agregando libro de prueba...');
        SalesManager.addBookToSale(SalesManager.state.books[0].id);
    }
    
    console.log('🧪 === FIN DEBUG ===');
};

// Función para probar el guardado
window.testSaveSale = function() {
    console.log('🧪 === PROBANDO GUARDAR VENTA ===');
    
    // Verificar que el modal esté abierto
    if (!SalesManager.elements.newSaleModal || SalesManager.elements.newSaleModal.classList.contains('hidden')) {
        console.log('❌ Modal no está abierto, abriéndolo...');
        SalesManager.openNewSaleModal();
    }
    
    // Seleccionar primer cliente si hay alguno
    if (SalesManager.elements.clientSelect && SalesManager.elements.clientSelect.options.length > 1) {
        SalesManager.elements.clientSelect.value = SalesManager.elements.clientSelect.options[1].value;
        console.log('✅ Cliente seleccionado:', SalesManager.elements.clientSelect.value);
    }
    
    // Agregar un libro si hay libros disponibles
    if (SalesManager.state.books.length > 0) {
        SalesManager.addBookToSale(SalesManager.state.books[0].id);
        console.log('✅ Libro agregado');
    }
    
    // Intentar guardar
    console.log('🧪 Intentando guardar venta...');
    SalesManager.saveSale();
};

// Exportar para uso global
window.SalesManager = SalesManager;