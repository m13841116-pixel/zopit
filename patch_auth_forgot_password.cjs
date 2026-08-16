const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const injectionPoint = `// 2.1 Forgot Password Endpoint (فراموشی رمز عبور)`;

const newRoutes = `
// 2.2 Reset Password via SMS
app.post('/api/auth/reset-password-sms', async (req, res) => {
  try {
    const { mobile, code, newPassword } = req.body;
    if (!mobile || !code || !newPassword) {
      return res.status(400).json({ error: 'شماره موبایل، کد تایید و رمز عبور جدید الزامی است.' });
    }

    // Verify OTP code
    const isValid = await verifyOtp(mobile, code);
    if (!isValid) {
      return res.status(400).json({ error: 'کد تایید وارد شده نامعتبر یا منقضی شده است.' });
    }

    const user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      return res.status(404).json({ error: 'حساب کاربری با این شماره یافت نشد.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'رمز عبور با موفقیت تغییر یافت.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'خطای سرور' });
  }
});
`;

content = content.replace(injectionPoint, newRoutes + '\n' + injectionPoint);
fs.writeFileSync('server.ts', content);
