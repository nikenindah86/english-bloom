

## Plan: Sidebar Reorganization + Products CRUD

### 1. Sidebar Reorganization

**`AdminLayout.tsx`**: Remove "Courses" from `academicItems`. Add new `commerceItems` array with "Courses" and "Products" (`/admin/products`). Import `ShoppingBag` icon. Render a new "Commerce" group after "Assessment".

**`MobileBottomNav.tsx`**: Add "Products" to `adminMoreItems`.

### 2. Database: Products Table

Create `products` table:
- `id` (uuid PK), `title` (text), `description` (text nullable), `thumbnail_url` (text nullable), `price` (numeric default 0), `checkout_link` (text nullable), `is_active` (boolean default true), `created_at` (timestamptz), `updated_at` (timestamptz)

RLS: Teachers full CRUD access. Public SELECT for active products (for future storefront).

### 3. New Page: `/admin/products`

**`src/pages/AdminProducts.tsx`**: Full CRUD with:
- Header + "Add Product" button opening a dialog
- Dialog form: Title, Short Description (textarea), Thumbnail URL input, Price (number, 0 = Free), Checkout/Action Link (URL)
- Product cards in a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)

**Card design**: Dark charcoal background (`bg-gray-900`), white text, thumbnail image at top with rounded corners, prominent price badge (green for paid, outline for free: "Rp 69.000" format), vibrant teal/green CTA button ("Beli Sekarang"). Edit and Delete actions.

### 4. Routing

**`App.tsx`**: Add `/admin/products` route with `ProtectedRoute requiredRole="teacher"`.

### Files Changed

| File | Change |
|------|--------|
| DB Migration | Create `products` table + RLS |
| `AdminLayout.tsx` | Add Commerce group with Courses + Products |
| `MobileBottomNav.tsx` | Add Products to adminMoreItems |
| `App.tsx` | Add `/admin/products` route |
| `src/pages/AdminProducts.tsx` | New — full CRUD page |

