import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, redirect, useActionData, useLoaderData } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { requireAuth } from '~/lib/auth.server';
import { now } from '~/lib/db.server';
import { productSchema } from '~/lib/validators';

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const { id } = params;

  const product = await db
    .prepare('SELECT * FROM products WHERE id = ? AND organization_id = ? AND deleted_at IS NULL')
    .bind(id, orgId)
    .first();

  if (!product) {
    throw new Response('Product not found', { status: 404 });
  }

  return { product };
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const { id } = params;
  const formData = await request.formData();

  try {
    const data = {
      sku: formData.get('sku') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      cost_price: parseFloat(formData.get('cost_price') as string),
      selling_price: parseFloat(formData.get('selling_price') as string),
      min_stock_level: parseInt(formData.get('min_stock_level') as string) || 0,
      unit_of_measure: formData.get('unit_of_measure') as string || 'pcs',
      is_active: formData.get('is_active') === 'on',
    };

    const validated = productSchema.parse(data);

    await db
      .prepare(`
        UPDATE products
        SET sku = ?, name = ?, description = ?, cost_price = ?,
            selling_price = ?, min_stock_level = ?, unit_of_measure = ?,
            is_active = ?, updated_at = ?
        WHERE id = ? AND organization_id = ?
      `)
      .bind(
        validated.sku,
        validated.name,
        data.description,
        validated.cost_price,
        validated.selling_price,
        validated.min_stock_level,
        validated.unit_of_measure,
        data.is_active ? 1 : 0,
        now(),
        id,
        orgId
      )
      .run();

    return redirect(`/products/${id}`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update product' };
  }
}

export default function EditProduct() {
  const { product } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">Update product information</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              {actionData?.error && (
                <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                  {actionData.error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" name="sku" required defaultValue={product.sku} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" required defaultValue={product.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" defaultValue={product.description || ''} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price *</Label>
                  <Input id="cost_price" name="cost_price" type="number" step="0.01" required defaultValue={product.cost_price} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selling_price">Selling Price *</Label>
                  <Input id="selling_price" name="selling_price" type="number" step="0.01" required defaultValue={product.selling_price} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                  <Input id="min_stock_level" name="min_stock_level" type="number" defaultValue={product.min_stock_level} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                  <Input id="unit_of_measure" name="unit_of_measure" defaultValue={product.unit_of_measure} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked={product.is_active === 1}
                />
                <Label htmlFor="is_active" className="font-normal">Active</Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Cancel
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
