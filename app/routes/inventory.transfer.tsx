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
import { stockTransferSchema } from '~/lib/validators';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;

  const products = await db
    .prepare('SELECT id, name, sku FROM products WHERE organization_id = ? AND deleted_at IS NULL ORDER BY name')
    .bind(orgId)
    .all();

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
      from_location_id: formData.get('from_location_id') as string,
      to_location_id: formData.get('to_location_id') as string,
      quantity: parseInt(formData.get('quantity') as string),
      notes: formData.get('notes') as string || null,
    };

    const validated = stockTransferSchema.parse(data);

    // Check source stock
    const sourceStock = await db
      .prepare('SELECT quantity FROM stock WHERE product_id = ? AND location_id = ?')
      .bind(validated.product_id, validated.from_location_id)
      .first<{ quantity: number }>();

    if (!sourceStock || sourceStock.quantity < validated.quantity) {
      return {
        error: `Insufficient stock at source. Available: ${sourceStock?.quantity || 0}, Requested: ${validated.quantity}`,
      };
    }

    const timestamp = now();
    const transferId = generateId();

    // Transaction: OUT from source, IN to destination
    const statements = [
      // Movement OUT from source
      db.prepare(`
        INSERT INTO inventory_movements (
          id, organization_id, product_id, location_id, type, quantity,
          from_location_id, reference_id, reference_type, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        generateId(),
        orgId,
        validated.product_id,
        validated.from_location_id,
        'TRANSFER',
        -validated.quantity,
        validated.to_location_id,
        transferId,
        'transfer',
        data.notes,
        userId,
        timestamp
      ),

      // Movement IN to destination
      db.prepare(`
        INSERT INTO inventory_movements (
          id, organization_id, product_id, location_id, type, quantity,
          from_location_id, reference_id, reference_type, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        generateId(),
        orgId,
        validated.product_id,
        validated.to_location_id,
        'TRANSFER',
        validated.quantity,
        validated.from_location_id,
        transferId,
        'transfer',
        data.notes,
        userId,
        timestamp
      ),

      // Reduce source stock
      db.prepare(`
        UPDATE stock SET quantity = quantity - ?, updated_at = ?
        WHERE product_id = ? AND location_id = ?
      `).bind(validated.quantity, timestamp, validated.product_id, validated.from_location_id),

      // Increase destination stock
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
        validated.to_location_id,
        validated.quantity,
        timestamp,
        validated.quantity,
        timestamp
      ),
    ];

    await db.batch(statements);

    return redirect('/inventory');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Transfer failed' };
  }
}

export default function TransferStock() {
  const { products, locations } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transfer Stock</h1>
          <p className="text-muted-foreground">Move inventory between locations</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Stock Transfer</CardTitle>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from_location_id">From Location *</Label>
                  <Select name="from_location_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
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
                  <Label htmlFor="to_location_id">To Location *</Label>
                  <Select name="to_location_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Destination" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input id="quantity" name="quantity" type="number" min="1" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" placeholder="Reason for transfer..." />
              </div>

              <div className="flex gap-4">
                <Button type="submit">Transfer Stock</Button>
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
