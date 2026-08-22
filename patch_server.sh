#!/bin/bash
# 1. Define getCanonicalAppUrl in server.ts
sed -i 's/function getPublicUrl(req: any): string {/function getCanonicalAppUrl(req?: any): string {\n  const configured = process.env.APP_BASE_URL || process.env.APP_URL;\n  if (configured \&\& configured.trim()) {\n    return configured.trim().replace(\/\\\/$\/, '"''"');\n  }\n  if (process.env.NODE_ENV === '"'production'"') {\n    throw new Error('"APP_BASE_URL is required in production"');\n  }\n  const host = req?.headers?.['"'x-forwarded-host'"'] || req?.headers?.host || '"'localhost:3000'"';\n  const protocol = req?.headers?.['"'x-forwarded-proto'"'] || '"'http'"';\n  return `${protocol}:\/\/${host}`.replace(\/\\\/$\/, '"''"');\n}\n\nfunction getPublicUrl(req: any): string {/' server.ts

# 2. Replace getPublicUrl with getCanonicalAppUrl globally
sed -i 's/getPublicUrl/getCanonicalAppUrl/g' server.ts

# 3. Clean up the function getCanonicalAppUrl(req: any): string { (it will have a duplicated name now if I used sed blindly, let me refine)
