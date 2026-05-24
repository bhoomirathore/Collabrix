import { PrismaClient } from "@prisma/client";\nconst prisma = global.prisma || new PrismaClient();\nif (process.env.NODE_ENV !== "production") global.prisma = prisma;\nexport default prisma;\n
