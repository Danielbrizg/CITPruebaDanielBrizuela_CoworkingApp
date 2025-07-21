import { ObjectId } from 'mongodb'
import { connectDB } from '@/lib/db'

export class ReservaModel {
  static async crearReserva(reservaData) {
    const { db } = await connectDB()
    const reservasCollection = db.collection('reservas')
    
    // Convertir fechas a UTC
    const fechaInicio = new Date(reservaData.fechaInicio)
    const fechaFin = new Date(reservaData.fechaFin)
    
    const nuevaReserva = {
      ...reservaData,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      fechaCreacion: new Date(),
      estado: 'confirmada',
      usuarioId: new ObjectId(reservaData.usuarioId)
    }
    
    const result = await reservasCollection.insertOne(nuevaReserva)
    return { ...nuevaReserva, _id: result.insertedId }
  }
  
  static async obtenerReservasPorUsuario(usuarioId) {
    const { db } = await connectDB()
    const reservasCollection = db.collection('reservas')
    
    const reservas = await reservasCollection
      .find({ usuarioId: new ObjectId(usuarioId) })
      .sort({ fechaCreacion: -1 })
      .toArray()
    
    return reservas
  }
  
  static async validarDisponibilidad(espacio, fechaInicio, fechaFin, reservaIdExcluir = null) {
    const { db } = await connectDB()
    const reservasCollection = db.collection('reservas')
    
    const filtro = {
      espacio: espacio,
      estado: { $in: ['confirmada'] },
      $or: [
        // Reserva que comienza durante el período solicitado
        {
          fechaInicio: {
            $gte: new Date(fechaInicio),
            $lt: new Date(fechaFin)
          }
        },
        // Reserva que termina durante el período solicitado
        {
          fechaFin: {
            $gt: new Date(fechaInicio),
            $lte: new Date(fechaFin)
          }
        },
        // Reserva que engloba todo el período solicitado
        {
          fechaInicio: { $lte: new Date(fechaInicio) },
          fechaFin: { $gte: new Date(fechaFin) }
        }
      ]
    }
    
    // Excluir una reserva específica (útil para ediciones)
    if (reservaIdExcluir) {
      filtro._id = { $ne: new ObjectId(reservaIdExcluir) }
    }
    
    const conflictos = await reservasCollection.findOne(filtro)
    return !conflictos // Retorna true si está disponible
  }
  
  static async validarUsuarioDisponible(usuarioId, fechaInicio, fechaFin, reservaIdExcluir = null) {
    const { db } = await connectDB()
    const reservasCollection = db.collection('reservas')
    
    const filtro = {
      usuarioId: new ObjectId(usuarioId),
      estado: { $in: ['confirmada'] },
      $or: [
        {
          fechaInicio: {
            $gte: new Date(fechaInicio),
            $lt: new Date(fechaFin)
          }
        },
        {
          fechaFin: {
            $gt: new Date(fechaInicio),
            $lte: new Date(fechaFin)
          }
        },
        {
          fechaInicio: { $lte: new Date(fechaInicio) },
          fechaFin: { $gte: new Date(fechaFin) }
        }
      ]
    }
    
    if (reservaIdExcluir) {
      filtro._id = { $ne: new ObjectId(reservaIdExcluir) }
    }
    
    const conflictos = await reservasCollection.findOne(filtro)
    return !conflictos // Retorna true si el usuario está disponible
  }
  
  static async cancelarReserva(reservaId, usuarioId) {
    const { db } = await connectDB()
    const reservasCollection = db.collection('reservas')
    
    // Buscar la reserva
    const reserva = await reservasCollection.findOne({
      _id: new ObjectId(reservaId),
      usuarioId: new ObjectId(usuarioId)
    })
    
    if (!reserva) {
      throw new Error('Reserva no encontrada')
    }
    
    // Validar que no esté dentro de los 15 minutos previos
    const ahora = new Date()
    const fechaInicio = new Date(reserva.fechaInicio)
    const diferenciaMilisegundos = fechaInicio.getTime() - ahora.getTime()
    const diferenciaMinutos = diferenciaMilisegundos / (1000 * 60)
    
    if (diferenciaMinutos < 15) {
      throw new Error('No puedes cancelar la reserva dentro de los 15 minutos previos al inicio')
    }
    
    // Actualizar el estado
    const result = await reservasCollection.updateOne(
      { _id: new ObjectId(reservaId) },
      { 
        $set: { 
          estado: 'cancelada',
          fechaCancelacion: new Date()
        }
      }
    )
    
    if (result.modifiedCount === 0) {
      throw new Error('No se pudo cancelar la reserva')
    }
    
    return reserva
  }
  
  static async obtenerReservaPorId(reservaId) {
    const { db } = await connectDB()
    const reservasCollection = db.collection('reservas')
    
    const reserva = await reservasCollection.findOne({
      _id: new ObjectId(reservaId)
    })
    
    return reserva
  }
  
