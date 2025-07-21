import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/emailService'

export async function POST(request) {
  try {
    const { email, password, name } = await request.json()

    // Validaciones básicas
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El email debe contener @' },
        { status: 400 }
      )
    }

    // Validar contraseña (mayúscula y números)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'La contraseña debe incluir una letra mayúscula y números' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await db.users.findByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe con este email' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Crear el usuario
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      isActive: true
    }

    const newUser = await db.users.create(userData)

    // Send welcome email (don't let email failure break registration)
    try {
      await sendWelcomeEmail(email, name)
      console.log(`Welcome email sent to ${email}`)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError.message)
      // Continue with successful registration even if email fails
    }

    // Remover la contraseña del objeto de respuesta
    const { password: _, ...userResponse } = newUser

    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente. ¡Te hemos enviado un email de bienvenida!',
      user: userResponse
    }, { status: 201 })

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
