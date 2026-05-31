import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, PAQUETE_LABELS, PAQUETE_CLASES } from '@/lib/utils'
import { enrichClientWithSemaforo, SEMAFORO_CLASES, SEMAFORO_DOT } from '@/lib/semaforo'
import { Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProyectosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: perfil } = await supabase.from('profiles').select('rol').eq('id', user!.id).single()

  const { data: clients } = await supabase
    .from('clients')
    .select('*, project_briefs(id, instrucciones_disenador, concepto, imagenes_referencia)')
    .eq('activo', true)
    .neq('estatus', 'pago_completo')
    .not('fecha_entrega', 'is', null)
    .order('fecha_entrega', { ascending: true })

  const enriched = (clients ?? []).map(enrichClientWithSemaforo)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Proyectos a entregar</h1>
        <p className="text-slate-500 text-sm mt-0.5">Ordenados por fecha de entrega más próxima</p>
      </div>

      <div className="space-y-3">
        {enriched.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-400">Sin proyectos pendientes — ¡todo entregado! 🎉</p>
          </div>
        )}
        {enriched.map(c => {
          const brief = (c as typeof c & { project_briefs?: Array<{ instrucciones_disenador: string; concepto: string; imagenes_referencia: string[] }> }).project_briefs?.[0]
          return (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-4 p-4">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${SEMAFORO_DOT[c.semaforo]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800">{c.nombre_negocio}</h3>
                    <span className="text-xs text-slate-400 font-mono">{c.codigo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${PAQUETE_CLASES[c.tipo_paquete]}`}>
                      {PAQUETE_LABELS[c.tipo_paquete]}
                    </span>
                  </div>
                  {brief?.instrucciones_disenador && (
                    <p className="text-sm text-amber-700 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-1.5 mt-2 line-clamp-2">
                      📌 {brief.instrucciones_disenador}
                    </p>
                  )}
                  {!brief?.instrucciones_disenador && brief?.concepto && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{brief.concepto}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className={`text-sm font-medium px-2.5 py-1.5 rounded-full border ${SEMAFORO_CLASES[c.semaforo]}`}>
                      {c.dias_restantes > 0 ? `${c.dias_restantes}d` : c.dias_restantes === 0 ? 'Hoy' : `${Math.abs(c.dias_restantes)}d atrasado`}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(c.fecha_entrega)}</p>
                  </div>
                  <Link
                    href={`/clientes/${c.id}`}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Ver expediente completo"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
