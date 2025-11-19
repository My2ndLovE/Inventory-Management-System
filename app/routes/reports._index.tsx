import { AppLayout } from '~/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { FileText } from 'lucide-react';

export default function Reports() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and view reports</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reports & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Reporting features coming soon. You'll be able to generate stock reports, sales reports, and more.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
