# Frontend Migration Guide: Supabase to Express API

This document explains how to migrate the frontend from Supabase to the new Express.js API.

## Overview

The project has been restructured:
- **Backend:** `api/` folder - Express.js with MySQL
- **Frontend:** `client/` folder - React with TypeScript
- **API Service:** `client/src/services/api.ts` - Centralized API client

## Required Changes

### 1. Update Authentication Context

**File:** `client/src/contexts/AuthContext.tsx`

Replace Supabase auth calls with API service:

```typescript
// OLD (Supabase)
import { supabase } from '../lib/supabase';
const { data, error } = await supabase.auth.signUp({ email, password });

// NEW (API Service)
import { api } from '../services/api';
const { token, user } = await api.signup(email, password, firstName, lastName, phone);
```

### 2. Update Product Fetching

**Files:** `client/src/pages/ShopPage.tsx`, `client/src/pages/ProductDetailPage.tsx`

Replace Supabase queries:

```typescript
// OLD
const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('category_id', categoryId);

// NEW
const { products } = await api.getProducts({ category: categorySlug });
```

### 3. Update Blog and FAQ

**Files:** `client/src/pages/BlogPage.tsx`, `client/src/pages/FAQPage.tsx`

```typescript
// OLD
const { data: posts } = await supabase
  .from('blog_posts')
  .select('*');

// NEW
const { posts } = await api.getBlogPosts();
```

### 4. Update Coupon Validation

**File:** `client/src/pages/CartPage.tsx`

```typescript
// OLD
const { data: coupon } = await supabase
  .from('coupons')
  .select('*')
  .eq('code', code)
  .single();

// NEW
const { coupon } = await api.validateCoupon(code, cartTotal);
```

## Authentication Flow Changes

### Old Flow (Supabase)
1. User signs up/logs in
2. Supabase handles session automatically
3. Auth state managed by Supabase SDK

### New Flow (API + JWT)
1. User signs up/logs in
2. Server returns JWT token
3. Token stored in localStorage
4. Token sent with each request in Authorization header

## API Service Usage

The `api` service is a singleton instance exported from `client/src/services/api.ts`.

### Basic Usage

```typescript
import { api } from '../services/api';

// Login
const { token, user } = await api.login(email, password);

// Get products
const { products } = await api.getProducts();

// Get specific product
const { product } = await api.getProductBySlug('serum-visage');

// Validate coupon (requires auth)
const { coupon } = await api.validateCoupon('WELCOME10', 100.00);
```

### Admin Operations

```typescript
// Get all users
const { users } = await api.adminGetUsers();

// Create product
const { product } = await api.adminCreateProduct({
  name: 'New Product',
  slug: 'new-product',
  price: 29.99,
  // ... other fields
});

// Update order status
await api.adminUpdateOrderStatus(orderId, 'shipped');
```

## Environment Variables

Update `client/.env`:

```env
# Remove Supabase variables
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Add API URL
VITE_API_URL=http://localhost:3001/api
```

## Error Handling

The API service automatically handles errors and throws exceptions:

```typescript
try {
  const { products } = await api.getProducts();
} catch (error) {
  console.error('Failed to fetch products:', error.message);
  // Handle error (show notification, etc.)
}
```

## Type Safety

Update types in `client/src/lib/supabase.ts` (or rename to `types.ts`):

```typescript
// Remove Supabase-specific types
// Keep data model types (Product, Category, etc.)
export type Product = {
  id: string;
  name: string;
  // ...
};

// Add API response types if needed
export type ApiResponse<T> = {
  data?: T;
  error?: string;
};
```

## Admin Dashboard

Admin pages should be created in `client/src/pages/admin/`:

- `client/src/pages/admin/DashboardPage.tsx` - Admin dashboard overview
- `client/src/pages/admin/UsersPage.tsx` - User management
- `client/src/pages/admin/ProductsPage.tsx` - Product management
- `client/src/pages/admin/CouponsPage.tsx` - Coupon management
- `client/src/pages/admin/BlogPage.tsx` - Blog management
- `client/src/pages/admin/FAQPage.tsx` - FAQ management
- `client/src/pages/admin/OrdersPage.tsx` - Order management

## Testing

1. Start the API: `cd api && npm run dev`
2. Start the client: `cd client && npm run dev`
3. Test authentication flow
4. Test product browsing
5. Test coupon validation
6. Test admin operations (if logged in as admin)

## Checklist

- [ ] Update AuthContext to use API service
- [ ] Replace all Supabase queries with API calls
- [ ] Remove Supabase imports
- [ ] Update environment variables
- [ ] Test authentication flow
- [ ] Test all public pages
- [ ] Create admin pages
- [ ] Test admin functionality
- [ ] Update error handling
- [ ] Test production build

## Notes

- The API uses JWT tokens for authentication
- Tokens expire after 7 days (configurable in API .env)
- Admin routes require both authentication and admin role
- All dates are in ISO format
- Prices are in decimal format (e.g., 29.99)
- Product benefits should be arrays
- MySQL uses `id` fields (not auto-generated UUIDs like Supabase)

## Support

If you encounter issues:
1. Check API is running: `curl http://localhost:3001/api`
2. Check browser console for errors
3. Verify .env configuration
4. Check API server logs
5. Verify MySQL database is running
