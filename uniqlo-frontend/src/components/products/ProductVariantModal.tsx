import React, { useState } from 'react';
import { type ProductDetail } from '../../api/api';
import '../../styles/Components.scss';

interface ModalProps {
    product: ProductDetail;
    onClose: () => void;
    onConfirm: (variantId: number, color: string, size: string, price: number, quantity: number) => void;
}

export const ProductVariantModal: React.FC<ModalProps> = ({ product, onClose, onConfirm }) => {
    const colors = Array.from(new Set(product.variants.map(v => v.color)));
    const sizes = Array.from(new Set(product.variants.map(v => v.size)));

    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Tìm variant khớp
    const matchedVariant = product.variants.find(
        v => v.color === selectedColor && v.size === selectedSize
    );

    // --- LOGIC KIỂM TRA TRẠNG THÁI ---
    // 1. Kiểm tra đã chọn đủ màu và size chưa
    const isSelectionComplete = Boolean(selectedColor) && Boolean(selectedSize);
    
    // 2. Lấy tồn kho (Nếu chưa chọn xong thì coi như 0 để tính toán, nhưng chưa báo lỗi)
    const currentStock = matchedVariant ? matchedVariant.stockQuantity : 0;
    
    // 3. Kiểm tra hết hàng: Chỉ tính khi đã chọn xong mà không có hàng
    const isOutOfStock = isSelectionComplete && (!matchedVariant || currentStock <= 0);
    
    // 4. Kiểm tra số lượng mua: Chỉ hợp lệ khi <= tồn kho
    const isQuantityValid = quantity <= currentStock;

    // 5. Xác định khi nào nút bị Disable (Xám)
    // Disable khi: Chưa chọn xong HOẶC Hết hàng HOẶC Mua lố số lượng
    const isButtonDisabled = !isSelectionComplete || isOutOfStock || !isQuantityValid;

    const handleConfirm = () => {
        if (!matchedVariant) return;
        onConfirm(matchedVariant.variantId, matchedVariant.color, matchedVariant.size, matchedVariant.price, quantity);
    };

    // Hàm render giá
    const renderPrice = () => {
        if (matchedVariant) {
            return <span className="price-text">{matchedVariant.price.toLocaleString()} ₫</span>;
        }
        if (isOutOfStock) {
            return <span className="price-text out-of-stock">Hết hàng</span>;
        }
        return <span className="price-text">{product.price?.toLocaleString()} ₫</span>;
    };

    // --- LOGIC CHỮ TRÊN NÚT ---
    const getButtonLabel = () => {
        if (!isSelectionComplete) return 'THÊM VÀO GIỎ HÀNG'; // Chưa chọn -> Hiện chữ gốc (Xám)
        if (isOutOfStock) return 'HẾT HÀNG';
        if (!isQuantityValid) return `QUÁ SỐ LƯỢNG KHO (${currentStock})`;
        return 'THÊM VÀO GIỎ HÀNG'; // Đủ điều kiện -> Hiện chữ gốc (Đỏ)
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="btn-close" onClick={onClose}>&times;</button>
                
                {/* HEADER */}
                <div className="modal-header">
                    <div className="modal-img-placeholder">
                       {matchedVariant?.images?.[0] ? <img src={matchedVariant.images[0]} alt="product" /> : '👕'}
                    </div>
                    <div className="modal-info">
                        <div className="modal-price">
                            {renderPrice()}
                        </div>
                        <div className="modal-stock">
                            {matchedVariant 
                                ? (currentStock > 0 ? `Kho: Còn ${currentStock} sp` : 'Hết hàng') 
                                : (isOutOfStock ? 'Tạm hết hàng' : 'Vui lòng chọn phân loại')
                            }
                        </div>
                    </div>
                </div>

                <div className="modal-body">
                    {/* MÀU SẮC */}
                    <div className="option-group">
                        <label>Màu sắc</label>
                        <div className="option-list">
                            {colors.map(c => (
                                <button 
                                    key={c}
                                    className={`option-btn ${selectedColor === c ? 'active' : ''}`}
                                    onClick={() => setSelectedColor(c)}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* KÍCH THƯỚC */}
                    <div className="option-group">
                        <label>Kích thước</label>
                        <div className="option-list">
                            {sizes.map(s => (
                                <button 
                                    key={s}
                                    className={`option-btn ${selectedSize === s ? 'active' : ''}`}
                                    onClick={() => setSelectedSize(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SỐ LƯỢNG */}
                    <div className="option-group quantity-group">
                        <label>Số lượng</label>
                        <div className="qty-wrapper">
                            <button 
                                className="qty-btn minus" 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                // Chỉ disable nút trừ khi đã chọn xong mà hết hàng
                                disabled={(isSelectionComplete && isOutOfStock) || quantity <= 1}
                            >
                                <svg width="10" height="2" viewBox="0 0 10 2" fill="none"><rect width="10" height="2" fill="currentColor"/></svg>
                            </button>
                            
                            <input 
                                type="number" 
                                className="qty-input" 
                                value={quantity} 
                                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                                disabled={isSelectionComplete && isOutOfStock}
                            />
                            
                            <button 
                                className="qty-btn plus" 
                                onClick={() => {
                                    // Nếu chưa chọn xong, cho tăng thoải mái (logic Shopee) hoặc chặn (tùy bạn).
                                    // Ở đây tôi để tăng max là stock nếu đã chọn, hoặc vô cực nếu chưa chọn.
                                    const maxQty = isSelectionComplete ? currentStock : 9999;
                                    setQuantity(Math.min(quantity + 1, maxQty));
                                }}
                                disabled={isSelectionComplete && (isOutOfStock || quantity >= currentStock)}
                            >
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M4 10V6H0V4H4V0H6V4H10V6H6V10H4Z" fill="currentColor"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* BUTTON CHÍNH */}
                <button 
                    className={`btn-confirm-add ${isButtonDisabled ? 'disabled' : ''}`}
                    disabled={isButtonDisabled}
                    onClick={handleConfirm}
                >
                    {getButtonLabel()}
                </button>
            </div>
        </div>
    );
};