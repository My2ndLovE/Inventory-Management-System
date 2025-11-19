import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { requireAuth } from '~/lib/auth.server';
import { formatCurrency } from '~/lib/utils';
import { generateCSV, csvResponse } from '~/lib/exports.server';
import { Download, AlertTriangle } from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const url = new URL(request.url);
  const format = url.searchParams.get('export');

  const lowStock = await db
    .prepare(`
      SELECT
        p.sku,
        p.name,
        p.min_stock_level,
        l.name as location_name,
        COALESCE(s.quantity, 0) as current_stock,
        p.min_stock_level - COALESCE(s.quantity, 0) as reorder_quantity,
        p.cost_price
      FROM products p
      CROSS JOIN locations l
      LEFT JOIN stock s ON p.id = s.product_id AND l.id = s.location_id
      WHERE p.organization_id = ?
        AND p.deleted_at IS NULL
        AND l.deleted_at IS NULL
        AND COALESCE(s.quantity, 0) <= p.min_stock_level
      ORDER BY (p.min_stock_level - COALESCE(s.quantity, 0)) DESC
    `)
    .bind(orgId)
    .all();

  const data = lowStock.results || [];

  if (format === 'csv') {
    const headers = ['SKU', 'Product', 'Location', 'Current Stock', 'Min Level', 'Reorder Qty', 'Est. Cost'];
    const rows = data.map((item: any) => [
      item.sku,
      item.name,
      item.location_name,
      item.current_stock,
      item.min_stock_level,
      item.reorder_quantity,
      item.cost_price * item.reorder_quantity,
    ]);
    const csv = generateCSV(headers, rows);
    return csvResponse(csv, `low-stock-report-${Date.now()}.csv`);
  }

  return { data };
}

export default function LowStockReport() {
  const { data } = useLoaderData<typeof loader>();

  const criticalItems = data.filter((item: any) => item.current_stock === 0);
  const totalReorderCost = data.reduce(
    (sum: number, item: any) => sum + item.cost_price * item.reorder_quantity,
    0
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              Low Stock Report
            </h1>
            <p className="text-muted-foreground">Products below minimum stock levels</p>
          </div>

          <Link to="?export=csv">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{data.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalItems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Est. Reorder Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalReorderCost)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items Requiring Reorder</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                All products are adequately stocked!
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Min Level</TableHead>
                    <TableHead className="text-right">Reorder Qty</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.location_name}</TableCell>
                      <TableCell className="text-right">{item.current_stock}</TableCell>
                      <TableCell className="text-right">{item.min_stock_level}</TableCell>
                      <TableCell className="text-right font-medium">{item.reorder_quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.cost_price * item.reorder_quantity)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.current_stock === 0 ? 'destructive' : 'secondary'}>
                          {item.current_stock === 0 ? 'CRITICAL' : 'Low'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
