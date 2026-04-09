// --- Fuzzy Matcher (5% Error Tolerance) ---
export const inferItemsFromPrice = (targetPrice, products) => {
    if (!targetPrice || targetPrice <= 0 || !products || products.length === 0) return null;
    
    // Dung sai 5% giá trị
    const isMatch = (price1, price2) => Math.abs(price1 - price2) <= Math.max(price1, price2) * 0.05;

    // 1. Direct Match (Tìm món gần nhất trong phạm vi 5%)
    let bestSingleMatch = null;
    let minSingleDiff = Infinity;
    for (const p of products) {
       if (p.price > 0 && isMatch(p.price, targetPrice)) {
           const diff = Math.abs(p.price - targetPrice);
           if (diff < minSingleDiff) {
               minSingleDiff = diff;
               bestSingleMatch = p;
           }
       }
    }
    if (bestSingleMatch) return [{ product: bestSingleMatch, quantity: 1, itemTotal: targetPrice }];

    // 2. Multiple of same item (VD: 2 cái Chân Gà)
    let bestMultiMatch = null;
    let minMultiDiff = Infinity;
    for (let p of products) {
        if (p.price > 0) {
            const estimatedQty = Math.round(targetPrice / p.price);
            if (estimatedQty > 1 && estimatedQty <= 6) {
                const comboPrice = p.price * estimatedQty;
                if (isMatch(comboPrice, targetPrice)) {
                    const diff = Math.abs(comboPrice - targetPrice);
                    if (diff < minMultiDiff) {
                        minMultiDiff = diff;
                        bestMultiMatch = { p, qty: estimatedQty };
                    }
                }
            }
        }
    }
    if (bestMultiMatch) return [{ product: bestMultiMatch.p, quantity: bestMultiMatch.qty, itemTotal: targetPrice }];

    // 3. Two-item combo (VD: Gà + Chân Gà)
    let bestComboMatch = null;
    let minComboDiff = Infinity;
    for (let i = 0; i < products.length; i++) {
        for (let j = i; j < products.length; j++) {
            const comboPrice = products[i].price + products[j].price;
            if (isMatch(comboPrice, targetPrice)) {
                 const diff = Math.abs(comboPrice - targetPrice);
                 if (diff < minComboDiff) {
                     minComboDiff = diff;
                     bestComboMatch = [products[i], products[j]];
                 }
            }
        }
    }
    if (bestComboMatch) {
        if (bestComboMatch[0].id === bestComboMatch[1].id) {
             return [{ product: bestComboMatch[0], quantity: 2, itemTotal: targetPrice }];
        }
        const ratio1 = bestComboMatch[0].price / (bestComboMatch[0].price + bestComboMatch[1].price);
        return [
            { product: bestComboMatch[0], quantity: 1, itemTotal: targetPrice * ratio1 },
            { product: bestComboMatch[1], quantity: 1, itemTotal: targetPrice * (1 - ratio1) }
        ];
    }
    return null; 
};

export const splitCSVLine = (line, sep) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === sep && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
};

