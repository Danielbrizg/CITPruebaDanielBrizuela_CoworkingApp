import nodemailer from 'nodemailer'

/*
 * CONFIGURACIÓN DE EMAILS - CoworkingApp
 * 
 * MODO ACTUAL: GMAIL REAL ACTIVADO
 * Los emails se envían realmente usando Gmail SMTP.
 */

// Configuración del transportador de correo
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'coworkingappcithn@gmail.com',
      pass: 'bvno griw ugpm bxsa'
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

// Plantilla HTML para email de bienvenida
const getWelcomeEmailTemplate = (userName) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido a CoworkingApp</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .welcome-text {
          font-size: 18px;
          margin-bottom: 20px;
          color: #2d3748;
        }
        .features {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .feature-item {
          display: flex;
          align-items: center;
          margin: 15px 0;
          padding: 10px;
          background: #f7fafc;
          border-radius: 6px;
        }
        .feature-icon {
          background: #4299e1;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-weight: bold;
        }
        .cta-button {
          background: #4299e1;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          display: inline-block;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 20px;
          color: #718096;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🏢 CoworkingApp</div>
        <h1>¡Bienvenido a la comunidad!</h1>
      </div>
      
      <div class="content">
        <div class="welcome-text">
          <strong>¡Hola ${userName}!</strong>
        </div>
        
        <p>¡Estamos emocionados de tenerte como parte de la familia CoworkingApp! 🎉</p>
        
        <p>Has dado el primer paso para unirte a una comunidad vibrante de profesionales, emprendedores y creativos que están transformando la manera de trabajar.</p>
        
        <div class="features">
          <h3>¿Qué puedes hacer ahora?</h3>
          
          <div class="feature-item">
            <div class="feature-icon">📅</div>
            <div>
              <strong>Reservar espacios</strong><br>
              Encuentra el espacio perfecto para tu trabajo diario
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">👥</div>
            <div>
              <strong>Conectar con otros</strong><br>
              Conoce profesionales de tu área y colabora en proyectos
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">🎯</div>
            <div>
              <strong>Eventos exclusivos</strong><br>
              Participa en workshops, networking y actividades especiales
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">💡</div>
            <div>
              <strong>Recursos premium</strong><br>
              Accede a salas de reuniones, tecnología y servicios adicionales
            </div>
          </div>
        </div>
        
        <p>Tu cuenta ya está activa y lista para usar. ¡Explora todo lo que CoworkingApp tiene para ofrecerte!</p>
        
        <div style="text-align: center;">
          <a href="http://localhost:3000/dashboard" class="cta-button">
            Ir a mi Dashboard
          </a>
        </div>
        
        <p><strong>Consejos para empezar:</strong></p>
        <ul>
          <li>Completa tu perfil para que otros miembros puedan conocerte mejor</li>
          <li>Explora los diferentes espacios disponibles</li>
          <li>Únete a nuestros grupos de WhatsApp para mantenerte al día</li>
          <li>Síguenos en redes sociales para no perderte nuestros eventos</li>
        </ul>
        
        <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Estamos aquí para hacer que tu experiencia sea increíble.</p>
        
        <p>¡Bienvenido a bordo! 🚀</p>
        
        <p>
          Saludos cordiales,<br>
          <strong>El equipo de CoworkingApp</strong>
        </p>
      </div>
      
      <div class="footer">
        <p>Este correo fue enviado porque te registraste en CoworkingApp</p>
        <p>📧 coworkingappcithn@gmail.com</p>
        <p>San Pedro Sula, Honduras | www.coworkingapp.com</p>
      </div>
    </body>
    </html>
  `
}

// Función para enviar email de bienvenida
export const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    console.log(`🔄 Intentando enviar email de bienvenida a: ${userEmail}`)
    
    const transporter = createTransporter()
    
    // Verificar la conexión
    try {
      await transporter.verify()
      console.log('✅ Conexión SMTP verificada exitosamente')
    } catch (verifyError) {
      console.log('⚠️ No se pudo verificar SMTP, pero continuando:', verifyError.message)
    }
    
    const mailOptions = {
      from: {
        name: 'CoworkingApp',
        address: 'coworkingappcithn@gmail.com'
      },
      to: userEmail,
      subject: '🎉 ¡Bienvenido a CoworkingApp! Tu cuenta está lista',
      html: getWelcomeEmailTemplate(userName),
      text: `¡Hola ${userName}! Bienvenido a CoworkingApp. Tu cuenta ya está activa y lista para usar. Visita http://localhost:3001/dashboard para comenzar. ¡Estamos emocionados de tenerte en nuestra comunidad!`
    }
    
    console.log('📧 Enviando email con opciones:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    })
    
    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email de bienvenida enviado REALMENTE a:', userEmail)
    console.log('📨 Message ID:', result.messageId)
    
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error.message)
    console.error('🔍 Error completo:', error)
    // No lanzamos el error para que no falle el registro si el email falla
    return { success: false, error: error.message }
  }
}

