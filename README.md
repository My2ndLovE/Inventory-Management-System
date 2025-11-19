# Inventory Management System

A modern, serverless inventory management system built with React Router v7 and Cloudflare. Designed for small to medium businesses with $0/month operating costs using Cloudflare's free tier.

## 🚀 Features

### ✅ Implemented (MVP - Phase 1)
- **Dashboard** - Overview with key metrics (products, low stock, stock value, sales)
- **Product Management** - Full CRUD operations for products
- **Inventory Tracking** - View stock levels across all locations
- **Sales Management** - View sales history and transactions
- **Multi-location Support** - Track inventory across multiple warehouses/stores
- **Responsive Design** - Mobile-friendly UI with Tailwind CSS v4
- **Search & Filtering** - Find products quickly by name, SKU, or barcode
- **Low Stock Alerts** - Visual indicators for products below minimum levels

### 🚧 Coming Soon (Phases 2-3)
- **Stock Adjustments** - Increase/decrease inventory with reason tracking
- **Sales Recording** - POS-like interface for recording new sales
- **Product Editing** - Update product information and pricing
- **Barcode Generation** - Generate CODE128 and QR codes
- **Reports & Exports** - CSV, Excel, PDF exports
- **Supplier Management** - Track suppliers and purchase orders
- **Category Management** - Organize products into categories
- **Advanced Analytics** - Charts and visualizations with Recharts

## 🛠️ Tech Stack

### Frontend
- **Framework:** React Router v7 (formerly Remix)
- **UI Library:** shadcn/ui + Tailwind CSS v4
- **State Management:** React Router loaders & actions
- **Icons:** Lucide React
- **Validation:** Zod

### Backend
- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite at edge)
- **Storage:** Cloudflare R2 (planned for images)
- **Cache:** Cloudflare KV (optional)

### Development
- **Language:** TypeScript (strict mode)
- **Package Manager:** pnpm
- **Build Tool:** Vite
- **Testing:** Vitest 4.0 (planned)
- **Linting:** ESLint + Prettier

## 📦 Installation

### Prerequisites
- Node.js >= 20.0.0
- pnpm (recommended) or npm
- Cloudflare account (free tier)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/My2ndLovE/Inventory-Management-System.git
   cd Inventory-Management-System
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your credentials
   ```

4. **Create local D1 database:**
   ```bash
   npx wrangler d1 create inventory-dev
   ```

5. **Run migrations:**
   ```bash
   pnpm run db:migrate
   ```

6. **Start development server:**
   ```bash
   pnpm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🗄️ Database Schema

The system uses 11 tables:

1. **organizations** - Multi-tenant organization data
2. **categories** - Product categories (nested support)
3. **products** - Product catalog
4. **product_variants** - Product variations (size, color, etc.)
5. **locations** - Warehouses/stores
6. **stock** - Current stock levels per location
7. **inventory_movements** - Stock movement history
8. **suppliers** - Supplier information
9. **product_suppliers** - Product-supplier relationships
10. **sales** - Sales transactions
11. **sale_items** - Line items for each sale

All migrations are in `migrations/` directory.

## 📝 Development Workflow

### Running Locally

```bash
# Start dev server
pnpm run dev

# Run type checking
pnpm run typecheck

# Run linter
pnpm run lint

# Format code
pnpm run format

# Run tests (when implemented)
pnpm run test
```

### Database Management

```bash
# Run migrations locally
pnpm run db:migrate

# Run migrations in production
pnpm run db:migrate:prod

# Seed demo data (when implemented)
pnpm run seed
```

## 🚀 Deployment

### Cloudflare Pages

1. **Connect your GitHub repository** to Cloudflare Pages

2. **Configure build settings:**
   - Build command: `pnpm run build`
   - Build output directory: `build/client`
   - Root directory: (leave empty)

3. **Set environment variables** in Cloudflare dashboard:
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - Other variables from `.env.example`

4. **Create production database:**
   ```bash
   npx wrangler d1 create inventory-prod
   npx wrangler d1 migrations apply inventory-prod
   ```

5. **Update `wrangler.toml`** with production database ID

6. **Deploy:**
   ```bash
   pnpm run deploy
   ```

## 📖 API Structure

### React Router v7 Loaders & Actions

- **Loaders** - Server-side data fetching (GET requests)
- **Actions** - Form submissions and mutations (POST/PUT/DELETE)
- **Progressive Enhancement** - Forms work without JavaScript

### Example Routes

- `GET /` - Dashboard with stats
- `GET /products` - List all products
- `GET /products/:id` - Product details
- `POST /products/new` - Create product
- `GET /inventory` - View inventory
- `GET /sales` - Sales history

## 🎨 UI Components

Built with shadcn/ui for consistency and accessibility:

- `Button` - Primary, secondary, outline, ghost variants
- `Input` - Form inputs with validation
- `Card` - Content containers
- `Table` - Data tables with sorting
- `Dialog` - Modal dialogs
- `Badge` - Status indicators
- `Toast` - Notifications
- And more...

## 🔒 Security

- **Authentication:** Clerk (planned integration)
- **Authorization:** Organization-level access control
- **SQL Injection Prevention:** Parameterized queries only
- **XSS Prevention:** React auto-escapes output
- **CSRF Protection:** React Router built-in tokens

## 💰 Cost Optimization

**Target: $0/month**

### Free Tier Limits (Cloudflare)

| Service | Free Tier | Current Usage |
|---------|-----------|---------------|
| Workers | 100,000 requests/day | ~1% |
| D1 Database | 500MB, 5M reads/day | ~10% |
| R2 Storage | 10GB, 10M ops/month | ~0% |
| KV | 100k reads/day | ~0% |
| Pages | Unlimited requests | ✅ |

### Monitoring
- Database size tracking in settings
- Request counters (planned)
- Storage usage alerts (planned)

## 📚 Project Structure

```
inventory-management/
├── app/
│   ├── routes/              # React Router v7 routes
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── layouts/        # Layout components
│   │   └── features/       # Feature components
│   ├── lib/                # Utilities & helpers
│   ├── hooks/              # React hooks
│   ├── types/              # TypeScript types
│   └── styles/             # Global styles
├── migrations/             # D1 database migrations
├── public/                 # Static assets
├── scripts/                # Utility scripts
└── docs/                   # Documentation
```

## 🤝 Contributing

This is a portfolio project, but suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with [React Router v7](https://reactrouter.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/)
- Icons by [Lucide](https://lucide.dev/)

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check the [PRD](docs/inventory-management-prd.md) for detailed specifications

---

**Built with ❤️ using modern web technologies**

*Last updated: November 2024*
