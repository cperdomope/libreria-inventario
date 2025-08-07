# 📚 Sistema de Inventario para Librería

Un sistema completo de gestión e inventario diseñado específicamente para librerías, con una interfaz moderna y funcionalidades completas para el manejo de libros, reportes y configuración.

## 🏗️ Estructura del Proyecto

```
📦 libreria-inventario/
├── 📄 index.html                    # Página principal (limpia, sin CSS/JS inline)
├── 📄 README.md                     # Documentación del proyecto
├── 📁 assets/                       # Recursos organizados por tipo
│   ├── 📁 css/                     # Estilos modulares
│   │   ├── 📄 styles.css           # Estilos base y variables
│   │   ├── 📄 components.css       # Componentes específicos
│   │   ├── 📄 animations.css       # Animaciones y transiciones
│   │   └── 📄 responsive.css       # Media queries y diseño adaptativo
│   ├── 📁 images/                  # Recursos gráficos
│   │   ├── 📁 icons/
│   │   └── 📄 logo.png
│   └── 📁 js/                      # JavaScript organizado por módulos
│       ├── 📁 components/          # Componentes específicos
│       │   └── 📄 dashboard.js     # Funcionalidad del dashboard
│       ├── 📁 modules/             # Módulos principales
│       │   ├── 📄 app-init.js      # Inicialización de la aplicación
│       │   └── 📄 navigation.js    # Sistema de navegación
│       ├── 📁 utils/               # Utilidades reutilizables
│       │   └── 📄 helpers.js       # Funciones helper y utilidades
│       └── 📄 main.js              # Funcionalidad principal
└── 📁 .git/                       # Repositorio Git
```

## 🎯 Beneficios de la Nueva Estructura

### ✅ **Modularidad**
- Código organizado por funcionalidad y responsabilidad
- Fácil localización y mantenimiento de componentes específicos
- Separación clara entre estilos, lógica y utilidades

### ✅ **Mantenibilidad**
- HTML limpio sin CSS o JavaScript inline
- Archivos especializados por función (dashboard, navegación, utilidades)
- Estructura escalable para futuros desarrollos

### ✅ **Performance**
- Carga optimizada de recursos
- Separación de utilidades para reutilización
- Mejor gestión de dependencias

### ✅ **Desarrollo**
- Estructura clara para nuevos desarrolladores
- Convenciones consistentes en toda la aplicación
- Facilita el trabajo en equipo y versionado

## ✨ Características Principales

### 📊 Dashboard Interactivo

- Estadísticas en tiempo real del inventario
- Visualización de libros recientes agregados
- Feed de actividad con todas las acciones realizadas
- Tarjetas de métricas con animaciones suaves

### 📖 Gestión de Inventario

- Lista completa de libros con filtros avanzados
- Búsqueda en tiempo real por título, autor o ISBN
- Paginación inteligente para grandes inventarios
- Acciones rápidas: ver, editar y eliminar libros

### ➕ Agregar Libros

- Formulario intuitivo con validación en tiempo real
- Campos para toda la información relevante del libro
- Validación de ISBN automática
- Categorización flexible de libros

### 📈 Sistema de Reportes

- Análisis por categorías de libros
- Alertas de stock bajo configurable
- Métricas de valor total del inventario
- Exportación de datos a CSV/Excel

### ⚙️ Configuración Avanzada

- Personalización de moneda
- Configuración de umbrales de stock
- Respaldo e importación de datos
- Gestión completa de la aplicación

## 🚀 Tecnologías Utilizadas

- **HTML5 Semántico**: Estructura accesible y moderna
- **CSS3 Avanzado**: Variables CSS, Grid, Flexbox, animaciones
- **JavaScript ES6+**: Programación orientada a objetos, módulos
- **PWA**: Progressive Web App con soporte offline
- **localStorage**: Persistencia de datos local
- **Responsive Design**: Optimizado para todos los dispositivos

## 📱 Características PWA

- ✅ Instalable en dispositivos móviles y desktop
- ✅ Funciona offline después de la primera carga
- ✅ Actualizaciones automáticas
- ✅ Íconos adaptativos para diferentes plataformas
- ✅ Atajos de aplicación personalizados

## 🎨 Diseño y UX

### Interfaz Moderna

- Diseño limpio y profesional
- Paleta de colores consistente con variables CSS
- Tipografía legible y jerarquía visual clara
- Componentes reutilizables y modulares

### Experiencia de Usuario

- Navegación intuitiva con sidebar colapsable
- Feedback visual inmediato en todas las acciones
- Animaciones fluidas y transiciones suaves
- Notificaciones toast para confirmaciones

### Responsividad

- Diseño mobile-first
- Breakpoints optimizados para tablet y desktop
- Menú hamburguesa en dispositivos móviles
- Tablas responsivas con scroll horizontal

## 🔧 Instalación y Uso

### Instalación Local

