import re

with open('src/components/store-manager/StoreProAccount.tsx', 'r') as f:
    code = f.read()

code = code.replace('} , Volume2 } from "lucide-react";', ', Volume2 } from "lucide-react";')

with open('src/components/store-manager/StoreProAccount.tsx', 'w') as f:
    f.write(code)

