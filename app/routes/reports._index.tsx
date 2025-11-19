import { Link } from 'react-router';
import { AppLayout } from '~/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { FileText, Download, TrendingDown, Package, ShoppingCart, ArrowRightLeft } from 'lucide-react';

export default function Reports() {
  const reports = [
    {
      title: 'Stock Report',
      description: 'Complete inventory report with current stock levels and values',
      icon: Package,
      link: '/reports/stock',
      color: 'text-blue-600',
    },
    {
      title: 'Low Stock Report',
      description: 'Products below minimum stock levels requiring reorder',
      icon: TrendingDown,
      link: '/reports/low-stock',
      color: 'text-red-600',
    },
    {
      title: 'Sales Report',
      description: 'Sales transactions with revenue and profit analysis',
      icon: ShoppingCart,
      link: '/reports/sales',
      color: 'text-green-600',
    },
    {
      title: 'Movement Report',
      description: 'Inventory movement history with all transactions',
      icon: ArrowRightLeft,
      link: '/reports/movements',
      color: 'text-purple-600',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and export reports for analysis</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {reports.map(report => (
            <Card key={report.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <report.icon className={`h-8 w-8 ${report.color}`} />
                    <div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription className="mt-1.5">{report.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link to={report.link}>
                  <Button className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    View Report
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Formats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>All reports support multiple export formats:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>CSV</strong> - Compatible with Excel, Google Sheets, and other spreadsheet software</li>
                <li><strong>Excel</strong> - Native Microsoft Excel format with formatting</li>
                <li><strong>PDF</strong> - Print-ready format for documentation and archiving</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
