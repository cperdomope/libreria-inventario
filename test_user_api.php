<?php
/**
 * SCRIPT DE PRUEBA PARA EL API DE USUARIOS
 * Prueba todas las funcionalidades del sistema de usuarios
 */

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test User API - Librería Digital</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="container mx-auto max-w-4xl px-4">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-center mb-6">
                <div class="bg-indigo-600 p-3 rounded-full mr-4">
                    <i class="fas fa-users text-white text-xl"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Test User Management API</h1>
                    <p class="text-gray-600">Prueba de funcionalidades del sistema de usuarios</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button onclick="testGetUsers()" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-list mr-2"></i>
                    Listar Usuarios
                </button>
                <button onclick="testCreateUser()" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>
                    Crear Usuario de Prueba
                </button>
                <button onclick="testUserModal()" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-window-restore mr-2"></i>
                    Probar Modal
                </button>
                <button onclick="clearResults()" 
                        class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-trash mr-2"></i>
                    Limpiar
                </button>
            </div>

            <div id="results" class="space-y-4"></div>
        </div>
    </div>

    <script>
        async function testGetUsers() {
            showLoading('Obteniendo usuarios...');
            
            try {
                const response = await fetch('api/users_simple.php');
                const text = await response.text();
                
                console.log('Raw response:', text);
                
                try {
                    const data = JSON.parse(text);
                    showResult('GET Users', data.success, data);
                } catch (parseError) {
                    showResult('GET Users', false, { 
                        error: 'JSON Parse Error: ' + parseError.message,
                        response: text.substring(0, 500)
                    });
                }
            } catch (error) {
                showResult('GET Users', false, { error: error.message });
            }
        }

        async function testCreateUser() {
            showLoading('Creando usuario de prueba...');
            
            const testUser = {
                nombre: 'Usuario de Prueba',
                email: `test${Date.now()}@libreria.com`,
                password: 'test123',
                rol: 'seller',
                estado: 'activo',
                telefono: '3001234567',
                direccion: 'Dirección de prueba 123'
            };
            
            try {
                const response = await fetch('api/users_simple.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(testUser)
                });
                
                const text = await response.text();
                console.log('Create user response:', text);
                
                try {
                    const data = JSON.parse(text);
                    showResult('CREATE User', data.success, data);
                } catch (parseError) {
                    showResult('CREATE User', false, { 
                        error: 'JSON Parse Error: ' + parseError.message,
                        response: text.substring(0, 500)
                    });
                }
                
                if (data.success) {
                    // Actualizar lista después de crear
                    setTimeout(testGetUsers, 1000);
                }
            } catch (error) {
                showResult('CREATE User', false, { error: error.message });
            }
        }

        function testUserModal() {
            showResult('Modal Test', true, {
                message: 'Ve a la sección de Usuarios en el dashboard principal y haz clic en "Nuevo Usuario" para probar el modal completo.',
                url: 'index.html#users'
            });
        }

        function showLoading(message) {
            const results = document.getElementById('results');
            results.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span class="text-blue-600">${message}</span>
                </div>
            `;
        }

        function showResult(title, success, data) {
            const results = document.getElementById('results');
            const bgColor = success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400';
            const textColor = success ? 'text-green-800' : 'text-red-800';
            const icon = success ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500';
            
            const resultDiv = document.createElement('div');
            resultDiv.className = `${bgColor} border-l-4 p-4 rounded`;
            resultDiv.innerHTML = `
                <div class="flex items-start">
                    <i class="fas ${icon} mr-3 mt-1"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold ${textColor}">${title}</h4>
                        <p class="text-sm ${textColor} mt-1">
                            ${success ? 'Operación exitosa' : 'Operación falló'}
                        </p>
                        <details class="mt-2">
                            <summary class="cursor-pointer text-sm ${textColor} hover:underline">
                                Ver detalles
                            </summary>
                            <pre class="bg-gray-100 p-3 rounded mt-2 text-xs overflow-auto">${JSON.stringify(data, null, 2)}</pre>
                        </details>
                    </div>
                </div>
            `;
            
            results.appendChild(resultDiv);
        }

        function clearResults() {
            document.getElementById('results').innerHTML = '';
        }

        // Auto-ejecutar test inicial
        window.addEventListener('load', () => {
            testGetUsers();
        });
    </script>
</body>
</html>