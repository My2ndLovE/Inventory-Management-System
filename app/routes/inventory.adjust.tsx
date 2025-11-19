import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, redirect, useActionData, useLoaderData } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { requireAuth } from '~/lib/auth.server';
import { generateId, now } from '~/lib/db.server';
import { stockAdjustmentSchema } from '~/lib/validators';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;

  // Get all products
  const products = await db
    .prepare('SELECT id, name, sku FROM products WHERE organization_id = ? AND deleted_at IS NULL ORDER BY name')
    .bind(orgId)
    .all();

  // Get all locations
  const locations = await db
    .prepare('SELECT id, name FROM locations WHERE organization_id = ? AND deleted_at IS NULL AND is_active = 1')
    .bind(orgId)
    .all();

  return { products: products.results || [], locations: locations.results || [] };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const formData = await request.formData();

  try {
    const data = {
      product_id: formData.get('product_id') as string,
      location_id: formData.get('location_id') as string,
      type: formData.get('type') as 'IN' | 'OUT' | 'ADJUSTMENT',
      quantity: parseInt(formData.get('quantity') as string),
      notes: formData.get('notes') as string || null,
    };

    const validated = stockAdjustmentSchema.parse(data);

    // Check current stock for OUT operations
    if (validated.type === 'OUT') {
      const currentStock = await db
        .prepare('SELECT quantity FROM stock WHERE product_id = ? AND location_id = ?')
        .bind(validated.product_id, validated.location_id)
        .first<{ quantity: number }>();

      if (!currentStock || currentStock.quantity < validated.quantity) {
        return {
          error: `Insufficient stock. Available: ${currentStock?.quantity || 0}, Requested: ${validated.quantity}`,
        };
      }
    }

    const timestamp = now();
    const movementId = generateId();
    const adjustedQty = validated.type === 'OUT' ? -validated.quantity : validated.quantity;

    // Start transaction
    const statements = [
      // Create movement record
      db.prepare(`
        INSERT INTO inventory_movements (
          id, organization_id, product_id, location_id, type, quantity,
          reference_type, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        movementId,
        orgId,
        validated.product_id,
        validated.location_id,
        validated.type,
        adjustedQty,
        'adjustment',
        data.notes,
        userId,
        timestamp
      ),

      // Update or insert stock
      db.prepare(`
        INSERT INTO stock (id, organization_id, product_id, location_id, quantity, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(product_id, variant_id, location_id) DO UPDATE SET
          quantity = quantity + ?,
          updated_at = ?
      `).bind(
        generateId(),
        orgId,
        validated.product_id,
        validated.location_id,
        adjustedQty,
        timestamp,
        adjustedQty,
        timestamp
      ),
    ];

    await db.batch(statements);

    return redirect('/inventory');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to adjust stock' };
  }
}

export default function AdjustStock() {
  const { products, locations } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Adjust Stock</h1>
          <p className="text-muted-foreground">Increase or decrease inventory levels</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Stock Adjustment</CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              {actionData?.error && (
                <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                  {actionData.error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="product_id">Product *</Label>
                <Select name="product_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_id">Location *</Label>
                <Select name="location_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Adjustment Type *</Label>
                <Select name="type" required defaultValue="IN">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">Stock In (Add)</SelectItem>
                    <SelectItem value="OUT">Stock Out (Remove)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment (Correct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input id="quantity" name="quantity" type="number" min="1" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" placeholder="Reason for adjustment..." />
              </div>

              <div className="flex gap-4">
                <Button type="submit">Apply Adjustment</Button>
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
