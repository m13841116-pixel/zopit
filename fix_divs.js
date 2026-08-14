const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SystemSettings.tsx', 'utf8');

// I'll replace the end of the file with the correct closing tags.
// The file should end with closing the main wrapper div and the tab contents.

const brokenEnd = `      </div>
        <div className={activeTab === "gateways" ? "block space-y-8" : "hidden"}>
      {/* 9. PAYMENT & SMS SETTINGS MODULE */}
      <PaymentSmsSettings />
    </div>
  );
}`;

const correctEnd = `      </div>
        <div className={activeTab === "gateways" ? "block space-y-8" : "hidden"}>
      {/* 9. PAYMENT & SMS SETTINGS MODULE */}
      <PaymentSmsSettings />
    </div>
    </div>
  );
}`;

code = code.replace(brokenEnd, correctEnd);
fs.writeFileSync('src/components/superadmin/SystemSettings.tsx', code);
