// Exportaciones centralizadas de todos los stores de Zustand

export { default as useAuthStore } from './authStore'
export { default as useUIStore } from './uiStore'
export { default as useCoworkingStore } from './coworkingStore'
export { default as useRealTimeStore } from './realTimeStore'

// Re-export individual hooks para mayor conveniencia
import useAuthStore from './authStore'
import useUIStore from './uiStore'
import useCoworkingStore from './coworkingStore'
import useRealTimeStore from './realTimeStore'

// Hooks combinados para casos de uso comunes
export const useAuth = () => {
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  
  return { user, login, register, logout, isLoading, error }
}

export const useUI = () => {
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen)
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu)
  const openModal = useUIStore((state) => state.openModal)
  const closeModal = useUIStore((state) => state.closeModal)
  const addNotification = useUIStore((state) => state.addNotification)
  const showSuccess = useUIStore((state) => state.showSuccess)
  const showError = useUIStore((state) => state.showError)
  
  return { 
    isMobileMenuOpen, 
    toggleMobileMenu, 
    openModal, 
    closeModal, 
    addNotification,
    showSuccess,
    showError
  }
}

export const useCoworking = () => {
  const spaces = useCoworkingStore((state) => state.spaces)
  const reservations = useCoworkingStore((state) => state.reservations)
  const selectedSpace = useCoworkingStore((state) => state.selectedSpace)
  const selectSpace = useCoworkingStore((state) => state.selectSpace)
  const createReservation = useCoworkingStore((state) => state.createReservation)
  const getUserReservations = useCoworkingStore((state) => state.getUserReservations)
  
  return {
    spaces,
    reservations,
    selectedSpace,
    selectSpace,
    createReservation,
    getUserReservations
  }
}

export const useRealTime = () => {
  const updateAvailability = useRealTimeStore((state) => state.updateAvailability)
  const checkAvailability = useRealTimeStore((state) => state.checkAvailability)
  const addAvailabilityListener = useRealTimeStore((state) => state.addAvailabilityListener)
  const simulateAvailabilityCheck = useRealTimeStore((state) => state.simulateAvailabilityCheck)
  const registerReservation = useRealTimeStore((state) => state.registerReservation)
  const removeReservation = useRealTimeStore((state) => state.removeReservation)
  const cleanup = useRealTimeStore((state) => state.cleanup)
  const isChecking = useRealTimeStore((state) => state.isChecking)
  const lastUpdate = useRealTimeStore((state) => state.lastUpdate)
  
  return {
    updateAvailability,
    checkAvailability,
    addAvailabilityListener,
    simulateAvailabilityCheck,
    registerReservation,
    removeReservation,
    cleanup,
    isChecking,
    lastUpdate
  }
}
