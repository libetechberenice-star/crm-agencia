import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import AccesosClient from '@/components/accesos/AccesosClient'

export const dynamic = 'force-dynamic'

export default async function AccesosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: perfil } = await supabase.from('profiles').select('rol').eq('id', user!.id).single()

  if (perfil?.rol !== 'admin') {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Solo el administrador puede gestionar accesos</p>
      </div>
    )
  }

  const { data: usuarios } = await supabase.from('profiles').select('*').order('created_at')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Accesos y usuarios</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gestiona quién puede acceder al sistema</p>
      </div>
      <AccesosClient usuarios={usuarios ?? []} />
    </div>
  )
}