```bash
# Clonar el repositorio
git clone [url-del-repositorio]

# Navegar al directorio
cd libreria-inventario

# Abrir con un servidor local (recomendado)
npx serve .
# o usar Live Server en VS Code
```

### Estructura de Archivos

```
📁 libreria-inventario/
├── 📁 assets/
│   ├── 📁 css/
│   │   ├── 📄 styles.css          # Estilos principales
│   │   ├── 📄 components.css      # Componentes específicos
│   │   ├── 📄 responsive.css      # Media queries
│   │   └── 📄 animations.css      # Animaciones
│   ├── 📁 js/
│   │   ├── 📄 main.js             # Lógica principal
│   │   ├── 📄 navigation.js       # Sistema de navegación
│   │   └── 📄 utils.js            # Funciones utilitarias
│   ├── 📁 images/                 # Íconos y imágenes
│   └── 📁 fonts/                  # Fuentes personalizadas
├── 📄 index.html                  # Página principal
├── 📄 manifest.json              # PWA manifest
└── 📄 README.md                  # Documentación
```

## 💻 Uso de la Aplicación

### Primeros Pasos

1. **Dashboard**: Vista general con estadísticas del inventario
2. **Agregar Libros**: Usar el formulario para crear nuevos registros
3. **Inventario**: Gestionar y buscar libros existentes
4. **Reportes**: Analizar datos y exportar información
5. **Configuración**: Personalizar la aplicación

### Funcionalidades Clave

#### Gestión de Libros

- **Agregar**: Formulario completo con validación
- **Editar**: Modificar información existente
- **Eliminar**: Remover libros con confirmación
- **Buscar**: Filtros por categoría, estado y texto libre

#### Datos y Exportación

- **Respaldo**: Exportar todos los datos en formato JSON
- **Importación**: Restaurar datos desde archivo
- **CSV**: Exportar inventario para análisis externo
- **Configuración**: Personalizar umbrales y moneda

## ⌨️ Atajos de Teclado

| Combinación  | Acción                    |
| ------------ | ------------------------- |
| `Ctrl + 1-5` | Navegar entre secciones   |
| `Ctrl + N`   | Agregar nuevo libro       |
| `Ctrl + F`   | Enfocar búsqueda          |
| `Ctrl + S`   | Guardar formulario actual |
| `Ctrl + E`   | Exportar datos            |
| `Ctrl + B`   | Toggle sidebar            |
| `Alt + ←/→`  | Navegación historial      |
| `Alt + M`    | Toggle menú móvil         |
| `Escape`     | Cerrar modales            |

## 🎯 Características Técnicas

### Performance

- **Lazy Loading**: Carga de imágenes bajo demanda
- **Debouncing**: Optimización de búsquedas
- **Memoización**: Cache de cálculos complejos
- **Virtual Scrolling**: Para listas grandes

### Accesibilidad

- **ARIA**: Etiquetas semánticas completas
- **Keyboard Navigation**: Navegación completa por teclado
- **High Contrast**: Soporte para alto contraste
- **Screen Readers**: Compatible con lectores de pantalla

### Seguridad

- **XSS Protection**: Escape de HTML en contenido dinámico
- **Input Validation**: Validación tanto cliente como servidor
- **HTTPS Ready**: Preparado para conexiones seguras

## 🔄 Estados de la Aplicación

### Estados de Libros

- **Disponible**: Libro en stock y disponible
- **Prestado**: Libro prestado a un cliente
- **Reservado**: Libro reservado para venta

### Categorías

- **Ficción**: Novelas y literatura narrativa
- **No Ficción**: Ensayos, biografías, etc.
- **Educativo**: Libros de texto y académicos
- **Infantil**: Literatura para niños
- **Técnico**: Manuales y libros especializados

## 📊 Métricas y Analytics

### Dashboard Metrics

- Total de libros en inventario
- Libros disponibles vs prestados
- Valor total del inventario
- Alertas de stock bajo

### Reportes Disponibles

- Distribución por categorías
- Análisis de stock bajo
- Historial de actividades
- Métricas de valor

## 🔧 Configuración Avanzada

### Personalización

```javascript
// Ejemplo de configuración personalizada
const config = {
  currency: "COP", // Moneda por defecto
  lowStockThreshold: 5, // Umbral de stock bajo
  itemsPerPage: 10, // Items por página
  autoSave: true, // Guardado automático
  darkMode: false, // Modo oscuro
};
```

### Variables CSS Personalizables

```css
:root {
  --primary-color: #2563eb; /* Color principal */
  --secondary-color: #64748b; /* Color secundario */
  --success-color: #059669; /* Color de éxito */
  --warning-color: #d97706; /* Color de advertencia */
  --danger-color: #dc2626; /* Color de peligro */
}
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### Los datos no se guardan

- Verificar que localStorage esté habilitado
- Comprobar espacio disponible en el navegador
- Revisar la consola por errores de JavaScript

#### La aplicación no carga

- Asegurar que se sirve
