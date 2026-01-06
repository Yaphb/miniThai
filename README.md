# miniThai

A modern Thai restaurant website with online ordering and reservations.

## Prerequisites

- Node.js 16 or higher
- MongoDB Atlas account (free)
- Git

## Step 1: Clone the Repository

Get the project files on your computer:

```bash
git clone https://github.com/Yaphb/miniThai.git
cd miniThai
```

## Step 2: Setup MongoDB Atlas

MongoDB is where your data lives. Follow these steps:

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up
2. **Create Database**: Click "Create" → select free tier (M0 Sandbox)
3. **Create User**: Under "Database Access" → add a username and password
4. **Get Connection String**: 
   - Go to "Connect" → "Connect your application"
   - Copy the Node.js connection string
   - Replace `<username>`, `<password>`, and `<database>` with your details

Example:
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/minithai-db
```

## Step 3: Install & Configure

Now set up the project locally:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env`** and paste your MongoDB URI:
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string_here
   SESSION_SECRET=your-secret-key-here
   ```

## Step 4: Start Development

Launch the application:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Windows Users

Simply run `setup_minithai.bat` to do all this automatically.

## Production Deployment

When ready for production:

1. Update `.env`:
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   ```

2. Start the server:
   ```bash
   npm install
   npm start
   ```

## 🔧 Available Commands

```bash
# Development
npm run dev            # Start with auto-reload
npm test               # Run tests
npm run lint           # Check code quality

# Production
npm start              # Start server
npm run generate:images # Generate images

# Database
node server/scripts/seed_db.js  # Load sample data
```

## Screenshots

| Home | Menu |
|------|------|
| ![Home](screenshots/index.jpg) | ![Menu](screenshots/menu.jpg) |

| Cart | Checkout |
|------|----------|
| ![Cart](screenshots/cart.jpg) | ![Checkout](screenshots/checkout.jpg) |

| Orders | Contact |
|--------|---------|
| ![Orders](screenshots/orders.jpg) | ![Contact](screenshots/contact.jpg) |

## Project Structure

```
miniThai/
├── public/              # Website files
│   ├── assets/          # CSS, JS, images
│   └── components/      # Reusable HTML parts
├── server/              # Backend code
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── scripts/         # Utility scripts
│   ├── data/            # Sample data
│   ├── config.js        # Configuration
│   ├── db.js            # Database connection
│   └── index.js         # Main server file
├── tests/               # Test files
├── package.json         # Dependencies
├── setup_minithai.bat   # Windows quick setup
├── startup_minithai.bat # Windows quick start
└── README.md            # This file
```

## Troubleshooting

**Port already in use?**
```bash
# Change PORT in .env to 3001, 3002, etc.
```

**MongoDB connection error?**
- Check your connection string in `.env`
- Ensure IP whitelist includes your address in MongoDB Atlas
- Verify username and password are correct

**Dependencies outdated?**
```bash
rm -r node_modules package-lock.json
npm install
```

## Need Help?

Check [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/) or open an issue on GitHub.
