'use client'

import { useAuthStore } from '@/stores'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import NotificationModal from '@/components/NotificationModal'

export default function MisReservas() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [reservas, setReservas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState({ isOpen: false, type: '', title: '', message: '' })
  const [cancelModal, setCancelModal] = useState({ isOpen: false, reserva: null })

  useEffect(() => {
    if (!user) {
      router.push('/auth')
    } else {
      cargarReservas()
    }
  }, [user, router])

  const cargarReservas = async () => {
    try {
      setIsLoading(true)
      console.log('Cargando reservas para usuario:', user.id || user._id);
      
      const response = await fetch(`/api/reservas?usuarioId=${user.id || user._id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json()
      console.log('Datos de reservas recibidos:', data);
      
      if (data.success) {
        // Mapear las reservas para mostrar la información correctamente
        const reservasMapeadas = data.reservas.map(reserva => ({
          id: reserva._id,
          espacio: reserva.espacio,
          fecha: reserva.fechaInicio.split('T')[0], // Extraer solo la fecha
          hora: new Date(reserva.fechaInicio + (reserva.fechaInicio.includes('T') ? '' : 'T00:00:00')).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'UTC'
          }),
          duracion: `${reserva.duracion} hora(s)`,
          estado: reserva.estado,
          precio: reserva.precio ? `$${reserva.precio}` : 'N/A',
          fechaInicio: reserva.fechaInicio,
          fechaFin: reserva.fechaFin
        }))
        console.log('Reservas mapeadas:', reservasMapeadas);
        setReservas(reservasMapeadas)
      }
    } catch (error) {
      console.error('Error cargando reservas:', error)
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error al cargar reservas',
        message: 'No se pudieron cargar las reservas. Verifica tu conexión e inténtalo de nuevo.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getEspacioNombre = (espacio) => {
    const nombres = {
      'escritorio-compartido': 'Escritorio Compartido',
      'escritorio-privado': 'Escritorio Privado',
      'sala-reuniones-pequeña': 'Sala de Reuniones (4-6 personas)',
      'sala-reuniones-grande': 'Sala de Reuniones (8-12 personas)',
      'oficina-privada': 'Oficina Privada'
    }
    return nombres[espacio] || espacio
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'confirmada':
        return 'bg-green-100 text-green-800'
      case 'completada':
        return 'bg-blue-100 text-blue-800'
      case 'cancelada':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-black'
    }
  }

  const handleCancelReservation = async (reserva) => {
    // Verificar si se puede cancelar (15 minutos antes)
    const ahora = new Date()
    const fechaInicio = new Date(reserva.fechaInicio)
    const diferenciaMilisegundos = fechaInicio.getTime() - ahora.getTime()
    const diferenciaMinutos = diferenciaMilisegundos / (1000 * 60)
    
    if (diferenciaMinutos < 15) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Cancelación No Permitida',
        message: 'No puedes cancelar la reserva dentro de los 15 minutos previos al inicio.'
      })
      return
    }

    setCancelModal({ isOpen: true, reserva })
  }

  const confirmarCancelacion = async () => {
    const reserva = cancelModal.reserva
    if (!reserva) return

    try {
      const response = await fetch(`/api/reservas?reservaId=${reserva.id}&usuarioId=${user.id || user._id}&usuarioEmail=${user.email}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Reserva Cancelada',
          message: 'Tu reserva ha sido cancelada exitosamente. Recibirás un email de confirmación.'
        })
        cargarReservas() // Recargar las reservas
      } else {
        setNotification({
          isOpen: true,
          type: 'error',
          title: 'Error al Cancelar',
          message: data.error || 'No se pudo cancelar la reserva. Inténtalo de nuevo.'
        })
      }
    } catch (error) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error de Conexión',
        message: 'Error al cancelar la reserva. Verifica tu conexión e inténtalo de nuevo.'
      })
    } finally {
      setCancelModal({ isOpen: false, reserva: null })
    }
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
                <Link href="/espacios-disponibles" className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all text-lg py-3 px-4 rounded-lg">
                  Espacios Disponibles
                </Link>
                <Link href="/reservar" className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all text-lg py-3 px-4 rounded-lg">
                  Reservar
                </Link>
                <Link href="/mis-reservas" className="text-blue-600 font-semibold text-lg py-3 px-4 rounded-lg bg-blue-50">
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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-black">Mis Reservas</h2>
              <p className="mt-2 text-black">
                Gestiona todas tus reservas de espacios
              </p>
            </div>
            <Link
              href="/reservar"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Nueva Reserva
            </Link>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Total Reservas</p>
                  <p className="text-2xl font-bold text-black">{reservas.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Confirmadas</p>
                  <p className="text-2xl font-bold text-black">
                    {reservas.filter(r => r.estado === 'confirmada').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Completadas</p>
                  <p className="text-2xl font-bold text-black">
                    {reservas.filter(r => r.estado === 'completada').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Reservas */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-black">Historial de Reservas</h3>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando reservas...</p>
              </div>
            ) : reservas.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 mb-4">No tienes reservas aún</p>
                <Link
                  href="/reservar"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Hacer tu primera reserva
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {reservas.map((reserva) => (
                  <div key={reserva.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {getEspacioNombre(reserva.espacio)}
                            </h4>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                              <span>📅 {new Date(reserva.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</span>
                              <span>🕐 {reserva.hora}</span>
                              <span>⏱️ {reserva.duracion}</span>
                              <span className="font-medium">{reserva.precio}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(reserva.estado)}`}>
                          {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
                        </span>
                        
                        {reserva.estado === 'confirmada' && (
                          <button
                            onClick={() => handleCancelReservation(reserva)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      {/* Cancel Confirmation Modal */}
      <NotificationModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, reserva: null })}
        onConfirm={confirmarCancelacion}
        type="warning"
        title="Confirmar Cancelación"
        message={`¿Estás seguro de que quieres cancelar la reserva de ${cancelModal.reserva ? getEspacioNombre(cancelModal.reserva.espacio) : ''}?`}
      />
    </div>
  )
}
