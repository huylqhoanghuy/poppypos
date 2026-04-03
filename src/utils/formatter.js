export const formatMoney = (val) => {
    if (!val) return '0';
    const n = Number(val);
    if (n === 0) return '0';
    
    // Đảm bảo không bao giờ hiện số thập phân phẩy phẩy (.000) gây hiểu nhầm thành tiền Tỷ
    return Math.round(n).toLocaleString('vi-VN', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    });
};
