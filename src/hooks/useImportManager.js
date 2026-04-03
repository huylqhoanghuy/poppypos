import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { parseCSVToOrders } from '../utils/csvParser';

export const useImportManager = () => {
    const { state, dispatch } = useData();

    const [importConfig, setImportConfig] = useState({ channelId: '', content: '', fileName: '', accountId: '' });
    const [previewOrders, setPreviewOrders] = useState(null);

    const importableChannels = state.salesChannels?.filter(ch => ch.allowImport === true || ch.allowImport === 'true') || [];

    const handlePreviewCSV = (showToast) => {
        if (!importConfig.channelId) return showToast('Vui lòng chọn Kênh Bán Hàng!', 'error');
        if (!importConfig.content) return showToast("Vui lòng nhập hoặc file CSV dữ liệu báo cáo!", 'error');
        
        const matchedChannel = state.salesChannels.find(c => c.id === importConfig.channelId);
        if (!matchedChannel) return showToast('Lỗi: Kênh không khả dụng!', 'error');

        const parsedArray = parseCSVToOrders(importConfig.content, matchedChannel, state.products, importConfig.accountId);
        if (!parsedArray || parsedArray.length === 0) {
            return showToast('Không tìm thấy dữ liệu hợp lệ trong file!', 'error');
        }
        
        setPreviewOrders(parsedArray);
    };

    const confirmImport = (showToast, syncToCloud) => {
        if (!previewOrders) return;
        
        const totalOrders = previewOrders.length;
        const totalNet = previewOrders.reduce((sum, o) => sum + o.netAmount, 0);
        
        const topProducts = {};
        previewOrders.forEach(o => o.items.forEach(i => {
             const name = i.product?.name || 'Sản phẩm khác';
             topProducts[name] = (topProducts[name] || 0) + i.quantity;
        }));
        
        const topEntries = Object.entries(topProducts).sort((a,b) => b[1] - a[1]);
        const displayProducts = topEntries.slice(0, 2).map(([k,v]) => `${v} ${k}`).join(', ');
        const moreCount = topEntries.length > 2 ? ` và ${topEntries.length - 2} món khác` : '';

        // Fake react component render string for toast
        const summaryNode = `Ghi nhận ${totalOrders} đơn mới. Doanh thu: ${totalNet.toLocaleString('vi-VN')} đ. Kho giảm: ${displayProducts}${moreCount}`;

        dispatch({ 
            type: 'CONFIRM_IMPORT_ORDERS', 
            payload: { orders: previewOrders } 
        });
        
        setPreviewOrders(null);
        setImportConfig({ channelId: '', content: '', fileName: '', accountId: '' });
        
        setTimeout(() => {
            showToast(summaryNode, 'success');
            if (syncToCloud) syncToCloud();
        }, 500);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          setImportConfig({ ...importConfig, content: event.target.result, fileName: file.name });
        };
        reader.readAsText(file);
    };

    return {
        state,
        importConfig, setImportConfig,
        previewOrders, setPreviewOrders,
        importableChannels,
        handlePreviewCSV,
        confirmImport,
        handleFileUpload
    };
};
