import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: perfil } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 })

  const { email, password, nombre, rol } = await request.json()

  // Crear en Supabase Auth con Admin API
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Crear perfil
  await supabase.from('profiles').insert({
    id: newUser.user.id,
    nombre,
    rol,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
