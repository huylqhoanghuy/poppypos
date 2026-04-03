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

export const numberToWords = (number) => {
    if (number === 0 || number === '0') return 'Không đồng';

    const words = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const units = ["", "nghìn", "triệu", "tỷ", "nghìn", "triệu", "tỷ", "nghìn", "triệu", "tỷ"];
    let numStr = Math.round(Math.abs(Number(number))).toString();
    if (isNaN(Number(number))) return '';

    let wordArr = [];
    let groupTokens = [];

    // split to group of 3
    for (let i = numStr.length; i > 0; i -= 3) {
        groupTokens.push(numStr.substring(Math.max(0, i - 3), i));
    }

    const readGroup = (group, isFirst) => {
        let str = '';
        let h = group.length === 3 ? parseInt(group[0]) : -1;
        let t = group.length >= 2 ? parseInt(group[group.length - 2]) : -1;
        let u = parseInt(group[group.length - 1]);

        if (h !== -1) {
            str += words[h] + " trăm ";
            if (t === 0 && u !== 0) str += "lẻ ";
        } else if (!isFirst && groupTokens.length > 1) { // if missing hundred digit but has higher groups
           str += "không trăm ";
           if (t === 0 && u !== 0) str += "lẻ ";
        }

        if (t !== -1 && t !== 0) {
            if (t === 1) str += "mười ";
            else str += words[t] + " mươi ";
        }

        if (u !== 0) {
            if (t !== -1 && t !== 0 && t !== 1 && u === 1) str += "mốt ";
            else if (t !== -1 && t !== 0 && u === 5) str += "lăm ";
            else str += words[u] + " ";
        }
        return str.trim();
    };

    groupTokens.forEach((group, index) => {
        let gNum = parseInt(group);
        if (gNum !== 0) {
            let str = readGroup(group, index === groupTokens.length - 1);
            if (str) {
                wordArr.unshift(units[index] ? str + ' ' + units[index] : str);
            }
        } else if (index !== 0 && index !== groupTokens.length - 1 && parseInt(groupTokens[index - 1]) !== 0) {
            wordArr.unshift("không " + units[index]); // handling edge cases like 1,000,682 -> is simple enough for POS
        }
    });

    let result = wordArr.join(' ').trim() + " đồng";
    if (Number(number) < 0) result = "Âm " + result;
    
    return result.charAt(0).toUpperCase() + result.slice(1).replace(/\s+/g, ' ');
};
