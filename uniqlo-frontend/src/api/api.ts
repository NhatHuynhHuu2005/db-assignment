import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api'
});

export const CART_EVENT = 'cart-updated';

export const triggerCartUpdate = () => {
  window.dispatchEvent(new Event(CART_EVENT));
};

// ===== Types =====
export interface Product {
  id: number;
  name: string;
  price?: number;
  finalPrice?: number;
  promoDetails?: {
      name: string;
      type: string;
      value: number;
  } | null;
  imageUrl?: string;
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
  imageUrl?: string;
  categoryIds?: number[];
}

export interface Promotion {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    ruleType: 'Percentage' | 'FixedAmount' | 'Buy1Get1';
    rewardValue: number;
    appliedCount: number;
    voucherCode?: string | null;
}

export interface PromotionRulePayload {
    ruleId?: number;
    type: 'Percentage' | 'FixedAmount' | 'Buy1Get1';
    value: number;
}

export interface PromotionPayload {
    name: string;
    startDate: string;
    endDate: string;
    employeeId: number;
    rules: PromotionRulePayload[];
    voucherCode?: string;
}

export interface PromotionDetail extends Promotion {
    rules: {
        ruleId: number;
        ruleType: 'Percentage' | 'FixedAmount' | 'Buy1Get1';
        rewardValue: number;
    }[];
}

export interface VoucherValidationResult {
    valid: boolean;
    promoId: number;
    name: string;
    ruleType: 'Percentage' | 'FixedAmount' | 'Buy1Get1';
    rewardValue: number;
}

// --- Report Types ---
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

// --- User Types ---
export interface UserInfo {
  id: number;
  name: string;
  email: string;
  dbRole: string; 
  role: 'buyer' | 'seller'; 
  totalSpent?: number;
  memberTier?: string;
  phone?: string;
  address?: string;
  dob?: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  phone: string;
  dob: string; 
}

export interface UpdateProfilePayload {
    userId: number;
    email: string;
    phone: string;
    dob: string;
    street: string;
    ward: string;
    district: string;
    city: string;
}

// --- Cart Types ---
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

export interface ShippingUnit {
    UnitID: number;
    UnitName: string;
}

export interface CheckoutPayload {
    userId: number;
    paymentMethod: string;
    shippingFee: number;
    discountAmount: number;
    finalTotal: number;
    unitId: number;
    voucherCode?: string;
    address: string;
}


// ===== Product APIs =====

export async function fetchProducts(params?: { search?: string; categoryId?: number; }): Promise<Product[]> {
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
  return { ...response.data, categories: response.data.categories || [] };
}

export async function updateProduct(id: number, payload: Partial<ProductPayload>): Promise<Product> {
  const response = await api.put<Product>(`/products/${id}`, {
    productName: payload.name,
    description: payload.description,
    employeeId: payload.employeeId,
    variants: payload.variants,
    categoryIds: payload.categoryIds 
  });
  return { ...response.data, categories: response.data.categories || [] };
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

// ===== Report APIs =====

export async function fetchCustomerOrdersReport(params: { customerId: number; statusList: string[]; }): Promise<CustomerOrderRow[]> {
  const response = await api.get<CustomerOrderRow[]>('/reports/customer-orders', {
      params: { customerId: params.customerId, statusList: params.statusList.join(',') }
  });
  return response.data;
}

export async function fetchStoreInventoryReport(params: { minTotalItems: number; storeNameKeyword?: string; }): Promise<StoreInventoryRow[]> {
  const response = await api.get<StoreInventoryRow[]>('/reports/store-inventory', { params });
  return response.data;
}

export async function fetchStoreLowStockReport(params: { storeId: number; threshold?: number; }): Promise<LowStockRow[]> {
  const response = await api.get<LowStockRow[]>('/reports/store-low-stock', { params });
  return response.data;
}

export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  await api.put(`/reports/orders/${orderId}/status`, { status });
}


// ===== CART & CHECKOUT APIs =====

export async function fetchCart(userId: number): Promise<CartItemData[]> {
  const response = await api.get<CartItemData[]>('/cart', { params: { userId } });
  return response.data;
}

export async function addToCart(productId: number, variantId: number, quantity: number, userId: number): Promise<void> {
  await api.post('/cart/add', { productId, variantId, quantity, userId });
  triggerCartUpdate();
}

