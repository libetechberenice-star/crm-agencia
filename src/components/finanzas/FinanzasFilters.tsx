'use client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const FILTROS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'quincena', label: 'Quincena' },
  { key: 'mes', label: 'Mes' },
  { key: 'personalizado', label: 'Personalizado' },
]

const TIPOS = [
  { key: 'todos', label: 'Todos' },
  { key: 'ingreso', label: 'Ingresos' },
  { key: 'gasto', label: 'Gastos' },
]

export default function FinanzasFilters({
  filtroActual, tipoActual,
}: { filtroActual: string; tipoActual: string }) {
  const router = useRouter()
  function navigate(overrides: Record<string, string>) {
    const params = new URLSearchParams({ filtro: filtroActual, tipo: tipoActual, ...overrides })
    router.push('/finanzas?' + params.toString())
  }

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {FILTROS.map(f => (
          <button key={f.key} onClick={() => navigate({ filtro: f.key })}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              filtroActual === f.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}>{f.label}</button>
        ))}
      </div>
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {TIPOS.map(t => (
          <button key={t.key} onClick={() => navigate({ tipo: t.key })}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              tipoActual === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}>{t.label}</button>
        ))}
      </div>
    </div>
  )
}
