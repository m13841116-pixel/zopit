const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const replacement = `
@import url('https://cdn.fontcdn.ir/Font/Persian/Yekan/Yekan.css');
@import url('https://cdn.jsdelivr.net/gh/rastikerdar/shabnam-font@v5.0.1/dist/font-face.css');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-card: var(--card);
  --color-elevated: var(--elevated);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-text-inverse: var(--text-inverse);
  --color-inverse: var(--text-inverse);
  --color-border-default: var(--border);
  --color-border-subtle: var(--border-subtle);
  --color-primary: var(--primary);
  --color-primary-default: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-light: var(--primary-light);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);

  --font-sans: "Yekan", "Shabnam", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}
`;

code = code.replace(/@import url\([\s\S]*?--font-mono:[^\n]+;[\s\n]*\}/m, replacement.trim());
fs.writeFileSync('src/index.css', code);
console.log('Patched fonts');
