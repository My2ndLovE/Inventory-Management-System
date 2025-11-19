import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, useLoaderData, useActionData } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { requireAuth } from '~/lib/auth.server';
import { generateId, now } from '~/lib/db.server';
import { categorySchema } from '~/lib/validators';
import { formatTimestamp } from '~/lib/utils';
import { Plus, Edit, Trash } from 'lucide-react';
import { useState } from 'react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;

  const categories = await db
    .prepare(`
      SELECT c.*, parent.name as parent_name
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.organization_id = ? AND c.deleted_at IS NULL
      ORDER BY c.name
    `)
    .bind(orgId)
    .all();

  return { categories: categories.results || [] };
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
        description: formData.get('description') as string || null,
      };

      const validated = categorySchema.parse(data);
      const categoryId = generateId();
      const timestamp = now();

      await db
        .prepare(`
          INSERT INTO categories (id, organization_id, name, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(categoryId, orgId, validated.name, data.description, timestamp, timestamp)
        .run();

      return { success: true, message: 'Category created successfully' };
    } else if (intent === 'delete') {
      const id = formData.get('id') as string;
      await db
        .prepare('UPDATE categories SET deleted_at = ? WHERE id = ? AND organization_id = ?')
        .bind(now(), id, orgId)
        .run();

      return { success: true, message: 'Category deleted successfully' };
    }

    return { error: 'Invalid action' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Operation failed' };
  }
}

export default function Categories() {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="text-muted-foreground">Organize your products into categories</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <Form method="post" className="space-y-4" onSubmit={() => setDialogOpen(false)}>
                <input type="hidden" name="intent" value="create" />

                {actionData?.error && (
                  <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                    {actionData.error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input id="name" name="name" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>

                <Button type="submit">Create Category</Button>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No categories found. Click "Add Category" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category: any) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || '-'}</TableCell>
                      <TableCell>{formatTimestamp(category.created_at, 'PP')}</TableCell>
                      <TableCell>
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={category.id} />
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
