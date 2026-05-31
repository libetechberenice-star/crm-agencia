'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { CATEGORIAS_GASTO } from '@/lib/utils'

export default function NuevoMovimientoBtn() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('ingreso')
  const [form, setForm] = useState({
    concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0],
    categoria: '', es_abono: false, client_id: '',
  })
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/finances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tipo, monto: Number(form.monto) }),
    })
    setLoading(false)
    setOpen(false)
    setForm({ concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0], categoria: '', es_abono: false, client_id: '' })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
        <Plus className="w-4 h-4" /> Registrar movimiento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800">Nuevo movimiento</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2">
                {(['ingreso', 'gasto'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setTipo(t)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                      tipo === t
                        ? t === 'ingreso' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-400 bg-red-50 text-red-600'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>{t === 'ingreso' ? 'Ingreso' : 'Gasto'}</button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Concepto *</label>
                <input required value={form.concepto} onChange={e => setForm(p => ({ ...p, concepto: e.target.value }))}
                  placeholder="Ej. Pago diseño logo Tacos El Güero"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monto *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input required type="number" min="0.01" step="0.01" value={form.monto}
                      onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {tipo === 'gasto' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Sin categoría</option>
                    {CATEGORIAS_GASTO.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {tipo === 'ingreso' && (
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.es_abono}
                    onChange={e => setForm(p => ({ ...p, es_abono: e.target.checked }))}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  Es abono de cliente
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
