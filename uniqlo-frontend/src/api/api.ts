import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api'
});

// ===== Types =====
export interface Product {
  id: number;
  name: string;
  price?: number;
  description?: string;
  employeeId?: number;
  categories: string[];
}

export interface ProductDetail extends Product {
  variants: Array<{
    productId: number;
    variantId: number;
    color: string;
    size: string;
    price: number;
    images: string[];
  }>;
}

export interface ProductPayload {
  name: string;
  description?: string;
  employeeId: number;
}

export interface CustomerOrderRow {
  orderId: number;
  orderDate: string;
  orderStatus: string;
  trackingCode: string | null;
  unitName: string | null;
  address: string;
  customerName?: string;
}

export interface StoreInventoryRow {
  storeName: string;
  address: string;
  skuCount: number;
  totalItems: number;
}

export interface LowStockRow {
  productName: string;
  variantInfo: string;
  qty: number;
  note: string;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  dbRole: string; // 'Customer', 'Admin', 'Employee'
  role: 'buyer' | 'seller'; // Role để FE xử lý giao diện
}

// ===== AUTH Types =====
export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  phone: string;
  dob: string; // YYYY-MM-DD
}

// ===== Product APIs =====

export async function fetchProducts(params?: {
  search?: string;
  categoryId?: number;
}): Promise<Product[]> {
  const response = await api.get<Product[]>('/products', { params });
  return response.data;
}

export async function fetchProductById(id: number): Promise<ProductDetail> {
  const response = await api.get<ProductDetail>(`/products/${id}`);
  return response.data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const response = await api.post<Product>('/products', {
    productName: payload.name,
    description: payload.description,
    employeeId: payload.employeeId
  });
  return {
    ...response.data,
    categories: response.data.categories || []
  };
}

export async function updateProduct(
  id: number,
  payload: Partial<ProductPayload>
): Promise<Product> {
  const response = await api.put<Product>(`/products/${id}`, {
    productName: payload.name,
    description: payload.description,
    employeeId: payload.employeeId
  });
  return {
    ...response.data,
    categories: response.data.categories || []
  };
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

// ===== Report APIs =====

export async function fetchCustomerOrdersReport(params: {
  customerId: number;
  statusList: string[];
}): Promise<CustomerOrderRow[]> {
  const response = await api.get<CustomerOrderRow[]>(
    '/reports/customer-orders',
    {
      params: {
        customerId: params.customerId,
        statusList: params.statusList.join(',')
      }
    }
  );
  return response.data;
}

export async function fetchStoreInventoryReport(params: {
  minTotalItems: number;
  storeNameKeyword?: string;
}): Promise<StoreInventoryRow[]> {
  const response = await api.get<StoreInventoryRow[]>(
    '/reports/store-inventory',
    {
      params
    }
  );
  return response.data;
}

export async function fetchStoreLowStockReport(params: {
  storeId: number;
  threshold?: number;
}): Promise<LowStockRow[]> {
  const response = await api.get<LowStockRow[]>(
    '/reports/store-low-stock',
    {
      params
    }
  );
  return response.data;
}

export default api;

export interface CartItemData {
  CartID: number;
  ProductID: number;
  ProductName: string;
  VariantID: number;
  Quantity: number;
  Price: number;
  Color: string;
  Size: string;
  Image: string | null;
}

export async function fetchCart(userId: number): Promise<CartItemData[]> {
  const response = await api.get<CartItemData[]>('/cart', { params: { userId } });
  return response.data;
}

// Thêm vào giỏ có UserID và Quantity
export async function addToCart(productId: number, quantity: number, userId: number): Promise<void> {
  await api.post('/cart/add', { productId, variantId: 1, quantity, userId });
}

// Checkout có UserID
export async function checkout(userId: number): Promise<{ message: string; orderId: number }> {
  const response = await api.post('/cart/checkout', { userId });
  return response.data;
}

export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  await api.put(`/reports/orders/${orderId}/status`, { status });
}

export async function login(username: string, password: string): Promise<UserInfo> {
  const response = await api.post('/auth/login', { username, password });
  return response.data.user;
}

// ===== REGISTER API (MỚI) =====
export async function register(payload: RegisterPayload): Promise<{ message: string }> {
    // Gọi xuống API backend (Backend cần xử lý insert vào Account và Customer)
    const response = await api.post('/auth/register', {
        ...payload,
        role: 'Customer' // Mặc định đăng ký từ web là Customer
    });
    return response.data;
}