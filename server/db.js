const { MongoClient, ServerApiVersion } = require('mongodb')
const config = require('./config')

const uri = process.env.MONGODB_URI

if (!uri) {
  console.error('MONGODB_URI is not defined in .env')
  process.exit(1)
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

let dbInstance = null

async function connectDB() {
  if (dbInstance) return dbInstance
  
  try {
    await client.connect()
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 })
    console.log("Pinged your deployment. You successfully connected to MongoDB!")
    
    // Always use 'minithai' database
    dbInstance = client.db('minithai')
    console.log(`Connected to MongoDB database: ${dbInstance.databaseName}`)
    return dbInstance
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

function getDB() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call connectDB first.')
  }
  return dbInstance
}

async function closeDB() {
  await client.close()
}

module.exports = { connectDB, getDB, closeDB, client }
