import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, useLoaderData, useActionData } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Badge } from '~/components/ui/badge';
import { requireAuth } from '~/lib/auth.server';
import { generateId, now } from '~/lib/db.server';
import { locationSchema } from '~/lib/validators';
import { formatTimestamp } from '~/lib/utils';
import { Plus, MapPin } from 'lucide-react';
import { useState } from 'react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;

  const locations = await db
    .prepare(`
      SELECT l.*, COUNT(s.id) as stock_count
      FROM locations l
      LEFT JOIN stock s ON l.id = s.location_id
      WHERE l.organization_id = ? AND l.deleted_at IS NULL
      GROUP BY l.id
      ORDER BY l.name
    `)
    .bind(orgId)
    .all();

  return { locations: locations.results || [] };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const formData = await request.formData();

  try {
    const data = {
      name: formData.get('name') as string,
      address: formData.get('address') as string || null,
      type: formData.get('type') as string || 'warehouse',
      is_active: true,
    };

    const validated = locationSchema.parse(data);
    const locationId = generateId();
    const timestamp = now();

    await db
      .prepare(`
        INSERT INTO locations (id, organization_id, name, address, type, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(locationId, orgId, validated.name, data.address, validated.type, 1, timestamp, timestamp)
      .run();

    return { success: true, message: 'Location created successfully' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create location' };
  }
}

export default function Locations() {
  const { locations } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Locations</h1>
            <p className="text-muted-foreground">Manage warehouses and store locations</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Location</DialogTitle>
              </DialogHeader>
              <Form method="post" className="space-y-4" onSubmit={() => setDialogOpen(false)}>
                {actionData?.error && (
                  <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                    {actionData.error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Location Name *</Label>
                  <Input id="name" name="name" required placeholder="Main Warehouse" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" placeholder="123 Main St, City, Country" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue="warehouse">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="store">Store</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit">Create Location</Button>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Stock Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No locations found. Click "Add Location" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((location: any) => (
                    <TableRow key={location.id}>
                      <TableCell className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{location.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{location.type}</Badge>
                      </TableCell>
                      <TableCell>{location.address || '-'}</TableCell>
                      <TableCell>{location.stock_count}</TableCell>
                      <TableCell>
                        <Badge variant={location.is_active ? 'default' : 'secondary'}>
                          {location.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTimestamp(location.created_at, 'PP')}</TableCell>
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
