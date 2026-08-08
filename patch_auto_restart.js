const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
    res.json({
      success: true,
      message: buildSuccess 
        ? 'فایل‌های جدید جایگزین و بیلد شدند. سرور به صورت خودکار تا چند لحظه دیگر ری‌استارت می‌شود.' 
        : 'فایل‌های جدید جایگزین شدند اما بیلد خطا داشت.',
      buildSuccess,
      buildOutput,
      buildError
    });

    if (buildSuccess) {
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    }
`;

content = content.replace(
  /res\.json\(\{\s*success: true,\s*message: buildSuccess[\s\S]*?buildError\s*\}\);/,
  replacement
);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('Auto restart added.');
