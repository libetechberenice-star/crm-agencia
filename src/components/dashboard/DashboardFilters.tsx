'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const FILTROS = [
  { key: 'hoy',      label: 'Hoy' },
  { key: 'semana',   label: 'Semana' },
  { key: 'quincena', label: 'Quincena' },
  { key: 'mes',      label: 'Mes' },
]

export default function DashboardFilters({ filtroActual }: { filtroActual: string }) {
  const router = useRouter()
  return (
    <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1">
      {FILTROS.map(f => (
        <button
          key={f.key}
          onClick={() => router.push(`/dashboard?filtro=${f.key}`)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            filtroActual === f.key
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