export default {
  sendWelcomeEmail
}

// Función para enviar emails de reservas
export const sendReservationEmail = async (userEmail, reservaData, tipo) => {
  try {
    console.log(`📧 Enviando email de ${tipo} de reserva a:`, userEmail)
    
    const transporter = createTransporter()
    
    const tipoTextos = {
      confirmacion: {
        subject: '✅ Reserva Confirmada - CoworkingApp',
        titulo: '¡Tu reserva ha sido confirmada!',
        mensaje: 'Tu reserva se ha procesado exitosamente.',
        color: '#10b981'
      },
      cancelacion: {
        subject: '❌ Reserva Cancelada - CoworkingApp', 
        titulo: 'Reserva cancelada',
        mensaje: 'Tu reserva ha sido cancelada.',
        color: '#ef4444'
      }
    }
    
    const config = tipoTextos[tipo]
    
    const espacioNombres = {
      'escritorio-compartido': 'Escritorio Compartido',
      'escritorio-privado': 'Escritorio Privado',
      'sala-reuniones-pequeña': 'Sala de Reuniones (4-6 personas)',
      'sala-reuniones-grande': 'Sala de Reuniones (8-12 personas)',
      'oficina-privada': 'Oficina Privada'
    }
    
    const fechaInicio = new Date(reservaData.fechaInicio)
    const fechaFin = new Date(reservaData.fechaFin)
    
    const mailOptions = {
      from: {
        name: 'CoworkingApp',
        address: 'coworkingappcithn@gmail.com'
      },
      to: userEmail,
      subject: config.subject,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${config.titulo}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${config.color}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">${config.titulo}</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${config.mensaje}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Detalles de la Reserva</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>🏢 Espacio:</strong> ${espacioNombres[reservaData.espacio] || reservaData.espacio}</p>
              <p style="margin: 0 0 10px 0;"><strong>📅 Fecha:</strong> ${fechaInicio.toLocaleDateString('es-ES')}</p>
              <p style="margin: 0 0 10px 0;"><strong>🕐 Hora de inicio:</strong> ${fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin: 0 0 10px 0;"><strong>🕐 Hora de fin:</strong> ${fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin: 0 0 10px 0;"><strong>⏱️ Duración:</strong> ${reservaData.duracion} hora(s)</p>
              ${reservaData.precio ? `<p style="margin: 0;"><strong>💰 Precio:</strong> $${reservaData.precio} ${reservaData.moneda || 'USD'}</p>` : ''}
            </div>
            
            ${tipo === 'confirmacion' ? `
              <div style="background: #e6f7ff; border-left: 4px solid #1890ff; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #0066cc;"><strong>💡 Recordatorio:</strong></p>
                <p style="margin: 5px 0 0 0; color: #0066cc;">• Puedes cancelar tu reserva hasta 15 minutos antes del inicio</p>
                <p style="margin: 5px 0 0 0; color: #0066cc;">• Llega unos minutos antes para el check-in</p>
                <p style="margin: 5px 0 0 0; color: #0066cc;">• Si tienes alguna pregunta, no dudes en contactarnos</p>
              </div>
            ` : `
              <div style="background: #fff2f0; border-left: 4px solid #ff4d4f; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #cc0000;"><strong>ℹ️ Información:</strong></p>
                <p style="margin: 5px 0 0 0; color: #cc0000;">• Tu reserva ha sido cancelada exitosamente</p>
                <p style="margin: 5px 0 0 0; color: #cc0000;">• Puedes hacer una nueva reserva cuando gustes</p>
              </div>
            `}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:3000/mis-reservas" 
                 style="background: ${config.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Ver Mis Reservas
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Gracias por elegir CoworkingApp</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ${config.titulo}
        ${config.mensaje}
        
        Detalles de la Reserva:
        - Espacio: ${espacioNombres[reservaData.espacio] || reservaData.espacio}
        - Fecha: ${fechaInicio.toLocaleDateString('es-ES')}
        - Hora de inicio: ${fechaInicio.toLocaleTimeString('es-ES')}
        - Hora de fin: ${fechaFin.toLocaleTimeString('es-ES')}
        - Duración: ${reservaData.duracion} hora(s)
        ${reservaData.precio ? `- Precio: $${reservaData.precio} ${reservaData.moneda || 'USD'}` : ''}
        
        ¡Gracias por usar CoworkingApp!
      `
    }
    
    await transporter.sendMail(mailOptions)
    console.log(`✅ Email de ${tipo} de reserva enviado REALMENTE a:`, userEmail)
    
  } catch (error) {
    console.error(`❌ Error enviando email de ${tipo} de reserva:`, error)
    throw error
  }
}
