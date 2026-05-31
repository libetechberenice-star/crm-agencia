'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, KeyRound, UserCheck, UserX } from 'lucide-react'
import type { Profile } from '@/types'

const ROL_LABELS = { admin: 'Administrador', vendedora: 'Vendedora', disenador: 'Diseñador' }
const ROL_CLASES = {
  admin:     'bg-purple-100 text-purple-700',
  vendedora: 'bg-indigo-100 text-indigo-700',
  disenador: 'bg-teal-100   text-teal-700',
}

export default function AccesosClient({ usuarios }: { usuarios: Profile[] }) {
  const router = useRouter()
  const [showNuevo, setShowNuevo] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', nombre: '', password: '', rol: 'vendedora' as Profile['rol'] })
  const [pinForm, setPinForm] = useState({ pinActual: '', pinNuevo: '', pinConfirm: '' })

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Error al crear usuario')
      return
    }
    setShowNuevo(false)
    setForm({ email: '', nombre: '', password: '', rol: 'vendedora' })
    router.refresh()
  }

  async function cambiarPin(e: React.FormEvent) {
    e.preventDefault()
    if (pinForm.pinNuevo !== pinForm.pinConfirm) { setError('Los PINs no coinciden'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/users/pin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinActual: pinForm.pinActual, pinNuevo: pinForm.pinNuevo }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); setError(d.error); return }
    setShowPin(false)
    setPinForm({ pinActual: '', pinNuevo: '', pinConfirm: '' })
    alert('PIN actualizado correctamente')
  }

  return (
    <div className="space-y-4">
      {/* Acciones */}
      <div className="flex gap-3">
        <button onClick={() => { setShowNuevo(true); setError('') }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
        <button onClick={() => { setShowPin(true); setError('') }}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
          <KeyRound className="w-4 h-4" /> Cambiar PIN
        </button>
      </div>

      {/* Lista usuarios */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {usuarios.map(u => (
          <div key={u.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 text-sm font-semibold">{u.nombre.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{u.nombre}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROL_CLASES[u.rol]}`}>
              {ROL_LABELS[u.rol]}
            </span>
            {u.activo
              ? <UserCheck className="w-4 h-4 text-emerald-500" />
              : <UserX className="w-4 h-4 text-slate-300" />
            }
          </div>
        ))}
      </div>

      {/* Modal nuevo usuario */}
      {showNuevo && (
        <Modal titulo="Nuevo usuario" onClose={() => setShowNuevo(false)}>
          <form onSubmit={crearUsuario} className="space-y-4">
            <Field label="Nombre">
              <input required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ana García" className={inp} />
            </Field>
            <Field label="Correo electrónico">
              <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="ana@agencia.com" className={inp} />
            </Field>
            <Field label="Contraseña temporal">
              <input required type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 caracteres" className={inp} />
            </Field>
            <Field label="Rol">
              <select value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value as Profile['rol'] }))} className={inp}>
                <option value="vendedora">Vendedora</option>
                <option value="disenador">Diseñador</option>
                <option value="admin">Administrador</option>
              </select>
            </Field>
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <Btns loading={loading} onCancel={() => setShowNuevo(false)} label="Crear usuario" />
          </form>
        </Modal>
      )}

      {/* Modal cambiar PIN */}
      {showPin && (
        <Modal titulo="Cambiar PIN de administrador" onClose={() => setShowPin(false)}>
          <form onSubmit={cambiarPin} className="space-y-4">
            <Field label="PIN actual">
              <input required type="password" value={pinForm.pinActual} onChange={e => setPinForm(p => ({ ...p, pinActual: e.target.value }))}
                maxLength={10} placeholder="••••••" className={`${inp} text-center tracking-widest text-lg`} />
            </Field>
            <Field label="Nuevo PIN">
              <input required type="password" value={pinForm.pinNuevo} onChange={e => setPinForm(p => ({ ...p, pinNuevo: e.target.value }))}
                maxLength={10} placeholder="••••••" className={`${inp} text-center tracking-widest text-lg`} />
            </Field>
            <Field label="Confirmar nuevo PIN">
              <input required type="password" value={pinForm.pinConfirm} onChange={e => setPinForm(p => ({ ...p, pinConfirm: e.target.value }))}
                maxLength={10} placeholder="••••••" className={`${inp} text-center tracking-widest text-lg`} />
            </Field>
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <Btns loading={loading} onCancel={() => setShowPin(false)} label="Actualizar PIN" />
          </form>
        </Modal>
      )}
    </div>
  )
}

const inp = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800">{titulo}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Btns({ loading, onCancel, label }: { loading: boolean; onCancel: () => void; label: string }) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
        Cancelar
      </button>
      <button type="submit" disabled={loading}
        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {label}
      </button>
    </div>
  )
}
