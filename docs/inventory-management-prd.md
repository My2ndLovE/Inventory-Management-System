# Inventory Management System - Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** November 2025  
**Platform:** Cloudflare (Workers, D1, R2, Pages)  
**Target:** GitHub Project - Production Ready

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack & Justification](#tech-stack--justification)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Feature Specifications](#feature-specifications)
6. [API Specifications](#api-specifications)
7. [Business Rules & Logic](#business-rules--logic)
8. [Security Requirements](#security-requirements)
9. [UI/UX Guidelines](#uiux-guidelines)
10. [File Structure](#file-structure)
11. [Development Phases](#development-phases)
12. [Deployment Strategy](#deployment-strategy)
13. [Testing Requirements](#testing-requirements)
14. [Performance Requirements](#performance-requirements)

---

## 1. Project Overview

### 1.1 Purpose
A modern, serverless inventory management system designed for small to medium businesses. Showcases full-stack development skills, serverless architecture, and real-world business logic implementation.

### 1.2 Core Objectives
- **Portfolio Value:** Demonstrate enterprise-level features with clean architecture
- **Cost Efficiency:** $0/month using Cloudflare free tier (100k requests/day)
- **Real-World Application:** Actually usable by small businesses
- **Technical Showcase:** Modern tech stack, edge computing, serverless design

### 1.3 Target Users
- Small retail businesses
- Warehouse managers
- E-commerce businesses
- Freelance resellers
- Portfolio reviewers/potential employers

### 1.4 Key Differentiators
- 100% serverless (no server management)
- Real-time stock alerts
- Barcode/QR code generation
- Low stock predictions using simple algorithms
- Multi-location support
- Export capabilities (CSV, PDF)
- Mobile-responsive PWA

---

## 2. Tech Stack & Justification

### 2.1 Frontend Stack

**Framework:** Remix (Full-stack React framework)
- **Why:** SEO-friendly, progressive enhancement, built-in data loading
- **Version:** Latest stable
- **Routing:** File-based routing
- **Data Fetching:** Remix loaders and actions

**UI Library:** shadcn/ui + Tailwind CSS
- **Why:** Accessible components, highly customizable, modern design
- **Component Library:** shadcn/ui (copy-paste, no dependency bloat)
- **Styling:** Tailwind CSS v3+
- **Icons:** Lucide React

**State Management:** 
- **Server State:** Remix loaders (no need for React Query)
- **Client State:** React hooks (useState, useReducer)
- **Form State:** Remix Form + Progressive Enhancement

**Charts/Visualization:**
- **Library:** Recharts
- **Purpose:** Dashboard analytics, stock trends, sales charts

### 2.2 Backend Stack

**Runtime:** Cloudflare Workers
- **Why:** Edge computing, global distribution, 0ms cold starts
- **Execution:** V8 isolates (faster than containers)
- **Limits:** 100,000 requests/day (free tier)

**Database:** Cloudflare D1 (SQLite at edge)
- **Why:** Serverless SQL, global replication, SQL familiarity
- **Size Limit:** 10GB (free tier - more than enough)
- **Location:** Edge-replicated for low latency

**Storage:** Cloudflare R2
- **Why:** S3-compatible, zero egress fees, cheap storage
- **Usage:** Product images, barcode images, export files
- **Free Tier:** 10GB storage, 10M Class A operations/month

**Authentication:** Clerk
- **Why:** Drop-in auth, free tier generous (10k MAU), multi-tenant ready
- **Features:** Email/password, social logins, user management
- **Free Tier:** 10,000 monthly active users

**Cache Layer:** Cloudflare KV (optional)
- **Why:** Ultra-fast key-value storage at edge
- **Usage:** Session data, frequently accessed product data
- **Free Tier:** 100k reads/day, 1k writes/day

### 2.3 Additional Tools

**Barcode Generation:** bwip-js (server-side)
- **Formats:** CODE128, EAN13, QR Code
- **Implementation:** Generate on-demand via API

**PDF Generation:** @react-pdf/renderer
- **Purpose:** Invoices, reports, stock lists
- **Rendering:** Server-side PDF generation

**Excel Export:** xlsx (SheetJS)
- **Purpose:** Export inventory, sales data
- **Format:** .xlsx files

**Validation:** Zod
- **Why:** Type-safe validation, integrates with Remix
- **Usage:** Form validation, API input validation

**Date Handling:** date-fns
- **Why:** Lightweight, tree-shakeable, immutable

### 2.4 Development Tools

**Language:** TypeScript (strict mode)
**Package Manager:** pnpm
**Linting:** ESLint + Prettier
**Testing:** Vitest + Testing Library
**Database Migrations:** Wrangler D1 migrations
**CI/CD:** GitHub Actions
**Hosting:** Cloudflare Pages

---

## 3. System Architecture

### 3.1 Architecture Pattern
**Pattern:** Serverless Monolith (Remix full-stack)
- All code in one repository
- Remix handles both frontend and backend
- Cloudflare Workers execute Remix server-side code
- D1 database attached to Workers

### 3.2 Request Flow

```
User Request
    ↓
Cloudflare Global Network (Edge)
    ↓
Cloudflare Pages (Static Assets)
    ↓
Cloudflare Worker (Remix SSR)
    ↓
├─→ D1 Database (Data)
├─→ R2 Storage (Images/Files)
└─→ KV Store (Cache - optional)
    ↓
Response to User
```

### 3.3 Data Flow Principles

**Read Operations:**
1. Check cache (KV) if applicable
2. Query D1 database
3. Transform data in loader
4. Render in component
5. Cache result if needed

**Write Operations:**
1. Validate input (Zod schema)
2. Check business rules
3. Execute transaction in D1
4. Invalidate cache
5. Revalidate UI (Remix automatically)
6. Return success/error

**File Upload Flow:**
1. Client uploads file (FormData)
2. Remix action receives file
3. Validate file (type, size)
4. Upload to R2 storage
5. Store R2 URL in D1
6. Return success

### 3.4 Folder-Based Routing (Remix)

```
app/routes/
├─ _index.tsx                    # Dashboard (/)
├─ login.tsx                     # Login page (/login)
├─ products._index.tsx           # Products list (/products)
├─ products.new.tsx              # New product (/products/new)
├─ products.$id.tsx              # Product detail (/products/:id)
├─ products.$id.edit.tsx         # Edit product (/products/:id/edit)
├─ inventory._index.tsx          # Inventory overview (/inventory)
├─ inventory.$locationId.tsx     # Location inventory (/inventory/:locationId)
├─ sales._index.tsx              # Sales history (/sales)
├─ sales.new.tsx                 # New sale (/sales/new)
├─ suppliers._index.tsx          # Suppliers list (/suppliers)
├─ reports._index.tsx            # Reports dashboard (/reports)
├─ reports.low-stock.tsx         # Low stock report (/reports/low-stock)
├─ settings._index.tsx           # Settings (/settings)
└─ api.barcode.$productId.tsx   # Barcode generation API (/api/barcode/:productId)
```

### 3.5 Component Architecture

**Atomic Design Pattern:**
```
components/
├─ ui/                    # shadcn/ui components (atoms)
│  ├─ button.tsx
│  ├─ input.tsx
│  ├─ table.tsx
│  └─ dialog.tsx
├─ forms/                 # Form components (molecules)
│  ├─ ProductForm.tsx
│  ├─ SaleForm.tsx
│  └─ StockAdjustmentForm.tsx
├─ features/              # Feature-specific (organisms)
│  ├─ ProductCard.tsx
│  ├─ StockAlertBanner.tsx
│  ├─ InventoryTable.tsx
│  └─ DashboardStats.tsx
└─ layouts/               # Page layouts (templates)
   ├─ AppLayout.tsx
   └─ AuthLayout.tsx
```

---

## 4. Database Schema

### 4.1 Schema Design Principles

- **Normalization:** 3NF (Third Normal Form)
- **No ORMs:** Use raw SQL for learning and performance
- **Timestamps:** All tables have `created_at` and `updated_at`
- **Soft Deletes:** Use `deleted_at` instead of hard deletes
- **Foreign Keys:** Enforce referential integrity
- **Indexes:** On frequently queried columns

### 4.2 Entity Relationship Diagram (ERD)

```
Users (Clerk handles this - reference by clerk_user_id)
    ↓ (1:many)
Organizations
    ↓ (1:many)
├─→ Products
│      ↓ (1:many)
│   ProductVariants
│      ↓ (1:many)
│   InventoryMovements
│
├─→ Categories
│
├─→ Suppliers
│      ↓ (many:many via ProductSuppliers)
│   Products
│
├─→ Locations
│      ↓ (1:many)
│   Stock
│
└─→ Sales
       ↓ (1:many)
    SaleItems
```

### 4.3 Table Definitions

#### **organizations**
```sql
CREATE TABLE organizations (
    id TEXT PRIMARY KEY,                    -- UUID v4
    name TEXT NOT NULL,
    owner_clerk_id TEXT NOT NULL,           -- Clerk user ID
    slug TEXT UNIQUE NOT NULL,              -- URL-safe identifier
    currency TEXT DEFAULT 'USD',            -- ISO 4217 (USD, MYR, etc)
    timezone TEXT DEFAULT 'UTC',
    created_at INTEGER NOT NULL,            -- Unix timestamp
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER                      -- Soft delete
);

CREATE INDEX idx_organizations_owner ON organizations(owner_clerk_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);
```

#### **categories**
```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,                    -- UUID v4
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT,                         -- For nested categories
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_org ON categories(organization_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

#### **products**
```sql
CREATE TABLE products (
    id TEXT PRIMARY KEY,                    -- UUID v4
    organization_id TEXT NOT NULL,
    sku TEXT NOT NULL,                      -- Stock Keeping Unit (unique per org)
    name TEXT NOT NULL,
    description TEXT,
    category_id TEXT,
    barcode TEXT,                           -- EAN, UPC, or custom
    unit_of_measure TEXT DEFAULT 'pcs',    -- pcs, kg, liter, etc
    cost_price REAL NOT NULL DEFAULT 0,    -- Purchase/cost price
    selling_price REAL NOT NULL DEFAULT 0, -- Retail price
    min_stock_level INTEGER DEFAULT 0,     -- Reorder point
    max_stock_level INTEGER,               -- Maximum stock
    image_url TEXT,                         -- R2 storage URL
    is_active INTEGER DEFAULT 1,            -- 0 = inactive, 1 = active
    has_variants INTEGER DEFAULT 0,         -- 0 = no, 1 = yes
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    UNIQUE(organization_id, sku)
);

CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_sku ON products(organization_id, sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
```

#### **product_variants**
```sql
CREATE TABLE product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    sku TEXT NOT NULL,                      -- Variant-specific SKU
    name TEXT NOT NULL,                     -- e.g., "Large - Red"
    barcode TEXT,
    cost_price REAL NOT NULL DEFAULT 0,
    selling_price REAL NOT NULL DEFAULT 0,
    attributes TEXT,                        -- JSON: {"size": "L", "color": "Red"}
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
```

#### **locations**
```sql
CREATE TABLE locations (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,                     -- e.g., "Main Warehouse", "Store A"
    address TEXT,
    type TEXT DEFAULT 'warehouse',          -- warehouse, store, online
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_locations_org ON locations(organization_id);
```

#### **stock**
```sql
CREATE TABLE stock (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    product_id TEXT,                        -- NULL if variant
    variant_id TEXT,                        -- NULL if simple product
    location_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,    -- Reserved for orders
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) VIRTUAL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE(product_id, variant_id, location_id)
);

CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_stock_location ON stock(location_id);
CREATE INDEX idx_stock_low ON stock(organization_id, quantity);
```

#### **inventory_movements**
```sql
CREATE TABLE inventory_movements (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    product_id TEXT,
    variant_id TEXT,
    location_id TEXT NOT NULL,
    type TEXT NOT NULL,                     -- IN, OUT, ADJUSTMENT, TRANSFER
    quantity INTEGER NOT NULL,              -- Positive for IN, negative for OUT
    from_location_id TEXT,                  -- For transfers
    reference_id TEXT,                      -- Sale ID, Purchase Order ID, etc
    reference_type TEXT,                    -- sale, purchase, adjustment, transfer
    unit_cost REAL,                         -- Cost at time of movement
    notes TEXT,
    created_by TEXT NOT NULL,               -- Clerk user ID
    created_at INTEGER NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (from_location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE INDEX idx_movements_org ON inventory_movements(organization_id);
CREATE INDEX idx_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_movements_location ON inventory_movements(location_id);
CREATE INDEX idx_movements_type ON inventory_movements(type);
CREATE INDEX idx_movements_date ON inventory_movements(created_at);
```

#### **suppliers**
```sql
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_suppliers_org ON suppliers(organization_id);
```

#### **product_suppliers**
```sql
CREATE TABLE product_suppliers (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    supplier_id TEXT NOT NULL,
    supplier_sku TEXT,                      -- Supplier's product code
    cost_price REAL,                        -- Price from this supplier
    lead_time_days INTEGER,                 -- Delivery time
    min_order_quantity INTEGER DEFAULT 1,
    is_preferred INTEGER DEFAULT 0,         -- 0 = no, 1 = yes (preferred supplier)
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    UNIQUE(product_id, supplier_id)
);

CREATE INDEX idx_product_suppliers_product ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier ON product_suppliers(supplier_id);
```

#### **sales**
```sql
CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    sale_number TEXT NOT NULL,              -- Human-readable: SALE-20241119-001
    location_id TEXT NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    payment_method TEXT,                    -- cash, card, transfer
    payment_status TEXT DEFAULT 'pending',  -- pending, paid, partial
    notes TEXT,
    created_by TEXT NOT NULL,               -- Clerk user ID
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
    UNIQUE(organization_id, sale_number)
);

CREATE INDEX idx_sales_org ON sales(organization_id);
CREATE INDEX idx_sales_number ON sales(sale_number);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_location ON sales(location_id);
```

#### **sale_items**
```sql
CREATE TABLE sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT,
    variant_id TEXT,
    product_name TEXT NOT NULL,             -- Snapshot at time of sale
    sku TEXT NOT NULL,                      -- Snapshot at time of sale
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,               -- Price at time of sale
    cost_price REAL NOT NULL,               -- Cost at time of sale
    subtotal REAL NOT NULL,                 -- quantity * unit_price
    created_at INTEGER NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
```

### 4.4 Database Indexes Strategy

**Purpose:** Optimize query performance

**Indexing Rules:**
1. Index all foreign keys (done above)
2. Index columns used in WHERE clauses (org_id, created_at)
3. Index columns used in ORDER BY (created_at, name)
4. Index unique constraints (SKU, barcode)
5. Composite indexes for common queries

**Additional Composite Indexes:**
```sql
-- For dashboard queries
CREATE INDEX idx_stock_low_products ON stock(organization_id, location_id, quantity);

-- For movement reports
CREATE INDEX idx_movements_date_type ON inventory_movements(organization_id, created_at, type);

-- For sales reports
CREATE INDEX idx_sales_date_status ON sales(organization_id, created_at, payment_status);
```

### 4.5 Migration Strategy

**Migration Tool:** Wrangler D1 migrations (built-in)

**Migration Files Location:** `migrations/`

**Naming Convention:** `0001_create_organizations.sql`, `0002_create_products.sql`, etc.

**Rollback Strategy:**
- Each migration has UP and DOWN (not supported in D1, so recreate DB if needed)
- Keep migrations small and focused
- Test migrations in local D1 before production

**Seed Data:**
- Separate seed script for demo data
- Include: sample products, categories, locations
- Generate via TypeScript script (easier than SQL)

---

## 5. Feature Specifications

### 5.1 Core Features (MVP - Phase 1)

#### F1: Authentication & Organization Setup
**User Story:** As a new user, I want to sign up and create my organization so I can start managing inventory.

**Acceptance Criteria:**
- [ ] User can sign up with email/password via Clerk
- [ ] After signup, user is prompted to create organization
- [ ] Organization has: name, currency, timezone
- [ ] Auto-generate URL slug from organization name
- [ ] Create default location "Main Warehouse" automatically
- [ ] Redirect to dashboard after setup

**Technical Notes:**
- Use Clerk webhooks to sync user data
- Store `clerk_user_id` in database
- Use Clerk session for authentication

---

#### F2: Product Management
**User Story:** As a warehouse manager, I want to add and manage products so I can track inventory.

**Acceptance Criteria:**
- [ ] Create product with: SKU, name, category, prices, min stock level
- [ ] Upload product image to R2 storage
- [ ] Auto-generate barcode if not provided
- [ ] Edit product details
- [ ] Soft delete products (mark as inactive)
- [ ] View list of all products with search and filter
- [ ] Search by: name, SKU, barcode, category
- [ ] Filter by: category, active/inactive, low stock

**Validation Rules:**
- SKU: Required, unique per organization, max 50 chars, alphanumeric + dash/underscore
- Name: Required, max 255 chars
- Cost Price: Required, >= 0
- Selling Price: Required, >= cost_price (warning if not)
- Min Stock Level: >= 0
- Image: Max 5MB, formats: jpg, png, webp

**UI Behavior:**
- Use data tables with pagination (50 items per page)
- Show stock levels per location in product detail
- Badge for low stock items (red badge)
- Image preview in list view (thumbnail)

---

#### F3: Inventory Tracking
**User Story:** As a warehouse staff, I want to adjust stock levels so inventory is accurate.

**Acceptance Criteria:**
- [ ] View current stock levels by location
- [ ] Adjust stock (increase or decrease) with reason
- [ ] Record inventory movements automatically
- [ ] View movement history per product
- [ ] Support multiple locations
- [ ] Show available vs reserved quantities

**Movement Types:**
1. **Stock In:** Add inventory (purchase, return, found)
2. **Stock Out:** Remove inventory (sale, damage, loss)
3. **Adjustment:** Correct discrepancies (count adjustment)
4. **Transfer:** Move between locations

**Validation Rules:**
- Quantity: Required, integer, > 0
- Type: Required, must be one of: IN, OUT, ADJUSTMENT, TRANSFER
- Location: Required
- Notes: Optional, max 500 chars
- Cannot reduce stock below 0 (show error)
- For transfers: from_location != to_location

**UI Behavior:**
- Quick adjust buttons: +1, +5, +10, -1, -5, -10
- Manual input for custom quantity
- Confirmation dialog for stock reduction
- Show real-time available quantity

---

#### F4: Sales Recording
**User Story:** As a cashier, I want to record sales so inventory is automatically updated.

**Acceptance Criteria:**
- [ ] Create new sale with multiple line items
- [ ] Auto-generate sale number (SALE-YYYYMMDD-001)
- [ ] Select products/variants to add to sale
- [ ] Set quantity and price per item
- [ ] Calculate subtotal, tax, discount, total automatically
- [ ] Record payment method and status
- [ ] Auto-reduce stock from selected location
- [ ] Create inventory movement records
- [ ] View sale history with filters (date range, payment status)
- [ ] View sale details (invoice view)

**Calculation Logic:**
```
Item Subtotal = Quantity × Unit Price
Sale Subtotal = Sum of all Item Subtotals
Tax Amount = Sale Subtotal × Tax Rate (configurable)
Discounted Amount = Sale Subtotal - Discount
Total Amount = Discounted Amount + Tax Amount
```

**Validation Rules:**
- Must have at least 1 item
- Quantity must be > 0 and <= available stock
- Unit price must be >= 0
- Discount cannot exceed subtotal
- Payment status: pending, paid, partial

**Stock Update Logic:**
- On sale creation (if payment_status = 'paid'):
  1. For each sale item, reduce stock at selected location
  2. Create inventory_movement (type=OUT, reference_type=sale)
  3. Use transaction to ensure atomicity
- On sale cancellation:
  1. Reverse stock reduction
  2. Create reversal inventory_movement

---

#### F5: Dashboard & Analytics
**User Story:** As a business owner, I want to see key metrics so I can monitor business health.

**Dashboard Widgets:**
1. **Total Stock Value:** Sum of (quantity × cost_price) across all products
2. **Low Stock Alerts:** Count and list of products below min_stock_level
3. **Recent Sales:** Last 10 sales with date, amount, status
4. **Top Selling Products:** This month, by quantity sold
5. **Stock Movement Timeline:** Chart showing IN/OUT over last 30 days
6. **Location Stock Levels:** Breakdown by location

**Charts:**
- **Line Chart:** Stock movements over time (last 30 days)
- **Bar Chart:** Sales by day (last 7 days)
- **Pie Chart:** Stock distribution by category
- **Table:** Low stock products with reorder suggestions

**Filters:**
- Date range selector
- Location filter
- Category filter

---

### 5.2 Secondary Features (Phase 2)

#### F6: Barcode/QR Code Generation
**User Story:** As a warehouse manager, I want to generate and print barcodes so I can scan products.

**Acceptance Criteria:**
- [ ] Auto-generate CODE128 barcode for each product
- [ ] Generate QR code with product details (JSON)
- [ ] Download barcode as PNG (300 DPI for printing)
- [ ] Bulk download for multiple products
- [ ] Print-friendly barcode sheet (4x6 labels)

**Barcode Content:**
- CODE128: SKU or barcode field
- QR Code: JSON `{id, sku, name, price}`

**Implementation:**
- Use `bwip-js` library (server-side rendering)
- API endpoint: `/api/barcode/:productId?format=code128|qrcode`
- Response: PNG image (base64 or binary)

---

#### F7: Reports & Exports
**User Story:** As a manager, I want to export reports so I can analyze data offline.

**Report Types:**
1. **Stock Report:** All products with current quantities, value
2. **Low Stock Report:** Products below min level with reorder suggestions
3. **Movement Report:** All movements in date range
4. **Sales Report:** Sales summary by date, product, location
5. **Profit Report:** Sales with profit margins (selling - cost)

**Export Formats:**
- CSV (all reports)
- Excel (.xlsx) with formatting
- PDF for printing

**Implementation:**
- Use `xlsx` library for Excel
- Use `@react-pdf/renderer` for PDF
- Stream large reports (don't load all in memory)

---

#### F8: Supplier Management
**User Story:** As a purchaser, I want to track suppliers so I know where to reorder products.

**Acceptance Criteria:**
- [ ] Add supplier with contact details
- [ ] Link products to suppliers (many-to-many)
- [ ] Set cost price per supplier
- [ ] Mark preferred supplier
- [ ] Set lead time per supplier
- [ ] View all products from a supplier
- [ ] Generate purchase order (future)

---

#### F9: Multi-Location Transfer
**User Story:** As a warehouse manager, I want to transfer stock between locations so I can balance inventory.

**Acceptance Criteria:**
- [ ] Select product and quantity to transfer
- [ ] Choose from and to locations
- [ ] Record transfer with notes
- [ ] Auto-update stock at both locations
- [ ] Create two inventory movements (OUT from source, IN to destination)
- [ ] Transaction ensures both updates succeed or fail together

**Validation:**
- Source location must have sufficient stock
- Source != Destination
- Quantity > 0

---

#### F10: Category Management
**User Story:** As a business owner, I want to organize products in categories so I can find them easily.

**Acceptance Criteria:**
- [ ] Create nested categories (parent-child)
- [ ] Assign products to categories
- [ ] Filter products by category
- [ ] Show category hierarchy in breadcrumbs
- [ ] Bulk assign category to multiple products

---

### 5.3 Nice-to-Have Features (Phase 3)

#### F11: Purchase Orders
- Create PO to suppliers
- Track PO status (draft, sent, received)
- Auto-create stock IN when PO received

#### F12: Stock Alerts & Notifications
- Email alerts when stock below min level
- Daily/weekly stock reports via email
- Configurable alert thresholds

#### F13: Batch Operations
- Bulk update prices
- Bulk stock adjustment
- Bulk delete products

#### F14: Advanced Search
- Full-text search across products
- Filter combinations (price range + category + location)
- Save search filters

#### F15: Audit Trail
- Log all changes (who, what, when)
- View change history per product
- Compliance for regulated industries

---

## 6. API Specifications

### 6.1 API Design Principles

**Pattern:** RESTful-ish + Remix Actions
- Use Remix loaders for GET (SSR data fetching)
- Use Remix actions for POST/PUT/DELETE (form submissions)
- API routes only for special cases (barcode generation, exports)

**Response Format:**
```typescript
// Success response
{
  success: true,
  data: T,
  message?: string
}

// Error response
{
  success: false,
  error: string,
  errors?: Record<string, string[]> // Validation errors
}
```

**HTTP Status Codes:**
- 200: Success (GET, PUT, DELETE)
- 201: Created (POST)
- 400: Bad Request (validation error)
- 401: Unauthorized (not logged in)
- 403: Forbidden (no permission)
- 404: Not Found
- 500: Internal Server Error

### 6.2 Remix Loader Examples

#### Get Products List
```typescript
// File: app/routes/products._index.tsx
export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const url = new URL(request.url);
  
  // Query params
  const page = parseInt(url.searchParams.get('page') || '1');
  const search = url.searchParams.get('search') || '';
  const categoryId = url.searchParams.get('category') || '';
  const limit = 50;
  const offset = (page - 1) * limit;

  // Build query
  let query = `
    SELECT p.*, c.name as category_name, 
           (SELECT SUM(quantity) FROM stock WHERE product_id = p.id) as total_stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.organization_id = ? AND p.deleted_at IS NULL
  `;
  const params = [orgId];

  if (search) {
    query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (categoryId) {
    query += ` AND p.category_id = ?`;
    params.push(categoryId);
  }

  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const products = await context.db.prepare(query).bind(...params).all();
  
  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM products WHERE organization_id = ? AND deleted_at IS NULL`;
  const { total } = await context.db.prepare(countQuery).bind(orgId).first();

  return json({
    products: products.results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}
```

#### Get Single Product
```typescript
// File: app/routes/products.$id.tsx
export async function loader({ params, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const { id } = params;

  const product = await context.db
    .prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.organization_id = ? AND p.deleted_at IS NULL
    `)
    .bind(id, orgId)
    .first();

  if (!product) {
    throw new Response('Product not found', { status: 404 });
  }

  // Get stock by location
  const stock = await context.db
    .prepare(`
      SELECT s.*, l.name as location_name
      FROM stock s
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.product_id = ?
    `)
    .bind(id)
    .all();

  // Get recent movements
  const movements = await context.db
    .prepare(`
      SELECT * FROM inventory_movements
      WHERE product_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `)
    .bind(id)
    .all();

  return json({
    product,
    stock: stock.results,
    movements: movements.results
  });
}
```

### 6.3 Remix Action Examples

#### Create Product
```typescript
// File: app/routes/products.new.tsx
export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const formData = await request.formData();

  // Parse and validate
  const schema = z.object({
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    category_id: z.string().optional(),
    cost_price: z.number().min(0),
    selling_price: z.number().min(0),
    min_stock_level: z.number().int().min(0).default(0),
    description: z.string().optional(),
    barcode: z.string().optional()
  });

  const data = schema.parse({
    sku: formData.get('sku'),
    name: formData.get('name'),
    category_id: formData.get('category_id') || null,
    cost_price: parseFloat(formData.get('cost_price')),
    selling_price: parseFloat(formData.get('selling_price')),
    min_stock_level: parseInt(formData.get('min_stock_level') || '0'),
    description: formData.get('description'),
    barcode: formData.get('barcode')
  });

  // Handle image upload if present
  let imageUrl = null;
  const image = formData.get('image') as File;
  if (image && image.size > 0) {
    // Upload to R2
    const key = `products/${orgId}/${crypto.randomUUID()}-${image.name}`;
    await context.R2.put(key, image.stream());
    imageUrl = `https://yourdomain.com/storage/${key}`;
  }

  // Generate barcode if not provided
  const finalBarcode = data.barcode || generateBarcode();

  // Insert product
  const productId = crypto.randomUUID();
  const now = Date.now();
  
  await context.db
    .prepare(`
      INSERT INTO products (
        id, organization_id, sku, name, description, category_id,
        barcode, cost_price, selling_price, min_stock_level,
        image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      productId, orgId, data.sku, data.name, data.description, data.category_id,
      finalBarcode, data.cost_price, data.selling_price, data.min_stock_level,
      imageUrl, now, now
    )
    .run();

  return redirect(`/products/${productId}`);
}
```

#### Update Stock
```typescript
// File: app/routes/inventory.adjust.tsx
export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const formData = await request.formData();

  const schema = z.object({
    product_id: z.string().uuid(),
    location_id: z.string().uuid(),
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
    quantity: z.number().int().positive(),
    notes: z.string().max(500).optional()
  });

  const data = schema.parse({
    product_id: formData.get('product_id'),
    location_id: formData.get('location_id'),
    type: formData.get('type'),
    quantity: parseInt(formData.get('quantity')),
    notes: formData.get('notes')
  });

  // Use transaction for atomicity
  await context.db.batch([
    // 1. Create inventory movement
    context.db.prepare(`
      INSERT INTO inventory_movements (
        id, organization_id, product_id, location_id, type, quantity,
        notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), orgId, data.product_id, data.location_id,
      data.type, data.type === 'OUT' ? -data.quantity : data.quantity,
      data.notes, userId, Date.now()
    ),

    // 2. Update stock (upsert pattern)
    context.db.prepare(`
      INSERT INTO stock (id, organization_id, product_id, location_id, quantity, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(product_id, variant_id, location_id) DO UPDATE SET
        quantity = quantity + ?,
        updated_at = ?
    `).bind(
      crypto.randomUUID(), orgId, data.product_id, data.location_id,
      data.type === 'OUT' ? -data.quantity : data.quantity, Date.now(),
      data.type === 'OUT' ? -data.quantity : data.quantity, Date.now()
    )
  ]);

  return json({ success: true, message: 'Stock updated successfully' });
}
```

#### Record Sale
```typescript
// File: app/routes/sales.new.tsx
export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const formData = await request.formData();

  // Parse sale data (items are in JSON)
  const items = JSON.parse(formData.get('items'));
  const locationId = formData.get('location_id');
  
  // Validate stock availability first
  for (const item of items) {
    const stock = await context.db
      .prepare('SELECT quantity FROM stock WHERE product_id = ? AND location_id = ?')
      .bind(item.product_id, locationId)
      .first();
    
    if (!stock || stock.quantity < item.quantity) {
      return json(
        { success: false, error: `Insufficient stock for ${item.product_name}` },
        { status: 400 }
      );
    }
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxRate = 0.06; // 6% tax
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  // Generate sale number
  const saleNumber = await generateSaleNumber(context.db, orgId);
  const saleId = crypto.randomUUID();
  const now = Date.now();

  // Transaction: Create sale, sale items, reduce stock, create movements
  const statements = [
    // Insert sale
    context.db.prepare(`
      INSERT INTO sales (
        id, organization_id, sale_number, location_id, customer_name,
        customer_email, customer_phone, subtotal, tax_amount, total_amount,
        payment_method, payment_status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      saleId, orgId, saleNumber, locationId, formData.get('customer_name'),
      formData.get('customer_email'), formData.get('customer_phone'),
      subtotal, taxAmount, totalAmount, formData.get('payment_method'),
      'paid', userId, now, now
    )
  ];

  // Insert sale items and update stock
  for (const item of items) {
    // Sale item
    statements.push(
      context.db.prepare(`
        INSERT INTO sale_items (
          id, sale_id, product_id, product_name, sku, quantity,
          unit_price, cost_price, subtotal, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), saleId, item.product_id, item.product_name,
        item.sku, item.quantity, item.unit_price, item.cost_price,
        item.quantity * item.unit_price, now
      )
    );

    // Reduce stock
    statements.push(
      context.db.prepare(`
        UPDATE stock SET quantity = quantity - ?, updated_at = ?
        WHERE product_id = ? AND location_id = ?
      `).bind(item.quantity, now, item.product_id, locationId)
    );

    // Inventory movement
    statements.push(
      context.db.prepare(`
        INSERT INTO inventory_movements (
          id, organization_id, product_id, location_id, type, quantity,
          reference_id, reference_type, unit_cost, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), orgId, item.product_id, locationId, 'OUT',
        -item.quantity, saleId, 'sale', item.cost_price, userId, now
      )
    );
  }

  await context.db.batch(statements);

  return redirect(`/sales/${saleId}`);
}
```

### 6.4 Special API Routes

#### Barcode Generation API
```typescript
// File: app/routes/api.barcode.$productId.tsx
export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { productId } = params;
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'code128'; // code128 or qrcode

  const product = await context.db
    .prepare('SELECT * FROM products WHERE id = ?')
    .bind(productId)
    .first();

  if (!product) {
    throw new Response('Not found', { status: 404 });
  }

  const bwipjs = require('bwip-js');
  let png;

  if (format === 'qrcode') {
    png = await bwipjs.toBuffer({
      bcid: 'qrcode',
      text: JSON.stringify({ id: product.id, sku: product.sku, name: product.name }),
      scale: 3,
      height: 10,
      includetext: true
    });
  } else {
    png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: product.barcode || product.sku,
      scale: 3,
      height: 10,
      includetext: true
    });
  }

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}
```

#### Export Products CSV
```typescript
// File: app/routes/api.export.products.tsx
export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);

  const products = await context.db
    .prepare(`
      SELECT p.*, c.name as category_name,
             (SELECT SUM(quantity) FROM stock WHERE product_id = p.id) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.organization_id = ? AND p.deleted_at IS NULL
    `)
    .bind(orgId)
    .all();

  // Generate CSV
  const headers = ['SKU', 'Name', 'Category', 'Cost Price', 'Selling Price', 'Stock', 'Min Level'];
  const rows = products.results.map(p => [
    p.sku, p.name, p.category_name || '', p.cost_price, p.selling_price,
    p.total_stock || 0, p.min_stock_level
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="products-${Date.now()}.csv"`
    }
  });
}
```

---

## 7. Business Rules & Logic

### 7.1 Stock Management Rules

**Rule 1: Cannot Reduce Stock Below Zero**
- When recording sales or stock adjustments
- Show error: "Insufficient stock. Available: X, Requested: Y"
- Suggest transfer from another location if available

**Rule 2: Low Stock Alert Threshold**
- Alert when: `current_stock <= min_stock_level`
- Display on dashboard with red badge
- Optional: Email notification (future feature)

**Rule 3: Reserved Stock**
- When order created but not fulfilled: increment `reserved_quantity`
- Available = Total - Reserved
- Sales can only use `available_quantity`

**Rule 4: Stock Transfer Validation**
- Source location must have sufficient available stock
- Source ≠ Destination
- Use database transaction to ensure atomicity
- Create two movements: OUT from source, IN to destination

### 7.2 Pricing Rules

**Rule 5: Selling Price Warning**
- If `selling_price < cost_price`: Show warning (not error)
- "Warning: Selling price is below cost price. Confirm loss?"
- Allow override (business decision)

**Rule 6: Price History**
- Keep snapshot of prices in `sale_items` (don't use current price)
- Allows historical profit analysis
- Changes to product price don't affect past sales

### 7.3 SKU & Barcode Rules

**Rule 7: SKU Uniqueness**
- SKU must be unique per organization (not globally)
- Case-insensitive check
- Format: Alphanumeric + dash/underscore only
- Auto-suggest format: `PROD-XXXXX` if not provided

**Rule 8: Barcode Auto-Generation**
- If barcode not provided, generate CODE128 barcode from SKU
- Format: Organization prefix + random 8 digits
- Example: `ORG123-12345678`
- Store in `barcode` field for searching

### 7.4 Sale Rules

**Rule 9: Sale Number Generation**
- Format: `SALE-YYYYMMDD-NNN`
- Example: `SALE-20241119-001`
- Increment NNN per day (reset daily)
- Query: `SELECT MAX(sale_number) FROM sales WHERE organization_id = ? AND created_at >= ?`

**Rule 10: Sale Finalization**
- Sale is final once `payment_status = 'paid'`
- Cannot edit sale items after payment
- Can only cancel (creates reversal)

**Rule 11: Stock Deduction Timing**
- Deduct stock immediately when sale created with `payment_status = 'paid'`
- If `payment_status = 'pending'`: Reserve stock, deduct on payment
- On cancellation: Return stock, remove reservation

### 7.5 Multi-Tenant Rules

**Rule 12: Organization Isolation**
- All queries MUST filter by `organization_id`
- Use middleware to auto-inject org_id from session
- SQL queries should ALWAYS include: `WHERE organization_id = ?`

**Rule 13: User Access Control**
- User can only access their organization's data
- Check in loader: `requireAuth()` returns `orgId`
- Reject if accessing another org's resources

### 7.6 Data Integrity Rules

**Rule 14: Soft Deletes**
- Never hard delete: Products, Sales, Movements
- Set `deleted_at = CURRENT_TIMESTAMP`
- Filter in queries: `WHERE deleted_at IS NULL`
- Allows data recovery and audit trail

**Rule 15: Cascade Deletes**
- Delete organization → Delete all related data (products, sales, etc)
- Delete product → Keep sale_items (historical snapshot)
- Delete location → Prevent if stock exists there (RESTRICT)

**Rule 16: Timestamp Consistency**
- All timestamps in Unix format (milliseconds since epoch)
- Use `Date.now()` for consistency
- Display in user's timezone (from org settings)

---

## 8. Security Requirements

### 8.1 Authentication

**Provider:** Clerk
- Email/password authentication
- Social logins (Google, optional)
- Session-based (HTTP-only cookies)
- Token refresh handled by Clerk

**Session Management:**
- Clerk manages sessions automatically
- Session duration: 7 days (configurable)
- Auto-refresh before expiration
- Logout: Clear Clerk session + redirect to login

### 8.2 Authorization

**Organization-Level Access:**
- Users belong to one organization
- Cannot access other organizations' data
- Middleware: `requireAuth(request, context)` returns `{ userId, orgId }`

**Future: Role-Based Access Control (RBAC)**
- Roles: Owner, Manager, Staff, Viewer
- Permissions per role (future Phase 3)
- Currently: All authenticated users have full access to their org

### 8.3 Data Protection

**Input Validation:**
- Use Zod schemas for all form inputs
- Sanitize HTML inputs (prevent XSS)
- Escape SQL inputs (use parameterized queries)

**SQL Injection Prevention:**
- ALWAYS use prepared statements with `.bind()`
- NEVER concatenate user input into SQL strings
- Example: `db.prepare('SELECT * FROM products WHERE id = ?').bind(productId)`

**XSS Prevention:**
- Remix auto-escapes JSX output
- Use `dangerouslySetInnerHTML` only when necessary (e.g., rich text)
- Sanitize user input with DOMPurify if rendering HTML

**CSRF Protection:**
- Remix forms include CSRF tokens automatically
- Validate tokens in actions

### 8.4 File Upload Security

**Allowed File Types:**
- Images: jpg, jpeg, png, webp
- Documents: pdf (for future features)

**File Size Limits:**
- Images: Max 5MB
- Documents: Max 10MB

**Validation:**
```typescript
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}
if (file.size > 5 * 1024 * 1024) { // 5MB
  throw new Error('File too large');
}
```

**Storage:**
- Upload to R2 with random UUID filenames
- Store in organization-specific folders: `products/{orgId}/{uuid}-{filename}`
- Serve via CDN with public access (not sensitive data)

### 8.5 Rate Limiting

**Cloudflare Workers Rate Limiting:**
- Use Cloudflare KV for tracking request counts
- Limit: 100 requests/minute per IP for API endpoints
- Limit: 10 requests/minute for expensive operations (exports, reports)

**Implementation (optional for MVP):**
```typescript
const rateLimitKey = `rate_limit:${ip}:${endpoint}`;
const count = await context.KV.get(rateLimitKey);
if (count && parseInt(count) > 100) {
  return new Response('Too many requests', { status: 429 });
}
await context.KV.put(rateLimitKey, (parseInt(count || '0') + 1).toString(), {
  expirationTtl: 60 // 60 seconds
});
```

### 8.6 Environment Variables

**Required Secrets:**
```env
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Database (Cloudflare D1)
DATABASE_ID=your-d1-database-id

# Storage (Cloudflare R2)
R2_BUCKET_NAME=inventory-images
R2_PUBLIC_URL=https://yourdomain.com/storage

# App Settings
APP_URL=https://inventory.yourdomain.com
SESSION_SECRET=random-32-char-string
```

**Storage:**
- Store in `.env` for local development
- Store in Cloudflare Pages environment variables for production
- NEVER commit secrets to Git

---

## 9. UI/UX Guidelines

### 9.1 Design System

**Framework:** shadcn/ui + Tailwind CSS

**Color Palette:**
```
Primary: Blue (#3b82f6)
Success: Green (#10b981)
Warning: Yellow (#f59e0b)
Danger: Red (#ef4444)
Neutral: Gray (#6b7280)
Background: White (#ffffff)
Surface: Light Gray (#f9fafb)
```

**Typography:**
- Font: Inter (Google Fonts)
- Headings: font-semibold
- Body: font-normal
- Code: font-mono (JetBrains Mono)

**Spacing:**
- Use Tailwind spacing scale (4px increments)
- Container max-width: `max-w-7xl`
- Padding: `p-4` (mobile), `p-6` (desktop)

### 9.2 Layout Structure

**App Layout:**
```
┌─────────────────────────────────────┐
│  Header (Logo, Org Name, User Menu) │
├─────────┬───────────────────────────┤
│         │                           │
│ Sidebar │   Main Content            │
│  Nav    │   (Page Content)          │
│         │                           │
│         │                           │
└─────────┴───────────────────────────┘
```

**Sidebar Navigation:**
- Dashboard
- Products
- Inventory
- Sales
- Suppliers (future)
- Reports
- Settings
- Logout

**Mobile:**
- Hamburger menu (sidebar collapses)
- Bottom navigation bar (optional)

### 9.3 Component Patterns

**Data Tables:**
- Use shadcn/ui Table component
- Features: Sort, filter, pagination, search
- Actions: Edit, Delete (with confirmation)
- Row selection for bulk operations
- Empty state with helpful message

**Forms:**
- Use shadcn/ui Form component (react-hook-form + Zod)
- Inline validation (on blur)
- Clear error messages
- Loading states during submission
- Success toast notification

**Modals/Dialogs:**
- Use shadcn/ui Dialog component
- Confirmation dialogs for destructive actions
- Form dialogs for quick actions (adjust stock, add category)

**Loading States:**
- Skeleton loaders for data tables
- Spinner for form submissions
- Progressive enhancement (show cached data while revalidating)

**Empty States:**
- Friendly message with illustration
- Clear CTA (e.g., "Add your first product")
- Example: "No products yet. Click 'Add Product' to get started."

### 9.4 Accessibility

**WCAG 2.1 Level AA Compliance:**
- Keyboard navigation (Tab, Enter, Esc)
- Focus indicators (outline on focus)
- ARIA labels for icons and buttons
- Semantic HTML (heading hierarchy)
- Color contrast ratio ≥ 4.5:1

**Screen Reader Support:**
- Alt text for images
- ARIA live regions for notifications
- Descriptive link text (avoid "Click here")

### 9.5 Responsive Design

**Breakpoints (Tailwind):**
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (laptop)
- `xl`: 1280px (desktop)

**Mobile-First Approach:**
- Design for mobile first
- Enhance for larger screens
- Test on: iPhone SE, iPad, Desktop 1920px

**Mobile Optimizations:**
- Touch-friendly buttons (min 44×44px)
- Sticky header on scroll
- Swipe gestures for lists (future)
- Bottom sheet for actions (mobile)

### 9.6 Performance UX

**Optimistic UI:**
- Update UI immediately on user action
- Revert if server returns error
- Example: Mark sale as paid → Show success → If error, revert + show message

**Progressive Enhancement:**
- Forms work without JavaScript (Remix feature)
- Show loading indicators for async operations
- Cache data client-side (Remix revalidation)

**Feedback:**
- Toast notifications for success/error
- Loading spinners for async actions
- Disabled buttons during submission
- Visual feedback on hover/active states

---

## 10. File Structure

```
inventory-management/
├── app/
│   ├── routes/                          # Remix routes (pages + API)
│   │   ├── _index.tsx                   # Dashboard (/)
│   │   ├── login.tsx                    # Login page
│   │   ├── products._index.tsx          # Products list
│   │   ├── products.new.tsx             # New product
│   │   ├── products.$id.tsx             # Product detail
│   │   ├── products.$id.edit.tsx        # Edit product
│   │   ├── inventory._index.tsx         # Inventory overview
│   │   ├── inventory.adjust.tsx         # Stock adjustment
│   │   ├── sales._index.tsx             # Sales list
│   │   ├── sales.new.tsx                # New sale
│   │   ├── sales.$id.tsx                # Sale detail
│   │   ├── reports._index.tsx           # Reports dashboard
│   │   ├── reports.low-stock.tsx        # Low stock report
│   │   ├── settings._index.tsx          # Settings
│   │   ├── api.barcode.$productId.tsx   # Barcode API
│   │   └── api.export.products.tsx      # Export products
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   └── toast.tsx
│   │   ├── forms/                       # Form components
│   │   │   ├── ProductForm.tsx
│   │   │   ├── SaleForm.tsx
│   │   │   └── StockAdjustmentForm.tsx
│   │   ├── features/                    # Feature-specific components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── StockAlertBanner.tsx
│   │   │   ├── InventoryTable.tsx
│   │   │   ├── DashboardStats.tsx
│   │   │   └── RecentSalesList.tsx
│   │   └── layouts/                     # Layout components
│   │       ├── AppLayout.tsx            # Main app layout
│   │       ├── AuthLayout.tsx           # Auth pages layout
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── lib/
│   │   ├── db.server.ts                 # Database utilities (D1)
│   │   ├── auth.server.ts               # Auth helpers (Clerk)
│   │   ├── storage.server.ts            # R2 storage utilities
│   │   ├── validators.ts                # Zod schemas
│   │   ├── utils.ts                     # General utilities
│   │   ├── barcode.server.ts            # Barcode generation
│   │   └── pdf.server.ts                # PDF generation
│   │
│   ├── hooks/
│   │   ├── useToast.ts                  # Toast notifications
│   │   ├── useDebounce.ts               # Debounce hook
│   │   └── useConfirm.ts                # Confirmation dialog
│   │
│   ├── types/
│   │   ├── index.ts                     # Shared TypeScript types
│   │   └── database.ts                  # Database types
│   │
│   ├── root.tsx                         # Remix root
│   ├── entry.client.tsx                 # Client entry
│   └── entry.server.tsx                 # Server entry
│
├── migrations/                          # D1 database migrations
│   ├── 0001_create_organizations.sql
│   ├── 0002_create_categories.sql
│   ├── 0003_create_products.sql
│   ├── 0004_create_locations.sql
│   ├── 0005_create_stock.sql
│   ├── 0006_create_inventory_movements.sql
│   ├── 0007_create_suppliers.sql
│   ├── 0008_create_product_suppliers.sql
│   ├── 0009_create_sales.sql
│   └── 0010_create_sale_items.sql
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│
├── scripts/
│   ├── seed.ts                          # Seed demo data
│   └── migrate.ts                       # Run migrations
│
├── .env.example                         # Environment variables template
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tailwind.config.ts
├── remix.config.js
├── wrangler.toml                        # Cloudflare Workers config
└── README.md
```

---

## 11. Development Phases

### Phase 1: Foundation (Week 1-2)

**Goals:** Core infrastructure and basic CRUD

**Tasks:**
1. Project setup (Remix + Cloudflare)
2. Database schema creation (D1 migrations)
3. Authentication integration (Clerk)
4. Organization setup flow
5. Product management (CRUD)
6. Basic inventory tracking
7. Dashboard (static data)

**Deliverables:**
- Working login/signup
- Add/edit/delete products
- View product list with search
- Adjust stock levels
- Basic dashboard

---

### Phase 2: Business Logic (Week 3-4)

**Goals:** Sales, multi-location, reporting

**Tasks:**
1. Sales recording (POS-like interface)
2. Multi-location support
3. Stock transfer between locations
4. Category management
5. Low stock alerts
6. Reports (stock, sales, movements)
7. CSV/Excel exports

**Deliverables:**
- Record sales and auto-update inventory
- Transfer stock between locations
- Generate reports
- Export data

---

### Phase 3: Polish & Features (Week 5-6)

**Goals:** UX improvements, advanced features

**Tasks:**
1. Barcode/QR code generation
2. Image upload for products
3. Supplier management
4. Advanced filtering and search
5. Mobile responsiveness
6. Performance optimizations
7. Error handling improvements

**Deliverables:**
- Barcode generation
- Image uploads
- Supplier tracking
- Mobile-friendly UI
- Production-ready

---

### Phase 4: Deployment & Documentation (Week 7)

**Goals:** Production deployment, portfolio documentation

**Tasks:**
1. Production deployment to Cloudflare
2. Custom domain setup
3. Demo data seeding
4. README documentation
5. Architecture diagram
6. Video demo recording
7. Portfolio case study writeup

**Deliverables:**
- Live production app
- Complete documentation
- Demo video
- Portfolio-ready

---

## 12. Deployment Strategy

### 12.1 Local Development

**Setup:**
```bash
# Install dependencies
pnpm install

# Create local D1 database
npx wrangler d1 create inventory-dev

# Run migrations
npx wrangler d1 migrations apply inventory-dev

# Seed demo data
pnpm run seed

# Start dev server
pnpm run dev
```

**Local Environment:**
- Remix dev server with HMR
- Local D1 database (SQLite file)
- Clerk development keys
- Local R2 emulation (Miniflare)

### 12.2 Staging Environment

**Setup:**
```bash
# Create staging D1 database
npx wrangler d1 create inventory-staging

# Run migrations
npx wrangler d1 migrations apply inventory-staging

# Deploy to Cloudflare Pages (staging)
pnpm run deploy:staging
```

**Staging URL:** `https://staging.inventory.yourdomain.com`

**Purpose:**
- Test before production
- Demo to stakeholders
- Integration testing

### 12.3 Production Deployment

**Cloudflare Pages Configuration:**

**1. Connect GitHub Repository**
- Connect Cloudflare Pages to GitHub repo
- Auto-deploy on push to `main` branch

**2. Build Settings**
```
Build command: pnpm run build
Build output directory: public
Root directory: (leave empty)
Environment variables: (add from .env)
```

**3. D1 Database Binding**
```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "inventory-prod"
database_id = "your-database-id"
```

**4. R2 Bucket Binding**
```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "inventory-images"
```

**5. Environment Variables**
- Add in Cloudflare Pages dashboard
- Include: Clerk keys, R2 URL, etc.

**Deployment Steps:**
```bash
# Create production database
npx wrangler d1 create inventory-prod

# Run migrations
npx wrangler d1 migrations apply inventory-prod

# Deploy
git push origin main  # Cloudflare auto-deploys
```

**Production URL:** `https://inventory.yourdomain.com`

### 12.4 Custom Domain

**Setup:**
1. Add domain in Cloudflare Pages settings
2. Update DNS records (CNAME to pages.dev)
3. Enable HTTPS (automatic)

**DNS Configuration:**
```
Type: CNAME
Name: inventory (or @)
Target: your-project.pages.dev
Proxy: Enabled (orange cloud)
```

### 12.5 Monitoring

**Cloudflare Analytics:**
- Request counts
- Error rates
- Response times
- Bandwidth usage

**Error Tracking (optional):**
- Sentry integration for error monitoring
- Logs in Cloudflare Workers dashboard

**Alerts:**
- Set up Cloudflare alerts for high error rates
- Email notifications for downtime

---

## 13. Testing Requirements

### 13.1 Unit Tests

**Framework:** Vitest

**Coverage:**
- Business logic functions (stock calculations, sale totals)
- Validators (Zod schemas)
- Utilities (date formatting, barcode generation)

**Example:**
```typescript
// lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateSaleTotal } from './utils';

describe('calculateSaleTotal', () => {
  it('should calculate correct total', () => {
    const items = [
      { quantity: 2, unit_price: 10 },
      { quantity: 1, unit_price: 5 }
    ];
    expect(calculateSaleTotal(items)).toBe(25);
  });
});
```

### 13.2 Integration Tests

**Framework:** Vitest + MSW (Mock Service Worker)

**Coverage:**
- Remix loaders and actions
- Database operations (use in-memory SQLite)
- File uploads

**Example:**
```typescript
// routes/products.test.ts
import { loader } from './products._index';

describe('Products loader', () => {
  it('should return products for organization', async () => {
    const request = new Request('http://localhost/products');
    const context = { db: mockDb, userId: 'user1', orgId: 'org1' };
    const response = await loader({ request, context });
    const data = await response.json();
    expect(data.products).toBeDefined();
  });
});
```

### 13.3 E2E Tests (Optional)

**Framework:** Playwright

**Coverage:**
- Critical user flows (login, create product, record sale)
- Happy paths only (for MVP)

**Example:**
```typescript
// e2e/create-product.spec.ts
import { test, expect } from '@playwright/test';

test('should create a new product', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  
  await page.goto('/products/new');
  await page.fill('[name=sku]', 'PROD-001');
  await page.fill('[name=name]', 'Test Product');
  await page.fill('[name=cost_price]', '10');
  await page.fill('[name=selling_price]', '20');
  await page.click('button[type=submit]');
  
  await expect(page).toHaveURL(/\/products\/[a-z0-9-]+$/);
});
```

### 13.4 Manual Testing Checklist

**Before Deployment:**
- [ ] Login/logout works
- [ ] Create product with image upload
- [ ] Adjust stock (IN, OUT, ADJUSTMENT)
- [ ] Record sale and verify stock deduction
- [ ] Transfer stock between locations
- [ ] Generate barcode
- [ ] Export data (CSV, Excel)
- [ ] Low stock alert displays correctly
- [ ] Mobile responsive layout works
- [ ] Search and filter products
- [ ] Error messages display properly

---

## 14. Performance Requirements

### 14.1 Response Time Targets

**Page Load (SSR):**
- Dashboard: < 500ms
- Product list: < 700ms
- Product detail: < 400ms

**API Endpoints:**
- CRUD operations: < 300ms
- Reports: < 1s
- Exports: < 2s (for 1000 records)

**Strategy:**
- Use Cloudflare edge caching
- Optimize SQL queries (indexes)
- Lazy load images
- Paginate large lists

### 14.2 Database Optimization

**Query Optimization:**
- Use indexes on foreign keys and frequently queried columns
- Avoid N+1 queries (use JOINs or batch queries)
- Limit result sets (pagination)

**Example Optimized Query:**
```sql
-- Bad: N+1 query
SELECT * FROM products;
-- Then for each product: SELECT * FROM stock WHERE product_id = ?

-- Good: Single query with JOIN
SELECT p.*, 
       COALESCE(SUM(s.quantity), 0) as total_stock
FROM products p
LEFT JOIN stock s ON p.id = s.product_id
WHERE p.organization_id = ?
GROUP BY p.id;
```

### 14.3 Caching Strategy

**Cloudflare KV Cache (optional):**
- Cache product catalog (TTL: 5 minutes)
- Cache dashboard stats (TTL: 1 minute)
- Invalidate on updates

**Browser Cache:**
- Static assets: 1 year (`Cache-Control: max-age=31536000`)
- HTML: No cache (`Cache-Control: no-cache`)
- API responses: No cache (always fresh)

### 14.4 Asset Optimization

**Images:**
- Resize images to max 1920×1080 on upload
- Convert to WebP format (smaller file size)
- Lazy load product images
- Use Cloudflare Image Resizing (optional)

**Code Splitting:**
- Remix auto-splits routes
- Lazy load charts library (Recharts)
- Defer non-critical JS

**Bundle Size:**
- Target: < 200KB initial JS bundle
- Use tree-shaking (automatic with Vite)
- Analyze bundle with `pnpm run build --analyze`

---

## 15. Additional Notes

### 15.1 Scalability Considerations

**Current Scale (Free Tier):**
- D1 Database: 10GB (handles ~50,000 products)
- R2 Storage: 10GB (~ 2,000 product images at 5MB each)
- Workers Requests: 100,000/day (~1 request/second)

**Future Scale (Paid Tier if needed):**
- D1: $5/month for 25GB
- R2: $0.015/GB/month (storage) + $0.36/million operations
- Workers: $5/10 million requests

**Optimization for Scale:**
- Use pagination (never load all records)
- Archive old sales (move to separate table)
- Implement search indexing for large datasets

### 15.2 Future Enhancements (Backlog)

**Short-term:**
- Email notifications for low stock
- Product variants (size, color)
- Bulk operations (bulk update prices)
- Advanced search (full-text search)

**Medium-term:**
- Purchase orders to suppliers
- Multi-currency support
- Receipt printer integration
- Mobile app (React Native)

**Long-term:**
- AI-powered demand forecasting
- Integration with e-commerce platforms (Shopify, WooCommerce)
- Accounting software integration (QuickBooks)
- Multi-warehouse optimization

### 15.3 Known Limitations

**Cloudflare D1 Limitations:**
- Max 1000 rows per query result (use pagination)
- Max 1MB per row
- Read-after-write consistency (eventual consistency for replicas)

**Cloudflare Workers Limitations:**
- Max 50ms CPU time per request (free tier)
- Max 128MB memory
- No WebSocket support (use Durable Objects for real-time, paid)

**Clerk Free Tier:**
- 10,000 MAU (more than enough for portfolio)
- Limited customization (branding)

### 15.4 Success Metrics

**For Portfolio:**
- [ ] Live demo URL with real data
- [ ] Clean, professional UI
- [ ] Mobile-responsive
- [ ] No bugs in core flows
- [ ] Fast load times (< 1s)
- [ ] Complete documentation
- [ ] Impressive features (barcode, exports, analytics)

**For Real-World Use:**
- 10+ active users
- 100+ products in system
- 50+ sales/month
- 99.9% uptime

---

## 16. Conclusion

This PRD provides a comprehensive blueprint for building a production-ready Inventory Management System using Remix and Cloudflare's serverless stack. The system demonstrates:

1. **Full-stack expertise:** Frontend (Remix, React), Backend (Cloudflare Workers), Database (D1)
2. **Business logic:** Stock tracking, sales recording, multi-location
3. **Modern architecture:** Serverless, edge computing, cost-efficient
4. **Production quality:** Security, testing, performance, scalability
5. **Real-world value:** Actually usable by small businesses

**Next Steps:**
1. Review and approve this PRD
2. Set up project structure
3. Begin Phase 1 development
4. Iterate based on feedback

**Estimated Timeline:** 6-7 weeks to production-ready app

**Total Cost:** $0/month (Cloudflare free tier)

---

**End of PRD**
