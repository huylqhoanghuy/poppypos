import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { splitCSVLine } from '../utils/csvParser';

const CSVViewerModal = ({ isOpen, onClose }) => {
    const [csvData, setCsvData] = useState({ headers: [], rows: [] });
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const text = evt.target.result;
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    setError('File trống hoặc không đúng định dạng. Cần ít nhất 2 dòng (header và data).');
                    return;
                }

                const firstLine = lines[0];
                const separator = firstLine.includes('\t') ? '\t' : ',';
                const headers = splitCSVLine(firstLine, separator).map(h => h.replace(/"/g, '').trim());

                const rows = [];
                for (let i = 1; i < lines.length; i++) {
                    const rowData = splitCSVLine(lines[i], separator).map(r => r.replace(/"/g, '').trim());
                    rows.push(rowData);
                }

                setCsvData({ headers, rows });
            } catch (err) {
                console.error(err);
                setError('Xảy ra lỗi khi đọc file!');
            }
        };

        reader.onerror = () => {
            setError('Không thể đọc file. Vui lòng thử lại.');
        };

        reader.readAsText(file);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
        }}>
            <div style={{
                background: 'var(--surface-color)',
                borderRadius: '16px',
                width: '100%', maxWidth: '1200px', height: '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileSpreadsheet size={22} color="var(--primary)" />
                        Công Cụ Đọc Dữ Liệu Import (Grab/Shopee)
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-color)' }}>
                    <button 
                        className="btn btn-primary"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Upload size={18} /> Chọn File CSV / TSV
                    </button>
                    <input 
                        type="file" 
                        accept=".csv, .tsv, .txt" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange} 
                    />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        *(Công cụ này chỉ dùng để Xem Cấu Trúc File, không ghi dữ liệu vào hệ thống)*
                    </span>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '0', background: 'var(--bg-color)' }}>
                    {error && (
                        <div style={{ margin: '20px', padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                            <AlertTriangle size={20} /> {error}
                        </div>
                    )}
                    
                    {!error && csvData.headers.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '12px' }}>
                            <FileSpreadsheet size={48} opacity={0.2} />
                            <p style={{ margin: 0, fontWeight: 600 }}>Vui lòng chọn 1 file báo cáo từ Grab/Shopee để xem cấu trúc Cột.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    {csvData.headers.map((h, i) => (
                                        <th key={i} style={{ 
                                            background: '#f8fafc', padding: '12px', textAlign: 'left', 
                                            borderBottom: '2px solid var(--surface-border)', borderRight: '1px solid var(--surface-border)',
                                            color: '#334155', fontWeight: 700, whiteSpace: 'nowrap'
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {csvData.rows.map((row, rIdx) => (
                                    <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                        {csvData.headers.map((_, cIdx) => (
                                            <td key={cIdx} style={{ 
                                                padding: '10px 12px', borderBottom: '1px solid var(--surface-border)', 
                                                borderRight: '1px solid var(--surface-border)', color: 'var(--text-primary)',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {row[cIdx] || ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CSVViewerModal;
