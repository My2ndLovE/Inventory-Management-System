import type { LoaderFunctionArgs } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { requireAuth } from '~/lib/auth.server';
import { formatCurrency, formatTimestamp } from '~/lib/utils';
import { getPaginationParams, getPaginationOffset, calculatePagination } from '~/lib/db.server';
import { Plus, Search } from 'lucide-react';
import type { Product } from '~/types';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const url = new URL(request.url);

  const search = url.searchParams.get('search') || '';
  const pagination = getPaginationParams(url);
  const offset = getPaginationOffset(pagination);

  // Build query
  let query = `
    SELECT p.*, c.name as category_name,
           COALESCE(SUM(s.quantity), 0) as total_stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN stock s ON p.id = s.product_id
    WHERE p.organization_id = ? AND p.deleted_at IS NULL
  `;
  const params: (string | number)[] = [orgId];

  if (search) {
    query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(pagination.limit, offset);

  const products = await db.prepare(query).bind(...params).all();

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM products WHERE organization_id = ? AND deleted_at IS NULL`;
  const countParams: (string | number)[] = [orgId];
  if (search) {
    countQuery += ` AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)`;
    const searchPattern = `%${search}%`;
    countParams.push(searchPattern, searchPattern, searchPattern);
  }

  const countResult = await db.prepare(countQuery).bind(...countParams).first<{ total: number }>();
  const total = countResult?.total || 0;

  return {
    products: products.results || [],
    pagination: calculatePagination(total, pagination),
    search,
  };
}

export default function ProductsIndex() {
  const { products, pagination, search } = useLoaderData<typeof loader>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Link to="/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search products by name, SKU, or barcode..."
                  className="pl-10"
                  defaultValue={search}
                />
              </div>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No products found. Click "Add Product" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product: Product & { category_name?: string; total_stock?: number }) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        <Link to={`/products/${product.id}`} className="font-medium hover:underline">
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell>{product.category_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={product.total_stock && product.total_stock <= product.min_stock_level ? 'destructive' : 'default'}>
                          {product.total_stock || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(product.cost_price)}</TableCell>
                      <TableCell>{formatCurrency(product.selling_price)}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
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
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  {pagination.page > 1 && (
                    <Link to={`?page=${pagination.page - 1}${search ? `&search=${search}` : ''}`}>
                      <Button variant="outline" size="sm">
                        Previous
                      </Button>
                    </Link>
                  )}
                  {pagination.page < pagination.totalPages && (
                    <Link to={`?page=${pagination.page + 1}${search ? `&search=${search}` : ''}`}>
                      <Button variant="outline" size="sm">
                        Next
                      </Button>
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
