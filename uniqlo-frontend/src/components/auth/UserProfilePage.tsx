// src/components/auth/UserProfilePage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserInfo } from '../../api/api';
import '../../styles/layout.scss'; // Đảm bảo import style

interface Props {
    user: UserInfo;
}

export const UserProfilePage: React.FC<Props> = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div className="profile-page-container">
            <div className="profile-card">
                {/* Header: Avatar + Tên + Rank */}
                <div className="profile-header">
                    <div className="avatar-section">
                        <div className="avatar-circle">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-identity">
                            <h2 className="user-name">{user.name}</h2>
                            <span className="user-badge">{user.memberTier || 'New Member'}</span>
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
                        <h3 className="section-title">Thông tin cá nhân</h3>
                        
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Email</label>
                                <p>{user.email}</p>
                            </div>
                            <div className="info-item">
                                <label>Số điện thoại</label>
                                <p>{user.phone || 'Chưa cập nhật'}</p>
                            </div>
                            <div className="info-item">
                                <label>Ngày sinh</label>
                                <p>{user.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                            </div>
                            <div className="info-item full-width">
                                <label>Địa chỉ</label>
                                <p>{user.address || 'Chưa cập nhật'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Thống kê ví tiền/Rank */}
                    <div className="stats-section">
                        <h3 className="section-title">Thống kê mua sắm</h3>
                        <div className="stats-card">
                            <div className="stats-icon">💰</div>
                            <div className="stats-info">
                                <label>Tổng chi tiêu tích lũy</label>
                                <div className="stats-value">{user.totalSpent?.toLocaleString()} ₫</div>
                            </div>
                        </div>
                        
                        <div className="stats-card mt-3">
                             <div className="stats-icon">👑</div>
                             <div className="stats-info">
                                <label>Hạng thành viên</label>
                                <div className="stats-value" style={{color: '#333'}}>{user.memberTier || 'Member'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};