import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EstatusCliente, TipoPaquete } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(date))
}

export const ESTATUS_LABELS: Record<EstatusCliente, string> = {
  anticipo:            'Anticipo',
  propuestas_enviadas: 'Propuestas enviadas',
  pendiente_pago:      'Pendiente de pago',
  pago_completo:       'Pago completo ✓',
}

export const ESTATUS_CLASES: Record<EstatusCliente, string> = {
  anticipo:            'bg-blue-100    text-blue-800   border-blue-200',
  propuestas_enviadas: 'bg-purple-100  text-purple-800 border-purple-200',
  pendiente_pago:      'bg-orange-100  text-orange-800 border-orange-200',
  pago_completo:       'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export const PAQUETE_LABELS: Record<TipoPaquete, string> = {
  basico:   'Básico',
  estandar: 'Estándar',
  mixto:    'Mixto',
}

export const PAQUETE_CLASES: Record<TipoPaquete, string> = {
  basico:   'bg-slate-100   text-slate-700',
  estandar: 'bg-indigo-100  text-indigo-700',
  mixto:    'bg-amber-100   text-amber-700',
}

export const TIPO_PROYECTO_LABELS: Record<string, string> = {
  logo:      'Logotipo',
  redes:     'Redes sociales',
  web:       'Página web',
  impresion: 'Impresión',
}

export const CATEGORIAS_GASTO = [
  'Renta',
  'Servicios (luz, internet, agua)',
  'Sueldos',
  'Publicidad',
  'Software / herramientas',
  'Equipo / hardware',
  'Papelería / insumos',
  'Viáticos',
  'Comisiones',
  'Otros',
]
