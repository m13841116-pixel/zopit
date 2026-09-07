import re

with open('src/components/store-manager/StoreProAccount.tsx', 'r') as f:
    code = f.read()

# Replace onClick={handleRegister} with onClick={(e) => handleRegister(e as any)}
code = code.replace("onClick={handleRegister}", "onClick={(e) => handleRegister(e as any)}")

with open('src/components/store-manager/StoreProAccount.tsx', 'w') as f:
    f.write(code)
print("Patched click handler")

