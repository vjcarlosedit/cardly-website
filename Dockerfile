# Dockerfile para desarrollo
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar el resto de los archivos
COPY . .

# Exponer el puerto 3000
EXPOSE 3000

# Comando para ejecutar en modo desarrollo
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--no-open"]

