import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, project_briefs(*)')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()

  const {
    codigo, nombre_negocio, nombre_contacto, telefono, email,
    tipo_paquete, mixto_detalle, precio_total, abono, estatus,
    fecha_entrega, tipo_proyecto,
    // Brief
    concepto, colores_gusto, colores_evitar, estilo, referencias,
    giro_negocio, publico_objetivo, tono_comunicacion, temas_contenido,
    frecuencia_posts, notas_adicionales, instrucciones_disenador,
    imagenes_referencia,
  } = body

  // Crear cliente
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      codigo, nombre_negocio, nombre_contacto, telefono,
      email: email || null,
      tipo_paquete, mixto_detalle, precio_total, abono,
      estatus, fecha_entrega: fecha_entrega || null,
      tipo_proyecto, registrado_por: user.id,
    })
    .select()
    .single()

  if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 })

  // Crear brief
  const { error: briefError } = await supabase.from('project_briefs').insert({
    client_id: client.id,
    concepto, colores_gusto, colores_evitar, estilo, referencias,
    giro_negocio, publico_objetivo, tono_comunicacion, temas_contenido,
    frecuencia_posts, notas_adicionales, instrucciones_disenador,
    imagenes_referencia: imagenes_referencia ?? [],
  })

  if (briefError) console.error('Brief error:', briefError)

  // Registrar actividad
  await supabase.from('activity_log').insert({
    tipo: 'contratacion',
    descripcion: `Nueva contratación: ${nombre_negocio} (${codigo})`,
    monto: precio_total,
    client_id: client.id,
    usuario_id: user.id,
  })

  // Registrar abono si hay
  if (abono > 0) {
    await supabase.from('movements').insert({
      tipo: 'ingreso',
      concepto: `Anticipo — ${nombre_negocio}`,
      monto: abono,
      client_id: client.id,
      es_abono: true,
      registrado_por: user.id,
    })
    await supabase.from('activity_log').insert({
      tipo: 'abono',
      descripcion: `Anticipo recibido de ${nombre_negocio}`,
      monto: abono,
      client_id: client.id,
      usuario_id: user.id,
    })
  }

  return NextResponse.json({ id: client.id }, { status: 201 })
}
