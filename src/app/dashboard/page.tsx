import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, ESTATUS_LABELS, ESTATUS_CLASES } from '@/lib/utils'
import { enrichClientWithSemaforo, SEMAFORO_CLASES, SEMAFORO_DOT } from '@/lib/semaforo'
import { getRangoPorFiltro } from '@/lib/semaforo'
import {
  TrendingUp, DollarSign, Clock, CheckCircle2,
  Users, AlertTriangle, ArrowUpRight, Calendar
} from 'lucide-react'
import type { Client, ActivityLog } from '@/types'
import DashboardFilters from '@/components/dashboard/DashboardFilters'

export const dynamic = 'force-dynamic'

async function getDashboardData(filtro: string) {
  const supabase = createClient()
  const { inicio, fin } = getRangoPorFiltro(filtro)

  // Clientes activos
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  // Movimientos del período
  const movQ = supabase.from('movements').select('*').eq('activo', true)
  if (inicio && fin) movQ.gte('fecha', inicio).lte('fecha', fin)
  const { data: movements } = await movQ

  // Actividad de hoy
  const hoy = new Date().toISOString().split('T')[0]
  const { data: actividadHoy } = await supabase
    .from('activity_log')
    .select('*, clients(nombre_negocio, codigo)')
    .gte('fecha', hoy + 'T00:00:00')
    .lte('fecha', hoy + 'T23:59:59')
    .order('fecha', { ascending: false })
    .limit(20)

  // Cortes semanales
  const { data: cortes } = await supabase
    .from('weekly_cuts')
    .select('*')
    .order('semana_inicio', { ascending: false })
    .limit(8)

  return { clients: clients ?? [], movements: movements ?? [], actividadHoy: actividadHoy ?? [], cortes: cortes ?? [] }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { filtro?: string }
}) {
  const filtro = searchParams.filtro ?? 'semana'
  const { clients, movements, actividadHoy, cortes } = await getDashboardData(filtro)

  // Métricas
  const totalVendido   = clients.reduce((s, c) => s + Number(c.precio_total), 0)
  const totalAbonado   = clients.reduce((s, c) => s + Number(c.abono), 0)
  const totalRestante  = clients.reduce((s, c) => s + Number(c.restante ?? 0), 0)
  const totalIngresos  = movements.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0)
  const totalGastos    = movements.filter(m => m.tipo === 'gasto').reduce((s, m) => s + Number(m.monto), 0)

  // Clientes con semáforo
  const clientesConSemaforo = clients
    .filter(c => c.estatus !== 'pago_completo' && c.fecha_entrega)
    .map(enrichClientWithSemaforo)
    .sort((a, b) => a.dias_restantes - b.dias_restantes)
    .slice(0, 10)

  const hoy = new Date().toISOString().split('T')[0]
  const clientesHoy = clients.filter(c => c.created_at?.startsWith(hoy)).length
  const liquidacionesHoy = clients.filter(c => c.fecha_pago?.startsWith(hoy)).length

  const TIPO_ICONO: Record<string, string> = {
    contratacion: '🤝', abono: '💰', entrega: '📦',
    liquidacion: '✅', gasto: '💸', cambio_estatus: '🔄',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <DashboardFilters filtroActual={filtro} />
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total vendido"
          value={formatCurrency(totalVendido)}
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          bg="bg-indigo-50"
          sub={`${clients.length} clientes activos`}
        />
        <MetricCard
          label="Total abonado"
          value={formatCurrency(totalAbonado)}
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          bg="bg-emerald-50"
          sub={`${((totalAbonado / totalVendido) * 100 || 0).toFixed(0)}% cobrado`}
        />
        <MetricCard
          label="Restante por cobrar"
          value={formatCurrency(totalRestante)}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          bg="bg-amber-50"
          sub="Pendiente de clientes"
        />
        <MetricCard
          label="Hoy"
          value={`${clientesHoy} nuevos`}
          icon={<Users className="w-5 h-5 text-purple-500" />}
          bg="bg-purple-50"
          sub={`${liquidacionesHoy} liquidaciones`}
        />
      </div>

      {/* Segunda fila: Ingresos/Gastos del período */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Ingresos del período</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIngresos)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Gastos del período</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(totalGastos)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Utilidad neta</p>
          <p className={`text-2xl font-bold ${totalIngresos - totalGastos >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            {formatCurrency(totalIngresos - totalGastos)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proyectos a entregar */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Proyectos a entregar
            </h2>
            <span className="text-xs text-slate-400">{clientesConSemaforo.length} pendientes</span>
          </div>
          <div className="divide-y divide-slate-50">
            {clientesConSemaforo.length === 0 && (
              <p className="text-center text-slate-400 py-8 text-sm">Sin proyectos pendientes</p>
            )}
            {clientesConSemaforo.map(c => {
              const { color, dias, etiqueta } = { color: c.semaforo, dias: c.dias_restantes, etiqueta: c.dias_restantes > 1 ? `${c.dias_restantes} días` : c.dias_restantes === 1 ? '1 día' : c.dias_restantes === 0 ? 'Hoy' : `${Math.abs(c.dias_restantes)}d atrasado` }
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SEMAFORO_DOT[color]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.nombre_negocio}</p>
                    <p className="text-xs text-slate-400">{c.codigo} · {formatDate(c.fecha_entrega)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${SEMAFORO_CLASES[color]}`}>
                    {etiqueta}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actividad del día */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
              Movimientos de hoy
            </h2>
            <span className="text-xs text-slate-400">{actividadHoy.length} eventos</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {actividadHoy.length === 0 && (
              <p className="text-center text-slate-400 py-8 text-sm">Sin actividad hoy</p>
            )}
            {actividadHoy.map((a: ActivityLog & { clients?: { nombre_negocio: string; codigo: string } }) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                <span className="text-lg leading-none mt-0.5">{TIPO_ICONO[a.tipo] ?? '•'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{a.descripcion}</p>
                  {a.clients && (
                    <p className="text-xs text-slate-400 mt-0.5">{a.clients.nombre_negocio}</p>
                  )}
                </div>
                {a.monto && (
                  <span className="text-sm font-semibold text-slate-700 flex-shrink-0">
                    {formatCurrency(a.monto)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historial semanal */}
      {cortes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Historial semanal</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Semana</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Vendido</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Abonado</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Gastos</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Utilidad</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Clientes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cortes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-600">
                      Sem. {c.semana_numero} — {formatDate(c.semana_inicio)} al {formatDate(c.semana_fin)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(c.total_vendido)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(c.total_abonado)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{formatCurrency(c.total_gastos)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${c.utilidad_neta >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                      {formatCurrency(c.utilidad_neta)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{c.num_clientes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon, bg, sub }: {
  label: string; value: string; icon: React.ReactNode; bg: string; sub: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}
