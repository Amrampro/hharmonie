# E-Commerce Platform

A full-stack e-commerce platform with React frontend and Express.js REST API backend using MySQL database.

## Project Structure

```
.
├── api/                    # Backend Express API
│   ├── src/
│   │   ├── config/        # Database and app configuration
│   │   ├── controllers/   # Route controllers
│   │   │   └── admin/    # Admin-specific controllers
│   │   ├── middleware/    # Express middleware (auth, etc.)
│   │   ├── routes/        # API routes
│   │   │   └── admin/    # Admin routes
│   │   └── server.js      # Main server file
│   ├── schema.sql         # MySQL database schema
│   ├── package.json
│   └── .env.example       # Environment variables template
│
└── client/                # Frontend React application
    ├── src/
    │   ├── components/   # Reusable React components
    │   ├── pages/        # Page components
    │   ├── contexts/     # React contexts
    │   ├── config/       # App configuration
    │   └── lib/          # Utilities and helpers
    ├── package.json
    └── .env

```

## Features

### Customer Features
- ✅ User authentication (signup/login)
- ✅ Product browsing and search
- ✅ Shopping cart management
- ✅ Coupon system with advanced rules
- ✅ Blog and FAQ sections
- ✅ User profile management

### Admin Features
- ✅ User management
- ✅ Product management (CRUD)
- ✅ Coupon management
- ✅ Blog post management
- ✅ FAQ management
- ✅ Order management and status updates

## Installation & Setup

### 1. Database Setup

```bash
# Log into MySQL
mysql -u root -p

# Create database and import schema
source api/schema.sql
```

Default admin credentials:
- Email: admin@example.com
- Password: admin123 (CHANGE THIS!)

### 2. API (Backend) Setup

```bash
cd api
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

API runs at: http://localhost:3001/api

### 3. Client (Frontend) Setup

```bash
cd client
npm install
npm run dev
```

Client runs at: http://localhost:5173

## API Endpoints

### Public
- POST /api/auth/signup - Register
- POST /api/auth/login - Login
- GET /api/products - Get products
- GET /api/blog - Get blog posts
- GET /api/faq - Get FAQs
- POST /api/coupons/validate - Validate coupon

### Admin (requires auth + admin role)
- /api/admin/users - User management
- /api/admin/products - Product management
- /api/admin/coupons - Coupon management
- /api/admin/blog - Blog management
- /api/admin/faq - FAQ management
- /api/admin/orders - Order management

## Environment Variables

### API (.env)
```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_db
DB_PORT=3306
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
```

### Client (.env)
```
VITE_API_URL=http://localhost:3001/api
```

## Technologies

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js (ESM)
- **Database:** MySQL 8.0+
- **Authentication:** JWT
- **Security:** bcrypt, CORS

## License

MIT
