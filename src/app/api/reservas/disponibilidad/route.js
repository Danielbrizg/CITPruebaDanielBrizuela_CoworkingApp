import { NextResponse } from 'next/server'
import { ReservaModel } from '@/lib/reservaModel'

export async function POST(request) {
  try {
    const body = await request.json()
    const { espacio, fecha, horaInicio, duracion, usuarioId } = body
    
    console.log('Datos recibidos para verificar disponibilidad:', {
      espacio, fecha, horaInicio, duracion, usuarioId
    })
    
    if (!espacio || !fecha || !horaInicio || !duracion || !usuarioId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' }, 
        { status: 400 }
      )
    }
    
    // Calcular fechas en UTC
    const fechaInicioUTC = new Date(`${fecha}T${horaInicio}:00.000Z`)
    const fechaFinUTC = new Date(fechaInicioUTC.getTime() + (parseInt(duracion) * 60 * 60 * 1000))
    
    console.log('Fechas calculadas:', {
      fechaInicioUTC: fechaInicioUTC.toISOString(),
      fechaFinUTC: fechaFinUTC.toISOString()
    })
    
    // Validar que la fecha no sea en el pasado
    const ahora = new Date()
    if (fechaInicioUTC <= ahora) {
      return NextResponse.json({
        disponible: false,
        razon: 'No puedes reservar en el pasado'
      })
    }
    
    // Validar disponibilidad del espacio
    const espacioDisponible = await ReservaModel.validarDisponibilidad(
      espacio, 
      fechaInicioUTC, 
      fechaFinUTC
    )
    
    console.log('Espacio disponible:', espacioDisponible)
    
    if (!espacioDisponible) {
      return NextResponse.json({
        disponible: false,
        razon: 'El espacio ya está reservado en ese horario'
      })
    }
    
    // Validar que el usuario no tenga otra reserva en ese horario
    const usuarioDisponible = await ReservaModel.validarUsuarioDisponible(
      usuarioId, 
      fechaInicioUTC, 
      fechaFinUTC
    )
    
    console.log('Usuario disponible:', usuarioDisponible)
    
    if (!usuarioDisponible) {
      return NextResponse.json({
        disponible: false,
        razon: 'Ya tienes una reserva en ese horario'
      })
    }
    
    return NextResponse.json({
      disponible: true,
      fechaInicio: fechaInicioUTC,
      fechaFin: fechaFinUTC
    })
    
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}