// --- Universal CSV/TSV Parser ---
export const parseCSVToOrders = (rawData, channelObj, productsList, targetAccountId) => {
    const exactChannelName = channelObj ? channelObj.name : 'Unknown Channel';
    let tempOrdersMap = {}; 
    const timestamp = new Date().getTime();

    try {
      const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
         const firstLine = lines[0] || '';
         const separator = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : (firstLine.includes(',') ? ',' : '|'));
         
         const headers = splitCSVLine(firstLine, separator).map(h => h.replace(/["\uFFFD\uFFFE\uFFFF]/g, '').toLowerCase());
         
         const findIdx = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));

         let orderIdIdx = findIdx(['mã đơn hàng ngắn', 'm __n hng']); // Ưu tiên tuyệt đối mã ngắn của Grab
         if (orderIdIdx === -1) orderIdIdx = findIdx(['mã đơn', 'order id', 'mã tham chiếu', 'id đơn', 'shopee', 'm __n']);
         
         let nameIdx = findIdx(['tên món', 'sản phẩm', 'product', 'tên hàng', 'hàng hóa', 'món', 'tn s_n ph_m', 'tn']);
         let qtyIdx = findIdx(['số lượng', 'qty', 's_ l__ng', 'số lg']);
         let grossIdx = findIdx(['giá trị', 'doanh thu ròng', 'số tiền', 'doanh thu', 'tổng tiền', 'gross', 'doanh số', 'tiền món', 'đơn giá', 'thnh ti_n doanh thu']);
         let netIdx = findIdx(['tổng cộng', 'thực thu', 'net', 'thu về', 'tiền nhận về', 'tiền thu', 'phải thu']);
         let dateIdx = findIdx(['thời gian hoàn thành', 'ngày tạo', 'ngày', 'thời gian', 'date', 'hoàn thành', 'ngy hon t_t', 'ngy __t']);
         
         // Các cột phí sàn phụ (ShopeeFood không có Thực thu mà chỉ có phí)
         let feeIdx = findIdx(['phí dịch vụ', 'giá trị phí']);
         let taxIdx = findIdx(['thuế khấu trừ', 'thuế']);
         let deductionIdx = findIdx(['số tiền giảm', 'giảm trực tiếp']);

         if (orderIdIdx === -1) orderIdIdx = 0;

         for (let i = 1; i < lines.length; i++) {
            const parts = splitCSVLine(lines[i], separator).map(p => p.replace(/"/g, ''));
            if (parts.length < 2) continue; 

            let baseOrderId = parts[orderIdIdx] || `IMP-${timestamp}-${i}`;
            
            // Rút gọn Mã Đơn: Tiền tố + (Tối đa 6 ký tự cuối)
            let orderId = baseOrderId;
            let shortId = baseOrderId;
            if (baseOrderId.length > 8) shortId = baseOrderId.slice(-6);

            if (exactChannelName.toLowerCase().includes('grab')) {
               orderId = shortId.startsWith('GF') ? shortId : `GF-${shortId}`;
            } else if (exactChannelName.toLowerCase().includes('shopee') || exactChannelName.toLowerCase().includes('shopeefood')) {
               orderId = shortId.startsWith('SF') ? shortId : `SF-${shortId}`;
            }

            const rawName = nameIdx !== -1 && parts[nameIdx] ? parts[nameIdx].trim() : '';

            const nLower = rawName.toLowerCase();
            if (nLower.includes('xóm gà ủ muối') || nLower.includes('xm g') || nLower === 'đơn hàng shopeefood' || nLower.includes('tổng cộng') || nLower.includes('thành tiền') || nLower.includes('tổng đơn') || nLower.includes('thnh ti_n')) {
                continue; 
            }
            
            const qtyStr = qtyIdx !== -1 ? parts[qtyIdx] : '1';
            const grossStr = grossIdx !== -1 ? parts[grossIdx] : '0';
            
            if (qtyIdx !== -1 && !/\d/.test(qtyStr) && !/\d/.test(grossStr)) {
                continue;
            }

            const quantity = parseFloat(qtyStr.replace(/[^\d.-]/g, '')) || 1;
            const grossValue = parseFloat(grossStr.replace(/[^\d.-]/g, '')) || 0;
            
            let currentItemNet = 0;
            if (netIdx !== -1) {
                const netStr = parts[netIdx] ? parts[netIdx] : '0';
                currentItemNet = parseFloat(netStr.replace(/[^\d.-]/g, '')) || 0;
            }
            
            // Các phí báo cáo từ ShopeeFood (Thực tế Shopee chép đè tổng Phí của cả Đơn lên Từng Dòng Sản Phẩm)
            const feeAmount = feeIdx !== -1 ? (parseFloat(parts[feeIdx]?.replace(/[^\d.-]/g, '')) || 0) : 0;
            const taxAmount = taxIdx !== -1 ? (parseFloat(parts[taxIdx]?.replace(/[^\d.-]/g, '')) || 0) : 0;
            const manualDeductions = deductionIdx !== -1 ? (parseFloat(parts[deductionIdx]?.replace(/[^\d.-]/g, '')) || 0) : 0;
            
            let dateStr = dateIdx !== -1 ? parts[dateIdx] : '';
            if (dateStr) {
                const vnDateMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
                if (vnDateMatch) {
                    const [_, d, m, y, h, min, s] = vnDateMatch;
                    dateStr = new Date(`${y}-${m}-${d}T${h}:${min}:${s}+07:00`).toISOString();
                } else {
                    const parsedTs = Date.parse(dateStr);
                    dateStr = !isNaN(parsedTs) ? new Date(parsedTs).toISOString() : new Date().toISOString();
                }
            } else {
                dateStr = new Date().toISOString();
            }

            let parsedItems = [];
            let isFuzzy = false;
            let matchedProductByName = null;

            if (rawName && rawName.length > 1) {
                 const lowerVal = rawName.toLowerCase();
                 // 1. Khớp tên chuẩn 100%
                 matchedProductByName = productsList.find(p => p.name.toLowerCase() === lowerVal);
                 // 2. Khớp chuỗi con (Ví dụ: "Gà Ủ Muối Khay Ngửa 1.5kg" chứa "Gà Ủ Muối Khay Ngửa")
                 // Lưu ý: Lấy thằng có tên dài nhất để tránh khớp nhầm chữ "Gà" chung chung
                 if (!matchedProductByName) {
                     const potentialMatches = productsList.filter(p => lowerVal.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lowerVal));
                     if (potentialMatches.length > 0) {
                         matchedProductByName = potentialMatches.sort((a,b) => b.name.length - a.name.length)[0];
                     }
                 }
            }

            if (matchedProductByName) {
                // Tên (Grab/Shopee) khớp chuẩn với Menu => Lấy công thức trừ kho
                parsedItems.push({
                    product: { ...matchedProductByName, price: quantity > 0 ? (grossValue / quantity) : grossValue },
                    quantity: quantity,
                    itemTotal: grossValue,
                    netTotal: netIdx !== -1 ? currentItemNet : grossValue
                });
            } else {
                // Tên (Grab/Shopee) là mớ hỗn độn (Combo A, Trà Chanh) KHÔNG khớp menu HOẶC ẩn tên => Nội suy từ Giá Vốn
                const guessedItems = inferItemsFromPrice(grossValue, productsList);
                if (guessedItems) {
                    parsedItems = guessedItems.map(item => ({
                        ...item,
                        netTotal: netIdx !== -1 ? currentItemNet : item.itemTotal
                    }));
                    isFuzzy = true; // Flage this to warn the user 
                } else {
                    // Hết đường cứu, đành ném tên rác
                    const finalName = rawName || `Món giá ${grossValue.toLocaleString()}đ (Từ kênh: ${exactChannelName})`;
                    parsedItems.push({
                        product: { name: finalName, price: grossValue, recipe: [] },
                        quantity: quantity || 1,
                        itemTotal: grossValue,
                        netTotal: netIdx !== -1 ? currentItemNet : grossValue
                    });
                    isFuzzy = true;
                }
            }

            let customerStr = `Khách ${exactChannelName}`;
            if (exactChannelName.toLowerCase().includes('grab')) customerStr = 'Khách Grab';
            if (exactChannelName.toLowerCase().includes('shopee')) customerStr = 'Khách Shopee';

            if (!tempOrdersMap[orderId]) {
                tempOrdersMap[orderId] = {
                    id: orderId,
                    orderCode: orderId,
                    customerName: customerStr,
                    customerPhone: '',
                    date: dateStr,
                    channelName: exactChannelName,
                    items: [],
                    totalAmount: 0,
                    netAmount: 0,
                    status: 'Success',
                    paymentStatus: 'Paid',
                    paymentMethod: 'Imported',
                    accountId: targetAccountId || (exactChannelName.toLowerCase().includes('shopee') ? 'ACC3' : (exactChannelName.toLowerCase().includes('grab') ? 'ACC4' : 'ACC1')),
                    isFuzzyRecognized: isFuzzy,
                    _hasNetColumn: netIdx !== -1,
                    _duplicatedOrderFees: feeAmount + taxAmount + manualDeductions // Ghi nhận Tổng phí của cả đơn (do bị lặp lại nên lấy giá trị dòng nào cũng được)
                };
            }
            
            parsedItems.forEach(item => tempOrdersMap[orderId].items.push(item));
            tempOrdersMap[orderId].totalAmount += grossValue;
            
            if (netIdx !== -1) {
                tempOrdersMap[orderId].netAmount += currentItemNet; // Cộng dồn net nếu có chỉ số trên từng item
            }
         }
      }
      
      // Xử lý Hậu kỳ: Tính tiền Thực Thu cho các Đơn không thu được cột Net (Như ShopeeFood)
      Object.values(tempOrdersMap).forEach(order => {
          if (!order._hasNetColumn) {
              if (order._duplicatedOrderFees > 0) {
                  // Lấy Tổng Gross trừ đi Tổng Fees của nguyên đơn đó (ko bị nhân bội lần theo dòng)
                  order.netAmount = order.totalAmount - order._duplicatedOrderFees;
                  // Tỷ lệ hóa chi phí xuống từng item (Chặt chẽ kế toán theo món)
                  order.items.forEach(item => {
                      const ratio = order.totalAmount > 0 ? (item.itemTotal / order.totalAmount) : 0;
                      const itemFee = order._duplicatedOrderFees * ratio;
                      item.netTotal = item.itemTotal - itemFee;
                  });
              } else if (channelObj && (channelObj.commission || channelObj.discountRate)) {
                  // Cứu cánh cuối cùng: Tự tính % tỷ lệ CK 
                  const rate = parseFloat(channelObj.commission || channelObj.discountRate || 0);
                  order.netAmount = order.totalAmount * (100 - rate) / 100;
                  order.items.forEach(item => {
                      item.netTotal = item.itemTotal * (100 - rate) / 100;
                  });
              } else {
                  order.netAmount = order.totalAmount;
                  order.items.forEach(item => { item.netTotal = item.itemTotal; });
              }
          }
      });

      return Object.values(tempOrdersMap).sort((a,b) => new Date(b.date) - new Date(a.date));

    } catch (err) {
      console.error("[Parser] Error parsing TSV/CSV:", err);
      return [];
    }
};
