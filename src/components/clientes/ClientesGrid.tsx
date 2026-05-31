'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, Edit2, Eye, Trash2, FileText } from 'lucide-react'
import {
  formatCurrency, formatDate, cn,
  ESTATUS_LABELS, ESTATUS_CLASES,
  PAQUETE_LABELS, PAQUETE_CLASES,
} from '@/lib/utils'
import { SEMAFORO_DOT, SEMAFORO_CLASES } from '@/lib/semaforo'
import type { ClientConSemaforo, EstatusCliente, TipoPaquete, ColorSemaforo } from '@/types'
import PinModal from '@/components/ui/PinModal'

const ESTATUS_OPTIONS = [
  { value: 'todos', label: 'Todos los estatus' },
  { value: 'anticipo', label: 'Anticipo' },
  { value: 'propuestas_enviadas', label: 'Propuestas enviadas' },
  { value: 'pendiente_pago', label: 'Pendiente de pago' },
  { value: 'pago_completo', label: 'Pago completo' },
]
const PAQUETE_OPTIONS = [
  { value: 'todos', label: 'Todos los paquetes' },
  { value: 'basico', label: 'Básico' },
  { value: 'estandar', label: 'Estándar' },
  { value: 'mixto', label: 'Mixto' },
]
const SEMAFORO_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'verde', label: '🟢 En tiempo' },
  { value: 'amarillo', label: '🟡 1 día' },
  { value: 'naranja', label: '🟠 Hoy' },
  { value: 'rojo', label: '🔴 Atrasado' },
]

export default function ClientesGrid({
  clientes,
  filtros,
}: {
  clientes: ClientConSemaforo[]
  filtros: { estatus?: string; paquete?: string; q?: string; semaforo?: string }
}) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState(filtros.q ?? '')
  const [estatus, setEstatus] = useState(filtros.estatus ?? 'todos')
  const [paquete, setPaquete] = useState(filtros.paquete ?? 'todos')
  const [semaforo, setSemaforo] = useState(filtros.semaforo ?? 'todos')
  const [pinModal, setPinModal] = useState<{ open: boolean; clientId: string; nombre: string }>({
    open: false, clientId: '', nombre: '',
  })
  const [deleting, setDeleting] = useState(false)

  function applyFilters(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams()
    const vals = { q: busqueda, estatus, paquete, semaforo, ...overrides }
    Object.entries(vals).forEach(([k, v]) => { if (v && v !== 'todos' && v !== '') params.set(k, v) })
    router.push('/clientes?' + params.toString())
  }

  async function handleDelete(pin: string) {
    setDeleting(true)
    const res = await fetch('/api/clients/' + pinModal.clientId, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    setDeleting(false)
    if (res.ok) {
      setPinModal({ open: false, clientId: '', nombre: '' })
      router.refresh()
    } else {
      const d = await res.json()
      throw new Error(d.error ?? 'PIN incorrecto')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={estatus}
            onChange={e => { setEstatus(e.target.value); applyFilters({ estatus: e.target.value }) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ESTATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={paquete}
            onChange={e => { setPaquete(e.target.value); applyFilters({ paquete: e.target.value }) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {PAQUETE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={semaforo}
            onChange={e => { setSemaforo(e.target.value); applyFilters({ semaforo: e.target.value }) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SEMAFORO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => applyFilters()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Grid de tarjetas */}
      {clientes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-400">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clientes.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => router.push('/clientes/' + c.id)}
            >
              {/* Header tarjeta */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-mono">{c.codigo}</p>
                    <h3 className="font-semibold text-slate-800 truncate mt-0.5">{c.nombre_negocio}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {c.fecha_entrega && (
                      <div className={`w-2 h-2 rounded-full ${SEMAFORO_DOT[c.semaforo]}`} />
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ESTATUS_CLASES[c.estatus]}`}>
                      {ESTATUS_LABELS[c.estatus]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${PAQUETE_CLASES[c.tipo_paquete]}`}>
                    {PAQUETE_LABELS[c.tipo_paquete]}
                  </span>
                  {c.fecha_entrega && (
                    <span className={`text-xs px-2 py-1 rounded-full border ${SEMAFORO_CLASES[c.semaforo]}`}>
                      {c.dias_restantes > 0 ? `${c.dias_restantes}d` : c.dias_restantes === 0 ? 'Hoy' : `${Math.abs(c.dias_restantes)}d atrasado`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-sm font-semibold text-slate-800">{formatCurrency(c.precio_total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Abonado</p>
                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(c.abono)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Restante</p>
                    <p className="text-sm font-semibold text-amber-600">{formatCurrency(c.restante ?? 0)}</p>
                  </div>
                </div>

                {c.fecha_entrega && (
                  <p className="text-xs text-slate-400">📅 Entrega: {formatDate(c.fecha_entrega)}</p>
                )}
              </div>

              {/* Acciones — aparecen al hover */}
              <div
                className="flex items-center gap-1 px-4 py-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                <Link
                  href={`/clientes/${c.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Consultar
                </Link>
                <Link
                  href={`/clientes/${c.id}/editar`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </Link>
                <button
                  onClick={() => setPinModal({ open: true, clientId: c.id, nombre: c.nombre_negocio })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal PIN */}
      <PinModal
        open={pinModal.open}
        titulo={`Eliminar cliente: ${pinModal.nombre}`}
        descripcion="Esta acción es irreversible. Ingresa el PIN de administrador para continuar."
        onConfirm={handleDelete}
        onClose={() => setPinModal({ open: false, clientId: '', nombre: '' })}
        loading={deleting}
      />
    </div>
  )
}
