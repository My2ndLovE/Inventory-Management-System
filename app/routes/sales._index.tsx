import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { requireAuth } from '~/lib/auth.server';
import { formatCurrency, formatTimestamp } from '~/lib/utils';
import { getPaginationParams, getPaginationOffset, calculatePagination } from '~/lib/db.server';
import { Plus } from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const url = new URL(request.url);
  const pagination = getPaginationParams(url);
  const offset = getPaginationOffset(pagination);

  const sales = await db
    .prepare(`
      SELECT s.*, l.name as location_name
      FROM sales s
      JOIN locations l ON s.location_id = l.id
      WHERE s.organization_id = ? AND s.deleted_at IS NULL
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `)
    .bind(orgId, pagination.limit, offset)
    .all();

  const countResult = await db
    .prepare('SELECT COUNT(*) as total FROM sales WHERE organization_id = ? AND deleted_at IS NULL')
    .bind(orgId)
    .first<{ total: number }>();

  return {
    sales: sales.results || [],
    pagination: calculatePagination(countResult?.total || 0, pagination),
  };
}

export default function SalesIndex() {
  const { sales, pagination } = useLoaderData<typeof loader>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales</h1>
            <p className="text-muted-foreground">View and manage sales transactions</p>
          </div>
          <Link to="/sales/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No sales found. Click "New Sale" to record a sale.
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">{sale.sale_number}</TableCell>
                      <TableCell>{sale.customer_name || 'Walk-in Customer'}</TableCell>
                      <TableCell>{sale.location_name}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(sale.total_amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.payment_status === 'paid'
                              ? 'default'
                              : sale.payment_status === 'pending'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {sale.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTimestamp(sale.created_at, 'PPp')}</TableCell>
                      <TableCell>
                        <Link to={`/sales/${sale.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  {pagination.page > 1 && (
                    <Link to={`?page=${pagination.page - 1}`}>
                      <Button variant="outline" size="sm">Previous</Button>
                    </Link>
                  )}
                  {pagination.page < pagination.totalPages && (
                    <Link to={`?page=${pagination.page + 1}`}>
                      <Button variant="outline" size="sm">Next</Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
