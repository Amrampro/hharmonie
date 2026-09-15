# Admin Dashboard Implementation TODO

The backend API for the admin dashboard is complete. The following frontend pages need to be created:

## Required Admin Pages

All admin pages should be created in: `client/src/pages/admin/`

### 1. Dashboard Overview
**File:** `client/src/pages/admin/DashboardPage.tsx`

Features:
- Total users count
- Total products count
- Total orders count
- Recent orders list
- Revenue statistics
- Quick actions (add product, view orders, etc.)

### 2. Users Management
**File:** `client/src/pages/admin/UsersPage.tsx`

Features:
- List all users with search
- View user details
- Edit user information
- Delete users
- View user order history
- Toggle admin status

API Endpoints:
- GET /api/admin/users
- GET /api/admin/users/:id
- PUT /api/admin/users/:id
- DELETE /api/admin/users/:id

### 3. Products Management
**File:** `client/src/pages/admin/ProductsPage.tsx`

Features:
- List all products with search/filter
- Create new product
- Edit existing product
- Delete product
- Manage product images
- Update stock status

API Endpoints:
- GET /api/admin/products
- POST /api/admin/products
- PUT /api/admin/products/:id
- DELETE /api/admin/products/:id

### 4. Coupons Management
**File:** `client/src/pages/admin/CouponsPage.tsx`

Features:
- List all coupons
- Create new coupon
- Edit coupon details
- Activate/deactivate coupons
- View coupon usage statistics
- Delete coupons

API Endpoints:
- GET /api/admin/coupons
- POST /api/admin/coupons
- PUT /api/admin/coupons/:id
- DELETE /api/admin/coupons/:id

### 5. Blog Management
**File:** `client/src/pages/admin/BlogPage.tsx`

Features:
- List all blog posts (published and drafts)
- Create new blog post
- Edit blog post
- Publish/unpublish posts
- Delete posts
- View post statistics (views)

API Endpoints:
- GET /api/admin/blog
- POST /api/admin/blog
- PUT /api/admin/blog/:id
- DELETE /api/admin/blog/:id

### 6. FAQ Management
**File:** `client/src/pages/admin/FAQPage.tsx`

Features:
- List all FAQs
- Create new FAQ
- Edit FAQ
- Reorder FAQs (display_order)
- Delete FAQ
- Organize by category

API Endpoints:
- GET /api/admin/faq
- POST /api/admin/faq
- PUT /api/admin/faq/:id
- DELETE /api/admin/faq/:id

### 7. Orders Management
**File:** `client/src/pages/admin/OrdersPage.tsx`

Features:
- List all orders with filters (status, date range)
- View order details
- Update order status
- View customer information
- View order items
- Delete orders

API Endpoints:
- GET /api/admin/orders
- GET /api/admin/orders/:id
- PUT /api/admin/orders/:id/status
- DELETE /api/admin/orders/:id

## Admin Layout Component

**File:** `client/src/components/admin/AdminLayout.tsx`

Features:
- Side navigation menu
- Top header with admin user info
- Logout button
- Active page indicator
- Breadcrumbs

## Admin Route Protection

Update `client/src/App.tsx` to add:

```typescript
import { AdminDashboardPage } from './pages/admin/DashboardPage';
import { AdminUsersPage } from './pages/admin/UsersPage';
// ... other admin pages

// Add protected admin routes
{user && user.is_admin && (
  <>
    <Route path="/admin" element={<AdminDashboardPage />} />
    <Route path="/admin/users" element={<AdminUsersPage />} />
    <Route path="/admin/products" element={<AdminProductsPage />} />
    <Route path="/admin/coupons" element={<AdminCouponsPage />} />
    <Route path="/admin/blog" element={<AdminBlogPage />} />
    <Route path="/admin/faq" element={<AdminFAQPage />} />
    <Route path="/admin/orders" element={<AdminOrdersPage />} />
  </>
)}
```

## Common Admin Components

Create reusable components in: `client/src/components/admin/`

### Recommended Components:
- `AdminTable.tsx` - Reusable data table with sorting/filtering
- `AdminForm.tsx` - Standard form layout
- `AdminModal.tsx` - Modal dialogs for create/edit
- `AdminButton.tsx` - Styled admin buttons
- `AdminCard.tsx` - Card container for stats
- `ConfirmDialog.tsx` - Confirmation dialog for delete actions
- `StatusBadge.tsx` - Order/product status indicators

## Styling

Options:
1. Continue using inline styles like the rest of the app
2. Use Tailwind CSS (already configured)
3. Create an admin-specific CSS file

Recommended: Use Tailwind for consistency with existing code.

## Authentication Check

All admin pages should check for admin status:

```typescript
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export function AdminUsersPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      // Redirect to home or show unauthorized message
      window.location.href = '/';
    }
  }, [user, loading]);

  if (loading) return <div>Loading...</div>;
  if (!user || !user.is_admin) return <div>Unauthorized</div>;

  return (
    // Admin page content
  );
}
```

## Implementation Priority

1. **High Priority:**
   - Dashboard overview (gives context to all other pages)
   - Products management (core functionality)
   - Orders management (essential for business)

2. **Medium Priority:**
   - Users management
   - Coupons management

3. **Low Priority:**
   - Blog management
   - FAQ management

## Estimated Development Time

- Admin Layout Component: 2-3 hours
- Dashboard Page: 3-4 hours
- Products Management: 4-6 hours
- Orders Management: 3-4 hours
- Users Management: 2-3 hours
- Coupons Management: 2-3 hours
- Blog Management: 2-3 hours
- FAQ Management: 2-3 hours

**Total:** ~20-30 hours for complete admin panel

## Testing Checklist

- [ ] Can access admin pages only when logged in as admin
- [ ] Cannot access admin pages as regular user
- [ ] Can create new items (products, coupons, etc.)
- [ ] Can edit existing items
- [ ] Can delete items (with confirmation)
- [ ] Search and filtering work correctly
- [ ] Proper error messages displayed
- [ ] Loading states shown during API calls
- [ ] Success messages after actions
- [ ] All forms validate input
- [ ] Mobile responsive design
