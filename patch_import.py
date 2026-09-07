import re

with open('src/components/store-manager/StoreProAccount.tsx', 'r') as f:
    code = f.read()

# Make sure Volume2 is imported
if 'Volume2' not in code[:1000]:
    code = code.replace('from "lucide-react";', ', Volume2 } from "lucide-react";')

with open('src/components/store-manager/StoreProAccount.tsx', 'w') as f:
    f.write(code)
print("Patched import")

