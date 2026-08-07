const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const badCode = `{(!currentUser && (view === "explore" || view === "login")) && (
                {/* Floating Navigation Pill */}
        <div className="fixed bottom-6`;

const goodCode = `{(!currentUser && (view === "explore" || view === "login")) && (
        <div className="fixed bottom-6`;

content = content.replace(badCode, goodCode);

fs.writeFileSync('src/App.tsx', content, 'utf8');
