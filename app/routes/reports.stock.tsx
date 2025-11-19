import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { requireAuth } from '~/lib/auth.server';
import { formatCurrency, formatTimestamp } from '~/lib/utils';
import { generateCSV, csvResponse, generateExcelXML, excelResponse } from '~/lib/exports.server';
import { Download } from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const url = new URL(request.url);
  const format = url.searchParams.get('export');

  const inventory = await db
    .prepare(`
      SELECT
        p.sku,
        p.name,
        p.cost_price,
        p.selling_price,
        p.min_stock_level,
        l.name as location_name,
        COALESCE(s.quantity, 0) as quantity,
        COALESCE(s.quantity * p.cost_price, 0) as value
      FROM products p
      CROSS JOIN locations l
      LEFT JOIN stock s ON p.id = s.product_id AND l.id = s.location_id
      WHERE p.organization_id = ? AND p.deleted_at IS NULL AND l.deleted_at IS NULL
      ORDER BY p.name, l.name
    `)
    .bind(orgId)
    .all();

  const data = inventory.results || [];

  // Export functionality
  if (format === 'csv') {
    const headers = ['SKU', 'Product', 'Location', 'Quantity', 'Cost Price', 'Selling Price', 'Min Level', 'Value'];
    const rows = data.map((item: any) => [
      item.sku,
      item.name,
      item.location_name,
      item.quantity,
      item.cost_price,
      item.selling_price,
      item.min_stock_level,
      item.value,
    ]);
    const csv = generateCSV(headers, rows);
    return csvResponse(csv, `stock-report-${Date.now()}.csv`);
  }

  if (format === 'excel') {
    const headers = ['SKU', 'Product', 'Location', 'Quantity', 'Cost Price', 'Selling Price', 'Min Level', 'Value'];
    const rows = data.map((item: any) => [
      item.sku,
      item.name,
      item.location_name,
      item.quantity,
      item.cost_price,
      item.selling_price,
      item.min_stock_level,
      item.value,
    ]);
    const xml = generateExcelXML(headers, rows, 'Stock Report');
    return excelResponse(xml, `stock-report-${Date.now()}.xls`);
  }

  const totalValue = data.reduce((sum: number, item: any) => sum + item.value, 0);
  const totalQuantity = data.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return { data, totalValue, totalQuantity };
}

export default function StockReport() {
  const { data, totalValue, totalQuantity } = useLoaderData<typeof loader>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Report</h1>
            <p className="text-muted-foreground">Complete inventory overview with stock levels and values</p>
          </div>

          <div className="flex gap-2">
            <Link to="?export=csv">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </Link>
            <Link to="?export=excel">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Min Level</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.location_name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.cost_price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.selling_price)}</TableCell>
                    <TableCell className="text-right">{item.min_stock_level}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
