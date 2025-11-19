import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, useLoaderData, useActionData } from 'react-router';
import { useState } from 'react';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { requireAuth } from '~/lib/auth.server';
import { generateId, now } from '~/lib/db.server';
import { supplierSchema } from '~/lib/validators';
import { formatTimestamp } from '~/lib/utils';
import { Plus, Trash, Users } from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;

  const suppliers = await db
    .prepare(`
      SELECT s.*, COUNT(ps.id) as product_count
      FROM suppliers s
      LEFT JOIN product_suppliers ps ON s.id = ps.supplier_id
      WHERE s.organization_id = ? AND s.deleted_at IS NULL
      GROUP BY s.id
      ORDER BY s.name
    `)
    .bind(orgId)
    .all();

  return { suppliers: suppliers.results || [] };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'create') {
      const data = {
        name: formData.get('name') as string,
        contact_person: formData.get('contact_person') as string || null,
        email: formData.get('email') as string || '',
        phone: formData.get('phone') as string || null,
        address: formData.get('address') as string || null,
        notes: formData.get('notes') as string || null,
      };

      const validated = supplierSchema.parse(data);
      const supplierId = generateId();
      const timestamp = now();

      await db
        .prepare(`
          INSERT INTO suppliers (
            id, organization_id, name, contact_person, email, phone, address, notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          supplierId,
          orgId,
          validated.name,
          data.contact_person,
          data.email || null,
          data.phone,
          data.address,
          data.notes,
          timestamp,
          timestamp
        )
        .run();

      return { success: true, message: 'Supplier created successfully' };
    } else if (intent === 'delete') {
      const id = formData.get('id') as string;
      await db
        .prepare('UPDATE suppliers SET deleted_at = ? WHERE id = ? AND organization_id = ?')
        .bind(now(), id, orgId)
        .run();

      return { success: true, message: 'Supplier deleted successfully' };
    }

    return { error: 'Invalid action' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Operation failed' };
  }
}

export default function Suppliers() {
  const { suppliers } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Suppliers</h1>
            <p className="text-muted-foreground">Manage your suppliers and vendors</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Supplier</DialogTitle>
              </DialogHeader>
              <Form method="post" className="space-y-4" onSubmit={() => setDialogOpen(false)}>
                <input type="hidden" name="intent" value="create" />

                {actionData?.error && (
                  <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                    {actionData.error}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input id="name" name="name" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input id="contact_person" name="contact_person" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" />
                </div>

                <Button type="submit">Create Supplier</Button>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No suppliers found. Click "Add Supplier" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier: any) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact_person || '-'}</TableCell>
                      <TableCell>{supplier.email || '-'}</TableCell>
                      <TableCell>{supplier.phone || '-'}</TableCell>
                      <TableCell>{supplier.product_count}</TableCell>
                      <TableCell>{formatTimestamp(supplier.created_at, 'PP')}</TableCell>
                      <TableCell>
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={supplier.id} />
                          <Button variant="ghost" size="sm" type="submit">
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </Form>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
