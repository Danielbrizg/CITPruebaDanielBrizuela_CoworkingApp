export function ErrorMessage({ error }) {
  if (!error) return null
  
  return (
    <p className="text-red-500 text-sm mt-1">{error}</p>
  )
}

export function SuccessMessage({ message }) {
  if (!message) return null
  
  return (
    <p className="text-green-500 text-sm mt-1">{message}</p>
  )
}

export function AlertBox({ type = 'error', message, className = '' }) {
  if (!message) return null
  
  const baseClasses = "px-4 py-3 rounded border text-sm"
  const typeClasses = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-green-50 border-green-200 text-green-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    info: "bg-blue-50 border-blue-200 text-blue-700"
  }
  
  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      {message}
    </div>
  )
}
