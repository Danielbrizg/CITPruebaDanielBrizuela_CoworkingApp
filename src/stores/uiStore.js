import { create } from 'zustand'

// Store para el estado de la UI
const useUIStore = create((set, get) => ({
  // Estado de la navegación móvil
  isMobileMenuOpen: false,
  
  // Estado de modales
  isModalOpen: false,
  modalType: null, // 'login', 'register', 'profile', etc.
  
  // Estado de notificaciones/toasts
  notifications: [],
  
  // Estado de loading global
  isGlobalLoading: false,
  
  // Tema de la aplicación
  theme: 'light', // 'light' | 'dark'

  // Acciones para navegación móvil
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => set((state) => ({ 
    isMobileMenuOpen: !state.isMobileMenuOpen 
  })),

  // Acciones para modales
  openModal: (type) => set({ 
    isModalOpen: true, 
    modalType: type 
  }),
  closeModal: () => set({ 
    isModalOpen: false, 
    modalType: null 
  }),

  // Acciones para notificaciones
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, {
      id: Date.now(),
      type: 'info', // 'success', 'error', 'warning', 'info'
      message: '',
      duration: 5000,
      ...notification
    }]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(notif => notif.id !== id)
  })),
  
  clearAllNotifications: () => set({ notifications: [] }),

  // Acciones para loading global
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  // Acciones para tema
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),

  // Función helper para mostrar notificaciones de éxito/error
  showSuccess: (message) => get().addNotification({
    type: 'success',
    message
  }),
  
  showError: (message) => get().addNotification({
    type: 'error',
    message
  }),
  
  showWarning: (message) => get().addNotification({
    type: 'warning',
    message
  }),
  
  showInfo: (message) => get().addNotification({
    type: 'info',
    message
  })
}))

export default useUIStore
