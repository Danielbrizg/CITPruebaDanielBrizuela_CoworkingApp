import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authAPI } from '@/lib/api'

// Store de autenticación con Zustand conectado a MongoDB
const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isLoading: false,
      error: null,

      // Acciones
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        
        try {
          // Conectar con MongoDB a través de la API
          const result = await authAPI.login({ email, password })
          
          set({ 
            user: result.user, 
            isLoading: false,
            error: null 
          })
          
          return { success: true, user: result.user }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Error en el login' 
          })
          throw error
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null })
        
        try {
          // Conectar con MongoDB a través de la API
          const result = await authAPI.register({ name, email, password })
          
          set({ 
            user: result.user, 
            isLoading: false,
            error: null 
          })
          
          return { success: true, user: result.user }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Error en el registro' 
          })
          throw error
        }
      },

      // Actualizar perfil de usuario
      updateProfile: async (updateData) => {
        const { user } = get()
        if (!user?._id) return { success: false, error: 'Usuario no encontrado' }

        set({ isLoading: true, error: null })
        
        try {
          const result = await authAPI.updateProfile(user._id, updateData)
          
          set({ 
            user: result.user, 
            isLoading: false,
            error: null 
          })
          
          return { success: true, user: result.user }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Error actualizando perfil' 
          })
          throw error
        }
      },

      // Cambiar contraseña
      changePassword: async (currentPassword, newPassword) => {
        const { user } = get()
        if (!user?._id) return { success: false, error: 'Usuario no encontrado' }

        set({ isLoading: true, error: null })
        
        try {
          await authAPI.changePassword(user._id, currentPassword, newPassword)
          
          set({ 
            isLoading: false,
            error: null 
          })
          
          return { success: true, message: 'Contraseña actualizada exitosamente' }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Error cambiando contraseña' 
          })
          throw error
        }
      },

      // Refrescar datos del usuario
      refreshUser: async () => {
        const { user } = get()
        if (!user?._id) return

        set({ isLoading: true, error: null })
        
        try {
          const result = await authAPI.getProfile(user._id)
          
          set({ 
            user: result.user, 
            isLoading: false,
            error: null 
          })
          
          return { success: true, user: result.user }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Error refrescando usuario' 
          })
          // Si hay error al refrescar, podríamos hacer logout
          if (error.message.includes('no encontrado')) {
            get().logout()
          }
          throw error
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isLoading: false, 
          error: null 
        })
      },

      clearError: () => {
        set({ error: null })
      },

      // Verificar si el usuario está autenticado
      isAuthenticated: () => {
        const { user } = get()
        return !!user && !!user._id
      },

      // Obtener role del usuario
      getUserRole: () => {
        const { user } = get()
        return user?.role || 'user'
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user 
      })
    }
  )
)

export default useAuthStore
