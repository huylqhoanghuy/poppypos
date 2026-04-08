import React from 'react';
import ActivityLogsUI from '../components/ActivityLogsUI';
import { useAuth } from '../context/AuthContext';

const ActivityLogs = () => {
    const { user } = useAuth();
    
    // Bảo vệ trang: Chỉ ADMIN mới được xem lịch sử hệ thống
    if (user?.role !== 'ADMIN') {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626', background: 'white', borderRadius: '12px', marginTop: '20px' }}>
                <h2>TRUY CẬP BỊ TỪ CHỐI</h2>
                <p>Bạn không có thẩm quyền truy cập vào Nhật ký hệ thống.</p>
            </div>
        );
    }

    return <ActivityLogsUI />;
};

export default ActivityLogs;
