# Quick Start Guide

Get your e-commerce platform up and running in 5 minutes!

## Prerequisites

- MySQL 8.0+ installed and running
- Node.js 18+ installed
- A terminal/command prompt

## Step 1: Database Setup (2 minutes)

```bash
# Login to MySQL
mysql -u root -p

# Import the schema (this creates the database and sample data)
source api/schema.sql

# Exit MySQL
exit
```

**Default Admin Account Created:**
- Email: `admin@example.com`
- Password: `admin123`

## Step 2: API Setup (1 minute)

```bash
# Navigate to API directory
cd api

# Install dependencies
npm install

# The .env file is already configured for localhost
# Just update the DB_PASSWORD if needed:
# nano .env

# Start the API server
npm run dev
```

You should see:
```
✓ Database connection established
✓ Server running on port 3001
✓ API available at http://localhost:3001/api
```

## Step 3: Client Setup (1 minute)

Open a **new terminal** and run:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

You should see:
```
VITE ready in X ms
➜  Local:   http://localhost:5173/
```

## Step 4: Access the Application

Open your browser and visit:

- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:3001/api
- **Admin Panel:** Login with admin@example.com / admin123

## What's Included

The database comes pre-loaded with:

### Sample Data
- 2 product categories
- 2 sample products
- 2 promotional coupons:
  - `WELCOME10` - 10% off for new customers
  - `LOYAL20` - 20% off for customers with 5+ orders
- 3 FAQs
- 1 blog post
- 1 admin user

### Features Ready to Use
- ✅ User registration and login
- ✅ Product browsing
- ✅ Shopping cart
- ✅ Coupon validation
- ✅ Blog and FAQ pages
- ✅ Admin dashboard (full CRUD for all entities)

## Testing the Admin Panel

1. Go to http://localhost:5173
2. Click "Login" or navigate to the login page
3. Login with:
   - Email: `admin@example.com`
   - Password: `admin123`
4. Access admin features (will need to create admin UI)

## Common Issues

### "Cannot connect to MySQL"
- Ensure MySQL is running: `sudo systemctl status mysql` (Linux) or check Services (Windows)
- Verify password in `api/.env`

### "Port 3001 already in use"
- Change PORT in `api/.env`
- Update VITE_API_URL in `client/.env`

### "Port 5173 already in use"
- Vite will automatically try the next available port (5174, etc.)
- Or kill the process using that port

## Next Steps

1. **Change Admin Password** - Important for security!
2. **Add More Products** - Use the admin API endpoints
3. **Customize Design** - Edit components in `client/src`
4. **Add Payment Integration** - Integrate Stripe or PayPal
5. **Deploy to Production** - See deployment guides

## API Testing

Test the API with curl:

```bash
# Get all products
curl http://localhost:3001/api/products

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get user profile (with token)
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Development Workflow

1. Make changes to API code in `api/src/`
2. Server auto-restarts (Node 18+ watch mode)
3. Make changes to client code in `client/src/`
4. Vite hot-reloads automatically
5. Test changes in browser

## Need Help?

- Check `README.md` for detailed documentation
- Check `MIGRATION_GUIDE.md` for frontend integration help
- Review API endpoints in the README
- Check MySQL logs: `sudo tail -f /var/log/mysql/error.log`
- Check API logs in your terminal

Enjoy building your e-commerce platform! 🚀
