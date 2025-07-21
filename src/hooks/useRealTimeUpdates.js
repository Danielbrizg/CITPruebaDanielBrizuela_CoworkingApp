import { useEffect, useCallback } from 'react'
import { useRealTime } from '@/stores'


export function useRealTimeUpdates() {
  const {
    updateAvailability,
    checkAvailability,
    addAvailabilityListener,
    simulateAvailabilityCheck,
    registerReservation,
    removeReservation,
    cleanup,
    isChecking,
    lastUpdate
  } = useRealTime()

  // Simular conexión después de un breve delay
  useEffect(() => {
    console.log('🔄 Sistema de tiempo real inicializado con Zustand')
    
    // Limpiar datos antiguos cada 5 minutos
    const cleanupInterval = setInterval(() => {
      cleanup()
    }, 5 * 60 * 1000)
    
    return () => {
      clearInterval(cleanupInterval)
    }
  }, [cleanup])

  // Función para unirse a verificación de disponibilidad
  const joinAvailabilityCheck = useCallback(async (reservationData) => {
    console.log('🔍 Verificando disponibilidad:', reservationData)
    
    try {
      const isAvailable = await simulateAvailabilityCheck(reservationData)
      console.log(`✅ Disponibilidad verificada: ${isAvailable ? 'Disponible' : 'No disponible'}`)
      return isAvailable
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error)
      return false
    }
  }, [simulateAvailabilityCheck])

  // Función para salir de verificación de disponibilidad
  const leaveAvailabilityCheck = useCallback(() => {
    console.log('⏹️ Finalizando verificación de disponibilidad')
    // En esta implementación no hay necesidad de hacer nada específico
  }, [])

  // Notificar cuando se crea una reserva
  const notifyReservationCreated = useCallback((reservationData) => {
    console.log('📅 Reserva creada:', reservationData)
    registerReservation(reservationData)
    
    // Simular notificación a otros usuarios
    setTimeout(() => {
      console.log('🔔 Notificación enviada a otros usuarios sobre nueva reserva')
    }, 100)
  }, [registerReservation])

  // Notificar cuando se cancela una reserva
  const notifyReservationCancelled = useCallback((reservationData) => {
    console.log('❌ Reserva cancelada:', reservationData)
    removeReservation(reservationData)
    
    // Simular notificación a otros usuarios
    setTimeout(() => {
      console.log('🔔 Notificación enviada a otros usuarios sobre cancelación')
    }, 100)
  }, [removeReservation])

  // Escuchar cambios de disponibilidad
  const onAvailabilityChanged = useCallback((callback) => {
    console.log('👂 Escuchando cambios de disponibilidad')
    return addAvailabilityListener(callback)
  }, [addAvailabilityListener])

  // Verificar disponibilidad específica
  const getAvailabilityStatus = useCallback((spaceId, date) => {
    return checkAvailability(spaceId, date)
  }, [checkAvailability])

  // Actualizar disponibilidad manualmente
  const updateSpaceAvailability = useCallback((spaceId, date, available, reason = null) => {
    updateAvailability(spaceId, date, available, reason)
  }, [updateAvailability])

  return {
    // Estado
    isConnected: true, // Siempre conectado con Zustand
    isChecking,
    lastUpdate,
    
    // Funciones principales (mantienen la misma interfaz que el hook anterior)
    joinAvailabilityCheck,
    leaveAvailabilityCheck,
    notifyReservationCreated,
    onAvailabilityChanged,
    
    // Nuevas funciones específicas
    notifyReservationCancelled,
    getAvailabilityStatus,
    updateSpaceAvailability
  }
}
