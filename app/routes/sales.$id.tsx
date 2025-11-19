import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { requireAuth } from '~/lib/auth.server';
import { formatCurrency, formatTimestamp } from '~/lib/utils';
import { ArrowLeft, Receipt } from 'lucide-react';

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const { id } = params;

  const sale = await db
    .prepare(`
      SELECT s.*, l.name as location_name
      FROM sales s
      JOIN locations l ON s.location_id = l.id
      WHERE s.id = ? AND s.organization_id = ? AND s.deleted_at IS NULL
    `)
    .bind(id, orgId)
    .first();

  if (!sale) {
    throw new Response('Sale not found', { status: 404 });
  }

  const items = await db
    .prepare('SELECT * FROM sale_items WHERE sale_id = ?')
    .bind(id)
    .all();

  return { sale, items: items.results || [] };
}

export default function SaleDetail() {
  const { sale, items } = useLoaderData<typeof loader>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Link to="/sales" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Sales
          </Link>
          <div className="flex items-center gap-2">
            <Receipt className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">{sale.sale_number}</h1>
              <p className="text-muted-foreground">Sale Receipt</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sale Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Sale Number</p>
                <p className="font-mono font-medium">{sale.sale_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{sale.location_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">{formatTimestamp(sale.created_at, 'PPpp')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <Badge variant="outline">{sale.payment_method || 'N/A'}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge variant={sale.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {sale.payment_status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{sale.customer_name || 'Walk-in Customer'}</p>
              </div>
              {sale.customer_email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{sale.customer_email}</p>
                </div>
              )}
              {sale.customer_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{sale.customer_phone}</p>
                </div>
              )}
              {sale.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{sale.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sale Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-{formatCurrency(sale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-medium">{formatCurrency(sale.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(sale.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
