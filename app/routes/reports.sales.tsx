import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { requireAuth } from '~/lib/auth.server';
import { formatCurrency, formatTimestamp } from '~/lib/utils';
import { generateCSV, csvResponse } from '~/lib/exports.server';
import { Download } from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const url = new URL(request.url);
  const format = url.searchParams.get('export');

  const sales = await db
    .prepare(`
      SELECT
        s.sale_number,
        s.created_at,
        l.name as location_name,
        s.customer_name,
        s.subtotal,
        s.tax_amount,
        s.discount_amount,
        s.total_amount,
        s.payment_method,
        s.payment_status,
        (SELECT SUM(si.cost_price * si.quantity) FROM sale_items si WHERE si.sale_id = s.id) as total_cost,
        s.total_amount - (SELECT SUM(si.cost_price * si.quantity) FROM sale_items si WHERE si.sale_id = s.id) as profit
      FROM sales s
      JOIN locations l ON s.location_id = l.id
      WHERE s.organization_id = ? AND s.deleted_at IS NULL
      ORDER BY s.created_at DESC
    `)
    .bind(orgId)
    .all();

  const data = sales.results || [];

  if (format === 'csv') {
    const headers = ['Sale #', 'Date', 'Location', 'Customer', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment', 'Status', 'Cost', 'Profit'];
    const rows = data.map((sale: any) => [
      sale.sale_number,
      new Date(sale.created_at).toLocaleString(),
      sale.location_name,
      sale.customer_name || 'Walk-in',
      sale.subtotal,
      sale.tax_amount,
      sale.discount_amount,
      sale.total_amount,
      sale.payment_method,
      sale.payment_status,
      sale.total_cost,
      sale.profit,
    ]);
    const csv = generateCSV(headers, rows);
    return csvResponse(csv, `sales-report-${Date.now()}.csv`);
  }

  const totalRevenue = data.reduce((sum: number, sale: any) => sum + sale.total_amount, 0);
  const totalProfit = data.reduce((sum: number, sale: any) => sum + (sale.profit || 0), 0);
  const avgSaleValue = data.length > 0 ? totalRevenue / data.length : 0;

  return { data, totalRevenue, totalProfit, avgSaleValue };
}

export default function SalesReport() {
  const { data, totalRevenue, totalProfit, avgSaleValue } = useLoaderData<typeof loader>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Report</h1>
            <p className="text-muted-foreground">Revenue and profit analysis</p>
          </div>

          <Link to="?export=csv">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Avg Sale Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgSaleValue)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sales Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((sale: any) => (
                  <TableRow key={sale.sale_number}>
                    <TableCell className="font-mono text-sm">{sale.sale_number}</TableCell>
                    <TableCell>{formatTimestamp(sale.created_at, 'PP')}</TableCell>
                    <TableCell>{sale.customer_name || 'Walk-in'}</TableCell>
                    <TableCell>{sale.location_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.subtotal)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.tax_amount)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(sale.total_amount)}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {formatCurrency(sale.profit || 0)}
                    </TableCell>
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
