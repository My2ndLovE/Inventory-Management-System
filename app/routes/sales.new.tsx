import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, redirect, useActionData, useLoaderData } from 'react-router';
import { useState } from 'react';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { requireAuth } from '~/lib/auth.server';
import { generateId, now } from '~/lib/db.server';
import { formatCurrency, calculateSaleTotals, generateSaleNumber } from '~/lib/utils';
import { Plus, Trash } from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;

  const products = await db
    .prepare(`
      SELECT p.id, p.name, p.sku, p.selling_price, p.cost_price,
             COALESCE(SUM(s.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.organization_id = ? AND p.deleted_at IS NULL AND p.is_active = 1
      GROUP BY p.id
      ORDER BY p.name
    `)
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
    const locationId = formData.get('location_id') as string;
    const customerName = formData.get('customer_name') as string || null;
    const customerEmail = formData.get('customer_email') as string || null;
    const customerPhone = formData.get('customer_phone') as string || null;
    const paymentMethod = formData.get('payment_method') as string || 'cash';
    const discountAmount = parseFloat(formData.get('discount_amount') as string || '0');

    const items = JSON.parse(formData.get('items') as string);

    if (!items || items.length === 0) {
      return { error: 'At least one item is required' };
    }

    // Validate stock availability
    for (const item of items) {
      const stock = await db
        .prepare('SELECT quantity FROM stock WHERE product_id = ? AND location_id = ?')
        .bind(item.product_id, locationId)
        .first<{ quantity: number }>();

      if (!stock || stock.quantity < item.quantity) {
        return {
          error: `Insufficient stock for ${item.product_name}. Available: ${stock?.quantity || 0}`,
        };
      }
    }

    // Calculate totals
    const { subtotal, taxAmount, totalAmount } = calculateSaleTotals(items, discountAmount);

    const saleNumber = await generateSaleNumber(db, orgId);
    const saleId = generateId();
    const timestamp = now();

    const statements = [
      // Insert sale
      db.prepare(`
        INSERT INTO sales (
          id, organization_id, sale_number, location_id, customer_name,
          customer_email, customer_phone, subtotal, tax_amount, discount_amount,
          total_amount, payment_method, payment_status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        saleId,
        orgId,
        saleNumber,
        locationId,
        customerName,
        customerEmail,
        customerPhone,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paymentMethod,
        'paid',
        userId,
        timestamp,
        timestamp
      ),
    ];

    // Add items, reduce stock, create movements
    for (const item of items) {
      // Sale item
      statements.push(
        db.prepare(`
          INSERT INTO sale_items (
            id, sale_id, product_id, product_name, sku, quantity,
            unit_price, cost_price, subtotal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          generateId(),
          saleId,
          item.product_id,
          item.product_name,
          item.sku,
          item.quantity,
          item.unit_price,
          item.cost_price,
          item.quantity * item.unit_price,
          timestamp
        )
      );

      // Reduce stock
      statements.push(
        db.prepare(`
          UPDATE stock SET quantity = quantity - ?, updated_at = ?
          WHERE product_id = ? AND location_id = ?
        `).bind(item.quantity, timestamp, item.product_id, locationId)
      );

      // Inventory movement
      statements.push(
        db.prepare(`
          INSERT INTO inventory_movements (
            id, organization_id, product_id, location_id, type, quantity,
            reference_id, reference_type, unit_cost, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          generateId(),
          orgId,
          item.product_id,
          locationId,
          'OUT',
          -item.quantity,
          saleId,
          'sale',
          item.cost_price,
          userId,
          timestamp
        )
      );
    }

    await db.batch(statements);

    return redirect(`/sales/${saleId}`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create sale' };
  }
}

export default function NewSale() {
  const { products, locations } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<any[]>([]);

  const addToCart = () => {
    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;

    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          quantity,
          unit_price: product.selling_price,
          cost_price: product.cost_price,
        },
      ]);
    }

    setSelectedProduct('');
    setQuantity(1);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxRate = 0.06;
  const taxAmount = cartSubtotal * taxRate;
  const total = cartSubtotal + taxAmount;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">New Sale</h1>
          <p className="text-muted-foreground">Record a new sales transaction</p>
        </div>

        {actionData?.error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {actionData.error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle>Shopping Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.selling_price)} (Stock: {product.total_stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-20"
                />

                <Button onClick={addToCart} disabled={!selectedProduct}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {cart.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map(item => (
                      <TableRow key={item.product_id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell>{formatCurrency(item.quantity * item.unit_price)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Cart is empty. Add products to get started.
                </p>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (6%):</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Details */}
          <Card>
            <CardHeader>
              <CardTitle>Sale Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="items" value={JSON.stringify(cart)} />

                <div className="space-y-2">
                  <Label htmlFor="location_id">Location *</Label>
                  <Select name="location_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
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
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input id="customer_name" name="customer_name" placeholder="Optional" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_email">Customer Email</Label>
                  <Input id="customer_email" name="customer_email" type="email" placeholder="Optional" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Customer Phone</Label>
                  <Input id="customer_phone" name="customer_phone" placeholder="Optional" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select name="payment_method" defaultValue="cash">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Discount Amount</Label>
                  <Input
                    id="discount_amount"
                    name="discount_amount"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    min="0"
                    max={cartSubtotal}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={cart.length === 0}>
                  Complete Sale
                </Button>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
