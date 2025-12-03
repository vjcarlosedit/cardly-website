# Dockerfile para backend
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema para Tesseract, PostgreSQL client y OpenSSL
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-spa \
    poppler \
    postgresql-client \
    openssl \
    openssl-dev \
    && ln -s /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1 || true \
    && ln -s /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1 || true

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar el resto de los archivos
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Exponer el puerto 5000
EXPOSE 5000

# Script de inicio que ejecuta migraciones y luego inicia el servidor
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

