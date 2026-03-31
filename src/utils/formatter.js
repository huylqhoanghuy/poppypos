export const formatMoney = (val) => {
    if (!val) return '0';
    const n = Number(val);
    if (n === 0) return '0';
    
    // Làm tròn đến hàng nghìn (ví dụ: 125,450 -> 125,000)
    const rounded = Math.round(n / 1000) * 1000;
    
    return rounded.toLocaleString('vi-VN');
};
