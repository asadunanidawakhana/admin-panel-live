// Admin Authentication
const loginForm = document.getElementById('loginForm');
const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = e.target.elements[0].value;
    const password = e.target.elements[1].value;
    
    if (username === 'hakeem' && password === '123456') {
        loginContainer.style.display = 'none';
        adminContainer.style.display = 'flex';
        initializeAdmin();
    } else {
        showNotification('Invalid credentials ❌');
    }
});

// Database polling function
function pollDatabase() {
    setInterval(async () => {
        try {
            // In a real implementation, this would fetch from your database
            const updates = await checkForUpdates();
            if (updates) {
                updateAdminUI(updates);
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 5000);
}

// UI Updates
function updateAdminUI(updates) {
    if (updates.orders) {
        updateOrdersList(updates.orders);
        updateDashboardStats();
    }
    if (updates.products) {
        updateProductsList(updates.products);
    }
    if (updates.customers) {
        updateCustomersList(updates.customers);
    }
}

// Dashboard Charts
function initializeCharts() {
    // Sales Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Sales',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#2E7D32',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Sales Overview'
                }
            }
        }
    });

    // Orders Chart
    const ordersCtx = document.getElementById('ordersChart').getContext('2d');
    new Chart(ordersCtx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Confirmed', 'Delivered'],
            datasets: [{
                data: [3, 5, 2],
                backgroundColor: ['#FFA000', '#2E7D32', '#2196F3']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Order Status Distribution'
                }
            }
        }
    });
}

// Order Management
function updateOrdersList(orders) {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <span class="order-id">#${order.id}</span>
                <span class="status-${order.status.toLowerCase()}">
                    ${getStatusEmoji(order.status)} ${order.status}
                </span>
            </div>
            <div class="order-details">
                <p>Customer: ${order.customerName}</p>
                <p>Total: ₹${order.total}</p>
                <p>Date: ${new Date(order.timestamp).toLocaleDateString()}</p>
            </div>
            <div class="order-actions">
                <button onclick="updateOrderStatus(${order.id}, 'confirmed')"
                        ${order.status !== 'pending' ? 'disabled' : ''}>
                    Confirm Order
                </button>
                <button onclick="updateOrderStatus(${order.id}, 'delivered')"
                        ${order.status !== 'confirmed' ? 'disabled' : ''}>
                    Mark as Delivered
                </button>
            </div>
        </div>
    `).join('');
}

// Product Management
const addProductBtn = document.getElementById('addProductBtn');
const addProductModal = document.getElementById('addProductModal');
const addProductForm = document.getElementById('addProductForm');
const productsList = document.getElementById('productsList');

// Get products from localStorage or initialize empty array
let products = JSON.parse(localStorage.getItem('products')) || [];

// Function to save products to localStorage
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

// Open modal
addProductBtn.addEventListener('click', () => {
    addProductModal.style.display = 'flex';
});

// Close modal when clicking close button
addProductModal.querySelector('.close-btn').addEventListener('click', () => {
    addProductModal.style.display = 'none';
    addProductForm.reset();
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        if (e.target.contains(addProductForm)) {
            addProductForm.reset();
        }
    }
});

addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const imageFile = formData.get('image');
    
    try {
        // Convert image to base64
        const base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        const productData = {
            id: Date.now(),
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            description: formData.get('description'),
            image: base64Image,
            createdAt: new Date().toISOString()
        };
        
        // Validate data
        if (!productData.name || !productData.price || !productData.description) {
            throw new Error('Please fill in all fields');
        }
        
        // Add product to array and save to localStorage
        products.push(productData);
        saveProducts();
        
        // Update products list
        updateProductsList();
        updateDashboardStats();
        
        // Close modal and reset form
        addProductModal.style.display = 'none';
        addProductForm.reset();
        
        showNotification('Product added successfully! ✅');
    } catch (error) {
        showNotification(error.message || 'Error adding product. Please try again.');
    }
});

function updateProductsList() {
    if (!productsList) return;
    
    productsList.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='placeholder.jpg'">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p class="price">₹${product.price}</p>
            <div class="product-actions">
                <button onclick="editProduct(${product.id})" class="edit-btn">Edit</button>
                <button onclick="deleteProduct(${product.id})" class="delete-btn">Delete</button>
            </div>
        </div>
    `).join('');
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        updateProductsList();
        updateDashboardStats();
        showNotification('Product deleted successfully');
    }
}

