const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!content.includes('autoApproveOrders')) {
  content = content.replace(
    'avatarUrl              String?',
    'avatarUrl              String?\n  autoApproveOrders      Boolean?  @default(true)'
  );
}

if (!content.includes('model Lead')) {
  content += `

model Lead {
  id             Int      @id @default(autoincrement())
  name           String
  phone          String   @unique
  address        String?
  category       String?
  commission     Float    @default(100000)
  status         String   @default("PENDING") // PENDING, ASSIGNED, COMPLETED
  ambassadorId   Int?
  supplierId     Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  ambassador     User?    @relation("AmbassadorLeads", fields: [ambassadorId], references: [id])
}
`;
  // Add relation in User model
  content = content.replace(
    'model User {',
    'model User {\n  leads                  Lead[]   @relation("AmbassadorLeads")'
  );
}

fs.writeFileSync('prisma/schema.prisma', content);
