const request = require('supertest')

// Mock the db module
jest.mock('../server/db', () => {
  const mockCollection = {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    toArray: jest.fn(),
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn()
  }
  
  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection)
  }
  
  return {
    connectDB: jest.fn(),
    getDB: jest.fn().mockReturnValue(mockDb),
    closeDB: jest.fn()
  }
})

const { getDB } = require('../server/db')
// Import app AFTER mocking
const app = require('../server/index')

describe('API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('menu returns items and categories', async () => {
    const mockDb = getDB()
    const mockCollection = mockDb.collection() // This returns the shared mock collection object
    
    // index.js calls:
    // 1. collection('menu').find().toArray()
    // 2. collection('categories').find().sort().toArray()
    
    mockCollection.toArray
      .mockResolvedValueOnce([{ id: '1', name: 'Pad Thai', price: 10 }]) // First call: menu items
      .mockResolvedValueOnce([{ name: 'Noodles', order: 1 }])            // Second call: categories
    
    const res = await request(app).get('/api/menu')
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('categories')
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(Array.isArray(res.body.categories)).toBe(true)
    expect(res.body.items[0].name).toBe('Pad Thai')
    expect(res.body.categories[0]).toBe('Noodles')
  })

  test('gallery returns images', async () => {
    const mockDb = getDB()
    const mockCollection = mockDb.collection()
    
    mockCollection.toArray.mockResolvedValueOnce([{ file: 'img.jpg' }])
    
    const res = await request(app).get('/api/gallery')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('images')
    expect(Array.isArray(res.body.images)).toBe(true)
  })
})