// Update dashboard stats
function updateDashboardStats() {
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    const totalProducts = document.getElementById('totalProducts');
    const totalCustomers = document.getElementById('totalCustomers');
    
    if (totalProducts) {
        totalProducts.textContent = products.length;
    }
    
    if (totalCustomers) {
        totalCustomers.textContent = users.length;
    }
}

// Customer Management
function updateCustomersList() {
    const customersList = document.getElementById('customersList');
    if (!customersList) return;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    customersList.innerHTML = users.map(user => `
        <div class="customer-card">
            <h3>${user.name}</h3>
            <p>${user.email}</p>
            <p>Joined: ${new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
        </div>
    `).join('');
}

// Initialize Admin Panel
function initializeAdmin() {
    updateProductsList();
    updateCustomersList();
    updateDashboardStats();
    initializeCharts();
    loadOrders();
}

// Navigation
const navLinks = document.querySelectorAll('.nav-links li');
const tabContents = document.querySelectorAll('.tab-content');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const tab = link.dataset.tab;
        
        // Update active states
        navLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        
        link.classList.add('active');
        document.getElementById(tab).classList.add('active');
    });
});

// Utility Functions
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function getStatusEmoji(status) {
    const emojis = {
        pending: '🕒',
        confirmed: '✅',
        delivered: '📦'
    };
    return emojis[status.toLowerCase()] || '❓';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    loginContainer.style.display = 'flex';
    adminContainer.style.display = 'none';
});

// Load and display orders
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const ordersTableBody = document.querySelector('#ordersTable tbody');
    
    if (ordersTableBody) {
        ordersTableBody.innerHTML = orders.map((order, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${order.customerName}</td>
                <td>${order.phoneNumber}</td>
                <td>${order.address}</td>
                <td>₹${order.total.toFixed(2)}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus(${index}, this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <button onclick="viewOrderDetails(${index})" class="view-btn">View Details</button>
                </td>
            </tr>
        `).join('');
    }
}

// Update order status
function updateOrderStatus(orderIndex, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders[orderIndex].status = newStatus;
    localStorage.setItem('orders', JSON.stringify(orders));
    showNotification('Order status updated successfully!');
    loadOrders();
}

// View order details
function viewOrderDetails(orderIndex) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders[orderIndex];
    
    const orderDetailsModal = document.getElementById('orderDetailsModal');
    const orderDetailsContent = document.querySelector('#orderDetailsModal .modal-content');
    
    orderDetailsContent.innerHTML = `
        <span class="close-btn">&times;</span>
        <h3>Order Details</h3>
        <div class="order-info">
            <p><strong>Customer Name:</strong> ${order.customerName}</p>
            <p><strong>Phone:</strong> ${order.phoneNumber}</p>
            <p><strong>Address:</strong> ${order.address}</p>
            <p><strong>Age:</strong> ${order.age}</p>
            <p><strong>Gender:</strong> ${order.gender}</p>
            <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="status-${order.status}">${order.status}</span></p>
        </div>
        <div class="order-items">
            <h4>Items Ordered</h4>
            ${order.items.map(item => `
                <div class="order-item">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='placeholder.jpg'">
                    <div class="item-details">
                        <h5>${item.name}</h5>
                        <p class="price">₹${item.price}</p>
                    </div>
                </div>
            `).join('')}
            <div class="order-total">
                <strong>Total Amount:</strong> ₹${order.total.toFixed(2)}
            </div>
        </div>
    `;

    orderDetailsModal.style.display = 'flex';
    
    // Close button functionality
    const closeBtn = orderDetailsContent.querySelector('.close-btn');
    closeBtn.onclick = () => orderDetailsModal.style.display = 'none';
}

// Make functions globally available
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;

// Reload orders when localStorage changes
window.addEventListener('storage', loadOrders);
