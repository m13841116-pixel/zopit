const fs = require('fs');
const content = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

let newContent = content.replace(
  '<div id="pro-register-wizard-container" className="bg-card border border-border-subtle rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl">',
  '<div id="pro-register-wizard-container" className={formStep === 2 ? "space-y-8" : "bg-card border border-border-subtle rounded-[2.5rem] p-6 sm:p-10 space-y-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border-indigo-500/10"}>'
);

// We need to wrap the progress indicator in formStep === 1
const progressStartStr = `            {/* WIZARD STEP HEADER & PROGRESS INDICATOR */}
            <div className="space-y-6">`;
            
const progressReplacement = `            {/* WIZARD STEP HEADER & PROGRESS INDICATOR */}
            {formStep === 1 && (
            <div className="space-y-6">`;

newContent = newContent.replace(progressStartStr, progressReplacement);

const step1StartStr = `            {/* STEP 1: APPLICANT INFO & SERVICES FORM */}`;
const step1Replacement = `            )}
            {/* STEP 1: APPLICANT INFO & SERVICES FORM */}`;

newContent = newContent.replace(step1StartStr, step1Replacement);

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', newContent);
console.log("Done patching step 1 wrapper.");
