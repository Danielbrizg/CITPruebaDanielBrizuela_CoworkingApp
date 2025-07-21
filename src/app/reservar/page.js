'use client'

import { useAuthStore } from '@/stores'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates'

// Constantes de tipos de espacios
const TIPOS_ESPACIOS = {
  ESCRITORIO_COMPARTIDO: 'escritorio-compartido',
  ESCRITORIO_PRIVADO: 'escritorio-privado',
  SALA_REUNIONES_PEQUEÑA: 'sala-reuniones-pequeña',
  SALA_REUNIONES_GRANDE: 'sala-reuniones-grande',
  OFICINA_PRIVADA: 'oficina-privada'
}

// Constantes de horarios disponibles
const HORARIOS_DISPONIBLES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
]

// Opciones de duración
const OPCIONES_DURACION = [
  { value: '0.5', label: '30 minutos' },
  { value: '1', label: '1 hora' },
  { value: '1.5', label: '1 hora 30 minutos' },
  { value: '2', label: '2 horas' },
  { value: '2.5', label: '2 horas 30 minutos' },
  { value: '3', label: '3 horas' },
  { value: '3.5', label: '3 horas 30 minutos' },
  { value: '4', label: '4 horas' },
  { value: '5', label: '5 horas' },
  { value: '6', label: '6 horas' },
  { value: '8', label: '8 horas (día completo)' }
]

