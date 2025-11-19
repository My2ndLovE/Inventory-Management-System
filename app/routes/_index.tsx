import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { requireAuth } from '~/lib/auth.server';
import { formatCurrency } from '~/lib/utils';
import { Package, TrendingDown, ShoppingCart, DollarSign } from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;

  // Get total products count
  const productsCount = await db
    .prepare('SELECT COUNT(*) as count FROM products WHERE organization_id = ? AND deleted_at IS NULL')
    .bind(orgId)
    .first<{ count: number }>();

  // Get low stock products count
  const lowStockCount = await db
    .prepare(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.organization_id = ?
        AND p.deleted_at IS NULL
        AND (s.quantity IS NULL OR s.quantity <= p.min_stock_level)
    `)
    .bind(orgId)
    .first<{ count: number }>();

  // Get total stock value
  const stockValue = await db
    .prepare(`
      SELECT COALESCE(SUM(s.quantity * p.cost_price), 0) as value
      FROM stock s
      JOIN products p ON s.product_id = p.id
      WHERE p.organization_id = ?
    `)
    .bind(orgId)
    .first<{ value: number }>();

  // Get recent sales count (last 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const salesCount = await db
    .prepare(`
      SELECT COUNT(*) as count
      FROM sales
      WHERE organization_id = ? AND created_at >= ? AND deleted_at IS NULL
    `)
    .bind(orgId, thirtyDaysAgo)
    .first<{ count: number }>();

  return {
    stats: {
      totalProducts: productsCount?.count || 0,
      lowStockItems: lowStockCount?.count || 0,
      stockValue: stockValue?.value || 0,
      recentSales: salesCount?.count || 0,
    },
  };
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
