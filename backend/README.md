# Cardly Backend API

Backend completo para la aplicación Cardly con autenticación, OCR y generación de tarjetas con IA.

## Características

- ✅ Autenticación JWT (registro y login)
- ✅ CRUD de usuarios, colecciones y tarjetas
- ✅ OCR para extraer texto de imágenes y PDFs
- ✅ Generación de tarjetas con DeepSeek AI
- ✅ Gestión de planes y límites de uso
- ✅ Base de datos PostgreSQL con Prisma ORM

## Requisitos

- Node.js 20+
- PostgreSQL 15+
- Docker (opcional)

## Configuración

1. **Instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**
Copia `env.example` a `.env` y configura:
```bash
cp env.example .env
```

Edita `.env` y agrega:
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `JWT_SECRET`: Clave secreta para JWT
- `DEEPSEEK_API_KEY`: Tu API key de DeepSeek

3. **Configurar base de datos:**
```bash
# Generar Prisma Client
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate
```

4. **Iniciar servidor:**
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Usuarios
- `GET /api/users/me` - Obtener usuario actual
- `PUT /api/users/me` - Actualizar usuario
- `PATCH /api/users/me/limits` - Actualizar límites

### Colecciones
- `GET /api/collections` - Listar colecciones
- `GET /api/collections/:id` - Obtener colección
- `POST /api/collections` - Crear colección
- `PUT /api/collections/:id` - Actualizar colección
- `DELETE /api/collections/:id` - Eliminar colección

### Tarjetas
- `GET /api/cards/collection/:collectionId` - Listar tarjetas
- `POST /api/cards` - Crear tarjeta
- `POST /api/cards/bulk` - Crear múltiples tarjetas
- `PUT /api/cards/:id` - Actualizar tarjeta
- `DELETE /api/cards/:id` - Eliminar tarjeta

### OCR
- `POST /api/ocr/extract` - Extraer texto de archivo (multipart/form-data)

### IA
- `POST /api/ai/generate-cards` - Generar tarjetas con DeepSeek

## Ejemplo de uso

### Registrar usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### Extraer texto con OCR
```bash
curl -X POST http://localhost:5000/api/ocr/extract \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@documento.pdf"
```

### Generar tarjetas con IA
```bash
curl -X POST http://localhost:5000/api/ai/generate-cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Texto extraído del documento...",
    "collectionId": "collection_id",
    "numCards": 5,
    "difficulty": "media",
    "collectionName": "Mi Colección"
  }'
```

## Docker

Para ejecutar con Docker, usa el `docker-compose.yml` en la raíz del proyecto que incluye:
- PostgreSQL
- Backend API
- Frontend

```bash
docker-compose up
```

## Obtener API Key de DeepSeek

1. Visita https://platform.deepseek.com/
2. Crea una cuenta
3. Ve a la sección de API Keys
4. Genera una nueva key
5. Agrega la key en tu archivo `.env`



