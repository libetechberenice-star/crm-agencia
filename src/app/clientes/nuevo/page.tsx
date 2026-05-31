import NuevoClienteForm from '@/components/clientes/NuevoClienteForm'

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Nuevo cliente</h1>
        <p className="text-slate-500 text-sm mt-0.5">Registra un nuevo proyecto y captura el brief para el diseñador</p>
      </div>
      <NuevoClienteForm />
    </div>
  )
}
