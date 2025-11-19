import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { requireAuth } from '~/lib/auth.server';
import { formatCurrency, formatTimestamp } from '~/lib/utils';
import { Edit, ArrowLeft } from 'lucide-react';

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const { id } = params;

  // Get product
  const product = await db
    .prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.organization_id = ? AND p.deleted_at IS NULL
    `)
    .bind(id, orgId)
    .first();

  if (!product) {
    throw new Response('Product not found', { status: 404 });
  }

  // Get stock by location
  const stock = await db
    .prepare(`
      SELECT s.*, l.name as location_name
      FROM stock s
      JOIN locations l ON s.location_id = l.id
      WHERE s.product_id = ?
    `)
    .bind(id)
    .all();

  return { product, stock: stock.results || [] };
}

export default function ProductDetail() {
  const { product, stock } = useLoaderData<typeof loader>();

  const totalStock = stock.reduce((sum: number, s: any) => sum + s.quantity, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/products" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:underline">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Products
            </Link>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
          <Link to={`/products/${product.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SKU</p>
                <p className="font-mono font-medium">{product.sku}</p>
              </div>
              {product.barcode && (
                <div>
                  <p className="text-sm text-muted-foreground">Barcode</p>
                  <p className="font-mono font-medium">{product.barcode}</p>
                </div>
              )}
              {product.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{product.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{product.category_name || 'Uncategorized'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Cost Price</p>
                <p className="text-2xl font-bold">{formatCurrency(product.cost_price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selling Price</p>
                <p className="text-2xl font-bold">{formatCurrency(product.selling_price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stock</p>
                <p className="text-2xl font-bold">
                  {totalStock}
                  {totalStock <= product.min_stock_level && (
                    <Badge variant="destructive" className="ml-2">Low Stock</Badge>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Minimum Stock Level</p>
                <p className="font-medium">{product.min_stock_level}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit of Measure</p>
                <p className="font-medium">{product.unit_of_measure}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {stock.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Stock by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stock.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between border-b pb-2">
                    <span>{s.location_name}</span>
                    <Badge>{s.quantity} units</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Created: {formatTimestamp(product.created_at, 'PPpp')}</p>
            <p>Last Updated: {formatTimestamp(product.updated_at, 'PPpp')}</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
