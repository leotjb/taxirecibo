#!/bin/sh
echo "Executando migração do banco de dados..."
npx prisma migrate deploy --schema=server/prisma/schema.prisma
echo "Iniciando servidor..."
node server/dist/index.js
