import { AppLayout } from '~/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Users } from 'lucide-react';

export default function Suppliers() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your suppliers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Supplier Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Supplier management feature coming soon. You'll be able to add and manage your suppliers here.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
