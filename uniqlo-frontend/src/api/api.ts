import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api'
});

export const CART_EVENT = 'cart-updated';

// Helper để bắn sự kiện
export const triggerCartUpdate = () => {
  window.dispatchEvent(new Event(CART_EVENT));
};

// ===== Types =====
export interface Product {
  id: number;
  name: string;
  price?: number;
  description?: string;
  employeeId?: number;
  categories: string[];
  variantSummary?: string;
}

export interface ProductDetail extends Product {
  variants: Array<{
    productId: number;
    variantId: number;
    color: string;
    size: string;
    price: number;
    stockQuantity: number;
    images: string[];
  }>;
}

export interface VariantPayload {
  variantId?: number;
  color: string;
  size: string;
  price: number;
}

export interface ProductPayload {
  name: string;
  description?: string;
  employeeId: number;
  variants: VariantPayload[];
  categoryIds?: number[];
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
  totalSpent?: number;
  memberTier?: string;
  phone?: string;
  address?: string;
  dob?: string;
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
    employeeId: payload.employeeId,
    variants: payload.variants,   
    categoryIds: payload.categoryIds  
  });
  return {
    ...response.data,
    categories: response.data.categories || []
  };
}

export async function updateProduct(
  id: number,
  payload: Partial<ProductPayload> // Payload nhận từ Form
): Promise<Product> {
  const response = await api.put<Product>(`/products/${id}`, {
    productName: payload.name,
    description: payload.description,
    employeeId: payload.employeeId,
    variants: payload.variants,
    categoryIds: payload.categoryIds 
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
export async function addToCart(
  productId: number, 
  variantId: number, 
  quantity: number, 
  userId: number
): Promise<void> {
  await api.post('/cart/add', { productId, variantId, quantity, userId });
  triggerCartUpdate();
}

// Checkout có UserID
export async function checkout(userId: number, paymentMethod: string = 'Cash'): Promise<{ message: string; orderId: number }> {
  const response = await api.post('/cart/checkout', { userId, paymentMethod });
  return response.data;
}

export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  await api.put(`/reports/orders/${orderId}/status`, { status });
}

export async function login(username: string, password: string): Promise<UserInfo> {
  const response = await api.post('/auth/login', { username, password });
  return response.data.user;
}

// ===== REGISTER API =====
export async function register(payload: RegisterPayload): Promise<{ message: string }> {
    // Gọi xuống API backend (Backend cần xử lý insert vào Account và Customer)
    const response = await api.post('/auth/register', {
        ...payload,
        role: 'Customer' // Mặc định đăng ký từ web là Customer
    });
    return response.data;
}

// ===== LOGIC GIỎ HÀNG KHÁCH (LOCAL STORAGE) =====
const GUEST_CART_KEY = 'uniqlo_guest_cart';

export function getGuestCart(): CartItemData[] {
  const json = localStorage.getItem(GUEST_CART_KEY);
  return json ? JSON.parse(json) : [];
}

export function addToGuestCart(
  product: Product, 
  variantId: number, 
  color: string, 
  size: string, 
  price: number, 
  quantity: number
): void {
  const currentCart = getGuestCart();
  
  // Kiểm tra trùng cả ProductID lẫn VariantID
  const existingItemIndex = currentCart.findIndex(
    item => item.ProductID === product.id && item.VariantID === variantId
  );

  if (existingItemIndex > -1) {
    currentCart[existingItemIndex].Quantity += quantity;
  } else {
    const newItem: CartItemData = {
      CartID: 0,
      ProductID: product.id,
      ProductName: product.name,
      VariantID: variantId, // Lưu ID biến thể thật
      Quantity: quantity,
      Price: price,         // Lưu giá của biến thể đó
      Color: color,         // Lưu màu thật
      Size: size,           // Lưu size thật
      Image: null 
    };
    currentCart.push(newItem);
  }
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(currentCart));

  triggerCartUpdate();
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);

  triggerCartUpdate();
}

// Hàm đồng bộ: Đẩy giỏ hàng Local lên Server sau khi Login
export async function syncGuestCartToUser(userId: number) {
  const guestCart = getGuestCart();
  if (guestCart.length === 0) return;

  // Lặp qua từng món và gọi API AddToCart (Có thể tối ưu bằng API bulk insert sau này)
  for (const item of guestCart) {
    await addToCart(item.ProductID, item.VariantID, item.Quantity, userId);
  }
  
  // Sau khi đồng bộ xong thì xóa Local
  clearGuestCart();

  triggerCartUpdate();
}

export function removeFromGuestCart(productId: number, variantId: number): void {
  const currentCart = getGuestCart();
  
  // Lọc giữ lại những món KHÔNG khớp (xóa món khớp ID và Variant)
  const newCart = currentCart.filter(
    item => !(item.ProductID === productId && item.VariantID === variantId)
  );
  
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(newCart));

  triggerCartUpdate();
}

export async function removeFromCart(userId: number, productId: number, variantId: number): Promise<void> {
  await api.post('/cart/remove', { userId, productId, variantId });

  triggerCartUpdate();
}

export async function fetchUserProfile(userId: number): Promise<UserInfo> {
  const response = await api.get('/auth/profile', { params: { userId } });
  return response.data;
}