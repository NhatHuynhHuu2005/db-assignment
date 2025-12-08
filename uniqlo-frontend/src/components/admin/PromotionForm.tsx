import React, { useState, useEffect } from 'react';
import { createPromotion, updatePromotion, type PromotionDetail, type PromotionPayload } from '../../api/api';
import '../../styles/Components.scss'; // Dùng lại style form chung

interface Props {
    initial?: PromotionDetail | null;
    onSuccess: () => void;
    onCancel: () => void;
    currentUserId: number;
}

export const PromotionForm: React.FC<Props> = ({ initial, onSuccess, onCancel, currentUserId }) => {
    const [name, setName] = useState('');
    const [voucherCode, setVoucherCode] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Quản lý Rule (Mặc định 1 rule cho đơn giản)
    const [ruleType, setRuleType] = useState<'Percentage' | 'FixedAmount' | 'Buy1Get1'>('Percentage');
    const [rewardValue, setRewardValue] = useState<number>(0);

    const [submitting, setSubmitting] = useState(false);

    // Load dữ liệu khi sửa
    useEffect(() => {
        if (initial) {
            setName(initial.name);
            // Nếu có mã thì điền vào, không thì để rỗng
            setVoucherCode(initial.voucherCode || ''); 
                        // Format date về YYYY-MM-DDTHH:mm để hiển thị trong input datetime-local
            setStartDate(new Date(initial.startDate).toISOString().slice(0, 16));
            setEndDate(new Date(initial.endDate).toISOString().slice(0, 16));
            
            if (initial.rules && initial.rules.length > 0) {
                setRuleType(initial.rules[0].ruleType);
                setRewardValue(initial.rules[0].rewardValue);
            }
        }
    }, [initial]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload: PromotionPayload = {
            name,
            voucherCode: voucherCode.trim() === '' ? undefined : voucherCode.trim().toUpperCase(),
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            employeeId: currentUserId,
            rules: [
                { type: ruleType, value: ruleType === 'Buy1Get1' ? 0 : Number(rewardValue) }
            ]
        };

        try {
            if (initial) {
                await updatePromotion(initial.id, payload);
            } else {
                await createPromotion(payload);
            }
            alert(initial ? 'Cập nhật thành công!' : 'Tạo khuyến mãi thành công!');
            onSuccess();
        } catch (error: any) {
            alert('Lỗi: ' + (error.response?.data?.error || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '25px', color: '#111', fontWeight: 800, fontSize: '1.5rem', textAlign: 'center' }}>
                {initial ? '✏️ Cập nhật Khuyến Mãi' : '✨ Tạo Khuyến Mãi Mới'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Tên chương trình */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Tên chương trình <span style={{color:'red'}}>*</span></label>
                    <input 
                        className="form-control" 
                        required 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Ví dụ: Siêu Sale 11/11, Xả kho..."
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>
                {/* --- Ô NHẬP MÃ VOUCHER --- */}
                <div style={{background:'#f0f8ff', padding: 15, borderRadius: 8, border:'1px dashed #0984e3'}}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color:'#0984e3' }}>Mã Voucher (Tùy chọn)</label>
                    <div style={{fontSize:'0.8rem', color:'#666', marginBottom: 5}}>* Để trống nếu muốn giảm giá tự động. Nhập mã nếu muốn khách phải nhập code.</div>
                    <input 
                        className="form-control" 
                        value={voucherCode} 
                        onChange={e => setVoucherCode(e.target.value)} 
                        placeholder="VD: UNIQ2025 (Chữ in hoa)"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #0984e3', textTransform:'uppercase', fontWeight:'bold', letterSpacing: 1 }}
                    />
                </div>

                {/* Thời gian */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Bắt đầu</label>
                        <input 
                            type="datetime-local" 
                            className="form-control" 
                            required 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Kết thúc</label>
                        <input 
                            type="datetime-local" 
                            className="form-control" 
                            required 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                    </div>
                </div>

                {/* Cấu hình giảm giá */}
                <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px dashed #ccc' }}>
                    <label style={{ display: 'block', marginBottom: '15px', fontWeight: 700, color: '#e00000' }}>Cấu hình giảm giá</label>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input type="radio" name="ruleType" checked={ruleType === 'Percentage'} onChange={() => setRuleType('Percentage')} />
                            Giảm theo %
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input type="radio" name="ruleType" checked={ruleType === 'FixedAmount'} onChange={() => setRuleType('FixedAmount')} />
                            Giảm tiền mặt
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input type="radio" name="ruleType" checked={ruleType === 'Buy1Get1'} onChange={() => setRuleType('Buy1Get1')} />
                            Mua 1 Tặng 1
                        </label>
                    </div>

                    {ruleType !== 'Buy1Get1' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>
                                {ruleType === 'Percentage' ? 'Nhập số % giảm (vd: 10)' : 'Nhập số tiền giảm (vd: 50000)'}
                            </label>
                            <input 
                                type="number" 
                                min="0"
                                value={rewardValue}
                                onChange={e => setRewardValue(Number(e.target.value))}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontWeight: 'bold' }}
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button 
                        type="submit" 
                        disabled={submitting}
                        style={{ flex: 1, background: '#e00000', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        {submitting ? 'Đang lưu...' : 'Lưu Chương Trình'}
                    </button>
                    <button 
                        type="button" 
                        onClick={onCancel}
                        style={{ background: '#eee', color: '#333', padding: '12px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
};