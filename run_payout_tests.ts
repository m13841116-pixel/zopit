import { getPrisma } from './src/prisma.js';
import { WalletService, PayoutStatus, LedgerStatus } from './src/services/WalletService.js';

const prisma = getPrisma();
const walletService = new WalletService();

async function runPayoutTests() {
  console.log('====================================================');
  console.log('Starting Zopit Authoritative Payout Flow Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log('  ✅ PASS:', msg);
      passed++;
    } else {
      console.error('  ❌ FAIL:', msg);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Setup Test User & Wallet
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const testUser = await prisma.user.create({
      data: {
        username: `test_payout_supp_${timestamp}`,
        role: 'SUPPLIER',
        password: 'testpassword123',
        mobile: '09129998877',
        shaba: 'IR123456789012345678901234',
        bankName: 'بانک ملت',
        accountHolderName: 'تامین کننده تست',
      }
    });

    const testWallet = await prisma.wallet.create({
      data: {
        id: `wallet_${timestamp}`,
        supplierId: testUser.id,
        balance: 100000,
      }
    });

    const walletId = testWallet.id;
    console.log(`[Setup] Created supplier ${testUser.username} with wallet ${walletId} (initial balance: 100,000 تومان)\n`);

    // -------------------------------------------------------------
    // Test 1: Concurrent Payout Requests (Race Condition & Single Active Payout)
    // -------------------------------------------------------------
    console.log('👉 Test 1: Concurrent Payout Requests (Prevention of Double Spend)');
    
    // Supplier has 100,000 balance. Requesting 80,000 twice concurrently.
    const concurrentResults = await Promise.allSettled([
      walletService.requestPayout(walletId, 80000, testUser.shaba!, {
        bankName: testUser.bankName!,
        accountHolderName: testUser.accountHolderName!,
        supplierId: testUser.id,
        supplierName: testUser.username,
      }),
      walletService.requestPayout(walletId, 80000, testUser.shaba!, {
        bankName: testUser.bankName!,
        accountHolderName: testUser.accountHolderName!,
        supplierId: testUser.id,
        supplierName: testUser.username,
      }),
    ]);

    const fulfilled = concurrentResults.filter(r => r.status === 'fulfilled');
    const rejected = concurrentResults.filter(r => r.status === 'rejected');

    assert(fulfilled.length === 1, `Exactly 1 payout request must succeed (Got ${fulfilled.length})`);
    assert(rejected.length === 1, `Exactly 1 payout request must be rejected (Got ${rejected.length})`);

    const walletAfterConcurrent = await prisma.wallet.findUnique({ where: { id: walletId } });
    assert(
      Number(walletAfterConcurrent?.balance) === 20000,
      `Wallet balance must be exactly 20,000 after 1 deduction of 80,000 (Got ${walletAfterConcurrent?.balance})`
    );

    const activePayouts = await prisma.payoutRequest.findMany({
      where: { walletId, status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] } }
    });
    assert(activePayouts.length === 1, `Exactly 1 active payout record must exist (Got ${activePayouts.length})`);
    const payout1 = activePayouts[0];
    console.log(`   Payout #1 ID: ${payout1.id} | Amount: ${payout1.amount} | Status: ${payout1.status}\n`);

    // -------------------------------------------------------------
    // Test 2: Insufficient Funds Scenario
    // -------------------------------------------------------------
    console.log('👉 Test 2: Insufficient Funds Scenario');
    let insufficientFundsError = false;
    try {
      // Wallet remaining balance is 20,000. Try requesting 50,000.
      await walletService.requestPayout(walletId, 50000, testUser.shaba!);
    } catch (err: any) {
      insufficientFundsError = true;
    }
    assert(insufficientFundsError, 'Requesting more than available balance must throw error');

    // -------------------------------------------------------------
    // Test 3: Minimum Payout Threshold Scenario
    // -------------------------------------------------------------
    console.log('👉 Test 3: Minimum Payout Threshold Scenario');
    let thresholdError = false;
    try {
      // Request 10,000 when min threshold is 50,000
      await walletService.requestPayout(walletId, 10000, testUser.shaba!, { minThreshold: 50000 });
    } catch (err: any) {
      thresholdError = true;
      assert(err.message.includes('حداقل مجاز برداشت'), `Error mentions minimum threshold: "${err.message}"`);
    }
    assert(thresholdError, 'Request below minThreshold must be rejected');

    // -------------------------------------------------------------
    // Test 4: Payout Lifecycle: Approval and Idempotency of markPaid
    // -------------------------------------------------------------
    console.log('\n👉 Test 4: Approval and Idempotency of markPaid');
    // Approve payout1
    const approvedPR = await walletService.approvePayout(payout1.id, 999);
    assert(approvedPR.status === PayoutStatus.PROCESSING, 'Approved payout moves to PROCESSING status');

    // Mark paid
    const paidPR = await walletService.markPaid(payout1.id, 999, {
      transactionRef: 'PAY-REF-998877',
      paymentNotes: 'Paid via Zopit automated batch settlement',
    });
    assert(paidPR.status === PayoutStatus.SUCCESS, 'Payout moves to SUCCESS status');
    assert(paidPR.transactionRef === 'PAY-REF-998877', 'Transaction reference is stored');

    // Check ledger entry status is COMPLETED
    const ledgerAfterPaid = await prisma.ledgerEntry.findFirst({
      where: { payoutRequestId: payout1.id }
    });
    assert(ledgerAfterPaid?.status === LedgerStatus.COMPLETED, 'Ledger entry is marked COMPLETED');

    // Attempt second markPaid on already paid payout
    let doublePayBlocked = false;
    try {
      await walletService.markPaid(payout1.id, 999, { transactionRef: 'DUPLICATE-PAY' });
    } catch (err: any) {
      doublePayBlocked = true;
      assert(err.message.includes('قبلاً پرداخت'), `Duplicate pay blocked with idempotency error: "${err.message}"`);
    }
    assert(doublePayBlocked, 'Marking paid twice must be blocked (Idempotency)');

    // -------------------------------------------------------------
    // Test 5: Rejection and Atomic Unlocking of Funds
    // -------------------------------------------------------------
    console.log('\n👉 Test 5: Rejection & Atomic Funds Unlocking / Balance Reversal');
    // Top up wallet back to 60,000
    await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: 60000 }
    });
    console.log('   Reset wallet balance to 60,000 تومان');

    // Request payout of 50,000 -> balance becomes 10,000
    const payout2 = await walletService.requestPayout(walletId, 50000, testUser.shaba!, {
      bankName: testUser.bankName!,
      accountHolderName: testUser.accountHolderName!,
    });

    const walletWhileLocked = await prisma.wallet.findUnique({ where: { id: walletId } });
    assert(Number(walletWhileLocked?.balance) === 10000, 'Balance debited to 10,000 while locked');

    const ledgerWhileLocked = await prisma.ledgerEntry.findFirst({
      where: { payoutRequestId: payout2.id }
    });
    assert(ledgerWhileLocked?.status === LedgerStatus.PENDING, 'Ledger entry is PENDING during lock');

    // Admin rejects payout2
    const rejectedPR = await walletService.rejectPayout(payout2.id, 999, 'اطلاعات شبا با نام دارنده مطابقت ندارد');
    assert(rejectedPR.status === PayoutStatus.FAILED, 'Payout status becomes FAILED');
    assert(rejectedPR.financiallyLocked === false, 'financiallyLocked flag is false');
    assert(rejectedPR.paymentNotes?.includes('اطلاعات شبا'), 'Rejection reason saved in paymentNotes');

    // Check wallet balance is restored to 60,000
    const walletAfterReject = await prisma.wallet.findUnique({ where: { id: walletId } });
    assert(
      Number(walletAfterReject?.balance) === 60000,
      `Balance must be restored to 60,000 after rejection (Got ${walletAfterReject?.balance})`
    );

    // Check ledger status is FAILED
    const ledgerAfterReject = await prisma.ledgerEntry.findFirst({
      where: { payoutRequestId: payout2.id }
    });
    assert(ledgerAfterReject?.status === LedgerStatus.FAILED, 'Ledger entry is marked FAILED after rejection');

    // Ensure supplier can immediately request a new payout with the restored funds
    const payout3 = await walletService.requestPayout(walletId, 60000, testUser.shaba!);
    assert(payout3.status === PayoutStatus.PENDING, 'Supplier can request new payout after rejection release');

    // Cleanup test records
    await prisma.ledgerEntry.deleteMany({ where: { walletId } });
    await prisma.payoutRequest.deleteMany({ where: { walletId } });
    await prisma.wallet.delete({ where: { id: walletId } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('\n[Cleanup] Cleaned up test user, wallet, and ledger entries.');

  } catch (error: any) {
    console.error('Fatal Test Execution Error:', error);
    failed++;
  } finally {
    console.log('\n====================================================');
    console.log(`Test Results: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');
    await prisma.$disconnect();
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runPayoutTests();
