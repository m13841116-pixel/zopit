const fs = require('fs');

let settingsContent = fs.readFileSync('src/components/superadmin/SystemSettings.tsx', 'utf8');

const versionInput = `
        <div className="mt-4">
          <label className="block text-xs font-bold text-text-primary mb-1">شماره نسخه جدید (اختیاری)</label>
          <input type="text" id="updateVersion" placeholder="مثلا 3.0.1" className="w-full p-3 bg-background border border-border-default/50 rounded-xl text-sm" />
        </div>
`;

if (!settingsContent.includes('شماره نسخه جدید')) {
  settingsContent = settingsContent.replace(
    /hover:file:bg-primary-default\/20"\s*\/>/,
    'hover:file:bg-primary-default/20" />' + versionInput
  );
  
  // Modify the upload API call
  const oldFetch = `const res = await fetch("/api/admin/dev/update", {`;
  const newFetch = `
      const versionInput = document.getElementById("updateVersion") as HTMLInputElement;
      if (versionInput && versionInput.value) {
        formData.append("version", versionInput.value);
      }
      const res = await fetch("/api/admin/dev/update", {`;
  
  settingsContent = settingsContent.replace(oldFetch, newFetch);
  fs.writeFileSync('src/components/superadmin/SystemSettings.tsx', settingsContent, 'utf8');
  console.log('SystemSettings updated with version input.');
}

