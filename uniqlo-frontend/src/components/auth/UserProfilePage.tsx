import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type UserInfo, updateUserProfile, fetchUserProfile } from '../../api/api'; 
import '../../styles/layout.scss';

interface Props {
    user: UserInfo;
}

export const UserProfilePage: React.FC<Props> = ({ user: initialUser }) => {
    const navigate = useNavigate();
    
    // State quản lý user hiển thị (cập nhật lại sau khi save)
    const [currentUser, setCurrentUser] = useState<UserInfo>(initialUser);
    
    // State quản lý chế độ Sửa
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // State form dữ liệu
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        dob: '',
        street: '',
        ward: '',
        district: '',
        city: ''
    });
    
    useEffect(() => {
        if (isEditing) {
            // Tách ngày sinh YYYY-MM-DD để đưa vào input type="date"
            let formattedDob = '';
            if (currentUser.dob) {
                const date = new Date(currentUser.dob);
                formattedDob = date.toISOString().split('T')[0];
            }
            
            setFormData({
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                dob: formattedDob,
                street: '',
                ward: '',
                district: '',
                city: ''
            });
        }
    }, [isEditing, currentUser]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUserProfile({
                userId: currentUser.id,
                email: formData.email,
                phone: formData.phone,
                dob: formData.dob,
                street: formData.street,
                ward: formData.ward,
                district: formData.district,
                city: formData.city
            });

            // Sau khi update xong, gọi lại API lấy thông tin mới nhất để hiển thị
            const updatedUser = await fetchUserProfile(currentUser.id);
            setCurrentUser(updatedUser);
            
            // Cập nhật cả LocalStorage để F5 không mất
            localStorage.setItem('uniqlo_user', JSON.stringify(updatedUser));
            
            alert('Cập nhật thành công!');
            setIsEditing(false);
        } catch (error: any) {
            alert('Lỗi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page-container">
            <div className="profile-card">
                {/* Header */}
                <div className="profile-header">
                    <div className="avatar-section">
                        <div className="avatar-circle">
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-identity">
                            <h2 className="user-name">{currentUser.name}</h2>
                            <span className="user-badge">{currentUser.memberTier || 'New Member'}</span>
                        </div>
                    </div>
                    
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        ← Quay lại
                    </button>
                </div>

                <hr className="divider" />

                <div className="profile-body">
                    {/* Cột trái: Thông tin cá nhân */}
                    <div className="info-section">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
                            <h3 className="section-title" style={{margin:0}}>Thông tin cá nhân</h3>
                            {!isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    style={{background:'none', border:'none', color:'#e00000', cursor:'pointer', fontWeight:'bold', textDecoration:''}}
                                >
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>
                        
                        {/* --- VIEW MODE (Chỉ xem) --- */}
                        {!isEditing ? (
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Email</label>
                                    <p>{currentUser.email}</p>
                                </div>
                                <div className="info-item">
                                    <label>Số điện thoại</label>
                                    <p>{currentUser.phone || 'Chưa cập nhật'}</p>
                                </div>
                                <div className="info-item">
                                    <label>Ngày sinh</label>
                                    <p>{currentUser.dob ? new Date(currentUser.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                                </div>
                                <div className="info-item full-width">
                                    <label>Địa chỉ</label>
                                    <p>{currentUser.address || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                        ) : (
                        /* --- EDIT MODE (Form nhập liệu) --- */
                            <div className="edit-form-grid" style={{display:'grid', gap: 15}}>
                                <div>
                                    <label style={{display:'block', marginBottom: 5, fontSize:'0.9rem', color:'#666'}}>Email</label>
                                    <input 
                                        className="form-input" 
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label style={{display:'block', marginBottom: 5, fontSize:'0.9rem', color:'#666'}}>Số điện thoại</label>
                                    <input 
                                        className="form-input" 
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label style={{display:'block', marginBottom: 5, fontSize:'0.9rem', color:'#666'}}>Ngày sinh</label>
                                    <input 
                                        type="date"
                                        className="form-input" 
                                        value={formData.dob}
                                        onChange={e => setFormData({...formData, dob: e.target.value})}
                                    />
                                </div>
                                
                                {/* Phần địa chỉ chi tiết để lưu vào DB cho chuẩn */}
                                <div style={{gridColumn: 'span 2', background: '#f9f9f9', padding: 10, borderRadius: 8}}>
                                    <div style={{marginBottom: 10, fontWeight:'bold', fontSize:'0.9rem'}}>Cập nhật địa chỉ:</div>
                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10}}>
                                        <input placeholder="Số nhà, đường..." className="form-input" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                                        <input placeholder="Phường/Xã" className="form-input" value={formData.ward} onChange={e => setFormData({...formData, ward: e.target.value})} />
                                        <input placeholder="Quận/Huyện" className="form-input" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
                                        <input placeholder="Tỉnh/Thành phố" className="form-input" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                                    </div>
                                    <div style={{fontSize:'0.8rem', color:'#888', marginTop: 5}}>* Nhập đầy đủ để cập nhật địa chỉ mới</div>
                                </div>

                                <div style={{gridColumn: 'span 2', display:'flex', gap: 10, marginTop: 10}}>
                                    <button 
                                        onClick={handleSave} 
                                        disabled={loading}
                                        style={{background:'#e00000', color:'white', padding:'8px 20px', border:'none', borderRadius: 4, cursor:'pointer', fontWeight:'bold'}}
                                    >
                                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        style={{background:'#eee', color:'#333', padding:'8px 20px', border:'none', borderRadius: 4, cursor:'pointer'}}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cột phải: Thống kê (Giữ nguyên) */}
                    <div className="stats-section">
                        <h3 className="section-title">Thống kê mua sắm</h3>
                        <div className="stats-card">
                            <div className="stats-icon">💰</div>
                            <div className="stats-info">
                                <label>Tổng chi tiêu tích lũy</label>
                                <div className="stats-value">{currentUser.totalSpent?.toLocaleString()} ₫</div>
                            </div>
                        </div>
                        
                        <div className="stats-card mt-3">
                             <div className="stats-icon">👑</div>
                             <div className="stats-info">
                                <label>Hạng thành viên</label>
                                <div className="stats-value" style={{color: '#333'}}>{currentUser.memberTier || 'Member'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};