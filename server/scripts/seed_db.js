const fs = require('fs')
const path = require('path')
require('dotenv').config()
const { connectDB, closeDB, client } = require('../db')

const dataDir = path.join(__dirname, '..', 'data')

// Increase timeout to 30 seconds
const DB_OPERATION_TIMEOUT = 30000;

async function seed() {
  // Set a timeout for the entire seeding process
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Database operation timed out after 30 seconds'));
    }, DB_OPERATION_TIMEOUT);
  });

  try {
    // Connect to MongoDB with error handling and connection options
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // Verify connection is ready and use 'minithai' database
    const db = client.db('minithai')
    await db.command({ ping: 1 });
    console.log('Successfully connected to MongoDB and using database: minithai');
    
    // Set write concern for all operations
    const options = { w: 'majority', wtimeout: 10000 };

    // Helper to read JSON
    const read = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'))

    // 1. Menu
    const menuData = read('menu.json')
    const menuCollection = db.collection('menu')
    const categoriesCollection = db.collection('categories')
    
    // Clear existing collections with retry logic
    const clearCollections = async () => {
      const maxRetries = 3;
      let attempts = 0;
      
      while (attempts < maxRetries) {
        try {
          await Promise.all([
            menuCollection.deleteMany({}, options),
            categoriesCollection.deleteMany({}, options)
          ]);
          return; // Success
        } catch (error) {
          attempts++;
          console.warn(`Attempt ${attempts} failed to clear collections, retrying...`);
          if (attempts === maxRetries) {
            console.error('Max retries reached, giving up');
            throw error;
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    };
    
    await clearCollections();

    if (menuData.items && menuData.items.length > 0) {
      await menuCollection.insertMany(menuData.items)
      console.log(`Seeded ${menuData.items.length} menu items`)
    }
    
    if (menuData.categories && menuData.categories.length > 0) {
      // Store categories as documents { name: "Appetizers", order: 0 }, etc.
      // Or just a single document. Let's do simple docs.
      const catDocs = menuData.categories.map((c, i) => ({ name: c, order: i }))
      await categoriesCollection.insertMany(catDocs)
      console.log(`Seeded ${catDocs.length} categories`)
    }

    // 2. Orders (Initialize empty collection for new orders)
    const ordersCollection = db.collection('orders')
    await ordersCollection.deleteMany({})
    console.log('Initialized empty orders collection')

    // 3. Staff
    const staffData = read('staff.json')
    const staffCollection = db.collection('staff')
    await staffCollection.deleteMany({})
    if (staffData.team && staffData.team.length > 0) {
      await staffCollection.insertMany(staffData.team)
      console.log(`Seeded ${staffData.team.length} staff members`)
    }

    // 4. Messages (Optional - usually don't need to seed, but we can migrate existing)
    try {
        const messagesData = read('messages.json')
        const messagesCollection = db.collection('messages')
        if (Array.isArray(messagesData) && messagesData.length > 0) {
            await messagesCollection.deleteMany({}, options);
            await messagesCollection.insertMany(messagesData, options);
            console.log(`Seeded ${messagesData.length} messages`);
        }
    } catch (e) {
        if (e.code === 'ENOENT') {
            console.log('No messages.json found, skipping messages seeding');
        } else {
            console.error('Error seeding messages:', e);
            throw e; // Re-throw to be caught by the outer catch
        }
    }

    // 6. Contacts (Sample Data) - Using native driver
    try {
        const contactsCollection = db.collection('contacts');
        await contactsCollection.deleteMany({});
        
        const sampleContact = {
            name: 'John Doe',
            email: 'john@example.com',
            message: 'This is a sample contact message for testing purposes.',
            status: 'resolved',
            notes: 'Sample data for testing',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await contactsCollection.insertOne(sampleContact, { w: 'majority' });
        console.log('Seeded sample contact message');
    } catch (e) {
        console.error('Error seeding contacts:', e);
        throw e;
    }

    // 7. Reservations (Sample Data) - Using native driver
    try {
        const reservationsCollection = db.collection('reservations');
        await reservationsCollection.deleteMany({});
        
        const sampleReservation = {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+60123456789',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            time: '19:00',
            partySize: 4,
            status: 'confirmed',
            specialRequests: 'Window seat preferred',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await reservationsCollection.insertOne(sampleReservation, { w: 'majority' });
        console.log('Seeded sample reservation');
    } catch (e) {
        console.error('Error seeding reservations:', e);
        throw e;
    }
    return 'Seeding completed successfully!';
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error; // Re-throw to be caught by the Promise.catch()
  } finally {
    // Ensure we close the database connection
    await closeDB().catch(console.error);
  }
}

(async () => {
  try {
    const result = await Promise.race([
      seed(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Database operation timed out after 30 seconds'));
        }, DB_OPERATION_TIMEOUT);
      })
    ]);
    
    console.log(result);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
})();