export default function PaginaReservar() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const { isConnected, joinAvailabilityCheck, leaveAvailabilityCheck, notifyReservationCreated, onAvailabilityChanged } = useRealTimeUpdates()
  
  const [espacioSeleccionado, setEspacioSeleccionado] = useState('')
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [duracion, setDuracion] = useState('1')
  const [cargando, setCargando] = useState(false)
  const [mensajeDisponibilidad, setMensajeDisponibilidad] = useState('')
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false)
  const [ultimaVerificacion, setUltimaVerificacion] = useState(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth')
    }
  }, [user, router])

  const manejarCerrarSesion = () => {
    logout()
    router.push('/')
  }

  const verificarDisponibilidad = async () => {
    if (!espacioSeleccionado || !fechaSeleccionada || !horaSeleccionada || !duracion) {
      return
    }

    // Validar que la reserva no sobrepase las 18:00
    const [horas, minutos] = horaSeleccionada.split(':').map(Number)
    const horaInicioEnMinutos = horas * 60 + minutos
    const duracionEnMinutos = parseFloat(duracion) * 60
    const horaFinEnMinutos = horaInicioEnMinutos + duracionEnMinutos
    const horaLimiteEnMinutos = 18 * 60 // 18:00

    if (horaFinEnMinutos > horaLimiteEnMinutos) {
      setMensajeDisponibilidad('❌ La reserva no puede extenderse más allá de las 18:00')
      setUltimaVerificacion(new Date())
      return
    }

    setVerificandoDisponibilidad(true)
    setMensajeDisponibilidad('')

    try {
      // Verificar primero en el sistema de tiempo real
      const reservationData = {
        espacio: espacioSeleccionado,
        fecha: fechaSeleccionada,
        horaInicio: horaSeleccionada,
        duracion: duracion,
        usuarioId: user.id || user._id
      }
      
      // Usar el sistema de tiempo real para verificación rápida
      const realTimeAvailable = await joinAvailabilityCheck(reservationData)
      
      // También verificar con la API para confirmar
      const response = await fetch('/api/espacios/disponibilidad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          espacio: espacioSeleccionado,
          fecha: fechaSeleccionada,
          horaInicio: horaSeleccionada,
          duracion: duracion,
          usuarioId: user.id || user._id
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Combinar resultados del tiempo real y la API
      const finalAvailable = data.disponible && realTimeAvailable
      
      if (finalAvailable) {
        setMensajeDisponibilidad('✅ Disponible para reservar')
      } else {
        // Mostrar la razón más específica
        const reason = !realTimeAvailable ? 'Reservado recientemente' : data.razon
        setMensajeDisponibilidad(`❌ ${reason}`)
      }
      setUltimaVerificacion(new Date())
    } catch (error) {
      console.error('Error verificando disponibilidad:', error)
      setMensajeDisponibilidad('❌ Error verificando disponibilidad')
      setUltimaVerificacion(new Date())
    } finally {
      setVerificandoDisponibilidad(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (espacioSeleccionado && fechaSeleccionada && horaSeleccionada && duracion) {
        verificarDisponibilidad()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [espacioSeleccionado, fechaSeleccionada, horaSeleccionada, duracion])

  // Sistema de tiempo real: Escuchar cambios de disponibilidad
  useEffect(() => {
    if (!espacioSeleccionado || !fechaSeleccionada || !horaSeleccionada || !duracion || !isConnected || !user) {
      return
    }

    // Configurar datos de la reserva para el monitoreo
    const reservationData = {
      espacio: espacioSeleccionado,
      fecha: fechaSeleccionada,
      horaInicio: horaSeleccionada,
      duracion: duracion,
      usuarioId: user.id || user._id
    }

    // Verificar disponibilidad inicial
    joinAvailabilityCheck(reservationData)

    // Escuchar cambios en tiempo real
    const cleanup = onAvailabilityChanged((data) => {
      const currentSpaceKey = `${espacioSeleccionado}-${fechaSeleccionada}-${horaSeleccionada}`
      const changedSpaceKey = `${data.spaceId}-${data.date}`
      
      if (changedSpaceKey.includes(currentSpaceKey)) {
        if (!data.available) {
          setMensajeDisponibilidad(`❌ ${data.reason || 'Espacio ya no disponible'}`)
        } else {
          setMensajeDisponibilidad('✅ Disponible para reservar')
        }
        setUltimaVerificacion(new Date())
      }
    })

    return () => {
      leaveAvailabilityCheck()
      if (cleanup) cleanup()
    }
  }, [espacioSeleccionado, fechaSeleccionada, horaSeleccionada, duracion, isConnected, user])

  const manejarReserva = async (e) => {
    e.preventDefault()
    
    if (!espacioSeleccionado || !fechaSeleccionada || !horaSeleccionada || !duracion) {
      alert('Por favor completa todos los campos')
      return
    }

    // Validar que la reserva no sobrepase las 18:00
    const [horas, minutos] = horaSeleccionada.split(':').map(Number)
    const horaInicioEnMinutos = horas * 60 + minutos
    const duracionEnMinutos = parseFloat(duracion) * 60
    const horaFinEnMinutos = horaInicioEnMinutos + duracionEnMinutos
    const horaLimiteEnMinutos = 18 * 60 // 18:00

    if (horaFinEnMinutos > horaLimiteEnMinutos) {
      alert('❌ La reserva no puede extenderse más allá de las 18:00. Por favor ajusta la hora de inicio o la duración.')
      return
    }

    setCargando(true)
    
    try {
      // Verificación final de disponibilidad
      const availabilityResponse = await fetch('/api/espacios/disponibilidad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          espacio: espacioSeleccionado,
          fecha: fechaSeleccionada,
          horaInicio: horaSeleccionada,
          duracion: duracion,
          usuarioId: user.id || user._id
        })
      })

      if (!availabilityResponse.ok) {
        throw new Error(`Error verificando disponibilidad: ${availabilityResponse.status}`)
      }

      const availabilityData = await availabilityResponse.json()

      if (!availabilityData.disponible) {
        alert(`❌ Este espacio ya no está disponible: ${availabilityData.razon}`)
        setMensajeDisponibilidad(`❌ ${availabilityData.razon}`)
        setCargando(false)
        return
      }

      // Crear la reserva
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuarioId: user.id || user._id,
          usuarioEmail: user.email,
          espacio: espacioSeleccionado,
          fecha: fechaSeleccionada,
          horaInicio: horaSeleccionada,
          duracion: duracion
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        notifyReservationCreated({
          espacio: espacioSeleccionado,
          fecha: fechaSeleccionada,
          horaInicio: horaSeleccionada,
          duracion: duracion
        })
        
        alert('¡Reserva creada exitosamente! Recibirás un email de confirmación.')
        router.push('/mis-reservas')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error en el proceso de reserva:', error)
      alert('Error al procesar la reserva. Inténtalo de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  if (!user) {
    return <PantallaCarga />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EncabezadoPagina user={user} onLogout={manejarCerrarSesion} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <TituloPagina />
          
          <div className="grid lg:grid-cols-2 gap-8">
            <FormularioReserva
              espacioSeleccionado={espacioSeleccionado}
              setEspacioSeleccionado={setEspacioSeleccionado}
              fechaSeleccionada={fechaSeleccionada}
              setFechaSeleccionada={setFechaSeleccionada}
              horaSeleccionada={horaSeleccionada}
              setHoraSeleccionada={setHoraSeleccionada}
              duracion={duracion}
              setDuracion={setDuracion}
              onSubmit={manejarReserva}
              cargando={cargando}
              verificandoDisponibilidad={verificandoDisponibilidad}
              mensajeDisponibilidad={mensajeDisponibilidad}
              ultimaVerificacion={ultimaVerificacion}
              isConnected={isConnected}
            />
            
            <InformacionEspacios />
          </div>
        </div>
      </main>
    </div>
  )
}

function PantallaCarga() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  )
}

