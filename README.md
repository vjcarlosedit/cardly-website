# Cardly - Aplicación inteligente de apuntes y repaso con IA

Aplicación web completa para crear y estudiar tarjetas de estudio generadas con IA a partir de tus apuntes.

## Características

- 🎓 Generación automática de tarjetas de estudio con IA (DeepSeek)
- 📄 OCR para extraer texto de imágenes y PDFs
- 📚 Gestión de colecciones y tarjetas
- 👤 Sistema de autenticación y perfiles de usuario
- 💳 Planes de suscripción con límites
- 🐳 Dockerizado para fácil despliegue

## Estructura del Proyecto

```
cardly-website/
├── backend/          # API Backend (Node.js/Express/PostgreSQL)
├── src/              # Frontend (React/TypeScript/Vite)
├── public/           # Archivos estáticos
└── docker-compose.yml # Configuración Docker completa
```

## Requisitos

- Docker y Docker Compose
- Node.js 20+ (si ejecutas sin Docker)
- PostgreSQL 15+ (si ejecutas sin Docker)

## Configuración Rápida con Docker

1. **Clonar y configurar:**
```bash
# Copiar variables de entorno del backend
cp backend/env.example backend/.env

# Editar backend/.env y agregar tu DEEPSEEK_API_KEY
# Obtén tu API key en: https://platform.deepseek.com/
```

2. **Ejecutar todo el stack:**
```bash
# Desde PowerShell (Windows)
.\run.ps1

# O manualmente
docker-compose up --build
```

Esto iniciará:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432

## Configuración Manual (Sin Docker)

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones

# Configurar base de datos
npm run prisma:generate
npm run prisma:migrate

# Iniciar servidor
npm run dev
```

### Frontend

```bash
# Instalar dependencias
npm install

# Configurar variable de entorno
# Crear .env con: VITE_API_URL=http://localhost:5000/api

# Iniciar servidor de desarrollo
npm run dev
```

## Obtener API Key de DeepSeek

1. Visita https://platform.deepseek.com/
2. Crea una cuenta o inicia sesión
3. Ve a la sección de API Keys
4. Genera una nueva API key
5. Agrega la key en `backend/.env`:
   ```
   DEEPSEEK_API_KEY=tu-api-key-aqui
   ```

## Tecnologías Utilizadas

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Sonner (toasts)

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + Prisma ORM
- JWT para autenticación
- Tesseract.js para OCR
- DeepSeek API para generación de tarjetas

## API Endpoints

Ver documentación completa en [backend/README.md](backend/README.md)

## Desarrollo

### Estructura del Backend
```
backend/
├── src/
│   ├── routes/      # Rutas de la API
│   ├── middleware/   # Middleware (auth, etc.)
│   └── index.ts      # Punto de entrada
├── prisma/
│   └── schema.prisma # Esquema de base de datos
└── package.json
```

### Estructura del Frontend
```
src/
├── components/       # Componentes React
├── services/        # Servicios API
└── main.tsx         # Punto de entrada
```

## Scripts Disponibles

### Frontend
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción

### Backend
- `npm run dev` - Servidor de desarrollo con hot-reload
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar producción
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:studio` - Abrir Prisma Studio

## Base de Datos

El proyecto usa PostgreSQL con Prisma ORM. El esquema incluye:

- **Users**: Usuarios con planes y límites
- **Collections**: Colecciones de tarjetas
- **Cards**: Tarjetas individuales

Ver `backend/prisma/schema.prisma` para el esquema completo.

## Licencia

MIT
