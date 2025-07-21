// Validaciones para formularios de autenticación

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return {
    isValid: emailRegex.test(email),
    error: !emailRegex.test(email) ? 'Por favor ingresa un email válido que contenga "@"' : null
  }
}

export const validatePassword = (password) => {
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const minLength = password.length >= 6
  const maxLength = password.length <= 50
  
  const requirements = []
  if (!hasUppercase) requirements.push('una letra mayúscula')
  if (!hasNumber) requirements.push('al menos un número')
  if (!hasLowercase) requirements.push('una letra minúscula')
  if (!minLength) requirements.push('mínimo 6 caracteres')
  if (!maxLength) requirements.push('máximo 50 caracteres')
  
  const isValid = hasUppercase && hasNumber && hasLowercase && minLength && maxLength
  
  return {
    isValid,
    hasUppercase,
    hasNumber,
    hasLowercase,
    minLength,
    maxLength,
    error: !isValid ? `La contraseña debe contener: ${requirements.join(', ')}` : null
  }
}

export const validatePasswordConfirmation = (password, confirmPassword) => {
  const matches = password === confirmPassword
  return {
    isValid: matches,
    error: !matches ? 'Las contraseñas no coinciden' : null
  }
}

export const validateRequired = (value, fieldName) => {
  const isValid = value && value.trim().length > 0
  return {
    isValid,
    error: !isValid ? `${fieldName} es requerido` : null
  }
}
