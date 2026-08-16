const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

// The user requested IRANYekan. Let's add iranyekan font CDN and replace Yekan/Shabnam with iranyekan.
content = content.replace("@import url('https://cdn.fontcdn.ir/Font/Persian/Yekan/Yekan.css');", "@import url('https://cdn.fontcdn.ir/Font/Persian/IRANSans/IRANSans.css');\n@import url('https://cdn.fontcdn.ir/Font/Persian/IRANYekan/IRANYekan.css');");
content = content.replace(/--font-sans: "Yekan", "Shabnam", ui-sans-serif, system-ui, sans-serif;/g, '--font-sans: "IRANYekan", "IRANSans", "Yekan", "Shabnam", ui-sans-serif, system-ui, sans-serif;');

fs.writeFileSync('src/index.css', content);
