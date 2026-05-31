import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { tipo, concepto, monto, fecha, client_id, es_abono, categoria } = body

  const { data, error } = await supabase.from('movements').insert({
    tipo, concepto, monto, fecha,
    client_id: client_id || null,
    es_abono: es_abono ?? false,
    categoria: categoria || null,
    registrado_por: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log actividad
  await supabase.from('activity_log').insert({
    tipo: tipo === 'ingreso' ? 'abono' : 'gasto',
    descripcion: `${tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}: ${concepto}`,
    monto,
    client_id: client_id || null,
    usuario_id: user.id,
  })

  return NextResponse.json(data, { status: 201 })
}
