import re

with open('src/components/store-manager/StoreProAccount.tsx', 'r') as f:
    code = f.read()

# Replace the hostBasePrice calculation in handleRegister
old_calc = """    const hostBasePrice = parseInt(settings.promaxAccountPrice || '299000', 10);
    const adminServicesCost = hasEnamad ? 50000 : 0;
    const subtotal = hostBasePrice + adminServicesCost;
    const calculatedAmount = Math.max(0, subtotal - appliedDiscount);"""

new_calc = """    const planCost = selectedPlan === 'VIP' ? (billingCycle === 'ANNUAL' ? 9900000 : 1490000) : selectedPlan === 'PRO' ? (billingCycle === 'ANNUAL' ? 1490000 : 599000) : 259000;
    const adminServicesCost = hasEnamad ? 50000 : 0;
    const subtotal = planCost + adminServicesCost;
    const calculatedAmount = Math.max(0, subtotal - appliedDiscount);"""

code = code.replace(old_calc, new_calc)

# Also update the calculate price in handleApplyDiscountCodeWithCode
old_discount_calc = """      const hostBasePrice = parseInt(settings.promaxAccountPrice || '299000', 10);
      const adminServicesCost = hasEnamad ? 50000 : 0;
      const totalCost = hostBasePrice + adminServicesCost;"""

new_discount_calc = """      const planCost = selectedPlan === 'VIP' ? (billingCycle === 'ANNUAL' ? 9900000 : 1490000) : selectedPlan === 'PRO' ? (billingCycle === 'ANNUAL' ? 1490000 : 599000) : 259000;
      const adminServicesCost = hasEnamad ? 50000 : 0;
      const totalCost = planCost + adminServicesCost;"""

code = code.replace(old_discount_calc, new_discount_calc)

# Also remove handleProceedToStep2 function block completely, to avoid confusion
# We'll just replace it with an empty string
code = re.sub(r'const handleProceedToStep2 = \(\) => \{.*?\n  \};\n\n', '', code, flags=re.DOTALL)


with open('src/components/store-manager/StoreProAccount.tsx', 'w') as f:
    f.write(code)
print("Patched handleRegister")

