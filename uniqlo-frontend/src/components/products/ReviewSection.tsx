// FE/src/components/products/ReviewSection.tsx
import React, { useEffect, useState } from 'react';
import { Toast } from '../common/Toast';

interface Review {
    ReviewID: number;
    UserName: string;
    Rating: number;
    Content: string;
    ReviewDate: string;
}

interface ReviewSectionProps {
    productId: number;
    userId?: number;
    isReadOnly?: boolean; 
    onReviewSuccess?: () => void; // Callback khi review xong (để refresh list bên ngoài nếu cần)
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ 
    productId, 
    userId, 
    isReadOnly = false, // Mặc định là cho phép viết
    onReviewSuccess 
}) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    
    // State form
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ msg: string, type: 'success'|'error' } | null>(null);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:5000/api/products/${productId}/reviews`);
            const data = await res.json();
            setReviews(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) fetchReviews();
    }, [productId]);

    const handleSubmit = async () => {
        if (!userId) {
            setToast({ msg: 'Vui lòng đăng nhập!', type: 'error' });
            return;
        }
        if (!content.trim()) {
            setToast({ msg: 'Vui lòng nhập nội dung', type: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, customerId: userId, rating, content })
            });
            
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Lỗi gửi đánh giá');

            setToast({ msg: 'Đánh giá thành công!', type: 'success' });
            setContent('');
            setRating(5);
            fetchReviews();
            if (onReviewSuccess) onReviewSuccess(); // Gọi callback báo ra ngoài
        } catch (err: any) {
            setToast({ msg: err.message, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Helper render sao
    const renderStars = (starCount: number) => (
        <span style={{ color: '#fbbf24' }}>
            {'★'.repeat(starCount)}<span style={{ color: '#e5e7eb' }}>{'★'.repeat(5 - starCount)}</span>
        </span>
    );

    return (
        <div style={{ marginTop: 30, padding: 20, background: '#fff', borderRadius: 8 }}>
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>
                {isReadOnly ? 'Đánh giá từ khách hàng' : 'Viết đánh giá của bạn'}
            </h3>

            {/* LOGIC ẨN/HIỆN FORM: Chỉ hiện khi KHÔNG phải chế độ ReadOnly */}
            {!isReadOnly && userId && (
                <div style={{ marginBottom: 30, padding: 15, background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ marginBottom: 10 }}>
                        <label style={{ marginRight: 10, fontWeight: 600 }}>Bạn chấm mấy sao?</label>
                        {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} onClick={() => setRating(s)} style={{ cursor: 'pointer', fontSize: '1.5rem', color: s <= rating ? '#fbbf24' : '#d1d5db' }}>★</span>
                        ))}
                    </div>
                    <textarea 
                        rows={3} placeholder="Chia sẻ cảm nhận..." value={content} onChange={e => setContent(e.target.value)}
                        style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 10 }}
                    />
                    <button onClick={handleSubmit} disabled={submitting} style={{ background: '#e00000', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>
                        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                </div>
            )}

            <div className="review-list">
                {loading ? <p>Đang tải...</p> : (
                    reviews.length === 0 ? <p style={{color:'#999'}}>Chưa có đánh giá nào.</p> : (
                        reviews.map(r => (
                            <div key={r.ReviewID} style={{ borderBottom: '1px solid #eee', paddingBottom: 15, marginBottom: 15 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontWeight: 600 }}>{r.UserName}</span>
                                    <span style={{ fontSize: '0.85rem', color: '#999' }}>{new Date(r.ReviewDate).toLocaleDateString()}</span>
                                </div>
                                <div style={{ marginBottom: 5 }}>{renderStars(r.Rating)}</div>
                                <div style={{ color: '#4b5563' }}>{r.Content}</div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};