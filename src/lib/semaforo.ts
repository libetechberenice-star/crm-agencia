import { differenceInDays, parseISO, isValid } from 'date-fns'
import type { ColorSemaforo, Client, ClientConSemaforo } from '@/types'

/**
 * Calcula el color del semáforo según la fecha de entrega
 * Verde   → más de 1 día restante
 * Amarillo → exactamente 1 día restante
 * Naranja  → mismo día (0 días)
 * Rojo     → fecha pasada (atrasado)
 */
export function calcularSemaforo(fechaEntrega: string | null): {
  color: ColorSemaforo
  dias: number
  etiqueta: string
} {
  if (!fechaEntrega) return { color: 'verde', dias: 999, etiqueta: 'Sin fecha' }

  const fecha = parseISO(fechaEntrega)
  if (!isValid(fecha)) return { color: 'verde', dias: 999, etiqueta: 'Sin fecha' }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dias = differenceInDays(fecha, hoy)

  if (dias > 1)  return { color: 'verde',    dias, etiqueta: `${dias} días` }
  if (dias === 1) return { color: 'amarillo', dias, etiqueta: '1 día' }
  if (dias === 0) return { color: 'naranja',  dias, etiqueta: 'Hoy' }
  return { color: 'rojo', dias, etiqueta: `${Math.abs(dias)} días atrasado` }
}

export const SEMAFORO_CLASES: Record<ColorSemaforo, string> = {
  verde:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  amarillo: 'bg-yellow-100  text-yellow-800  border-yellow-200',
  naranja:  'bg-orange-100  text-orange-800  border-orange-200',
  rojo:     'bg-red-100     text-red-800     border-red-200',
}

export const SEMAFORO_DOT: Record<ColorSemaforo, string> = {
  verde:    'bg-emerald-500',
  amarillo: 'bg-yellow-500',
  naranja:  'bg-orange-500',
  rojo:     'bg-red-500',
}

export function enrichClientWithSemaforo(client: Client): ClientConSemaforo {
  const { color, dias } = calcularSemaforo(client.fecha_entrega)
  return { ...client, semaforo: color, dias_restantes: dias }
}

export function enrichClientsWithSemaforo(clients: Client[]): ClientConSemaforo[] {
  return clients.map(enrichClientWithSemaforo)
}

/**
 * Devuelve el rango de fechas según el tipo de filtro
 */
export function getRangoPorFiltro(tipo: string, inicio?: string, fin?: string) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  switch (tipo) {
    case 'hoy': {
      const f = hoy.toISOString().split('T')[0]
      return { inicio: f, fin: f }
    }
    case 'semana': {
      const lunes = new Date(hoy)
      lunes.setDate(hoy.getDate() - hoy.getDay() + 1)
      const domingo = new Date(lunes)
      domingo.setDate(lunes.getDate() + 6)
      return {
        inicio: lunes.toISOString().split('T')[0],
        fin: domingo.toISOString().split('T')[0],
      }
    }
    case 'quincena': {
      const dia = hoy.getDate()
      const inicioQ = new Date(hoy.getFullYear(), hoy.getMonth(), dia <= 15 ? 1 : 16)
      const finQ = dia <= 15
        ? new Date(hoy.getFullYear(), hoy.getMonth(), 15)
        : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      return {
        inicio: inicioQ.toISOString().split('T')[0],
        fin: finQ.toISOString().split('T')[0],
      }
    }
    case 'mes': {
      const inicioM = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const finM = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      return {
        inicio: inicioM.toISOString().split('T')[0],
        fin: finM.toISOString().split('T')[0],
      }
    }
    case 'personalizado':
      return { inicio: inicio ?? '', fin: fin ?? '' }
    default:
      return { inicio: '', fin: '' }
  }
}
