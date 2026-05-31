import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, CATEGORIAS_GASTO } from '@/lib/utils'
import { getRangoPorFiltro } from '@/lib/semaforo'
import FinanzasFilters from '@/components/finanzas/FinanzasFilters'
import NuevoMovimientoBtn from '@/components/finanzas/NuevoMovimientoBtn'
import type { Movement } from '@/types'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: { filtro?: string; inicio?: string; fin?: string; tipo?: string }
}) {
  const supabase = createClient()
  const filtro = searchParams.filtro ?? 'mes'
  const { inicio, fin } = getRangoPorFiltro(filtro, searchParams.inicio, searchParams.fin)

  let query = supabase
    .from('movements')
    .select('*, clients(nombre_negocio, codigo), profiles(nombre)')
    .eq('activo', true)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (inicio && fin) query = query.gte('fecha', inicio).lte('fecha', fin)
  if (searchParams.tipo && searchParams.tipo !== 'todos') query = query.eq('tipo', searchParams.tipo)

  const { data: movements } = await query
  const movs = (movements ?? []) as Movement[]

  const ingresos = movs.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0)
  const gastos   = movs.filter(m => m.tipo === 'gasto').reduce((s, m) => s + Number(m.monto), 0)
  const utilidad = ingresos - gastos

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Finanzas</h1>
          <p className="text-slate-500 text-sm mt-0.5">{movs.length} movimientos</p>
        </div>
        <NuevoMovimientoBtn />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium uppercase">Ingresos</p>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(ingresos)}</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-red-500 font-medium uppercase">Gastos</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(gastos)}</p>
          </div>
        </div>
        <div className={`${utilidad >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'} rounded-xl border p-5 flex items-center gap-4`}>
          <div className={`w-10 h-10 ${utilidad >= 0 ? 'bg-indigo-100' : 'bg-red-100'} rounded-xl flex items-center justify-center`}>
            <DollarSign className={`w-5 h-5 ${utilidad >= 0 ? 'text-indigo-600' : 'text-red-500'}`} />
          </div>
          <div>
            <p className={`text-xs font-medium uppercase ${utilidad >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>Utilidad neta</p>
            <p className={`text-xl font-bold ${utilidad >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>{formatCurrency(utilidad)}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <FinanzasFilters filtroActual={filtro} tipoActual={searchParams.tipo ?? 'todos'} />

      {/* Tabla de movimientos */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Fecha</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Concepto</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Categoría</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {movs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">Sin movimientos en este período</td>
              </tr>
            )}
            {movs.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{formatDate(m.fecha)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{m.concepto}</p>
                  {m.es_abono && <span className="text-xs text-indigo-500 font-medium">Abono de cliente</span>}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {(m as Movement & { clients?: { nombre_negocio: string } }).clients?.nombre_negocio ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-500">{m.categoria ?? '—'}</td>
                <td className={`px-5 py-3 text-right font-semibold whitespace-nowrap ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {m.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(m.monto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
