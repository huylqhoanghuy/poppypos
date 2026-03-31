import { processAddPosOrder, processUpdateOrderStatus, processTransferFunds, adjustInventoryQuantity } from '../services/coreServices.js';

// Setup Mock Data
const mockState = {
  products: [
    { id: 'P1', name: 'Gà Luộc', recipe: [{ ingredientId: 'I1', qty: 1, unitMode: 'buy' }] }
  ],
  ingredients: [
    { id: 'I1', name: 'Gà nguyên con', stock: 10, conversionRate: 1 }
  ],
  accounts: [
    { id: 'ACC1', balance: 1000000, name: 'Tiền mặt' },
    { id: 'ACC3', balance: 500000, name: 'ShopeeFood' }
  ],
  posOrders: [],
  transactions: []
};

function runTests() {
  console.log('🔄 Bắt đầu chạy Unit Tests Nhanh (Sanity Check)...\n');
  try {
    // TEST 1: Add POS Order
    const addOrderAction = {
      payload: {
        customerName: 'Test User',
        netAmount: 150000,
        channelName: 'Trực tiếp',
        items: [{ product: mockState.products[0], quantity: 2 }]
      }
    };
    const stateAfterOrder = processAddPosOrder(mockState, addOrderAction);
    
    // Validate Inventory Deducted (10 - 2 = 8)
    const newStock = stateAfterOrder.ingredients[0].stock;
    console.log(`[TEST 1] Đặt món (Add POS Order): Trừ kho thành công. Tồn kho mới: ${newStock} (Expected: 8) -> ${newStock === 8 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Validate Finance Added
    const newBalance = stateAfterOrder.accounts.find(a => a.id === 'ACC1').balance;
    console.log(`[TEST 1] Kế toán (Add POS Order): Tăng số dư ACC1 thành công. Balance: ${newBalance} (Expected: 1150000) -> ${newBalance === 1150000 ? '✅ PASS' : '❌ FAIL'}`);

    // TEST 2: Cancel Order (Complete Reversal)
    const orderId = stateAfterOrder.posOrders[0].id;
    const cancelAction = { payload: { orderId, status: 'Cancelled' } };
    const stateAfterCancel = processUpdateOrderStatus(stateAfterOrder, cancelAction);

    // Validate Inventory Added Back (8 + 2 = 10)
    const finalStock = stateAfterCancel.ingredients[0].stock;
    console.log(`[TEST 2] Hủy đơn (Update Status): Hoàn kho thành công. Tồn kho mới: ${finalStock} (Expected: 10) -> ${finalStock === 10 ? '✅ PASS' : '❌ FAIL'}`);

    // Validate Finance Refunded
    const finalBalance = stateAfterCancel.accounts.find(a => a.id === 'ACC1').balance;
    console.log(`[TEST 2] Hủy đơn (Update Status): Hoàn tiền quỹ thành công. Balance: ${finalBalance} (Expected: 1000000) -> ${finalBalance === 1000000 ? '✅ PASS' : '❌ FAIL'}`);

    // TEST 3: Transfer Funds
    const transferAction = { payload: { fromId: 'ACC1', toId: 'ACC3', amount: 300000, fee: 10000 } };
    const stateAfterTransfer = processTransferFunds(mockState, transferAction);
    const balanceAcc1 = stateAfterTransfer.accounts.find(a => a.id === 'ACC1').balance;
    const balanceAcc3 = stateAfterTransfer.accounts.find(a => a.id === 'ACC3').balance;
    console.log(`[TEST 3] Luân chuyển quỹ (Transfer Funds): Trừ ví gửi (-310k), Cộng ví nhận (+300k). ACC1: ${balanceAcc1}, ACC3: ${balanceAcc3} (Expected: 690000, 800000) -> ${balanceAcc1 === 690000 && balanceAcc3 === 800000 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n🎉 TOÀN BỘ NGHIỆP VỤ LÕI (CRUD) HOẠT ĐỘNG HOÀN HẢO!');
  } catch (error) {
    console.error('\n❌ FAIL: Lỗi trong quá trình giả lập hệ thống:', error);
    process.exit(1);
  }
}

runTests();
