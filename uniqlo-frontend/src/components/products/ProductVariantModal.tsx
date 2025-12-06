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

    // Kiểm tra logic hiển thị
    const isSelectionComplete = Boolean(selectedColor) && Boolean(selectedSize);
    const isOutOfStock = isSelectionComplete && !matchedVariant;

    const handleConfirm = () => {
        if (!matchedVariant) {
            return;
        }
        onConfirm(matchedVariant.variantId, matchedVariant.color, matchedVariant.size, matchedVariant.price, quantity);
    };

    // Hàm render giá thông minh
    const renderPrice = () => {
        if (matchedVariant) {
            return <span className="price-text">{matchedVariant.price.toLocaleString()} ₫</span>;
        }
        if (isOutOfStock) {
            return <span className="price-text out-of-stock">Hết hàng</span>;
        }
        // Chưa chọn xong thì hiện giá gốc (hoặc khoảng giá nếu muốn)
        return <span className="price-text">{product.price?.toLocaleString()} ₫</span>;
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
                            {matchedVariant ? `Kho: Sẵn hàng` : (isOutOfStock ? 'Sản phẩm tạm hết' : 'Vui lòng chọn phân loại')}
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

                    {/* SỐ LƯỢNG (Đã sửa lại cấu trúc HTML để CSS đẹp hơn) */}
                    <div className="option-group quantity-group">
                        <label>Số lượng</label>
                        <div className="qty-wrapper">
                            <button 
                                className="qty-btn minus" 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={isOutOfStock}
                            >
                                <svg width="10" height="2" viewBox="0 0 10 2" fill="none"><rect width="10" height="2" fill="currentColor"/></svg>
                            </button>
                            
                            <input 
                                type="number" 
                                className="qty-input" 
                                value={quantity} 
                                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                                disabled={isOutOfStock}
                            />
                            
                            <button 
                                className="qty-btn plus" 
                                onClick={() => setQuantity(quantity + 1)}
                                disabled={isOutOfStock}
                            >
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M4 10V6H0V4H4V0H6V4H10V6H6V10H4Z" fill="currentColor"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <button 
                    className={`btn-confirm-add ${isOutOfStock ? 'disabled' : ''}`}
                    disabled={!matchedVariant}
                    onClick={handleConfirm}
                >
                    {isOutOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}
                </button>
            </div>
        </div>
    );
};