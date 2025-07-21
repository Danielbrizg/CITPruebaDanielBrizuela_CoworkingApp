import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Store para espacios y reservas de coworking
const useCoworkingStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      spaces: [
        {
          id: 1,
          name: 'Escritorio Compartido',
          type: 'shared-desk',
          description: 'Espacio de trabajo compartido en área abierta',
          price: 25,
          priceType: 'day',
          capacity: 1,
          amenities: ['Wi-Fi', 'Café', 'Impresora'],
          available: true,
          image: '/images/shared-desk.jpg'
        },
        {
          id: 2,
          name: 'Oficina Privada',
          type: 'private-office',
          description: 'Oficina privada para 2-4 personas',
          price: 150,
          priceType: 'day',
          capacity: 4,
          amenities: ['Wi-Fi', 'Teléfono', 'Pizarra', 'Café'],
          available: true,
          image: '/images/private-office.jpg'
        },
        {
          id: 3,
          name: 'Sala de Reuniones',
          type: 'meeting-room',
          description: 'Sala equipada para reuniones y presentaciones',
          price: 50,
          priceType: 'hour',
          capacity: 8,
          amenities: ['Proyector', 'Wi-Fi', 'Pizarra', 'Videoconferencia'],
          available: true,
          image: '/images/meeting-room.jpg'
        }
      ],
      
      reservations: [],
      selectedSpace: null,
      selectedDate: null,
      selectedTimeSlot: null,
      isLoading: false,
      error: null,

      // Acciones para espacios
      setSpaces: (spaces) => set({ spaces }),
      
      getSpaceById: (id) => {
        const { spaces } = get()
        return spaces.find(space => space.id === id)
      },
      
      getSpacesByType: (type) => {
        const { spaces } = get()
        return spaces.filter(space => space.type === type)
      },
      
      getAvailableSpaces: () => {
        const { spaces } = get()
        return spaces.filter(space => space.available)
      },

      // Acciones para reservas
      addReservation: (reservation) => set((state) => ({
        reservations: [...state.reservations, {
          id: Date.now(),
          userId: null, // Se asignará desde el authStore
          status: 'pending',
          createdAt: new Date().toISOString(),
          ...reservation
        }]
      })),
      
      updateReservation: (id, updates) => set((state) => ({
        reservations: state.reservations.map(reservation => 
          reservation.id === id 
            ? { ...reservation, ...updates }
            : reservation
        )
      })),
      
      cancelReservation: (id) => set((state) => ({
        reservations: state.reservations.map(reservation => 
          reservation.id === id 
            ? { ...reservation, status: 'cancelled' }
            : reservation
        )
      })),
      
      getUserReservations: (userId) => {
        const { reservations } = get()
        return reservations.filter(reservation => reservation.userId === userId)
      },

      // Acciones para el proceso de reserva
      selectSpace: (space) => set({ selectedSpace: space }),
      selectDate: (date) => set({ selectedDate: date }),
      selectTimeSlot: (timeSlot) => set({ selectedTimeSlot: timeSlot }),
      
      clearSelection: () => set({
        selectedSpace: null,
        selectedDate: null,
        selectedTimeSlot: null
      }),

      // Acciones para crear una reserva completa
      createReservation: async (reservationData) => {
        set({ isLoading: true, error: null })
        
        try {
          const { selectedSpace, selectedDate, selectedTimeSlot } = get()
          
          if (!selectedSpace || !selectedDate) {
            throw new Error('Faltan datos para la reserva')
          }
          
          const newReservation = {
            spaceId: selectedSpace.id,
            spaceName: selectedSpace.name,
            date: selectedDate,
            timeSlot: selectedTimeSlot,
            totalPrice: calculateReservationPrice(selectedSpace, selectedTimeSlot),
            ...reservationData
          }
          
          // Simular API call
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          get().addReservation(newReservation)
          get().clearSelection()
          
          set({ isLoading: false })
          
          return { success: true, reservation: newReservation }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Error al crear la reserva' 
          })
          return { success: false, error: error.message }
        }
      },

      // Funciones de utilidad
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ isLoading: loading })
    }),
    {
      name: 'coworking-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        reservations: state.reservations,
        spaces: state.spaces
      })
    }
  )
)

// Función helper para calcular el precio de una reserva
function calculateReservationPrice(space, timeSlot) {
  if (!space || !timeSlot) return 0
  
  if (space.priceType === 'hour') {
    const duration = timeSlot.end - timeSlot.start // en horas
    return space.price * duration
  } else if (space.priceType === 'day') {
    return space.price
  }
  
  return space.price
}

export default useCoworkingStore
