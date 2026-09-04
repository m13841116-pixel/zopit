const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  { view: 'supplier_form', href: '/register/supplier' },
  { view: 'store_manager_form', href: '/register/store' },
  { view: 'ambassador_form', href: '/register/customer' },
  { view: 'role_select', href: '/register' },
  { view: 'login', href: '/login' },
  { view: 'forgot_password', href: '/forgot-password' },
  { view: 'explore', href: '/explore' }
];

// Instead of regex on the whole file, I will just regex on the `<a ` that I just generated and then find their corresponding `</button>` and change to `</a>`.
// Wait, my previous sed command already changed the OPENING tags to `<a`. Now they have `<a ...> ... </button>`.

let errorFixes = code.replace(/<a([^>]*?)href="([^"]+)"([^>]*?)>([\s\S]*?)<\/button>/gi, '<a$1href="$2"$3>$4</a>');

fs.writeFileSync('src/App.tsx', errorFixes, 'utf8');
