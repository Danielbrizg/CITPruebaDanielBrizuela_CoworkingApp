import { NextResponse } from 'next/server'
import { ReservaModel } from '@/lib/reservaModel'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { sendReservationEmail } from '@/lib/emailService'

// GET - Obtener reservas del usuario
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId')
    
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' }, 
        { status: 400 }
      )
    }
    
    const reservas = await ReservaModel.obtenerReservasPorUsuario(usuarioId)
    
    return NextResponse.json({
      success: true,
      reservas: reservas
    })
    
  } catch (error) {
    console.error('Error al obtener reservas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

// POST - Crear nueva reserva
export async function POST(request) {
  try {
    const body = await request.json()
    const { usuarioId, espacio, fecha, horaInicio, duracion, usuarioEmail } = body
    
    // Validar datos requeridos
    if (!usuarioId || !espacio || !fecha || !horaInicio || !duracion) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' }, 
        { status: 400 }
      )
    }
    
    // Calcular fechas en UTC para consistencia global
    const fechaInicioUTC = new Date(`${fecha}T${horaInicio}:00.000Z`)
    const fechaFinUTC = new Date(fechaInicioUTC.getTime() + (parseFloat(duracion) * 60 * 60 * 1000))
    
    // Validar que la fecha no sea en el pasado
    const ahora = new Date()
    if (fechaInicioUTC <= ahora) {
      return NextResponse.json(
        { error: 'No puedes reservar en el pasado' }, 
        { status: 400 }
      )
    }
    
    // Validar disponibilidad del espacio
    const espacioDisponible = await ReservaModel.validarDisponibilidad(
      espacio, 
      fechaInicioUTC, 
      fechaFinUTC
    )
    
    if (!espacioDisponible) {
      return NextResponse.json(
        { error: 'El espacio no está disponible en ese horario' }, 
        { status: 409 }
      )
    }
    
    // Validar que el usuario no tenga otra reserva en ese horario
    const usuarioDisponible = await ReservaModel.validarUsuarioDisponible(
      usuarioId, 
      fechaInicioUTC, 
      fechaFinUTC
    )
    
    if (!usuarioDisponible) {
      return NextResponse.json(
        { error: 'Ya tienes una reserva en ese horario' }, 
        { status: 409 }
      )
    }
    
    // Calcular precio (ejemplo de precios)
    const precios = {
      'escritorio-compartido': 15,
      'escritorio-privado': 25,
      'sala-reuniones-pequeña': 40,
      'sala-reuniones-grande': 60,
      'oficina-privada': 80
    }
    
    const precioTotal = precios[espacio] * parseFloat(duracion)
    
    // Crear la reserva
    const reservaData = {
      usuarioId,
      espacio,
      fechaInicio: fechaInicioUTC,
      fechaFin: fechaFinUTC,
      duracion: parseFloat(duracion),
      precio: precioTotal,
      moneda: 'USD'
    }
    
    const nuevaReserva = await ReservaModel.crearReserva(reservaData)
    
    // Enviar email de confirmación
    if (usuarioEmail) {
      try {
        await sendReservationEmail(usuarioEmail, nuevaReserva, 'confirmacion')
      } catch (emailError) {
        console.error('Error enviando email:', emailError)
        // No fallar la reserva por error de email
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reserva creada exitosamente',
      reserva: nuevaReserva
    })
    
  } catch (error) {
    console.error('Error al crear reserva:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

// DELETE - Cancelar reserva
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const reservaId = searchParams.get('reservaId')
    const usuarioId = searchParams.get('usuarioId')
    const usuarioEmail = searchParams.get('usuarioEmail')
    
    if (!reservaId || !usuarioId) {
      return NextResponse.json(
        { error: 'ID de reserva y usuario requeridos' }, 
        { status: 400 }
      )
    }
    
    const reservaCancelada = await ReservaModel.cancelarReserva(reservaId, usuarioId)
    
    // Enviar email de cancelación
    if (usuarioEmail) {
      try {
        await sendReservationEmail(usuarioEmail, reservaCancelada, 'cancelacion')
      } catch (emailError) {
        console.error('Error enviando email de cancelación:', emailError)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada exitosamente'
    })
    
  } catch (error) {
    console.error('Error al cancelar reserva:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}
