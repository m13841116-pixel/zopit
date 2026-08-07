const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

const versionLogic = `
    const newVersion = req.body.version;
    if (newVersion) {
      await prisma.systemConfig.upsert({
        where: { key: 'PLATFORM_VERSION' },
        update: { value: newVersion },
        create: { key: 'PLATFORM_VERSION', value: newVersion }
      });
    }
`;

if (!serverContent.includes('const newVersion = req.body.version')) {
  serverContent = serverContent.replace(
    /const zipPath = req\.file\.path;/,
    'const zipPath = req.file.path;' + versionLogic
  );
  
  fs.writeFileSync('server.ts', serverContent, 'utf8');
  console.log('Server updated to save version.');
}
