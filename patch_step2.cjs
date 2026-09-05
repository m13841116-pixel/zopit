const fs = require('fs');
const content = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

const startIdx = content.indexOf('{/* STEP 2: CLOUD HOSTING, DISCOUNT COUPON & FINAL INVOICE */}');
if (startIdx === -1) {
  console.log("Not found");
  process.exit(1);
}

// We know the end is right before "{/* Contract & Terms Modal */}"
const endIdx = content.indexOf('{/* Contract & Terms Modal */}');

if (endIdx === -1) {
  console.log("End not found");
  process.exit(1);
}

// But wait, there are two `</div>` between `)}` (end of step 2) and `{/* Contract...`.
// Let's find the exact `)}` that ends formStep === 2.
// Actually, it's safer to just replace everything from `formStep === 2 && (` up to `)}` before the two `</div>`.

const lines = content.split('\n');
let newLines = [];
let insideStep2 = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* STEP 2: CLOUD HOSTING, DISCOUNT COUPON & FINAL INVOICE */}')) {
    newLines.push(lines[i]);
    
    // Inject our replacement
    newLines.push(`            {formStep === 2 && (
              <StoreProAccountStep2
                fullName={fullName}
                mobile={mobile}
                setFormStep={setFormStep}
                settings={settings}
                hasDomainPriority={hasDomainPriority}
                hasEnamad={hasEnamad}
                discountCodeText={discountCodeText}
                setDiscountCodeText={setDiscountCodeText}
                isDiscountApplied={isDiscountApplied}
                setIsDiscountApplied={setIsDiscountApplied}
                applyDiscount={handleApplyDiscountCode}
                appliedDiscount={appliedDiscount}
                calculatedAmount={Math.max(0, parseInt(settings.promaxAccountPrice || "199000", 10) + (hasDomainPriority ? 80000 : 0) + (hasEnamad ? 50000 : 0) - appliedDiscount)}
                handleRegisterPro={handleRegisterPro}
                submitting={submitting}
              />
            )}`);
    insideStep2 = true;
    continue;
  }
  
  if (insideStep2) {
    if (i === 2222) { // 2223 is the first </div>
      insideStep2 = false;
    }
  } else {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', newLines.join('\n'));
console.log("Done");
