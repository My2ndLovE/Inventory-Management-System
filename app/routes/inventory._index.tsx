import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { requireAuth } from '~/lib/auth.server';
import { formatCurrency } from '~/lib/utils';
import { Warehouse } from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;

  // Get all stock with product and location info
  const inventory = await db
    .prepare(`
      SELECT
        s.id,
        s.quantity,
        s.reserved_quantity,
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.min_stock_level,
        p.cost_price,
        p.selling_price,
        l.name as location_name
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN locations l ON s.location_id = l.id
      WHERE p.organization_id = ? AND p.deleted_at IS NULL
      ORDER BY p.name, l.name
    `)
    .bind(orgId)
    .all();

  return { inventory: inventory.results || [] };
}

export default function InventoryIndex() {
  const { inventory } = useLoaderData<typeof loader>();

  const totalValue = inventory.reduce(
    (sum: number, item: any) => sum + item.quantity * item.cost_price,
    0
  );

  const lowStockItems = inventory.filter(
    (item: any) => item.quantity <= item.min_stock_level
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">View and manage stock levels across all locations</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No inventory found. Add products and stock to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item: any) => {
                    const available = item.quantity - (item.reserved_quantity || 0);
                    const isLowStock = item.quantity <= item.min_stock_level;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                        <TableCell>
                          <Link
                            to={`/products/${item.product_id}`}
                            className="font-medium hover:underline"
                          >
                            {item.product_name}
                          </Link>
                        </TableCell>
                        <TableCell>{item.location_name}</TableCell>
                        <TableCell>
                          <Badge variant={isLowStock ? 'destructive' : 'default'}>
                            {item.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.reserved_quantity || 0}</TableCell>
                        <TableCell>{available}</TableCell>
                        <TableCell>{formatCurrency(item.quantity * item.cost_price)}</TableCell>
                        <TableCell>
                          {isLowStock && <Badge variant="destructive">Low Stock</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
