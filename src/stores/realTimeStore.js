import { create } from 'zustand'

/**
 * Store de Zustand para manejar actualizaciones en tiempo real
 * Reemplaza la funcionalidad de Socket.IO
 */
const useRealTimeStore = create((set, get) => ({
  // Estado de disponibilidad en tiempo real
  availabilityUpdates: new Map(),
  lastUpdate: null,
  isChecking: false,
  
  // Listeners para cambios de disponibilidad
  availabilityListeners: new Set(),
  
  // Datos de reservas recientes para simular tiempo real
  recentReservations: [],
  
  // Acciones para manejar disponibilidad
  updateAvailability: (spaceId, date, available, reason = null) => {
    const key = `${spaceId}-${date}`
    set((state) => {
      const newUpdates = new Map(state.availabilityUpdates)
      newUpdates.set(key, {
        spaceId,
        date,
        available,
        reason,
        timestamp: new Date().toISOString()
      })
      
      return {
        availabilityUpdates: newUpdates,
        lastUpdate: new Date().toISOString()
      }
    })
    
    // Notificar a los listeners
    get().notifyAvailabilityListeners({ spaceId, date, available, reason })
  },
  
  // Verificar disponibilidad desde el store
  checkAvailability: (spaceId, date) => {
    const key = `${spaceId}-${date}`
    const updates = get().availabilityUpdates
    return updates.get(key) || null
  },
  
  // Agregar listener para cambios de disponibilidad
  addAvailabilityListener: (callback) => {
    const listeners = get().availabilityListeners
    listeners.add(callback)
    
    // Retornar función de limpieza
    return () => {
      listeners.delete(callback)
    }
  },
  
  // Notificar a todos los listeners
  notifyAvailabilityListeners: (data) => {
    const listeners = get().availabilityListeners
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error en listener de disponibilidad:', error)
      }
    })
  },
  
  // Simular verificación de disponibilidad
  simulateAvailabilityCheck: async (reservationData) => {
    set({ isChecking: true })
    
    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { espacio, fecha, horaInicio, duracion } = reservationData
      
      // Verificar si hay conflictos en reservas recientes
      const recentReservations = get().recentReservations
      const hasConflict = recentReservations.some(reservation => 
        reservation.espacio === espacio &&
        reservation.fecha === fecha &&
        reservation.horaInicio === horaInicio
      )
      
      get().updateAvailability(
        espacio,
        `${fecha}-${horaInicio}`,
        !hasConflict,
        hasConflict ? 'Reservado recientemente' : null
      )
      
      return !hasConflict
    } finally {
      set({ isChecking: false })
    }
  },
  
  // Registrar nueva reserva
  registerReservation: (reservationData) => {
    set((state) => ({
      recentReservations: [
        ...state.recentReservations.slice(-9), // Mantener solo las últimas 10
        {
          ...reservationData,
          timestamp: new Date().toISOString()
        }
      ]
    }))
    
    // Actualizar disponibilidad
    const { espacio, fecha, horaInicio } = reservationData
    get().updateAvailability(
      espacio,
      `${fecha}-${horaInicio}`,
      false,
      'Espacio reservado'
    )
  },
  
  // Limpiar reserva (cancelación)
  removeReservation: (reservationData) => {
    const { espacio, fecha, horaInicio } = reservationData
    
    set((state) => ({
      recentReservations: state.recentReservations.filter(reservation =>
        !(reservation.espacio === espacio &&
          reservation.fecha === fecha &&
          reservation.horaInicio === horaInicio)
      )
    }))
    
    // Actualizar disponibilidad
    get().updateAvailability(
      espacio,
      `${fecha}-${horaInicio}`,
      true,
      null
    )
  },
  
  // Limpiar datos antiguos
  cleanup: () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    set((state) => {
      const newUpdates = new Map()
      const newReservations = []
      
      // Filtrar actualizaciones antiguas
      state.availabilityUpdates.forEach((value, key) => {
        if (new Date(value.timestamp) > oneHourAgo) {
          newUpdates.set(key, value)
        }
      })
      
      // Filtrar reservas antiguas
      state.recentReservations.forEach(reservation => {
        if (new Date(reservation.timestamp) > oneHourAgo) {
          newReservations.push(reservation)
        }
      })
      
      return {
        availabilityUpdates: newUpdates,
        recentReservations: newReservations
      }
    })
  },
  
  // Reset completo del store
  reset: () => {
    set({
      availabilityUpdates: new Map(),
      lastUpdate: null,
      isChecking: false,
      recentReservations: []
    })
  }
}))

export default useRealTimeStore
