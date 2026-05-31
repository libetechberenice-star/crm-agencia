// ============================================================
// Tipos globales del CRM Agencia
// ============================================================

export type Rol = 'admin' | 'vendedora' | 'disenador'
export type TipoPaquete = 'basico' | 'estandar' | 'mixto'
export type EstatusCliente =
  | 'anticipo'
  | 'propuestas_enviadas'
  | 'pendiente_pago'
  | 'pago_completo'
export type ColorSemaforo = 'verde' | 'amarillo' | 'naranja' | 'rojo'
export type TipoMovimiento = 'ingreso' | 'gasto'
export type TipoActividad =
  | 'contratacion'
  | 'abono'
  | 'entrega'
  | 'liquidacion'
  | 'gasto'
  | 'cambio_estatus'

// ============================================================
// Perfil de usuario
// ============================================================
export interface Profile {
  id: string
  nombre: string
  rol: Rol
  activo: boolean
  created_at: string
}

// ============================================================
// Cliente / Proyecto
// ============================================================
export interface Client {
  id: string
  codigo: string
  nombre_negocio: string
  nombre_contacto: string | null
  telefono: string | null
  email: string | null
  tipo_paquete: TipoPaquete
  mixto_detalle: string | null
  precio_total: number
  abono: number
  restante: number
  estatus: EstatusCliente
  fecha_entrega: string | null
  fecha_registro: string
  fecha_pago: string | null
  color_semaforo: ColorSemaforo | null
  tipo_proyecto: string[]
  registrado_por: string | null
  activo: boolean
  created_at: string
  updated_at: string
  // Relaciones opcionales
  project_briefs?: ProjectBrief[]
}

// ============================================================
// Brief del diseñador
// ============================================================
export interface ProjectBrief {
  id: string
  client_id: string
  // Logo / identidad
  concepto: string | null
  colores_gusto: string | null
  colores_evitar: string | null
  estilo: string | null
  referencias: string | null
  giro_negocio: string | null
  publico_objetivo: string | null
  // Redes sociales
  tono_comunicacion: string | null
  temas_contenido: string | null
  frecuencia_posts: string | null
  // General
  notas_adicionales: string | null
  instrucciones_disenador: string | null
  imagenes_referencia: string[]
  created_at: string
  updated_at: string
}

// ============================================================
// Movimiento financiero
// ============================================================
export interface Movement {
  id: string
  tipo: TipoMovimiento
  concepto: string
  monto: number
  fecha: string
  client_id: string | null
  es_abono: boolean
  categoria: string | null
  registrado_por: string | null
  activo: boolean
  created_at: string
  // Relaciones opcionales
  clients?: Pick<Client, 'id' | 'nombre_negocio' | 'codigo'>
  profiles?: Pick<Profile, 'id' | 'nombre'>
}

// ============================================================
// Corte semanal
// ============================================================
export interface WeeklyCut {
  id: string
  semana_inicio: string
  semana_fin: string
  semana_numero: number
  anio: number
  total_vendido: number
  total_abonado: number
  total_restante: number
  total_gastos: number
  utilidad_neta: number
  num_clientes: number
  num_proyectos: number
  detalle_json: Record<string, unknown>
  created_at: string
}

// ============================================================
// Log de actividad
// ============================================================
export interface ActivityLog {
  id: string
  tipo: TipoActividad
  descripcion: string
  monto: number | null
  client_id: string | null
  usuario_id: string | null
  fecha: string
  clients?: Pick<Client, 'id' | 'nombre_negocio' | 'codigo'>
}

// ============================================================
// Dashboard metrics
// ============================================================
export interface DashboardMetrics {
  // Totales generales
  total_vendido: number
  total_abonado: number
  total_restante: number
  // Semana actual
  semana_vendido: number
  semana_abonado: number
  semana_clientes: number
  // Conteos por estatus
  por_estatus: Record<EstatusCliente, number>
  // Proyectos por entregar (con semáforo)
  proyectos_pendientes: ClientConSemaforo[]
  // Actividad del día
  actividad_hoy: ActivityLog[]
  // Contrataciones del día
  contrataciones_hoy: number
  // Liquidaciones entregadas
  liquidaciones_hoy: number
}

export interface ClientConSemaforo extends Client {
  semaforo: ColorSemaforo
  dias_restantes: number
}

// ============================================================
// Filtros
// ============================================================
export interface FiltroFechas {
  tipo: 'hoy' | 'semana' | 'quincena' | 'mes' | 'personalizado'
  fecha_inicio?: string
  fecha_fin?: string
}

export interface FiltroClientes {
  estatus?: EstatusCliente | 'todos'
  tipo_paquete?: TipoPaquete | 'todos'
  semaforo?: ColorSemaforo | 'todos'
  busqueda?: string
}

// ============================================================
// Forms (react-hook-form)
// ============================================================
export interface ClienteFormData {
  codigo: string
  nombre_negocio: string
  nombre_contacto: string
  telefono: string
  email: string
  tipo_paquete: TipoPaquete
  mixto_detalle: string
  precio_total: number
  abono: number
  estatus: EstatusCliente
  fecha_entrega: string
  tipo_proyecto: string[]
}

export interface BriefFormData {
  concepto: string
  colores_gusto: string
  colores_evitar: string
  estilo: string
  referencias: string
  giro_negocio: string
  publico_objetivo: string
  tono_comunicacion: string
  temas_contenido: string
  frecuencia_posts: string
  notas_adicionales: string
  instrucciones_disenador: string
}

export interface MovimientoFormData {
  tipo: TipoMovimiento
  concepto: string
  monto: number
  fecha: string
  client_id: string
  es_abono: boolean
  categoria: string
}
