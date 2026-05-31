# CRM Agencia de Diseño

Sistema de gestión de clientes, proyectos y finanzas para agencia de diseño.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (imágenes del brief)
- **Deploy**: Vercel

---

## Instalación paso a paso

### 1. Crear cuenta en Supabase

1. Ve a [supabase.com](https://supabase.com) → **Start for free**
2. Crea un nuevo proyecto (guarda la contraseña de BD en lugar seguro)
3. Espera ~2 min a que se inicialice

### 2. Configurar la base de datos

1. En Supabase → **SQL Editor**
2. Copia todo el contenido de `supabase/migrations/001_initial_schema.sql`
3. Pégalo en el editor y haz clic en **Run**
4. Verifica que aparezcan las tablas en **Table Editor**

### 3. Configurar Storage en Supabase

1. Ve a **Storage** → **New bucket**
2. Nombre: `crm-assets`
3. Marca **Public bucket** ✓
4. Crea el bucket

### 4. Crear el primer usuario admin en Supabase

1. Ve a **Authentication** → **Users** → **Add user**
2. Ingresa correo y contraseña del administrador
3. Ve a **SQL Editor** y ejecuta:
```sql
INSERT INTO public.profiles (id, nombre, rol)
VALUES (
  'UUID-DEL-USUARIO-CREADO',  -- cópialo de la lista de usuarios
  'Tu Nombre',
  'admin'
);
```

### 5. Configurar el PIN del administrador

1. Ve a **SQL Editor** y ejecuta:
```sql
-- Esto genera el hash bcrypt del PIN "1234" — cámbialo después desde el sistema
INSERT INTO public.admin_config (pin_hash)
VALUES (crypt('1234', gen_salt('bf')));
```
> Después de entrar al sistema, ve a **Accesos → Cambiar PIN** para actualizarlo.

### 6. Configurar el cron job del corte semanal

En Supabase → **Database** → **Extensions** → activa `pg_cron`, luego en SQL Editor:
```sql
-- Ejecutar cada domingo a las 23:30
SELECT cron.schedule('corte-semanal', '30 23 * * 0', 'SELECT generate_weekly_cut()');
```

### 7. Clonar e instalar el proyecto

```bash
git clone https://github.com/TU-USUARIO/crm-agencia.git
cd crm-agencia
npm install
```

### 8. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus datos de Supabase:
- Ve a Supabase → **Settings** → **API**
- Copia la **URL del proyecto**
- Copia la **anon/public key**
- Copia la **service_role key** (para crear usuarios)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 9. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Deploy en Vercel

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "feat: CRM inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/crm-agencia.git
git push -u origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) → **New Project**
2. Importa tu repositorio de GitHub
3. En **Environment Variables** agrega las 3 variables de `.env.local`
4. Clic en **Deploy**

### 3. Configurar dominio en Supabase

Una vez desplegado, copia la URL de Vercel (ej. `https://crm-agencia.vercel.app`) y agrégala en:
- Supabase → **Authentication** → **URL Configuration** → **Site URL**
- También en **Redirect URLs**: `https://crm-agencia.vercel.app/**`

---

## Módulos del sistema

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Métricas, actividad del día, proyectos con semáforo, historial semanal |
| **Clientes** | Grid con filtros, tarjetas de proyecto, estatus con colores |
| **Nuevo cliente** | Formulario 3 pasos: datos + brief diseñador + imágenes |
| **Expediente** | Vista completa del cliente con brief para el diseñador |
| **Finanzas** | Ingresos, gastos, filtros por período, utilidad |
| **Accesos** | Gestión de usuarios y PIN de administrador |

## Semáforo de entregas

| Color | Condición |
|-------|-----------|
| 🟢 Verde | Más de 1 día restante |
| 🟡 Amarillo | Exactamente 1 día |
| 🟠 Naranja | El mismo día |
| 🔴 Rojo | Fecha pasada (atrasado) |

## Roles

| Rol | Acceso |
|-----|--------|
| **Admin** | Todo + gestión usuarios + PIN eliminación |
| **Vendedora** | Clientes, proyectos, finanzas (sin eliminar) |
| **Diseñador** | Solo vista de clientes y briefs |
