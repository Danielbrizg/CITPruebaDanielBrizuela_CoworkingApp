'use client'

import Link from "next/link"
import { useAuthStore } from "@/stores"
import { useRouter } from "next/navigation"

export default function PaginaInicio() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const manejarCerrarSesion = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <EncabezadoPrincipal user={user} onLogout={manejarCerrarSesion} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SeccionHero user={user} />
      </main>

      <PiePagina />
    </div>
  )
}

function EncabezadoPrincipal({ user, onLogout }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <LogoEmpresa />
          
          {user && <MenuNavegacionPrincipal />}
          
          <SeccionAutenticacion user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  )
}

function LogoEmpresa() {
  return (
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
  )
}

function MenuNavegacionPrincipal() {
  const elementosMenu = [
    { href: '/', label: 'Inicio', activo: true },
    { href: '/espacios-disponibles', label: 'Espacios Disponibles', activo: false },
    { href: '/reservar', label: 'Reservar', activo: false },
    { href: '/mis-reservas', label: 'Mis Reservas', activo: false }
  ]

  return (
    <nav className="flex-1 flex justify-center">
      <div className="flex items-center space-x-8">
        {elementosMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-lg py-3 px-4 rounded-lg transition-all ${
              item.activo
                ? 'text-blue-600 font-semibold bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

function SeccionAutenticacion({ user, onLogout }) {
  if (!user) {
    return (
      <div className="flex items-center space-x-6">
        <Link
          href="/auth"
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors text-lg py-2 px-4"
        >
          Iniciar Sesión
        </Link>
        <Link
          href="/auth"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
        >
          Registrarse
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="text-right">
        <div className="text-sm text-gray-500">Bienvenido</div>
        <div className="text-lg font-medium text-gray-900">
          {user.name || user.email}
        </div>
      </div>
      <button
        onClick={onLogout}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
      >
        Cerrar Sesión
      </button>
    </div>
  )
}

function SeccionHero({ user }) {
  return (
    <section id="inicio" className="py-32 text-center min-h-screen flex items-center justify-center">
      <div className="max-w-4xl mx-auto">
        <TituloHero />
        <DescripcionHero />
        <AccionesHero user={user} />
      </div>
    </section>
  )
}

function TituloHero() {
  return (
    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
      Bienvenido a 
      <span className="text-blue-600"> CoworkingApp</span>
    </h1>
  )
}

function DescripcionHero() {
  return (
    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
      El espacio de coworking perfecto para profesionales, emprendedores y equipos creativos. 
      Conecta, colabora y haz crecer tu negocio en un ambiente inspirador.
    </p>
  )
}

function AccionesHero({ user }) {
  if (!user) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/auth"
          className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg inline-flex items-center"
        >
          Comienza Gratis
          <IconoFlecha />
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-lg text-gray-600 mb-6">
        ¡Hola {user.name || user.email}! Bienvenido de vuelta a CoworkingApp.
      </p>
      <Link
        href="/espacios-disponibles"
        className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg inline-flex items-center"
      >
        Ver Espacios Disponibles
        <IconoFlecha />
      </Link>
    </div>
  )
}

function IconoFlecha() {
  return (
    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

function PiePagina() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <InfoEmpresa />
          <InfoContacto />
          <DerechosAutor />
        </div>
      </div>
    </footer>
  )
}

function InfoEmpresa() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">C</span>
        </div>
        <h3 className="text-xl font-bold">CoworkingApp</h3>
      </div>
      <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
        El espacio de coworking líder donde profesionales y emprendedores 
        hacen crecer sus proyectos y conectan con una comunidad vibrante.
      </p>
    </div>
  )
}

function InfoContacto() {
  const elementosContacto = [
    { icono: '📧', texto: 'danielbrizuela2003@gmail.com' },
    { icono: '📍', texto: 'San Pedro Sula, Honduras' }
  ]

  return (
    <div className="mb-8">
      <h4 className="text-lg font-semibold mb-4">Contacto</h4>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-400">
        {elementosContacto.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span>{item.icono}</span>
            <span>{item.texto}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DerechosAutor() {
  return (
    <div className="border-t border-gray-800 pt-8 text-gray-400">
      <p>&copy; 2025 Daniel Brizuela - CoworkingApp</p>
    </div>
  )
}
