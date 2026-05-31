'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, DollarSign, FolderKanban,
  Settings, LogOut, Menu, X, Briefcase
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/clientes',   label: 'Clientes',   icon: Users },
  { href: '/proyectos',  label: 'Proyectos',  icon: FolderKanban },
  { href: '/finanzas',   label: 'Finanzas',   icon: DollarSign },
  { href: '/accesos',    label: 'Accesos',    icon: Settings },
]

export default function Sidebar({ nombre, rol }: { nombre: string; rol: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-none">CRM Agencia</p>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">{rol}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              )}
            >
              <Icon className={cn('w-5 h-5', active ? 'text-indigo-600' : 'text-slate-400')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Usuario */}
      <div className="border-t border-slate-200 px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-700 text-xs font-semibold">
              {nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{nombre}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 h-screen bg-white border-r border-slate-200 fixed left-0 top-0 z-30">
        <SidebarContent />
      </aside>

      {/* Botón móvil */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Sidebar móvil */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-64 h-full bg-white shadow-xl">
            <button
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600"
              onClick={() => setOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
