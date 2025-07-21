'use client'

import { useAuthStore } from '@/stores'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import NotificationModal from '@/components/NotificationModal'
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates'

export default function EspaciosDisponibles() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [espacios, setEspacios] = useState([])
  const [disponibilidad, setDisponibilidad] = useState({})
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(true)
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null)
  const [horaSeleccionada, setHoraSeleccionada] = useState(null)
  const [duracionSeleccionada, setDuracionSeleccionada] = useState(1)
  const [showReservaModal, setShowReservaModal] = useState(false)
  const [isReservando, setIsReservando] = useState(false)
  const [notification, setNotification] = useState({ isOpen: false, type: '', title: '', message: '' })
  
  // Hook de tiempo real
  const {
    joinAvailabilityCheck,
    notifyReservationCreated,
    onAvailabilityChanged,
    isConnected,
    updateSpaceAvailability
  } = useRealTimeUpdates()

  useEffect(() => {
    if (!user) {
      router.push('/auth')
    } else {
      cargarDisponibilidad()
    }
  }, [user, router, fechaSeleccionada])

  // Resetear estado del modal cuando cambie la fecha
  useEffect(() => {
    setShowReservaModal(false)
    setEspacioSeleccionado(null)
    setHoraSeleccionada(null)
    setDuracionSeleccionada(1)
  }, [fechaSeleccionada])

  // Escuchar cambios de disponibilidad en tiempo real
  useEffect(() => {
    console.log('🔄 Configurando listeners de tiempo real')
    
    const unsubscribe = onAvailabilityChanged((data) => {
      console.log('📡 Cambio de disponibilidad recibido:', data)
      
      // Si el cambio afecta la fecha actual, recargar disponibilidad
      if (data.date.includes(fechaSeleccionada)) {
        console.log('🔄 Recargando disponibilidad por cambio en tiempo real')
        cargarDisponibilidad()
      }
    })
    
    return () => {
      console.log('🛑 Limpiando listeners de tiempo real')
      unsubscribe()
    }
  }, [onAvailabilityChanged, fechaSeleccionada])

  const cargarDisponibilidad = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/espacios/disponibilidad?fecha=${fechaSeleccionada}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log('Datos recibidos:', data)
      
      if (data.success) {
        setEspacios(data.espacios || [])
        setDisponibilidad(data.disponibilidad || {})
        console.log('Espacios:', data.espacios)
        console.log('Disponibilidad:', data.disponibilidad)
      } else {
        console.error('Error en respuesta:', data.error)
        setEspacios([])
        setDisponibilidad({})
      }
    } catch (error) {
      console.error('Error cargando disponibilidad:', error)
      setEspacios([])
      setDisponibilidad({})
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getHorarios = () => {
    const horarios = []
    for (let hora = 8; hora <= 18; hora++) {
      // Agregar hora exacta (ej: 8:00)
      horarios.push(hora.toString().padStart(2, '0') + ':00')
      // Agregar media hora (ej: 8:30), excepto para la última hora
      if (hora < 18) {
        horarios.push(hora.toString().padStart(2, '0') + ':30')
      }
    }
    return horarios
  }

  const getEstadoHorario = (espacioId, hora) => {
    if (!disponibilidad[espacioId]) return 'disponible'
    return disponibilidad[espacioId][hora] || 'disponible'
  }

  const getClassNameHorario = (espacioId, hora) => {
    const estado = getEstadoHorario(espacioId, hora)
    const base = 'p-2 text-xs rounded cursor-pointer transition-colors text-center font-medium'
    
    switch (estado) {
      case 'disponible':
        return `${base} bg-green-100 text-black hover:bg-green-200`
      case 'ocupado':
        return `${base} bg-red-100 text-black cursor-not-allowed`
      default:
        return `${base} bg-gray-100 text-black`
    }
  }

  const handleSeleccionarHorario = (espacioId, hora) => {
    const estado = getEstadoHorario(espacioId, hora)
    if (estado === 'ocupado') return
    
    const espacio = espacios.find(e => e.id === espacioId)
    setEspacioSeleccionado(espacio)
    setHoraSeleccionada(hora)
    setShowReservaModal(true)
  }

  const validarDisponibilidadSeleccion = () => {
    if (!espacioSeleccionado || !horaSeleccionada) return { esValido: false, error: null }
    
    // Convertir hora seleccionada a minutos desde medianoche
    const [horas, minutos] = horaSeleccionada.split(':').map(Number)
    const minutosInicio = horas * 60 + minutos
    const duracionEnMinutos = duracionSeleccionada * 60
    const minutosFinalizacion = minutosInicio + duracionEnMinutos
    
    // Verificar si la reserva termina después de las 18:00
    if (minutosFinalizacion > 18 * 60) {
      return { 
        esValido: false, 
        error: 'La reserva no puede extenderse más allá de las 18:00. Por favor, ajusta la duración o elige una hora de inicio más temprana.' 
      }
    }
    
    // Verificar cada slot de 30 minutos dentro de la duración
    for (let i = 0; i < duracionEnMinutos; i += 30) {
      const minutosActuales = minutosInicio + i
      const horasActuales = Math.floor(minutosActuales / 60)
      const minutosActualesRestantes = minutosActuales % 60
      
      const horaFormateada = horasActuales.toString().padStart(2, '0') + ':' + 
                            minutosActualesRestantes.toString().padStart(2, '0')
      
      const estado = getEstadoHorario(espacioSeleccionado.id, horaFormateada)
      if (estado === 'ocupado') {
        return { 
          esValido: false, 
          error: 'Algunos horarios dentro de la duración seleccionada no están disponibles.' 
        }
      }
    }
    return { esValido: true, error: null }
  }

  const handleConfirmarReserva = async () => {
    const validacion = validarDisponibilidadSeleccion()
    
    if (!validacion.esValido) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Horario No Válido',
        message: validacion.error || 'El horario seleccionado no está disponible. Por favor selecciona otro horario.'
      })
      return
    }

    setIsReservando(true)

    try {
      // ✅ VALIDACIÓN EN TIEMPO REAL: Verificar disponibilidad antes de reservar
      const reservationData = {
        usuarioId: user.id || user._id,
        usuarioEmail: user.email,
        espacio: espacioSeleccionado.id,
        fecha: fechaSeleccionada,
        horaInicio: horaSeleccionada,
        duracion: duracionSeleccionada
      }
      
      console.log('🔍 Verificando disponibilidad en tiempo real...')
      const isAvailable = await joinAvailabilityCheck(reservationData)
      
      if (!isAvailable) {
        setNotification({
          isOpen: true,
          type: 'error',
          title: 'Espacio Ya Reservado',
          message: 'Este horario acaba de ser reservado por otro usuario. Por favor selecciona otro horario.'
        })
        
        // Recargar disponibilidad para mostrar el estado actual
        cargarDisponibilidad()
        return
      }

      const horaFormateada = horaSeleccionada // Ya está en formato HH:MM
      
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData)
      })

      const data = await response.json()

      if (data.success) {
        // ✅ NOTIFICACIÓN EN TIEMPO REAL: Informar a otros usuarios
        console.log('📢 Notificando reserva creada en tiempo real')
        notifyReservationCreated(reservationData)
        
        // Actualizar disponibilidad local inmediatamente
        updateSpaceAvailability(
          espacioSeleccionado.id,
          `${fechaSeleccionada}-${horaSeleccionada}`,
          false,
          'Reservado'
        )
        
        setShowReservaModal(false)
        setNotification({
          isOpen: true,
          type: 'success',
          title: '¡Reserva Confirmada!',
          message: 'Tu reserva se ha creado exitosamente. Recibirás un email de confirmación en breve.'
        })
        cargarDisponibilidad() // Recargar disponibilidad
      } else {
        setNotification({
          isOpen: true,
          type: 'error',
          title: 'Error en la Reserva',
          message: data.error || 'No se pudo crear la reserva. Inténtalo de nuevo.'
        })
      }
    } catch (error) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error de Conexión',
        message: 'Error al crear la reserva. Verifica tu conexión e inténtalo de nuevo.'
      })
    } finally {
      setIsReservando(false)
    }
  }

  const calcularPrecioTotal = () => {
    if (!espacioSeleccionado) return 0
    return espacioSeleccionado.precio * duracionSeleccionada
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            {/* Logo */}
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
              
            {/* Navigation Menu - Centered with flex-grow */}
            <nav className="flex-1 flex justify-center">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all text-lg py-3 px-4 rounded-lg">
                  Inicio
                </Link>
                <Link href="/espacios-disponibles" className="text-blue-600 font-semibold text-lg py-3 px-4 rounded-lg bg-blue-50">
                  Espacios Disponibles
                </Link>
                <Link href="/reservar" className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all text-lg py-3 px-4 rounded-lg">
                  Reservar
                </Link>
                <Link href="/mis-reservas" className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all text-lg py-3 px-4 rounded-lg">
                  Mis Reservas
                </Link>
              </div>
            </nav>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Bienvenido</div>
                <div className="text-lg font-medium text-gray-900">{user.name || user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-black">Espacios Disponibles</h2>
                <p className="mt-2 text-black">
                  Selecciona la fecha y haz clic en un horario disponible para reservar
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Botón de recarga */}
                <button
                  onClick={() => cargarDisponibilidad()}
                  disabled={isLoading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isLoading ? 'Cargando...' : 'Recargar'}</span>
                </button>
                
                {/* Indicador de conexión en tiempo real */}
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Tiempo Real Activo' : 'Sin Conexión'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Fecha */}
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <label className="block text-sm font-medium text-black mb-2">
              Seleccionar Fecha
            </label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Leyenda */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-black mb-3">Leyenda</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 rounded"></div>
                    <span className="text-sm text-black">Disponible</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-100 rounded"></div>
                    <span className="text-sm text-black">Ocupado</span>
                  </div>
                </div>
              </div>

              {/* Calendario de Disponibilidad */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Disponibilidad para {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-ES')}
                  </h3>
                  
                  {espacios.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No hay espacios disponibles para esta fecha.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left p-3 font-medium text-black border-b">Espacio</th>
                            {getHorarios().map(hora => (
                              <th key={hora} className="text-center p-2 font-medium text-black border-b text-xs">
                                {hora}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {espacios.map(espacio => (
                            <tr key={espacio.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl">{espacio.imagen}</span>
                                  <div>
                                    <div className="font-medium text-black">{espacio.nombre}</div>
                                    <div className="text-sm text-black">${espacio.precio}/hora</div>
                                  </div>
                                </div>
                              </td>
                              {getHorarios().map(hora => (
                                <td key={hora} className="p-1">
                                  <div
                                    className={getClassNameHorario(espacio.id, hora)}
                                    onClick={() => handleSeleccionarHorario(espacio.id, hora)}
                                  >
                                    {getEstadoHorario(espacio.id, hora) === 'disponible' ? '✓' : '✗'}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Espacios */}
              <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {espacios.map(espacio => (
                  <div key={espacio.id} className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-3xl">{espacio.imagen}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{espacio.nombre}</h3>
                        <p className="text-sm text-gray-600">{espacio.descripcion}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precio:</span>
                        <span className="font-medium text-blue-600">${espacio.precio}/hora</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacidad:</span>
                        <span className="font-medium text-green-600">{espacio.capacidad} persona(s)</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Amenidades:</h4>
                      <div className="flex flex-wrap gap-1">
                        {espacio.amenidades.map((amenidad, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {amenidad}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal de Reserva */}
      {showReservaModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirmar Reserva</h3>
            
            {espacioSeleccionado && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{espacioSeleccionado.imagen}</span>
                  <div>
                    <div className="font-medium text-gray-900">{espacioSeleccionado.nombre}</div>
                    <div className="text-sm text-gray-600">{espacioSeleccionado.descripcion}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium text-gray-900">{new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora de inicio:</span>
                    <span className="font-medium text-gray-900">{horaSeleccionada}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-gray-900">Duración:</span>
                    <select
                      value={duracionSeleccionada}
                      onChange={(e) => setDuracionSeleccionada(parseFloat(e.target.value))}
                      className="px-2 py-1 border rounded text-sm text-gray-900"
                    >
                      <option value={0.5}>30 minutos</option>
                      <option value={1}>1 hora</option>
                      <option value={1.5}>1 hora 30 min</option>
                      <option value={2}>2 horas</option>
                      <option value={2.5}>2 horas 30 min</option>
                      <option value={3}>3 horas</option>
                      <option value={3.5}>3 horas 30 min</option>
                      <option value={4}>4 horas</option>
                      <option value={5}>5 horas</option>
                      <option value={6}>6 horas</option>
                      <option value={8}>8 horas</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio total:</span>
                    <span className="font-medium text-blue-600">${calcularPrecioTotal()}</span>
                  </div>
                </div>
                
                {(() => {
                  const validacion = validarDisponibilidadSeleccion()
                  if (!validacion.esValido) {
                    return (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                        ⚠️ {validacion.error}
                      </div>
                    )
                  }
                  return null
                })()}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowReservaModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarReserva}
                    disabled={isReservando || !validarDisponibilidadSeleccion().esValido}
                    className={`flex-1 px-4 py-2 rounded-md font-medium ${
                      isReservando || !validarDisponibilidadSeleccion().esValido
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isReservando ? 'Reservando...' : 'Confirmar Reserva'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  )
}
