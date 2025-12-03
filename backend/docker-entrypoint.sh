#!/bin/sh
set -e

echo "⏳ Esperando a que PostgreSQL esté listo..."

# Esperar a que PostgreSQL esté disponible (sin especificar base de datos para pg_isready)
until pg_isready -h postgres -p 5432 -U cardly_user; do
  echo "Esperando PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL está listo"

echo "📦 Generando Prisma Client..."
npx prisma generate

echo "🗄️ Aplicando esquema de base de datos..."
# Usar db push para desarrollo (más simple, los warnings de OpenSSL son normales en Alpine)
# Los warnings de OpenSSL no impiden que Prisma funcione
npx prisma db push --accept-data-loss --skip-generate 2>&1 | grep -v "openssl" || true

echo "🚀 Iniciando servidor..."
exec "$@"

