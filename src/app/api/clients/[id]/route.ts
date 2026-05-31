import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, project_briefs(*)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const {
    // Brief fields
    concepto, colores_gusto, colores_evitar, estilo, referencias,
    giro_negocio, publico_objetivo, tono_comunicacion, temas_contenido,
    frecuencia_posts, notas_adicionales, instrucciones_disenador,
    imagenes_referencia,
    // Client fields (el resto)
    ...clientFields
  } = body

  // Detectar si es pago completo
  const previo = await supabase.from('clients').select('estatus').eq('id', params.id).single()
  const esPagoCompleto = clientFields.estatus === 'pago_completo' && previo.data?.estatus !== 'pago_completo'

  // Actualizar cliente
  const updateData = { ...clientFields }
  if (esPagoCompleto) updateData.fecha_pago = new Date().toISOString()

  const { error: clientError } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', params.id)

  if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 })

  // Actualizar brief
  const { data: brief } = await supabase
    .from('project_briefs')
    .select('id')
    .eq('client_id', params.id)
    .single()

  const briefData = {
    concepto, colores_gusto, colores_evitar, estilo, referencias,
    giro_negocio, publico_objetivo, tono_comunicacion, temas_contenido,
    frecuencia_posts, notas_adicionales, instrucciones_disenador,
    imagenes_referencia,
  }

  if (brief) {
    await supabase.from('project_briefs').update(briefData).eq('id', brief.id)
  } else {
    await supabase.from('project_briefs').insert({ ...briefData, client_id: params.id })
  }

  // Log de actividades
  if (esPagoCompleto) {
    await supabase.from('activity_log').insert({
      tipo: 'liquidacion',
      descripcion: `Pago completo registrado: ${clientFields.nombre_negocio}`,
      monto: clientFields.precio_total,
      client_id: params.id,
      usuario_id: user.id,
    })
  } else if (clientFields.estatus) {
    await supabase.from('activity_log').insert({
      tipo: 'cambio_estatus',
      descripcion: `Estatus actualizado a: ${clientFields.estatus}`,
      client_id: params.id,
      usuario_id: user.id,
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo el administrador puede eliminar' }, { status: 403 })
  }

  // Verificar PIN
  const { pin } = await request.json()
  const { data: config } = await supabase.from('admin_config').select('pin_hash').single()
  if (!config) return NextResponse.json({ error: 'PIN no configurado' }, { status: 500 })

  const pinValido = await bcrypt.compare(String(pin), config.pin_hash)
  if (!pinValido) return NextResponse.json({ error: 'PIN incorrecto' }, { status: 403 })

  // Soft delete
  const { data: client } = await supabase.from('clients').select('nombre_negocio').eq('id', params.id).single()
  await supabase.from('clients').update({ activo: false }).eq('id', params.id)

  await supabase.from('activity_log').insert({
    tipo: 'cambio_estatus',
    descripcion: `Cliente eliminado: ${client?.nombre_negocio}`,
    client_id: params.id,
    usuario_id: user.id,
  })

  return NextResponse.json({ ok: true })
}