  static async obtenerReservasDelDia(fecha) {
    const { db } = await connectDB()
    const reservasCollection = db.collection('reservas')
    
    const inicioDia = new Date(fecha)
    inicioDia.setUTCHours(0, 0, 0, 0)
    
    const finDia = new Date(fecha)
    finDia.setUTCHours(23, 59, 59, 999)
    
    const reservas = await reservasCollection
      .find({
        fechaInicio: {
          $gte: inicioDia,
          $lte: finDia
        },
        estado: { $in: ['confirmada'] }
      })
      .toArray()
    
    return reservas
  }
  
  static async obtenerDisponibilidadEspacios(fecha) {
    const { db } = await connectDB()
    const reservasCollection = db.collection('reservas')
    
    // Crear rangos de fecha en UTC para consistencia
    const inicioDia = new Date(fecha + 'T00:00:00.000Z')
    const finDia = new Date(fecha + 'T23:59:59.999Z')
    
    const reservas = await reservasCollection
      .find({
        fechaInicio: {
          $gte: inicioDia,
          $lte: finDia
        },
        estado: { $in: ['confirmada'] }
      })
      .toArray()
    
    // Organizar por espacio y horario
    const disponibilidad = {}
    const espacios = [
      'escritorio-compartido',
      'escritorio-privado', 
      'sala-reuniones-pequeña',
      'sala-reuniones-grande',
      'oficina-privada'
    ]
    
    // Inicializar disponibilidad para todos los espacios con intervalos de 30 minutos
    espacios.forEach(espacio => {
      disponibilidad[espacio] = {}
      for (let hora = 8; hora <= 18; hora++) {
        // Agregar hora exacta (ej: "08:00")
        const horaStr = hora.toString().padStart(2, '0') + ':00'
        disponibilidad[espacio][horaStr] = 'disponible'
        
        // Agregar media hora (ej: "08:30"), excepto para la última hora
        if (hora < 18) {
          const mediaHoraStr = hora.toString().padStart(2, '0') + ':30'
          disponibilidad[espacio][mediaHoraStr] = 'disponible'
        }
      }
    })
    
    // Marcar horarios ocupados usando UTC
    reservas.forEach(reserva => {
      const fechaInicio = new Date(reserva.fechaInicio)
      const fechaFin = new Date(reserva.fechaFin)
      
      // Usar getUTCHours() y getUTCMinutes() para mantener consistencia UTC
      const inicioEnMinutos = fechaInicio.getUTCHours() * 60 + fechaInicio.getUTCMinutes()
      const finEnMinutos = fechaFin.getUTCHours() * 60 + fechaFin.getUTCMinutes()
      
      for (let minutos = inicioEnMinutos; minutos < finEnMinutos; minutos += 30) {
        const horas = Math.floor(minutos / 60)
        const mins = minutos % 60
        const horaFormateada = horas.toString().padStart(2, '0') + ':' + 
                              mins.toString().padStart(2, '0')
        
        if (disponibilidad[reserva.espacio] && disponibilidad[reserva.espacio][horaFormateada]) {
          disponibilidad[reserva.espacio][horaFormateada] = 'ocupado'
        }
      }
    })
    
    return disponibilidad
  }
  
  static async obtenerEspaciosConInfo() {
    return [
      {
        id: 'escritorio-compartido',
        nombre: 'Escritorio Compartido',
        descripcion: 'Espacio abierto ideal para trabajar de forma individual',
        precio: 15,
        capacidad: 1,
        amenidades: ['Wi-Fi', 'Electricidad', 'Café'],
        imagen: '🖥️'
      },
      {
        id: 'escritorio-privado',
        nombre: 'Escritorio Privado',
        descripcion: 'Escritorio personal en área semi-privada',
        precio: 25,
        capacidad: 1,
        amenidades: ['Wi-Fi', 'Electricidad', 'Café', 'Privacidad'],
        imagen: '🏢'
      },
      {
        id: 'sala-reuniones-pequeña',
        nombre: 'Sala de Reuniones (4-6 personas)',
        descripcion: 'Sala equipada para reuniones pequeñas',
        precio: 40,
        capacidad: 6,
        amenidades: ['Wi-Fi', 'Proyector', 'Pizarra', 'Café'],
        imagen: '👥'
      },
      {
        id: 'sala-reuniones-grande',
        nombre: 'Sala de Reuniones (8-12 personas)',
        descripcion: 'Sala grande para presentaciones y reuniones',
        precio: 60,
        capacidad: 12,
        amenidades: ['Wi-Fi', 'Proyector', 'Pizarra', 'Sistema de audio', 'Café'],
        imagen: '🏛️'
      },
      {
        id: 'oficina-privada',
        nombre: 'Oficina Privada',
        descripcion: 'Oficina completamente privada para máxima concentración',
        precio: 80,
        capacidad: 4,
        amenidades: ['Wi-Fi', 'Teléfono', 'Escritorio ejecutivo', 'Privacidad total'],
        imagen: '🔒'
      }
    ]
  }
}
