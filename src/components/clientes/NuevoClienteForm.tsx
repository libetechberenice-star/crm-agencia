'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Upload, X, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TipoPaquete, EstatusCliente } from '@/types'

const schema = z.object({
  // Datos del cliente
  codigo:          z.string().min(1, 'Requerido'),
  nombre_negocio:  z.string().min(2, 'Requerido'),
  nombre_contacto: z.string().optional(),
  telefono:        z.string().optional(),
  email:           z.string().email('Email inválido').optional().or(z.literal('')),
  tipo_paquete:    z.enum(['basico', 'estandar', 'mixto']),
  mixto_detalle:   z.string().optional(),
  precio_total:    z.coerce.number().min(1, 'Debe ser mayor a 0'),
  abono:           z.coerce.number().min(0),
  estatus:         z.enum(['anticipo','propuestas_enviadas','pendiente_pago','pago_completo']),
  fecha_entrega:   z.string().optional(),
  tipo_proyecto:   z.array(z.string()).min(1, 'Selecciona al menos un tipo'),
  // Brief
  concepto:             z.string().optional(),
  colores_gusto:        z.string().optional(),
  colores_evitar:       z.string().optional(),
  estilo:               z.string().optional(),
  referencias:          z.string().optional(),
  giro_negocio:         z.string().optional(),
  publico_objetivo:     z.string().optional(),
  tono_comunicacion:    z.string().optional(),
  temas_contenido:      z.string().optional(),
  frecuencia_posts:     z.string().optional(),
  notas_adicionales:    z.string().optional(),
  instrucciones_disenador: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const PASOS = ['Datos del cliente', 'Brief del diseñador', 'Imágenes']

const PRECIOS_BASE: Record<TipoPaquete, number> = {
  basico: 2500, estandar: 5000, mixto: 0,
}

const ESTILOS = ['Minimalista', 'Moderno', 'Clásico / elegante', 'Divertido / juvenil', 'Corporativo', 'Artesanal / orgánico']
const TONOS   = ['Formal', 'Casual', 'Divertido / informal', 'Inspiracional', 'Educativo', 'Cercano / amigable']

export default function NuevoClienteForm() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [imagenes, setImagenes] = useState<File[]>([])
  const [previews, setPreviews]   = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      estatus: 'anticipo',
      tipo_proyecto: [],
      abono: 0,
      precio_total: 0,
    },
  })

  const tipoPaquete = watch('tipo_paquete')
  const precioTotal = watch('precio_total')
  const abono = watch('abono')
  const tipoProyecto = watch('tipo_proyecto') ?? []

  function handlePaqueteChange(p: TipoPaquete) {
    setValue('tipo_paquete', p)
    if (p !== 'mixto') setValue('precio_total', PRECIOS_BASE[p])
  }

  function toggleTipoProyecto(tipo: string) {
    const current = tipoProyecto
    const next = current.includes(tipo) ? current.filter(t => t !== tipo) : [...current, tipo]
    setValue('tipo_proyecto', next)
  }

  function handleImagenes(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setImagenes(prev => [...prev, ...files])
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeImagen(idx: number) {
    setImagenes(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      // Subir imágenes primero
      const imagenesUrls: string[] = []
      for (const file of imagenes) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const { url } = await res.json()
        if (url) imagenesUrls.push(url)
      }
      // Crear cliente + brief
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, imagenes_referencia: imagenesUrls }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Error al guardar')
      }
      const { id } = await res.json()
      router.push('/clientes/' + id)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {PASOS.map((p, i) => (
          <div key={p} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => i < paso && setPaso(i)}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all flex-shrink-0',
                i < paso  ? 'bg-indigo-600 text-white cursor-pointer' :
                i === paso ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                'bg-slate-200 text-slate-500 cursor-not-allowed'
              )}
            >
              {i < paso ? <Check className="w-4 h-4" /> : i + 1}
            </button>
            <span className={cn('text-sm font-medium hidden sm:block', i === paso ? 'text-slate-800' : 'text-slate-400')}>
              {p}
            </span>
            {i < PASOS.length - 1 && <div className={cn('h-px flex-1 ml-2', i < paso ? 'bg-indigo-600' : 'bg-slate-200')} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ===== PASO 0: Datos del cliente ===== */}
        {paso === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h2 className="font-semibold text-slate-800 text-lg">Datos del cliente</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Código *" error={errors.codigo?.message}>
                <input {...register('codigo')} placeholder="AGD-001"
                  className={inputCls(!!errors.codigo)} />
              </Field>
              <Field label="Nombre del negocio *" error={errors.nombre_negocio?.message} className="col-span-2 sm:col-span-1">
                <input {...register('nombre_negocio')} placeholder="Tacos El Güero"
                  className={inputCls(!!errors.nombre_negocio)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre del contacto">
                <input {...register('nombre_contacto')} placeholder="Juan Pérez"
                  className={inputCls(false)} />
              </Field>
              <Field label="Teléfono">
                <input {...register('telefono')} placeholder="228 000 0000"
                  className={inputCls(false)} />
              </Field>
            </div>

            <Field label="Email">
              <input {...register('email')} type="email" placeholder="correo@negocio.com"
                className={inputCls(!!errors.email)} />
            </Field>

            {/* Tipo de proyecto */}
            <Field label="Tipo de proyecto *" error={errors.tipo_proyecto?.message}>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { id: 'logo', label: 'Logotipo / identidad' },
                  { id: 'redes', label: 'Redes sociales' },
                  { id: 'web', label: 'Página web' },
                  { id: 'impresion', label: 'Impresión' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTipoProyecto(t.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                      tipoProyecto.includes(t.id)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Tipo de paquete */}
            <Field label="Tipo de paquete *" error={errors.tipo_paquete?.message}>
              <div className="grid grid-cols-3 gap-3 mt-1">
                {(['basico', 'estandar', 'mixto'] as TipoPaquete[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePaqueteChange(p)}
                    className={cn(
                      'py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all',
                      tipoPaquete === p
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {p === 'basico' ? 'Básico' : p === 'estandar' ? 'Estándar' : 'Mixto'}
                    {p !== 'mixto' && <span className="block text-xs font-normal text-slate-400 mt-0.5">Base: ${PRECIOS_BASE[p].toLocaleString()}</span>}
                  </button>
                ))}
              </div>
            </Field>

            {/* Detalle mixto */}
            {tipoPaquete === 'mixto' && (
              <Field label="¿Qué incluye el paquete mixto?" error={errors.mixto_detalle?.message}>
                <textarea {...register('mixto_detalle')} rows={3}
                  placeholder="Describe los servicios que se contrataron..."
                  className={inputCls(false) + ' resize-none'} />
              </Field>
            )}

            {/* Precios */}
            <div className="grid grid-cols-3 gap-4">
              <Field label="Precio total *" error={errors.precio_total?.message}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input {...register('precio_total')} type="number" min="0" step="0.01"
                    className={inputCls(!!errors.precio_total) + ' pl-7'} />
                </div>
              </Field>
              <Field label="Abono inicial" error={errors.abono?.message}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input {...register('abono')} type="number" min="0" step="0.01"
                    className={inputCls(!!errors.abono) + ' pl-7'} />
                </div>
              </Field>
              <Field label="Restante">
                <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-amber-600">
                  ${Math.max(0, (precioTotal ?? 0) - (abono ?? 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Estatus" error={errors.estatus?.message}>
                <select {...register('estatus')} className={inputCls(false)}>
                  <option value="anticipo">Anticipo</option>
                  <option value="propuestas_enviadas">Propuestas enviadas</option>
                  <option value="pendiente_pago">Pendiente de pago</option>
                  <option value="pago_completo">Pago completo</option>
                </select>
              </Field>
              <Field label="Fecha de entrega">
                <input {...register('fecha_entrega')} type="date"
                  className={inputCls(false)} />
              </Field>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors"
              >
                Siguiente — Brief <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===== PASO 1: Brief del diseñador ===== */}
        {paso === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-slate-800 text-lg">Brief del diseñador</h2>
              <p className="text-sm text-slate-500 mt-0.5">Esta información la verá el diseñador al trabajar el proyecto</p>
            </div>

            {/* Brief Logo */}
            {(tipoProyecto.includes('logo') || tipoProyecto.length === 0) && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">Logotipo / Identidad</h3>
                <Field label="¿Qué busca el cliente con su logo? ¿Qué concepto quiere transmitir?">
                  <textarea {...register('concepto')} rows={3}
                    placeholder="El cliente quiere transmitir modernidad y confianza..."
                    className={inputCls(false) + ' resize-none'} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Colores que le gustan">
                    <input {...register('colores_gusto')} placeholder="Azul marino, dorado, negro..."
                      className={inputCls(false)} />
                  </Field>
                  <Field label="Colores que NO quiere">
                    <input {...register('colores_evitar')} placeholder="Rojo, rosa..."
                      className={inputCls(false)} />
                  </Field>
                </div>
                <Field label="Estilo de diseño">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {ESTILOS.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setValue('estilo', e)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm border transition-all',
                          watch('estilo') === e
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Marcas / logos de referencia">
                    <input {...register('referencias')} placeholder="Nike, Apple, Starbucks..."
                      className={inputCls(false)} />
                  </Field>
                  <Field label="Giro del negocio">
                    <input {...register('giro_negocio')} placeholder="Restaurante de tacos..."
                      className={inputCls(false)} />
                  </Field>
                </div>
                <Field label="Público objetivo">
                  <input {...register('publico_objetivo')} placeholder="Jóvenes 18-35 años, nivel medio-alto..."
                    className={inputCls(false)} />
                </Field>
              </div>
            )}

            {/* Brief Redes */}
            {tipoProyecto.includes('redes') && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">Redes sociales / Contenido</h3>
                <Field label="Tono de comunicación">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {TONOS.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setValue('tono_comunicacion', t)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm border transition-all',
                          watch('tono_comunicacion') === t
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Temas de contenido">
                    <textarea {...register('temas_contenido')} rows={2}
                      placeholder="Promociones, tips del negocio, detrás de cámaras..."
                      className={inputCls(false) + ' resize-none'} />
                  </Field>
                  <Field label="Frecuencia de publicaciones">
                    <input {...register('frecuencia_posts')} placeholder="3 por semana"
                      className={inputCls(false)} />
                  </Field>
                </div>
              </div>
            )}

            {/* Notas generales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">Notas y observaciones</h3>
              <Field label="Notas adicionales">
                <textarea {...register('notas_adicionales')} rows={2}
                  placeholder="El cliente mencionó que le urge para el 15..."
                  className={inputCls(false) + ' resize-none'} />
              </Field>
              <Field label="✏️ Instrucciones directas para el diseñador">
                <textarea {...register('instrucciones_disenador')} rows={3}
                  placeholder="Diseñador: El cliente quiere algo similar a lo que hicimos para X pero con más color. Tiene cita el jueves para revisión."
                  className={cn(inputCls(false), 'resize-none bg-yellow-50 border-yellow-200 focus:ring-yellow-400')} />
              </Field>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setPaso(0)}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                type="button"
                onClick={() => setPaso(2)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors"
              >
                Siguiente — Imágenes <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===== PASO 2: Imágenes ===== */}
        {paso === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-slate-800 text-lg">Imágenes de referencia</h2>
              <p className="text-sm text-slate-500 mt-0.5">Sube las imágenes que el cliente envió como referencia para el diseñador</p>
            </div>

            {/* Drop zone */}
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
              <Upload className="w-8 h-8 text-slate-300" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">Haz clic o arrastra imágenes aquí</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP hasta 10 MB c/u</p>
              </div>
              <input type="file" multiple accept="image/*" onChange={handleImagenes} className="hidden" />
            </label>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImagen(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Guardando...' : '✓ Guardar cliente'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

function Field({ label, error, children, className }: {
  label: string; error?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full px-3 py-2.5 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all',
    hasError
      ? 'border-red-300 focus:ring-red-400'
      : 'border-slate-200 focus:ring-indigo-500'
  )
}
