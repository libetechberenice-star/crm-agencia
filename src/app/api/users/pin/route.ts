import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: perfil } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 })

  const { pinActual, pinNuevo } = await request.json()

  const { data: config } = await supabase.from('admin_config').select('*').single()

  // Si no hay PIN configurado, permite crear el primero
  if (config) {
    const valido = await bcrypt.compare(String(pinActual), config.pin_hash)
    if (!valido) return NextResponse.json({ error: 'PIN actual incorrecto' }, { status: 403 })
    const hash = await bcrypt.hash(String(pinNuevo), 10)
    await supabase.from('admin_config').update({ pin_hash: hash, updated_at: new Date().toISOString() }).eq('id', config.id)
  } else {
    const hash = await bcrypt.hash(String(pinNuevo), 10)
    await supabase.from('admin_config').insert({ pin_hash: hash })
  }

  return NextResponse.json({ ok: true })
}