export async function removeFromCart(userId: number, productId: number, variantId: number): Promise<void> {
  await api.post('/cart/remove', { userId, productId, variantId });
  triggerCartUpdate();
}

// --- MỚI: Lấy danh sách Đơn vị vận chuyển ---
export async function fetchShippingUnits(): Promise<ShippingUnit[]> {
    const response = await api.get<ShippingUnit[]>('/cart/shipping-units');
    return response.data;
}

// --- MỚI: Checkout đầy đủ ---
export async function checkoutCart(payload: CheckoutPayload): Promise<{ message: string; orderId: number }> {
    const response = await api.post('/cart/checkout', payload);
    return response.data;
}


// ===== AUTH APIs =====
export async function login(username: string, password: string): Promise<UserInfo> {
  const response = await api.post('/auth/login', { username, password });
  return response.data.user;
}

export async function register(payload: RegisterPayload): Promise<{ message: string }> {
    const response = await api.post('/auth/register', { ...payload, role: 'Customer' });
    return response.data;
}

export async function fetchUserProfile(userId: number): Promise<UserInfo> {
  const response = await api.get('/auth/profile', { params: { userId } });
  return response.data;
}

export async function updateUserProfile(payload: UpdateProfilePayload): Promise<void> {
    await api.put('/auth/profile/update', payload);
}

// ===== GUEST CART LOGIC (Local Storage) =====
const GUEST_CART_KEY = 'uniqlo_guest_cart';

export function getGuestCart(): CartItemData[] {
  const json = localStorage.getItem(GUEST_CART_KEY);
  return json ? JSON.parse(json) : [];
}

export function addToGuestCart(product: Product, variantId: number, color: string, size: string, price: number, quantity: number): void {
  const currentCart = getGuestCart();
  const existingItemIndex = currentCart.findIndex(
    item => item.ProductID === product.id && item.VariantID === variantId
  );

  if (existingItemIndex > -1) {
    currentCart[existingItemIndex].Quantity += quantity;
  } else {
    const newItem: CartItemData = {
      CartID: 0, ProductID: product.id, ProductName: product.name,
      VariantID: variantId, Quantity: quantity, Price: price,
      Color: color, Size: size, Image: null 
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

export async function syncGuestCartToUser(userId: number) {
  const guestCart = getGuestCart();
  if (guestCart.length === 0) return;
  for (const item of guestCart) {
    await addToCart(item.ProductID, item.VariantID, item.Quantity, userId);
  }
  clearGuestCart();
  triggerCartUpdate();
}

export function removeFromGuestCart(productId: number, variantId: number): void {
  const currentCart = getGuestCart();
  const newCart = currentCart.filter(
    item => !(item.ProductID === productId && item.VariantID === variantId)
  );
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(newCart));
  triggerCartUpdate();
}


// ===== PROMOTION APIs =====
export async function fetchPromotions(search?: string): Promise<Promotion[]> {
    const response = await api.get<Promotion[]>('/promotions', { params: { search } });
    return response.data;
}

export async function fetchPromotionById(id: number): Promise<PromotionDetail> {
    const response = await api.get<PromotionDetail>(`/promotions/${id}`);
    return response.data;
}

export async function createPromotion(payload: PromotionPayload): Promise<void> {
    await api.post('/promotions', payload);
}

export async function updatePromotion(id: number, payload: PromotionPayload): Promise<void> {
    await api.put(`/promotions/${id}`, payload);
}

export async function deletePromotion(id: number): Promise<void> {
    await api.delete(`/promotions/${id}`);
}

export async function validateVoucher(code: string): Promise<VoucherValidationResult> {
    const response = await api.post<VoucherValidationResult>('/promotions/validate', { code });
    return response.data;
}

// ===== EMPLOYEE MANAGEMENT APIs =====
export interface Employee {
    UserID: number; UserName: string; Email: string; Role: string; Salary: number; StartDate: string; Phone?: string;
}

export async function fetchEmployees(): Promise<Employee[]> {
    const response = await api.get<Employee[]>('/admin/employees');
    return response.data;
}
export async function createEmployee(payload: any): Promise<void> { await api.post('/admin/employees', payload); }
export async function updateEmployee(id: number, payload: any): Promise<void> { await api.put(`/admin/employees/${id}`, payload); }
export async function deleteEmployee(id: number): Promise<void> { await api.delete(`/admin/employees/${id}`); }

export default api;