function EncabezadoPagina({ user, onLogout }) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-6">
          <LogoEmpresa />
          <MenuNavegacion />
          <InfoUsuario user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  )
}

function LogoEmpresa() {
  return (
    <div className="flex items-center space-x-4">
      <Link href="/" className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-2xl">C</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          CoworkingApp
        </h1>
      </Link>
    </div>
  )
}

function MenuNavegacion() {
  const elementosMenu = [
    { href: '/', label: 'Inicio', activo: false },
    { href: '/espacios-disponibles', label: 'Espacios Disponibles', activo: false },
    { href: '/reservar', label: 'Reservar', activo: true },
    { href: '/mis-reservas', label: 'Mis Reservas', activo: false }
  ]

  return (
    <nav className="flex-1 flex justify-center">
      <div className="flex items-center space-x-8">
        {elementosMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-lg py-3 px-4 rounded-lg transition-all ${
              item.activo
                ? 'text-blue-600 font-semibold bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

function InfoUsuario({ user, onLogout }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="text-right">
        <div className="text-sm text-gray-500">Bienvenido</div>
        <div className="text-lg font-medium text-gray-900">
          {user.name || user.email}
        </div>
      </div>
      <button
        onClick={onLogout}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
      >
        Cerrar Sesión
      </button>
    </div>
  )
}

function TituloPagina() {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-black">Reservar Espacio</h2>
      <p className="mt-2 text-black">
        Selecciona el espacio perfecto para tu trabajo y reserva tu lugar
      </p>
    </div>
  )
}

function FormularioReserva({
  espacioSeleccionado,
  setEspacioSeleccionado,
  fechaSeleccionada,
  setFechaSeleccionada,
  horaSeleccionada,
  setHoraSeleccionada,
  duracion,
  setDuracion,
  onSubmit,
  cargando,
  verificandoDisponibilidad,
  mensajeDisponibilidad,
  ultimaVerificacion,
  isConnected
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Detalles de la Reserva
      </h3>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <SelectorTipoEspacio
          value={espacioSeleccionado}
          onChange={setEspacioSeleccionado}
        />
        
        <InputFecha
          value={fechaSeleccionada}
          onChange={setFechaSeleccionada}
        />
        
        <SelectorHora
          value={horaSeleccionada}
          onChange={setHoraSeleccionada}
        />
        
        <SelectorDuracion
          value={duracion}
          onChange={setDuracion}
        />

        <EstadoDisponibilidad
          verificando={verificandoDisponibilidad}
          mensaje={mensajeDisponibilidad}
          ultimaVerificacion={ultimaVerificacion}
          conectado={isConnected}
        />

        <BotonEnviar
          cargando={cargando}
          verificando={verificandoDisponibilidad}
          disponible={mensajeDisponibilidad.includes('✅')}
        />
      </form>
    </div>
  )
}

function SelectorTipoEspacio({ value, onChange }) {
  const opcionesEspacios = [
    { value: TIPOS_ESPACIOS.ESCRITORIO_COMPARTIDO, label: 'Escritorio Compartido' },
    { value: TIPOS_ESPACIOS.ESCRITORIO_PRIVADO, label: 'Escritorio Privado' },
    { value: TIPOS_ESPACIOS.SALA_REUNIONES_PEQUEÑA, label: 'Sala de Reuniones (4-6 personas)' },
    { value: TIPOS_ESPACIOS.SALA_REUNIONES_GRANDE, label: 'Sala de Reuniones (8-12 personas)' },
    { value: TIPOS_ESPACIOS.OFICINA_PRIVADA, label: 'Oficina Privada' }
  ]

  return (
    <CampoFormulario label="Tipo de Espacio">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        required
      >
        <option value="">Selecciona un espacio</option>
        {opcionesEspacios.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </CampoFormulario>
  )
}

function InputFecha({ value, onChange }) {
  return (
    <CampoFormulario label="Fecha">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        required
      />
    </CampoFormulario>
  )
}

function SelectorHora({ value, onChange }) {
  return (
    <CampoFormulario label="Hora de Inicio">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        required
      >
        <option value="">Selecciona una hora</option>
        {HORARIOS_DISPONIBLES.map((hora) => (
          <option key={hora} value={hora}>
            {hora}
          </option>
        ))}
      </select>
    </CampoFormulario>
  )
}

function SelectorDuracion({ value, onChange }) {
  return (
    <CampoFormulario label="Duración">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
      >
        {OPCIONES_DURACION.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
    </CampoFormulario>
  )
}

function EstadoDisponibilidad({ verificando, mensaje, ultimaVerificacion, conectado }) {
  if (!verificando && !mensaje) return null

  return (
    <div className={`p-3 rounded-md text-sm ${
      verificando 
        ? 'bg-blue-50 text-blue-700' 
        : mensaje.includes('✅') 
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700'
    }`}>
      {verificando ? '🔄 Verificando disponibilidad...' : mensaje}
      {ultimaVerificacion && !verificando && (
        <div className="text-xs mt-1 opacity-70">
          Última verificación: {ultimaVerificacion.toLocaleTimeString()}
        </div>
      )}
      {conectado && (
        <div className="text-xs mt-1 opacity-70 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Actualizaciones en tiempo real activas
        </div>
      )}
    </div>
  )
}

function CampoFormulario({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-black mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}

function BotonEnviar({ cargando, verificando, disponible }) {
  const deshabilitado = cargando || verificando || !disponible
  
  return (
    <button
      type="submit"
      disabled={deshabilitado}
      className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
        deshabilitado
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {cargando ? 'Creando Reserva...' : 'Confirmar Reserva'}
    </button>
  )
}

function InformacionEspacios() {
  return (
    <div className="space-y-6">
      <TarjetaTiposEspacios />
    </div>
  )
}

function TarjetaTiposEspacios() {
  const informacionEspacios = [
    {
      nombre: 'Escritorio Compartido',
      descripcion: 'Espacio abierto ideal para trabajar de forma individual',
      precio: 15,
      colorBorde: 'border-blue-500',
      colorTexto: 'text-blue-600'
    },
    {
      nombre: 'Escritorio Privado',
      descripcion: 'Escritorio personal en área semi-privada',
      precio: 25,
      colorBorde: 'border-green-500',
      colorTexto: 'text-green-600'
    },
    {
      nombre: 'Sala de Reuniones (4-6 personas)',
      descripcion: 'Sala equipada para reuniones pequeñas',
      precio: 40,
      colorBorde: 'border-purple-500',
      colorTexto: 'text-purple-600'
    },
    {
      nombre: 'Sala de Reuniones (8-12 personas)',
      descripcion: 'Sala grande para presentaciones y reuniones',
      precio: 60,
      colorBorde: 'border-orange-500',
      colorTexto: 'text-orange-600'
    },
    {
      nombre: 'Oficina Privada',
      descripcion: 'Oficina completamente privada para máxima concentración',
      precio: 80,
      colorBorde: 'border-yellow-500',
      colorTexto: 'text-yellow-600'
    }
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-black mb-4">
        Tipos de Espacios Disponibles
      </h3>
      
      <div className="space-y-4">
        {informacionEspacios.map((espacio, index) => (
          <div key={index} className={`border-l-4 ${espacio.colorBorde} pl-4`}>
            <h4 className="font-medium text-black">{espacio.nombre}</h4>
            <p className="text-sm text-black">{espacio.descripcion}</p>
            <p className={`text-sm font-medium ${espacio.colorTexto}`}>
              ${espacio.precio}/hora
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}



