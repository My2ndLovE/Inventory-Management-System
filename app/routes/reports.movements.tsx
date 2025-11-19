import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { requireAuth } from '~/lib/auth.server';
import { formatTimestamp } from '~/lib/utils';
import { generateCSV, csvResponse } from '~/lib/exports.server';
import { Download } from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const url = new URL(request.url);
  const format = url.searchParams.get('export');

  const movements = await db
    .prepare(`
      SELECT
        im.created_at,
        im.type,
        p.sku,
        p.name as product_name,
        l.name as location_name,
        im.quantity,
        im.reference_type,
        im.notes
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      JOIN locations l ON im.location_id = l.id
      WHERE im.organization_id = ?
      ORDER BY im.created_at DESC
      LIMIT 500
    `)
    .bind(orgId)
    .all();

  const data = movements.results || [];

  if (format === 'csv') {
    const headers = ['Date', 'Type', 'SKU', 'Product', 'Location', 'Quantity', 'Reference', 'Notes'];
    const rows = data.map((movement: any) => [
      new Date(movement.created_at).toLocaleString(),
      movement.type,
      movement.sku,
      movement.product_name,
      movement.location_name,
      movement.quantity,
      movement.reference_type || '-',
      movement.notes || '-',
    ]);
    const csv = generateCSV(headers, rows);
    return csvResponse(csv, `movements-report-${Date.now()}.csv`);
  }

  const typeBreakdown = data.reduce((acc: any, movement: any) => {
    acc[movement.type] = (acc[movement.type] || 0) + 1;
    return acc;
  }, {});

  return { data, typeBreakdown };
}

export default function MovementsReport() {
  const { data, typeBreakdown } = useLoaderData<typeof loader>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Movement Report</h1>
            <p className="text-muted-foreground">Inventory movement history (last 500 transactions)</p>
          </div>

          <Link to="?export=csv">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.length}</div>
            </CardContent>
          </Card>

          {Object.entries(typeBreakdown).map(([type, count]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{type}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count as number}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Movement History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((movement: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{formatTimestamp(movement.created_at, 'PPp')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          movement.type === 'IN'
                            ? 'default'
                            : movement.type === 'OUT'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {movement.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{movement.sku}</TableCell>
                    <TableCell>{movement.product_name}</TableCell>
                    <TableCell>{movement.location_name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {movement.quantity > 0 ? '+' : ''}
                      {movement.quantity}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{movement.reference_type || 'manual'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{movement.notes || '-'}</TableCell>
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
