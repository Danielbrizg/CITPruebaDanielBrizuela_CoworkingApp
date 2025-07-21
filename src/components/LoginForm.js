'use client'

import { useState } from 'react'
import { useAuthStore, useUIStore } from '@/stores'
import { useRouter } from 'next/navigation'

export default function LoginForm({ onToggleForm }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password) => {
    // Al menos una mayúscula, un número y mínimo 6 caracteres
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const minLength = password.length >= 6
    
    return {
      hasUppercase,
      hasNumber,
      minLength,
      isValid: hasUppercase && hasNumber && minLength
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}

    // Validar email
    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Por favor ingresa un email válido que contenga "@"'
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        let passwordError = 'Credenciales Incorrectas '
        const requirements = []
        newErrors.password = passwordError + requirements.join(', ')
      }
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      try {
        const result = await login(formData.email, formData.password)
        // Usar el store de UI para mostrar notificación de éxito
        const { showSuccess } = useUIStore.getState()
        showSuccess('¡Login exitoso! Bienvenido de vuelta.')
        router.push('/')
      } catch (error) {
        const { showError } = useUIStore.getState()
        showError(error.message || 'Error en el login')
        setErrors({ general: error.message || 'Error en el login' })
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Iniciar Sesión
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 bg-white ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="ejemplo@correo.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 bg-white ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Tu contraseña"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <button
            onClick={onToggleForm}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  )
}
