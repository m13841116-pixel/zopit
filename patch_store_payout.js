const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `
app.get('/api/store-manager/wallet', authenticateToken, requireStoreManager, async (req: any, res: any) => {
`;

const replacement = `
app.post('/api/store-manager/payout/request', authenticateToken, requireStoreManager, payoutRequestLimiter, async (req: any, res: any) => {
  try {
    const validatedData = payoutRequestSchema.parse(req.body);
    const { amount } = validatedData;
    const storeId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: storeId } });
    if (!user || !user.shaba) {
      return res.status(400).json({ error: 'لطفا ابتدا شماره شبا خود را در پروفایل ثبت کنید' });
    }
    const wallet = await getOrCreateWallet(storeId);
    const { WalletService } = await import('./src/services/WalletService.js');
    const walletService = new WalletService();
    const payoutRequest = await walletService.requestPayout(wallet.id, amount, user.shaba);
    res.json({ success: true, message: 'درخواست تسویه با موفقیت ثبت شد', payoutRequest });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors?.map((e: any) => e.message).join(', ') || err.message });
    }
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/store-manager/wallet', authenticateToken, requireStoreManager, async (req: any, res: any) => {
`;

code = code.replace(target.trim(), replacement.trim());
fs.writeFileSync('server.ts', code);
console.log('Patched store payout request');
