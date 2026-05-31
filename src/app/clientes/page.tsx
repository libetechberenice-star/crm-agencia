import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatCurrency, formatDate, ESTATUS_LABELS, ESTATUS_CLASES, PAQUETE_LABELS, PAQUETE_CLASES } from '@/lib/utils'
import { enrichClientWithSemaforo, SEMAFORO_DOT } from '@/lib/semaforo'
import ClientesGrid from '@/components/clientes/ClientesGrid'
import type { Client } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { estatus?: string; paquete?: string; q?: string; semaforo?: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from('clients')
    .select('*, project_briefs(id)')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (searchParams.estatus && searchParams.estatus !== 'todos') {
    query = query.eq('estatus', searchParams.estatus)
  }
  if (searchParams.paquete && searchParams.paquete !== 'todos') {
    query = query.eq('tipo_paquete', searchParams.paquete)
  }
  if (searchParams.q) {
    query = query.or(
      `nombre_negocio.ilike.%${searchParams.q}%,codigo.ilike.%${searchParams.q}%`
    )
  }

  const { data: clients } = await query
  const clientesEnriquecidos = (clients ?? []).map(enrichClientWithSemaforo)

  // Filtro de semáforo (se hace en memoria porque es calculado)
  const filtrados = searchParams.semaforo && searchParams.semaforo !== 'todos'
    ? clientesEnriquecidos.filter(c => c.semaforo === searchParams.semaforo)
    : clientesEnriquecidos

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtrados.length} proyectos</p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </Link>
      </div>

      <ClientesGrid clientes={filtrados} filtros={searchParams} />
    </div>
  )
}
