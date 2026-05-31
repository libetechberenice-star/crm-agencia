-- ============================================================
-- CRM Agencia de Diseño — Schema inicial
-- Supabase PostgreSQL
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  rol          TEXT NOT NULL CHECK (rol IN ('admin', 'vendedora', 'disenador')),
  activo       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: admin_config (PIN del admin, config global)
-- ============================================================
CREATE TABLE public.admin_config (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_hash     TEXT NOT NULL,  -- bcrypt hash del PIN
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: packages (paquetes de servicio)
-- ============================================================
CREATE TABLE public.packages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL CHECK (nombre IN ('basico', 'estandar', 'mixto')),
  precio_base  DECIMAL(10,2) NOT NULL DEFAULT 0,
  descripcion  TEXT,
  activo       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales de paquetes
INSERT INTO public.packages (nombre, precio_base, descripcion) VALUES
  ('basico',   2500.00, 'Paquete básico de diseño'),
  ('estandar', 5000.00, 'Paquete estándar de diseño'),
  ('mixto',    0.00,    'Paquete personalizado — precio definido por proyecto');

-- ============================================================
-- TABLA: clients (clientes / proyectos)
-- ============================================================
CREATE TABLE public.clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo          TEXT NOT NULL UNIQUE,          -- capturado manualmente
  nombre_negocio  TEXT NOT NULL,
  nombre_contacto TEXT,
  telefono        TEXT,
  email           TEXT,

  -- Paquete y precios
  tipo_paquete    TEXT NOT NULL CHECK (tipo_paquete IN ('basico', 'estandar', 'mixto')),
  mixto_detalle   TEXT,                          -- descripción si es mixto
  precio_total    DECIMAL(10,2) NOT NULL DEFAULT 0,
  abono           DECIMAL(10,2) NOT NULL DEFAULT 0,
  restante        DECIMAL(10,2) GENERATED ALWAYS AS (precio_total - abono) STORED,

  -- Estatus del proyecto
  estatus         TEXT NOT NULL DEFAULT 'anticipo' CHECK (estatus IN (
                    'anticipo',
                    'propuestas_enviadas',
                    'pendiente_pago',
                    'pago_completo'
                  )),

  -- Fechas
  fecha_entrega   DATE,
  fecha_registro  TIMESTAMPTZ DEFAULT NOW(),
  fecha_pago      TIMESTAMPTZ,

  -- Etiqueta de color (calculada en frontend, guardada para historial)
  color_semaforo  TEXT CHECK (color_semaforo IN ('verde', 'amarillo', 'naranja', 'rojo')),

  -- Tipo de proyecto
  tipo_proyecto   TEXT[] DEFAULT '{}',  -- ['logo', 'redes', 'web', 'impresion']

  -- Vendedora que registró
  registrado_por  UUID REFERENCES public.profiles(id),

  activo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: project_briefs (ficha de brief para el diseñador)
-- ============================================================
CREATE TABLE public.project_briefs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  -- Brief de logo / identidad
  concepto        TEXT,           -- qué busca el cliente
  colores_gusto   TEXT,           -- colores que le gustan
  colores_evitar  TEXT,           -- colores que NO quiere
  estilo          TEXT,           -- minimalista, moderno, clásico, divertido, etc.
  referencias     TEXT,           -- marcas o logos de referencia
  giro_negocio    TEXT,           -- a qué se dedica el negocio
  publico_objetivo TEXT,          -- a quién va dirigido

  -- Brief de redes sociales
  tono_comunicacion TEXT,         -- formal, casual, divertido
  temas_contenido TEXT,           -- qué temas tratar
  frecuencia_posts TEXT,          -- cuántas publicaciones por semana

  -- Notas generales
  notas_adicionales TEXT,
  instrucciones_disenador TEXT,   -- mensaje directo al diseñador

  -- Archivos del cliente (URLs de Supabase Storage)
  imagenes_referencia TEXT[] DEFAULT '{}',

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: movements (movimientos financieros)
-- ============================================================
CREATE TABLE public.movements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo            TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  concepto        TEXT NOT NULL,
  monto           DECIMAL(10,2) NOT NULL,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Relación opcional con cliente
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  es_abono        BOOLEAN DEFAULT false,  -- si es abono de un cliente

  -- Categorías de gasto
  categoria       TEXT,   -- renta, servicios, sueldos, publicidad, etc.

  -- Quién registró
  registrado_por  UUID REFERENCES public.profiles(id),

  activo          BOOLEAN DEFAULT true,  -- false = eliminado (con PIN)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: weekly_cuts (cortes semanales — automático cada domingo)
-- ============================================================
CREATE TABLE public.weekly_cuts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semana_inicio   DATE NOT NULL,   -- lunes
  semana_fin      DATE NOT NULL,   -- domingo
  semana_numero   INTEGER,
  anio            INTEGER,

  -- Métricas de la semana
  total_vendido   DECIMAL(10,2) DEFAULT 0,
  total_abonado   DECIMAL(10,2) DEFAULT 0,
  total_restante  DECIMAL(10,2) DEFAULT 0,
  total_gastos    DECIMAL(10,2) DEFAULT 0,
  utilidad_neta   DECIMAL(10,2) DEFAULT 0,
  num_clientes    INTEGER DEFAULT 0,
  num_proyectos   INTEGER DEFAULT 0,

  -- Snapshot JSON con detalle
  detalle_json    JSONB DEFAULT '{}',

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: activity_log (movimientos del día — dashboard)
-- ============================================================
CREATE TABLE public.activity_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo            TEXT NOT NULL CHECK (tipo IN (
                    'contratacion',
                    'abono',
                    'entrega',
                    'liquidacion',
                    'gasto',
                    'cambio_estatus'
                  )),
  descripcion     TEXT NOT NULL,
  monto           DECIMAL(10,2),
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  usuario_id      UUID REFERENCES public.profiles(id),
  fecha           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX idx_clients_estatus    ON public.clients(estatus);
CREATE INDEX idx_clients_entrega    ON public.clients(fecha_entrega);
CREATE INDEX idx_clients_activo     ON public.clients(activo);
CREATE INDEX idx_movements_fecha    ON public.movements(fecha);
CREATE INDEX idx_movements_tipo     ON public.movements(tipo);
CREATE INDEX idx_activity_fecha     ON public.activity_log(fecha);
CREATE INDEX idx_weekly_semana      ON public.weekly_cuts(semana_inicio);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER briefs_updated_at
  BEFORE UPDATE ON public.project_briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCIÓN: corte semanal automático (llamada por cron cada domingo)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_weekly_cut()
RETURNS void AS $$
DECLARE
  v_inicio DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_fin    DATE := v_inicio + INTERVAL '6 days';
BEGIN
  INSERT INTO public.weekly_cuts (
    semana_inicio, semana_fin, semana_numero, anio,
    total_vendido, total_abonado, total_gastos, utilidad_neta,
    num_clientes, num_proyectos
  )
  SELECT
    v_inicio,
    v_fin,
    EXTRACT(WEEK FROM v_inicio)::INTEGER,
    EXTRACT(YEAR FROM v_inicio)::INTEGER,
    COALESCE(SUM(CASE WHEN m.tipo = 'ingreso' AND NOT m.es_abono THEN m.monto ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN m.tipo = 'ingreso' AND m.es_abono     THEN m.monto ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN m.tipo = 'gasto'                      THEN m.monto ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN m.tipo = 'ingreso' THEN m.monto ELSE -m.monto END), 0),
    (SELECT COUNT(*) FROM public.clients WHERE DATE(created_at) BETWEEN v_inicio AND v_fin),
    (SELECT COUNT(*) FROM public.clients WHERE DATE(created_at) BETWEEN v_inicio AND v_fin AND activo = true)
  FROM public.movements m
  WHERE m.fecha BETWEEN v_inicio AND v_fin
    AND m.activo = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_briefs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_cuts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages        ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios autenticados pueden leer/escribir todo
-- (el control fino de roles se hace en el API layer de Next.js)
CREATE POLICY "authenticated_all" ON public.profiles        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.clients         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.project_briefs  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.movements       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.weekly_cuts     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.activity_log    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.packages        FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Solo admin puede leer/modificar el PIN
CREATE POLICY "admin_only" ON public.admin_config
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );
