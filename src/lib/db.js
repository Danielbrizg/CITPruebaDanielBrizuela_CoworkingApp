// MongoDB Connection Configuration
// Este archivo manejará todas las conexiones a MongoDB

import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

// MongoDB connection URI - Nueva conexión
const uri = "mongodb+srv://danielbrizuela2003:123@cluster0.qma8h6c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Variable para almacenar la conexión
let dbConnection = null
let database = null

/**
 * Establece conexión con MongoDB
 * @returns {Promise} Promise que resuelve con la conexión
 */
export async function connectDB() {
  try {
    if (dbConnection && database) {
      return { client: dbConnection, db: database }
    }

    console.log('Conectando a MongoDB...')
    
    // Conectar el cliente al servidor
    await client.connect()
    
    // Verificar la conexión con un ping
    await client.db("admin").command({ ping: 1 })
    console.log("Conectado exitosamente a MongoDB!")

    // Establecer la base de datos para la aplicación - Nombre cambiado
    dbConnection = client
    database = client.db("coworkingapp")  // Cambiado de "coworking_app" a "coworkingapp"

    return { client: dbConnection, db: database }
  } catch (error) {
    console.error('Error conectando a MongoDB:', error)
    throw error
  }
}

/**
 * Cierra la conexión a MongoDB
 */
export async function disconnectDB() {
  try {
    if (dbConnection) {
      console.log('Cerrando conexión a MongoDB...')
      await dbConnection.close()
      dbConnection = null
      database = null
      console.log('Conexión cerrada')
    }
  } catch (error) {
    console.error('Error cerrando la conexión:', error)
    throw error
  }
}

/**
 * Obtiene la conexión actual de MongoDB
 * @returns {Object} Conexión actual o null
 */
export function getConnection() {
  return { client: dbConnection, db: database }
}

/**
 * Verifica si hay conexión activa con MongoDB
 * @returns {boolean} True si hay conexión
 */
export function isConnected() {
  return dbConnection !== null && database !== null
}

// Funciones de utilidad para consultas MongoDB
export const db = {
  // Método para obtener una colección
  getCollection(collectionName) {
    if (!database) {
      throw new Error('Base de datos no conectada')
    }
    return database.collection(collectionName)
  },

  // Método para insertar un documento
  async insertOne(collection, document) {
    if (!isConnected()) {
      await connectDB()
    }
    
    try {
      const coll = this.getCollection(collection)
      const result = await coll.insertOne({
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      console.log(`Documento insertado en ${collection}:`, result.insertedId)
      return {
        ...document,
        _id: result.insertedId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      console.error('Error en inserción:', error)
      throw error
    }
  },

  // Método para insertar múltiples documentos
  async insertMany(collection, documents) {
    if (!isConnected()) {
      await connectDB()
    }
    
    try {
      const coll = this.getCollection(collection)
      const documentsWithTimestamps = documents.map(doc => ({
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      
      const result = await coll.insertMany(documentsWithTimestamps)
      console.log(`${result.insertedCount} documentos insertados en ${collection}`)
      return result
    } catch (error) {
      console.error('Error en inserción múltiple:', error)
      throw error
    }
  },

  // Método para buscar un documento
  async findOne(collection, filter = {}) {
    if (!isConnected()) {
      await connectDB()
    }
    
    try {
      const coll = this.getCollection(collection)
      const result = await coll.findOne(filter)
      return result
    } catch (error) {
      console.error('Error en búsqueda:', error)
      throw error
    }
  },

  // Método para buscar múltiples documentos
  async findMany(collection, filter = {}, options = {}) {
    if (!isConnected()) {
      await connectDB()
    }
    
    try {
      const coll = this.getCollection(collection)
      const cursor = coll.find(filter, options)
      const results = await cursor.toArray()
      return results
    } catch (error) {
      console.error('Error en búsqueda múltiple:', error)
      throw error
    }
  },

  // Método para actualizar un documento
  async updateOne(collection, filter, update) {
    if (!isConnected()) {
      await connectDB()
    }
    
    try {
      const coll = this.getCollection(collection)
      const result = await coll.updateOne(filter, {
        $set: {
          ...update,
          updatedAt: new Date()
        }
      })
      
      console.log(`Documento actualizado en ${collection}:`, result.modifiedCount)
      return result
    } catch (error) {
      console.error('Error en actualización:', error)
      throw error
    }
  },

  // Método para actualizar múltiples documentos
  async updateMany(collection, filter, update) {
    if (!isConnected()) {
      await connectDB()
    }
    
    try {
      const coll = this.getCollection(collection)
      const result = await coll.updateMany(filter, {
        $set: {
          ...update,
          updatedAt: new Date()
        }
      })
      
      console.log(`${result.modifiedCount} documentos actualizados en ${collection}`)
      return result
    } catch (error) {
      console.error('Error en actualización múltiple:', error)
      throw error
    }
  },

  // Método para eliminar un documento
  async deleteOne(collection, filter) {
    if (!isConnected()) {
      await connectDB()
    }
    
    try {
      const coll = this.getCollection(collection)
      const result = await coll.deleteOne(filter)
      console.log(`Documento eliminado de ${collection}:`, result.deletedCount)
      return result
    } catch (error) {
      console.error('Error en eliminación:', error)
      throw error
    }
  },

  // Método para eliminar múltiples documentos
  async deleteMany(collection, filter) {
    if (!isConnected()) {
      await connectDB()
    }
    
    try {
      const coll = this.getCollection(collection)
      const result = await coll.deleteMany(filter)
      console.log(`${result.deletedCount} documentos eliminados de ${collection}`)
      return result
    } catch (error) {
      console.error('Error en eliminación múltiple:', error)
      throw error
    }
  },

  // Métodos específicos para usuarios - Colección 'users'
  users: {
    // Crear un nuevo usuario
    async create(userData) {
      return await db.insertOne('users', userData)
    },

    // Buscar usuario por email
    async findByEmail(email) {
      return await db.findOne('users', { email })
    },

    // Buscar usuario por ID
    async findById(id) {
      return await db.findOne('users', { _id: new ObjectId(id) })
    },

    // Actualizar usuario
    async update(id, updateData) {
      return await db.updateOne('users', { _id: new ObjectId(id) }, updateData)
    },

    // Eliminar usuario
    async delete(id) {
      return await db.deleteOne('users', { _id: new ObjectId(id) })
    },

    // Obtener todos los usuarios
    async getAll() {
      return await db.findMany('users')
    }
  }
}

export default db
