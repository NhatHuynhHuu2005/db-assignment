// src/types/index.ts

export interface ProductVariant {
  variantID: number;
  color: string;
  size: string;
  price: number;
  imageURL?: string; // Từ bảng ProductVariant_ImageURL
  stockQuantity: number; // Từ bảng Has_Stock
}

export interface Product {
  productID: number;
  productName: string;
  description: string;
  variants: ProductVariant[]; // React sẽ gom nhóm variant vào đây
}

export interface CartItem {
  productID: number;
  variantID: number;
  quantity: number;
  productName: string;
  variantInfo: string; // VD: "White / S"
  price: number;
}