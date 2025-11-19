import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { requireAuth } from '~/lib/auth.server';
import { formatCurrency } from '~/lib/utils';
import { executeSingle } from '~/lib/db.server';
import type { CountResult, SumResult, DashboardStats } from '~/lib/types';
import { Package, TrendingDown, ShoppingCart, DollarSign } from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;

  // Calculate 30 days ago timestamp
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  // Run all queries in parallel for better performance
  const [productsCount, lowStockCount, stockValue, salesCount] = await Promise.all([
    // Get total products count
    executeSingle<CountResult>(
      db,
      'SELECT COUNT(*) as count FROM products WHERE organization_id = ? AND deleted_at IS NULL',
      [orgId]
    ),

    // Get low stock products count
    executeSingle<CountResult>(
      db,
      `SELECT COUNT(DISTINCT p.id) as count
       FROM products p
       LEFT JOIN stock s ON p.id = s.product_id
       WHERE p.organization_id = ?
         AND p.deleted_at IS NULL
         AND (s.quantity IS NULL OR s.quantity <= p.min_stock_level)`,
      [orgId]
    ),

    // Get total stock value
    executeSingle<SumResult>(
      db,
      `SELECT COALESCE(SUM(s.quantity * p.cost_price), 0) as total
       FROM stock s
       JOIN products p ON s.product_id = p.id
       WHERE p.organization_id = ? AND p.deleted_at IS NULL`,
      [orgId]
    ),

    // Get recent sales count (last 30 days)
    executeSingle<CountResult>(
      db,
      `SELECT COUNT(*) as count
       FROM sales
       WHERE organization_id = ? AND created_at >= ?`,
      [orgId, thirtyDaysAgo]
    ),
  ]);

  const stats: DashboardStats = {
    totalProducts: productsCount?.count || 0,
    lowStockItems: lowStockCount?.count || 0,
    stockValue: stockValue?.total || 0,
    recentSales: salesCount?.count || 0,
  };

  return { stats };
}

export default function Dashboard() {
  const { stats } = useLoaderData<typeof loader>();

  const cards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: TrendingDown,
      color: 'text-red-600',
    },
    {
      title: 'Stock Value',
      value: formatCurrency(stats.stockValue),
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Sales (30 Days)',
      value: stats.recentSales,
      icon: ShoppingCart,
      color: 'text-purple-600',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your inventory management system</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map(card => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a href="/products/new" className="block text-sm text-blue-600 hover:underline">
                  + Add New Product
                </a>
                <a href="/sales/new" className="block text-sm text-blue-600 hover:underline">
                  + Record Sale
                </a>
                <a href="/inventory" className="block text-sm text-blue-600 hover:underline">
                  → View Inventory
                </a>
                <a href="/reports" className="block text-sm text-blue-600 hover:underline">
                  → Generate Reports
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Inventory Management System v1.0</p>
              <p className="mt-2">Built with React Router v7 & Cloudflare</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
