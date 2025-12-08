import React, { useEffect, useState } from 'react';
import { fetchPromotions, deletePromotion, fetchPromotionById, type Promotion, type PromotionDetail } from '../../api/api';
import { DataTable, type Column } from '../common/DataTable';
import { PromotionForm } from './PromotionForm';
import '../../styles/Components.scss'; // Dùng lại style của hệ thống

export const PromotionManager: React.FC = () => {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // State quản lý Form
    const [showForm, setShowForm] = useState(false);
    const [editingPromo, setEditingPromo] = useState<PromotionDetail | null>(null);

    // Lấy UserID từ localStorage (để biết ai tạo)
    const userJson = localStorage.getItem('uniqlo_user');
    const currentUser = userJson ? JSON.parse(userJson) : { id: 1 };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchPromotions(search);
            setPromotions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- CÁC HÀM XỬ LÝ ---
    const handleAdd = () => {
        setEditingPromo(null);
        setShowForm(true);
    };

    const handleEdit = async (promoId: number) => {
        try {
            // Gọi API lấy chi tiết đầy đủ (kèm rules) để fill vào form
            const detail = await fetchPromotionById(promoId);
            setEditingPromo(detail);
            setShowForm(true);
        } catch (error) {
            alert('Lỗi tải chi tiết khuyến mãi');
        }
    };

    const handleDelete = async (promoId: number) => {
        if (window.confirm('Bạn có chắc muốn xóa khuyến mãi này? (Các sản phẩm đang áp dụng sẽ mất giảm giá)')) {
            try {
                await deletePromotion(promoId);
                loadData();
            } catch (error) {
                alert('Xóa thất bại');
            }
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingPromo(null);
        loadData(); // Reload lại bảng
    };

    // --- Helper tính trạng thái ---
    const getStatus = (start: string, end: string) => {
        const now = new Date();
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (now < startDate) return { label: 'Sắp diễn ra', color: '#0984e3', bg: '#e3f2fd' }; // Xanh dương
        if (now > endDate) return { label: 'Đã kết thúc', color: '#636e72', bg: '#dfe6e9' }; // Xám
        return { label: 'Đang chạy', color: '#00b894', bg: '#dff9fb' }; // Xanh lá
    };

    // --- Cấu hình cột cho bảng ---
    const columns: Column<Promotion>[] = [
        { key: 'id', header: 'ID', render: r => <span style={{fontWeight:'bold', color:'#888'}}>#{r.id}</span> },
        { key: 'name', header: 'Tên chương trình', render: r => <span style={{fontWeight: 600, color:'#333'}}>{r.name}</span> },
        { 
            key: 'ruleType', header: 'Loại giảm giá', 
            render: r => {
                if(r.ruleType === 'Percentage') return <span style={{color:'#e00000', fontWeight:'bold'}}>Giảm {r.rewardValue}%</span>
                if(r.ruleType === 'FixedAmount') return <span style={{color:'#e00000', fontWeight:'bold'}}>Giảm {r.rewardValue.toLocaleString()}đ</span>
                return <span style={{color:'#d63031', fontWeight:'bold'}}>Mua 1 Tặng 1</span>
            }
        },
        { 
            key: 'startDate', header: 'Thời gian áp dụng', 
            render: r => (
                <div style={{fontSize:'0.85rem', color:'#555'}}>
                    <div>{new Date(r.startDate).toLocaleDateString('vi-VN')}</div>
                    <div style={{fontSize:'0.75rem', color:'#999'}}>đến</div>
                    <div>{new Date(r.endDate).toLocaleDateString('vi-VN')}</div>
                </div>
            )
        },
        {
            key: 'appliedCount', header: 'SP Áp dụng',
            render: r => <span style={{background:'#f1f1f1', padding:'2px 8px', borderRadius: 4}}>{r.appliedCount} SP</span>
        },
        {
            key: 'id', header: 'Trạng thái', // Dùng ID làm key tạm
            render: r => {
                const status = getStatus(r.startDate, r.endDate);
                return (
                    <span style={{
                        background: status.bg, color: status.color,
                        padding: '6px 12px', borderRadius: '20px',
                        fontSize: '0.8rem', fontWeight: 700, whiteSpace:'nowrap'
                    }}>
                        {status.label}
                    </span>
                )
            }
        },
        {
            key: 'id', header: 'Thao tác',
            render: (r) => (
                <div style={{display:'flex', gap: 8}}>
                    <button className="action-btn edit" title="Sửa" onClick={() => handleEdit(r.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button className="action-btn delete" title="Xóa" onClick={() => handleDelete(r.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 50 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <h2 style={{ fontSize: '1.8rem', color: '#333', margin: 0, fontWeight: 800 }}>
                    🎟️ Quản lý Khuyến Mãi
                </h2>
                <button className="btn-add-new" onClick={handleAdd}>
                    + Tạo khuyến mãi
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar" style={{ display:'flex', gap: 10, background:'#fff', padding: 15, borderRadius: 12, boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
                <div className="search-wrapper" style={{maxWidth: 400}}>
                    <input 
                        placeholder="Tìm tên chương trình..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadData()}
                    />
                    <button className="btn-search" onClick={loadData}>🔍</button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div style={{textAlign:'center', padding: 40, color:'#999'}}>Đang tải dữ liệu...</div>
            ) : (
                <div className="card" style={{padding:0, overflow:'hidden', border:'none', marginTop: 20}}>
                    <DataTable columns={columns} data={promotions} keyField="id" emptyMessage="Chưa có chương trình khuyến mãi nào." />
                </div>
            )}
            {/* MODAL FORM */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{ width: '100%', maxWidth: '600px', animation: 'fadeIn 0.3s' }}>
                        <PromotionForm 
                            initial={editingPromo} 
                            onSuccess={handleFormSuccess} 
                            onCancel={() => setShowForm(false)}
                            currentUserId={currentUser.id}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}