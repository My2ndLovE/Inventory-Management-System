import type { ActionFunctionArgs } from 'react-router';
import { Form, redirect, useActionData } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { requireAuth } from '~/lib/auth.server';
import { generateId, now } from '~/lib/db.server';
import { productSchema } from '~/lib/validators';
import { generateSKU, generateBarcode } from '~/lib/utils';

export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const formData = await request.formData();

  try {
    // Parse and validate
    const data = {
      sku: formData.get('sku') || generateSKU(),
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      cost_price: parseFloat(formData.get('cost_price') as string),
      selling_price: parseFloat(formData.get('selling_price') as string),
      min_stock_level: parseInt(formData.get('min_stock_level') as string) || 0,
      unit_of_measure: formData.get('unit_of_measure') as string || 'pcs',
      is_active: true,
    };

    const validated = productSchema.parse(data);

    // Generate barcode if not provided
    const barcode = formData.get('barcode') as string || generateBarcode();

    // Insert product
    const productId = generateId();
    const timestamp = now();

    await db
      .prepare(`
        INSERT INTO products (
          id, organization_id, sku, name, description, cost_price,
          selling_price, min_stock_level, unit_of_measure, barcode,
          is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        productId,
        orgId,
        validated.sku,
        validated.name,
        data.description,
        validated.cost_price,
        validated.selling_price,
        validated.min_stock_level,
        validated.unit_of_measure,
        barcode,
        1,
        timestamp,
        timestamp
      )
      .run();

    return redirect(`/products/${productId}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to create product',
    };
  }
}

export default function NewProduct() {
  const actionData = useActionData<typeof action>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product in your catalog</p>
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
                <Label htmlFor="sku">SKU (leave empty to auto-generate)</Label>
                <Input id="sku" name="sku" placeholder="PROD-..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price *</Label>
                  <Input id="cost_price" name="cost_price" type="number" step="0.01" required defaultValue="0" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selling_price">Selling Price *</Label>
                  <Input id="selling_price" name="selling_price" type="number" step="0.01" required defaultValue="0" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                  <Input id="min_stock_level" name="min_stock_level" type="number" defaultValue="0" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                  <Input id="unit_of_measure" name="unit_of_measure" defaultValue="pcs" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode (leave empty to auto-generate)</Label>
                <Input id="barcode" name="barcode" />
              </div>

              <div className="flex gap-4">
                <Button type="submit">Create Product</Button>
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
