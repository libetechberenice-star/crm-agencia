'use client'
import { useState } from 'react'
import { Lock, Loader2, X } from 'lucide-react'

interface PinModalProps {
  open: boolean
  titulo: string
  descripcion: string
  onConfirm: (pin: string) => Promise<void>
  onClose: () => void
  loading?: boolean
}

export default function PinModal({ open, titulo, descripcion, onConfirm, onClose, loading }: PinModalProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pin) return
    setError('')
    setWorking(true)
    try {
      await onConfirm(pin)
      setPin('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'PIN incorrecto')
    } finally {
      setWorking(false)
    }
  }

  function handleClose() {
    setPin('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{titulo}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{descripcion}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              PIN de administrador
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              maxLength={10}
              placeholder="••••••"
              autoFocus
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!pin || working || loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {(working || loading) && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar eliminación
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
