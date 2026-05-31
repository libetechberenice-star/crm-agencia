import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Calendar, Phone, Mail, Package } from 'lucide-react'
import { formatCurrency, formatDate, ESTATUS_LABELS, ESTATUS_CLASES, PAQUETE_LABELS, cn } from '@/lib/utils'
import { enrichClientWithSemaforo, SEMAFORO_CLASES } from '@/lib/semaforo'
import type { Client, ProjectBrief } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('*, project_briefs(*)')
    .eq('id', params.id)
    .single()

  if (!client || !client.activo) notFound()

  const enriched = enrichClientWithSemaforo(client as Client)
  const brief: ProjectBrief | null = client.project_briefs?.[0] ?? null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/clientes" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs text-slate-400 font-mono">{client.codigo}</p>
            <h1 className="text-2xl font-bold text-slate-800">{client.nombre_negocio}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${ESTATUS_CLASES[client.estatus]}`}>
            {ESTATUS_LABELS[client.estatus]}
          </span>
          <Link
            href={`/clientes/${params.id}/editar`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          {/* Datos del cliente */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide text-slate-500">Datos del cliente</h2>
            {client.nombre_contacto && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-slate-400">👤</span> {client.nombre_contacto}
              </div>
            )}
            {client.telefono && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" /> {client.telefono}
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" /> {client.email}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{PAQUETE_LABELS[client.tipo_paquete]}</span>
            </div>
            {client.fecha_entrega && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs border ${SEMAFORO_CLASES[enriched.semaforo]}`}>
                  {formatDate(client.fecha_entrega)}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-400">Registrado: {formatDate(client.fecha_registro)}</p>
          </div>

          {/* Financiero */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-500 text-sm uppercase tracking-wide">Financiero</h2>
            <div className="space-y-2">
              <Row label="Precio total" value={formatCurrency(client.precio_total)} />
              <Row label="Abonado" value={formatCurrency(client.abono)} color="text-emerald-600" />
              <Row label="Restante" value={formatCurrency(client.restante ?? 0)} color="text-amber-600" />
            </div>
            {client.tipo_paquete === 'mixto' && client.mixto_detalle && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Detalle paquete mixto</p>
                <p className="text-sm text-slate-700">{client.mixto_detalle}</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: Brief del diseñador */}
        <div className="lg:col-span-2 space-y-4">
          {brief ? (
            <>
              {/* Brief principal */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✏️</span>
                  <h2 className="font-bold text-indigo-800">Brief del diseñador</h2>
                </div>

                {brief.instrucciones_disenador && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">📌 Instrucciones directas</p>
                    <p className="text-sm text-yellow-900 leading-relaxed">{brief.instrucciones_disenador}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {brief.concepto && <BriefField label="Concepto / objetivo" value={brief.concepto} />}
                  {brief.giro_negocio && <BriefField label="Giro del negocio" value={brief.giro_negocio} />}
                  {brief.publico_objetivo && <BriefField label="Público objetivo" value={brief.publico_objetivo} />}
                  {brief.estilo && <BriefField label="Estilo de diseño" value={brief.estilo} />}
                  {brief.colores_gusto && <BriefField label="✅ Colores que gustan" value={brief.colores_gusto} />}
                  {brief.colores_evitar && <BriefField label="❌ Colores a evitar" value={brief.colores_evitar} />}
                  {brief.referencias && <BriefField label="Referencias / inspiración" value={brief.referencias} />}
                  {brief.tono_comunicacion && <BriefField label="Tono de comunicación" value={brief.tono_comunicacion} />}
                  {brief.temas_contenido && <BriefField label="Temas de contenido" value={brief.temas_contenido} />}
                  {brief.frecuencia_posts && <BriefField label="Frecuencia de posts" value={brief.frecuencia_posts} />}
                  {brief.notas_adicionales && <BriefField label="Notas adicionales" value={brief.notas_adicionales} className="sm:col-span-2" />}
                </div>
              </div>

              {/* Imágenes de referencia */}
              {brief.imagenes_referencia && brief.imagenes_referencia.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-700 mb-3 text-sm">🖼️ Imágenes de referencia del cliente</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {brief.imagenes_referencia.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity">
                        <img src={url} alt={`Referencia ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-slate-400 text-sm">Sin brief capturado</p>
              <Link
                href={`/clientes/${params.id}/editar`}
                className="text-indigo-600 text-sm font-medium hover:underline mt-1 inline-block"
              >
                Agregar brief →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={cn('font-semibold text-slate-800', color)}>{value}</span>
    </div>
  )
}

function BriefField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
    </div>
  )
}
